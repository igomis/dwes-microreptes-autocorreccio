import assert from 'node:assert/strict';
import test from 'node:test';
import { applyDeterministicScoring, capFromHardRule } from '../scripts/lib/grading-result.mjs';

test('extrau límits numèrics amb accents o sense', () => {
  assert.equal(capFromHardRule('Sense README, la puntuació màxima recomanada és 6.'), 6);
  assert.equal(capFromHardRule('Sense README, la puntuacio maxima recomanada es 7,5.'), 7.5);
  assert.equal(capFromHardRule('Cal revisió docent.'), null);
});

test('recalcula la suma i aplica en codi el límit més restrictiu', () => {
  const result = {
    final_score_over_10: 9,
    dimension_scores: [{ score: 3.5 }, { score: 2 }, { score: 1.2 }],
    applied_hard_rules: [
      { rule_index: 1, reason: 'Falta prova' },
      { rule_index: 0, reason: 'Falta README' }
    ],
    ra_scores: [{ ra_id: 'RA1', score: 9 }]
  };
  applyDeterministicScoring(result, [
    'Sense README, la puntuació màxima recomanada és 6.',
    'Sense prova, la puntuació màxima recomanada és 7.'
  ]);
  assert.equal(result.raw_score_over_10, 6.7);
  assert.equal(result.applied_cap, 6);
  assert.equal(result.final_score_over_10, 6);
  assert.equal(result.ra_scores[0].score, 6);
  assert.deepEqual(result.applied_hard_rules, [
    { rule_index: 1, reason: 'Falta prova' },
    { rule_index: 0, reason: 'Falta README' }
  ]);
});

test('rebutja índexs inventats o regles sense cap numèric', () => {
  const base = { dimension_scores: [{ score: 5 }], ra_scores: [] };
  assert.throws(() => applyDeterministicScoring({ ...base, applied_hard_rules: [{ rule_index: 3, reason: '' }] }, ['cap 5']), /no correspon/);
  assert.throws(() => applyDeterministicScoring({ ...base, applied_hard_rules: [{ rule_index: 0, reason: '' }] }, ['cal revisió']), /sense límit/);
});
