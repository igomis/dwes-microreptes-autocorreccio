import test from 'node:test';
import assert from 'node:assert/strict';

import {
  changedClassroomRefs,
  chooseClassroomEndRef,
  chooseIntegratedClassroomRef,
  compareShowsAncestor,
  compareShowsEquivalentChanges
} from '../scripts/lib/classroom-refs.mjs';

const start = [
  { name: 'main', sha: 'main-1' },
  { name: 'R2M5', sha: 'branch-1' }
];

test('tria la branca del microrepte quan canvia durant la classe', () => {
  const selected = chooseClassroomEndRef(start, [
    { name: 'main', sha: 'main-1' },
    { name: 'R2M5', sha: 'branch-2' }
  ], { tokens: ['r2m5', 'r2s5'], defaultRef: 'main' });

  assert.equal(selected.name, 'R2M5');
  assert.equal(selected.sha, 'branch-2');
  assert.match(selected.reason, /microrepte/);
});

test('conserva main quan diverses branques no identificables canvien', () => {
  const selected = chooseClassroomEndRef(start, [
    { name: 'main', sha: 'main-2' },
    { name: 'prova-a', sha: 'a-2' },
    { name: 'prova-b', sha: 'b-2' }
  ], { tokens: ['r2m5'], defaultRef: 'main' });

  assert.equal(selected.name, 'main');
  assert.equal(changedClassroomRefs(start, [{ name: 'main', sha: 'main-2' }]).length, 1);
});

test('reconeix integració per ancestre i per canvis equivalents de squash', () => {
  assert.equal(compareShowsAncestor({ status: 'ahead' }), true);
  assert.equal(compareShowsAncestor({ status: 'diverged' }), false);

  const branchComparison = {
    files: [{ filename: 'src/login.php', status: 'modified', sha: 'blob-2', patch: '@@ canvi' }]
  };
  const deliveryComparison = {
    files: [{ filename: 'src/login.php', status: 'modified', sha: 'blob-2', patch: '@@ canvi' }]
  };
  assert.equal(compareShowsEquivalentChanges(branchComparison, deliveryComparison), true);
});

test('només selecciona branques acreditades en l’entrega i prioritza la del microrepte', () => {
  const selected = chooseIntegratedClassroomRef([
    { name: 'main', sha: 'main-2', relevance: 0, integration_status: 'ancestor' },
    { name: 'R2M5', sha: 'branch-2', relevance: 100, integration_status: 'equivalent_changes' },
    { name: 'experiment', sha: 'other-2', relevance: 0, integration_status: 'not_integrated' }
  ]);

  assert.equal(selected.name, 'R2M5');
  assert.equal(selected.integration_status, 'equivalent_changes');
});
