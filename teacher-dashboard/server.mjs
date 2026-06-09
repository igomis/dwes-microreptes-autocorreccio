import { createServer } from 'node:http';
import { execFile } from 'node:child_process';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import {
  initDb,
  getDb,
  closeDb,
  upsertStudent,
  updateStudent,
  deleteStudent,
  getStudents,
  upsertChallenge,
  getChallenges,
  getLatestGrades,
  getGradeById,
  getStudentGrades,
  getStatistics,
  migrateFromJson
} from './db.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const execFileAsync = promisify(execFile);
const workflowFile = 'batch-autograde-students.yml';
const defaultPort = 4173;
const groupFiles = {
  all: 'course/student-repositories.txt',
  '2DAW-A': 'course/student-repositories-2dawa.txt',
  '2DAW-B': 'course/student-repositories-2dawb.txt',
  '2DAW-C': 'course/student-repositories-2dawc.txt',
  '2DAW-D': 'course/student-repositories-2dawd.txt'
};

function loadDotEnv() {
  const envPath = path.join(rootDir, '.env');
  if (!existsSync(envPath)) {
    return;
  }

  return readFile(envPath, 'utf8')
    .then((content) => {
      for (const line of content.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) {
          continue;
        }

        const [key, ...valueParts] = trimmed.split('=');
        if (!process.env[key]) {
          process.env[key] = valueParts.join('=').replace(/^["']|["']$/g, '');
        }
      }
    });
}

function sendJson(response, status, payload) {
  response.writeHead(status, { 'content-type': 'application/json; charset=utf-8' });
  response.end(`${JSON.stringify(payload, null, 2)}\n`);
}

function sendHtml(response, html) {
  response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
  response.end(html);
}

async function readJson(relativePath) {
  return JSON.parse(await readFile(path.join(rootDir, relativePath), 'utf8'));
}

async function readJsonIfExists(filePath) {
  if (!existsSync(filePath)) {
    return null;
  }

  return JSON.parse(await readFile(filePath, 'utf8'));
}

async function readTextIfExists(filePath) {
  if (!existsSync(filePath)) {
    return null;
  }

  return readFile(filePath, 'utf8');
}

function extractRepteWeight(challenge) {
  if (typeof challenge.repte_weight === 'number') {
    return challenge.repte_weight;
  }

  const sourceAlignment = Array.isArray(challenge.source_alignment) ? challenge.source_alignment : [];
  for (const item of sourceAlignment) {
    const match = String(item).match(/pes[^0-9]*(\d+(?:[.,]\d+)?)\s*%/i);
    if (match) {
      return Number(match[1].replace(',', '.')) / 100;
    }
  }

  return null;
}

function validateMicrorepte(challenge, rubric, prompt) {
  const issues = [];
  const dimensionWeightSum = Array.isArray(rubric?.dimensions)
    ? rubric.dimensions.reduce((sum, dimension) => sum + Number(dimension.weight || 0), 0)
    : 0;
  const repteWeight = challenge ? extractRepteWeight(challenge) : null;

  if (!challenge) {
    issues.push('Falta challenge.json.');
  }

  if (!rubric) {
    issues.push('Falta rubric.json.');
  }

  if (!prompt) {
    issues.push('Falta prompt.md.');
  }

  if (challenge && rubric && challenge.challenge_id !== rubric.challenge_id) {
    issues.push('challenge_id no coincideix entre challenge.json i rubric.json.');
  }

  if (rubric && Math.abs(dimensionWeightSum - 1) > 0.001) {
    issues.push(`Els pesos de la rúbrica sumen ${dimensionWeightSum.toFixed(3)} en lloc de 1.`);
  }

  if (challenge && repteWeight === null) {
    issues.push('No hi ha pes estructurat del microrepte dins del repte.');
  }

  return {
    status: issues.length === 0 ? 'ok' : 'warning',
    issues,
    dimension_weight_sum: Number(dimensionWeightSum.toFixed(3)),
    repte_weight: repteWeight
  };
}

async function readMicrorepteDir(dirName) {
  const microrepteDir = path.join(rootDir, 'microreptes', dirName);
  const challengePath = path.join(microrepteDir, 'challenge.json');
  const rubricPath = path.join(microrepteDir, 'rubric.json');
  const promptPath = path.join(microrepteDir, 'prompt.md');
  const challenge = await readJsonIfExists(challengePath);
  const rubric = await readJsonIfExists(rubricPath);
  const prompt = await readTextIfExists(promptPath);
  const validation = validateMicrorepte(challenge, rubric, prompt);
  const dimensions = Array.isArray(rubric?.dimensions) ? rubric.dimensions : [];

  return {
    id: challenge?.challenge_id || dirName,
    dir: dirName,
    repte_id: challenge?.repte_id || '',
    session_code: challenge?.session_code || '',
    microrepte_code: challenge?.microrepte_code || '',
    title: challenge?.title || '',
    summary: challenge?.summary || '',
    repte_weight: validation.repte_weight,
    dimension_count: dimensions.length,
    dimension_weight_sum: validation.dimension_weight_sum,
    assessment_criteria: Array.isArray(challenge?.assessment_criteria) ? challenge.assessment_criteria : dimensions,
    validation,
    files: {
      challenge: path.relative(rootDir, challengePath),
      rubric: path.relative(rootDir, rubricPath),
      prompt: path.relative(rootDir, promptPath)
    },
    challenge,
    rubric,
    prompt
  };
}

async function readMicroreptes() {
  const microreptesDir = path.join(rootDir, 'microreptes');
  const entries = await readdir(microreptesDir, { withFileTypes: true });
  const microreptes = [];

  for (const entry of entries) {
    if (entry.isDirectory()) {
      microreptes.push(await readMicrorepteDir(entry.name));
    }
  }

  microreptes.sort((left, right) => {
    const leftKey = [left.repte_id, left.session_code, left.microrepte_code, left.id].join('\u0000');
    const rightKey = [right.repte_id, right.session_code, right.microrepte_code, right.id].join('\u0000');
    return leftKey.localeCompare(rightKey);
  });

  return microreptes;
}

async function readMicrorepteDetail(challengeId) {
  const microreptes = await readMicroreptes();
  return microreptes.find((microrepte) => microrepte.id === challengeId || microrepte.dir === challengeId) || null;
}

function normalizeTextList(value, fieldName) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof value === 'string') {
    return value.split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
  }

  throw new Error(`${fieldName} ha de ser una llista o text amb una entrada per línia.`);
}

function normalizeRepteWeight(value) {
  const numberValue = Number(value);

  if (!Number.isFinite(numberValue) || numberValue < 0 || numberValue > 1) {
    throw new Error('El pes dins del repte ha de ser un número entre 0 i 1.');
  }

  return numberValue;
}

function normalizeRubricDimensions(dimensions) {
  if (!Array.isArray(dimensions) || dimensions.length === 0) {
    throw new Error('La rúbrica ha de tindre almenys una dimensió.');
  }

  const normalized = dimensions.map((dimension) => {
    const id = String(dimension.id || '').trim();
    const label = String(dimension.label || '').trim();
    const weight = Number(dimension.weight);
    const mustCheck = String(dimension.must_check || '').trim();

    if (!id) {
      throw new Error('Cada dimensió ha de tindre id.');
    }

    if (!label) {
      throw new Error(`La dimensió ${id} ha de tindre etiqueta.`);
    }

    if (!Number.isFinite(weight) || weight < 0 || weight > 1) {
      throw new Error(`El pes de la dimensió ${id} ha de ser un número entre 0 i 1.`);
    }

    if (!mustCheck) {
      throw new Error(`La dimensió ${id} ha de tindre criteri must_check.`);
    }

    return {
      ...dimension,
      id,
      label,
      weight,
      must_check: mustCheck
    };
  });

  const weightSum = normalized.reduce((sum, dimension) => sum + dimension.weight, 0);
  if (Math.abs(weightSum - 1) > 0.001) {
    throw new Error(`Els pesos de la rúbrica han de sumar 1. Ara sumen ${weightSum.toFixed(3)}.`);
  }

  return normalized;
}

function updateSourceAlignmentWeight(sourceAlignment, repteWeight) {
  const text = `Pes orientatiu dins del repte: ${Math.round(repteWeight * 1000) / 10}%`;
  const alignment = Array.isArray(sourceAlignment) ? [...sourceAlignment] : [];
  const index = alignment.findIndex((item) => /pes[^0-9]*\d+(?:[.,]\d+)?\s*%/i.test(String(item)));

  if (index >= 0) {
    alignment[index] = text;
  } else {
    alignment.push(text);
  }

  return alignment;
}

function buildUpdatedMicrorepte(current, body) {
  const challenge = { ...current.challenge };
  const rubric = { ...current.rubric };
  const repteWeight = normalizeRepteWeight(body.repte_weight);

  challenge.title = String(body.title || '').trim();
  challenge.summary = String(body.summary || '').trim();
  challenge.pedagogical_goal = String(body.pedagogical_goal || '').trim();
  challenge.recommended_test_strategy = String(body.recommended_test_strategy || '').trim();
  challenge.repte_weight = repteWeight;
  challenge.required_evidence = normalizeTextList(body.required_evidence, 'Evidències requerides');
  challenge.expected_signals = normalizeTextList(body.expected_signals, 'Senyals esperats');
  challenge.source_alignment = updateSourceAlignmentWeight(
    normalizeTextList(body.source_alignment, 'Alineació d’origen'),
    repteWeight
  );

  if (!challenge.title || !challenge.summary || !challenge.pedagogical_goal) {
    throw new Error('Títol, resum i objectiu pedagògic són obligatoris.');
  }

  rubric.dimensions = normalizeRubricDimensions(body.dimensions);
  rubric.hard_rules = normalizeTextList(body.hard_rules, 'Regles dures');

  if (challenge.challenge_id !== rubric.challenge_id) {
    throw new Error('challenge_id no coincideix entre challenge.json i rubric.json.');
  }

  return { challenge, rubric };
}

