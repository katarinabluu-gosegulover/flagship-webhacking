const assert = require('node:assert/strict');
require('../notification-state.js');

const values = new Map();
const storage = {
  getItem: (key) => values.get(key) ?? null,
  setItem: (key, value) => values.set(key, value),
};
const first = { id: 'assignment-1' };
const second = { id: 'assignment-2' };

assert.deepEqual(globalThis.flagshipNotifications.unread([first], storage, 'student-a'), [first]);
globalThis.flagshipNotifications.markRead([first], storage, 'student-a');
assert.deepEqual(globalThis.flagshipNotifications.unread([first], storage, 'student-a'), []);
assert.deepEqual(globalThis.flagshipNotifications.unread([first], storage, 'student-b'), [first], '읽음 상태는 사용자별로 분리되어야 합니다.');
assert.deepEqual(globalThis.flagshipNotifications.unread([first, second], storage, 'student-a'), [second], '새 과제는 다시 알림으로 표시되어야 합니다.');
globalThis.flagshipNotifications.markRead([first, second], storage, 'student-a');
assert.deepEqual(globalThis.flagshipNotifications.unread([first, second], storage, 'student-a'), [], '모두 읽음 처리 후 알림 개수는 0이어야 합니다.');

console.log('notification-state: all assertions passed');
