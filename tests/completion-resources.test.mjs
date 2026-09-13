import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { publishStudentAutograde } from '../scripts/publish-student-autograde.mjs';

async function publish(root, score) {
  const studentDir = path.join(root, `student-${score}`);
  const result = path.join(root, `result-${score}.json`);
  const markdown = path.join(root, `result-${score}.md`);
  await writeFile(result, JSON.stringify({
    challenge_id: 'r1-s01-model-client-servidor-stack',
    final_score_over_10: score,
    commit: 'abc123'
  }));
  await writeFile(markdown, '# Resultat\n');
  await publishStudentAutograde({
    'student-dir': studentDir,
    result,
    markdown,
    repo: 'centre/alumne',
    group: '2DAW-A',
    source: 'test'
  });
  return studentDir;
}

test('el recurs teòric públic de R1M1 només s’enllaça amb una nota mínima de 5', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'dwes-completion-resource-'));
  const resource = 'Teoria-R1-Com-triar-un-llenguatge-i-un-framework-per-al-backend.pdf';

  try {
    const failedDir = await publish(root, 4.9);
    await assert.rejects(readFile(path.join(failedDir, 'autograde', 'resources', resource)));
    assert.doesNotMatch(await readFile(path.join(failedDir, 'autograde', 'README.md'), 'utf8'), /Recursos desbloquejats/);

    const passedDir = await publish(root, 5);
    assert.match(await readFile(path.join(passedDir, 'autograde', 'README.md'), 'utf8'), new RegExp(resource));
    await assert.rejects(readFile(path.join(passedDir, 'autograde', 'resources', resource)));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
