import { mkdir, readFile, readdir, stat, writeFile, realpath } from 'node:fs/promises';
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
const maxRelevantFiles = 30;
const maxHistoryCommits = 50;
const maxExcerptChars = 4000;
const structuralRootFiles = new Set([
  'README.md',
  'docker-compose.yml',
  'docker-compose.yaml',
  'compose.yml',
  'compose.yaml',
  'Dockerfile'
]);
const templateGuideFiles = new Set([
  'docs/README.md',
  'docs/autograde.md',
  'docs/actualitzar-repos-classroom.md',
  'evidence/README.md',
  'tests/README.md'
]);

function parseArgs(argv) {
  const args = {};
  const allowed = new Set([
    '--repo-dir',
    '--repo',
    '--commit',
    '--challenge-id',
    '--microrepte-code',
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

function normalizeToken(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
}

function buildActiveTokens(args) {
  const rawTokens = [
    args['challenge-id'],
    args['microrepte-code']
  ].filter(Boolean);

  return [...new Set(rawTokens.flatMap((token) => [
    String(token).toLowerCase(),
    normalizeToken(token)
  ]).filter(Boolean))];
}

function pathMatchesTokens(filePath, tokens) {
  if (tokens.length === 0) {
    return true;
  }

  const lowerPath = String(filePath).toLowerCase();
  const normalizedPath = normalizeToken(filePath);
  return tokens.some((token) => lowerPath.includes(token) || normalizedPath.includes(token));
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

function normalizeRepoPath(filePath) {
  return String(filePath || '').split(path.sep).join('/').replace(/^\.\//, '').replace(/\/$/, '');
}

function pathIsWithin(candidate, declaredPath) {
  const normalizedCandidate = normalizeRepoPath(candidate);
  const normalizedDeclared = normalizeRepoPath(declaredPath);
  return normalizedCandidate === normalizedDeclared || normalizedCandidate.startsWith(`${normalizedDeclared}/`);
}

async function exists(filePath) {
  return existsSync(filePath);
}

async function collectCommitHistory(repoDir, activeTokens) {
  const output = await git(repoDir, [
    'log',
    `-${maxHistoryCommits}`,
    '--date=iso-strict',
    '--format=%x1e%H%x1f%aI%x1f%cI%x1f%s',
    '--name-only'
  ]);
  const commits = output.split('\x1e').map((record) => record.trim()).filter(Boolean).map((record) => {
    const [header, ...pathLines] = record.split('\n');
    const [sha, authorDate, committerDate, subject] = header.split('\x1f');
    const files = [...new Set(pathLines.map(normalizeRepoPath).filter(Boolean))];
    const searchable = [subject, ...files].join(' ').toLowerCase();
    const normalizedSearchable = normalizeToken(searchable);
    return {
      sha,
      author_date: authorDate,
      committer_date: committerDate,
      subject,
      files,
      active_microrepte_candidate: activeTokens.some((token) => (
        searchable.includes(token) || normalizedSearchable.includes(normalizeToken(token))
      ))
    };
  });
  const activeCommits = commits.filter((commit) => commit.active_microrepte_candidate);
  const timestamps = activeCommits.map((commit) => Date.parse(commit.committer_date)).filter(Number.isFinite).sort((a, b) => a - b);
  const first = timestamps[0] ?? null;
  const last = timestamps.at(-1) ?? null;
  const spanMinutes = first === null ? null : Math.round((last - first) / 60000);
  return {
    commits,
    active_microrepte_candidates: activeCommits,
    temporal_summary: {
      candidate_count: activeCommits.length,
      first_commit_at: first === null ? null : new Date(first).toISOString(),
      last_commit_at: last === null ? null : new Date(last).toISOString(),
      span_minutes: spanMinutes,
      within_three_hours: spanMinutes === null ? null : spanMinutes <= 180,
      interpretation: 'La concentració temporal és un indici, no prova presència física a classe. Les dates Git es poden modificar i s’han de contrastar amb la qualitat dels commits.'
    }
  };
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

async function listFiles(repoDir, dir, maxFiles = maxFilesPerSection) {
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
      } else if (entry.isFile() && !templateGuideFiles.has(path.relative(repoDir, fullPath))) {
        result.push(fullPath);
      }
    }
  }

  await walk(dir);
  return result;
}

function isTextFile(filePath) {
  return structuralRootFiles.has(normalizeRepoPath(filePath))
    || textExtensions.has(path.extname(filePath).toLowerCase());
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

async function fileMatchesActiveTokens(filePath, relativePath, tokens) {
  if (tokens.length === 0 || pathMatchesTokens(relativePath, tokens)) {
    return true;
  }

  if (!await isFile(filePath) || !isTextFile(filePath)) {
    return false;
  }

  const content = await readFile(filePath, 'utf8');
  const lowerContent = content.toLowerCase();
  const normalizedContent = normalizeToken(content);
  return tokens.some((token) => lowerContent.includes(token) || normalizedContent.includes(token));
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

function selectRelevantTrackedFiles(trackedFiles, relevantPaths, changedFiles) {
  const changed = new Set(changedFiles);
  const candidates = trackedFiles.filter((filePath) =>
    structuralRootFiles.has(filePath)
    || relevantPaths.some((relevantPath) => pathIsWithin(filePath, relevantPath))
  );

  return candidates.sort((left, right) => {
    const leftChanged = changed.has(left) ? 0 : 1;
    const rightChanged = changed.has(right) ? 0 : 1;
    if (leftChanged !== rightChanged) return leftChanged - rightChanged;
    const leftRoot = structuralRootFiles.has(left) ? 0 : 1;
    const rightRoot = structuralRootFiles.has(right) ? 0 : 1;
    if (leftRoot !== rightRoot) return leftRoot - rightRoot;
    return left.localeCompare(right);
  });
}

function buildRepositoryManifest(trackedFiles, includedFiles, relevantPaths) {
  const tracked = new Set(trackedFiles);
  const included = new Set(includedFiles);
  const manifestPaths = new Set([
    ...structuralRootFiles,
    ...relevantPaths.map(normalizeRepoPath),
    ...trackedFiles.filter((filePath) => relevantPaths.some((relevantPath) => pathIsWithin(filePath, relevantPath)))
  ]);

  return [...manifestPaths].sort().map((manifestPath) => {
    const matchingFiles = trackedFiles.filter((filePath) => pathIsWithin(filePath, manifestPath));
    const isDirectoryDeclaration = matchingFiles.some((filePath) => filePath !== manifestPath);
    return {
      path: manifestPath,
      present: tracked.has(manifestPath) || matchingFiles.length > 0,
      type: isDirectoryDeclaration ? 'directory' : 'file',
      included: matchingFiles.some((filePath) => included.has(filePath)) || included.has(manifestPath),
      matched_files: isDirectoryDeclaration ? matchingFiles.length : undefined
    };
  });
}

async function summarizeActiveFiles(repoDir, files, tokens) {
  const summaries = [];
  for (const fullPath of files) {
    const relativePath = path.relative(repoDir, fullPath);
    if (!await fileMatchesActiveTokens(fullPath, relativePath, tokens)) {
      continue;
    }

    const summary = await fileSummary(repoDir, relativePath);
    if (summary) {
      summaries.push(summary);
    }
  }
  return summaries;
}

async function activeFileSummary(repoDir, filePath, tokens) {
  const fullPath = resolveInRepo(repoDir, filePath);
  if (!await fileMatchesActiveTokens(fullPath, filePath, tokens)) {
    return null;
  }

  return fileSummary(repoDir, filePath);
}

async function declaredExtensionFiles(repoDir, config, trackedFiles) {
  const declaration = await fileSummary(repoDir, config.declaration_path);
  if (!declaration) return [];
  const candidates = new Set();
  for (const match of declaration.excerpt.matchAll(/\]\(([^)]+)\)|`([^`]+)`/g)) {
    const target = (match[1] || match[2]).split('#')[0];
    candidates.add(path.normalize(target));
    candidates.add(path.normalize(path.join(path.dirname(config.declaration_path), target)));
  }
  const allowed = new Set(trackedFiles.split('\n'));
  const results = [];
  for (const candidate of candidates) {
    if (results.length >= maxFilesPerSection) break;
    if (!allowed.has(candidate) || !/^(src|app|public|routes|views|templates|tests|evidence|docs)\//.test(candidate)) continue;
    // listFiles follows only ordinary directory entries, never repository symlinks.
    const ordinary = await listFiles(repoDir, path.join(repoDir, candidate.split('/')[0]), Infinity);
    const fullPath = path.join(repoDir, candidate);
    if (!ordinary.includes(fullPath)) continue;
    const canonicalRoot = await realpath(repoDir);
    if (!(await realpath(fullPath)).startsWith(canonicalRoot + path.sep)) continue;
    const summary = await fileSummary(repoDir, candidate);
    if (summary) results.push(summary);
  }
  return results;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  requireArgs(args);

  const repoDir = path.resolve(args['repo-dir']);
  const repoSignalsPath = path.resolve(args['repo-signals']);
  const evidenceSummaryPath = path.resolve(args['evidence-summary']);
  const activeTokens = buildActiveTokens(args);
  let extensionConfig = null;
  let challengeConfig = null;
  if (args['challenge-id']) {
    try {
      challengeConfig = JSON.parse(await readFile(path.join(process.cwd(), 'microreptes', args['challenge-id'], 'challenge.json'), 'utf8'));
      extensionConfig = challengeConfig.repte_extension;
    } catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  const trackedFilesOutput = await git(repoDir, ['ls-files']);
  const trackedFiles = trackedFilesOutput ? trackedFilesOutput.split('\n').map(normalizeRepoPath) : [];
  const trackedFilesCount = trackedFiles.length;
  let changedFilesOutput = '';
  try {
    changedFilesOutput = await git(repoDir, ['show', '--pretty=format:', '--name-only', args.commit, '--']);
  } catch {
    // Some local/test callers use a descriptive commit label instead of a Git revision.
  }
  const changedFiles = changedFilesOutput ? [...new Set(changedFilesOutput.split('\n').filter(Boolean).map(normalizeRepoPath))] : [];
  const relevantPaths = [...new Set((challengeConfig?.relevant_paths || []).map(normalizeRepoPath).filter(Boolean))];
  const relevantTrackedFiles = selectRelevantTrackedFiles(trackedFiles, relevantPaths, changedFiles);
  const includedRelevantFiles = relevantTrackedFiles
    .filter((filePath) => isTextFile(filePath))
    .slice(0, maxRelevantFiles);
  const commitHistory = await collectCommitHistory(repoDir, activeTokens);

  const signals = {
    generated_at: new Date().toISOString(),
    repository: args.repo,
    commit: args.commit,
    files: {
      readme: await exists(resolveInRepo(repoDir, 'README.md')),
      template_guide: await exists(resolveInRepo(repoDir, 'ENTREGA.md')),
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
    evidence_scope: {
      challenge_id: args['challenge-id'] || null,
      microrepte_code: args['microrepte-code'] || null,
      active_tokens: activeTokens,
      rule: 'Els fitxers de docs, evidence, tests i src nomes es consideren evidencia directa si el path o el contingut referencia el microrepte actiu.',
      delivery_contract: [
        'README.md de l_arrel es la fitxa de l_entrega actual i pot sobreescriure el microrepte anterior.',
        'docs/README.md, evidence/README.md i tests/README.md son guies de carpeta, no evidencia puntuable.',
        'Els fitxers del microrepte han d_estar nomenats o enllacats amb el challenge_id o microrepte_code actiu.',
        'Els tests han de ser executables o, si encara no toca automatitzar, proves manuals reproduibles amb passos, dades i resultat esperat.'
      ]
    },
    repository_manifest: buildRepositoryManifest(trackedFiles, includedRelevantFiles, relevantPaths),
    commit_evidence: {
      sha: args.commit,
      changed_files: changedFiles,
      relevant_changed_files: changedFiles.filter((filePath) => relevantTrackedFiles.includes(filePath)),
      history: commitHistory.commits,
      active_microrepte_candidates: commitHistory.active_microrepte_candidates,
      temporal_summary: commitHistory.temporal_summary
    },
    relevant_files: await summarizeFiles(repoDir, includedRelevantFiles.map((filePath) => resolveInRepo(repoDir, filePath))),
    repte_extension: extensionConfig ? {
      declaration: await fileSummary(repoDir, extensionConfig.declaration_path),
      referenced_files: await declaredExtensionFiles(repoDir, extensionConfig, trackedFilesOutput),
      files: await summarizeActiveFiles(repoDir, [...await listFiles(repoDir, resolveInRepo(repoDir, 'docs'), Infinity), ...await listFiles(repoDir, resolveInRepo(repoDir, 'evidence'), Infinity), ...await listFiles(repoDir, resolveInRepo(repoDir, 'tests'), Infinity), ...await listFiles(repoDir, resolveInRepo(repoDir, 'src'), Infinity)], [args['microrepte-code']?.split('M')[0].toLowerCase() || args['challenge-id'].split('-')[0], 'ampliacio', 'ampliació'])
    } : null,
    readme: await fileSummary(repoDir, 'README.md'),
    template_guide: await fileSummary(repoDir, 'ENTREGA.md'),
    ai_log: await activeFileSummary(repoDir, 'docs/ai-log.md', activeTokens),
    docs_files: await summarizeActiveFiles(repoDir, await listFiles(repoDir, resolveInRepo(repoDir, 'docs'), Number.POSITIVE_INFINITY), activeTokens),
    evidence_files: await summarizeActiveFiles(repoDir, await listFiles(repoDir, resolveInRepo(repoDir, 'evidence'), Number.POSITIVE_INFINITY), activeTokens),
    test_files: await summarizeActiveFiles(repoDir, await listFiles(repoDir, resolveInRepo(repoDir, 'tests'), Number.POSITIVE_INFINITY), activeTokens),
    source_files: await summarizeActiveFiles(repoDir, await listFiles(repoDir, resolveInRepo(repoDir, 'src'), Number.POSITIVE_INFINITY), activeTokens)
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
