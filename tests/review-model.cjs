const assert = require('node:assert/strict');
require('../review-model.js');

const objectReview = { score: 90, feedback: '객체 형태 피드백' };
const arrayReview = [{ score: 75, feedback: '배열 형태 피드백' }];

assert.equal(globalThis.flagshipReviews.first(objectReview)?.score, 90, '1:1 관계 객체의 점수를 읽어야 합니다.');
assert.equal(globalThis.flagshipReviews.first(arrayReview)?.score, 75, '배열 형태 응답도 계속 지원해야 합니다.');
assert.equal(globalThis.flagshipReviews.first(null), null, '피드백이 없으면 null을 반환해야 합니다.');

console.log('review-model: all assertions passed');
