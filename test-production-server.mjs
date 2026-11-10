import assert from 'node:assert/strict';
import http from 'node:http';
import {mkdtemp, mkdir, rm, symlink, writeFile} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {after, before, test} from 'node:test';
import {createProductionServer} from './serve-production.mjs';

let fixture;
let root;
let server;
let port;

before(async () => {
  fixture = await mkdtemp(path.join(os.tmpdir(), 'hirebrew-static-test-'));
  root = path.join(fixture, 'dist');
  await mkdir(path.join(root, 'products'), {recursive: true});
  await mkdir(path.join(root, 'assets'));
  await mkdir(path.join(root, '.private'));
  await Promise.all([
    writeFile(path.join(root, 'index.html'), '<h1>Hirebrew</h1>'),
    writeFile(path.join(root, 'products', 'hire.html'), '<h1>Hire</h1>'),
    writeFile(path.join(root, 'assets', 'brand.json'), '{"name":"Hirebrew"}'),
    writeFile(path.join(root, 'assets', 'font.woff2'), Buffer.from([0x77, 0x4f, 0x46, 0x32])),
    writeFile(path.join(root, 'assets', 'brand.zip'), Buffer.from([0x50, 0x4b, 0x03, 0x04])),
    writeFile(path.join(root, 'styles.css'), 'body{color:green}'),
    writeFile(path.join(root, '.env'), 'NOT_PUBLIC'),
    writeFile(path.join(root, '.private', 'index.html'), 'NOT_PUBLIC'),
    writeFile(path.join(root, 'build-static.mjs'), 'NOT_PUBLIC'),
    writeFile(path.join(fixture, 'outside.html'), 'NOT_PUBLIC'),
  ]);
  await symlink(path.join(fixture, 'outside.html'), path.join(root, 'escape.html'));
  server = await createProductionServer({root});
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  port = server.address().port;
});

after(async () => {
  if (server?.listening) await new Promise(resolve => server.close(resolve));
  if (fixture) await rm(fixture, {recursive: true, force: true});
});

function request(url, method = 'GET') {
  // node:http preserves raw traversal segments, unlike URL/fetch normalization.
  return new Promise((resolve, reject) => {
    const req = http.request({hostname: '127.0.0.1', port, path: url, method}, res => {
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => resolve({status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks).toString()}));
      res.on('error', reject);
    });
    req.on('error', reject);
    req.end();
  });
}

test('serves homepage and nested pages, including query strings', async () => {
  for (const url of ['/', '/index.html', '/index.html?utm_source=railway']) {
    const response = await request(url);
    assert.equal(response.status, 200);
    assert.equal(response.body, '<h1>Hirebrew</h1>');
    assert.equal(response.headers['content-type'], 'text/html; charset=utf-8');
  }
  assert.equal((await request('/products/hire.html')).body, '<h1>Hire</h1>');
});

test('serves public styles, fonts and brand downloads with correct MIME types', async () => {
  for (const [url, type] of [
    ['/styles.css', 'text/css; charset=utf-8'],
    ['/assets/font.woff2', 'font/woff2'],
    ['/assets/brand.json', 'application/json; charset=utf-8'],
    ['/assets/brand.zip', 'application/zip'],
  ]) {
    const response = await request(url);
    assert.equal(response.status, 200);
    assert.equal(response.headers['content-type'], type);
    assert.equal(response.headers['x-content-type-options'], 'nosniff');
    assert.equal(response.headers['referrer-policy'], 'strict-origin-when-cross-origin');
    assert.equal(response.headers['cache-control'], 'public, max-age=0, must-revalidate');
  }
});

test('HEAD has GET headers and no body', async () => {
  const get = await request('/index.html');
  const head = await request('/index.html', 'HEAD');
  assert.equal(head.status, 200);
  assert.equal(head.headers['content-length'], get.headers['content-length']);
  assert.equal(head.headers['content-type'], get.headers['content-type']);
  assert.equal(head.body, '');
});

test('healthcheck is available without a cached response', async () => {
  const response = await request('/healthz');
  assert.equal(response.status, 200);
  assert.deepEqual(JSON.parse(response.body), {status: 'ok'});
  assert.equal(response.headers['cache-control'], 'no-store');
  assert.equal((await request('/healthz', 'HEAD')).body, '');
});

test('unknown routes and directories return 404 without exposing files', async () => {
  for (const url of ['/missing.html', '/products', '/assets/', '/escape.html']) {
    const response = await request(url);
    assert.equal(response.status, 404, url);
    assert.equal(response.body, 'Not found\n');
  }
});

test('blocks traversal, hidden paths and authoring source', async () => {
  for (const url of [
    '/../outside.html', '/%2e%2e/outside.html', '/products/../../outside.html',
    '/products/%2e%2e/%2e%2e/outside.html', '/%2eenv', '/.env',
    '/.private/index.html', '/%2eprivate/index.html', '/.git/config',
    '/build-static.mjs', '/package.json', '/%5c..%5coutside.html', '/index.html%00',
  ]) {
    const response = await request(url);
    assert.equal(response.status, 404, url);
    assert.equal(response.body.includes('NOT_PUBLIC'), false, url);
  }
});

test('malformed encoded paths are a controlled bad request', async () => {
  const response = await request('/%E0%A4%A');
  assert.equal(response.status, 400);
  assert.equal(response.body, 'Bad request\n');
});

test('rejects mutating and unsupported methods', async () => {
  for (const method of ['POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']) {
    const response = await request('/index.html', method);
    assert.equal(response.status, 405);
    assert.equal(response.headers.allow, 'GET, HEAD');
  }
});

test('refuses to start without the built homepage', async () => {
  const empty = path.join(fixture, 'empty');
  await mkdir(empty);
  await assert.rejects(createProductionServer({root: empty}), {code: 'ENOENT'});
});
