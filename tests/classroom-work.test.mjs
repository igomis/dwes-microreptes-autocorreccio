import test from 'node:test';
import assert from 'node:assert/strict';

import {
  applyClassroomCap,
  calculateTechnicalScore,
  classifyClassroomWork,
  resolveClassroomAssessment
} from '../scripts/lib/classroom-work.mjs';

const rubric = {
  dimensions: [
    { id: 'functional_resolution', weight: 0.5 },
    { id: 'documentation', weight: 0.1 },
    { id: 'code_quality', weight: 0.2 }
  ]
};

test('la nota tècnica exclou documentació, traçabilitat i ús d’IA', () => {
  const score = calculateTechnicalScore({
    dimension_scores: [
      { id: 'functional_resolution', score: 4, max_score: 5 },
      { id: 'documentation', score: 0, max_score: 1 },
      { id: 'code_quality', score: 2, max_score: 2 }
    ]
  }, rubric);

  assert.equal(score, 8.57);
});

test('classifica automàticament segons la proporció de progrés tècnic a classe', () => {
  assert.equal(classifyClassroomWork({ checkpoint_status: 'ready', start_score: 0, end_score: 8, final_score: 10 }).automatic_level, 'high');
  assert.equal(classifyClassroomWork({ checkpoint_status: 'ready', start_score: 0, end_score: 5, final_score: 10 }).automatic_level, 'medium');
  assert.equal(classifyClassroomWork({ checkpoint_status: 'ready', start_score: 0, end_score: 2, final_score: 10 }).automatic_level, 'low');
  assert.equal(classifyClassroomWork({ checkpoint_status: 'ready', start_score: 4, end_score: 4, final_score: 10 }).automatic_level, 'no_evidence');
});

test('un error tècnic deixa la valoració pendent i no aplica el topall de 6', () => {
  const automatic = classifyClassroomWork({ checkpoint_status: 'error', start_score: null, end_score: null, final_score: 10 });
  const resolved = resolveClassroomAssessment(automatic);
  assert.equal(resolved.status, 'technical_error');
  assert.equal(resolved.effective_cap, null);
  assert.equal(applyClassroomCap(10, resolved), 10);
});

test('l’excepció docent justificada substitueix el nivell automàtic i queda identificada', () => {
  const automatic = classifyClassroomWork({ checkpoint_status: 'ready', start_score: 5, end_score: 5, final_score: 10 });
  const resolved = resolveClassroomAssessment(automatic, {
    level: 'high',
    reason: 'Treball comprovat en la branca de microrepte.'
  });

  assert.equal(resolved.automatic_level, 'no_evidence');
  assert.equal(resolved.effective_level, 'high');
  assert.equal(resolved.effective_cap, 10);
  assert.equal(resolved.source, 'teacher_override');
  assert.equal(applyClassroomCap(9.6, resolved), 9.6);
});

test('una excepció docent sense justificació es rebutja', () => {
  assert.throws(() => resolveClassroomAssessment({}, { level: 'medium', reason: '' }), /justificació/);
});

test('els topalls, llindars, etiquetes i dimensions tècniques es poden configurar per mòdul', () => {
  const levels = {
    high: { label: 'Complet', cap: 10 },
    medium: { label: 'Parcial', cap: 8 },
    low: { label: 'Baix', cap: 6 },
    no_evidence: { label: 'No observat', cap: 4 }
  };
  const automatic = classifyClassroomWork(
    { checkpoint_status: 'ready', start_score: 0, end_score: 6, final_score: 10 },
    { high: 0.8, medium: 0.5 },
    levels
  );
  assert.equal(automatic.automatic_level, 'medium');
  assert.equal(automatic.automatic_cap, 8);
  assert.match(automatic.reason, /parcial/);
  assert.equal(resolveClassroomAssessment(automatic, null, levels).effective_cap, 8);

  assert.equal(calculateTechnicalScore({
    dimension_scores: [
      { id: 'product', score: 3, max_score: 4 },
      { id: 'documentation', score: 1, max_score: 1 }
    ]
  }, { dimensions: [
    { id: 'product', weight: 0.8 },
    { id: 'documentation', weight: 0.2 }
  ] }, ['product']), 7.5);
});
