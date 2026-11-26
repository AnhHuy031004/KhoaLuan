import { writeFile, readFile, mkdir } from 'node:fs/promises';
import { modules } from '../src/routes/routeConfig.js';
import { filterStatuses } from '../src/config/uiPolicy.js';
import { workflows } from '../src/config/workflows.js';
const check = process.argv.includes('--check');
const ref = (name) => ({ $ref: '#/components/schemas/' + name }),
  array = (items) => ({ type: 'array', items }),
  obj = (properties = {}, required = []) => ({
    type: 'object',
    properties,
    ...(required.length ? { required } : {}),
    additionalProperties: true,
  });
const str = { type: 'string' },
  id = { type: 'string', minLength: 1 },
  nullable = { type: ['string', 'null'] };
const schemas = {};
schemas.ApiError = obj(
  {
    code: { type: 'integer', minimum: 400 },
    message: str,
    data: { type: 'null' },
    errors: {
      oneOf: [
        { type: 'object', additionalProperties: { oneOf: [str, array(str)] } },
        array(obj({ field: str, message: str }, ['field', 'message'])),
      ],
    },
  },
  ['code', 'message', 'data'],
);
schemas.User = obj(
  {
    id,
    email: { type: 'string', format: 'email' },
    fullName: str,
    phone: nullable,
    role: {
      type: 'string',
      description: 'ADMIN, MASTER, INSTRUCTOR, STUDENT hoặc role tùy biến',
    },
    status: { enum: ['ACTIVE', 'PAUSED'] },
    masterLevel: {
      type: ['string', 'null'],
      enum: ['PROVINCE', 'WARD', 'CLUB', '', null],
    },
    provinceId: nullable,
    wardId: nullable,
    clubId: nullable,
    studentId: nullable,
    mfaEnabled: { type: 'boolean' },
  },
  ['id', 'email', 'fullName', 'role', 'status'],
);
schemas.Tokens = obj({ accessToken: str, refreshToken: str }, [
  'accessToken',
  'refreshToken',
]);
schemas.Session = obj({ user: ref('User'), tokens: ref('Tokens') }, [
  'user',
  'tokens',
]);
schemas.MfaChallenge = obj({ mfaRequired: { const: true }, mfaToken: str }, [
  'mfaRequired',
  'mfaToken',
]);
schemas.Role = obj({ id, code: str, name: str, system: { type: 'boolean' } }, [
  'id',
  'code',
  'name',
]);
schemas.Permissions = obj(
  {
    matrix: {
      type: 'object',
      additionalProperties: {
        type: 'object',
        additionalProperties: { type: 'string', pattern: '^[VCEDAP]*$' },
      },
    },
    roles: array(ref('Role')),
  },
  ['matrix', 'roles'],
);
schemas.Lookup = obj(
  Object.fromEntries(
    [
      'provinces',
      'wards',
      'clubs',
      'classes',
      'students',
      'instructors',
      'ranks',
      'exams',
      'invoices',
      'roles',
      'discounts',
      'tuition',
      'tuitionRelief',
    ].map((k) => [k, array(obj())]),
  ),
  ['classes', 'students', 'ranks'],
);
schemas.Lookup.properties.writableClassIds = array(id);
schemas.Lookup.properties.writableStudentIds = array(id);
schemas.OrganizationNavigation = obj(
  {
    province: obj(),
    wards: array(obj()),
    clubs: array(obj()),
    classes: array(obj()),
    functions: array(obj()),
    level: str,
  },
  ['wards', 'clubs', 'functions'],
);
schemas.Dashboard = obj(
  {
    studentCount: { type: 'integer' },
    activeCount: { type: 'integer' },
    classCount: { type: 'integer' },
    unpaid: { type: 'integer' },
    unpaidCount: { type: 'integer' },
    attendanceRate: { type: 'number' },
    classes: array(obj()),
    upcoming: array(obj()),
    announcements: array(obj()),
  },
  [
    'activeCount',
    'unpaid',
    'unpaidCount',
    'attendanceRate',
    'classes',
    'upcoming',
    'announcements',
  ],
);
schemas.Chart = obj(
  {
    id: str,
    type: { enum: ['bar', 'bars', 'line', 'donut'] },
    title: str,
    unit: str,
    money: { type: 'boolean' },
    data: array(
      obj({ id: str, name: str, value: { type: 'number' }, color: str }, [
        'id',
        'name',
        'value',
      ]),
    ),
  },
  ['type', 'title', 'data'],
);
schemas.Report = obj(
  {
    cards: array(obj()),
    charts: array(ref('Chart')),
    classes: array(obj()),
    recordCount: { type: 'integer' },
    note: str,
    generatedAt: str,
  },
  ['cards', 'charts', 'classes', 'recordCount', 'note', 'generatedAt'],
);
schemas.AttendanceRow = obj(
  {
    studentId: id,
    studentCode: str,
    fullName: str,
    rankId: nullable,
    status: { enum: ['UNMARKED', 'PRESENT', 'LATE', 'ABSENT', 'EXCUSED'] },
    confirmedAt: nullable,
    confirmedBy: nullable,
    note: str,
  },
  ['studentId', 'fullName', 'status'],
);
schemas.AttendanceCorrection = obj(
  {
    id,
    scheduleId: id,
    studentId: id,
    before: str,
    after: str,
    reason: str,
    userId: id,
    userName: str,
    studentName: str,
    createdAt: str,
  },
  ['id', 'studentId', 'before', 'after', 'reason', 'userId', 'createdAt'],
);
schemas.AttendanceSession = obj(
  {
    id,
    scheduleId: id,
    classId: id,
    className: str,
    instructorName: str,
    sessionDate: { type: 'string', format: 'date' },
    startTime: str,
    endTime: str,
    location: str,
    status: { enum: ['OPEN', 'CLOSED'] },
    closedAt: nullable,
    closedBy: nullable,
    rows: array(ref('AttendanceRow')),
    corrections: array(ref('AttendanceCorrection')),
    counts: obj(
      {
        total: { type: 'integer' },
        present: { type: 'integer' },
        absent: { type: 'integer' },
        excused: { type: 'integer' },
        unmarked: { type: 'integer' },
      },
      ['total', 'present', 'absent', 'excused', 'unmarked'],
    ),
  },
  ['id', 'classId', 'sessionDate', 'status', 'rows', 'counts'],
);
schemas.ExportSnapshot = obj(
  {
    generatedAt: str,
    user: obj({ id, fullName: str, role: str }, ['fullName', 'role']),
    scope: str,
    lookups: ref('Lookup'),
    sheets: array(
      obj({ id, title: str, columns: array(str), rows: array(obj()) }, [
        'id',
        'title',
        'rows',
      ]),
    ),
  },
  ['generatedAt', 'user', 'scope', 'lookups', 'sheets'],
);
function fieldSchema(f) {
  let s = ['money', 'number'].includes(f.type)
    ? { type: 'integer', minimum: 0 }
    : ['score', 'percent'].includes(f.type)
      ? {
          type: 'number',
          minimum: 0,
          ...(f.type === 'percent' ? { maximum: 100 } : {}),
        }
      : f.type === 'items'
        ? array(
            obj(
              {
                description: str,
                quantity: { type: 'integer', minimum: 1 },
                unitAmount: { type: 'integer', minimum: 0 },
              },
              ['description', 'quantity', 'unitAmount'],
            ),
          )
        : { type: 'string' };
  if (f.type === 'date' || f.type === 'month')
    s = {
      ...s,
      ...(f.type === 'date'
        ? { format: 'date' }
        : { pattern: '^\\d{4}-\\d{2}$' }),
    };
  if (f.type === 'email')
    s = {
      ...s,
      description: 'Email hoặc chuỗi rỗng khi trường không bắt buộc.',
    };
  if (f.type === 'password') s = { ...s, minLength: 8, writeOnly: true };
  if (f.type === 'color') s = { ...s, pattern: '^#[0-9a-fA-F]{6}$' };
  if (f.options && f.key !== 'role')
    s = { ...s, enum: f.options.map((x) => x[0]) };
  return { ...s, title: f.label };
}
const paths = {},
  operations = [];
