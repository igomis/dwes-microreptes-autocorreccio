import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

const rootDir = path.resolve(import.meta.dirname, '..');

test('inclou fitxers estructurals encara que no mencionen el microrepte i publica un manifest', () => {
  const repoDir = mkdtempSync(path.join(tmpdir(), 'dwes-evidence-'));
  mkdirSync(path.join(repoDir, 'src'));
  writeFileSync(path.join(repoDir, 'README.md'), '# R1M2\n');
  writeFileSync(path.join(repoDir, 'docker-compose.yml'), 'services:\n  web:\n    build: .\n');
  writeFileSync(path.join(repoDir, 'Dockerfile'), 'FROM php:8.3-apache\n');
  writeFileSync(path.join(repoDir, 'src', 'index.php'), '<?php echo "Hola";\n');
  execFileSync('git', ['init'], { cwd: repoDir });
  execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: repoDir });
  execFileSync('git', ['config', 'user.name', 'Test'], { cwd: repoDir });
  execFileSync('git', ['add', '.'], { cwd: repoDir });
  execFileSync('git', ['commit', '-m', 'R1M2'], { cwd: repoDir });
  const commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repoDir, encoding: 'utf8' }).trim();
  const signalsPath = path.join(repoDir, 'signals.json');
  const summaryPath = path.join(repoDir, 'summary.json');

  execFileSync(process.execPath, [
    'scripts/collect-repo-evidence.mjs', '--repo-dir', repoDir, '--repo', 'test/student',
    '--commit', commit, '--challenge-id', 'r1-s02-entorn-executable', '--microrepte-code', 'R1M2',
    '--repo-signals', signalsPath, '--evidence-summary', summaryPath
  ], { cwd: rootDir });

  const summary = JSON.parse(readFileSync(summaryPath, 'utf8'));
  const includedPaths = summary.relevant_files.map((file) => file.path);
  assert.ok(includedPaths.includes('docker-compose.yml'));
  assert.ok(includedPaths.includes('Dockerfile'));
  assert.ok(includedPaths.includes('src/index.php'));
  assert.equal(summary.repository_manifest.find((item) => item.path === 'docker-compose.yml').present, true);
  assert.equal(summary.repository_manifest.find((item) => item.path === 'src').included, true);
  assert.ok(summary.commit_evidence.changed_files.includes('src/index.php'));
  assert.equal(summary.commit_evidence.history.length, 1);
  assert.equal(summary.commit_evidence.active_microrepte_candidates.length, 1);
  assert.equal(summary.commit_evidence.temporal_summary.candidate_count, 1);
  assert.equal(summary.commit_evidence.temporal_summary.span_minutes, 0);
  assert.equal(summary.commit_evidence.temporal_summary.within_three_hours, true);
});

test('recull la seqüència de commits del microrepte i calcula la finestra temporal', () => {
  const repoDir = mkdtempSync(path.join(tmpdir(), 'dwes-history-'));
  execFileSync('git', ['init'], { cwd: repoDir });
  execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: repoDir });
  execFileSync('git', ['config', 'user.name', 'Test'], { cwd: repoDir });
  const commit = (message, date, contents) => {
    writeFileSync(path.join(repoDir, 'README.md'), contents);
    execFileSync('git', ['add', 'README.md'], { cwd: repoDir });
    execFileSync('git', ['commit', '-m', message], {
      cwd: repoDir,
      env: { ...process.env, GIT_AUTHOR_DATE: date, GIT_COMMITTER_DATE: date }
    });
  };
  commit('R2M1 inici', '2026-09-25T09:00:00+02:00', '# R2M1\nInici\n');
  commit('R2M1 validació', '2026-09-25T10:15:00+02:00', '# R2M1\nValidació\n');
  commit('R2M1 prova final', '2026-09-25T11:40:00+02:00', '# R2M1\nProva\n');
  const head = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repoDir, encoding: 'utf8' }).trim();
  const signalsPath = path.join(repoDir, 'signals.json');
  const summaryPath = path.join(repoDir, 'summary.json');

  execFileSync(process.execPath, [
    'scripts/collect-repo-evidence.mjs', '--repo-dir', repoDir, '--repo', 'test/student',
    '--commit', head, '--challenge-id', 'r2-s01-entrada-validacio-basica', '--microrepte-code', 'R2M1',
    '--repo-signals', signalsPath, '--evidence-summary', summaryPath
  ], { cwd: rootDir });

  const evidence = JSON.parse(readFileSync(summaryPath, 'utf8')).commit_evidence;
  assert.equal(evidence.history.length, 3);
  assert.equal(evidence.active_microrepte_candidates.length, 3);
  assert.equal(evidence.temporal_summary.span_minutes, 160);
  assert.equal(evidence.temporal_summary.within_three_hours, true);
  assert.deepEqual(evidence.active_microrepte_candidates.map((item) => item.subject), [
    'R2M1 prova final', 'R2M1 validació', 'R2M1 inici'
  ]);
});
