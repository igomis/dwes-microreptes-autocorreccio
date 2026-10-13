import assert from 'node:assert/strict';
import test from 'node:test';

import { dashboardGroupGradeLinks } from '../teacher-dashboard/external-links.mjs';

test('carrega un full de notes HTTP(S) diferent per grup', () => {
  assert.deepEqual(dashboardGroupGradeLinks({
    DASHBOARD_GRADES_2DAW_A_URL: 'https://example.sharepoint.com/a.xlsx?web=1',
    DASHBOARD_GRADES_2DAW_B_URL: ' http://example.test/b.xlsx '
  }), {
    '2DAW-A': 'https://example.sharepoint.com/a.xlsx?web=1',
    '2DAW-B': 'http://example.test/b.xlsx'
  });
});

test('ignora enllaços buits, mal formats o amb protocols no web', () => {
  assert.deepEqual(dashboardGroupGradeLinks({
    DASHBOARD_GRADES_2DAW_A_URL: '',
    DASHBOARD_GRADES_2DAW_B_URL: 'no és un URL',
    DASHBOARD_GRADES_2DAW_C_URL: 'javascript:alert(1)',
    DASHBOARD_GRADES_2DAW_D_URL: 'file:///tmp/notes.xlsx'
  }), {});
});
