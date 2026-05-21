import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

function parseArgs(argv) {
  const args = {};
  const allowed = new Set(['--student', '--group', '--repo', '--commit']);

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

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, 'utf8'));
}

async function resolveChallengeId(rootDir, student, group) {
  const config = await readJson(path.join(rootDir, 'course', 'active-challenges.json'));
  const studentAssignment = student ? config.students?.[student] : null;

  if (studentAssignment?.challenge_id) {
    return studentAssignment.challenge_id;
  }

  const groupAssignment = group ? config.groups?.[group] : null;
  if (groupAssignment?.challenge_id) {
    return groupAssignment.challenge_id;
  }

  throw new Error(`No s'ha trobat microrepte actiu per a student=${student || '(sense)'} group=${group || '(sense)'}`);
}

function requireArgs(args) {
  const missing = ['student', 'group', 'repo', 'commit'].filter((key) => !args[key]);
  if (missing.length > 0) {
    throw new Error(`Falten arguments obligatoris: ${missing.map((key) => `--${key}`).join(', ')}`);
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  requireArgs(args);

  const rootDir = process.cwd();
  const challengeId = await resolveChallengeId(rootDir, args.student, args.group);
  const challengeDir = path.join(rootDir, 'microreptes', challengeId);

  const [policies, challenge, rubric] = await Promise.all([
    readJson(path.join(rootDir, 'global', 'policies.json')),
    readJson(path.join(challengeDir, 'challenge.json')),
    readJson(path.join(challengeDir, 'rubric.json'))
  ]);

  const payload = {
    student: args.student,
    group: args.group,
    repo: args.repo,
    commit: args.commit,
    challenge_id: challengeId,
    challenge_title: challenge.title,
    rubric_id: rubric.rubric_id,
    policies_version: policies.version,
    expected_signals: challenge.expected_signals,
    required_evidence: challenge.required_evidence,
    dimensions: rubric.dimensions
  };

  const outputDir = path.join(rootDir, 'tmp');
  const outputPath = path.join(outputDir, 'evaluation-payload.json');
  const formatted = `${JSON.stringify(payload, null, 2)}\n`;

  await mkdir(outputDir, { recursive: true });
  await writeFile(outputPath, formatted, 'utf8');
  console.log(formatted.trimEnd());
}

main().catch((error) => {
  console.error(`No s'ha pogut construir el payload d'avaluacio: ${error.message}`);
  process.exit(1);
});
