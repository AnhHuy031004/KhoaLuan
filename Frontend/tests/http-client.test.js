import test from "node:test";
import assert from "node:assert/strict";
import { createApiClient, ApiError } from "../src/services/httpClient.js";
const store = () => {
  const values = new Map();
  return {
    getItem: k => values.get(k) || null,
    setItem: (k, v) => values.set(k, v),
    removeItem: k => values.delete(k)
  };
};
const response = (data, status = 200) => new Response(JSON.stringify({
  code: status,
  message: status < 400 ? "OK" : "Rejected",
  data
}), {
  status,
  headers: {
    "Content-Type": "application/json"
  }
});
const session = {
  user: {
    id: "u1"
  },
  tokens: {
    accessToken: "old-access",
    refreshToken: "old-refresh"
  }
};
test("unwraps API envelope, encodes filters, skips empty filters and public credentials", async () => {
  let call;
  const api = createApiClient({
    baseUrl: "https://api.test/api/v1/",
    storage: store(),
    fetchImpl: async (...args) => {
      call = args;
      return response({
        items: [{
          id: 1
        }],
        total: 1
      });
    }
  });
  api.save(session);
  assert.equal((await api.request("/students", {
    query: {
      search: "Võ An",
      status: "",
      page: 1
    },
    public: true
  })).total, 1);
  assert.match(call[0], /search=V%C3%B5\+An/);
  assert.doesNotMatch(call[0], /status/);
  assert.equal(call[1].headers.Authorization, undefined);
});
test("concurrent 401 requests rotate a single refresh token and retry with new access token", async () => {
  let refresh = 0;
  const seen = [];
  const api = createApiClient({
    baseUrl: "https://api.test",
    storage: store(),
    fetchImpl: async (url, opts) => {
      seen.push(opts.headers.Authorization);
      if (url.endsWith("/auth/refresh-token")) {
        refresh++;
        assert.deepEqual(JSON.parse(opts.body), {
          refreshToken: "old-refresh"
        });
        await new Promise(r => setTimeout(r, 10));
        return response({
          accessToken: "new-access",
          refreshToken: "new-refresh"
        });
      }
      return opts.headers.Authorization === "Bearer new-access" ? response({
        ok: true
      }) : response(null, 401);
    }
  });
  api.save(session);
  const out = await Promise.all([api.request("/students"), api.request("/classes")]);
  assert.equal(refresh, 1);
  assert(out.every(x => x.ok));
  assert.equal(api.read().tokens.refreshToken, "new-refresh");
  assert.equal(seen.filter(x => x === "Bearer new-access").length, 2);
});
test("403 preserves the session and never attempts refresh", async () => {
  let count = 0;
  const api = createApiClient({
    baseUrl: "https://api.test",
    storage: store(),
    fetchImpl: async () => {
      count++;
      return response(null, 403);
    }
  });
  api.save(session);
  await assert.rejects(api.request("/users"), e => e instanceof ApiError && e.status === 403);
  assert.equal(count, 1);
  assert.equal(api.read().user.id, "u1");
});
test("invalid refresh expires the session", async () => {
  let expired = 0;
  const api = createApiClient({
    baseUrl: "https://api.test",
    storage: store(),
    onExpired: () => expired++,
    fetchImpl: async () => response(null, 401)
  });
  api.save(session);
  await assert.rejects(api.request("/students"));
  assert.equal(api.read(), null);
  assert(expired >= 1);
});
test("logout during refresh cannot restore the session", async () => {
  let resolveRefresh;
  const api = createApiClient({
    baseUrl: "https://api.test",
    storage: store(),
    fetchImpl: async url => url.endsWith("refresh-token") ? new Promise(resolve => {
      resolveRefresh = resolve;
    }) : response(null, 401)
  });
  api.save(session);
  const request = api.request("/students");
  while (!resolveRefresh) await new Promise(r => setTimeout(r, 1));
  api.clear();
  resolveRefresh(response({
    accessToken: "new",
    refreshToken: "next"
  }));
  await assert.rejects(request);
  assert.equal(api.read(), null);
});
