import Database from 'better-sqlite3';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, '..', 'grades', 'dashboard.db');

let db = null;

export function initDb(dbPath = DB_PATH) {
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');

  // Taula d'alumnes/repositoris
  db.exec(`
    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_name TEXT,
      repo TEXT UNIQUE NOT NULL,
      group_name TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const studentColumns = db.prepare('PRAGMA table_info(students)').all().map((column) => column.name);
  if (!studentColumns.includes('student_name')) {
    db.exec('ALTER TABLE students ADD COLUMN student_name TEXT');
  }

  // Taula de microreptes
  db.exec(`
    CREATE TABLE IF NOT EXISTS challenges (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      challenge_id TEXT UNIQUE NOT NULL,
      title TEXT,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Taula de resultats d'autocorrecció
  db.exec(`
    CREATE TABLE IF NOT EXISTS grades (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      challenge_id INTEGER NOT NULL,
      score REAL,
      ra_scores TEXT,
      confidence REAL,
      feedback TEXT,
      teacher_review_required BOOLEAN,
      provisional BOOLEAN,
      commit_hash TEXT,
      source TEXT,
      batch_id TEXT,
      timestamp DATETIME,
      history_dir TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES students(id),
      FOREIGN KEY (challenge_id) REFERENCES challenges(id),
      UNIQUE(student_id, challenge_id, commit_hash)
    )
  `);

  const gradeColumns = db.prepare('PRAGMA table_info(grades)').all().map((column) => column.name);
  if (!gradeColumns.includes('ra_scores')) {
    db.exec('ALTER TABLE grades ADD COLUMN ra_scores TEXT');
  }

  if (!gradeColumns.includes('repte_extension')) {
    db.exec('ALTER TABLE grades ADD COLUMN repte_extension TEXT');
  }

  if (!gradeColumns.includes('assessment_context')) {
    db.exec("ALTER TABLE grades ADD COLUMN assessment_context TEXT DEFAULT 'delivery'");
  }

  if (!gradeColumns.includes('classroom_session_id')) {
    db.exec('ALTER TABLE grades ADD COLUMN classroom_session_id INTEGER');
  }

  // Taula de criteris avaluació (per a desglossar la nota)
  db.exec(`
    CREATE TABLE IF NOT EXISTS grade_criteria (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      grade_id INTEGER NOT NULL,
      criterion_name TEXT,
      criterion_score REAL,
      criterion_feedback TEXT,
      FOREIGN KEY (grade_id) REFERENCES grades(id)
    )
  `);

  // Registre docent de com ha anat cada sessió de programació d'aula.
  db.exec(`
    CREATE TABLE IF NOT EXISTS classroom_session_notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      session_date TEXT NOT NULL,
      comment TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const noteColumns = db.prepare('PRAGMA table_info(classroom_session_notes)').all().map(column => column.name);
  if (!noteColumns.includes('group_name')) {
    db.exec('ALTER TABLE classroom_session_notes ADD COLUMN group_name TEXT');
  }

  // Sessions i snapshots immutables usats per estimar automàticament el treball d'aula.
  db.exec(`
    CREATE TABLE IF NOT EXISTS classroom_work_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      group_name TEXT NOT NULL,
      challenge_id TEXT NOT NULL,
      session_code TEXT,
      status TEXT NOT NULL DEFAULT 'open',
      started_at TEXT NOT NULL,
      ended_at TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS classroom_checkpoints (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER NOT NULL,
      student_id INTEGER NOT NULL,
      phase TEXT NOT NULL,
      commit_hash TEXT,
      capture_status TEXT NOT NULL DEFAULT 'captured',
      technical_score REAL,
      grade_id INTEGER,
      error_message TEXT,
      captured_at TEXT NOT NULL,
      FOREIGN KEY (session_id) REFERENCES classroom_work_sessions(id),
      FOREIGN KEY (student_id) REFERENCES students(id),
      FOREIGN KEY (grade_id) REFERENCES grades(id),
      UNIQUE(session_id, student_id, phase)
    );

    CREATE TABLE IF NOT EXISTS classroom_work_assessments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER NOT NULL,
      student_id INTEGER NOT NULL,
      challenge_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      automatic_level TEXT,
      automatic_ratio REAL,
      automatic_cap REAL,
      automatic_reason TEXT,
      teacher_override_level TEXT,
      teacher_override_reason TEXT,
      teacher_override_at TEXT,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (session_id) REFERENCES classroom_work_sessions(id),
      FOREIGN KEY (student_id) REFERENCES students(id),
      UNIQUE(session_id, student_id)
    );
  `);

  // Índexs per rendiment
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_grades_student ON grades(student_id);
    CREATE INDEX IF NOT EXISTS idx_grades_challenge ON grades(challenge_id);
    CREATE INDEX IF NOT EXISTS idx_grades_timestamp ON grades(timestamp);
    CREATE INDEX IF NOT EXISTS idx_students_group ON students(group_name);
    CREATE INDEX IF NOT EXISTS idx_classroom_session_notes_session ON classroom_session_notes(session_id);
    CREATE INDEX IF NOT EXISTS idx_classroom_work_sessions_group_challenge ON classroom_work_sessions(group_name, challenge_id);
    CREATE INDEX IF NOT EXISTS idx_classroom_checkpoints_session ON classroom_checkpoints(session_id);
    CREATE INDEX IF NOT EXISTS idx_classroom_work_assessments_student_challenge ON classroom_work_assessments(student_id, challenge_id);
  `);

  return db;
}

export function getDb() {
  if (!db) {
    initDb();
  }
  return db;
}

export function closeDb() {
  if (db) {
    db.close();
    db = null;
  }
}

// Operacions d'alumnes
export function upsertStudent(repo, groupName, studentName = null) {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO students (repo, group_name, student_name) 
    VALUES (?, ?, ?)
    ON CONFLICT(repo) DO UPDATE SET
      group_name = excluded.group_name,
      student_name = COALESCE(NULLIF(TRIM(excluded.student_name), ''), students.student_name)
  `);
  return stmt.run(repo, groupName, studentName);
}

export function getStudents(filters = {}) {
  const db = getDb();
  let query = `
    SELECT
      s.*,
      COUNT(g.id) AS grade_count
    FROM students s
    LEFT JOIN grades g ON g.student_id = s.id
    WHERE 1=1
  `;
  const params = [];

  if (typeof filters === 'string') {
    filters = { group_name: filters };
  }

  if (filters.group_name) {
    query += ' AND s.group_name = ?';
    params.push(filters.group_name);
  }

  if (filters.search) {
    query += ' AND (s.repo LIKE ? OR s.student_name LIKE ?)';
    params.push(`%${filters.search}%`, `%${filters.search}%`);
  }

  query += ' GROUP BY s.id ORDER BY s.group_name, s.student_name, s.repo';

  const stmt = db.prepare(query);
  return stmt.all(...params);
}

export function getStudentById(studentId) {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT
      s.*,
      COUNT(g.id) AS grade_count
    FROM students s
    LEFT JOIN grades g ON g.student_id = s.id
    WHERE s.id = ?
    GROUP BY s.id
  `);
  return stmt.get(studentId);
}

