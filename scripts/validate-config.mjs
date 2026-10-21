import { readChallengeMetadata, validateExtensionOwners } from './lib/repte-extension.mjs';
import { loadModuleConfig, MODULE_CONFIG_PATH } from './lib/module-config.mjs';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const rootDir = process.cwd();
const microreptesDir = path.join(rootDir, 'microreptes');
const globalDir = path.join(rootDir, 'global');
const courseDir = path.join(rootDir, 'course');

let moduleConfig;

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

  const rubricPolicy = moduleConfig.assessment.rubric;
  const performanceDimensions = new Set(rubricPolicy.performance_dimensions);
  const ids = new Set(rubric.dimensions.map((dimension) => dimension.id));
  for (const required of rubricPolicy.required_dimensions) {
    if (!ids.has(required)) {
      errors.push(`${challengeDir}: falta la dimensio ${required}`);
    }
  }

  const dimensions = new Map(rubric.dimensions.map((dimension) => [dimension.id, Number(dimension.weight)]));
  const functionalDimension = rubricPolicy.functional_dimension;
  if (dimensions.get(functionalDimension) < Number(rubricPolicy.minimum_functional_weight)) {
    errors.push(`${challengeDir}: ${functionalDimension} ha de ponderar almenys ${Number(rubricPolicy.minimum_functional_weight) * 10} punts sobre 10`);
  }

  for (const dimension of rubric.dimensions) {
    const weight = Number(dimension.weight);
    if (!performanceDimensions.has(dimension.id) && weight > Number(rubricPolicy.maximum_check_weight)) {
      errors.push(`${challengeDir}: ${dimension.label || dimension.id} és una comprovació i no pot ponderar més de ${Number(rubricPolicy.maximum_check_weight) * 10} punts sobre 10`);
    }
  }
}

function criterionRaPrefix(criterion) {
  const match = String(criterion || '').match(/^([^.]+)/);
  return match ? match[1].toUpperCase() : null;
}

