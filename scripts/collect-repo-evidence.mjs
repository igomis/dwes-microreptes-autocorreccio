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
  '.java',
  '.xml',
  '.gradle',
  '.kts',
  '.properties',
  '.sh'
]);
const maxFilesPerSection = 12;
const maxRelevantFiles = 50;
const maxVisualEvidence = 5;
const maxVisualEvidenceBytes = 4 * 1024 * 1024;
const maxHistoryCommits = 50;
const maxExcerptChars = 8000;
const maxDetectedProjectRoots = 5;
const projectRootLabels = new Set([
  'directoridelprojecte',
  'directoridelproyecto',
  'projectdirectory'
]);
const strongProjectMarkers = new Set([
  'artisan',
  'manage.py',
  'nest-cli.json',
  'symfony.lock',
  'gradlew',
  'gradlew.bat'
]);
const fallbackProjectMarkers = new Set([
  'composer.json',
  'package.json',
  'pom.xml',
  'build.gradle',
  'build.gradle.kts',
  'settings.gradle',
  'settings.gradle.kts'
]);
const frameworkRelevantFileNames = new Set([
  'views.py',
  'urls.py',
  'models.py',
  'forms.py',
  'tests.py',
  'settings.py',
  'web.php',
  'api.php',
  'phpunit.xml',
  'phpunit.xml.dist',
  '.env.example'
]);
const ignoredProjectSegments = new Set([
  '.git',
  'autograde',
  'node_modules',
  'vendor'
]);
const structuralRootFiles = new Set([
  'README.md',
  'docker-compose.yml',
  'docker-compose.yaml',
  'compose.yml',
  'compose.yaml',
  'Dockerfile',
  'pom.xml',
  'build.gradle',
  'build.gradle.kts',
  'settings.gradle',
  'settings.gradle.kts',
  'gradlew',
  'gradlew.bat'
]);
const templateGuideFiles = new Set([
  'docs/README.md',
  'docs/autograde.md',
  'docs/actualitzar-repos-classroom.md',
  'evidence/README.md',
  'tests/README.md'
]);
const currentAiLogPath = 'docs/ai-log.md';
const historicAiLogPath = 'docs/historic-ai-log.md';

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

function normalizeProjectRootValue(value) {
  let candidate = String(value || '').trim();
  candidate = candidate.replace(/^\*\*(.*?)\*\*$/, '$1').replace(/^`+(.*?)`+$/, '$1').trim();
  if (!candidate || /^[a-z][a-z0-9+.-]*:/i.test(candidate) || candidate.startsWith('/')) {
    return null;
  }
  if (candidate === '.' || candidate === './') {
    return '';
  }

  const normalized = normalizeRepoPath(path.posix.normalize(candidate));
  if (!normalized || normalized === '..' || normalized.startsWith('../') || normalized.includes('/../')) {
    return null;
  }
  return normalized;
}

function declaredProjectRoot(readmeContent) {
  for (const line of String(readmeContent || '').split('\n')) {
    const tableRow = line.match(/^\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*$/);
    if (tableRow && projectRootLabels.has(normalizeToken(tableRow[1]))) {
      return { raw: tableRow[2].trim(), root: normalizeProjectRootValue(tableRow[2]) };
    }

    const labelledLine = line.match(/^\s*(?:[-*]\s*)?(?:\*\*)?([^:*]+?)(?:\*\*)?\s*:\s*(.+?)\s*$/);
    if (labelledLine && projectRootLabels.has(normalizeToken(labelledLine[1]))) {
      return { raw: labelledLine[2].trim(), root: normalizeProjectRootValue(labelledLine[2]) };
    }
  }
  return null;
}

function rootContainsTrackedFiles(root, trackedFiles) {
  if (root === '') return trackedFiles.length > 0;
  return trackedFiles.some((filePath) => filePath === root || filePath.startsWith(`${root}/`));
}