export function updateStudent(studentId, studentData) {
  const db = getDb();
  const stmt = db.prepare(`
    UPDATE students
    SET
      repo = ?,
      group_name = ?,
      student_name = ?
    WHERE id = ?
  `);
  return stmt.run(
    studentData.repo,
    studentData.group_name,
    studentData.student_name,
    studentId
  );
}

export function deleteStudent(studentId) {
  const db = getDb();
  const removeStudent = db.transaction((id) => {
    const student = getStudentById(id);

    if (!student) {
      return { changes: 0, deleted_grades: 0, deleted_criteria: 0, student: null };
    }

    const grades = db.prepare('SELECT id FROM grades WHERE student_id = ?').all(id);
    let deletedCriteria = 0;

    for (const grade of grades) {
      deletedCriteria += db.prepare('DELETE FROM grade_criteria WHERE grade_id = ?').run(grade.id).changes;
    }

    db.prepare('DELETE FROM classroom_work_assessments WHERE student_id = ?').run(id);
    db.prepare('DELETE FROM classroom_checkpoints WHERE student_id = ?').run(id);
    const deletedGrades = db.prepare('DELETE FROM grades WHERE student_id = ?').run(id).changes;
    const result = db.prepare('DELETE FROM students WHERE id = ?').run(id);

    return {
      changes: result.changes,
      deleted_grades: deletedGrades,
      deleted_criteria: deletedCriteria,
      student
    };
  });

  return removeStudent(studentId);
}

