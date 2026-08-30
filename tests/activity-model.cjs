const assert = require('node:assert/strict');
require('../activity-model.js');

const today = new Date(2026, 7, 20, 12, 0, 0);
const submissions = [
  { id: 'today-1', student_id: 'student-a', submitted_at: new Date(2026, 7, 20, 9, 0, 0).toISOString() },
  { id: 'today-2', student_id: 'student-b', submitted_at: new Date(2026, 7, 20, 10, 0, 0).toISOString() },
  { id: 'yesterday', student_id: 'student-a', submitted_at: new Date(2026, 7, 19, 15, 0, 0).toISOString() },
  { id: 'outside-range', student_id: 'student-a', submitted_at: new Date(2025, 0, 1, 12, 0, 0).toISOString() },
];

const all = globalThis.flagshipActivity.buildActivityModel(submissions, { today, weeks: 16 });
assert.equal(all.days.length, 112, '16주 잔디는 112개 블록이어야 합니다.');
assert.equal(all.filtered.length, 3, '16주 밖의 제출은 요약에서 제외되어야 합니다.');
assert.equal(all.activeDays, 2, '활동 날짜 집계가 일치해야 합니다.');
assert.equal(all.activeStudents, 2, '참여 학생 집계가 일치해야 합니다.');
assert.equal(all.counts.get('2026-08-20'), 2, '같은 날짜의 제출을 합산해야 합니다.');

const studentA = globalThis.flagshipActivity.buildActivityModel(submissions, { today, weeks: 16, studentId: 'student-a' });
assert.equal(studentA.filtered.length, 2, '학생 필터는 해당 학생의 기간 내 제출만 남겨야 합니다.');
assert.equal(studentA.activeStudents, 1, '학생 필터 적용 시 참여 학생은 한 명이어야 합니다.');

const todayCell = all.days.find((day) => day.key === '2026-08-20');
assert.equal(todayCell.level, 2, '제출 2건은 두 번째 색 농도를 사용해야 합니다.');
assert.equal(all.days.filter((day) => day.future).length, 2, '목요일 기준 금·토요일은 미래 블록이어야 합니다.');

console.log('activity-model: all assertions passed');
