import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
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
      const [repo, group = ''] = line.split(/\s+/);
      return { repo, group };
    });
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

async function readLatestGrades() {
  try {
    const grades = await readJson('grades/latest-grades.json');
    return Array.isArray(grades) ? grades.slice().reverse() : [];
  } catch (error) {
    if (error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
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
    h1 { font-size: 22px; margin: 0; }
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
    @media (max-width: 820px) {
      main { padding: 14px; }
      .grid { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <header>
    <h1>DWES Autocorrecció</h1>
  </header>
  <main>
    <section>
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

    <section>
      <h2>Repositoris seleccionats</h2>
      <table>
        <thead><tr><th>Repositori</th><th>Grup</th><th>Autocorrecció</th></tr></thead>
        <tbody id="repoRows"></tbody>
      </table>
    </section>

    <section>
      <div class="toolbar">
        <h2>Últims resultats</h2>
        <button id="refreshGrades" type="button">Actualitzar</button>
      </div>
      <table>
        <thead><tr><th>Data</th><th>Repo</th><th>Grup</th><th>Repte</th><th>Nota</th><th>Mode</th><th>Historial</th></tr></thead>
        <tbody id="gradeRows"></tbody>
      </table>
    </section>

    <section>
      <h2>Configuració</h2>
      <p class="status" id="githubStatus"></p>
    </section>
  </main>
  <script>
    let config = null;

    function challengeFor(repo, group) {
      const student = config.active_challenges.students[repo];
      if (student && student.challenge_id) return student.challenge_id;
      const groupConfig = config.active_challenges.groups[group];
      return groupConfig && groupConfig.challenge_id ? groupConfig.challenge_id : 'sense assignació';
    }

    function refreshTable() {
      const target = document.querySelector('#targetGroup').value;
      const entry = config.repositories_by_target[target];
      document.querySelector('#selectedFile').textContent = 'Fitxer: ' + entry.file;
      const rows = entry.repositories.map((item) => {
        const group = item.group || (target === 'all' ? '' : target);
        return '<tr><td><code>' + item.repo + '</code></td><td>' + (group || 'n/d') + '</td><td><code>' + challengeFor(item.repo, group) + '</code></td></tr>';
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

    async function loadGrades() {
      const response = await fetch('/api/grades');
      const payload = await response.json();
      const grades = payload.grades || [];
      const rows = grades.slice(0, 50).map((grade) => {
        const history = grade.history_dir ? '<code>' + grade.history_dir + '</code>' : '';
        return '<tr><td>' + (grade.timestamp || '') + '</td><td><code>' + (grade.repo || grade.student || '') + '</code></td><td>' + (grade.group || '') + '</td><td><code>' + (grade.challenge_id || '') + '</code></td><td>' + (grade.score ?? '') + '</td><td>' + (grade.source || '') + '</td><td>' + history + '</td></tr>';
      });
      document.querySelector('#gradeRows').innerHTML = rows.length ? rows.join('') : '<tr><td colspan="7">Encara no hi ha resultats guardats.</td></tr>';
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
    document.querySelector('#runButton').addEventListener('click', runWorkflow);
    document.querySelector('#refreshGrades').addEventListener('click', loadGrades);
    loadConfig().catch((error) => {
      document.querySelector('#runStatus').innerHTML = '<span class="error">' + error.message + '</span>';
    });
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
      sendJson(response, 200, { grades: await readLatestGrades() });
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

const port = Number(process.env.DASHBOARD_PORT || defaultPort);
const host = process.env.DASHBOARD_HOST || '127.0.0.1';
const server = createServer((request, response) => {
  handleRequest(request, response);
});

server.listen(port, host, () => {
  console.log(`Dashboard disponible en http://${host}:${port}`);
});
