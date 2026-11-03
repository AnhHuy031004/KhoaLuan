// Static production server + same-origin API reverse proxy; no frontend secrets.
import http from "node:http";
import https from "node:https";
import { readFile, stat } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
const root = resolve("dist"),
  port = Number(process.env.PORT || 4173),
  host = process.env.HOST || "0.0.0.0";
const target = new URL(
  process.env.API_PROXY_TARGET || "https://vovinamapinode.onrender.com",
);
if (
  !["https:", "http:"].includes(target.protocol) ||
  target.username ||
  target.password
)
  throw Error("API_PROXY_TARGET must be an HTTP(S) origin without credentials");
const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".woff2": "font/woff2",
  ".ico": "image/x-icon",
};
export const server = http.createServer(async (req, res) => {
  let url;
  try {
    url = new URL(req.url, "http://localhost");
  } catch {
    res.writeHead(400).end();
    return;
  }
  if (url.pathname === "/backend" || url.pathname.startsWith("/backend/")) {
    if (process.env.ENABLE_API_PROXY !== 'true') {
      res.writeHead(503, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ code: 503, message: 'API proxy is disabled. This build uses local mock data.', data: null }));
      return;
    }
    const upstream = new URL(
      target.origin +
        "/api/v1" +
        url.pathname.slice("/backend".length) +
        url.search,
    );
    const headers = { ...req.headers, host: target.host };
    delete headers.connection;
    delete headers.origin;
    const transport = upstream.protocol === "https:" ? https : http;
    const proxy = transport.request(
      upstream,
      { method: req.method, headers, timeout: 30000 },
      (response) => {
        const h = { ...response.headers };
        delete h["transfer-encoding"];
        res.writeHead(response.statusCode, h);
        response.pipe(res);
      },
    );
    proxy.on("timeout", () => proxy.destroy(Error("Upstream timeout")));
    proxy.on("error", () => {
      if (!res.headersSent)
        res.writeHead(502, { "Content-Type": "application/json" });
      if (!res.writableEnded)
        res.end(
          JSON.stringify({
            code: 502,
            message: "API tạm thời không phản hồi.",
            data: null,
          }),
        );
    });
    req.on("aborted", () => proxy.destroy());
    req.pipe(proxy);
    return;
  }
  if (!["GET", "HEAD"].includes(req.method)) {
    res.writeHead(405).end();
    return;
  }
  try {
    let pathname;
    try {
      pathname = decodeURIComponent(url.pathname);
    } catch {
      res.writeHead(400).end();
      return;
    }
    let path = resolve(root, "." + pathname);
    if (path !== root && !path.startsWith(root + sep)) {
      res.writeHead(403).end();
      return;
    }
    let exists = false;
    try {
      exists = (await stat(path)).isFile();
    } catch {}
    if (!exists) {
      if (extname(path)) {
        res.writeHead(404).end();
        return;
      }
      path = resolve(root, "index.html");
    }
    const bytes = await readFile(path);
    res.writeHead(200, {
      "Content-Type": mime[extname(path)] || "application/octet-stream",
      "Cache-Control":
        extname(path) === ".html" ? "no-cache" : "public, max-age=3600",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "Content-Security-Policy":
        "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' https:; font-src 'self'; base-uri 'self'; frame-ancestors 'none'",
    });
    res.end(req.method === "HEAD" ? undefined : bytes);
  } catch {
    res
      .writeHead(500, { "Content-Type": "text/plain" })
      .end("Build frontend first with npm run build.");
  }
});
server.listen(port, host, () => console.log("Vovinam ready on port " + port));
