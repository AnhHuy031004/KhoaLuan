import test from 'node:test';
import assert from 'node:assert/strict';
import { encodeScores, readScores, totalScore } from "../src/features/exams/utils/scores.js";
import { packBody, operation } from "../src/services/api/schema.js";
test('score totals preserve zeros, decimals and incomplete states', () => {
  assert.equal(totalScore({
    quyenScore: 0,
    theoryFitnessScore: 0,
    basicScore: 0,
    sparringScore: 0
  }), 0);
  assert.equal(totalScore({
    quyenScore: 8.25,
    theoryFitnessScore: 7.5,
    basicScore: 8,
    sparringScore: 7
  }), 30.75);
  assert.equal(totalScore({
    quyenScore: '',
    theoryFitnessScore: 7,
    basicScore: 8,
    sparringScore: 7
  }), null);
  assert.throws(() => encodeScores({
    quyenScore: -1
  }, ''));
});
test('score notes round trip through the existing API DTO', () => {
  const score = {
    quyenScore: 8.25,
    theoryFitnessScore: 7.5,
    basicScore: 8,
    sparringScore: 7
  };
  const body = {
    status: 'RESULT_PASS',
    resultNote: encodeScores(score, 'Võ sinh tiến bộ tốt.')
  };
  assert.deepEqual(packBody(operation('POST /exam-registrations/{id}/result').body, body), body);
  const row = readScores({
    studentId: 's1',
    ...body
  }, [{
    id: 's1',
    fullName: 'Nguyễn Minh An'
  }]);
  assert.equal(row.studentName, 'Nguyễn Minh An');
  assert.equal(row.totalScore, 30.75);
  assert.equal(row.resultNote, 'Võ sinh tiến bộ tốt.');
});
test('legacy records show missing scores instead of fabricated zeros', () => {
  const row = readScores({
    resultNote: 'Nhận xét cũ',
    student: {
      fullName: 'Võ sinh cũ'
    }
  });
  assert.equal(row.totalScore, null);
  assert.equal(row.quyenScore, null);
  assert.equal(row.resultNote, 'Nhận xét cũ');
});