export function deleteGrade(gradeId) {
  const db = getDb();
  const removeGrade = db.transaction((id) => {
    const grade = getGradeById(id);

    if (!grade) {
      return { changes: 0, deleted_criteria: 0, grade: null };
    }

    const deletedCriteria = db.prepare('DELETE FROM grade_criteria WHERE grade_id = ?').run(id).changes;
    const result = db.prepare('DELETE FROM grades WHERE id = ?').run(id);

    return {
      changes: result.changes,
      deleted_criteria: deletedCriteria,
      grade
    };
  });

  return removeGrade(gradeId);
}

// Operacions de microreptes
export function upsertChallenge(challengeId, title = null, description = null) {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO challenges (challenge_id, title, description)
    VALUES (?, ?, ?)
    ON CONFLICT(challenge_id) DO UPDATE SET 
      title = COALESCE(excluded.title, title),
      description = COALESCE(excluded.description, description)
  `);
  return stmt.run(challengeId, title, description);
}

export function getChallenges() {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM challenges ORDER BY challenge_id');
  return stmt.all();
}

export function getClassroomSessionNotes(sessionId) {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT *
    FROM classroom_session_notes
    WHERE session_id = ?
    ORDER BY session_date DESC, created_at DESC
  `);
  return stmt.all(sessionId);
}

export function insertClassroomSessionNote(sessionId, sessionDate, comment, groupName) {
  if (typeof groupName !== 'string' || !groupName.trim()) throw new Error('Cal indicar el grup del comentari.');
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO classroom_session_notes (session_id, session_date, comment, group_name)
    VALUES (?, ?, ?, ?)
  `);
  return stmt.run(sessionId, sessionDate, comment, groupName.trim());
}

export function createClassroomWorkSession(sessionData) {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO classroom_work_sessions (
      group_name, challenge_id, session_code, status, started_at
    ) VALUES (?, ?, ?, 'open', ?)
  `);
  const result = stmt.run(
    sessionData.group_name,
    sessionData.challenge_id,
    sessionData.session_code || null,
    sessionData.started_at
  );
  return getClassroomWorkSessionById(result.lastInsertRowid);
}

export function getClassroomWorkSessionById(sessionId) {
  return getDb().prepare('SELECT * FROM classroom_work_sessions WHERE id = ?').get(sessionId);
}

export function getOpenClassroomWorkSession(groupName, challengeId) {
  return getDb().prepare(`
    SELECT *
    FROM classroom_work_sessions
    WHERE group_name = ? AND challenge_id = ? AND status = 'open'
    ORDER BY id DESC
    LIMIT 1
  `).get(groupName, challengeId);
}

export function getClassroomWorkSessions(filters = {}) {
  let query = `
    SELECT
      ws.*,
      COUNT(DISTINCT cp.student_id) AS checkpoint_students,
      COUNT(DISTINCT wa.student_id) AS assessment_students
    FROM classroom_work_sessions ws
    LEFT JOIN classroom_checkpoints cp ON cp.session_id = ws.id
    LEFT JOIN classroom_work_assessments wa ON wa.session_id = ws.id
    WHERE 1=1
  `;
  const params = [];
  if (filters.group_name) {
    query += ' AND ws.group_name = ?';
    params.push(filters.group_name);
  }
  if (filters.challenge_id) {
    query += ' AND ws.challenge_id = ?';
    params.push(filters.challenge_id);
  }
  query += ' GROUP BY ws.id ORDER BY ws.started_at DESC, ws.id DESC';
  return getDb().prepare(query).all(...params);
}

