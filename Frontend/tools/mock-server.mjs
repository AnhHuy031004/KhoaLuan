// Development HTTP fixture server for integrating the actual HTTP frontend. Never a production backend.
import http from 'node:http';
import { pathToFileURL } from 'node:url';
import { createMockFetch } from '../mock/api.js';
export function createMockServer({ storage, record = () => {} } = {}) {
  const values = new Map();
  storage ??= {
    getItem: (key) => values.get(key) || null,
    setItem: (key, value) => values.set(key, value),
  };
  const fetch = createMockFetch({ storage });
  return http.createServer(async (req, res) => {
    const origin = req.headers.origin;
    if (origin && /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin))
      res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'Authorization,Content-Type,Idempotency-Key',
    );
    res.setHeader(
      'Access-Control-Allow-Methods',
      'GET,POST,PATCH,DELETE,OPTIONS',
    );
    if (req.method === 'OPTIONS') {
      res.writeHead(204).end();
      return;
    }
    try {
      const chunks = [];
      let size = 0;
      for await (const chunk of req) {
        size += chunk.length;
        if (size > 1024 * 1024) {
          res.writeHead(413).end();
          return;
        }
        chunks.push(chunk);
      }
      record({ method: req.method, path: req.url });
      const body = Buffer.concat(chunks).toString('utf8'),
        response = await fetch('http://fixture.local' + req.url, {
          method: req.method,
          headers: req.headers,
          ...(body ? { body } : {}),
        });
      res.writeHead(response.status, {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
      });
      res.end(await response.text());
    } catch (error) {
      res
        .writeHead(500, { 'Content-Type': 'application/json' })
        .end(
          JSON.stringify({
            code: 500,
            message: 'Không thể xử lý yêu cầu kiểm thử.',
            data: null,
          }),
        );
    }
  });
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const port = Number(process.env.MOCK_PORT || 3000);
  createMockServer().listen(port, '127.0.0.1', () =>
    console.log(
      `HTTP fixtures: http://127.0.0.1:${port}/api/v1 (development only)`,
    ),
  );
}
