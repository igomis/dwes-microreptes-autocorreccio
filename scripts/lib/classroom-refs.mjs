function normalizeToken(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

export function classroomRefTokens(session = {}, challenge = {}) {
  return unique([
    challenge.microrepte_code,
    challenge.id,
    challenge.challenge_id,
    session.challenge_id,
    session.session_code
  ].map(normalizeToken));
}

export function parseCapturedRefs(value) {
  if (Array.isArray(value)) return value;
  if (typeof value !== 'string' || !value.trim()) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function refRelevance(refName, tokens = []) {
  const normalizedRef = normalizeToken(refName);
  if (!normalizedRef) return 0;
  return tokens.reduce((score, token, index) => {
    if (!token || !normalizedRef.includes(token)) return score;
    return Math.max(score, Math.max(10, 100 - index * 10));
  }, 0);
}

export function changedClassroomRefs(startRefs, endRefs, options = {}) {
  const defaultRef = options.defaultRef || 'main';
  const tokens = options.tokens || [];
  const startByName = new Map(parseCapturedRefs(startRefs).map((ref) => [ref.name, ref.sha]));

  return parseCapturedRefs(endRefs)
    .filter((ref) => ref?.name && ref?.sha)
    .map((ref) => ({
      ...ref,
      changed: startByName.get(ref.name) !== ref.sha,
      existed_at_start: startByName.has(ref.name),
      is_default: ref.name === defaultRef,
      relevance: refRelevance(ref.name, tokens)
    }))
    .filter((ref) => ref.changed)
    .sort((left, right) => (
      right.relevance - left.relevance
      || Number(right.name !== defaultRef) - Number(left.name !== defaultRef)
      || String(right.committed_at || '').localeCompare(String(left.committed_at || ''))
      || left.name.localeCompare(right.name, 'ca', { numeric: true })
    ));
}

export function chooseClassroomEndRef(startRefs, endRefs, options = {}) {
  const defaultRef = options.defaultRef || 'main';
  const parsedEnd = parseCapturedRefs(endRefs);
  const defaultEnd = parsedEnd.find((ref) => ref.name === defaultRef) || null;
  const changed = changedClassroomRefs(startRefs, parsedEnd, options);
  const relevantBranches = changed.filter((ref) => !ref.is_default && ref.relevance > 0);

  if (relevantBranches.length > 0) {
    return {
      ...relevantBranches[0],
      reason: `Branca remota del microrepte modificada durant la sessió: ${relevantBranches[0].name}.`
    };
  }

  const changedBranches = changed.filter((ref) => !ref.is_default);
  if (changedBranches.length === 1) {
    return {
      ...changedBranches[0],
      reason: `Única branca remota modificada durant la sessió: ${changedBranches[0].name}.`
    };
  }

  if (defaultEnd) {
    return {
      ...defaultEnd,
      reason: changed.some((ref) => ref.is_default)
        ? `Progrés capturat en ${defaultRef}.`
        : `Sense una branca remota inequívoca; es conserva el checkpoint de ${defaultRef}.`
    };
  }

  return null;
}

export function compareShowsAncestor(comparison) {
  return ['ahead', 'identical'].includes(String(comparison?.status || '').toLowerCase());
}

export function compareShowsEquivalentChanges(branchComparison, deliveryComparison) {
  const branchFiles = Array.isArray(branchComparison?.files) ? branchComparison.files : [];
  const deliveryFiles = new Map(
    (Array.isArray(deliveryComparison?.files) ? deliveryComparison.files : [])
      .map((file) => [file.filename, file])
  );
  if (branchFiles.length === 0) return false;

  return branchFiles.every((branchFile) => {
    const deliveryFile = deliveryFiles.get(branchFile.filename);
    if (!deliveryFile || deliveryFile.status !== branchFile.status) return false;
    if (branchFile.sha && deliveryFile.sha === branchFile.sha) return true;
    return typeof branchFile.patch === 'string'
      && branchFile.patch.length > 0
      && deliveryFile.patch === branchFile.patch;
  });
}

export function chooseIntegratedClassroomRef(candidates, defaultRef = 'main') {
  const integrated = candidates.filter((candidate) => (
    ['ancestor', 'equivalent_changes'].includes(candidate.integration_status)
  ));
  if (integrated.length === 0) return null;

  return integrated.sort((left, right) => (
    right.relevance - left.relevance
    || Number(right.name !== defaultRef) - Number(left.name !== defaultRef)
    || Number(right.integration_status === 'ancestor') - Number(left.integration_status === 'ancestor')
    || String(right.committed_at || '').localeCompare(String(left.committed_at || ''))
    || left.name.localeCompare(right.name, 'ca', { numeric: true })
  ))[0];
}
