import assert from 'node:assert/strict';
import {readFile, readdir, stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const rootUrl = new URL('https://hirebrew.test/');
const pageCache = new Map();
let checked = 0;

async function findPages(directory = root) {
  const entries = await readdir(directory, {withFileTypes: true});
  const pages = [];
  for (const entry of entries) {
    if (entry.name.startsWith('.') || ['node_modules', 'dist', 'review', 'assets'].includes(entry.name)) continue;
    const location = path.join(directory, entry.name);
    if (entry.isDirectory()) pages.push(...await findPages(location));
    else if (entry.isFile() && entry.name.endsWith('.html')) pages.push(location);
  }
  return pages.sort();
}

function decodeEntities(value) {
  return value.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'");
}

async function readPage(location) {
  if (!pageCache.has(location)) pageCache.set(location, await readFile(location, 'utf8'));
  return pageCache.get(location);
}

async function checkTarget(target, sourceFile, sourceIds) {
  const relativePage = path.relative(root, sourceFile).split(path.sep).join('/');
  const value = decodeEntities(target);
  assert.ok(value.trim(), `${relativePage}: empty link or resource`);
  assert.ok(!/^javascript:/i.test(value), `${relativePage}: javascript URL is not allowed`);
  if (/^(?:https?:|mailto:|tel:|data:|blob:|\/\/)/i.test(value)) return;
  const destination = new URL(value, new URL(relativePage, rootUrl));
  const decodedPath = decodeURIComponent(destination.pathname);
  const location = path.resolve(root, `.${decodedPath}`);
  assert.ok(location === root || location.startsWith(`${root}${path.sep}`), `${relativePage}: resource leaves the website root: ${target}`);
  const file = decodedPath.endsWith('/') ? path.join(location, 'index.html') : location;
  let details;
  try { details = await stat(file); } catch { assert.fail(`${relativePage}: missing local destination ${target}`); }
  assert.ok(details.isFile(), `${relativePage}: destination is not a file: ${target}`);
  if (destination.hash) {
    const id = decodeURIComponent(destination.hash.slice(1));
    const destinationIds = file === sourceFile ? sourceIds : [...(await readPage(file)).matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
    assert.ok(destinationIds.includes(id), `${relativePage}: missing destination anchor ${target}`);
  }
  checked++;
}

const pages = await findPages();
assert.equal(pages.length, 36, 'Expected six main pages, 24 solution pages and six product pages; run npm run build first');
for (const location of pages) {
  const page = path.relative(root, location);
  const html = await readPage(location);
  assert.match(html, /<html\b[^>]*\blang="en"/, `${page}: English language attribute missing`);
  assert.match(html, /<meta\b[^>]*name="viewport"/, `${page}: viewport metadata missing`);
  assert.equal([...html.matchAll(/<h1\b/g)].length, 1, `${page}: expected exactly one primary heading`);
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
  assert.equal(new Set(ids).size, ids.length, `${page}: duplicate IDs`);
  for (const match of html.matchAll(/\baria-(?:controls|labelledby|describedby)="([^"]+)"/g)) {
    for (const id of match[1].split(/\s+/)) assert.ok(ids.includes(id), `${page}: missing accessible target ${id}`);
  }
  for (const match of html.matchAll(/\b(?:src|href)="([^"]+)"/g)) await checkTarget(match[1], location, ids);
}

const script = await readFile(path.join(root, 'script.js'), 'utf8');
for (const [file, source] of [
  ['script.js', script],
  ...await Promise.all(['enterprise-home.js', 'enterprise.js', 'solutions-nav.js', 'platform-nav.js', 'solutions.js'].map(async file => [file, await readFile(path.join(root, file), 'utf8')]))
]) {
  assert.ok(!/\b(?:fetch|XMLHttpRequest|localStorage|sessionStorage)\b/.test(source), `${file}: unexpected network or persistence API in preview`);
}
for (const role of ['hr', 'manager', 'candidate', 'employee']) assert.ok(script.includes(`${role}:`), `Missing ${role} product-tour role`);
const styles = await readFile(path.join(root, 'styles.css'), 'utf8');
assert.ok(styles.includes('prefers-reduced-motion'), 'Reduced-motion styles missing');
assert.ok(styles.includes(':focus-visible'), 'Keyboard focus styles missing');
for (const file of ['logo.svg', 'logo-reversed.svg']) {
  const svg = await readFile(path.join(root, 'assets/brand', file), 'utf8');
  assert.ok(!/<text\b/.test(svg), `${file}: wordmark must be outlined`);
}
JSON.parse(await readFile(path.join(root, 'assets/brand-tokens.json'), 'utf8'));
console.log(`PASS: ${pages.length} HTML pages, ${checked} local resources and anchors, accessible targets, preview privacy constraints, identity assets, focus and reduced-motion rules.`);
