import { MOCK_CODE } from "../shared.js";
const fail = (status, message) => {
  throw Object.assign(new Error(message), {
    status
  });
};
export async function handleAuth(context, path, method, body, q, u, session) {
  const {
    db,
    now,
    newId,
    find,
    event,
    issue,
    revoke,
    paged,
    publicUser
  } = context;
  if (path === '/auth/login' && method === 'POST') {
    const a = db.users.find(a => a.email.toLowerCase() === String(body.email || '').trim().toLowerCase());
    if (!a || a.password !== body.password || !a.isActive || !a.emailVerified) fail(401, 'Email hoặc mật khẩu không đúng, hoặc tài khoản chưa xác minh.');
    event('LOGIN', a);
    if (a.mfaEnabled) {
      const mfaToken = newId();
      db.mfa[mfaToken] = a.id;
      return {
        mfaRequired: true,
        mfaToken,
        user: publicUser(a)
      };
    }
    return {
      mfaRequired: false,
      tokens: issue(a),
      user: publicUser(a)
    };
  }
  if (path === '/auth/refresh-token') {
    const s = db.refresh[body.refreshToken];
    if (!s) fail(401, 'Phiên mẫu đã hết hạn.');
    const a = find(db.users, s.userId);
    delete db.refresh[body.refreshToken];
    return issue(a);
  }
  if (path === '/auth/mfa/login-verify') {
    const a = db.users.find(a => a.id === db.mfa[body.mfaToken]);
    if (!a || body.code !== MOCK_CODE) fail(401, 'Mã MFA mẫu là 123456.');
    delete db.mfa[body.mfaToken];
    return {
      mfaRequired: false,
      tokens: issue(a),
      user: publicUser(a)
    };
  }
  if (path === '/auth/register') {
    if (!['STUDENT', 'PARENT'].includes(body.role)) fail(400, 'Chỉ đăng ký Võ sinh hoặc Phụ huynh.');
    if (!String(body.email || '').includes('@') || String(body.password || '').length < 8) fail(400, 'Email/mật khẩu không hợp lệ.');
    if (db.users.some(a => a.email === body.email)) fail(409, 'Email đã tồn tại trong mock.');
    const a = {
      ...body,
      id: newId(),
      isActive: true,
      emailVerified: false,
      mfaEnabled: false,
      createdAt: now()
    };
    db.users.push(a);
    db.tokens['MOCK-VERIFY-' + a.id] = {
      userId: a.id,
      purpose: 'verify'
    };
    return {
      email: a.email,
      requiresVerification: true,
      mockVerificationToken: 'MOCK-VERIFY-' + a.id,
      message: 'Mock không gửi email. Dùng mã được hiển thị để xác minh.'
    };
  }
  if (path === '/auth/resend-verification' || path === '/auth/forgot-password') {
    const a = db.users.find(a => a.email === body.email);
    if (!a) return {
      message: 'Đã xử lý yêu cầu mẫu.'
    };
    const purpose = path.includes('forgot') ? 'reset' : 'verify',
      token = 'MOCK-' + purpose.toUpperCase() + '-' + newId();
    db.tokens[token] = {
      userId: a.id,
      purpose
    };
    return {
      message: 'Mock không gửi email.',
      mockToken: token
    };
  }
  if (['/auth/verify-email', '/auth/reset-password', '/auth/change-email/confirm'].includes(path)) {
    const purpose = path.includes('reset') ? 'reset' : path.includes('change-email') ? 'email' : 'verify';
    const t = db.tokens[body.token];
    if (!t || t.purpose !== purpose) fail(400, 'Mã mock không hợp lệ hoặc đã dùng.');
    const a = find(db.users, t.userId);
    if (purpose === 'reset') {
      a.password = body.password;
      revoke(a.id);
    } else if (purpose === 'email') {
      a.email = t.email;
      revoke(a.id);
    } else a.emailVerified = true;
    delete db.tokens[body.token];
    return {
      message: 'Đã cập nhật tài khoản mẫu.'
    };
  }
  if (path === '/auth/me') {
    if (method === 'GET') return publicUser(u);
    u.isActive = false;
    revoke(u.id);
    return {
      deactivated: true
    };
  }
  if (path === '/auth/logout' || path === '/auth/logout-all') {
    revoke(u.id, path.endsWith('logout') ? session.sessionId : undefined);
    event('LOGOUT', u);
    return {
      loggedOut: true
    };
  }
  if (path === '/auth/me/audit-log') return paged(db.audit.filter(a => a.userId === u.id), q);
  if (path === '/auth/sessions') return paged(Object.values(db.access).filter(s => s.userId === u.id).map(s => ({
    id: s.sessionId,
    deviceName: 'Trình duyệt mock',
    ip: '127.0.0.1',
    userAgent: 'Mock',
    lastActiveAt: now()
  })), q);
  if (path.startsWith('/auth/sessions/')) {
    revoke(u.id, path.split('/').pop());
    return {
      revoked: true
    };
  }
  if (path === '/auth/change-password') {
    if (body.currentPassword !== u.password) fail(400, 'Mật khẩu hiện tại chưa đúng.');
    u.password = body.newPassword;
    revoke(u.id);
    return {
      changed: true
    };
  }
  if (path === '/auth/change-email/request') {
    if ((body.password || body.currentPassword) !== u.password) fail(400, 'Mật khẩu chưa đúng.');
    const token = 'MOCK-EMAIL-' + newId();
    db.tokens[token] = {
      userId: u.id,
      purpose: 'email',
      email: body.newEmail
    };
    return {
      mockToken: token,
      message: 'Mock không gửi email.'
    };
  }
  if (path === '/auth/deactivate') {
    if (body.password !== u.password) fail(400, 'Mật khẩu chưa đúng.');
    u.isActive = false;
    revoke(u.id);
    return {
      deactivated: true
    };
  }
  if (path === '/auth/mfa/methods') return [{
    type: 'TOTP',
    enabled: u.mfaEnabled
  }];
  if (path === '/auth/mfa/totp/enable') return {
    otpauthUrl: 'MOCK ONLY — nhập mã 123456 để xác nhận, không dùng ứng dụng thật',
    qrDataUrl: null,
    message: 'Mô phỏng TOTP; mã xác thực mẫu: 123456'
  };
  if (path === '/auth/mfa/totp/verify' || path === '/auth/mfa/totp/validate') {
    if (body.code !== MOCK_CODE) fail(400, 'Mã mock là 123456.');
    if (path.endsWith('verify')) {
      u.mfaEnabled = true;
      return {
        recoveryCodes: ['MOCK0001', 'MOCK0002'],
        message: 'Đăng nhập mock bằng mã 123456'
      };
    }
    return {
      valid: true
    };
  }
  if (path === '/auth/mfa/totp/disable') {
    if (body.password !== u.password || body.code !== MOCK_CODE) fail(400, 'Mật khẩu hoặc mã mock chưa đúng.');
    u.mfaEnabled = false;
    revoke(u.id);
    return {
      disabled: true
    };
  }
  if (path === '/auth/mfa/totp/recovery-codes') return {
    remaining: 2
  };
}
