import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const rootDir = process.cwd();
const microreptesDir = path.join(rootDir, 'microreptes');
const globalDir = path.join(rootDir, 'global');

const requiredDimensions = [
  'functional_resolution',
  'verification',
  'traceability',
  'documentation',
  'ai_usage',
  'code_quality'
];

async function readJson(filePath) {
  const raw = await readFile(filePath, 'utf8');
  return JSON.parse(raw);
}

async function pathExists(filePath) {
  try {
    await readFile(filePath, 'utf8');
    return true;
  } catch {
    return false;
  }
}

function validateRubricDimensions(rubric, challengeDir, errors) {
  if (!Array.isArray(rubric.dimensions)) {
    errors.push(`${challengeDir}: rubric.json no te dimensions array`);
    return;
  }

  const ids = new Set(rubric.dimensions.map((dimension) => dimension.id));
  for (const required of requiredDimensions) {
    if (!ids.has(required)) {
      errors.push(`${challengeDir}: falta la dimensio ${required}`);
    }
  }
}

async function validateGlobalFiles(errors) {
  const requiredGlobalFiles = [
    'policies.json',
    'feedback-style.md',
    'grading-schema.json'
  ];

  for (const fileName of requiredGlobalFiles) {
    const filePath = path.join(globalDir, fileName);
    if (!(await pathExists(filePath))) {
      errors.push(`global: falta ${fileName}`);
    }
  }
}

async function validateChallenge(challengeName, errors) {
  const challengeDir = path.join(microreptesDir, challengeName);
  const challengePath = path.join(challengeDir, 'challenge.json');
  const rubricPath = path.join(challengeDir, 'rubric.json');

  if (!(await pathExists(challengePath))) {
    errors.push(`${challengeName}: falta challenge.json`);
    return null;
  }

  if (!(await pathExists(rubricPath))) {
    errors.push(`${challengeName}: falta rubric.json`);
    return null;
  }

  let challenge;
  let rubric;

  try {
    challenge = await readJson(challengePath);
  } catch (error) {
    errors.push(`${challengeName}: challenge.json invalid (${error.message})`);
    return null;
  }

  try {
    rubric = await readJson(rubricPath);
  } catch (error) {
    errors.push(`${challengeName}: rubric.json invalid (${error.message})`);
    return null;
  }

  if (!challenge.challenge_id) {
    errors.push(`${challengeName}: challenge_id buit en challenge.json`);
  }

  if (challenge.challenge_id !== rubric.challenge_id) {
    errors.push(`${challengeName}: challenge_id no coincideix entre challenge.json i rubric.json`);
  }

  validateRubricDimensions(rubric, challengeName, errors);

  return {
    id: challenge.challenge_id,
    title: challenge.title || '(sense titol)'
  };
}

async function main() {
  const errors = [];
  const validChallenges = [];

  await validateGlobalFiles(errors);

  const entries = await readdir(microreptesDir, { withFileTypes: true });
  const challengeDirs = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  for (const challengeName of challengeDirs) {
    const result = await validateChallenge(challengeName, errors);
    if (result) {
      validChallenges.push(result);
    }
  }

  if (errors.length > 0) {
    console.error('Validacio fallida:');
    for (const error of errors) {
      console.error(`- ${error}`);
    }
    process.exit(1);
  }

  console.log('Configuracio valida.');
  console.log(`Microreptes validats: ${validChallenges.length}`);
  for (const challenge of validChallenges) {
    console.log(`- ${challenge.id}: ${challenge.title}`);
  }
}

main().catch((error) => {
  console.error(`Error inesperat: ${error.message}`);
  process.exit(1);
});
