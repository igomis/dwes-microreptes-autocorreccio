import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
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

test('una recorrecció substituïx la publicació anterior del mateix microrepte', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'dwes-regrade-'));
  const studentDir = path.join(root, 'student');
  const result = path.join(root, 'result.json');
  const markdown = path.join(root, 'result.md');
  const publish = async (score) => {
    await writeFile(result, JSON.stringify({
      challenge_id: 'r2-s01-entrada-validacio-basica',
      final_score_over_10: score,
      commit: 'abc123'
    }));
    await writeFile(markdown, `# Resultat ${score}\n`);
    await publishStudentAutograde({
      'student-dir': studentDir,
      result,
      markdown,
      repo: 'centre/alumne',
      group: '2DAW-A',
      source: 'test'
    });
  };

  try {
    await publish(6);
    await publish(8.25);
    const files = await readdir(path.join(studentDir, 'autograde', 'history'));
    assert.equal(files.filter((file) => file.endsWith('.json')).length, 1);
    assert.equal(files.filter((file) => file.endsWith('.md')).length, 1);
    assert.match(await readFile(path.join(studentDir, 'autograde', 'latest.md'), 'utf8'), /8\.25/);
    const index = await readFile(path.join(studentDir, 'autograde', 'README.md'), 'utf8');
    assert.equal(index.split('\n').filter((line) => line.startsWith('| ') && line.includes('`r2-s01-entrada-validacio-basica`')).length, 1);
    assert.doesNotMatch(index, /6\/10/);
    assert.match(index, /8\.25\/10/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
