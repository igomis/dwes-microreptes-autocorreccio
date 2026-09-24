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
});
