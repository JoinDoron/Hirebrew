/* Whole-site design contracts. Rendered layout and colour contrast are checked in browser QA. */
import assert from 'node:assert/strict';
import {readFile, readdir, stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const read = file => readFile(path.join(root, file), 'utf8');
const productSlugs = ['hire', 'onboard', 'people', 'grow', 'intelligence', 'brew-ai'];
const pages = [
  ...(await readdir(root)).filter(file => file.endsWith('.html')),
  ...await Promise.all(['products', 'solutions'].map(async folder =>
    (await readdir(path.join(root, folder))).filter(file => file.endsWith('.html')).map(file => `${folder}/${file}`)))
].flat().sort();
assert.equal(pages.length, 36, 'Whole-site visual coverage must include every main, product and solution page');

function attributes(source) {
  return Object.fromEntries([...source.matchAll(/([^\s=/'"<>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s<>]+)))?/g)]
    .map(match => {
      const name = match[1].toLowerCase();
      const value = match[2] ?? match[3] ?? match[4] ?? '';
      return [name, ['href', 'src', 'data-root'].includes(name) ? value.replace(/^\.\//, '') : value];
    }));
}
function tags(html, name) {
  return [...html.matchAll(new RegExp(`<${name}\\b([^<>]*?)>`, 'gi'))].map(match => attributes(match[1]));
}
const hasClass = (node, value) => (node.class || '').split(/\s+/).includes(value);
const hrefs = html => tags(html, 'a').map(tag => tag.href);
const stylesheetCache = new Map();

for (const file of pages) {
  const html = await read(file);
  const home = file === 'index.html';
  const prefix = file.includes('/') ? '../' : '';
  const body = tags(html, 'body');
  assert.equal(body.length, 1, `${file}: exactly one body is required`);
  assert.ok(hasClass(body[0], home ? 'lattice-home' : 'marketing-theme'), `${file}: page is outside the approved visual system`);
  assert.ok(home || hasClass(body[0], 'enterprise-page'), `${file}: shared page baseline is missing`);
  assert.equal(tags(html, 'h1').length, 1, `${file}: maintain one clear primary heading`);
  assert.equal(tags(html, 'main').filter(tag => tag.id === 'main').length, 1, `${file}: retain the skip-link destination`);
  assert.ok(tags(html, 'a').some(tag => hasClass(tag, 'skip-link') && tag.href === '#main'), `${file}: retain the keyboard skip link`);

  const links = tags(html, 'link');
  const styles = links.filter(link => link.rel === 'stylesheet').map(link => link.href);
  assert.equal(new Set(styles).size, styles.length, `${file}: avoid duplicate stylesheet requests`);
  for (const name of home ? ['styles.css', 'landing.css'] : ['styles.css', 'site-shell.css', 'marketing-theme.css']) {
    assert.ok(styles.includes(`${prefix}${name}`), `${file}: missing shared visual asset ${name}`);
  }
  if (!home) assert.ok(!styles.some(value => /(?:^|\/)landing(?:-grid)?\.css$/.test(value)), `${file}: homepage-only layouts must not leak into other page types`);

  const fonts = links.filter(link => link.rel === 'preload' && link.as === 'font');
  assert.equal(fonts.length, 1, `${file}: preload the one active font family, not the historical display font`);
  assert.equal(fonts[0].href, `${prefix}assets/fonts/dm-sans.woff2`, `${file}: typography must use locally hosted DM Sans`);
  assert.equal(fonts[0].type, 'font/woff2');
  assert.ok(Object.hasOwn(fonts[0], 'crossorigin'), `${file}: font preload must match the stylesheet request`);

  const resources = [
    ...links.filter(link => ['stylesheet', 'preload'].includes(link.rel)).map(link => link.href),
    ...tags(html, 'script').filter(tag => tag.src).map(tag => tag.src)
  ];
  for (const value of resources) {
    assert.ok(value && !/^(?:https?:|data:|\/\/)/i.test(value), `${file}: presentation and navigation must not add remote dependencies`);
    const location = path.resolve(root, path.dirname(file), value);
    assert.ok(location.startsWith(`${root}${path.sep}`), `${file}: asset must stay in the published website`);
    assert.ok((await stat(location)).isFile(), `${file}: missing visual or navigation asset ${value}`);
  }

  const siteHeader = [...html.matchAll(/<header\b([^<>]*?)>([\s\S]*?)<\/header>/gi)]
    .filter(match => hasClass(attributes(match[1]), home ? 'site-header' : 'enterprise-header'));
  assert.equal(siteHeader.length, 1, `${file}: one shared site header is required`);
  const header = siteHeader[0][2];
  assert.ok(tags(header, 'nav').some(tag => tag['aria-label']?.trim()), `${file}: main navigation needs an accessible name`);
  const menu = tags(header, 'button').find(tag => hasClass(tag, home ? 'menu-toggle' : 'enterprise-menu'));
  assert.ok(menu && menu['aria-expanded'] === 'false' && menu['aria-controls'], `${file}: preserve the accessible mobile menu contract`);
  assert.ok(tags(header, 'div').some(tag => tag.id === menu['aria-controls']), `${file}: mobile menu target is missing`);
  for (const name of ['platform', 'solutions']) {
    const navRoot = tags(header, 'div').filter(tag => hasClass(tag, `${name}-nav`));
    assert.equal(navRoot.length, 1, `${file}: retain a single ${name} menu`);
    assert.equal(navRoot[0]['data-root'] || '', prefix, `${file}: ${name} menu links need the correct relative root`);
    assert.ok(hrefs(header).includes(`${prefix}${name}.html`), `${file}: ${name} menu must work before JavaScript loads`);
    const scripts = tags(html, 'script').filter(tag => tag.src === `${prefix}${name}-nav.js`);
    assert.equal(scripts.length, 1, `${file}: ${name} menu enhancement must load exactly once`);
    assert.ok(Object.hasOwn(scripts[0], 'defer'), `${file}: navigation scripts should not block rendering`);
  }
  for (const destination of ['enterprise.html', 'enterprise.html#resources']) {
    assert.ok(hrefs(header).includes(`${prefix}${destination}`), `${file}: keep ${destination} available in the site header`);
  }

  const footerBlocks = [...html.matchAll(/<footer\b[^>]*>([\s\S]*?)<\/footer>/gi)];
  assert.equal(footerBlocks.length, 1, `${file}: one site footer is required`);
  const footer = footerBlocks[0][1];
  assert.equal(tags(footer, 'div').filter(tag => hasClass(tag, home ? 'landing-footer-grid' : 'shell-footer-grid')).length, 1, `${file}: retain the four-column footer layout`);
  assert.equal([...tags(footer, 'nav'), ...tags(footer, 'div')].filter(tag => hasClass(tag, home ? 'landing-footer-group' : 'shell-footer-group')).length, 4, `${file}: footer information groups must be consistent`);
  for (const destination of [...productSlugs.map(slug => `products/${slug}.html`), 'solutions.html#industries', 'enterprise.html', 'brand.html', 'design-notes.html']) {
    assert.ok(hrefs(footer).includes(`${prefix}${destination}`), `${file}: footer is missing ${destination}`);
  }
  assert.ok(tags(footer, 'img').some(tag => tag.src === `${prefix}assets/brand/logo.svg` && tag.alt?.trim()), `${file}: retain the shared accessible brand signature`);

  let css = '';
  for (const stylesheet of styles) {
    const relative = path.normalize(path.join(path.dirname(file), stylesheet));
    if (!stylesheetCache.has(relative)) stylesheetCache.set(relative, await read(relative));
    css += stylesheetCache.get(relative);
  }
  assert.match(css, /:focus-visible/, `${file}: keyboard focus styles must be available`);
  assert.match(css, /prefers-reduced-motion\s*:\s*reduce/, `${file}: reduced motion support must be available`);
  assert.match(css, /@media\s*\([^)]*max-width/, `${file}: responsive layout styles must be available`);
  for (const menuName of ['platform', 'solutions']) {
    assert.match(css, new RegExp(`\\.${menuName}-panel\\[hidden\\]\\s*\\{[^}]*display:\\s*none`), `${file}: hidden ${menuName} menu must not occupy space`);
  }
}

function variables(css, selector) {
  const rule = css.match(new RegExp(`${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\{([^}]+)\\}`));
  assert.ok(rule, `Missing design-system token scope ${selector}`);
  return Object.fromEntries([...rule[1].matchAll(/(--[a-z-]+)\s*:\s*([^;]+);?/g)].map(match => [match[1], match[2].replace(/\s+/g, '')]));
}
const homeTokens = variables(await read('landing.css'), '.lattice-home');
const sharedTokens = variables(await read('marketing-theme.css'), '.marketing-theme');
for (const name of ['--display', '--body', '--ink', '--chalk', '--paper', '--muted', '--line', '--coral', '--coral-soft', '--blue', '--stone', '--radius']) {
  assert.ok(homeTokens[name] && sharedTokens[name], `Both page systems must define ${name}`);
  assert.equal(sharedTokens[name], homeTokens[name], `Homepage and shared page design token ${name} has drifted`);
}
assert.match(homeTokens['--display'], /DM Sans|DMSans/, 'The current display family must remain DM Sans');
const notes = await read('design-notes.html');
assert.match(notes, /Historical research notes/, 'Design research must remain clearly dated and historical');
assert.ok(!/style="/i.test(notes), 'Design notes must use maintainable scoped styling, not legacy inline overrides');
assert.match(await read('design-notes.css'), /\.marketing-theme\.design-notes-page/, 'Editorial styling must remain scoped');

console.log('PASS: all 36 pages share the current font, design tokens, navigation, footer destinations, local visual assets and accessibility/responsive foundations.');