function validateRaAssessment(challenge, challengeDir, errors) {
  const microrepteCode = String(challenge?.microrepte_code || '');
  const challengePattern = new RegExp(moduleConfig.codes.challenge_pattern, 'i');
  const learningOutcomePattern = new RegExp(moduleConfig.codes.learning_outcome_pattern, 'i');

  if (!challengePattern.test(microrepteCode)) {
    return;
  }

  if (!challenge.primary_ra || !learningOutcomePattern.test(String(challenge.primary_ra))) {
    errors.push(`${challengeDir}: falta primary_ra únic per al microrepte`);
  }

  if ('context_ra' in challenge && !Array.isArray(challenge.context_ra)) {
    errors.push(`${challengeDir}: context_ra ha de ser array si està definit`);
  }

  if ('assessed_ra' in challenge) {
    errors.push(`${challengeDir}: assessed_ra ja no s'utilitza; cada microrepte qualifica un únic primary_ra`);
  }

  if (!Array.isArray(challenge.assessed_ca) || challenge.assessed_ca.length === 0) {
    errors.push(`${challengeDir}: falta assessed_ca amb els CA qualificables del RA avaluat`);
    return;
  }

  const primaryRa = String(challenge.primary_ra || '').toUpperCase();
  for (const criterion of challenge.assessed_ca) {
    if (criterionRaPrefix(criterion) !== primaryRa) {
      errors.push(`${challengeDir}: assessed_ca ${criterion} no pertany a ${primaryRa}`);
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

  if (!(await pathExists(path.join(courseDir, 'active-challenges.json')))) {
    errors.push('course: falta active-challenges.json');
  }

  for (const relativePath of [
    moduleConfig.repositories_file,
    moduleConfig.autograding.system_context_file,
    ...Object.values(moduleConfig.groups).map((group) => group.repositories_file)
  ]) {
    if (!(await pathExists(path.join(rootDir, relativePath)))) {
      errors.push(`${MODULE_CONFIG_PATH}: no existeix ${relativePath}`);
    }
  }
}

async function validateActiveChallenges(knownChallengeIds, errors) {
  const configPath = path.join(courseDir, 'active-challenges.json');
  if (!(await pathExists(configPath))) {
    return;
  }

  let config;
  try {
    config = await readJson(configPath);
  } catch (error) {
    errors.push(`course/active-challenges.json invalid (${error.message})`);
    return;
  }

  for (const [group, assignment] of Object.entries(config.groups || {})) {
    if (!Object.hasOwn(moduleConfig.groups, group)) {
      errors.push(`course/active-challenges.json: el grup ${group} no està definit en course/module.json`);
    }
    if (!assignment?.challenge_id) {
      errors.push(`course/active-challenges.json: el grup ${group} no te challenge_id`);
      continue;
    }
    if (!knownChallengeIds.has(assignment.challenge_id)) {
      errors.push(`course/active-challenges.json: el grup ${group} referencia un challenge_id inexistent (${assignment.challenge_id})`);
    }
  }

  for (const [student, assignment] of Object.entries(config.students || {})) {
    if (!assignment?.challenge_id) {
      errors.push(`course/active-challenges.json: l'alumne ${student} no te challenge_id`);
      continue;
    }
    if (!knownChallengeIds.has(assignment.challenge_id)) {
      errors.push(`course/active-challenges.json: l'alumne ${student} referencia un challenge_id inexistent (${assignment.challenge_id})`);
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

  if (!moduleConfig.assessment.extension.enabled && challenge.repte_extension) {
    errors.push(`${challengeName}: repte_extension està desactivada en course/module.json`);
  }

  validateRaAssessment(challenge, challengeName, errors);
  validateRubricDimensions(rubric, challengeName, errors);

  for (const [field, resources] of [
    ['student_resources', challenge.student_resources],
    ['completion_resources', challenge.completion_resources]
  ]) {
    if (resources === undefined) continue;
    if (!Array.isArray(resources)) {
      errors.push(`${challengeName}: ${field} ha de ser un array`);
      continue;
    }
    for (const [index, resource] of resources.entries()) {
      if (!resource?.title || (!resource?.source && !resource?.url)) {
        errors.push(`${challengeName}: ${field}[${index}] necessita title i source o url`);
        continue;
      }
      if (resource.source) {
        const resourcePath = path.resolve(rootDir, resource.source);
        if (!resourcePath.startsWith(`${rootDir}${path.sep}`) || !(await pathExists(resourcePath))) {
          errors.push(`${challengeName}: no existeix el recurs ${resource.source}`);
        }
      }
      if (field === 'completion_resources') {
        if (resource.source && (!resource.target || path.basename(resource.target) !== resource.target)) {
          errors.push(`${challengeName}: ${field}[${index}].target ha de ser un nom de fitxer`);
        }
        if (resource.url && !/^https:\/\//.test(resource.url)) {
          errors.push(`${challengeName}: ${field}[${index}].url ha d'usar HTTPS`);
        }
        const minimum = Number(resource.minimum_score);
        if (!Number.isFinite(minimum) || minimum < 0 || minimum > 10) {
          errors.push(`${challengeName}: ${field}[${index}].minimum_score ha d'estar entre 0 i 10`);
        }
      }
    }
  }

  return {
    id: challenge.challenge_id,
    title: challenge.title || '(sense titol)'
  };
}

async function main() {
  const errors = [];
  const validChallenges = [];

  try {
    moduleConfig = loadModuleConfig(rootDir);
  } catch (error) {
    errors.push(error.message);
  }

  if (!moduleConfig) {
    console.error('Validacio fallida:');
    for (const error of errors) console.error(`- ${error}`);
    process.exit(1);
  }

  await validateGlobalFiles(errors);
  if (moduleConfig.assessment.extension.enabled) {
    try {
      validateExtensionOwners(
        await readChallengeMetadata(rootDir),
        new RegExp(moduleConfig.codes.challenge_pattern, 'i')
      );
    } catch (error) {
      errors.push(error.message);
    }
  }

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

  await validateActiveChallenges(new Set(validChallenges.map((challenge) => challenge.id)), errors);

  if (errors.length > 0) {
    console.error('Validacio fallida:');
    for (const error of errors) {
      console.error(`- ${error}`);
    }
    process.exit(1);
  }

  console.log('Configuracio valida.');
  console.log(`Autocorreccions validades: ${validChallenges.length}`);
  for (const challenge of validChallenges) {
    console.log(`- ${challenge.id}: ${challenge.title}`);
  }
}

main().catch((error) => {
  console.error(`Error inesperat: ${error.message}`);
  process.exit(1);
});
