import { readFileSync } from 'node:fs';
import path from 'node:path';

export const MODULE_CONFIG_PATH = 'course/module.json';

function requiredText(value, field) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`${MODULE_CONFIG_PATH}: ${field} és obligatori`);
  }
  return value.trim();
}

function validPattern(value, field) {
  const source = requiredText(value, field);
  try {
    new RegExp(source, 'i');
  } catch (error) {
    throw new Error(`${MODULE_CONFIG_PATH}: ${field} no és una expressió regular vàlida (${error.message})`);
  }
  return source;
}

function validRelativePath(value, field) {
  const candidate = requiredText(value, field);
  if (path.isAbsolute(candidate) || candidate.split(/[\\/]/).includes('..')) {
    throw new Error(`${MODULE_CONFIG_PATH}: ${field} ha de ser una ruta relativa dins del repositori`);
  }
  return candidate;
}

function score(value, field, { min = 0, max = 10 } = {}) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < min || numeric > max) {
    throw new Error(`${MODULE_CONFIG_PATH}: ${field} ha d'estar entre ${min} i ${max}`);
  }
  return numeric;
}

export function validateModuleConfig(config) {
  if (!config || typeof config !== 'object' || Array.isArray(config)) {
    throw new Error(`${MODULE_CONFIG_PATH}: l'arrel ha de ser un objecte JSON`);
  }
  if (config.schema_version !== 1) {
    throw new Error(`${MODULE_CONFIG_PATH}: schema_version ha de ser 1`);
  }

  requiredText(config.module?.id, 'module.id');
  requiredText(config.module?.name, 'module.name');
  requiredText(config.module?.short_name, 'module.short_name');
  requiredText(config.github?.teacher_repository, 'github.teacher_repository');
  if (!/^[\w.-]+\/[\w.-]+$/.test(config.github.teacher_repository)) {
    throw new Error(`${MODULE_CONFIG_PATH}: github.teacher_repository ha de tindre format owner/repo`);
  }
  requiredText(config.github.default_ref, 'github.default_ref');
  requiredText(config.github.classroom_organization, 'github.classroom_organization');
  requiredText(config.github.student_template, 'github.student_template');
  requiredText(config.github.student_template_local_dir, 'github.student_template_local_dir');
  requiredText(config.github.student_repository_prefix, 'github.student_repository_prefix');

  validRelativePath(config.repositories_file, 'repositories_file');
  const groups = Object.entries(config.groups || {});
  if (groups.length === 0) {
    throw new Error(`${MODULE_CONFIG_PATH}: cal definir almenys un grup`);
  }
  for (const [group, settings] of groups) {
    requiredText(group, 'groups.<id>');
    validRelativePath(settings?.repositories_file, `groups.${group}.repositories_file`);
    if (settings?.grades_url_env !== undefined) {
      requiredText(settings.grades_url_env, `groups.${group}.grades_url_env`);
    }
  }

  validPattern(config.codes?.challenge_pattern, 'codes.challenge_pattern');
  validPattern(config.codes?.learning_outcome_pattern, 'codes.learning_outcome_pattern');

  const rubric = config.assessment?.rubric;
  if (typeof config.assessment?.extension?.enabled !== 'boolean') {
    throw new Error(`${MODULE_CONFIG_PATH}: assessment.extension.enabled ha de ser booleà`);
  }
  if (!Array.isArray(rubric?.required_dimensions) || rubric.required_dimensions.length === 0) {
    throw new Error(`${MODULE_CONFIG_PATH}: assessment.rubric.required_dimensions ha de ser una llista no buida`);
  }
  if (!Array.isArray(rubric?.performance_dimensions) || rubric.performance_dimensions.length === 0) {
    throw new Error(`${MODULE_CONFIG_PATH}: assessment.rubric.performance_dimensions ha de ser una llista no buida`);
  }
  requiredText(rubric.functional_dimension, 'assessment.rubric.functional_dimension');
  score(rubric.minimum_functional_weight, 'assessment.rubric.minimum_functional_weight', { max: 1 });
  score(rubric.maximum_check_weight, 'assessment.rubric.maximum_check_weight', { max: 1 });

  const classroom = config.assessment?.classroom_work;
  if (!Array.isArray(classroom?.technical_dimensions) || classroom.technical_dimensions.length === 0) {
    throw new Error(`${MODULE_CONFIG_PATH}: assessment.classroom_work.technical_dimensions ha de ser una llista no buida`);
  }
  const productWeight = score(classroom.product_weight, 'assessment.classroom_work.product_weight', { max: 1 });
  const high = score(classroom.thresholds?.high, 'assessment.classroom_work.thresholds.high', { max: 1 });
  const medium = score(classroom.thresholds?.medium, 'assessment.classroom_work.thresholds.medium', { max: 1 });
  if (medium >= high) {
    throw new Error(`${MODULE_CONFIG_PATH}: el llindar medium ha de ser menor que high`);
  }
  for (const level of ['high', 'medium', 'low', 'no_evidence']) {
    requiredText(classroom.levels?.[level]?.label, `assessment.classroom_work.levels.${level}.label`);
    score(classroom.levels?.[level]?.points, `assessment.classroom_work.levels.${level}.points`, { max: 10 * (1 - productWeight) });
  }
  const classroomPoints = ['high', 'medium', 'low', 'no_evidence'].map((level) => Number(classroom.levels[level].points));
  if (!classroomPoints.every((points, index) => index === 0 || classroomPoints[index - 1] > points)) {
    throw new Error(`${MODULE_CONFIG_PATH}: els punts de treball d'aula han de baixar estrictament de high a no_evidence`);
  }
  if (Math.abs(classroomPoints[0] - 10 * (1 - productWeight)) > 1e-9) {
    throw new Error(`${MODULE_CONFIG_PATH}: els punts de high han de completar la nota màxima segons product_weight`);
  }

  validRelativePath(config.autograding?.system_context_file, 'autograding.system_context_file');

  const docs = config.documentation;
  validRelativePath(docs?.classroom_programming_local_dir, 'documentation.classroom_programming_local_dir');
  requiredText(docs?.classroom_programming_external_dir, 'documentation.classroom_programming_external_dir');
  requiredText(docs?.classroom_programming_source_label, 'documentation.classroom_programming_source_label');
  requiredText(docs?.classroom_programming_public_url, 'documentation.classroom_programming_public_url');

  const consolidation = config.consolidation;
  if (consolidation?.enabled) {
    validPattern(consolidation.code_pattern, 'consolidation.code_pattern');
    requiredText(consolidation.repository, 'consolidation.repository');
    requiredText(consolidation.branch, 'consolidation.branch');
    validRelativePath(consolidation.folder, 'consolidation.folder');
    requiredText(consolidation.public_base_url, 'consolidation.public_base_url');
  }

  return config;
}

export function loadModuleConfig(rootDir = process.cwd()) {
  const file = path.join(rootDir, MODULE_CONFIG_PATH);
  let config;
  try {
    config = JSON.parse(readFileSync(file, 'utf8'));
  } catch (error) {
    throw new Error(`${MODULE_CONFIG_PATH}: no s'ha pogut carregar (${error.message})`);
  }
  return validateModuleConfig(config);
}

export function moduleGroupFiles(config) {
  return {
    all: config.repositories_file,
    ...Object.fromEntries(Object.entries(config.groups).map(([group, settings]) => [group, settings.repositories_file]))
  };
}

export function moduleDefaultGroup(config) {
  return Object.keys(config.groups)[0];
}

export function teacherRepositoryParts(config) {
  const [owner, repo] = config.github.teacher_repository.split('/');
  return { owner, repo };
}
