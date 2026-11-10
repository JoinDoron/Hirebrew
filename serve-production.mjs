import http from 'node:http';
import {readFile, realpath, stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

const releaseDirectory = fileURLToPath(new URL('./dist/', import.meta.url));
const contentTypes = new Map(Object.entries({
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.pdf': 'application/pdf',
  '.zip': 'application/zip',
  '.webmanifest': 'application/manifest+json',
}));

const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};

function isInside(root, location) {
  const relative = path.relative(root, location);
  return relative !== '' && relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
}

function reply(req, res, status, body, headers = {}) {
  res.writeHead(status, {
    ...securityHeaders,
    'Content-Type': 'text/plain; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store',
    ...headers,
  });
  res.end(req.method === 'HEAD' ? undefined : body);
}

// A configurable root lets tests use an isolated fixture. The executable always
// uses the allowlisted build output, never the repository or the current folder.
export async function createProductionServer({root = releaseDirectory} = {}) {
  const publicRoot = await realpath(root);
  const indexFile = path.join(publicRoot, 'index.html');
  if (!(await stat(indexFile)).isFile()) throw new Error('Build output is missing index.html. Run npm run build:deploy first.');

  return http.createServer(async (req, res) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      reply(req, res, 405, 'Method not allowed\n', {Allow: 'GET, HEAD'});
      return;
    }

    try {
      // Inspect the original path before URL normalization can erase ../. Decode
      // once, and reject hidden segments and Windows separators on every host.
      const requestPath = decodeURIComponent((req.url || '/').split(/[?#]/, 1)[0]);
      if (!requestPath.startsWith('/') || /[\\\0]/.test(requestPath) || requestPath.split('/').some(segment => segment.startsWith('.'))) {
        reply(req, res, 404, 'Not found\n');
        return;
      }

      if (requestPath === '/healthz') {
        const ready = await stat(indexFile).then(info => info.isFile()).catch(() => false);
        reply(req, res, ready ? 200 : 503, JSON.stringify({status: ready ? 'ok' : 'unavailable'}), {'Content-Type': 'application/json; charset=utf-8'});
        return;
      }

      const pathname = requestPath.endsWith('/') ? `${requestPath}index.html` : requestPath;
      const location = path.resolve(publicRoot, `.${pathname}`);
      const contentType = contentTypes.get(path.extname(location).toLowerCase());
      if (!contentType || !isInside(publicRoot, location)) {
        reply(req, res, 404, 'Not found\n');
        return;
      }

      const resolved = await realpath(location);
      const resolvedSegments = path.relative(publicRoot, resolved).split(path.sep);
      if (!isInside(publicRoot, resolved) || resolvedSegments.some(segment => segment.startsWith('.')) || !contentTypes.has(path.extname(resolved).toLowerCase())) {
        reply(req, res, 404, 'Not found\n');
        return;
      }
      const info = await stat(resolved);
      if (!info.isFile()) {
        reply(req, res, 404, 'Not found\n');
        return;
      }
      const body = req.method === 'HEAD' ? undefined : await readFile(resolved);
      res.writeHead(200, {
        ...securityHeaders,
        'Content-Type': contentType,
        'Content-Length': info.size,
        'Last-Modified': info.mtime.toUTCString(),
        // Asset names are stable between releases, so clients must revalidate.
        'Cache-Control': 'public, max-age=0, must-revalidate',
      });
      res.end(body);
    } catch (error) {
      if (error instanceof URIError) {
        reply(req, res, 400, 'Bad request\n');
      } else if (error.code === 'ENOENT' || error.code === 'ENOTDIR' || error.code === 'EACCES') {
        reply(req, res, 404, 'Not found\n');
      } else {
        console.error('Static request failed:', error.code || error.name);
        reply(req, res, 500, 'Internal server error\n');
      }
    }
  });
}

async function start() {
  const port = Number(process.env.PORT || 8080);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT must be an integer between 1 and 65535.');
  const server = await createProductionServer();
  server.on('error', error => {
    console.error('Hirebrew server failed:', error.code || error.message);
    process.exitCode = 1;
  });
  server.listen(port, '0.0.0.0', () => console.log(`Hirebrew production website listening on port ${port}`));

  let stopping = false;
  const shutdown = () => {
    if (stopping) return;
    stopping = true;
    const deadline = setTimeout(() => {
      server.closeAllConnections();
      process.exit(0);
    }, 10_000);
    deadline.unref();
    server.close(() => {
      clearTimeout(deadline);
      process.exit(0);
    });
    server.closeIdleConnections();
  };
  process.once('SIGTERM', shutdown);
  process.once('SIGINT', shutdown);
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  start().catch(error => {
    console.error('Hirebrew could not start:', error.message);
    process.exitCode = 1;
  });
}
