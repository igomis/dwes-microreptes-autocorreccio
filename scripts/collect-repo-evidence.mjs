import { mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const textExtensions = new Set([
  '.md',
  '.txt',
  '.json',
  '.yml',
  '.yaml',
  '.php',
  '.js',
  '.ts',
  '.html',
  '.css',
  '.py',
  '.sh'
]);
const maxFilesPerSection = 12;
const maxExcerptChars = 4000;

function parseArgs(argv) {
  const args = {};
  const allowed = new Set([
    '--repo-dir',
    '--repo',
    '--commit',
    '--repo-signals',
    '--evidence-summary'
  ]);

  for (let index = 0; index < argv.length; index += 1) {
    const key = argv[index];
    const value = argv[index + 1];

    if (allowed.has(key) && value && !value.startsWith('--')) {
      args[key.slice(2)] = value;
      index += 1;
    }
  }

  return args;
}

function requireArgs(args) {
  const missing = ['repo-dir', 'repo', 'commit', 'repo-signals', 'evidence-summary'].filter((key) => !args[key]);
  if (missing.length > 0) {
    throw new Error(`Falten arguments obligatoris: ${missing.map((key) => `--${key}`).join(', ')}`);
  }
}

function resolveInRepo(repoDir, filePath) {
  return path.join(repoDir, filePath);
}

async function exists(filePath) {
  return existsSync(filePath);
}

async function isDirectory(filePath) {
  try {
    return (await stat(filePath)).isDirectory();
  } catch (error) {
    if (error.code === 'ENOENT') {
      return false;
    }
    throw error;
  }
}

async function isFile(filePath) {
  try {
    return (await stat(filePath)).isFile();
  } catch (error) {
    if (error.code === 'ENOENT') {
      return false;
    }
    throw error;
  }
}

async function git(repoDir, args) {
  const { stdout } = await execFileAsync('git', args, { cwd: repoDir });
  return stdout.trim();
}

async function countFiles(dir) {
  if (!await isDirectory(dir)) {
    return 0;
  }

  let total = 0;
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === '.git') {
      continue;
    }

    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      total += await countFiles(fullPath);
    } else if (entry.isFile()) {
      total += 1;
    }
  }

  return total;
}

async function listFiles(dir, maxFiles = maxFilesPerSection) {
  if (!await isDirectory(dir)) {
    return [];
  }

  const result = [];

  async function walk(current) {
    if (result.length >= maxFiles) {
      return;
    }

    const entries = await readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      if (result.length >= maxFiles) {
        return;
      }

      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath);
      } else if (entry.isFile()) {
        result.push(fullPath);
      }
    }
  }

  await walk(dir);
  return result;
}

function isTextFile(filePath) {
  return textExtensions.has(path.extname(filePath).toLowerCase());
}

async function safeExcerpt(filePath) {
  if (!await isFile(filePath) || !isTextFile(filePath)) {
    return null;
  }

  const content = await readFile(filePath, 'utf8');
  return content.length > maxExcerptChars
    ? `${content.slice(0, maxExcerptChars)}\n...[retallat]`
    : content;
}

async function fileSummary(repoDir, filePath) {
  const fullPath = resolveInRepo(repoDir, filePath);
  if (!await isFile(fullPath)) {
    return null;
  }

  const fileStat = await stat(fullPath);
  const content = isTextFile(fullPath) ? await readFile(fullPath, 'utf8') : '';
  return {
    path: filePath,
    bytes: fileStat.size,
    lines: content.length === 0 ? 0 : content.split('\n').length,
    excerpt: await safeExcerpt(fullPath)
  };
}

async function summarizeFiles(repoDir, files) {
  const summaries = [];
  for (const fullPath of files) {
    const relativePath = path.relative(repoDir, fullPath);
    const summary = await fileSummary(repoDir, relativePath);
    if (summary) {
      summaries.push(summary);
    }
  }
  return summaries;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  requireArgs(args);

  const repoDir = path.resolve(args['repo-dir']);
  const repoSignalsPath = path.resolve(args['repo-signals']);
  const evidenceSummaryPath = path.resolve(args['evidence-summary']);
  const trackedFiles = await git(repoDir, ['ls-files']);
  const trackedFilesCount = trackedFiles ? trackedFiles.split('\n').length : 0;

  const signals = {
    generated_at: new Date().toISOString(),
    repository: args.repo,
    commit: args.commit,
    files: {
      readme: await exists(resolveInRepo(repoDir, 'README.md')),
      ai_log: await exists(resolveInRepo(repoDir, 'docs/ai-log.md')),
      student_meta: await exists(resolveInRepo(repoDir, 'student-meta.json'))
    },
    folders: {
      src: await isDirectory(resolveInRepo(repoDir, 'src')),
      tests: await isDirectory(resolveInRepo(repoDir, 'tests')),
      evidence: await isDirectory(resolveInRepo(repoDir, 'evidence')),
      docs: await isDirectory(resolveInRepo(repoDir, 'docs'))
    },
    counts: {
      tracked_files: trackedFilesCount,
      src_files: await countFiles(resolveInRepo(repoDir, 'src')),
      test_files: await countFiles(resolveInRepo(repoDir, 'tests')),
      evidence_files: await countFiles(resolveInRepo(repoDir, 'evidence')),
      docs_files: await countFiles(resolveInRepo(repoDir, 'docs'))
    }
  };

  const summary = {
    generated_at: new Date().toISOString(),
    readme: await fileSummary(repoDir, 'README.md'),
    ai_log: await fileSummary(repoDir, 'docs/ai-log.md'),
    docs_files: await summarizeFiles(repoDir, await listFiles(resolveInRepo(repoDir, 'docs'))),
    evidence_files: await summarizeFiles(repoDir, await listFiles(resolveInRepo(repoDir, 'evidence'))),
    test_files: await summarizeFiles(repoDir, await listFiles(resolveInRepo(repoDir, 'tests'))),
    source_files: await summarizeFiles(repoDir, await listFiles(resolveInRepo(repoDir, 'src')))
  };

  await mkdir(path.dirname(repoSignalsPath), { recursive: true });
  await mkdir(path.dirname(evidenceSummaryPath), { recursive: true });
  await writeFile(repoSignalsPath, `${JSON.stringify(signals, null, 2)}\n`, 'utf8');
  await writeFile(evidenceSummaryPath, `${JSON.stringify(summary, null, 2)}\n`, 'utf8');
}

main().catch((error) => {
  console.error(`No s'han pogut recollir evidències del repositori: ${error.message}`);
  process.exit(1);
});