const scopeParams = ['wardId', 'clubId'].map((name) => ({
  name,
  in: 'query',
  required: false,
  schema: str,
  description:
    'Phạm vi hiển thị; BE phải kiểm tra quyền thực tế, không tin giá trị FE.',
}));
const filterParams = [
  ...scopeParams,
  ...['search', 'status', 'classId', 'month'].map((name) => ({
    name,
    in: 'query',
    schema: str,
  })),
  {
    name: 'page',
    in: 'query',
    schema: { type: 'integer', minimum: 1, default: 1 },
  },
  {
    name: 'limit',
    in: 'query',
    schema: { type: 'integer', minimum: 1, maximum: 5000, default: 8 },
  },
];
const idParam = { name: 'id', in: 'path', required: true, schema: id };
function add(
  path,
  method,
  title,
  {
    body,
    data = obj(),
    roles = ['ADMIN', 'MASTER', 'INSTRUCTOR', 'STUDENT'],
    params = [],
    isPublic = false,
    description = '',
  } = {},
) {
  const success = obj(
    {
      code: { type: 'integer', minimum: 200, maximum: 299 },
      message: str,
      data,
    },
    ['code', 'message', 'data'],
  );
  paths[path] ??= {};
  paths[path][method.toLowerCase()] = {
    summary: title,
    operationId:
      method.toLowerCase() +
      '_' +
      path.replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, ''),
    tags: [path.split('/')[1]],
    description,
    security: isPublic ? [] : [{ bearerAuth: [] }],
    parameters: params,
    'x-roles': roles,
    responses: {
      200: {
        description: 'Thành công',
        content: { 'application/json': { schema: success } },
      },
      ...Object.fromEntries(
        [400, 401, 403, 404, 409, 422, 429, 503].map((code) => [
          code,
          {
            description: {
              400: 'Dữ liệu không hợp lệ',
              401: 'Phiên không hợp lệ/hết hạn',
              403: 'Không có quyền',
              404: 'Không tìm thấy trong phạm vi',
              409: 'Đã xử lý/trùng/phiên bản thay đổi',
              422: 'Lỗi từng trường',
              429: 'Giới hạn yêu cầu',
              503: 'Dịch vụ không khả dụng',
            }[code],
            content: { 'application/json': { schema: ref('ApiError') } },
          },
        ]),
      ),
    },
    ...(body
      ? {
          requestBody: {
            required: true,
            content: { 'application/json': { schema: body } },
          },
        }
      : {}),
  };
  operations.push({ method, path, title, roles });
}
for (const m of modules) {
  const name = m.id
    .split('-')
    .map((x) => x[0].toUpperCase() + x.slice(1))
    .join('');
  const props = Object.fromEntries(
    m.fields.map((f) => [f.key, fieldSchema(f)]),
  );
  if (m.id === 'invoices')
    props.priceOverrideReason = {
      type: 'string',
      description:
        'Admin bắt buộc nhập khi thay phí gốc khác biểu phí đúng kỳ hoặc phí mặc định lớp.',
    };
  const required = m.fields
    .filter(
      (f) =>
        f.required &&
        !(
          m.id === 'users' &&
          ['masterLevel', 'wardId', 'clubId'].includes(f.key)
        ),
    )
    .map((f) => f.key);
  if (m.id === 'classes') {
    const index = required.indexOf('tuition');
    if (index >= 0) required.splice(index, 1);
    props.tuition.description =
      'Bắt buộc cho người có quyền thiết lập học phí; MASTER cấp CLUB không gửi trường này, BE áp dụng giá mặc định và kiểm tra quyền.';
  }
  schemas[name + 'Create'] = obj(props, required);
  schemas[name + 'Patch'] = obj(props);
  const rowProps = {
    id,
    ...Object.fromEntries(
      m.fields
        .filter((f) => f.type !== 'password')
        .map((f) => [f.key, fieldSchema(f)]),
    ),
    status: str,
    createdAt: str,
    reviewedName: nullable,
    reviewedRole: nullable,
    reviewedAt: nullable,
  };
  for (const key of m.columns)
    rowProps[key] ??= [
      'amount',
      'baseAmount',
      'appliedPercent',
      'totalScore',
      'present',
      'absent',
      'excused',
      'total',
      'studentCount',
      'count',
    ].includes(key)
      ? { type: 'number' }
      : str;
  if (m.id === 'users') {
    delete rowProps.password;
    rowProps.masterLevel = {
      type: ['string', 'null'],
      enum: ['PROVINCE', 'WARD', 'CLUB', '', null],
    };
  }
  schemas[name] = obj(rowProps, m.custom === 'report' ? [] : ['id']);
  const page = obj(
    {
      items: array(ref(name)),
      total: { type: 'integer', minimum: 0 },
      page: { type: 'integer', minimum: 1 },
      limit: { type: 'integer', minimum: 1 },
      lookups: ref('Lookup'),
      summary: obj(),
    },
    ['items', 'total', ...(m.id === 'promotions' ? ['lookups'] : [])],
  );
  schemas[name + 'Page'] = page;
  const roles = (action) =>
    Object.entries(m.permissions)
      .filter(
        ([, right]) =>
          right.includes(action) ||
          (action === 'V' && m.id === 'online-payments' && right.includes('P')),
      )
      .map(([role]) => role);
  if (roles('V').length) {
    add(m.endpoint, 'GET', 'Danh sách · ' + m.title, {
      data: ref(name + 'Page'),
      roles: roles('V'),
      params: filterParams,
    });
    if (m.custom !== 'report')
      add(m.endpoint + '/{id}', 'GET', 'Chi tiết · ' + m.title, {
        data: ref(name),
        roles: roles('V'),
        params: [idParam, ...scopeParams],
      });
  }
  // Staff attendance writes use session endpoints, not a generic CRUD shortcut.
  if (m.id !== 'attendance') {
    if (roles('C').length)
      add(m.endpoint, 'POST', 'Tạo · ' + m.title, {
        data: ref(name),
        body: ref(name + 'Create'),
        roles: roles('C'),
        params: scopeParams,
      });
    if (roles('E').length)
      add(m.endpoint + '/{id}', 'PATCH', 'Sửa · ' + m.title, {
        data: ref(name),
        body: ref(name + 'Patch'),
        roles: roles('E'),
        params: [idParam, ...scopeParams],
      });
    if (roles('D').length)
      add(m.endpoint + '/{id}', 'DELETE', 'Xóa · ' + m.title, {
        data: obj({ deleted: { type: 'boolean' } }, ['deleted']),
        roles: roles('D'),
        params: [idParam, ...scopeParams],
      });
  }
  const wf = workflows[m.id];
  if (wf)
    for (const [action, transition] of Object.entries(wf.actions)) {
      const allowed =
        transition.roles || roles(action === 'process' ? 'P' : 'A');
      if (!allowed.length) continue;
      add(
        m.endpoint + '/{id}/actions/' + action,
        'POST',
        action + ' · ' + m.title,
        {
          data: ref(name),
          body:
            m.id === 'exam-results' && action === 'approve'
              ? obj({ outcome: { enum: ['PASS', 'FAIL'] } }, ['outcome'])
              : obj(),
          roles: allowed,
          params: [idParam, ...scopeParams],
          description:
            'Chỉ từ ' +
            transition.from +
            '. Ghi duyệt đúng một lần, xử lý cạnh tranh bằng transaction/constraint trên BE.',
        },
      );
    }
}
add('/auth/login', 'POST', 'Đăng nhập', {
  isPublic: true,
  body: obj({ email: { type: 'string', format: 'email' }, password: str }, [
    'email',
    'password',
  ]),
  data: { oneOf: [ref('Session'), ref('MfaChallenge')] },
});
add('/auth/mfa/login-verify', 'POST', 'Xác thực bước hai', {
  isPublic: true,
  body: obj({ mfaToken: str, code: str }, ['mfaToken', 'code']),
  data: ref('Session'),
});
add('/auth/refresh-token', 'POST', 'Đổi access token', {
  isPublic: true,
  body: obj({ refreshToken: str }, ['refreshToken']),
  data: ref('Tokens'),
});
add('/auth/me', 'GET', 'Hồ sơ phiên hiện tại', { data: ref('User') });
add('/auth/logout', 'POST', 'Đăng xuất', {
  data: obj({ success: { type: 'boolean' } }),
});
add('/auth/profile', 'PATCH', 'Cập nhật liên hệ của tài khoản', {
  body: obj({ fullName: str, phone: str }, ['fullName', 'phone']),
  data: ref('User'),
});
add('/auth/change-password', 'POST', 'Đổi mật khẩu', {
  body: obj(
    {
      currentPassword: str,
      newPassword: { type: 'string', minLength: 8 },
      confirm: str,
      code: str,
    },
    ['currentPassword', 'newPassword'],
  ),
  data: obj({ success: { type: 'boolean' } }),
});
add('/auth/forgot-password', 'POST', 'Gửi email khôi phục', {
  isPublic: true,
  body: obj({ email: { type: 'string', format: 'email' } }, ['email']),
  description:
    'Phản hồi đồng nhất để tránh dò tài khoản. BE gửi email thật; không trả reset token trong JSON cho trình duyệt.',
  data: obj({ message: str }),
});
add('/auth/reset-password', 'POST', 'Đặt lại mật khẩu từ liên kết email', {
  isPublic: true,
  body: obj({ token: str, password: { type: 'string', minLength: 8 } }, [
    'token',
    'password',
  ]),
  data: obj({ success: { type: 'boolean' } }),
});
add('/permissions', 'GET', 'Quyền và danh mục vai trò', {
  data: ref('Permissions'),
});
add('/permissions', 'PATCH', 'Lưu ma trận quyền', {
  body: obj({ matrix: schemas.Permissions.properties.matrix }, ['matrix']),
  data: ref('Permissions'),
  roles: ['ADMIN'],
});
add('/organization/navigation', 'GET', 'Cây đơn vị được truy cập', {
  data: ref('OrganizationNavigation'),
  roles: ['ADMIN', 'MASTER'],
  params: [{ name: 'module', in: 'query', schema: str }],
});
add('/lookups', 'GET', 'Danh mục chọn theo phạm vi', {
  data: ref('Lookup'),
  params: [...scopeParams, { name: 'module', in: 'query', schema: str }],
});
add('/dashboard', 'GET', 'Tổng quan theo vai trò và đơn vị', {
  data: ref('Dashboard'),
  params: scopeParams,
});
add('/notifications', 'GET', 'Thông báo của tài khoản', {
  data: array(
    obj(
      {
        id,
        title: str,
        body: str,
        createdAt: str,
        read: { type: 'boolean' },
        workflowModule: str,
        workflowRecordId: str,
        resultId: str,
        reliefId: str,
      },
      ['id', 'title', 'read'],
    ),
  ),
});
add('/notifications/read-one', 'POST', 'Đánh dấu đã đọc một thông báo', {
  body: obj({ id }, ['id']),
  data: obj({ success: { type: 'boolean' } }),
});
add('/notifications/read-all', 'POST', 'Đánh dấu đã đọc tất cả', {
  data: obj({ success: { type: 'boolean' } }),
});
add('/exports/system', 'GET', 'Snapshot xuất Excel theo quyền', {
  data: ref('ExportSnapshot'),
  description:
    'Không gửi password/token/secret/session. BE lấy snapshot nhất quán; không dùng phân trang danh sách để cắt ngầm dữ liệu.',
});
for (const m of modules.filter((m) => m.custom === 'report'))
  add('/report-charts/' + m.id, 'GET', 'Biểu đồ · ' + m.title, {
    data: ref('Report'),
    roles: Object.entries(m.permissions)
      .filter(([, v]) => v.includes('V'))
      .map(([k]) => k),
    params: filterParams,
  });
