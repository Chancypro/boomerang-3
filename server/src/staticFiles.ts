import { createReadStream, existsSync, statSync } from 'node:fs';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { extname, join, normalize, resolve } from 'node:path';

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

export function serveStatic(req: IncomingMessage, res: ServerResponse, rootDir: string): void {
  const requestUrl = new URL(req.url ?? '/', 'http://localhost');
  const safePath = normalize(decodeURIComponent(requestUrl.pathname)).replace(/^(\.\.[/\\])+/, '');
  let filePath = resolve(join(rootDir, safePath));
  const root = resolve(rootDir);

  if (!filePath.startsWith(root)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  if (!existsSync(filePath) || statSync(filePath).isDirectory()) {
    filePath = resolve(join(root, 'index.html'));
  }

  if (!existsSync(filePath)) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Client build not found. Run npm run build first.');
    return;
  }

  res.writeHead(200, {
    'Content-Type': MIME_TYPES[extname(filePath)] ?? 'application/octet-stream',
    'Cache-Control': filePath.endsWith('index.html') ? 'no-cache' : 'public, max-age=31536000, immutable'
  });
  createReadStream(filePath).pipe(res);
}