function rootsFromMarkers(trackedFiles, markers) {
  const roots = new Set();
  for (const filePath of trackedFiles) {
    const parts = normalizeRepoPath(filePath).split('/');
    const basename = parts.at(-1);
    const rootParts = parts.slice(0, -1);
    if (!markers.has(basename) || rootParts.length > 2 || rootParts.some((part) => ['vendor', 'node_modules'].includes(part))) {
      continue;
    }
    roots.add(rootParts.join('/'));
    if (roots.size >= maxDetectedProjectRoots) break;
  }
  return [...roots];
}

function resolveProjectRoots(readmeContent, trackedFiles) {
  const declaration = declaredProjectRoot(readmeContent);
  const declaredRootIsValid = declaration?.root !== null
    && declaration?.root !== undefined
    && rootContainsTrackedFiles(declaration.root, trackedFiles);
  const strongRoots = rootsFromMarkers(trackedFiles, strongProjectMarkers);
  const autodetected = strongRoots.length > 0
    ? strongRoots
    : rootsFromMarkers(trackedFiles, fallbackProjectMarkers);
  const effective = declaredRootIsValid
    ? [declaration.root]
    : autodetected.length > 0 ? autodetected : [''];

  return {
    declared: declaration?.raw || null,
    declared_normalized: declaredRootIsValid ? (declaration.root || '.') : null,
    declaration_valid: declaration === null ? null : declaredRootIsValid,
    autodetected: autodetected.map((root) => root || '.'),
    effective: effective.map((root) => root || '.'),
    source: declaredRootIsValid ? 'readme' : autodetected.length > 0 ? 'framework_marker' : 'repository_root'
  };
}

function expandRelevantPaths(relevantPaths, projectRoots) {
  const expanded = new Set(relevantPaths);
  for (const displayRoot of projectRoots.effective) {
    const root = displayRoot === '.' ? '' : displayRoot;
    if (!root) continue;
    for (const relevantPath of relevantPaths) {
      expanded.add(normalizeRepoPath(path.posix.join(root, relevantPath)));
    }
  }
  return [...expanded];
}

function projectStructuralFiles(trackedFiles, projectRoots) {
  const markerNames = new Set([...strongProjectMarkers, ...fallbackProjectMarkers]);
  const roots = new Set(projectRoots.effective.map((root) => root === '.' ? '' : root));
  return trackedFiles.filter((filePath) => {
    const normalized = normalizeRepoPath(filePath);
    const dirname = path.posix.dirname(normalized) === '.' ? '' : path.posix.dirname(normalized);
    return roots.has(dirname) && markerNames.has(path.posix.basename(normalized));
  });
}

function relativeToProjectRoot(filePath, projectRoots) {
  const normalized = normalizeRepoPath(filePath);
  for (const displayRoot of projectRoots.effective) {
    const root = displayRoot === '.' ? '' : displayRoot;
    if (!root) return normalized;
    if (normalized === root) return '';
    if (normalized.startsWith(`${root}/`)) return normalized.slice(root.length + 1);
  }
  return null;
}

function matchesProjectLayout(filePath, configuredRelevantPaths, projectRoots, changedFiles) {
  const relative = relativeToProjectRoot(filePath, projectRoots);
  if (relative === null || !isTextFile(filePath)) return false;
  const segments = relative.split('/');
  if (segments.some((segment) => ignoredProjectSegments.has(segment))) return false;
  if (changedFiles.has(filePath)) return true;
  if (configuredRelevantPaths.some((relevantPath) => pathIsWithin(relative, relevantPath))) return true;

  const relevantSegments = new Set(configuredRelevantPaths.map((item) => item.split('/')[0]));
  if (segments.some((segment) => relevantSegments.has(segment))) return true;
  if (relative.startsWith('resources/views/')) return true;
  return frameworkRelevantFileNames.has(path.posix.basename(relative));
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
    || strongProjectMarkers.has(path.posix.basename(normalizeRepoPath(filePath)))
    || fallbackProjectMarkers.has(path.posix.basename(normalizeRepoPath(filePath)))
    || textExtensions.has(path.extname(filePath).toLowerCase());
}

