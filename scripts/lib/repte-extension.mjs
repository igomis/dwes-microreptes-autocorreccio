import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

export const extensionSteps = [0, 0.25, 0.5, 0.75, 1];
export const extensionSchema = {
  type: 'object', additionalProperties: false,
  required: ['proposed_score', 'core_ready', 'reason', 'evidence', 'presentation_checks'],
  properties: {
    proposed_score: { type: 'number', enum: extensionSteps },
    core_ready: { type: 'boolean' },
    reason: { type: 'string' },
    evidence: { type: 'array', items: { type: 'string' } },
    presentation_checks: { type: 'array', items: { type: 'string' } }
  }
};

export async function readChallengeMetadata(rootDir) {
  const dirs = await readdir(path.join(rootDir, 'microreptes'), { withFileTypes: true });
  const entries = await Promise.all(dirs.filter(d => d.isDirectory()).map(async d => {
    const value = JSON.parse(await readFile(path.join(rootDir, 'microreptes', d.name, 'challenge.json'), 'utf8'));
    return [value.challenge_id, value];
  }));
  return new Map(entries);
}

export function validateExtensionOwners(metadata) {
  const groups = new Map();
  for (const item of metadata.values()) {
    if (!/^R\d+M\d+$/.test(item.microrepte_code || '')) continue;
    const group = groups.get(item.repte_id) || [];
    group.push(item); groups.set(item.repte_id, group);
  }
  for (const [repte, items] of groups) {
    items.sort((a, b) => Number(a.microrepte_code.split('M')[1]) - Number(b.microrepte_code.split('M')[1]));
    const owners = items.filter(item => item.repte_extension);
    if (owners.length !== 1 || owners[0] !== items.at(-1)) {
      throw new Error(`${repte}: l'ampliació ha d'estar només en l'últim microrepte ordinari`);
    }
  }
}

export function validateProposal(proposal) {
  if (!proposal || !extensionSteps.includes(proposal.proposed_score) || typeof proposal.core_ready !== 'boolean'
      || typeof proposal.reason !== 'string' || !proposal.reason.trim()
      || !Array.isArray(proposal.evidence) || !Array.isArray(proposal.presentation_checks)
      || ![...proposal.evidence, ...proposal.presentation_checks].every(x => typeof x === 'string')) {
    throw new Error('Proposta d’ampliació invàlida: cal puntuació 0–1, justificació i evidències.');
  }
  if (proposal.proposed_score > 0 && (!proposal.core_ready || proposal.evidence.length === 0)) {
    throw new Error('Una proposta positiva necessita nucli verificable i evidències.');
  }
  return proposal;
}

// An inconsistent optional proposal must not discard a valid core assessment.
// The original API response remains in openai-raw-response.json.
export function normalizeExtensionProposal(result) {
  try {
    validateProposal(result.repte_extension);
    return result;
  } catch (error) {
    const original = result.repte_extension;
    const warning = `Proposta d’ampliació bloquejada: ${error.message}`;
    const strings = value => Array.isArray(value) ? value.filter(x => typeof x === 'string') : [];
    result.repte_extension = {
      proposed_score: 0,
      core_ready: false,
      reason: `${warning} Proposta original: ${JSON.stringify(original ?? null)}. Cal revisió docent; no és una validació a zero.`,
      evidence: strings(original?.evidence),
      presentation_checks: [...strings(original?.presentation_checks), 'Confirmar els mínims del nucli i les evidències abans de valorar l’ampliació.']
    };
    result.teacher_review_required = true;
    result.provisional = true;
    result.blocking_flags = [...strings(result.blocking_flags), warning];
    return result;
  }
}

function parseProposal(value) {
  if (typeof value !== 'string') return value || null;
  try { return JSON.parse(value); } catch { return null; }
}

// The extension is an independent 0-1 indicator for the teacher's oral defence.
// It never calculates or modifies a whole-repte, RA or microrepte score.
export function calculateRepteExtension(grades, metadata, repteId, review = null) {
  const required = [...metadata.values()].filter(m => m.repte_id === repteId && /^R\d+M\d+$/.test(m.microrepte_code || ''));
  const owner = required.find(m => m.repte_extension);
  if (!owner) return null;
  const latest = new Map();
  // Caller supplies preferred records first (same source preference as the dashboard).
  for (const grade of grades) if (!latest.has(grade.challenge_id)) latest.set(grade.challenge_id, grade);
  const ownerGrade = latest.get(owner.challenge_id);
  let proposal = ownerGrade?.repte_extension || null;
  if (typeof proposal === 'string') { try { proposal = JSON.parse(proposal); } catch { proposal = null; } }
  if (proposal) { try { validateProposal(proposal); } catch { proposal = null; } }
  const snapshot = createHash('sha256').update(JSON.stringify(required.map(m => {
    const g = latest.get(m.challenge_id);
    return [m.challenge_id, m.repte_extension, g?.commit || g?.commit_hash, g?.timestamp, parseProposal(g?.repte_extension)];
  }).sort((a, b) => a[0].localeCompare(b[0])))).digest('hex');
  const validReview = review?.source_challenge_id === owner.challenge_id && review.snapshot === snapshot
    && extensionSteps.includes(review.validated_score) && typeof review.core_requirements_met === 'boolean'
    && (review.validated_score === 0 || review.core_requirements_met === true);
  return {
    source_challenge_id: owner.challenge_id, source_microrepte_code: owner.microrepte_code,
    snapshot,
    proposed_score: proposal?.proposed_score ?? null,
    proposal, validated_score: validReview ? review.validated_score : null,
    review: review || null,
    status: validReview ? 'validated' : review ? 'stale' : proposal ? 'pending' : 'not_proposed',
    provisional: !validReview
  };
}

export function makeExtensionReview(body, calculation) {
  if (!calculation || body.source_challenge_id !== calculation.source_challenge_id) throw new Error('L’ampliació només es valida des de l’últim microrepte.');
  if (body.snapshot !== calculation.snapshot) throw new Error('Les correccions han canviat. Recarrega abans de validar.');
  if (!extensionSteps.includes(body.validated_score)) throw new Error('La puntuació ha de ser 0, 0.25, 0.5, 0.75 o 1.');
  if (typeof body.core_requirements_met !== 'boolean' || (body.validated_score > 0 && !body.core_requirements_met)) throw new Error('Cal confirmar que l’ampliació és verificable abans de validar-la per a la defensa.');
  if (typeof body.comment !== 'string' || !body.comment.trim()) throw new Error('Cal una observació docent de la presentació.');
  return { source_challenge_id: calculation.source_challenge_id, snapshot: calculation.snapshot,
    validated_score: body.validated_score, core_requirements_met: body.core_requirements_met,
    comment: body.comment.trim(), reviewed_at: new Date().toISOString(), source: 'teacher' };
}
