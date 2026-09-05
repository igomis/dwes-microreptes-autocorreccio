import { execFile } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const rootDir = process.cwd();
const courseDir = path.join(rootDir, 'course');
const ghBin = process.env.GH_BIN || 'gh';
const validPermissions = new Set(['pull', 'push', 'maintain', 'admin']);

const allowedArgs = new Set([
  '--input',
  '--org',
  '--template',
  '--repo-prefix',
  '--default-group',
  '--permission',
  '--dry-run',
  '--no-invite',
  '--help'
]);

function parseArgs(argv) {
  const args = {
    'repo-prefix': 'microreptes-',
    permission: 'push',
    'default-group': ''
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!allowedArgs.has(arg)) {
      throw new Error(`Argument no reconegut: ${arg}`);
    }

    if (arg === '--dry-run' || arg === '--no-invite' || arg === '--help') {
      args[arg.slice(2)] = true;
      continue;
    }

    const value = argv[index + 1];
    if (!value || value.startsWith('--')) {
      throw new Error(`Falta valor per a ${arg}`);
    }

    args[arg.slice(2)] = value;
    index += 1;
  }

  return args;
}

function githubCliEnv() {
  const env = { ...process.env };
  if (!env.GH_TOKEN) {
    delete env.GITHUB_TOKEN;
  }
  return env;
}

function printUsage() {
  console.log(`Ús:
node scripts/create-student-repos.mjs \\
  --input alumnes.csv \\
  --org batoi-dwes-2026 \\
  --template igomis/dwes-microreptes-alumnes \\
  [--repo-prefix microreptes-] \\
  [--default-group 2DAW-A] \\
  [--permission push] \\
  [--dry-run] \\
  [--no-invite]

CSV esperat, amb capçalera:
github_user,group,student_name
alumne01,2DAW-A,Ana Marti
alumne02,2DAW-B,Pau Garcia

També s'accepta sense capçalera, amb este ordre:
alumne01,2DAW-A,Ana Marti
alumne02,2DAW-B,Pau Garcia

Columnes acceptades:
- github_user, user, username o login
- group, grup o group_name
- student_name, nom o name
- repo o repository, opcional
`);
}

const headerAliases = new Set([
  'github_user',
  'user',
  'username',
  'login',
  'group',
  'grup',
  'group_name',
  'student_name',
  'nom',
  'name',
  'repo',
  'repository'
]);

function parseCsvLine(line) {
  const values = [];
  let value = '';
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"' && quoted && next === '"') {
      value += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      quoted = !quoted;
      continue;
    }

    if (char === ',' && !quoted) {
      values.push(value.trim());
      value = '';
      continue;
    }

    value += char;
  }

  values.push(value.trim());
  return values;
}

