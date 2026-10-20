import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import {
  closeDb,
  createClassroomWorkSession,
  getClassroomCheckpoints,
  getClassroomWorkAssessment,
  getLatestDeliveryGrade,
  initDb,
  migrateFromJson,
  saveClassroomWorkOverride,
  upsertClassroomCheckpoint,
  upsertClassroomWorkAssessment,
  upsertStudent
} from '../teacher-dashboard/db.mjs';

test('SQLite conserva checkpoints, classificació automàtica i excepció docent', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'dwes-classroom-work-'));
  const file = path.join(dir, 'test.db');

  try {
    initDb(file);
    upsertStudent('org/alumne', '2DAW-A', 'Alumne');
    const session = createClassroomWorkSession({
      group_name: '2DAW-A',
      challenge_id: 'r2-s05-test',
      session_code: 'R2S5',
      started_at: '2026-10-20T09:00:00+02:00'
    });

    upsertClassroomCheckpoint({
      session_id: session.id,
      student_id: 1,
      phase: 'start',
      commit_hash: 'abcdef1',
      captured_at: '2026-10-20T09:00:00+02:00'
    });
    upsertClassroomCheckpoint({
      session_id: session.id,
      student_id: 1,
      phase: 'end',
      commit_hash: 'abcdef2',
      captured_at: '2026-10-20T12:00:00+02:00'
    });
    assert.equal(getClassroomCheckpoints(session.id).length, 2);

    upsertClassroomWorkAssessment({
      session_id: session.id,
      student_id: 1,
      challenge_id: 'r2-s05-test',
      status: 'classified',
      automatic_level: 'low',
      automatic_cap: 7.5,
      classroom_ratio: 0.2,
      reason: '20% del progrés tècnic a classe.'
    });
    const overridden = saveClassroomWorkOverride(session.id, 1, {
      level: 'high',
      reason: 'Branca de classe comprovada.'
    });
    assert.equal(overridden.automatic_level, 'low');
    assert.equal(overridden.teacher_override_level, 'high');
    assert.equal(overridden.teacher_override_reason, 'Branca de classe comprovada.');
    assert.equal(getClassroomWorkAssessment(session.id, 1).automatic_cap, 7.5);

    const baseGrade = {
      student: 'org/alumne', repo: 'org/alumne', group: '2DAW-A', challenge_id: 'r2-s05-test',
      score: 8, ra_scores: [], confidence: 1, teacher_review_required: false, provisional: true,
      commit: '1234567890abcdef1234567890abcdef12345678', source: 'openai', batch_id: 'delivery',
      timestamp: '2026-10-20T12:30:00Z', history_dir: 'grades/history/delivery/org__alumne', assessment_context: 'delivery'
    };
    migrateFromJson([baseGrade]);
    migrateFromJson([{ ...baseGrade, batch_id: 'checkpoint', assessment_context: 'classroom_end', classroom_session_id: session.id }]);
    assert.equal(getLatestDeliveryGrade('org/alumne', 'r2-s05-test').assessment_context, 'delivery');
  } finally {
    closeDb();
    rmSync(dir, { recursive: true, force: true });
  }
});
