import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  loadModuleConfig,
  moduleDefaultGroup,
  moduleGroupFiles,
  teacherRepositoryParts,
  validateModuleConfig
} from '../scripts/lib/module-config.mjs';
import { parseRepositories } from '../scripts/parse-student-repositories.mjs';

test('la configuració del mòdul centralitza grups i repositori docent', () => {
  const config = loadModuleConfig();
  assert.equal(config.module.id, 'dwes');
  assert.equal(moduleDefaultGroup(config), '2DAW-A');
  assert.equal(moduleGroupFiles(config)['2DAW-C'], 'course/student-repositories-2dawc.txt');
  assert.deepEqual(teacherRepositoryParts(config), {
    owner: 'igomis',
    repo: 'dwes-microreptes-autocorreccio'
  });
});

test('una configuració de mòdul rebutja grups buits i llindars incoherents', () => {
  const base = structuredClone(loadModuleConfig());
  base.groups = {};
  assert.throws(() => validateModuleConfig(base), /almenys un grup/);

  const thresholds = structuredClone(loadModuleConfig());
  thresholds.assessment.classroom_work.thresholds.medium = 0.9;
  assert.throws(() => validateModuleConfig(thresholds), /medium ha de ser menor/);
});

test('accepta una configuració d’un mòdul diferent sense valors de DWES', () => {
  const config = structuredClone(loadModuleConfig());
  config.module = { id: 'programacio', name: 'Programació', short_name: 'PROG', language: 'ca-ES' };
  config.github.teacher_repository = 'centre/programacio-autocorreccio';
  config.github.classroom_organization = 'centre-programacio';
  config.github.student_template = 'centre/programacio-alumnat';
  config.github.student_template_local_dir = '../programacio-alumnat';
  config.groups = {
    '1DAM-A': {
      repositories_file: 'course/student-repositories-1dam-a.txt',
      grades_url_env: 'DASHBOARD_GRADES_1DAM_A_URL'
    }
  };
  config.consolidation = { enabled: false };
  assert.equal(validateModuleConfig(config), config);
});

test('el motor i el workflow massiu no contenen grups ni repositoris de DWES', () => {
  const engineFiles = [
    'teacher-dashboard/server.mjs',
    'teacher-dashboard/consolidation.mjs',
    'teacher-dashboard/external-links.mjs',
    'scripts/lib/classroom-work.mjs',
    'scripts/validate-config.mjs',
    '.github/workflows/batch-autograde-students.yml'
  ];
  const content = engineFiles.map((file) => readFileSync(file, 'utf8')).join('\n');
  for (const forbidden of ['2DAW-A', 'batoi-dwes-2026', 'cipfpbatoi/dwes2627', 'dwes-microreptes-autocorreccio']) {
    assert.equal(content.includes(forbidden), false, `${forbidden} encara està acoblat al motor`);
  }
});

test('el parser de correcció massiva accepta identificadors de grup d’un altre mòdul', () => {
  assert.deepEqual(
    parseRepositories('centre/alumna DAM-1A\ncentre/alumne', 'DAM-1B', ['DAM-1A', 'DAM-1B']),
    [
      { repo: 'centre/alumna', group: 'DAM-1A' },
      { repo: 'centre/alumne', group: 'DAM-1B' }
    ]
  );
});