function parseCsv(content) {
  const lines = String(content || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'));

  if (lines.length === 0) {
    return [];
  }

  const firstLine = parseCsvLine(lines[0]).map((header) => header.trim().toLowerCase());
  const hasHeader = firstLine.every((header) => headerAliases.has(header));
  const headers = hasHeader ? firstLine : ['github_user', 'group', 'student_name'];
  const dataLines = hasHeader ? lines.slice(1) : lines;
  const firstDataLine = hasHeader ? 2 : 1;

  return dataLines.map((line, index) => {
    const values = parseCsvLine(line);
    const row = {};
    headers.forEach((header, headerIndex) => {
      row[header] = values[headerIndex] || '';
    });
    row.__line = index + firstDataLine;
    return row;
  });
}

function pick(row, names) {
  for (const name of names) {
    const value = String(row[name] || '').trim();
    if (value) {
      return value;
    }
  }
  return '';
}

function normalizeGroup(group) {
  return String(group || '').trim().toUpperCase();
}

function groupFileName(group) {
  const suffix = normalizeGroup(group).toLowerCase().replace(/[^a-z0-9]/g, '');
  return `student-repositories-${suffix}.txt`;
}

function sanitizeRepoName(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function parseRepositoryLines(content) {
  const rows = [];

  for (const line of String(content || '').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const [repo, group, ...nameParts] = trimmed.split(/\s+/);
    if (repo && group) {
      rows.push({
        repo,
        group: normalizeGroup(group),
        name: nameParts.join(' ')
      });
    }
  }

  return rows;
}

async function readRepositoryRows(filePath) {
  try {
    return parseRepositoryLines(await readFile(filePath, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

function repositoryLine(row) {
  return [row.repo, row.group, row.name].filter(Boolean).join(' ');
}

async function writeRepositoryFile(filePath, title, rows) {
  const uniqueRows = new Map();
  for (const row of rows) {
    uniqueRows.set(row.repo, row);
  }

  const sortedRows = [...uniqueRows.values()]
    .sort((left, right) => [left.group, left.name, left.repo].join('\u0000')
      .localeCompare([right.group, right.name, right.repo].join('\u0000'), 'ca', { numeric: true, sensitivity: 'base' }));

  const content = [
    `# ${title}`,
    '# Format: repositori grup nom',
    '',
    ...sortedRows.map(repositoryLine),
    ''
  ].join('\n');

  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, content, 'utf8');
}

async function updateCourseRepositoryFiles(students, dryRun) {
  const allPath = path.join(courseDir, 'student-repositories.txt');
  const existingAllRows = await readRepositoryRows(allPath);
  const newRows = students.map((student) => ({
    repo: student.fullRepo,
    group: student.group,
    name: student.studentName
  }));

  const allRows = [...existingAllRows, ...newRows];
  const groupRows = new Map();
  for (const row of allRows) {
    const group = normalizeGroup(row.group);
    if (!groupRows.has(group)) {
      groupRows.set(group, []);
    }
    groupRows.get(group).push({ ...row, group });
  }

  if (dryRun) {
    console.log("DRY RUN: s'actualitzarien els fitxers course/student-repositories*.txt");
    for (const [group, rows] of groupRows.entries()) {
      console.log(`- ${group}: ${rows.length} repositoris`);
    }
    return;
  }

  await writeRepositoryFile(
    allPath,
    'Repositoris de tots els grups per a correccio massiva.',
    allRows
  );

  for (const [group, rows] of groupRows.entries()) {
    await writeRepositoryFile(
      path.join(courseDir, groupFileName(group)),
      `Repositoris d'alumnes de ${group} per a correccio massiva.`,
      rows
    );
  }
}

async function runGh(command, args, dryRun) {
  const rendered = [ghBin, command, ...args].join(' ');
  if (dryRun) {
    console.log(`DRY RUN: ${rendered}`);
    return;
  }

  console.log(rendered);
  try {
    await execFileAsync(ghBin, [command, ...args], {
      cwd: rootDir,
      env: githubCliEnv()
    });
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(`No s'ha trobat GitHub CLI (${ghBin}). Instal·la gh al servidor o configura GH_BIN=/ruta/al/gh en .env.`);
    }
    throw error;
  }
}

function formatCommandError(error) {
  return [error.stderr, error.stdout, error.message]
    .map((value) => String(value || '').trim())
    .filter(Boolean)
    .join('\n');
}

async function runGhChecked(command, args, dryRun, failureMessage) {
  try {
    return await runGh(command, args, dryRun);
  } catch (error) {
    const details = formatCommandError(error);
    throw new Error(`${failureMessage}${details ? `\n${details}` : ''}`);
  }
}

async function repositoryIsAccessible(student, dryRun) {
  try {
    await runGh('repo', ['view', student.fullRepo, '--json', 'nameWithOwner'], dryRun);
    return !dryRun;
  } catch {
    return false;
  }
}

async function assertRepositoryIsAccessible(student, dryRun) {
  await runGhChecked(
    'repo',
    ['view', student.fullRepo, '--json', 'nameWithOwner'],
    dryRun,
    `El repositori "${student.fullRepo}" no és visible per a GitHub CLI després de crear-lo. Revisa que GH_TOKEN o l'usuari autenticat amb gh tinga permisos d'administració sobre l'organització.`
  );
}

async function createRepositoryIfNeeded(student, args) {
  if (await repositoryIsAccessible(student, args['dry-run'])) {
    console.log(`Repo existent: ${student.fullRepo}`);
    return 'existing';
  }

  await runGhChecked(
    'repo',
    [
      'create',
      student.fullRepo,
      '--private',
      '--template',
      args.template
    ],
    args['dry-run'],
    `No s'ha pogut crear el repositori "${student.fullRepo}" des de la plantilla "${args.template}". Revisa permisos de creació en l'organització i accés a la plantilla.`
  );
  await assertRepositoryIsAccessible(student, args['dry-run']);
  return 'created';
}

async function inviteCollaborator(student, args) {
  await runGhChecked(
    'api',
    [
      '--method',
      'PUT',
      `repos/${student.fullRepo}/collaborators/${student.githubUser}`,
      '-f',
      `permission=${args.permission}`
    ],
    args['dry-run'],
    `No s'ha pogut donar permís "${args.permission}" a "${student.githubUser}" en "${student.fullRepo}". Si GitHub retorna 404, normalment és perquè el token no té permisos d'administració sobre el repositori privat, el repositori no és visible per a eixe token, o el login de l'alumne no existeix.`
  );
}

async function tryInviteCollaborator(student, args) {
  if (args['no-invite']) {
    return { status: 'skipped' };
  }

  try {
    await runGhChecked(
      'api',
      ['users/' + student.githubUser, '--jq', '.login'],
      args['dry-run'],
      `No s'ha pogut trobar l'usuari GitHub "${student.githubUser}". Revisa el login del CSV.`
    );
    await inviteCollaborator(student, args);
    return { status: 'invited' };
  } catch (error) {
    return {
      status: 'failed',
      error: error.message
    };
  }
}

function buildStudents(rows, args) {
  return rows.map((row) => {
    const githubUser = pick(row, ['github_user', 'user', 'username', 'login']);
    const group = normalizeGroup(pick(row, ['group', 'grup', 'group_name']) || args['default-group']);
    const studentName = pick(row, ['student_name', 'nom', 'name']);
    const explicitRepo = pick(row, ['repo', 'repository']);

    if (!githubUser) {
      throw new Error(`Línia ${row.__line}: falta github_user`);
    }

    if (!group) {
      throw new Error(`Línia ${row.__line}: falta group o --default-group`);
    }

    const repoName = sanitizeRepoName(explicitRepo || `${args['repo-prefix']}${githubUser}`);
    if (!repoName) {
      throw new Error(`Línia ${row.__line}: nom de repositori no vàlid`);
    }

    return {
      githubUser,
      group,
      studentName,
      repoName,
      fullRepo: `${args.org}/${repoName}`
    };
  });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printUsage();
    return;
  }

  if (!args.input || !args.org || !args.template) {
    printUsage();
    throw new Error('Cal indicar --input, --org i --template');
  }

  if (!validPermissions.has(args.permission)) {
    throw new Error('Permís no valid. Usa pull, push, maintain o admin.');
  }

  const rows = parseCsv(await readFile(path.resolve(args.input), 'utf8'));
  const students = buildStudents(rows, args);
  if (students.length === 0) {
    throw new Error('No hi ha cap alumne per processar en el CSV.');
  }

  const results = [];

  for (const student of students) {
    const repoStatus = await createRepositoryIfNeeded(student, args);
    const invite = await tryInviteCollaborator(student, args);
    results.push({ student, repoStatus, invite });
  }

  await updateCourseRepositoryFiles(students, args['dry-run']);

  const created = results.filter((result) => result.repoStatus === 'created').length;
  const existing = results.filter((result) => result.repoStatus === 'existing').length;
  const invited = results.filter((result) => result.invite.status === 'invited').length;
  const skipped = results.filter((result) => result.invite.status === 'skipped').length;
  const failedInvites = results.filter((result) => result.invite.status === 'failed');

  console.log(`Repositoris processats: ${students.length}`);
  console.log(`- Creats: ${created}`);
  console.log(`- Ja existien: ${existing}`);
  console.log(`- Invitacions enviades: ${invited}`);
  console.log(`- Invitacions omeses: ${skipped}`);
  console.log(`- Invitacions amb error: ${failedInvites.length}`);

  for (const result of failedInvites) {
    console.warn(`AVIS: ${result.student.fullRepo} queda registrat, però no s'ha pogut convidar ${result.student.githubUser}.`);
    console.warn(result.invite.error);
  }
}

main().catch((error) => {
  console.error(`No s'han pogut crear els repositoris d'alumnes: ${error.message}`);
  process.exit(1);
});
