// Export only isolated fixture responses, never browser/user storage or production endpoints.
import { writeFile } from 'node:fs/promises';
import { createMockFetch } from '../mock/api.js';
const values = new Map(),
  fetch = createMockFetch({
    storage: {
      getItem: (key) => values.get(key) || null,
      setItem: (key, value) => values.set(key, value),
    },
  });
let token;
async function call(path, method = 'GET', body) {
  const response = await fetch('/backend' + path, {
    method,
    headers: token ? { Authorization: 'Bearer ' + token } : {},
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return { httpStatus: response.status, body: await response.json() };
}
const session = await call('/auth/login', 'POST', {
  email: 'admin@vovinam.test',
  password: 'Vovinam123!',
});
token = session.body.data.tokens.accessToken;
const examples = {
  'POST /auth/login': {
    httpStatus: 200,
    body: {
      ...session.body,
      data: {
        ...session.body.data,
        tokens: {
          accessToken: '<access-token>',
          refreshToken: '<refresh-token>',
        },
      },
    },
  },
};
for (const path of [
  '/auth/me',
  '/permissions',
  '/organization/navigation?module=classes',
  '/lookups?module=invoices',
  '/dashboard',
  '/notifications',
  '/students?page=1&limit=2',
  '/students/s-1',
  '/promotions?page=1&limit=2',
  '/report-charts/attendance-report',
  '/attendance-workflow/dates',
])
  examples['GET ' + path] = await call(path);
const date = examples['GET /attendance-workflow/dates'].body.data.dates[0],
  sessions = await call('/attendance-workflow/sessions?date=' + date),
  sessionId = sessions.body.data.items[0].id;
examples['GET /attendance-workflow/sessions?date={date}'] = sessions;
examples['GET /attendance-workflow/sessions/{id}'] = await call(
  '/attendance-workflow/sessions/' + sessionId,
);
examples['422 validation'] = {
  httpStatus: 422,
  body: {
    code: 422,
    message: 'Vui lòng kiểm tra thông tin.',
    data: null,
    errors: {
      fullName: 'Họ tên không được để trống.',
      classId: 'Lớp không thuộc phạm vi được cấp quyền.',
    },
  },
};
examples['409 conflict'] = {
  httpStatus: 409,
  body: {
    code: 409,
    message: 'Bản ghi đã được xử lý. Vui lòng tải lại.',
    data: null,
  },
};
await writeFile(
  'contracts/example-responses.json',
  JSON.stringify(
    { source: 'isolated synthetic fixtures only', examples },
    null,
    2,
  ) + '\n',
);
console.log(Object.keys(examples).length + ' example responses written');
