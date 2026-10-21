import assert from 'node:assert/strict';
import test from 'node:test';

import { dashboardGroupGradeLinks } from '../teacher-dashboard/external-links.mjs';

const groups = {
  'GRUP-A': { grades_url_env: 'NOTES_A_URL' },
  'GRUP-B': { grades_url_env: 'NOTES_B_URL' },
  'GRUP-C': { grades_url_env: 'NOTES_C_URL' },
  'GRUP-D': { grades_url_env: 'NOTES_D_URL' }
};

test('carrega un full de notes HTTP(S) diferent per grup', () => {
  assert.deepEqual(dashboardGroupGradeLinks(groups, {
    NOTES_A_URL: 'https://example.sharepoint.com/a.xlsx?web=1',
    NOTES_B_URL: ' http://example.test/b.xlsx '
  }), {
    'GRUP-A': 'https://example.sharepoint.com/a.xlsx?web=1',
    'GRUP-B': 'http://example.test/b.xlsx'
  });
});

test('ignora enllaços buits, mal formats o amb protocols no web', () => {
  assert.deepEqual(dashboardGroupGradeLinks(groups, {
    NOTES_A_URL: '',
    NOTES_B_URL: 'no és un URL',
    NOTES_C_URL: 'javascript:alert(1)',
    NOTES_D_URL: 'file:///tmp/notes.xlsx'
  }), {});
});
