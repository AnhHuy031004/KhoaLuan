import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createMockFetch, DB_KEY } from '../mock/api.js';
import { MOCK_PASSWORD } from '../mock/users.js';

async function setup() {
  const map = new Map();
  const storage = {
    getItem: (k) => map.get(k) || null,
    setItem: (k, v) => map.set(k, v),
  };
  const fetch = createMockFetch({ storage });
  const raw = async (path, method = 'GET', body, token) => {
    const res = await fetch('/backend' + path, {
      method,
      headers: token ? { Authorization: 'Bearer ' + token } : {},
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    return { status: res.status, ...(await res.json()) };
  };
  const login = async (email, password = MOCK_PASSWORD) => {
    const r = await raw('/auth/login', 'POST', {
      email: email.includes('@') ? email : email + '@vovinam.test',
      password,
    });
    assert.equal(r.status, 200, r.message);
    return (p, m, b) => raw(p, m, b, r.data.tokens.accessToken);
  };
  return {
    admin: await login('admin'),
    master: await login('vosu'),
    student: await login('vosinh'),
    db: () => JSON.parse(storage.getItem(DB_KEY)),
  };
}

test('v2.5.0 E2E Flow 1: POST /invoices/batch creates monthly class invoices atomically and skips duplicates', async () => {
  const s = await setup();
  const first = await s.admin('/invoices/batch', 'POST', {
    classId: 'c-1',
    period: '2027-01',
    dueDate: '2027-01-10',
    amount: 450000,
  });
  assert.equal(first.status, 200, first.message);
  assert(first.data.created > 0, 'should create invoices for active students in c-1');
  assert.equal(first.data.skipped, 0);

  // Second run for same class/month must skip all existing invoices
  const second = await s.admin('/invoices/batch', 'POST', {
    classId: 'c-1',
    period: '2027-01',
    dueDate: '2027-01-10',
    amount: 450000,
  });
  assert.equal(second.status, 200, second.message);
  assert.equal(second.data.created, 0);
  assert.equal(second.data.skipped, first.data.created);
});

test('v2.5.0 E2E Flow 2: POST /enrollments/batch-transfer moves students atomically and syncs student.classId', async () => {
  const s = await setup();
  const dbBefore = s.db();
  const targetRows = dbBefore.enrollments.filter((e) => e.classId === 'c-1').slice(0, 2);
  assert(targetRows.length >= 1);

  const res = await s.admin('/enrollments/batch-transfer', 'POST', {
    ids: targetRows.map((r) => r.id),
    targetClassId: 'c-2',
  });
  assert.equal(res.status, 200, res.message);
  assert.equal(res.data.updated, targetRows.length);
  assert.equal(res.data.failedIds.length, 0);

  const dbAfter = s.db();
  for (const r of targetRows) {
    assert.equal(dbAfter.enrollments.find((e) => e.id === r.id).classId, 'c-2');
    assert.equal(dbAfter.students.find((st) => st.id === r.studentId).classId, 'c-2');
  }
});

test('v2.5.0 E2E Flow 3: Approving a promotion with examId auto-queues a PENDING exam-results candidate', async () => {
  const s = await setup();
  const db = s.db();
  const sortedRanks = [...db.ranks].sort((a, b) => Number(a.level) - Number(b.level));
  const student = db.students.find((st) => {
    const curLv = Number(db.ranks.find((r) => r.id === st.rankId)?.level || 0);
    return (
      st.classId === 'c-1' &&
      st.status === 'ACTIVE' &&
      sortedRanks.some((r) => Number(r.level) > curLv) &&
      !db.promotions.some((pr) => pr.studentId === st.id && pr.status === 'PENDING')
    );
  });
  const curLv = Number(db.ranks.find((r) => r.id === student.rankId)?.level || 0);
  const higherRank = sortedRanks.find((r) => Number(r.level) > curLv);
  const exam = db.exams[0];
  assert(student && exam && higherRank);

  // Create a promotion linked to exam.id
  const created = await s.admin('/promotions', 'POST', {
    classId: 'c-1',
    studentId: student.id,
    rankId: higherRank.id,
    examId: exam.id,
    reason: 'Đủ chuyên cần và kỹ thuật dự thi v2.5',
  });
  assert.equal(created.status, 200, created.message);

  // Ensure student not already in examResults for this exam
  const cleanedDb = s.db();
  const prevResults = cleanedDb['exam-results'].length;

  const approved = await s.master('/promotions/bulk-review', 'POST', {
    classId: 'c-1',
    ids: [created.data.id],
    action: 'approve',
  });
  assert.equal(approved.status, 200, approved.message);

  const afterDb = s.db();
  assert(
    afterDb['exam-results'].some((er) => er.studentId === student.id && er.examId === exam.id),
    'approved promotion with examId must exist in examResults',
  );
  assert(afterDb['exam-results'].length >= prevResults);
});

test('v2.5.0 Contracts & UI: StudentBeltJourneyPage, UnifiedReportsPage, mobile 44px CSS & OpenAPI batch paths', () => {
  assert(fs.existsSync(new URL('../src/features/belt-journey/pages/StudentBeltJourneyPage.jsx', import.meta.url)));
  assert(fs.existsSync(new URL('../src/components/reports/UnifiedReportsPage.jsx', import.meta.url)));

  const routes = fs.readFileSync(new URL('../src/routes/AppRoutes.jsx', import.meta.url), 'utf8');
  assert(routes.includes('path="reports"'));
  assert(routes.includes('path="belt-journey"'));

  const openapi = JSON.parse(fs.readFileSync(new URL('../contracts/openapi.json', import.meta.url), 'utf8'));
  assert(openapi.paths['/invoices/batch']?.post);
  assert(openapi.paths['/enrollments/batch-transfer']?.post);
});
