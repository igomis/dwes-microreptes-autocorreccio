function roundScore(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function capFromHardRule(rule) {
  const normalized = String(rule || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const match = normalized.match(/puntuacio maxima recomanada (?:es|de)\s*(\d+(?:[.,]\d+)?)/i);
  return match ? Number(match[1].replace(',', '.')) : null;
}

export function applyDeterministicScoring(result, hardRules = [], guardrails = {}) {
  if (!Array.isArray(result.dimension_scores)) {
    throw new Error('No es pot calcular la nota sense dimension_scores');
  }

  const rawScore = roundScore(result.dimension_scores.reduce((total, dimension) => {
    const score = Number(dimension?.score);
    if (!Number.isFinite(score)) throw new Error('Totes les dimensions han de tindre score numèric');
    return total + score;
  }, 0));
  const applied = Array.isArray(result.applied_hard_rules) ? result.applied_hard_rules : [];
  const resolvedCaps = applied.map((application, index) => {
    const ruleIndex = Number(application?.rule_index);
    if (!Number.isInteger(ruleIndex) || ruleIndex < 0 || ruleIndex >= hardRules.length) {
      throw new Error(`applied_hard_rules[${index}].rule_index no correspon a cap hard_rule`);
    }
    const cap = capFromHardRule(hardRules[ruleIndex]);
    if (cap === null) {
      throw new Error(`applied_hard_rules[${index}] referencia una regla sense límit numèric`);
    }
    return cap;
  });
  const evidenceCap = guardrails.active_microrepte_only
    && Number(guardrails.active_evidence_files_count || 0) === 0
    && Number.isFinite(guardrails.max_score_without_active_evidence)
    ? guardrails.max_score_without_active_evidence
    : null;
  const allCaps = [...resolvedCaps, evidenceCap].filter((cap) => cap !== null);
  const appliedCap = allCaps.length > 0 ? Math.min(...allCaps) : null;
  const finalScore = roundScore(Math.min(rawScore, appliedCap ?? rawScore, 10));

  result.raw_score_over_10 = rawScore;
  result.applied_cap = appliedCap;
  result.final_score_over_10 = finalScore;
  if (Array.isArray(result.ra_scores) && result.ra_scores.length === 1) {
    result.ra_scores[0].score = finalScore;
  }
  return result;
}
