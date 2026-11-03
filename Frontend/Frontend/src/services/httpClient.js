export class ApiError extends Error {
  constructor(message, status = 0, detail = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.detail = detail;
  }
}
export function createApiClient({
  baseUrl,
  fetchImpl = globalThis.fetch,
  storage,
  timeout = 25000,
  onExpired = () => {},
}) {
  const key = 'vovinam-session-v1';
  let refreshPromise = null;
  const read = () => {
    try {
      return JSON.parse(storage.getItem(key) || 'null');
    } catch {
      return null;
    }
  };
  const save = (session) => {
    if (session) storage.setItem(key, JSON.stringify(session));
    else storage.removeItem(key);
  };
  async function raw(
    path,
    { method = 'GET', body, query, signal, token } = {},
  ) {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(query || {}))
      if (v !== '' && v !== undefined && v !== null) q.set(k, String(v));
    const url =
      baseUrl.replace(/\/$/, '') + path + (q.size ? '?' + q.toString() : '');
    const timerController = new AbortController();
    const id = setTimeout(() => timerController.abort(), timeout);
    const abort = () => timerController.abort();
    if (signal?.aborted) abort();
    else
      signal?.addEventListener('abort', abort, {
        once: true,
      });
    try {
      const headers = {
        Accept: 'application/json',
      };
      if (token) headers.Authorization = 'Bearer ' + token;
      if (body !== undefined) headers['Content-Type'] = 'application/json';
      const response = await fetchImpl(url, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: timerController.signal,
      });
      const text = await response.text();
      let data = null;
      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        if (response.ok)
          throw new ApiError(
            'Máy chủ trả dữ liệu không hợp lệ.',
            response.status,
          );
      }
      if (!response.ok) {
        const message =
          response.status === 429
            ? 'Bạn thao tác quá nhanh. Vui lòng đợi trước khi thử lại.'
            : Array.isArray(data?.message)
              ? data.message.join('; ')
              : data?.message || 'Không thể hoàn tất yêu cầu.';
        throw new ApiError(message, response.status, data);
      }
      return data && Object.hasOwn(data, 'data') ? data.data : data;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      if (error.name === 'AbortError')
        throw new ApiError(
          signal?.aborted
            ? 'Yêu cầu đã hủy.'
            : 'Máy chủ phản hồi chậm. Vui lòng thử lại.',
          0,
        );
      throw new ApiError(
        'Không kết nối được API. Kiểm tra mạng, URL API hoặc cấu hình CORS.',
        0,
      );
    } finally {
      clearTimeout(id);
      signal?.removeEventListener('abort', abort);
    }
  }
  async function refresh() {
    if (refreshPromise) return refreshPromise;
    const current = read();
    if (!current?.tokens?.refreshToken)
      throw new ApiError('Phiên đăng nhập đã hết hạn.', 401);
    refreshPromise = raw('/auth/refresh-token', {
      method: 'POST',
      body: {
        refreshToken: current.tokens.refreshToken,
      },
    })
      .then((tokens) => {
        // A logout during refresh must never resurrect the session.
        if (read()?.tokens?.refreshToken !== current.tokens.refreshToken)
          throw new ApiError('Phiên đăng nhập đã thay đổi.', 401);
        save({
          ...current,
          tokens,
        });
        return tokens.accessToken;
      })
      .catch((error) => {
        if (error.status === 401 || error.status === 403) {
          save(null);
          onExpired();
        }
        throw error;
      })
      .finally(() => {
        refreshPromise = null;
      });
    return refreshPromise;
  }
  async function request(path, options = {}) {
    const usedToken = options.public ? undefined : read()?.tokens?.accessToken;
    try {
      return await raw(path, {
        ...options,
        token: usedToken,
      });
    } catch (error) {
      if (error.status !== 401 || options.public || options.noRefresh)
        throw error;
      // Requests failing after a concurrent refresh use the already-rotated token.
      const currentToken = read()?.tokens?.accessToken;
      let nextToken;
      try {
        nextToken =
          currentToken && currentToken !== usedToken
            ? currentToken
            : await refresh();
      } catch (refreshError) {
        if (refreshError.status === 401) {
          save(null);
          onExpired();
        }
        throw refreshError;
      }
      try {
        return await raw(path, {
          ...options,
          token: nextToken,
        });
      } catch (retryError) {
        if (retryError.status === 401) {
          save(null);
          onExpired();
        }
        throw retryError;
      }
    }
  }
  return {
    request,
    read,
    save,
    clear: () => save(null),
  };
}
