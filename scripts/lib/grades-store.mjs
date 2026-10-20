import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

export const gradeFields = [
  'student',
  'repo',
  'group',
  'challenge_id',
  'score',
  'ra_scores',
  'repte_extension',
  'confidence',
  'teacher_review_required',
  'provisional',
  'commit',
  'timestamp',
  'source',
  'assessment_context',
  'classroom_session_id',
  'batch_id',
  'history_dir'
];

export const csvHeader = `${gradeFields.join(',')}\n`;

export function getGradesPaths(rootDir = process.cwd()) {
  const gradesDir = path.join(rootDir, 'grades');

  return {
    gradesDir,
    jsonPath: path.join(gradesDir, 'latest-grades.json'),
    csvPath: path.join(gradesDir, 'latest-grades.csv'),
    classroomJsonPath: path.join(gradesDir, 'classroom-checkpoint-grades.json')
  };
}

export async function readGrades(rootDir = process.cwd()) {
  const { jsonPath } = getGradesPaths(rootDir);

  try {
    const content = await readFile(jsonPath, 'utf8');
    const grades = JSON.parse(content);

    if (!Array.isArray(grades)) {
      throw new Error('grades/latest-grades.json ha de contindre un array JSON');
    }

    return grades;
  } catch (error) {
    if (error.code === 'ENOENT') {
      return [];
    }

    throw error;
  }
}

export async function readClassroomCheckpointGrades(rootDir = process.cwd()) {
  const { classroomJsonPath } = getGradesPaths(rootDir);
  try {
    const content = await readFile(classroomJsonPath, 'utf8');
    const grades = JSON.parse(content);
    if (!Array.isArray(grades)) throw new Error('grades/classroom-checkpoint-grades.json ha de contindre un array JSON');
    return grades;
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
}

function csvEscape(value) {
  const text = value === null || value === undefined
    ? ''
    : typeof value === 'object'
      ? JSON.stringify(value)
      : String(value);

  if (/[",\n\r]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`;
  }

  return text;
}

export function gradeToCsvLine(grade) {
  return `${gradeFields.map((field) => csvEscape(grade[field])).join(',')}\n`;
}

export async function writeGrades(grades, rootDir = process.cwd()) {
  const { gradesDir, jsonPath, csvPath } = getGradesPaths(rootDir);

  await mkdir(gradesDir, { recursive: true });
  await writeFile(jsonPath, `${JSON.stringify(grades, null, 2)}\n`, 'utf8');
  await writeFile(csvPath, `${csvHeader}${grades.map(gradeToCsvLine).join('')}`, 'utf8');
}

function gradeKey(grade) {
  return [
    grade.repo || grade.student || '',
    grade.challenge_id || ''
  ].join('\u0000');
}

export async function appendGrade(grade, rootDir = process.cwd()) {
  const grades = await readGrades(rootDir);
  const nextGrades = grades.filter((currentGrade) => gradeKey(currentGrade) !== gradeKey(grade));
  nextGrades.push(grade);
  nextGrades.sort((left, right) => {
    const leftTime = left.timestamp || '';
    const rightTime = right.timestamp || '';
    return leftTime.localeCompare(rightTime);
  });
  await writeGrades(nextGrades, rootDir);

  return grade;
}

export async function appendClassroomCheckpointGrade(grade, rootDir = process.cwd()) {
  const { gradesDir, classroomJsonPath } = getGradesPaths(rootDir);
  const grades = await readClassroomCheckpointGrades(rootDir);
  const key = [
    grade.repo || grade.student || '',
    grade.challenge_id || '',
    grade.commit || '',
    grade.assessment_context || '',
    grade.classroom_session_id || ''
  ].join('\u0000');
  const nextGrades = grades.filter((current) => [
    current.repo || current.student || '',
    current.challenge_id || '',
    current.commit || '',
    current.assessment_context || '',
    current.classroom_session_id || ''
  ].join('\u0000') !== key);
  nextGrades.push(grade);
  nextGrades.sort((left, right) => String(left.timestamp || '').localeCompare(String(right.timestamp || '')));
  await mkdir(gradesDir, { recursive: true });
  await writeFile(classroomJsonPath, `${JSON.stringify(nextGrades, null, 2)}\n`, 'utf8');
  return grade;
}
