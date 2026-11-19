// Tiny static file server with zero dependencies — used to host My IGCSE on
// Railway (or any Node host). Railway sets PORT; locally it defaults to 3000.
//
//   npm start          -> http://localhost:3000

import http from 'node:http';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)));
const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST; // unset = all interfaces, IPv4 and IPv6

// Only these top-level paths are public; server code, tests and dotfiles are not served.
const PUBLIC = new Set(['index.html', 'my-igcse.html', 'favicon.svg', 'manifest.webmanifest', 'css', 'js', 'LICENSE']);

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '': 'text/plain; charset=utf-8',
};

const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  'Content-Security-Policy':
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; base-uri 'self'; form-action 'self'",
};

function send(res, status, body, headers = {}) {
  res.writeHead(status, { ...SECURITY_HEADERS, 'Content-Type': 'text/plain; charset=utf-8', ...headers });
  res.end(body);
}

async function resolveFile(urlPath) {
  let rel;
  try {
    rel = decodeURIComponent(urlPath.split('?')[0]);
  } catch {
    return null;
  }
  rel = normalize(rel).replace(/^([/\\])+/, '');
  if (rel === '' || rel === '.') rel = 'index.html';
  const top = rel.split(/[/\\]/)[0];
  if (!PUBLIC.has(top)) return null;

  const file = join(ROOT, rel);
  if (!file.startsWith(ROOT + sep)) return null; // path traversal guard
  try {
    const st = await stat(file);
    if (st.isFile()) return { file, st };
  } catch { /* not found */ }
  return null;
}

const server = http.createServer(async (req, res) => {
  res.on('finish', () => console.log(`${req.method} ${req.url} ${res.statusCode}`));
  if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, 'Method not allowed', { Allow: 'GET, HEAD' });
  if (req.url === '/healthz') return send(res, 200, 'ok');

  const found = await resolveFile(req.url || '/');
  if (!found) return send(res, 404, 'Not found');

  const { file, st } = found;
  const type = TYPES[extname(file)] || 'application/octet-stream';
  const etag = `W/"${st.size.toString(16)}-${Math.floor(st.mtimeMs).toString(16)}"`;
  // The app has no build step, so ask browsers to revalidate rather than cache blindly.
  const headers = { ...SECURITY_HEADERS, 'Content-Type': type, 'Content-Length': st.size, ETag: etag, 'Cache-Control': 'no-cache' };

  if (req.headers['if-none-match'] === etag) {
    res.writeHead(304, headers);
    return res.end();
  }
  res.writeHead(200, headers);
  if (req.method === 'HEAD') return res.end();
  createReadStream(file).on('error', () => res.destroy()).pipe(res);
});

server.listen(PORT, HOST, () => {
  console.log(`My IGCSE listening on port ${PORT}`);
});

for (const sig of ['SIGTERM', 'SIGINT']) {
  process.on(sig, () => server.close(() => process.exit(0)));
}