export function closeClassroomWorkSession(sessionId, endedAt) {
  const db = getDb();
  db.prepare(`
    UPDATE classroom_work_sessions
    SET status = 'closed', ended_at = ?
    WHERE id = ? AND status = 'open'
  `).run(endedAt, sessionId);
  return getClassroomWorkSessionById(sessionId);
}

export function upsertClassroomCheckpoint(checkpoint) {
  const db = getDb();
  db.prepare(`
    INSERT INTO classroom_checkpoints (
      session_id, student_id, phase, commit_hash, capture_status,
      technical_score, grade_id, error_message, captured_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(session_id, student_id, phase) DO UPDATE SET
      commit_hash = excluded.commit_hash,
      capture_status = excluded.capture_status,
      technical_score = excluded.technical_score,
      grade_id = excluded.grade_id,
      error_message = excluded.error_message,
      captured_at = excluded.captured_at
  `).run(
    checkpoint.session_id,
    checkpoint.student_id,
    checkpoint.phase,
    checkpoint.commit_hash || null,
    checkpoint.capture_status || 'captured',
    checkpoint.technical_score ?? null,
    checkpoint.grade_id || null,
    checkpoint.error_message || null,
    checkpoint.captured_at
  );
  return db.prepare(`
    SELECT cp.*, s.repo, s.group_name
    FROM classroom_checkpoints cp
    JOIN students s ON s.id = cp.student_id
    WHERE cp.session_id = ? AND cp.student_id = ? AND cp.phase = ?
  `).get(checkpoint.session_id, checkpoint.student_id, checkpoint.phase);
}

export function getClassroomCheckpoints(sessionId) {
  return getDb().prepare(`
    SELECT cp.*, s.repo, s.student_name, s.group_name
    FROM classroom_checkpoints cp
    JOIN students s ON s.id = cp.student_id
    WHERE cp.session_id = ?
    ORDER BY s.student_name, s.repo, cp.phase
  `).all(sessionId);
}

export function updateClassroomCheckpointScore(sessionId, studentId, phase, scoreData) {
  getDb().prepare(`
    UPDATE classroom_checkpoints
    SET technical_score = ?, grade_id = ?, capture_status = ?, error_message = ?
    WHERE session_id = ? AND student_id = ? AND phase = ?
  `).run(
    scoreData.technical_score ?? null,
    scoreData.grade_id || null,
    scoreData.capture_status || 'graded',
    scoreData.error_message || null,
    sessionId,
    studentId,
    phase
  );
}

export function upsertClassroomWorkAssessment(assessment) {
  const now = assessment.updated_at || new Date().toISOString();
  const db = getDb();
  db.prepare(`
    INSERT INTO classroom_work_assessments (
      session_id, student_id, challenge_id, status, automatic_level,
      automatic_ratio, automatic_cap, automatic_reason, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(session_id, student_id) DO UPDATE SET
      status = excluded.status,
      automatic_level = excluded.automatic_level,
      automatic_ratio = excluded.automatic_ratio,
      automatic_cap = excluded.automatic_cap,
      automatic_reason = excluded.automatic_reason,
      updated_at = excluded.updated_at
  `).run(
    assessment.session_id,
    assessment.student_id,
    assessment.challenge_id,
    assessment.status,
    assessment.automatic_level || null,
    assessment.classroom_ratio ?? null,
    assessment.automatic_cap ?? null,
    assessment.reason || '',
    now
  );
  return getClassroomWorkAssessment(assessment.session_id, assessment.student_id);
}

