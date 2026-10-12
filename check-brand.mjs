/* Keep the Handoff master artwork, public guidance and downloadable kit in sync. */
import assert from 'node:assert/strict';
import {readFile, readdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const assets = path.join(root, 'assets');
const brand = path.join(assets, 'brand');
const files = [
  'logo.svg', 'logo-mono.svg', 'logo-reversed.svg', 'logo-stacked.svg',
  'wordmark.svg', 'mark.svg', 'mark-mono.svg', 'mark-reversed.svg',
  'favicon.svg', 'pattern.svg', 'pattern-reversed.svg'
];
const ink = '#172326', coral = '#FF6B4A', chalk = '#F7F5EF';
const bands = [
  'M5 44L20 14Q23 8 30 8H55Q61 8 64 14L73 32Q76 38 72 44L65 34Q59 26 52 26Q44 26 40 34L35 44Q32 49 26 49H8Q3 49 5 44Z',
  'M115 36L100 66Q97 72 90 72H65Q59 72 56 66L47 48Q44 42 48 36L55 46Q61 54 68 54Q76 54 80 46L85 36Q88 31 94 31H112Q117 31 115 36Z'
];
const staleIdentity = /\b(?:The Lift|Lift symbol|original Lift|node diameter|raised (?:circular|coral|human) node)\b|M16\s+8c4\.42/i;
const attribute = (tag, name) => tag.match(new RegExp(`\\b${name}\\s*=\\s*(["'])(.*?)\\1`, 'i'))?.[2];
const paths = source => [...source.matchAll(/<path\b[^>]*>/gi)].map(([tag]) => ({
  d: attribute(tag, 'd'), fill: attribute(tag, 'fill')
}));
const svg = new Map();

assert.deepEqual((await readdir(brand)).filter(file => file.endsWith('.svg')).sort(), [...files].sort(), 'Unexpected or missing brand SVG variant');
for (const file of files) {
  const source = await readFile(path.join(brand, file), 'utf8');
  svg.set(file, source);
  assert.match(source, /^\s*<svg\b[^>]*xmlns="http:\/\/www\.w3\.org\/2000\/svg"/, `${file}: expected a standalone SVG`);
  assert.match(source, /<title\b[^>]*>Hirebrew(?: Handoff| wordmark)/, `${file}: accessible identity title missing`);
  assert.match(source, /\bHandoff\b/, `${file}: Handoff identity missing`);
  assert.ok(!staleIdentity.test(source), `${file}: old Lift geometry or description remains`);
  assert.ok(!/<!DOCTYPE|<!ENTITY|<\?/i.test(source), `${file}: external declarations are not allowed`);
  assert.ok(!/\bon[a-z]+\s*=/i.test(source), `${file}: event handlers are not allowed`);
  assert.ok(!/@import|@font-face|data:|javascript:/i.test(source), `${file}: embedded resources or executable content are not allowed`);
  // The owned artwork needs only these inert vector/metadata elements. This also
  // rejects text, raster images, scripts, foreignObject, animation and circles.
  for (const [, tag] of source.matchAll(/<\/?([a-z][\w:-]*)\b/gi)) {
    assert.ok(['svg', 'title', 'desc', 'g', 'path', 'rect', 'defs', 'pattern'].includes(tag), `${file}: unexpected SVG element ${tag}`);
  }
  for (const [, , reference] of source.matchAll(/\b(?:href|xlink:href|src)\s*=\s*(["'])(.*?)\1/gi)) {
    assert.match(reference, /^#[A-Za-z][\w:.-]*$/, `${file}: external resources are not allowed`);
  }
  const ids = [...source.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
  assert.equal(new Set(ids).size, ids.length, `${file}: duplicate SVG IDs`);
  for (const [, reference] of source.matchAll(/url\(\s*([^)]*?)\s*\)/gi)) {
    const fragment = reference.replace(/^["']|["']$/g, '');
    assert.match(fragment, /^#[A-Za-z][\w:.-]*$/, `${file}: paint must reference a local definition`);
    assert.ok(ids.includes(fragment.slice(1)), `${file}: missing paint definition ${fragment}`);
  }
  assert.equal(attribute(source.match(/<svg\b[^>]*>/)[0], 'aria-labelledby'), 'title', `${file}: accessible title reference missing`);
  for (const item of paths(source)) assert.ok(item.d?.trim() && item.fill, `${file}: every path must have outlined geometry and explicit fill`);
}

const viewBox = file => attribute(svg.get(file).match(/<svg\b[^>]*>/)[0], 'viewBox');
const logoFiles = ['logo.svg', 'logo-mono.svg', 'logo-reversed.svg', 'logo-stacked.svg'];
const markFiles = ['mark.svg', 'mark-mono.svg', 'mark-reversed.svg'];
for (const file of logoFiles.slice(0, 3)) assert.equal(viewBox(file), '0 0 344 80', `${file}: horizontal lockup bounds changed`);
for (const file of markFiles) assert.equal(viewBox(file), '0 0 120 120', `${file}: symbol canvas changed`);
for (const file of [...logoFiles, ...markFiles]) {
  const items = paths(svg.get(file));
  assert.deepEqual(items.slice(0, 2).map(item => item.d), bands, `${file}: symbol must use the two master Handoff bands`);
  assert.equal(items.length, logoFiles.includes(file) ? 3 : 2, `${file}: unexpected symbol/wordmark geometry`);
}
for (const file of ['logo.svg', 'logo-stacked.svg', 'mark.svg']) {
  assert.deepEqual(paths(svg.get(file)).slice(0, 2).map(item => item.fill), [ink, coral], `${file}: primary band colours changed`);
}
for (const [file, expected] of [
  ['logo-mono.svg', ink], ['mark-mono.svg', ink],
  ['logo-reversed.svg', chalk], ['mark-reversed.svg', chalk], ['wordmark.svg', ink]
]) {
  assert.ok(paths(svg.get(file)).every(item => item.fill === expected), `${file}: inconsistent monochrome/reversed fills`);
}
const wordmark = paths(svg.get('wordmark.svg'));
assert.equal(wordmark.length, 1, 'Standalone wordmark must be one outlined path');
for (const file of logoFiles) assert.equal(paths(svg.get(file))[2].d, wordmark[0].d, `${file}: outlined wordmark differs from the master`);
for (const file of ['pattern.svg', 'pattern-reversed.svg']) {
  assert.deepEqual(paths(svg.get(file)).map(item => item.d), [...bands, ...bands], `${file}: pattern must repeat the Handoff master bands`);
  assert.match(svg.get(file), /id="handoff"/, `${file}: Handoff pattern definition missing`);
}
const favicon = paths(svg.get('favicon.svg'));
assert.equal(viewBox('favicon.svg'), '0 0 64 64', 'Favicon canvas changed');
assert.equal(favicon.length, 2, 'Favicon must contain two micro-size bands');
assert.ok(favicon.every((item, index) => item.d !== bands[index] && item.fill === chalk), 'Favicon needs distinct micro-size monochrome geometry');
assert.match(svg.get('favicon.svg'), /<rect\b[^>]*fill="#172326"/, 'Favicon requires the ink background');

const tokens = JSON.parse(await readFile(path.join(assets, 'brand-tokens.json'), 'utf8'));
assert.equal(tokens.name, 'Hirebrew / Handoff');
assert.equal(tokens.logo.markMinPx, 24);
assert.equal(tokens.logo.incidentalDemoMarkPx, 22);
assert.equal(tokens.logo.lockupMinPx, 120);
assert.equal(tokens.logo.faviconMinPx, 16);
assert.equal(tokens.logo.symbolViewBox, '0 0 120 120');
assert.match(tokens.logo.clearSpace, /one quarter of the visible symbol height/i);
assert.match(tokens.logo.wordmark, /outlined Bricolage Grotesque.*SIL Open Font Licence/);
const guide = await readFile(path.join(root, 'brand.html'), 'utf8');
assert.match(guide, /one quarter of the visible symbol’s height/, 'Brand guide clear-space rule differs from tokens');
assert.match(guide, /24 px minimum/);
assert.match(guide, /120 px minimum/);
assert.match(guide, /16 px, dedicated mono asset/);
for (const file of ['brand.html', 'design-notes.html', 'assets/brand-tokens.json', 'assets/ASSET-NOTES.txt']) {
  assert.ok(!staleIdentity.test(await readFile(path.join(root, file), 'utf8')), `${file}: old Lift identity language remains`);
}

const archive = path.join(assets, 'hirebrew-brand-kit.zip');
function unzip(args) {
  try { return execFileSync('unzip', args, {timeout: 10000, maxBuffer: 4 * 1024 * 1024}); }
  catch (error) { throw new Error('Cannot verify the brand kit. Install unzip and regenerate assets/hirebrew-brand-kit.zip from the current assets.', {cause: error}); }
}
const fontFiles = (await readdir(path.join(assets, 'fonts'))).filter(file => /\.(?:woff2|txt)$/.test(file));
const pngFiles = [...logoFiles, ...markFiles, 'favicon.svg'].map(file => file.replace(/\.svg$/, '.png'));
assert.deepEqual((await readdir(brand)).filter(file => file.endsWith('.png')).sort(), [...pngFiles].sort(), 'Unexpected or missing PNG brand export');
for (const file of pngFiles) {
  const png = await readFile(path.join(brand, file));
  assert.ok(png.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])), `${file}: expected a PNG derivative`);
  assert.equal(png.toString('ascii', 12, 16), 'IHDR', `${file}: PNG dimensions missing`);
  const expectedWidth = file.startsWith('logo') ? 1600 : 512;
  assert.equal(png.readUInt32BE(16), expectedWidth, `${file}: PNG export width differs from asset notes`);
  if (!file.startsWith('logo')) assert.equal(png.readUInt32BE(20), 512, `${file}: expected a square symbol export`);
}
const kitFiles = [...files.map(file => `brand/${file}`), ...pngFiles.map(file => `brand/${file}`), 'brand-tokens.json', 'ASSET-NOTES.txt', 'future-form.webp', ...fontFiles.map(file => `fonts/${file}`)];
const entries = unzip(['-Z1', archive]).toString('utf8').trim().split(/\r?\n/).filter(entry => !entry.endsWith('/'));
assert.deepEqual(entries.sort(), [...kitFiles].sort(), 'Brand kit has unexpected, missing or duplicate files');
for (const file of kitFiles) {
  const archived = unzip(['-p', archive, file]);
  assert.ok(archived.equals(await readFile(path.join(assets, file))), `Brand kit contains stale ${file}`);
}
console.log(`PASS: ${files.length} Handoff SVGs, ${pngFiles.length} PNG exports, master geometry, mono/reverse variants, micro favicon, guidance and ${kitFiles.length} matching brand-kit files.`);
