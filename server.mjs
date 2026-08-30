import { createReadStream, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));
const host = '127.0.0.1';
const port = 8000;
const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.sql': 'text/plain; charset=utf-8',
};

function sendText(response, statusCode, text) {
  const body = Buffer.from(text, 'utf8');
  response.writeHead(statusCode, {
    'Content-Type': 'text/plain; charset=utf-8',
    'Content-Length': body.length,
    'X-Content-Type-Options': 'nosniff',
  });
  response.end(body);
}

const server = createServer((request, response) => {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    sendText(response, 405, '405 Method Not Allowed');
    return;
  }

  try {
    const requestUrl = new URL(request.url || '/', `http://${host}:${port}`);
    const decodedPath = decodeURIComponent(requestUrl.pathname);
    const requestedPath = decodedPath === '/' ? 'index.html' : decodedPath.replace(/^\/+/, '');
    const filePath = resolve(join(root, requestedPath));
    const pathFromRoot = relative(root, filePath);

    if (pathFromRoot.startsWith(`..${sep}`) || pathFromRoot === '..') {
      sendText(response, 403, '403 Forbidden');
      return;
    }

    const fileStat = statSync(filePath);
    if (!fileStat.isFile()) {
      sendText(response, 404, '404 Not Found');
      return;
    }

    response.writeHead(200, {
      'Content-Type': contentTypes[extname(filePath).toLowerCase()] || 'application/octet-stream',
      'Content-Length': fileStat.size,
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'Referrer-Policy': 'same-origin',
    });
    if (request.method === 'HEAD') response.end();
    else createReadStream(filePath).pipe(response);
  } catch (error) {
    if (error?.code === 'ENOENT') sendText(response, 404, '404 Not Found');
    else sendText(response, 500, '500 Internal Server Error');
  }
});

server.listen(port, host, () => {
  console.log(`FLAGSHIP server: http://localhost:${port}/login.html`);
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${port} is already in use. Stop the existing server and try again.`);
  } else {
    console.error(error);
  }
  process.exit(1);
});