export function getClassroomWorkAssessment(sessionId, studentId) {
  return getDb().prepare(`
    SELECT
      wa.*,
      s.repo,
      s.student_name,
      s.group_name,
      ws.session_code,
      ws.started_at,
      ws.ended_at
    FROM classroom_work_assessments wa
    JOIN students s ON s.id = wa.student_id
    JOIN classroom_work_sessions ws ON ws.id = wa.session_id
    WHERE wa.session_id = ? AND wa.student_id = ?
  `).get(sessionId, studentId);
}

export function getLatestClassroomWorkAssessment(repo, challengeId) {
  return getDb().prepare(`
    SELECT
      wa.*,
      s.repo,
      s.student_name,
      s.group_name,
      ws.session_code,
      ws.started_at,
      ws.ended_at
    FROM classroom_work_assessments wa
    JOIN students s ON s.id = wa.student_id
    JOIN classroom_work_sessions ws ON ws.id = wa.session_id
    WHERE s.repo = ? AND wa.challenge_id = ?
    ORDER BY ws.started_at DESC, wa.id DESC
    LIMIT 1
  `).get(repo, challengeId);
}

export function getClassroomWorkAssessments(filters = {}) {
  let query = `
    SELECT
      wa.*,
      s.repo,
      s.student_name,
      s.group_name,
      ws.session_code,
      ws.started_at,
      ws.ended_at
    FROM classroom_work_assessments wa
    JOIN students s ON s.id = wa.student_id
    JOIN classroom_work_sessions ws ON ws.id = wa.session_id
    WHERE 1=1
  `;
  const params = [];
  if (filters.group_name) {
    query += ' AND s.group_name = ?';
    params.push(filters.group_name);
  }
  if (filters.challenge_id) {
    query += ' AND wa.challenge_id = ?';
    params.push(filters.challenge_id);
  }
  if (filters.repo) {
    query += ' AND s.repo = ?';
    params.push(filters.repo);
  }
  query += ' ORDER BY ws.started_at DESC, s.student_name, s.repo';
  return getDb().prepare(query).all(...params);
}

export function saveClassroomWorkOverride(sessionId, studentId, override) {
  const level = override?.level || null;
  const reason = level ? String(override.reason || '').trim() : '';
  const overrideAt = level ? new Date().toISOString() : null;
  getDb().prepare(`
    UPDATE classroom_work_assessments
    SET teacher_override_level = ?, teacher_override_reason = ?,
        teacher_override_at = ?, updated_at = ?
    WHERE session_id = ? AND student_id = ?
  `).run(level, reason, overrideAt, new Date().toISOString(), sessionId, studentId);
  return getClassroomWorkAssessment(sessionId, studentId);
}

