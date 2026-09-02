import { cp, mkdir, readFile, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { execFile } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';
import { promisify } from 'node:util';

import { closeDb, initDb, migrateFromJson } from '../teacher-dashboard/db.mjs';

const execFileAsync = promisify(execFile);
const workflowFile = 'batch-autograde-students.yml';
const artifactName = 'batch-autograde-results';
const defaultRepo = 'igomis/dwes-microreptes-autocorreccio';

const allowedArgs = new Set([
  '--repo',
  '--run-id',
  '--download-dir',
  '--include-failed',
  '--no-db',
  '--help'
]);

function parseArgs(argv) {
  const args = {
    repo: process.env.GITHUB_FULL_REPO || defaultRepo,
    'download-dir': path.join('tmp', 'batch-autograde-results'),
    'include-failed': false,
    'no-db': false
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!allowedArgs.has(arg)) {
      throw new Error(`Argument no reconegut: ${arg}`);
    }

    if (arg === '--include-failed' || arg === '--no-db' || arg === '--help') {
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

function printUsage() {
  console.log(`Ús:
npm run grades:download-latest -- [opcions]

Opcions:
  --repo owner/repo        Repositori docent. Per defecte: ${defaultRepo}
  --run-id 123456789      Importa un run concret en lloc de l'últim correcte
  --download-dir ruta     Directori temporal de baixada
  --include-failed        Permet agafar l'últim run completat, encara que haja fallat
  --no-db                 Copia grades/ però no migra latest-grades.json a SQLite

Requisit:
  gh ha d'estar autenticat amb permís per llegir Actions del repositori docent.
`);
}

function githubCliEnv() {
  const env = { ...process.env };
  if (!env.GH_TOKEN) {
    delete env.GITHUB_TOKEN;
  }
  return env;
}

async function runGh(args, options = {}) {
  const { stdout } = await execFileAsync(process.env.GH_BIN || 'gh', args, {
    cwd: process.cwd(),
    env: githubCliEnv(),
    maxBuffer: 1024 * 1024 * 20,
    ...options
  });
  return stdout;
}

async function latestRunId(repo, includeFailed) {
  const stdout = await runGh([
    'run',
    'list',
    '--repo',
    repo,
    '--workflow',
    workflowFile,
    '--limit',
    '20',
    '--json',
    'databaseId,conclusion,status,createdAt'
  ]);
  const runs = JSON.parse(stdout);
  const completed = runs.filter((run) => run.status === 'completed');
  const selected = includeFailed
    ? completed.find((run) => ['success', 'failure'].includes(run.conclusion))
    : completed.find((run) => run.conclusion === 'success');

  if (!selected) {
    throw new Error(`No s'ha trobat cap execucio completada${includeFailed ? '' : ' amb exit'} del workflow ${workflowFile}`);
  }

  return selected.databaseId;
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, 'utf8'));
}

async function migrateDownloadedGrades(rootDir) {
  const latestGradesPath = path.join(rootDir, 'grades', 'latest-grades.json');
  if (!existsSync(latestGradesPath)) {
    console.log('No existeix grades/latest-grades.json; no hi ha notes per migrar a la BD.');
    return 0;
  }

  const grades = await readJson(latestGradesPath);
  if (!Array.isArray(grades) || grades.length === 0) {
    console.log('grades/latest-grades.json està buit; no hi ha notes per migrar a la BD.');
    return 0;
  }

  initDb();
  migrateFromJson(grades);
  closeDb();
  return grades.length;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printUsage();
    return;
  }

  const rootDir = process.cwd();
  const runId = args['run-id'] || await latestRunId(args.repo, args['include-failed']);
  const downloadDir = path.resolve(rootDir, args['download-dir']);

  await rm(downloadDir, { recursive: true, force: true });
  await mkdir(downloadDir, { recursive: true });

  await runGh([
    'run',
    'download',
    String(runId),
    '--repo',
    args.repo,
    '--name',
    artifactName,
    '--dir',
    downloadDir
  ]);

  const downloadedGradesDir = path.join(downloadDir, 'grades');
  if (!existsSync(downloadedGradesDir)) {
    throw new Error(`L'artifact ${artifactName} del run ${runId} no conte la carpeta grades/`);
  }

  await mkdir(path.join(rootDir, 'grades'), { recursive: true });
  await cp(downloadedGradesDir, path.join(rootDir, 'grades'), {
    recursive: true,
    force: true
  });

  let migrated = 0;
  if (!args['no-db']) {
    migrated = await migrateDownloadedGrades(rootDir);
  }

  console.log(`Resultats importats del run ${runId} en grades/.`);
  if (!args['no-db']) {
    console.log(`Notes sincronitzades amb la BD del dashboard: ${migrated}.`);
  }
}

main().catch((error) => {
  console.error(`No s'han pogut descarregar els resultats: ${error.message}`);
  process.exit(1);
});
