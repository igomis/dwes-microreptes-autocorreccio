import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const root = 'microreptes/r2-s07-proves-depuracio-checkpoint';

function read(relative) {
  return readFileSync(`${root}/${relative}`, 'utf8');
}

test('R2M7 exigix el recorregut HTTP complet i fallada automàtica', () => {
  const challenge = JSON.parse(read('challenge.json'));
  const evidence = challenge.required_evidence.join('\n');
  const strategy = challenge.recommended_test_strategy;

  assert.match(evidence, /tests\/flux-r2\.sh/);
  assert.match(evidence, /Login incorrecte/);
  assert.match(evidence, /Operació protegida/);
  assert.match(evidence, /Logout/);
  assert.match(evidence, /codi d'eixida diferent de zero/i);
  assert.match(strategy, /curl.*només imprimix/i);
});

test('prompt i rúbrica no confonen R2M7 amb una prova unitària', () => {
  const prompt = read('prompt.md');
  const rubric = JSON.parse(read('rubric.json'));
  const rules = rubric.hard_rules.join('\n');

  assert.match(prompt, /sis passos/);
  assert.match(prompt, /no substituïxen, `R2M7`/);
  assert.match(rules, /Sense prova HTTP executable/);
  assert.match(rules, /col·leccio sense assercions/);
  assert.match(rules, /prova unitària com a substitut/);
});

test('la programació d aula reflectix el mateix lliurable', () => {
  const plan = readFileSync('docs/programacio_aula/programacio_aula_r2s7_proves_depuracio_checkpoint.md', 'utf8');

  assert.match(plan, /tests\/flux-r2\.sh/);
  assert.match(plan, /login incorrecte/);
  assert.match(plan, /operació protegida/);
  assert.match(plan, /codi diferent de `0`/);
  assert.match(plan, /Una ordre `curl` solta/);
});