// Operacions de notes
export function insertGrade(gradeData) {
  const db = getDb();
  const {
    student_id,
    challenge_id,
    score,
    ra_scores,
    repte_extension,
    confidence,
    feedback,
    teacher_review_required,
    provisional,
    commit_hash,
    source,
    batch_id,
    timestamp,
    history_dir,
    assessment_context,
    classroom_session_id
  } = gradeData;

  const stmt = db.prepare(`
    INSERT INTO grades (
      student_id, challenge_id, score, ra_scores, repte_extension, confidence, feedback,
      teacher_review_required, provisional, commit_hash, source,
      batch_id, timestamp, history_dir, assessment_context, classroom_session_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  return stmt.run(
    student_id, challenge_id, score, JSON.stringify(Array.isArray(ra_scores) ? ra_scores : []), JSON.stringify(repte_extension || null), confidence, feedback,
    teacher_review_required ? 1 : 0, provisional ? 1 : 0, commit_hash, source,
    batch_id, timestamp, history_dir, assessment_context || 'delivery', classroom_session_id || null
  );
}

export function getLatestGrades(limit = 100, filters = {}) {
  const db = getDb();
  let query = `
    SELECT 
      g.id,
      s.repo,
      s.group_name,
      c.challenge_id,
      g.score,
      g.ra_scores,
      g.repte_extension,
      g.confidence,
      g.feedback,
      g.teacher_review_required,
      g.provisional,
      g.commit_hash,
      g.source,
      g.batch_id,
      g.timestamp,
      g.history_dir,
      g.assessment_context,
      g.classroom_session_id,
      g.created_at
    FROM grades g
    JOIN students s ON g.student_id = s.id
    JOIN challenges c ON g.challenge_id = c.id
    WHERE 1=1
  `;

  const params = [];

  if (filters.group_name) {
    query += ' AND s.group_name = ?';
    params.push(filters.group_name);
  }

  if (filters.challenge_id) {
    query += ' AND c.challenge_id = ?';
    params.push(filters.challenge_id);
  }

  if (filters.repo) {
    query += ' AND s.repo LIKE ?';
    params.push(`%${filters.repo}%`);
  }

  if (filters.from_date) {
    query += ' AND g.timestamp >= ?';
    params.push(filters.from_date);
  }

  if (filters.to_date) {
    query += ' AND g.timestamp <= ?';
    params.push(filters.to_date);
  }

  if (filters.assessment_context === 'all') {
    // Sense filtre: ús intern per relacionar checkpoints amb resultats.
  } else if (filters.assessment_context) {
    query += ' AND COALESCE(g.assessment_context, \'delivery\') = ?';
    params.push(filters.assessment_context);
  } else {
    query += " AND COALESCE(g.assessment_context, 'delivery') = 'delivery'";
  }

  query += `
    ORDER BY
      CASE LOWER(COALESCE(g.source, ''))
        WHEN 'openai' THEN 0
        WHEN 'dashboard' THEN 1
        WHEN 'teacher' THEN 1
        WHEN 'manual-import' THEN 1
        WHEN 'mock' THEN 3
        ELSE 2
      END,
      g.timestamp DESC
    LIMIT ?
  `;
  params.push(limit);

  const stmt = db.prepare(query);
  return stmt.all(...params);
}

export function getGradeById(gradeId) {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT 
      g.id,
      s.repo,
      s.group_name,
      c.challenge_id,
      g.score,
      g.ra_scores,
      g.repte_extension,
      g.confidence,
      g.feedback,
      g.teacher_review_required,
      g.provisional,
      g.commit_hash,
      g.source,
      g.batch_id,
      g.timestamp,
      g.history_dir,
      g.assessment_context,
      g.classroom_session_id,
      g.created_at
    FROM grades g
    JOIN students s ON g.student_id = s.id
    JOIN challenges c ON g.challenge_id = c.id
    WHERE g.id = ?
  `);
  return stmt.get(gradeId);
}