const staff = ['ADMIN', 'MASTER', 'INSTRUCTOR'];
add('/attendance-workflow/dates', 'GET', 'Các ngày có lịch trong phạm vi', {
  data: obj({ dates: array({ type: 'string', format: 'date' }) }, ['dates']),
  roles: staff,
  params: scopeParams,
});
add('/attendance-workflow/sessions', 'GET', 'Buổi tập theo ngày', {
  data: obj({ items: array(obj()) }, ['items']),
  roles: staff,
  params: [
    ...scopeParams,
    {
      name: 'date',
      in: 'query',
      required: true,
      schema: { type: 'string', format: 'date' },
    },
  ],
});
add(
  '/attendance-workflow/sessions/{id}',
  'GET',
  'Xem roster; không tạo snapshot/khóa lịch',
  {
    data: ref('AttendanceSession'),
    roles: staff,
    params: [idParam, ...scopeParams],
  },
);
for (const [action, body, roles] of [
  ['present', obj({ studentIds: array(id) }, ['studentIds']), staff],
  ['close', obj({ confirm: { const: true } }, ['confirm']), staff],
  [
    'undo',
    obj({ studentId: id, reason: { type: 'string', minLength: 1 } }, [
      'studentId',
      'reason',
    ]),
    staff,
  ],
  [
    'correct',
    obj(
      {
        studentId: id,
        status: { enum: ['PRESENT', 'LATE', 'ABSENT', 'EXCUSED'] },
        reason: { type: 'string', minLength: 1 },
      },
      ['studentId', 'status', 'reason'],
    ),
    ['ADMIN', 'MASTER'],
  ],
])
  add(
    '/attendance-workflow/sessions/{id}/' + action,
    'POST',
    action + ' · điểm danh',
    {
      body,
      data: ref('AttendanceSession'),
      roles,
      params: [idParam, ...scopeParams],
    },
  );
