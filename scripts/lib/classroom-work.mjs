export const CLASSROOM_WORK_LEVELS = Object.freeze({
  high: Object.freeze({ label: 'Alta', cap: 10 }),
  medium: Object.freeze({ label: 'Mitjana', cap: 9 }),
  low: Object.freeze({ label: 'Baixa', cap: 7.5 }),
  no_evidence: Object.freeze({ label: 'Sense evidència', cap: 6 })
});

export const DEFAULT_CLASSROOM_THRESHOLDS = Object.freeze({
  high: 0.7,
  medium: 0.35
});

export const DEFAULT_TECHNICAL_DIMENSIONS = Object.freeze([
  'functional_resolution',
  'code_quality',
  'file_handling'
]);

function round(value, digits = 4) {
  const factor = 10 ** digits;
  return Math.round((Number(value) + Number.EPSILON) * factor) / factor;
}

function finiteScore(value) {
  if (value === null || value === undefined || value === '') return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

export function classroomCapForLevel(level) {
  return CLASSROOM_WORK_LEVELS[level]?.cap ?? null;
}

export function calculateTechnicalScore(result, rubric, technicalDimensionIds = DEFAULT_TECHNICAL_DIMENSIONS) {
  const dimensions = Array.isArray(result?.dimension_scores) ? result.dimension_scores : [];
  const rubricDimensions = Array.isArray(rubric?.dimensions) ? rubric.dimensions : [];
  const included = new Set(technicalDimensionIds);
  const weights = new Map(
    rubricDimensions
      .filter((dimension) => included.has(dimension?.id))
      .map((dimension) => [dimension.id, Number(dimension.weight)])
  );

  let earned = 0;
  let availableWeight = 0;

  for (const dimension of dimensions) {
    if (!included.has(dimension?.id)) continue;
    const score = finiteScore(dimension.score);
    const maxScore = finiteScore(dimension.max_score);
    const weight = weights.get(dimension.id);
    if (score === null || maxScore === null || maxScore <= 0 || !Number.isFinite(weight) || weight <= 0) continue;
    earned += Math.max(0, Math.min(score, maxScore)) / maxScore * weight;
    availableWeight += weight;
  }

  return availableWeight > 0 ? round((earned / availableWeight) * 10, 2) : null;
}

export function classifyClassroomWork(input, thresholds = DEFAULT_CLASSROOM_THRESHOLDS) {
  const startScore = finiteScore(input?.start_score);
  const endScore = finiteScore(input?.end_score);
  const finalScore = finiteScore(input?.final_score);
  const checkpointsReady = input?.checkpoint_status === 'ready';

  if (!checkpointsReady || startScore === null || endScore === null || finalScore === null) {
    return {
      status: input?.checkpoint_status === 'error' ? 'technical_error' : 'pending',
      automatic_level: null,
      automatic_cap: null,
      classroom_ratio: null,
      start_score: startScore,
      end_score: endScore,
      final_score: finalScore,
      reason: input?.checkpoint_status === 'error'
        ? 'La captura o la correcció d’algun checkpoint ha fallat; no s’aplica cap topall automàtic.'
        : 'Falten checkpoints o resultats tècnics per calcular el treball d’aula.'
    };
  }

  const classGain = Math.max(0, endScore - startScore);
  const totalGain = Math.max(0, Math.max(endScore, finalScore) - startScore);
  const ratio = totalGain > 0 ? Math.max(0, Math.min(1, classGain / totalGain)) : 0;
  let level = 'no_evidence';

  if (ratio >= Number(thresholds.high)) level = 'high';
  else if (ratio >= Number(thresholds.medium)) level = 'medium';
  else if (ratio > 0) level = 'low';

  const roundedRatio = round(ratio);
  const percentage = Math.round(roundedRatio * 100);
  const label = CLASSROOM_WORK_LEVELS[level].label.toLowerCase();

  return {
    status: 'classified',
    automatic_level: level,
    automatic_cap: classroomCapForLevel(level),
    classroom_ratio: roundedRatio,
    start_score: startScore,
    end_score: endScore,
    final_score: finalScore,
    reason: `${percentage}% del progrés tècnic observable s’ha produït entre els checkpoints de classe; evidència ${label}.`
  };
}

export function resolveClassroomAssessment(automaticAssessment, override = null) {
  const overrideLevel = override?.level;
  if (overrideLevel && !Object.hasOwn(CLASSROOM_WORK_LEVELS, overrideLevel)) {
    throw new Error(`Nivell docent no vàlid: ${overrideLevel}`);
  }

  if (overrideLevel && !String(override?.reason || '').trim()) {
    throw new Error('La correcció docent necessita una justificació.');
  }

  const effectiveLevel = overrideLevel || automaticAssessment?.automatic_level || null;
  return {
    ...automaticAssessment,
    teacher_override_level: overrideLevel || null,
    teacher_override_reason: overrideLevel ? String(override.reason).trim() : '',
    effective_level: effectiveLevel,
    effective_cap: classroomCapForLevel(effectiveLevel),
    source: overrideLevel ? 'teacher_override' : effectiveLevel ? 'automatic' : 'pending'
  };
}

export function applyClassroomCap(score, assessment) {
  const numericScore = finiteScore(score);
  if (numericScore === null) return null;
  const cap = finiteScore(assessment?.effective_cap);
  return round(cap === null ? numericScore : Math.min(numericScore, cap), 2);
}