export function getStudentGrades(studentId) {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT 
      g.*,
      c.challenge_id,
      s.repo
    FROM grades g
    JOIN challenges c ON g.challenge_id = c.id
    JOIN students s ON g.student_id = s.id
    WHERE g.student_id = ?
    ORDER BY g.timestamp DESC
  `);
  return stmt.all(studentId);
}

export function getGradeByCommit(repo, challengeId, commitHash, assessmentContext = null, classroomSessionId = null) {
  let query = `
    SELECT
      g.*,
      c.challenge_id,
      s.repo,
      s.group_name
    FROM grades g
    JOIN challenges c ON g.challenge_id = c.id
    JOIN students s ON g.student_id = s.id
    WHERE s.repo = ? AND c.challenge_id = ? AND g.commit_hash = ?
  `;
  const params = [repo, challengeId, commitHash];
  if (assessmentContext) {
    query += ' AND COALESCE(g.assessment_context, \'delivery\') = ?';
    params.push(assessmentContext);
  }
  if (classroomSessionId !== null && classroomSessionId !== undefined) {
    query += ' AND g.classroom_session_id = ?';
    params.push(classroomSessionId);
  }
  query += ' ORDER BY g.timestamp DESC, g.id DESC LIMIT 1';
  return getDb().prepare(query).get(...params);
}

export function getLatestDeliveryGrade(repo, challengeId) {
  return getDb().prepare(`
    SELECT
      g.*,
      c.challenge_id,
      s.repo,
      s.group_name
    FROM grades g
    JOIN challenges c ON g.challenge_id = c.id
    JOIN students s ON g.student_id = s.id
    WHERE s.repo = ? AND c.challenge_id = ?
      AND COALESCE(g.assessment_context, 'delivery') = 'delivery'
    ORDER BY g.timestamp DESC, g.id DESC
    LIMIT 1
  `).get(repo, challengeId);
}

export function getStatistics(groupName = null) {
  const db = getDb();
  let query = `
    SELECT 
      s.group_name,
      COUNT(DISTINCT g.student_id) as student_count,
      COUNT(g.id) as total_grades,
      AVG(g.score) as avg_score,
      MIN(g.score) as min_score,
      MAX(g.score) as max_score,
      SUM(CASE WHEN g.teacher_review_required = 1 THEN 1 ELSE 0 END) as review_required_count
    FROM grades g
    JOIN students s ON g.student_id = s.id
    WHERE 1=1
  `;

  const params = [];

  if (groupName) {
    query += ' AND s.group_name = ?';
    params.push(groupName);
  }

  query += ' GROUP BY s.group_name';

  const stmt = db.prepare(query);
  return stmt.all(...params);
}

export function migrateFromJson(jsonGrades) {
  const db = getDb();

  for (const grade of jsonGrades) {
    // Upsert student
    db.prepare(`
      INSERT OR IGNORE INTO students (repo, group_name, student_name) VALUES (?, ?, ?)
    `).run(grade.repo || grade.student, grade.group, grade.student_name || null);
    
    const studentId = db.prepare('SELECT id FROM students WHERE repo = ?')
      .get(grade.repo || grade.student).id;

    // Upsert challenge
    db.prepare(`
      INSERT OR IGNORE INTO challenges (challenge_id) VALUES (?)
    `).run(grade.challenge_id);

    const challengeId = db.prepare('SELECT id FROM challenges WHERE challenge_id = ?')
      .get(grade.challenge_id).id;

    // Insert grade
    db.prepare(`
      INSERT OR IGNORE INTO grades (
        student_id, challenge_id, score, ra_scores, repte_extension, confidence, teacher_review_required,
        provisional, commit_hash, source, batch_id, timestamp, history_dir,
        assessment_context, classroom_session_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(student_id, challenge_id, commit_hash) DO UPDATE SET
        score = excluded.score, ra_scores = excluded.ra_scores,
        repte_extension = excluded.repte_extension, confidence = excluded.confidence,
        teacher_review_required = excluded.teacher_review_required, provisional = excluded.provisional,
        source = excluded.source, batch_id = excluded.batch_id,
        timestamp = excluded.timestamp,
        history_dir = CASE
          WHEN excluded.assessment_context = 'delivery' THEN excluded.history_dir
          WHEN COALESCE(grades.assessment_context, 'delivery') = 'delivery' THEN grades.history_dir
          ELSE excluded.history_dir
        END,
        assessment_context = CASE
          WHEN excluded.assessment_context = 'delivery' THEN 'delivery'
          ELSE grades.assessment_context
        END,
        classroom_session_id = CASE
          WHEN excluded.assessment_context = 'delivery' THEN NULL
          ELSE COALESCE(grades.classroom_session_id, excluded.classroom_session_id)
        END
      WHERE excluded.timestamp >= grades.timestamp
    `).run(
      studentId,
      challengeId,
      grade.score,
      JSON.stringify(Array.isArray(grade.ra_scores) ? grade.ra_scores : []),
      JSON.stringify(grade.repte_extension || null),
      grade.confidence,
      grade.teacher_review_required ? 1 : 0,
      grade.provisional ? 1 : 0,
      grade.commit,
      grade.source,
      grade.batch_id,
      grade.timestamp,
      grade.history_dir,
      grade.assessment_context || 'delivery',
      grade.classroom_session_id || null
    );
  }
}