async function validateRepositoryConfig() {
  try {
    await execFileAsync('npm', ['run', 'validate'], { cwd: rootDir });
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      message: [error.stdout, error.stderr, error.message].filter(Boolean).join('\n').trim()
    };
  }
}

async function updateMicrorepte(challengeId, body) {
  const current = await readMicrorepteDetail(challengeId);

  if (!current || !current.challenge || !current.rubric) {
    throw new Error('Microrepte no trobat o incomplet.');
  }

  const challengePath = path.join(rootDir, current.files.challenge);
  const rubricPath = path.join(rootDir, current.files.rubric);
  const originalChallenge = await readFile(challengePath, 'utf8');
  const originalRubric = await readFile(rubricPath, 'utf8');
  const updated = buildUpdatedMicrorepte(current, body);

  await writeFile(challengePath, `${JSON.stringify(updated.challenge, null, 2)}\n`, 'utf8');
  await writeFile(rubricPath, `${JSON.stringify(updated.rubric, null, 2)}\n`, 'utf8');

  const validation = await validateRepositoryConfig();
  if (!validation.ok) {
    await writeFile(challengePath, originalChallenge, 'utf8');
    await writeFile(rubricPath, originalRubric, 'utf8');
    throw new Error(`La validació ha fallat i s'han restaurat els fitxers originals.\n${validation.message}`);
  }

  return readMicrorepteDetail(challengeId);
}

function resolveHistoryPath(historyDir, fileName) {
  if (!historyDir) {
    return null;
  }

  const fullPath = path.resolve(rootDir, historyDir, fileName);
  const allowedRoot = path.resolve(rootDir, 'grades', 'history');

  if (!fullPath.startsWith(`${allowedRoot}${path.sep}`)) {
    throw new Error('Ruta de resultat no permesa.');
  }

  return fullPath;
}

async function readGradeDetail(gradeId) {
  const grade = getGradeById(gradeId);

  if (!grade) {
    return null;
  }

  const resultPath = resolveHistoryPath(grade.history_dir, 'autograde-result.json');
  const markdownPath = resolveHistoryPath(grade.history_dir, 'autograde-result.md');
  const payloadPath = resolveHistoryPath(grade.history_dir, 'evaluation-payload.json');
  const resultRaw = resultPath ? await readTextIfExists(resultPath) : null;
  const markdown = markdownPath ? await readTextIfExists(markdownPath) : null;
  const evaluationPayloadRaw = payloadPath ? await readTextIfExists(payloadPath) : null;

  return {
    grade,
    result: resultRaw ? JSON.parse(resultRaw) : null,
    markdown,
    evaluation_payload: evaluationPayloadRaw ? JSON.parse(evaluationPayloadRaw) : null,
    files: {
      result: resultRaw ? path.relative(rootDir, resultPath) : null,
      markdown: markdown ? path.relative(rootDir, markdownPath) : null,
      evaluation_payload: evaluationPayloadRaw ? path.relative(rootDir, payloadPath) : null
    }
  };
}

