const assert = require('node:assert/strict');
require('../submission-model.js');

assert.equal(globalThis.flagshipSubmissions.canCancel('submitted'), true, '피드백 전 검사 중 제출은 취소할 수 있어야 합니다.');
assert.equal(globalThis.flagshipSubmissions.canCancel('graded'), false, '채점 완료 제출은 취소할 수 없어야 합니다.');
assert.equal(globalThis.flagshipSubmissions.canCancel('returned'), false, '반환된 제출은 취소할 수 없어야 합니다.');

console.log('submission-model: all assertions passed');