add(
  '/promotions/bulk-review',
  'POST',
  'Duyệt đề xuất theo lớp, nguyên tử cho toàn bộ ids',
  {
    body: obj(
      { classId: id, ids: array(id), action: { enum: ['approve', 'reject'] } },
      ['classId', 'ids', 'action'],
    ),
    data: obj({ count: { type: 'integer' }, items: array(obj()) }),
    roles: ['ADMIN', 'MASTER'],
    params: scopeParams,
  },
);
add(
  '/invoices/{id}/collect-cash',
  'POST',
  'Ghi nhận thu học phí tiền mặt (yêu cầu quyền P hoặc E, tự động đóng yêu cầu chuyển khoản chờ)',
  {
    body: obj({ idempotencyKey: str }, []),
    data: ref('InvoicesCreate'),
    roles: staff,
    params: [idParam, ...scopeParams],
  },
);
add(
  '/invoices/{id}/pay-online',
  'POST',
  'Gửi yêu cầu đối soát chuyển khoản ngân hàng cho hóa đơn',
  {
    body: obj({ idempotencyKey: str, note: str }, []),
    data: obj({
      invoice: ref('InvoicesCreate'),
      payment: ref('OnlinePaymentsCreate'),
      pendingVerification: { type: 'boolean' },
      duplicate: { type: 'boolean' },
    }),
    roles: ['ADMIN', 'MASTER', 'INSTRUCTOR', 'STUDENT'],
    params: [idParam, ...scopeParams],
  },
);
const openapi = {
  openapi: '3.1.0',
  info: {
    title: 'Vovinam FE ↔ BE handoff contract',
    version: '2.0.0',
    description:
      'Hợp đồng mục tiêu cho FE bàn giao; không phải khẳng định backend cũ đã hỗ trợ. UI giữ nguyên ở HTTP và fixtures. BE phải xác thực, kiểm tra quyền và các ràng buộc nghiệp vụ.',
  },
  servers: [
    { url: '/backend', description: 'Same-origin FE gateway' },
    {
      url: 'http://localhost:3000/api/v1',
      description: 'Local BE integration',
    },
  ],
  security: [{ bearerAuth: [] }],
  paths,
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
    schemas,
  },
};
const matrix = modules.map((m) => ({
  id: m.id,
  route: '/app/' + m.id,
  title: m.title,
  endpoint: m.endpoint,
  permissions: m.permissions,
  fields: m.fields,
  statuses:
    filterStatuses[m.id] ||
    m.fields.find((f) => f.key === 'status')?.options?.map((v) => v[0]) ||
    [],
  workflow: workflows[m.id] || null,
}));
function example(schema, key = '') {
  if (schema.$ref) return example(schemas[schema.$ref.split('/').at(-1)], key);
  if (schema.const !== undefined) return schema.const;
  if (schema.enum) return schema.enum[0];
  if (schema.oneOf) return example(schema.oneOf[0], key);
  if (schema.type === 'object')
    return Object.fromEntries(
      Object.entries(schema.properties || {}).map(([name, child]) => [
        name,
        example(child, name),
      ]),
    );
  if (schema.type === 'array')
    return [
      example(
        schema.items,
        key === 'ids' ? 'id' : key === 'studentIds' ? 'studentId' : key,
      ),
    ];
  if (schema.type === 'integer' || schema.type === 'number')
    return key === 'amount'
      ? 350000
      : key === 'percent'
        ? 20
        : key.toLowerCase().includes('score')
          ? 8
          : key === 'capacity'
            ? 30
            : 1;
  if (schema.type === 'boolean') return true;
  if (key === 'color') return '#0877c9';
  if (key === 'role') return 'ADMIN';
  if (key === 'fullName') return 'Nguyễn Văn A';
  if (
    [
      'email',
      'password',
      'currentPassword',
      'newPassword',
      'confirm',
      'refreshToken',
      'token',
      'code',
      'mfaToken',
    ].includes(key)
  )
    return '{{' + key + '}}';
  if (key === 'id' || key.endsWith('Id')) return '{{' + key + '}}';
  if (key === 'ids') return '{{id}}';
  if (key === 'studentIds') return '{{studentId}}';
  if (key === 'period' || schema.pattern?.includes('\\d{4}')) return '2030-01';
  if (schema.format === 'date')
    return key === 'dob' ? '2010-01-01' : '2030-01-15';
  if (key === 'startTime') return '18:00';
  if (key === 'endTime') return '19:30';
  return 'Nội dung cần nhập';
}
const postman = {
  info: {
    name: 'Vovinam FE-BE 2.0.0',
    schema:
      'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
  },
  variable: [
    { key: 'baseUrl', value: 'http://localhost:3000/api/v1' },
    { key: 'accessToken', value: '' },
    { key: 'email', value: '' },
    { key: 'password', value: '' },
    { key: 'id', value: '' },
    ...[
      'studentId',
      'classId',
      'clubId',
      'wardId',
      'provinceId',
      'rankId',
      'instructorId',
      'invoiceId',
      'examId',
      'currentPassword',
      'newPassword',
      'confirm',
      'refreshToken',
      'token',
      'code',
      'mfaToken',
    ].map((key) => ({ key, value: '' })),
  ],
  auth: {
    type: 'bearer',
    bearer: [{ key: 'token', value: '{{accessToken}}', type: 'string' }],
  },
  item: operations.map((op) => ({
    name: op.method + ' ' + op.path,
    request: {
      ...(paths[op.path][op.method.toLowerCase()].security.length === 0
        ? { auth: { type: 'noauth' } }
        : {}),
      method: op.method,
      header:
        op.method === 'GET'
          ? []
          : [{ key: 'Content-Type', value: 'application/json' }],
      ...(op.path === '/auth/login'
        ? {
            auth: { type: 'noauth' },
            body: {
              mode: 'raw',
              raw: JSON.stringify(
                { email: '{{email}}', password: '{{password}}' },
                null,
                2,
              ),
            },
            ...{},
          }
        : op.method !== 'GET' && op.method !== 'DELETE'
          ? {
              body: {
                mode: 'raw',
                raw: JSON.stringify(
                  example(
                    paths[op.path][op.method.toLowerCase()].requestBody
                      ?.content['application/json'].schema || obj(),
                  ),
                  null,
                  2,
                ),
              },
            }
          : {}),
      url: {
        raw: '{{baseUrl}}' + op.path.replace('{id}', '{{id}}'),
        host: ['{{baseUrl}}'],
        path: op.path
          .slice(1)
          .split('/')
          .map((v) => (v === '{id}' ? '{{id}}' : v)),
      },
      description:
        op.title + '; xem schema bắt buộc trong contracts/openapi.json',
    },
    ...(op.path === '/auth/login'
      ? {
          event: [
            {
              listen: 'test',
              script: {
                type: 'text/javascript',
                exec: [
                  'const result=pm.response.json();',
                  'if(result.data && result.data.tokens) pm.collectionVariables.set("accessToken",result.data.tokens.accessToken);',
                ],
              },
            },
          ],
        }
      : {}),
  })),
};
const endpoints =
  '# Bản đồ API cho BE\n\nNguồn chuẩn: `contracts/openapi.json`. Các đường dẫn dưới đây tính từ base URL, ID đều là chuỗi. Quyền còn phụ thuộc đơn vị và trạng thái bản ghi; bảng vai trò không thay thế kiểm tra quyền trên BE.\n\n| Method | Path | Chức năng | Vai trò |\n| --- | --- | --- | --- |\n' +
  operations
    .map(
      (op) =>
        `| ${op.method} | \`${op.path}\` | ${op.title} | ${op.roles.join(', ')} |`,
    )
    .join('\n') +
  '\n';
const files = {
  'contracts/openapi.json': JSON.stringify(openapi, null, 2) + '\n',
  'contracts/modules.json': JSON.stringify(matrix, null, 2) + '\n',
  'contracts/postman_collection.json': JSON.stringify(postman, null, 2) + '\n',
  'docs/API_ENDPOINTS.md': endpoints,
};
for (const [file, text] of Object.entries(files)) {
  if (check) {
    if ((await readFile(file, 'utf8')) !== text)
      throw Error('Contract out of date: ' + file);
  } else {
    await mkdir(file.slice(0, file.lastIndexOf('/')), { recursive: true });
    await writeFile(file, text);
  }
}
console.log(
  JSON.stringify({
    checked: check,
    modules: matrix.length,
    paths: Object.keys(paths).length,
    operations: operations.length,
    schemas: Object.keys(schemas).length,
  }),
);