function collectEvidenceTerms(...sources) {
  const text = sources.map((source) => (
    typeof source === 'string' ? source : JSON.stringify(source || {})
  )).join('\n');
  const terms = new Set();

  for (const match of text.matchAll(/`([^`\n]{2,80})`/g)) {
    const term = match[1].trim().replace(/\(\)$/, '');
    if (term.length >= 2) terms.add(term);
  }

  return [...terms].sort((left, right) => right.length - left.length || left.localeCompare(right));
}

function focusedExcerpt(content, terms) {
  if (content.length <= maxExcerptChars) return content;

  const maxSections = 10;
  const sectionChars = 700;
  const halfSection = Math.floor(sectionChars / 2);
  const centers = [];
  const addCenter = (center) => {
    const bounded = Math.max(0, Math.min(content.length, center));
    if (centers.length >= maxSections || centers.some((current) => Math.abs(current - bounded) < halfSection)) return;
    centers.push(bounded);
  };

  addCenter(halfSection);
  addCenter(content.length - halfSection);
  const lowerContent = content.toLowerCase();
  for (const term of terms) {
    if (centers.length >= maxSections) break;
    const lowerTerm = term.toLowerCase();
    const first = lowerContent.indexOf(lowerTerm);
    if (first < 0) continue;
    addCenter(first + Math.floor(term.length / 2));
    const last = lowerContent.lastIndexOf(lowerTerm);
    if (last !== first) addCenter(last + Math.floor(term.length / 2));
  }

  for (let index = 1; centers.length < maxSections && index < maxSections - 1; index += 1) {
    addCenter(Math.floor((content.length * index) / (maxSections - 1)));
  }

  const intervals = centers
    .map((center) => [Math.max(0, center - halfSection), Math.min(content.length, center + halfSection)])
    .sort((left, right) => left[0] - right[0]);
  const merged = [];
  for (const interval of intervals) {
    const previous = merged.at(-1);
    if (previous && interval[0] <= previous[1]) {
      previous[1] = Math.max(previous[1], interval[1]);
    } else {
      merged.push(interval);
    }
  }

  return merged.map(([start, end]) => (
    `...[fragment ${start}-${end} de ${content.length}]\n${content.slice(start, end)}`
  )).join('\n...[fragment intermedi retallat]\n');
}

async function safeExcerpt(filePath, evidenceTerms = []) {
  if (!await isFile(filePath) || !isTextFile(filePath)) {
    return null;
  }

  const content = await readFile(filePath, 'utf8');
  return focusedExcerpt(content, evidenceTerms);
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

async function fileSummary(repoDir, filePath, evidenceTerms = []) {
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
    excerpt: await safeExcerpt(fullPath, evidenceTerms)
  };
}

async function summarizeFiles(repoDir, files, evidenceTerms = []) {
  const summaries = [];
  for (const fullPath of files) {
    const relativePath = path.relative(repoDir, fullPath);
    const summary = await fileSummary(repoDir, relativePath, evidenceTerms);
    if (summary) {
      summaries.push(summary);
    }
  }
  return summaries;
}

function selectRelevantTrackedFiles(
  trackedFiles,
  relevantPaths,
  changedFiles,
  projectFiles = [],
  configuredRelevantPaths = [],
  projectRoots = { effective: ['.'] }
) {
  const changed = new Set(changedFiles);
  const structural = new Set([...structuralRootFiles, ...projectFiles]);
  const candidates = trackedFiles.filter((filePath) =>
    structural.has(filePath)
    || relevantPaths.some((relevantPath) => pathIsWithin(filePath, relevantPath))
    || matchesProjectLayout(filePath, configuredRelevantPaths, projectRoots, changed)
  );

  return candidates.sort((left, right) => {
    const leftChanged = changed.has(left) ? 0 : 1;
    const rightChanged = changed.has(right) ? 0 : 1;
    if (leftChanged !== rightChanged) return leftChanged - rightChanged;
    const leftRoot = structural.has(left) ? 0 : 1;
    const rightRoot = structural.has(right) ? 0 : 1;
    if (leftRoot !== rightRoot) return leftRoot - rightRoot;
    return left.localeCompare(right);
  });
}

function buildRepositoryManifest(trackedFiles, includedFiles, relevantPaths, projectFiles = []) {
  const tracked = new Set(trackedFiles);
  const included = new Set(includedFiles);
  const manifestPaths = new Set([
    ...structuralRootFiles,
    ...projectFiles,
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

async function summarizeActiveFiles(repoDir, files, tokens, evidenceTerms = []) {
  const summaries = [];
  for (const fullPath of files) {
    const relativePath = path.relative(repoDir, fullPath);
    if (!await fileMatchesActiveTokens(fullPath, relativePath, tokens)) {
      continue;
    }

    const summary = await fileSummary(repoDir, relativePath, evidenceTerms);
    if (summary) {
      summaries.push(summary);
    }
  }
  return summaries;
}

function excerptAroundTokens(content, tokens) {
  const lowerContent = content.toLowerCase();
  const normalizedContent = normalizeToken(content);
  const index = tokens
    .map((token) => lowerContent.indexOf(token))
    .find((match) => match >= 0);
  const normalizedIndex = index === undefined
    ? tokens.map((token) => normalizedContent.indexOf(token)).find((match) => match >= 0)
    : index;

  if (normalizedIndex === undefined || normalizedIndex < 0 || content.length <= maxExcerptChars) {
    return content.length > maxExcerptChars
      ? `${content.slice(0, maxExcerptChars)}\n...[retallat]`
      : content;
  }

  const start = Math.max(0, normalizedIndex - Math.floor(maxExcerptChars / 4));
  const end = Math.min(content.length, start + maxExcerptChars);
  return `${start > 0 ? '...[inici retallat]\n' : ''}${content.slice(start, end)}${end < content.length ? '\n...[final retallat]' : ''}`;
}

async function activeFileSummary(repoDir, filePath, tokens) {
  const fullPath = resolveInRepo(repoDir, filePath);
  if (!await fileMatchesActiveTokens(fullPath, filePath, tokens)) {
    return null;
  }

  const summary = await fileSummary(repoDir, filePath);
  if (!summary?.excerpt || tokens.length === 0) return summary;
  const content = await readFile(fullPath, 'utf8');
  return { ...summary, excerpt: excerptAroundTokens(content, tokens) };
}

function readmeLinkTargets(readmeContent) {
  const targets = new Set();
  for (const match of readmeContent.matchAll(/\[[^\]]*\]\(([^)\s]+)(?:\s+[^)]*)?\)/g)) {
    const target = match[1].split('#')[0];
    if (target && !/^[a-z][a-z0-9+.-]*:/i.test(target) && !target.startsWith('/')) {
      targets.add(normalizeRepoPath(path.posix.normalize(target)));
    }
  }
  return [...targets].filter((target) => target && target !== '.');
}

async function readmeReferencedFiles(repoDir, trackedFiles) {
  const readmePath = resolveInRepo(repoDir, 'README.md');
  if (!await isFile(readmePath)) {
    return [];
  }

  const tracked = new Set(trackedFiles);
  const canonicalRoot = await realpath(repoDir);
  const targets = readmeLinkTargets(await readFile(readmePath, 'utf8'));
  const files = [];
  for (const target of targets) {
    if (!tracked.has(target) || !isTextFile(target)) {
      continue;
    }

    const fullPath = resolveInRepo(repoDir, target);
    if (!await isFile(fullPath) || !(await realpath(fullPath)).startsWith(`${canonicalRoot}${path.sep}`)) {
      continue;
    }
    files.push(target);
  }
  return files;
}

async function activePngEvidence(repoDir, trackedFiles, readmeReferencedPaths, tokens) {
  const tracked = new Set(trackedFiles);
  const linked = new Set(readmeReferencedPaths);
  const evidenceRoot = resolveInRepo(repoDir, 'evidence');
  const files = await listFiles(repoDir, evidenceRoot, Number.POSITIVE_INFINITY);
  const summaries = [];

  for (const fullPath of files) {
    if (summaries.length >= maxVisualEvidence) break;
    const relativePath = normalizeRepoPath(path.relative(repoDir, fullPath));
    if (!tracked.has(relativePath) || path.extname(relativePath).toLowerCase() !== '.png') continue;
    if (!linked.has(relativePath) && !pathMatchesTokens(relativePath, tokens)) continue;

    const contents = await readFile(fullPath);
    if (contents.length > maxVisualEvidenceBytes || contents.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a') continue;
    summaries.push({
      path: relativePath,
      bytes: contents.length,
      mime_type: 'image/png',
      data_url: `data:image/png;base64,${contents.toString('base64')}`
    });
  }

  return summaries;
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
  let challengePrompt = '';
  let challengeRubric = null;
  if (args['challenge-id']) {
    try {
      const challengeDir = path.join(process.cwd(), 'microreptes', args['challenge-id']);
      challengeConfig = JSON.parse(await readFile(path.join(challengeDir, 'challenge.json'), 'utf8'));
      challengePrompt = await readFile(path.join(challengeDir, 'prompt.md'), 'utf8');
      challengeRubric = JSON.parse(await readFile(path.join(challengeDir, 'rubric.json'), 'utf8'));
      extensionConfig = challengeConfig.repte_extension;
    } catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  const evidenceTerms = collectEvidenceTerms(challengeConfig, challengePrompt, challengeRubric);
  const trackedFilesOutput = await git(repoDir, ['ls-files']);
  const trackedFiles = trackedFilesOutput ? trackedFilesOutput.split('\n').map(normalizeRepoPath) : [];
  const trackedFilesCount = trackedFiles.length;
  const readmeContent = await isFile(resolveInRepo(repoDir, 'README.md'))
    ? await readFile(resolveInRepo(repoDir, 'README.md'), 'utf8')
    : '';
  const projectRoots = resolveProjectRoots(readmeContent, trackedFiles);
  let changedFilesOutput = '';
  try {
    changedFilesOutput = await git(repoDir, ['show', '--pretty=format:', '--name-only', args.commit, '--']);
  } catch {
    // Some local/test callers use a descriptive commit label instead of a Git revision.
  }
  const changedFiles = changedFilesOutput ? [...new Set(changedFilesOutput.split('\n').filter(Boolean).map(normalizeRepoPath))] : [];
  const configuredRelevantPaths = [...new Set((challengeConfig?.relevant_paths || []).map(normalizeRepoPath).filter(Boolean))];
  const relevantPaths = expandRelevantPaths(configuredRelevantPaths, projectRoots);
  const nestedStructuralFiles = projectStructuralFiles(trackedFiles, projectRoots);
  const commitHistory = await collectCommitHistory(repoDir, activeTokens);
  const activeChangedFiles = [...new Set(commitHistory.active_microrepte_candidates.flatMap((commit) => commit.files))];
  const priorityChangedFiles = [...new Set([...changedFiles, ...activeChangedFiles])];
  const relevantTrackedFiles = selectRelevantTrackedFiles(
    trackedFiles,
    relevantPaths,
    priorityChangedFiles,
    nestedStructuralFiles,
    configuredRelevantPaths,
    projectRoots
  );
  const readmeReferencedPaths = await readmeReferencedFiles(repoDir, trackedFiles);
  const readmeTargets = readmeLinkTargets(readmeContent);
  const includedRelevantFiles = [...new Set([
    // The README is the delivery contract: its linked code, tests and text
    // evidence must survive the global cap.
    ...readmeReferencedPaths,
    ...relevantTrackedFiles.filter((filePath) => isTextFile(filePath))
  ])]
    .filter((filePath) => isTextFile(filePath))
    .slice(0, maxRelevantFiles);

  const signals = {
    generated_at: new Date().toISOString(),
    repository: args.repo,
    commit: args.commit,
    files: {
      readme: await exists(resolveInRepo(repoDir, 'README.md')),
      template_guide: await exists(resolveInRepo(repoDir, 'ENTREGA.md')),
      ai_log: await exists(resolveInRepo(repoDir, currentAiLogPath)),
      historic_ai_log: await exists(resolveInRepo(repoDir, historicAiLogPath)),
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
    },
    project_roots: projectRoots
  };

  const summary = {
    generated_at: new Date().toISOString(),
    evidence_scope: {
      challenge_id: args['challenge-id'] || null,
      microrepte_code: args['microrepte-code'] || null,
      active_tokens: activeTokens,
      project_roots: projectRoots,
      rule: 'Els fitxers de docs, evidence, tests i src nomes es consideren evidencia directa si el path o el contingut referencia el microrepte actiu. Els fitxers de text enllacats localment des del README.md arrel s_inclouen sempre com a evidencia declarada.',
      delivery_contract: [
        'README.md de l_arrel es la fitxa de l_entrega actual i pot sobreescriure el microrepte anterior.',
        'Si el projecte executable viu en una subcarpeta, README.md pot declarar una sola fila Directori del projecte; el recollidor expandix automaticament els camins rellevants dins d_eixa arrel.',
        'docs/README.md, evidence/README.md i tests/README.md son guies de carpeta, no evidencia puntuable.',
        'Els fitxers del microrepte han d_estar nomenats o enllacats amb el challenge_id o microrepte_code actiu.',
        'Els tests han de ser executables o, si encara no toca automatitzar, proves manuals reproduibles amb passos, dades i resultat esperat.',
        'Els fitxers llargs es presenten en fragments focals. L_absencia d_un element en un fragment retallat no demostra que falte al repositori.'
      ]
    },
    repository_manifest: buildRepositoryManifest(trackedFiles, includedRelevantFiles, relevantPaths, nestedStructuralFiles),
    commit_evidence: {
      sha: args.commit,
      changed_files: changedFiles,
      relevant_changed_files: changedFiles.filter((filePath) => relevantTrackedFiles.includes(filePath)),
      active_microrepte_changed_files: activeChangedFiles,
      history: commitHistory.commits,
      active_microrepte_candidates: commitHistory.active_microrepte_candidates,
      temporal_summary: commitHistory.temporal_summary
    },
    relevant_files: await summarizeFiles(repoDir, includedRelevantFiles.map((filePath) => resolveInRepo(repoDir, filePath)), evidenceTerms),
    readme_referenced_files: await summarizeFiles(repoDir, readmeReferencedPaths.map((filePath) => resolveInRepo(repoDir, filePath)), evidenceTerms),
    image_evidence: await activePngEvidence(repoDir, trackedFiles, readmeTargets, activeTokens),
    repte_extension: extensionConfig ? {
      declaration: await fileSummary(repoDir, extensionConfig.declaration_path),
      referenced_files: await declaredExtensionFiles(repoDir, extensionConfig, trackedFilesOutput),
      files: await summarizeActiveFiles(repoDir, [...await listFiles(repoDir, resolveInRepo(repoDir, 'docs'), Infinity), ...await listFiles(repoDir, resolveInRepo(repoDir, 'evidence'), Infinity), ...await listFiles(repoDir, resolveInRepo(repoDir, 'tests'), Infinity), ...await listFiles(repoDir, resolveInRepo(repoDir, 'src'), Infinity)], [args['microrepte-code']?.split('M')[0].toLowerCase() || args['challenge-id'].split('-')[0], 'ampliacio', 'ampliació'])
    } : null,
    readme: await fileSummary(repoDir, 'README.md', evidenceTerms),
    template_guide: await fileSummary(repoDir, 'ENTREGA.md'),
    // ai-log.md is the current microrepte log. The historic log is retained
    // separately as context and never substitutes the current evidence.
    ai_log: await activeFileSummary(repoDir, currentAiLogPath, activeTokens),
    historic_ai_log: await fileSummary(repoDir, historicAiLogPath),
    docs_files: await summarizeActiveFiles(repoDir, await listFiles(repoDir, resolveInRepo(repoDir, 'docs'), Number.POSITIVE_INFINITY), activeTokens, evidenceTerms),
    evidence_files: await summarizeActiveFiles(repoDir, await listFiles(repoDir, resolveInRepo(repoDir, 'evidence'), Number.POSITIVE_INFINITY), activeTokens, evidenceTerms),
    test_files: await summarizeActiveFiles(repoDir, await listFiles(repoDir, resolveInRepo(repoDir, 'tests'), Number.POSITIVE_INFINITY), activeTokens, evidenceTerms),
    source_files: await summarizeActiveFiles(repoDir, await listFiles(repoDir, resolveInRepo(repoDir, 'src'), Number.POSITIVE_INFINITY), activeTokens, evidenceTerms)
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