async function parseRepositoryFile(relativePath) {
  const fullPath = path.join(rootDir, relativePath);
  if (!existsSync(fullPath)) {
    return [];
  }

  const content = await readFile(fullPath, 'utf8');
  return content
    .split(/\r?\n/)
    .map((line) => line.replace(/#.*$/, '').trim())
    .filter(Boolean)
    .map((line) => {
      const [repo, group = '', ...nameParts] = line.split(/\s+/);
      return { repo, group, name: nameParts.join(' ') };
    });
}

function validateStudentPayload(body) {
  const repo = String(body.repo || '').trim();
  const groupName = String(body.group_name || body.group || '').trim();
  const studentName = String(body.student_name || body.name || '').trim();

  if (!repo) {
    throw new Error('El repositori és obligatori.');
  }

  if (!/^[\w.-]+\/[\w.-]+$/.test(repo)) {
    throw new Error('El repositori ha de tindre format owner/repo.');
  }

  if (!groupName) {
    throw new Error('El grup és obligatori.');
  }

  if (!Object.hasOwn(groupFiles, groupName) || groupName === 'all') {
    throw new Error(`Grup no valid: ${groupName}`);
  }

  return {
    repo,
    group_name: groupName,
    student_name: studentName || null
  };
}

async function importStudentsFromCourseFiles() {
  const repositories = await parseRepositoryFile(groupFiles.all);

  for (const student of repositories) {
    upsertStudent(student.repo, student.group, student.name || null);
  }

  return getStudents();
}

function buildRepositoryFileContent(students, title) {
  const lines = [
    `# ${title}`,
    '# Format: repositori grup',
    ''
  ];

  for (const student of students) {
    lines.push(`${student.repo} ${student.group_name}`);
  }

  return `${lines.join('\n')}\n`;
}

async function syncStudentRepositoryFiles() {
  const students = getStudents();
  const byGroup = new Map();

  for (const student of students) {
    if (!student.group_name) {
      continue;
    }

    if (!byGroup.has(student.group_name)) {
      byGroup.set(student.group_name, []);
    }

    byGroup.get(student.group_name).push(student);
  }

  await writeFile(
    path.join(rootDir, groupFiles.all),
    buildRepositoryFileContent(students, 'Repositoris de tots els grups per a correccio massiva.'),
    'utf8'
  );

  for (const [group, file] of Object.entries(groupFiles)) {
    if (group === 'all') {
      continue;
    }

    await writeFile(
      path.join(rootDir, file),
      buildRepositoryFileContent(byGroup.get(group) || [], `Repositoris d'alumnes de ${group} per a correccio massiva.`),
      'utf8'
    );
  }

  return {
    students: students.length,
    files: Object.values(groupFiles)
  };
}

async function readRequestJson(request) {
  const chunks = [];
  for await (const chunk of request) {
    chunks.push(chunk);
  }

  const raw = Buffer.concat(chunks).toString('utf8');
  return raw ? JSON.parse(raw) : {};
}

function resolveWorkflowInputs(body) {
  const targetGroup = body.target_group || 'all';
  const repositories = body.repositories || '';
  const repositoriesFile = body.repositories_file || '';
  const mode = body.mode || 'mock';
  const studentRef = body.student_ref || 'master';
  const publishToStudentRepo = String(body.publish_to_student_repo ?? false);
  const defaultGroup = body.group || (targetGroup === 'all' ? '2DAW-A' : targetGroup);

  if (!Object.hasOwn(groupFiles, targetGroup)) {
    throw new Error(`target_group no valid: ${targetGroup}`);
  }

  if (!['mock', 'openai'].includes(mode)) {
    throw new Error(`mode no valid: ${mode}`);
  }

  return {
    repositories,
    target_group: targetGroup,
    repositories_file: repositoriesFile,
    group: defaultGroup,
    mode,
    student_ref: studentRef,
    publish_to_student_repo: publishToStudentRepo
  };
}

async function dispatchWorkflow(inputs) {
  const token = process.env.GITHUB_TOKEN || process.env.CLASSROOM_AUTOGRADE_TOKEN;
  const owner = process.env.GITHUB_OWNER || 'igomis';
  const repo = process.env.GITHUB_REPO || 'dwes-microreptes-autocorreccio';
  const ref = process.env.GITHUB_REF || 'main';

  if (!token) {
    throw new Error('Falta GITHUB_TOKEN en .env o en l_entorn del dashboard.');
  }

  const url = `https://api.github.com/repos/${owner}/${repo}/actions/workflows/${workflowFile}/dispatches`;
  const githubResponse = await fetch(url, {
    method: 'POST',
    headers: {
      accept: 'application/vnd.github+json',
      authorization: `Bearer ${token}`,
      'content-type': 'application/json',
      'x-github-api-version': '2022-11-28'
    },
    body: JSON.stringify({ ref, inputs })
  });

  if (!githubResponse.ok) {
    const errorText = await githubResponse.text();
    throw new Error(`GitHub ha retornat ${githubResponse.status}: ${errorText}`);
  }

  return {
    actions_url: `https://github.com/${owner}/${repo}/actions/workflows/${workflowFile}`,
    owner,
    repo,
    ref
  };
}

async function buildConfigPayload() {
  const activeChallenges = await readJson('course/active-challenges.json');
  const repositoriesByTarget = {};

  for (const [target, file] of Object.entries(groupFiles)) {
    repositoriesByTarget[target] = {
      file,
      repositories: await parseRepositoryFile(file)
    };
  }

  return {
    active_challenges: activeChallenges,
    group_files: groupFiles,
    repositories_by_target: repositoriesByTarget,
    github: {
      owner: process.env.GITHUB_OWNER || 'igomis',
      repo: process.env.GITHUB_REPO || 'dwes-microreptes-autocorreccio',
      ref: process.env.GITHUB_REF || 'main',
      token_configured: Boolean(process.env.GITHUB_TOKEN || process.env.CLASSROOM_AUTOGRADE_TOKEN)
    }
  };
}

async function readLatestGrades(filters = {}) {
  return getLatestGrades(200, filters);
}

function pageHtml() {
  return `<!doctype html>
<html lang="ca">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>DWES Autocorrecció</title>
  <style>
    :root {
      color-scheme: light;
      --bg: #f6f7f9;
      --panel: #ffffff;
      --text: #18202a;
      --muted: #657282;
      --border: #d7dde5;
      --accent: #0f766e;
      --accent-dark: #0b5d56;
      --danger: #b42318;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.4;
    }
    header {
      background: var(--panel);
      border-bottom: 1px solid var(--border);
      padding: 18px 28px;
    }
    .topbar {
      max-width: 1180px;
      margin: 0 auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
    }
    h1 { font-size: 22px; margin: 0; }
    nav {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    .nav-button {
      background: #eef2f6;
      color: #253244;
    }
    .nav-button:hover,
    .nav-button.active {
      background: var(--accent);
      color: #fff;
    }
    main {
      max-width: 1180px;
      margin: 0 auto;
      padding: 24px;
      display: grid;
      gap: 18px;
    }
    section {
      background: var(--panel);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 18px;
    }
    h2 {
      font-size: 17px;
      margin: 0 0 14px;
    }
    .grid {
      display: grid;
      gap: 14px;
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }
    label {
      display: grid;
      gap: 6px;
      color: var(--muted);
      font-size: 13px;
      font-weight: 600;
    }
    select, input, textarea {
      width: 100%;
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 9px 10px;
      font: inherit;
      color: var(--text);
      background: #fff;
    }
    textarea {
      min-height: 110px;
      resize: vertical;
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      font-size: 13px;
    }
    button {
      border: 0;
      border-radius: 6px;
      padding: 10px 14px;
      background: var(--accent);
      color: #fff;
      font-weight: 700;
      cursor: pointer;
    }
    button:hover { background: var(--accent-dark); }
    button:disabled { opacity: .6; cursor: wait; }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 14px;
    }
    th, td {
      text-align: left;
      border-bottom: 1px solid var(--border);
      padding: 9px 8px;
      vertical-align: top;
    }
    th { color: var(--muted); font-size: 12px; text-transform: uppercase; }
    .actions {
      display: flex;
      align-items: end;
      gap: 10px;
    }
    .secondary {
      background: #e7eef5;
      color: #253244;
    }
    .secondary:hover { background: #d8e2ec; }
    .status {
      color: var(--muted);
      font-size: 14px;
    }
    .toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;
    }
    .error { color: var(--danger); }
    .ok { color: var(--accent-dark); }
    .filters {
      display: grid;
      gap: 10px;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      margin-bottom: 14px;
      align-items: end;
    }
    .filters button {
      grid-column: 3;
    }
    table tbody tr:hover {
      background: #f9fafb;
    }
    tr.review-required {
      background: #fff3cd;
    }
    .score-low { color: #b42318; font-weight: 600; }
    .score-medium { color: #f97316; font-weight: 600; }
    .score-high { color: #22c55e; font-weight: 600; }
    .badge {
      display: inline-flex;
      align-items: center;
      border-radius: 999px;
      padding: 3px 8px;
      font-size: 12px;
      font-weight: 700;
      background: #e7eef5;
      color: #253244;
    }
    .badge.ok {
      background: #dcfce7;
      color: #166534;
    }
    .badge.warning {
      background: #fef3c7;
      color: #92400e;
    }
    .viewer {
      display: grid;
      gap: 16px;
    }
    .viewer-empty {
      color: var(--muted);
      border: 1px dashed var(--border);
      border-radius: 8px;
      padding: 18px;
      text-align: center;
    }
    .result-header {
      display: grid;
      gap: 10px;
      grid-template-columns: 1.4fr repeat(3, minmax(120px, .5fr));
      align-items: stretch;
    }
    .metric {
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 12px;
      background: #fbfcfd;
    }
    .metric span {
      display: block;
      color: var(--muted);
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
    }
    .metric strong {
      display: block;
      margin-top: 4px;
      font-size: 18px;
    }
    .feedback-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 14px;
    }
    .feedback-box {
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 14px;
    }
    .feedback-box h3 {
      margin: 0 0 10px;
      font-size: 15px;
    }
    .feedback-box ul {
      margin: 0;
      padding-left: 18px;
    }
    .markdown-preview {
      white-space: pre-wrap;
      border: 1px solid var(--border);
      border-radius: 8px;
      background: #fbfcfd;
      padding: 14px;
      font-size: 14px;
      overflow: auto;
      max-height: 360px;
    }
    .json-preview {
      white-space: pre-wrap;
      border: 1px solid var(--border);
      border-radius: 8px;
      background: #0f172a;
      color: #e5e7eb;
      padding: 14px;
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      font-size: 13px;
      overflow: auto;
      max-height: 360px;
    }
    .file-note {
      color: var(--muted);
      font-size: 13px;
      overflow-wrap: anywhere;
    }
    .hidden { display: none; }
    .compact-actions {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    @media (max-width: 820px) {
      .topbar { align-items: flex-start; flex-direction: column; }
      main { padding: 14px; }
      .grid { grid-template-columns: 1fr; }
      .filters { grid-template-columns: 1fr; }
      .filters button { grid-column: auto; }
      .result-header, .feedback-grid { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <header>
    <div class="topbar">
      <h1>DWES Autocorrecció</h1>
      <nav aria-label="Seccions del dashboard">
        <button class="nav-button active" type="button" data-nav-view="correction">Correcció</button>
        <button class="nav-button" type="button" data-nav-view="results">Resultats</button>
        <button class="nav-button" type="button" data-nav-view="students">Alumnes</button>
        <button class="nav-button" type="button" data-nav-view="microreptes">Microreptes</button>
        <button class="nav-button" type="button" data-nav-view="programacio">Programació</button>
      </nav>
    </div>
  </header>
  <main>
    <section class="view-panel" data-view="correction">
      <h2>Llançar correcció</h2>
      <div class="grid">
        <label>Grup
          <select id="targetGroup">
            <option value="all">Tots</option>
            <option value="2DAW-A">2DAW-A</option>
            <option value="2DAW-B">2DAW-B</option>
            <option value="2DAW-C">2DAW-C</option>
            <option value="2DAW-D">2DAW-D</option>
          </select>
        </label>
        <label>Mode
          <select id="mode">
            <option value="mock">mock</option>
            <option value="openai">openai</option>
          </select>
        </label>
        <label>Branca alumne
          <input id="studentRef" value="master">
        </label>
        <label>Publicar en repo alumne
          <select id="publish">
            <option value="false">No</option>
            <option value="true">Sí</option>
          </select>
        </label>
      </div>
      <p class="status" id="selectedFile"></p>
      <label>Repositoris puntuals
        <textarea id="repositories" placeholder="Opcional. Si ho deixes buit, s'usa el fitxer del grup seleccionat."></textarea>
      </label>
      <div class="actions">
        <button id="runButton">Llançar workflow</button>
        <span class="status" id="runStatus"></span>
      </div>
    </section>

    <section class="view-panel" data-view="correction">
      <h2>Repositoris seleccionats</h2>
      <table>
        <thead><tr><th>Repositori</th><th>Grup</th><th>Autocorrecció</th></tr></thead>
        <tbody id="repoRows"></tbody>
      </table>
    </section>

    <section class="view-panel hidden" data-view="results">
      <div class="toolbar">
        <h2>Últims resultats</h2>
        <button id="refreshGrades" type="button">Actualitzar</button>
      </div>
      <div class="filters">
        <label>Filtre per grup
          <select id="filterGroup">
            <option value="">Tots</option>
            <option value="2DAW-A">2DAW-A</option>
            <option value="2DAW-B">2DAW-B</option>
            <option value="2DAW-C">2DAW-C</option>
            <option value="2DAW-D">2DAW-D</option>
          </select>
        </label>
        <label>Filtre per repte
          <select id="filterChallenge">
            <option value="">Tots</option>
          </select>
        </label>
        <label>Filtre per repositori
          <input id="filterRepo" type="text" placeholder="Buscar repositori...">
        </label>
        <button id="applyFilters" type="button">Aplicar filtres</button>
      </div>
      <table>
        <thead><tr><th>Data</th><th>Repo</th><th>Grup</th><th>Repte</th><th>Nota</th><th>Confiança</th><th>Mode</th><th>Accions</th></tr></thead>
        <tbody id="gradeRows"></tbody>
      </table>
      <div id="gradesInfo" class="status"></div>
    </section>

    <section class="view-panel hidden" data-view="results">
      <div class="toolbar">
        <h2>Visor del resultat</h2>
        <button id="clearViewer" class="secondary" type="button">Netejar</button>
      </div>
      <div id="resultViewer" class="viewer">
        <div class="viewer-empty">Selecciona un resultat amb el botó Veure.</div>
      </div>
    </section>

    <section class="view-panel hidden" data-view="students">
      <div class="toolbar">
        <h2>Manteniment d'alumnes</h2>
        <div class="compact-actions">
          <button id="importStudents" class="secondary" type="button">Importar de course</button>
          <button id="syncStudents" type="button">Sincronitzar course</button>
        </div>
      </div>
      <div class="grid">
        <label>Nom
          <input id="studentName" placeholder="Nom de l'alumne">
        </label>
        <label>Repositori
          <input id="studentRepo" placeholder="owner/repo">
        </label>
        <label>Grup
          <select id="studentGroup">
            <option value="2DAW-A">2DAW-A</option>
            <option value="2DAW-B">2DAW-B</option>
            <option value="2DAW-C">2DAW-C</option>
            <option value="2DAW-D">2DAW-D</option>
          </select>
        </label>
        <div class="actions">
          <button id="saveStudent" type="button">Guardar</button>
          <button id="clearStudentForm" class="secondary" type="button">Netejar</button>
        </div>
      </div>
      <p class="status" id="studentStatus"></p>
      <div class="filters">
        <label>Filtre per grup
          <select id="studentFilterGroup">
            <option value="">Tots</option>
            <option value="2DAW-A">2DAW-A</option>
            <option value="2DAW-B">2DAW-B</option>
            <option value="2DAW-C">2DAW-C</option>
            <option value="2DAW-D">2DAW-D</option>
          </select>
        </label>
        <label>Buscar
          <input id="studentSearch" placeholder="Nom o repositori">
        </label>
        <button id="applyStudentFilters" type="button">Aplicar filtres</button>
      </div>
      <table>
        <thead><tr><th>Nom</th><th>Repositori</th><th>Grup</th><th>Resultats</th><th>Accions</th></tr></thead>
        <tbody id="studentRows"></tbody>
      </table>
    </section>

    <section class="view-panel hidden" data-view="microreptes">
      <div class="toolbar">
        <h2>Microreptes</h2>
        <button id="refreshMicroreptes" type="button">Actualitzar</button>
      </div>
      <div class="filters">
        <label>Filtre per repte
          <select id="microrepteFilterRepte">
            <option value="">Tots</option>
          </select>
        </label>
        <label>Buscar
          <input id="microrepteSearch" placeholder="Títol, codi o sessió">
        </label>
        <button id="applyMicrorepteFilters" type="button">Aplicar filtres</button>
      </div>
      <table>
        <thead><tr><th>Repte</th><th>Sessió</th><th>MP</th><th>Títol</th><th>Pes repte</th><th>Rúbrica</th><th>Estat</th><th>Accions</th></tr></thead>
        <tbody id="microrepteRows"></tbody>
      </table>
      <div id="microreptesInfo" class="status"></div>
    </section>

    <section class="view-panel hidden" data-view="microreptes">
      <div class="toolbar">
        <h2>Visor del microrepte</h2>
        <button id="clearMicrorepteViewer" class="secondary" type="button">Netejar</button>
      </div>
      <div id="microrepteViewer" class="viewer">
        <div class="viewer-empty">Selecciona un microrepte amb el botó Veure.</div>
      </div>
    </section>

    <section class="view-panel hidden" data-view="programacio">
      <div class="toolbar">
        <h2>Programació d'aula</h2>
        <button id="refreshProgramacio" type="button">Actualitzar</button>
      </div>
      <div class="filters">
        <label>Repte
          <select id="programacioFilterRepte"></select>
        </label>
        <button id="applyProgramacioFilter" type="button">Generar programació</button>
      </div>
      <div id="programacioInfo" class="status"></div>
      <div id="programacioViewer" class="viewer">
        <div class="viewer-empty">Selecciona un repte per generar la programació d'aula a partir dels JSON.</div>
      </div>
    </section>

    <section class="view-panel" data-view="correction">
      <h2>Configuració</h2>
      <p class="status" id="githubStatus"></p>
    </section>
  </main>
  <script>
    let config = null;
    let allChallenges = [];
    let students = [];
    let microreptes = [];
    let currentMicrorepte = null;
    let editingStudentId = null;

    function showView(view) {
      document.querySelectorAll('.view-panel').forEach((panel) => {
        panel.classList.toggle('hidden', panel.dataset.view !== view);
      });
      document.querySelectorAll('[data-nav-view]').forEach((button) => {
        button.classList.toggle('active', button.dataset.navView === view);
      });

      if (view === 'results') loadGrades();
      if (view === 'students') loadStudents();
      if (view === 'microreptes') loadMicroreptes();
      if (view === 'programacio') loadProgramacio();
    }

    function challengeFor(repo, group) {
      const student = config.active_challenges.students[repo];
      if (student && student.challenge_id) return student.challenge_id;
      const groupConfig = config.active_challenges.groups[group];
      return groupConfig && groupConfig.challenge_id ? groupConfig.challenge_id : 'sense assignació';
    }

    function getScoreClass(score) {
      if (score >= 7) return 'score-high';
      if (score >= 5) return 'score-medium';
      return 'score-low';
    }

    function formatTimestamp(ts) {
      if (!ts) return '';
      return new Date(ts).toLocaleString('ca-ES');
    }

    function escapeHtml(value) {
      return String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
    }

    function renderList(items, emptyText) {
      if (!Array.isArray(items) || items.length === 0) {
        return '<p class="status">' + escapeHtml(emptyText) + '</p>';
      }

      return '<ul>' + items.map((item) => '<li>' + escapeHtml(item) + '</li>').join('') + '</ul>';
    }

    function renderDimensions(dimensions) {
      if (!Array.isArray(dimensions) || dimensions.length === 0) {
        return '<p class="status">No hi ha puntuació per dimensions.</p>';
      }

      const rows = dimensions.map((dimension) => (
        '<tr>' +
          '<td><code>' + escapeHtml(dimension.id || dimension.name || '') + '</code></td>' +
          '<td>' + escapeHtml(dimension.score ?? '-') + ' / ' + escapeHtml(dimension.max_score ?? '-') + '</td>' +
          '<td>' + escapeHtml(dimension.reason || dimension.feedback || '') + '</td>' +
        '</tr>'
      ));

      return '<table>' +
        '<thead><tr><th>Dimensió</th><th>Punts</th><th>Comentari</th></tr></thead>' +
        '<tbody>' + rows.join('') + '</tbody>' +
      '</table>';
    }

    function formatPercent(value) {
      if (value === null || value === undefined || Number.isNaN(Number(value))) {
        return 'n/d';
      }

      return Math.round(Number(value) * 1000) / 10 + '%';
    }

    function renderMicrorepteValidation(validation) {
      const issues = validation?.issues || [];
      const status = validation?.status || 'warning';
      const label = status === 'ok' ? 'Complet' : 'Avisos';

      if (issues.length === 0) {
        return '<span class="badge ok">' + label + '</span>';
      }

      return '<span class="badge warning">' + label + '</span>';
    }

    function renderMicrorepteList(items, emptyText) {
      if (!Array.isArray(items) || items.length === 0) {
        return '<p class="status">' + escapeHtml(emptyText) + '</p>';
      }

      return renderList(items.map((item) => {
        if (typeof item === 'string') return item;
        return item.label || item.id || JSON.stringify(item);
      }), emptyText);
    }

    function renderRubricDimensions(dimensions) {
      if (!Array.isArray(dimensions) || dimensions.length === 0) {
        return '<p class="status">No hi ha dimensions de rúbrica.</p>';
      }

      const rows = dimensions.map((dimension) => (
        '<tr>' +
          '<td><code>' + escapeHtml(dimension.id || '') + '</code></td>' +
          '<td>' + escapeHtml(dimension.label || '') + '</td>' +
          '<td>' + formatPercent(dimension.weight) + '</td>' +
          '<td>' + escapeHtml(dimension.must_check || '') + '</td>' +
        '</tr>'
      ));

      return '<table>' +
        '<thead><tr><th>ID</th><th>Criteri</th><th>Pes</th><th>Què comprova</th></tr></thead>' +
        '<tbody>' + rows.join('') + '</tbody>' +
      '</table>';
    }

    function compareMicrorepteOrder(a, b) {
      return [
        a.session_code || '',
        a.microrepte_code || '',
        a.id || ''
      ].join(' ').localeCompare([
        b.session_code || '',
        b.microrepte_code || '',
        b.id || ''
      ].join(' '), 'ca', { numeric: true, sensitivity: 'base' });
    }

    function refreshProgramacioRepteFilter() {
      const select = document.querySelector('#programacioFilterRepte');
      const current = select.value;
      const reptes = [...new Set(microreptes.map((microrepte) => microrepte.repte_id).filter(Boolean))].sort();
      select.innerHTML = reptes.map((repte) => (
        '<option value="' + escapeHtml(repte) + '">' + escapeHtml(repte) + '</option>'
      )).join('');
      select.value = reptes.includes(current) ? current : (reptes[0] || '');
    }

    function markdownBulletList(items, fallback) {
      if (!Array.isArray(items) || items.length === 0) {
        return '- ' + fallback;
      }

      return items.map((item) => '- ' + String(item)).join('\\n');
    }

    function renderProgramacioMarkdown(repte, items) {
      const totalWeight = items.reduce((sum, microrepte) => sum + (Number(microrepte.repte_weight) || 0), 0);
      const lines = [
        '# Programació d’aula ' + repte,
        '',
        '- Microreptes: ' + items.length,
        '- Pes total documentat: ' + formatPercent(totalWeight),
        '',
        '## Seqüència de sessions'
      ];

      for (const microrepte of items) {
        const challenge = microrepte.challenge || {};
        const rubric = microrepte.rubric || {};
        const dimensions = Array.isArray(rubric.dimensions) ? rubric.dimensions : [];
        lines.push(
          '',
          '### ' + (challenge.session_code || microrepte.session_code || '') + ' · ' + (challenge.microrepte_code || microrepte.microrepte_code || '') + ' · ' + (challenge.title || microrepte.title || ''),
          '',
          '- Pes dins del repte: ' + formatPercent(microrepte.repte_weight),
          '- Finalitat: ' + (challenge.summary || 'No documentada.'),
          '- Objectiu pedagògic: ' + (challenge.pedagogical_goal || 'No documentat.'),
          '- Verificació recomanada: ' + (challenge.recommended_test_strategy || 'No documentada.'),
          '',
          '**Evidències mínimes**',
          markdownBulletList(challenge.required_evidence, 'Sense evidències requerides documentades.'),
          '',
          '**Senyals esperats**',
          markdownBulletList(challenge.expected_signals, 'Sense senyals esperats documentats.'),
          '',
          '**Criteris de rúbrica**',
          markdownBulletList(dimensions.map((dimension) => (
            (dimension.label || dimension.id || 'Dimensió') + ' (' + formatPercent(dimension.weight) + '): ' + (dimension.must_check || 'Sense comprovació documentada.')
          )), 'Sense dimensions de rúbrica documentades.'),
          '',
          '**Regles dures**',
          markdownBulletList(rubric.hard_rules, 'Sense regles dures documentades.')
        );
      }

      return lines.join('\\n');
    }

    function renderProgramacio() {
      const repte = document.querySelector('#programacioFilterRepte').value;
      const viewer = document.querySelector('#programacioViewer');
      const items = microreptes
        .filter((microrepte) => microrepte.repte_id === repte)
        .sort(compareMicrorepteOrder);

      if (!repte || items.length === 0) {
        viewer.innerHTML = '<div class="viewer-empty">No hi ha microreptes amb JSON per a aquest repte.</div>';
        document.querySelector('#programacioInfo').textContent = '';
        return;
      }

      const totalWeight = items.reduce((sum, microrepte) => sum + (Number(microrepte.repte_weight) || 0), 0);
      const dimensionCount = items.reduce((sum, microrepte) => sum + (Number(microrepte.dimension_count) || 0), 0);
      const rows = items.map((microrepte) => {
        const challenge = microrepte.challenge || {};
        const rubric = microrepte.rubric || {};
        const dimensions = Array.isArray(rubric.dimensions) ? rubric.dimensions : [];
        const criteria = dimensions.map((dimension) => (
          (dimension.label || dimension.id || '') + ' (' + formatPercent(dimension.weight) + ')'
        ));

        return '<tr>' +
          '<td><code>' + escapeHtml(challenge.session_code || microrepte.session_code || '') + '</code></td>' +
          '<td><code>' + escapeHtml(challenge.microrepte_code || microrepte.microrepte_code || '') + '</code></td>' +
          '<td>' + escapeHtml(challenge.title || microrepte.title || '') + '<p class="status">' + escapeHtml(challenge.summary || '') + '</p></td>' +
          '<td>' + formatPercent(microrepte.repte_weight) + '</td>' +
          '<td>' + renderMicrorepteList(challenge.required_evidence, 'Sense evidències.') + '</td>' +
          '<td>' + renderMicrorepteList(criteria, 'Sense criteris.') + '</td>' +
        '</tr>';
      });
      const detailBlocks = items.map((microrepte) => {
        const challenge = microrepte.challenge || {};
        const rubric = microrepte.rubric || {};
        return '<div class="feedback-box">' +
          '<h3>' + escapeHtml((challenge.session_code || microrepte.session_code || '') + ' · ' + (challenge.microrepte_code || microrepte.microrepte_code || '') + ' · ' + (challenge.title || microrepte.title || '')) + '</h3>' +
          '<p><strong>Objectiu pedagògic:</strong> ' + escapeHtml(challenge.pedagogical_goal || 'No documentat.') + '</p>' +
          '<p><strong>Verificació recomanada:</strong> ' + escapeHtml(challenge.recommended_test_strategy || 'No documentada.') + '</p>' +
          '<div class="feedback-grid">' +
            '<div><h4>Senyals esperats</h4>' + renderMicrorepteList(challenge.expected_signals, 'Sense senyals esperats.') + '</div>' +
            '<div><h4>Regles dures</h4>' + renderMicrorepteList(rubric.hard_rules, 'Sense regles dures.') + '</div>' +
          '</div>' +
          '<div><h4>Dimensions de rúbrica</h4>' + renderRubricDimensions(rubric.dimensions) + '</div>' +
          '<div><h4>Alineació d’origen</h4>' + renderMicrorepteList(challenge.source_alignment, 'Sense alineació documentada.') + '</div>' +
        '</div>';
      });
      const markdown = renderProgramacioMarkdown(repte, items);

      document.querySelector('#programacioInfo').textContent = 'Programació generada des de challenge.json i rubric.json: ' + items.length + ' microreptes';
      viewer.innerHTML =
        '<div class="result-header">' +
          '<div class="metric"><span>Repte</span><strong><code>' + escapeHtml(repte) + '</code></strong></div>' +
          '<div class="metric"><span>Microreptes</span><strong>' + escapeHtml(items.length) + '</strong></div>' +
          '<div class="metric"><span>Pes documentat</span><strong>' + formatPercent(totalWeight) + '</strong></div>' +
          '<div class="metric"><span>Dimensions</span><strong>' + escapeHtml(dimensionCount) + '</strong></div>' +
        '</div>' +
        '<div class="feedback-box"><h3>Seqüència d’aula</h3>' +
          '<table><thead><tr><th>Sessió</th><th>MP</th><th>Finalitat</th><th>Pes</th><th>Evidències</th><th>Criteris</th></tr></thead><tbody>' + rows.join('') + '</tbody></table>' +
        '</div>' +
        '<div class="feedback-grid">' + detailBlocks.join('') + '</div>' +
        '<div><h3>Markdown generat</h3><div class="markdown-preview">' + escapeHtml(markdown) + '</div></div>';
    }

    async function loadProgramacio() {
      try {
        const response = await fetch('/api/microreptes');
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || 'No s’han pogut carregar els microreptes.');
        microreptes = payload.microreptes || [];
        refreshProgramacioRepteFilter();
        renderProgramacio();
      } catch (error) {
        document.querySelector('#programacioInfo').innerHTML = '<span class="error">' + escapeHtml(error.message) + '</span>';
      }
    }

    function clearMicrorepteViewer() {
      currentMicrorepte = null;
      document.querySelector('#microrepteViewer').innerHTML = '<div class="viewer-empty">Selecciona un microrepte amb el botó Veure.</div>';
    }

    function listToText(items) {
      return Array.isArray(items) ? items.join('\\n') : '';
    }

    function renderMicrorepteEditForm(microrepte) {
      const challenge = microrepte.challenge || {};
      const rubric = microrepte.rubric || {};
      const dimensions = Array.isArray(rubric.dimensions) ? rubric.dimensions : [];
      const dimensionRows = dimensions.map((dimension, index) => (
        '<tr data-edit-dimension="' + index + '">' +
          '<td><input data-dimension-field="id" value="' + escapeHtml(dimension.id || '') + '" readonly></td>' +
          '<td><input data-dimension-field="label" value="' + escapeHtml(dimension.label || '') + '"></td>' +
          '<td><input data-dimension-field="weight" type="number" min="0" max="1" step="0.01" value="' + escapeHtml(dimension.weight ?? '') + '"></td>' +
          '<td><textarea data-dimension-field="must_check">' + escapeHtml(dimension.must_check || '') + '</textarea></td>' +
        '</tr>'
      ));

      return '<div class="feedback-box" id="microrepteEditForm">' +
        '<h3>Edició guiada</h3>' +
        '<div class="grid">' +
          '<label>Títol<input id="editMicrorepteTitle" value="' + escapeHtml(challenge.title || '') + '"></label>' +
          '<label>Pes dins del repte (0-1)<input id="editMicrorepteWeight" type="number" min="0" max="1" step="0.01" value="' + escapeHtml(microrepte.repte_weight ?? '') + '"></label>' +
          '<label>Estratègia de prova<input id="editMicrorepteTestStrategy" value="' + escapeHtml(challenge.recommended_test_strategy || '') + '"></label>' +
        '</div>' +
        '<label>Resum<textarea id="editMicrorepteSummary">' + escapeHtml(challenge.summary || '') + '</textarea></label>' +
        '<label>Objectiu pedagògic<textarea id="editMicrorepteGoal">' + escapeHtml(challenge.pedagogical_goal || '') + '</textarea></label>' +
        '<div class="feedback-grid">' +
          '<label>Evidències requerides<textarea id="editMicrorepteEvidence">' + escapeHtml(listToText(challenge.required_evidence)) + '</textarea></label>' +
          '<label>Senyals esperats<textarea id="editMicrorepteSignals">' + escapeHtml(listToText(challenge.expected_signals)) + '</textarea></label>' +
        '</div>' +
        '<div class="feedback-grid">' +
          '<label>Regles dures<textarea id="editMicrorepteHardRules">' + escapeHtml(listToText(rubric.hard_rules)) + '</textarea></label>' +
          '<label>Alineació d’origen<textarea id="editMicrorepteSourceAlignment">' + escapeHtml(listToText(challenge.source_alignment)) + '</textarea></label>' +
        '</div>' +
        '<h3>Dimensions de rúbrica</h3>' +
        '<table><thead><tr><th>ID</th><th>Criteri</th><th>Pes</th><th>Què comprova</th></tr></thead><tbody>' + dimensionRows.join('') + '</tbody></table>' +
        '<div class="actions">' +
          '<button id="saveMicrorepte" type="button">Guardar canvis</button>' +
          '<button id="cancelMicrorepteEdit" class="secondary" type="button">Cancel·lar</button>' +
          '<span id="microrepteEditStatus" class="status"></span>' +
        '</div>' +
      '</div>';
    }

    function collectMicrorepteEditForm() {
      const dimensions = Array.from(document.querySelectorAll('[data-edit-dimension]')).map((row) => {
        const field = (name) => row.querySelector('[data-dimension-field="' + name + '"]').value;
        return {
          id: field('id'),
          label: field('label'),
          weight: Number(field('weight')),
          must_check: field('must_check')
        };
      });

      return {
        title: document.querySelector('#editMicrorepteTitle').value,
        repte_weight: Number(document.querySelector('#editMicrorepteWeight').value),
        recommended_test_strategy: document.querySelector('#editMicrorepteTestStrategy').value,
        summary: document.querySelector('#editMicrorepteSummary').value,
        pedagogical_goal: document.querySelector('#editMicrorepteGoal').value,
        required_evidence: document.querySelector('#editMicrorepteEvidence').value,
        expected_signals: document.querySelector('#editMicrorepteSignals').value,
        hard_rules: document.querySelector('#editMicrorepteHardRules').value,
        source_alignment: document.querySelector('#editMicrorepteSourceAlignment').value,
        dimensions
      };
    }

    function attachMicrorepteDetailListeners(microrepte) {
      const editButton = document.querySelector('#editMicrorepte');
      if (editButton) {
        editButton.addEventListener('click', () => {
          const container = document.querySelector('#microrepteEditContainer');
          container.innerHTML = renderMicrorepteEditForm(microrepte);
          attachMicrorepteEditListeners();
          container.scrollIntoView({ behavior: 'smooth', block: 'start' });
          document.querySelector('#editMicrorepteTitle')?.focus({ preventScroll: true });
        });
      }
    }

    function attachMicrorepteEditListeners() {
      document.querySelector('#cancelMicrorepteEdit').addEventListener('click', () => {
        document.querySelector('#microrepteEditContainer').innerHTML = '';
      });
      document.querySelector('#saveMicrorepte').addEventListener('click', saveMicrorepte);
    }

    async function saveMicrorepte() {
      const status = document.querySelector('#microrepteEditStatus');
      status.textContent = 'Guardant i validant...';

      try {
        const body = collectMicrorepteEditForm();
        const response = await fetch('/api/microreptes/' + encodeURIComponent(currentMicrorepte.id), {
          method: 'PUT',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(body)
        });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || 'No s’ha pogut guardar el microrepte.');
        currentMicrorepte = payload;
        await loadMicroreptes();
        renderMicrorepteDetail(payload);
        document.querySelector('#microreptesInfo').innerHTML = '<span class="ok">Microrepte guardat i validat.</span>';
      } catch (error) {
        status.innerHTML = '<span class="error">' + escapeHtml(error.message) + '</span>';
      }
    }

    function renderMicrorepteDetail(microrepte) {
      currentMicrorepte = microrepte;
      const challenge = microrepte.challenge || {};
      const rubric = microrepte.rubric || {};
      const validation = microrepte.validation || {};
      const issues = validation.issues || [];

      document.querySelector('#microrepteViewer').innerHTML =
        '<div class="actions"><button id="editMicrorepte" type="button">Editar</button><span class="status">Edició guiada amb validació i rollback.</span></div>' +
        '<div class="result-header">' +
          '<div class="metric"><span>Microrepte</span><strong><code>' + escapeHtml(microrepte.id) + '</code></strong><p class="status">' + escapeHtml(microrepte.title || '') + '</p></div>' +
          '<div class="metric"><span>Repte</span><strong>' + escapeHtml(microrepte.repte_id || 'n/d') + '</strong></div>' +
          '<div class="metric"><span>Pes dins repte</span><strong>' + formatPercent(microrepte.repte_weight) + '</strong></div>' +
          '<div class="metric"><span>Pes rúbrica</span><strong>' + escapeHtml(validation.dimension_weight_sum ?? 'n/d') + '</strong></div>' +
        '</div>' +
        '<div class="feedback-grid">' +
          '<div class="feedback-box"><h3>Dades generals</h3>' +
            '<p><strong>Sessió:</strong> ' + escapeHtml(challenge.session_code || '') + '</p>' +
            '<p><strong>Codi:</strong> ' + escapeHtml(challenge.microrepte_code || '') + '</p>' +
            '<p><strong>Resum:</strong> ' + escapeHtml(challenge.summary || '') + '</p>' +
            '<p><strong>Objectiu:</strong> ' + escapeHtml(challenge.pedagogical_goal || '') + '</p>' +
          '</div>' +
          '<div class="feedback-box"><h3>Validació</h3>' +
            renderList(issues, 'Sense avisos de validació.') +
          '</div>' +
        '</div>' +
        '<div class="feedback-box"><h3>Criteris d’avaluació / dimensions de rúbrica</h3>' + renderRubricDimensions(rubric.dimensions) + '</div>' +
        '<div class="feedback-grid">' +
          '<div class="feedback-box"><h3>Evidències requerides</h3>' + renderMicrorepteList(challenge.required_evidence, 'Sense evidències requerides.') + '</div>' +
          '<div class="feedback-box"><h3>Senyals esperats</h3>' + renderMicrorepteList(challenge.expected_signals, 'Sense senyals esperats.') + '</div>' +
        '</div>' +
        '<div class="feedback-grid">' +
          '<div class="feedback-box"><h3>Regles dures</h3>' + renderMicrorepteList(rubric.hard_rules, 'Sense regles dures.') + '</div>' +
          '<div class="feedback-box"><h3>Alineació d’origen</h3>' + renderMicrorepteList(challenge.source_alignment, 'Sense alineació documentada.') + '</div>' +
        '</div>' +
        '<div class="file-note">Fitxers: ' + escapeHtml(microrepte.files?.challenge || '') + ' · ' + escapeHtml(microrepte.files?.rubric || '') + ' · ' + escapeHtml(microrepte.files?.prompt || '') + '</div>' +
        '<div><h3>Prompt</h3><div class="markdown-preview">' + escapeHtml(microrepte.prompt || '') + '</div></div>' +
        '<div class="feedback-grid">' +
          '<div><h3>challenge.json</h3><div class="json-preview">' + escapeHtml(JSON.stringify(challenge, null, 2)) + '</div></div>' +
          '<div><h3>rubric.json</h3><div class="json-preview">' + escapeHtml(JSON.stringify(rubric, null, 2)) + '</div></div>' +
        '</div>' +
        '<div id="microrepteEditContainer"></div>';
      attachMicrorepteDetailListeners(microrepte);
    }

    async function showMicrorepteDetail(challengeId) {
      const viewer = document.querySelector('#microrepteViewer');
      viewer.innerHTML = '<div class="viewer-empty">Carregant microrepte...</div>';

      try {
        const response = await fetch('/api/microreptes/' + encodeURIComponent(challengeId));
        const microrepte = await response.json();
        if (!response.ok) throw new Error(microrepte.error || 'No s’ha pogut carregar el microrepte.');
        renderMicrorepteDetail(microrepte);
      } catch (error) {
        viewer.innerHTML = '<div class="viewer-empty error">' + escapeHtml(error.message) + '</div>';
      }
    }

    async function editMicrorepteFromTable(challengeId) {
      const viewer = document.querySelector('#microrepteViewer');
      viewer.innerHTML = '<div class="viewer-empty">Carregant edició...</div>';

      try {
        const response = await fetch('/api/microreptes/' + encodeURIComponent(challengeId));
        const microrepte = await response.json();
        if (!response.ok) throw new Error(microrepte.error || 'No s’ha pogut carregar el microrepte.');
        renderMicrorepteDetail(microrepte);
        document.querySelector('#editMicrorepte')?.click();
      } catch (error) {
        viewer.innerHTML = '<div class="viewer-empty error">' + escapeHtml(error.message) + '</div>';
      }
    }

    function clearViewer() {
      document.querySelector('#resultViewer').innerHTML = '<div class="viewer-empty">Selecciona un resultat amb el botó Veure.</div>';
    }

    function renderGradeDetail(detail) {
      const grade = detail.grade || {};
      const result = detail.result || {};
      const score = result.final_score_over_10 ?? grade.score ?? '-';
      const confidence = result.confidence ?? grade.confidence ?? 0;
      const reviewRequired = Boolean(result.teacher_review_required ?? grade.teacher_review_required);
      const markdown = detail.markdown || result.short_feedback_md || grade.feedback || '';
      const flags = result.blocking_flags || [];

      document.querySelector('#resultViewer').innerHTML =
        '<div class="result-header">' +
          '<div class="metric"><span>Repositori</span><strong><code>' + escapeHtml(grade.repo) + '</code></strong><p class="status">' + escapeHtml(grade.challenge_id) + '</p></div>' +
          '<div class="metric"><span>Nota</span><strong class="' + getScoreClass(Number(score) || 0) + '">' + escapeHtml(score) + '/10</strong></div>' +
          '<div class="metric"><span>Confiança</span><strong>' + Math.round((Number(confidence) || 0) * 100) + '%</strong></div>' +
          '<div class="metric"><span>Revisió</span><strong class="' + (reviewRequired ? 'error' : 'ok') + '">' + (reviewRequired ? 'Sí' : 'No') + '</strong></div>' +
        '</div>' +
        '<div class="file-note">Resultat: ' + escapeHtml(detail.files?.result || 'no disponible') + '</div>' +
        '<div>' +
          '<h3>Dimensions</h3>' +
          renderDimensions(result.dimension_scores) +
        '</div>' +
        '<div class="feedback-grid">' +
          '<div class="feedback-box"><h3>Punts forts</h3>' + renderList(result.strengths, 'Sense punts forts detallats.') + '</div>' +
          '<div class="feedback-box"><h3>Millores recomanades</h3>' + renderList(result.weaknesses, 'Sense millores detallades.') + '</div>' +
        '</div>' +
        '<div class="feedback-box"><h3>Flags bloquejants</h3>' + renderList(flags, 'Sense flags bloquejants.') + '</div>' +
        '<div>' +
          '<h3>Feedback complet</h3>' +
          '<div class="markdown-preview">' + escapeHtml(markdown) + '</div>' +
        '</div>';
    }

    async function showGradeDetail(gradeId) {
      const viewer = document.querySelector('#resultViewer');
      viewer.innerHTML = '<div class="viewer-empty">Carregant resultat...</div>';

      try {
        const response = await fetch('/api/grades/' + encodeURIComponent(gradeId));
        const detail = await response.json();
        if (!response.ok) throw new Error(detail.error || 'No s’ha pogut carregar el resultat.');
        renderGradeDetail(detail);
      } catch (error) {
        viewer.innerHTML = '<div class="viewer-empty error">' + escapeHtml(error.message) + '</div>';
      }
    }

    function clearStudentForm() {
      editingStudentId = null;
      document.querySelector('#studentName').value = '';
      document.querySelector('#studentRepo').value = '';
      document.querySelector('#studentGroup').value = '2DAW-A';
      document.querySelector('#saveStudent').textContent = 'Guardar';
      document.querySelector('#studentStatus').textContent = '';
    }

    function editStudent(studentId) {
      const student = students.find((item) => String(item.id) === String(studentId));
      if (!student) return;

      editingStudentId = student.id;
      document.querySelector('#studentName').value = student.student_name || '';
      document.querySelector('#studentRepo').value = student.repo || '';
      document.querySelector('#studentGroup').value = student.group_name || '2DAW-A';
      document.querySelector('#saveStudent').textContent = 'Actualitzar';
      document.querySelector('#studentStatus').textContent = 'Editant ' + (student.student_name || student.repo);
    }

    async function deleteStudentRow(studentId) {
      const student = students.find((item) => String(item.id) === String(studentId));
      if (!student) return;

      if (!confirm('Eliminar ' + (student.student_name || student.repo) + '?')) {
        return;
      }

      const response = await fetch('/api/students/' + encodeURIComponent(studentId), { method: 'DELETE' });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'No s’ha pogut eliminar l’alumne.');
      clearStudentForm();
      await loadStudents();
    }

    async function loadStudents() {
      const group = document.querySelector('#studentFilterGroup').value;
      const search = document.querySelector('#studentSearch').value;
      const params = new URLSearchParams();
      if (group) params.append('group', group);
      if (search) params.append('search', search);

      try {
        const response = await fetch('/api/students?' + params.toString());
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || 'No s’han pogut carregar els alumnes.');
        students = payload.students || [];
        const rows = students.map((student) => (
          '<tr>' +
            '<td>' + escapeHtml(student.student_name || '') + '</td>' +
            '<td><code>' + escapeHtml(student.repo || '') + '</code></td>' +
            '<td>' + escapeHtml(student.group_name || '') + '</td>' +
            '<td>' + escapeHtml(student.grade_count ?? 0) + '</td>' +
            '<td><div class="compact-actions">' +
              '<button class="secondary" type="button" data-student-edit="' + escapeHtml(student.id) + '">Editar</button>' +
              '<button class="secondary" type="button" data-student-delete="' + escapeHtml(student.id) + '">Eliminar</button>' +
            '</div></td>' +
          '</tr>'
        ));
        document.querySelector('#studentRows').innerHTML = rows.length ? rows.join('') : '<tr><td colspan="5">No hi ha alumnes.</td></tr>';
        document.querySelectorAll('[data-student-edit]').forEach((button) => {
          button.addEventListener('click', () => editStudent(button.dataset.studentEdit));
        });
        document.querySelectorAll('[data-student-delete]').forEach((button) => {
          button.addEventListener('click', async () => {
            try {
              await deleteStudentRow(button.dataset.studentDelete);
              document.querySelector('#studentStatus').innerHTML = '<span class="ok">Alumne eliminat.</span>';
            } catch (error) {
              document.querySelector('#studentStatus').innerHTML = '<span class="error">' + escapeHtml(error.message) + '</span>';
            }
          });
        });
        document.querySelector('#studentStatus').textContent = 'Mostrant ' + students.length + ' alumnes';
      } catch (error) {
        document.querySelector('#studentStatus').innerHTML = '<span class="error">' + escapeHtml(error.message) + '</span>';
      }
    }

    async function saveStudent() {
      const status = document.querySelector('#studentStatus');
      const student = {
        student_name: document.querySelector('#studentName').value,
        repo: document.querySelector('#studentRepo').value,
        group_name: document.querySelector('#studentGroup').value
      };
      const url = editingStudentId ? '/api/students/' + encodeURIComponent(editingStudentId) : '/api/students';
      const method = editingStudentId ? 'PUT' : 'POST';

      try {
        const response = await fetch(url, {
          method,
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(student)
        });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || 'No s’ha pogut guardar l’alumne.');
        clearStudentForm();
        await loadStudents();
        status.innerHTML = '<span class="ok">Alumne guardat.</span>';
      } catch (error) {
        status.innerHTML = '<span class="error">' + escapeHtml(error.message) + '</span>';
      }
    }

    async function importStudents() {
      const status = document.querySelector('#studentStatus');
      try {
        const response = await fetch('/api/students/import-course', { method: 'POST' });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || 'No s’han pogut importar els alumnes.');
        await loadStudents();
        status.innerHTML = '<span class="ok">Alumnes importats des de course.</span>';
      } catch (error) {
        status.innerHTML = '<span class="error">' + escapeHtml(error.message) + '</span>';
      }
    }

    async function syncStudents() {
      const status = document.querySelector('#studentStatus');
      try {
        const response = await fetch('/api/students/sync-course', { method: 'POST' });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || 'No s’han pogut sincronitzar els fitxers.');
        await loadConfig();
        status.innerHTML = '<span class="ok">Fitxers course sincronitzats (' + payload.students + ' alumnes).</span>';
      } catch (error) {
        status.innerHTML = '<span class="error">' + escapeHtml(error.message) + '</span>';
      }
    }

    function refreshMicrorepteRepteFilter() {
      const select = document.querySelector('#microrepteFilterRepte');
      const current = select.value;
      const reptes = [...new Set(microreptes.map((microrepte) => microrepte.repte_id).filter(Boolean))].sort();
      select.innerHTML = '<option value="">Tots</option>' + reptes.map((repte) => (
        '<option value="' + escapeHtml(repte) + '">' + escapeHtml(repte) + '</option>'
      )).join('');
      select.value = reptes.includes(current) ? current : '';
    }

    function renderMicrorepteRows() {
      const repte = document.querySelector('#microrepteFilterRepte').value;
      const search = document.querySelector('#microrepteSearch').value.trim().toLowerCase();
      const filtered = microreptes.filter((microrepte) => {
        const matchesRepte = !repte || microrepte.repte_id === repte;
        const haystack = [
          microrepte.id,
          microrepte.repte_id,
          microrepte.session_code,
          microrepte.microrepte_code,
          microrepte.title
        ].join(' ').toLowerCase();
        return matchesRepte && (!search || haystack.includes(search));
      });

      const rows = filtered.map((microrepte) => (
        '<tr>' +
          '<td><code>' + escapeHtml(microrepte.repte_id || '') + '</code></td>' +
          '<td>' + escapeHtml(microrepte.session_code || '') + '</td>' +
          '<td>' + escapeHtml(microrepte.microrepte_code || '') + '</td>' +
          '<td>' + escapeHtml(microrepte.title || '') + '</td>' +
          '<td>' + formatPercent(microrepte.repte_weight) + '</td>' +
          '<td>' + escapeHtml(microrepte.dimension_count) + ' dims · ' + escapeHtml(microrepte.dimension_weight_sum) + '</td>' +
          '<td>' + renderMicrorepteValidation(microrepte.validation) + '</td>' +
          '<td><div class="compact-actions">' +
            '<button class="secondary" type="button" data-microrepte-id="' + escapeHtml(microrepte.id) + '">Veure</button>' +
            '<button type="button" data-microrepte-edit="' + escapeHtml(microrepte.id) + '">Editar</button>' +
          '</div></td>' +
        '</tr>'
      ));

      document.querySelector('#microrepteRows').innerHTML = rows.length ? rows.join('') : '<tr><td colspan="8">No hi ha microreptes.</td></tr>';
      document.querySelectorAll('[data-microrepte-id]').forEach((button) => {
        button.addEventListener('click', () => showMicrorepteDetail(button.dataset.microrepteId));
      });
      document.querySelectorAll('[data-microrepte-edit]').forEach((button) => {
        button.addEventListener('click', () => editMicrorepteFromTable(button.dataset.microrepteEdit));
      });
      document.querySelector('#microreptesInfo').textContent = 'Mostrant ' + filtered.length + ' de ' + microreptes.length + ' microreptes';
    }

    async function loadMicroreptes() {
      try {
        const response = await fetch('/api/microreptes');
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || 'No s’han pogut carregar els microreptes.');
        microreptes = payload.microreptes || [];
        refreshMicrorepteRepteFilter();
        renderMicrorepteRows();
      } catch (error) {
        document.querySelector('#microreptesInfo').innerHTML = '<span class="error">' + escapeHtml(error.message) + '</span>';
      }
    }

    function refreshTable() {
      const target = document.querySelector('#targetGroup').value;
      const entry = config.repositories_by_target[target];
      document.querySelector('#selectedFile').textContent = 'Fitxer: ' + entry.file;
      const rows = entry.repositories.map((item) => {
        const group = item.group || (target === 'all' ? '' : target);
        return '<tr><td><code>' + escapeHtml(item.repo) + '</code></td><td>' + escapeHtml(group || 'n/d') + '</td><td><code>' + escapeHtml(challengeFor(item.repo, group)) + '</code></td></tr>';
      });
      document.querySelector('#repoRows').innerHTML = rows.length ? rows.join('') : '<tr><td colspan="3">No hi ha repositoris en aquest fitxer.</td></tr>';
    }

    async function loadConfig() {
      const response = await fetch('/api/config');
      config = await response.json();
      document.querySelector('#githubStatus').innerHTML =
        'GitHub: <code>' + config.github.owner + '/' + config.github.repo + '@' + config.github.ref + '</code> · Token configurat: ' +
        (config.github.token_configured ? '<span class="ok">sí</span>' : '<span class="error">no</span>');
      refreshTable();
    }

    async function loadChallenges() {
      try {
        const response = await fetch('/api/challenges');
        const data = await response.json();
        allChallenges = data.challenges || [];
        const select = document.querySelector('#filterChallenge');
        const current = select.value;
        select.innerHTML = '<option value="">Tots</option>' + 
          allChallenges.map(c => '<option value="' + escapeHtml(c.challenge_id) + '">' + escapeHtml(c.challenge_id) + '</option>').join('');
        select.value = current;
      } catch (error) {
        console.error('Error cargando reptes:', error);
      }
    }

    async function loadGrades() {
      const group = document.querySelector('#filterGroup').value;
      const challenge = document.querySelector('#filterChallenge').value;
      const repo = document.querySelector('#filterRepo').value;

      const params = new URLSearchParams();
      if (group) params.append('group', group);
      if (challenge) params.append('challenge', challenge);
      if (repo) params.append('repo', repo);

      try {
        const response = await fetch('/api/grades?' + params.toString());
        const payload = await response.json();
        const grades = payload.grades || [];
        const rows = grades.slice(0, 100).map((grade) => {
          const scoreClass = getScoreClass(grade.score || 0);
          const reviewClass = grade.teacher_review_required ? 'review-required' : '';
          return '<tr class="' + reviewClass + '">' +
            '<td>' + formatTimestamp(grade.timestamp) + '</td>' +
            '<td><code>' + escapeHtml(grade.repo || '') + '</code></td>' +
            '<td>' + escapeHtml(grade.group_name || '') + '</td>' +
            '<td><code>' + escapeHtml(grade.challenge_id || '') + '</code></td>' +
            '<td class="' + scoreClass + '">' + escapeHtml(grade.score ?? '-') + '</td>' +
            '<td>' + Math.round((grade.confidence || 0) * 100) + '%</td>' +
            '<td>' + escapeHtml(grade.source || '') + '</td>' +
            '<td><button class="secondary" type="button" data-grade-id="' + escapeHtml(grade.id) + '">Veure</button></td>' +
            '</tr>';
        });
        document.querySelector('#gradeRows').innerHTML = rows.length ? rows.join('') : '<tr><td colspan="8">No hi ha resultats.</td></tr>';
        document.querySelectorAll('[data-grade-id]').forEach((button) => {
          button.addEventListener('click', () => showGradeDetail(button.dataset.gradeId));
        });
        document.querySelector('#gradesInfo').textContent = 'Mostrant ' + grades.length + ' resultats';
      } catch (error) {
        document.querySelector('#gradesInfo').textContent = 'Error: ' + error.message;
      }
    }

    async function runWorkflow() {
      const button = document.querySelector('#runButton');
      const status = document.querySelector('#runStatus');
      button.disabled = true;
      status.className = 'status';
      status.textContent = 'Llançant...';
      try {
        const body = {
          target_group: document.querySelector('#targetGroup').value,
          mode: document.querySelector('#mode').value,
          student_ref: document.querySelector('#studentRef').value,
          publish_to_student_repo: document.querySelector('#publish').value === 'true',
          repositories: document.querySelector('#repositories').value
        };
        const response = await fetch('/api/run', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(body)
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Error desconegut');
        status.innerHTML = '<span class="ok">Workflow llançat.</span> <a href="' + result.actions_url + '" target="_blank" rel="noreferrer">Obrir Actions</a>';
        await loadGrades();
      } catch (error) {
        status.innerHTML = '<span class="error">' + error.message + '</span>';
      } finally {
        button.disabled = false;
      }
    }

    document.querySelector('#targetGroup').addEventListener('change', refreshTable);
    document.querySelectorAll('[data-nav-view]').forEach((button) => {
      button.addEventListener('click', () => showView(button.dataset.navView));
    });
    document.querySelector('#runButton').addEventListener('click', runWorkflow);
    document.querySelector('#refreshGrades').addEventListener('click', () => loadGrades());
    document.querySelector('#applyFilters').addEventListener('click', () => loadGrades());
    document.querySelector('#clearViewer').addEventListener('click', clearViewer);
    document.querySelector('#saveStudent').addEventListener('click', saveStudent);
    document.querySelector('#clearStudentForm').addEventListener('click', clearStudentForm);
    document.querySelector('#applyStudentFilters').addEventListener('click', loadStudents);
    document.querySelector('#importStudents').addEventListener('click', importStudents);
    document.querySelector('#syncStudents').addEventListener('click', syncStudents);
    document.querySelector('#refreshMicroreptes').addEventListener('click', loadMicroreptes);
    document.querySelector('#applyMicrorepteFilters').addEventListener('click', renderMicrorepteRows);
    document.querySelector('#clearMicrorepteViewer').addEventListener('click', clearMicrorepteViewer);
    document.querySelector('#refreshProgramacio').addEventListener('click', loadProgramacio);
    document.querySelector('#applyProgramacioFilter').addEventListener('click', renderProgramacio);
    document.querySelector('#programacioFilterRepte').addEventListener('change', renderProgramacio);
    document.querySelector('#filterGroup').addEventListener('change', () => {
      document.querySelector('#filterChallenge').value = '';
    });

    loadConfig().catch((error) => {
      document.querySelector('#runStatus').innerHTML = '<span class="error">' + error.message + '</span>';
    });
    loadChallenges().catch(() => {});
    loadGrades().catch(() => {});
  </script>
</body>
</html>`;
}

async function handleRequest(request, response) {
  const url = new URL(request.url, 'http://localhost');

  try {
    if (request.method === 'GET' && url.pathname === '/') {
      sendHtml(response, pageHtml());
      return;
    }

    if (request.method === 'GET' && url.pathname === '/api/config') {
      sendJson(response, 200, await buildConfigPayload());
      return;
    }

    if (request.method === 'GET' && url.pathname === '/api/grades') {
      const filters = {};
      if (url.searchParams.has('group')) filters.group_name = url.searchParams.get('group');
      if (url.searchParams.has('challenge')) filters.challenge_id = url.searchParams.get('challenge');
      if (url.searchParams.has('repo')) filters.repo = url.searchParams.get('repo');
      sendJson(response, 200, { grades: await readLatestGrades(filters) });
      return;
    }

    if (request.method === 'GET' && url.pathname === '/api/microreptes') {
      const microreptes = await readMicroreptes();
      sendJson(response, 200, { microreptes });
      return;
    }

    const microrepteMatch = url.pathname.match(/^\/api\/microreptes\/([^/]+)$/);
    if (request.method === 'GET' && microrepteMatch) {
      const microrepte = await readMicrorepteDetail(decodeURIComponent(microrepteMatch[1]));
      if (!microrepte) {
        sendJson(response, 404, { error: 'Microrepte no trobat' });
        return;
      }

      sendJson(response, 200, microrepte);
      return;
    }

    if (request.method === 'PUT' && microrepteMatch) {
      const body = await readRequestJson(request);
      const microrepte = await updateMicrorepte(decodeURIComponent(microrepteMatch[1]), body);
      sendJson(response, 200, microrepte);
      return;
    }

    const gradeDetailMatch = url.pathname.match(/^\/api\/grades\/(\d+)$/);
    if (request.method === 'GET' && gradeDetailMatch) {
      const detail = await readGradeDetail(Number(gradeDetailMatch[1]));
      if (!detail) {
        sendJson(response, 404, { error: 'Resultat no trobat' });
        return;
      }

      sendJson(response, 200, detail);
      return;
    }

    if (request.method === 'GET' && url.pathname === '/api/students') {
      const students = getStudents({
        group_name: url.searchParams.get('group') || null,
        search: url.searchParams.get('search') || null
      });
      sendJson(response, 200, { students });
      return;
    }

    if (request.method === 'POST' && url.pathname === '/api/students') {
      const body = await readRequestJson(request);
      const student = validateStudentPayload(body);
      upsertStudent(student.repo, student.group_name, student.student_name);
      sendJson(response, 200, { student });
      return;
    }

    const studentMatch = url.pathname.match(/^\/api\/students\/(\d+)$/);
    if (studentMatch && request.method === 'PUT') {
      const body = await readRequestJson(request);
      const student = validateStudentPayload(body);
      updateStudent(Number(studentMatch[1]), student);
      sendJson(response, 200, { student });
      return;
    }

    if (studentMatch && request.method === 'DELETE') {
      const result = deleteStudent(Number(studentMatch[1]));
      sendJson(response, 200, { deleted: result.changes > 0 });
      return;
    }

    if (request.method === 'POST' && url.pathname === '/api/students/import-course') {
      const students = await importStudentsFromCourseFiles();
      sendJson(response, 200, { students });
      return;
    }

    if (request.method === 'POST' && url.pathname === '/api/students/sync-course') {
      const result = await syncStudentRepositoryFiles();
      sendJson(response, 200, result);
      return;
    }

    if (request.method === 'GET' && url.pathname === '/api/challenges') {
      const challenges = getChallenges();
      sendJson(response, 200, { challenges });
      return;
    }

    if (request.method === 'GET' && url.pathname === '/api/statistics') {
      const group = url.searchParams.get('group') || null;
      const stats = getStatistics(group);
      sendJson(response, 200, { statistics: stats });
      return;
    }

    if (request.method === 'POST' && url.pathname === '/api/run') {
      const body = await readRequestJson(request);
      const inputs = resolveWorkflowInputs(body);
      const result = await dispatchWorkflow(inputs);
      sendJson(response, 200, { ...result, inputs });
      return;
    }

    sendJson(response, 404, { error: 'Ruta no trobada' });
  } catch (error) {
    sendJson(response, 500, { error: error.message });
  }
}

await loadDotEnv();

// Inicialitzar BD i migrar dades si és la primera vegada
console.log('Inicialitzant BD...');
initDb();

try {
  if (getStudents().length === 0) {
    const importedStudents = await importStudentsFromCourseFiles();
    console.log(`Importats ${importedStudents.length} alumnes des dels fitxers course`);
  }
} catch (error) {
  console.warn('No s\'han pogut importar els alumnes des de course:', error.message);
}

// Migrar dades de JSON si existeix i la BD està buida
try {
  const grades = getLatestGrades(1);
  if (grades.length === 0) {
    console.log('Migrant dades de JSON a BD...');
    try {
      const jsonGrades = await readJson('grades/latest-grades.json');
      if (jsonGrades.length > 0) {
        migrateFromJson(jsonGrades);
        console.log(`Migrades ${jsonGrades.length} notes de JSON a BD`);
      }
    } catch (readError) {
      console.log('Archivo JSON no existe o no se puede leer, BD inicializada vacía');
    }
  }
} catch (error) {
  console.warn('No s\'han pogut migrar les dades:', error.message);
}

const port = Number(process.env.DASHBOARD_PORT || defaultPort);
const host = process.env.DASHBOARD_HOST || '127.0.0.1';
const server = createServer((request, response) => {
  handleRequest(request, response);
});

server.listen(port, host, () => {
  console.log(`Dashboard disponible en http://${host}:${port}`);
});

// Tancar BD al finalitzar
process.on('SIGINT', () => {
  console.log('\nTancant BD...');
  closeDb();
  process.exit(0);
});
