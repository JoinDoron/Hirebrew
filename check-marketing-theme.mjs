/* Shared visual-shell contracts. Browser QA verifies rendered layout and contrast. */
import assert from 'node:assert/strict';
import {readFile, readdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const read = file => readFile(path.join(root, file), 'utf8');
const productSlugs = ['hire', 'onboard', 'people', 'grow', 'intelligence', 'brew-ai'];
const solutions = (await readdir(path.join(root, 'solutions'))).filter(file => file.endsWith('.html')).sort();
const products = (await readdir(path.join(root, 'products'))).filter(file => file.endsWith('.html')).sort();
assert.equal(solutions.length, 24, 'Expected 24 dedicated solution pages');
assert.deepEqual(products, productSlugs.map(slug => `${slug}.html`).sort(), 'Every product must participate in the shared visual system');
const pages = ['platform.html', 'solutions.html', ...products.map(file => `products/${file}`), ...solutions.map(file => `solutions/${file}`)];
assert.equal(pages.length, 32);

function attributes(source) {
  return Object.fromEntries([...source.matchAll(/([^\s=/'"<>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s<>]+)))?/g)]
    .map(match => [match[1].toLowerCase(), match[2] ?? match[3] ?? match[4] ?? '']));
}
function tags(html, name) {
  return [...html.matchAll(new RegExp(`<${name}\\b([^<>]*?)>`, 'gi'))].map(match => attributes(match[1]));
}
function hasClass(node, name) { return (node.class || '').split(/\s+/).includes(name); }

for (const file of pages) {
  const html = await read(file);
  const prefix = file.includes('/') ? '../' : '';
  const body = tags(html, 'body');
  assert.equal(body.length, 1, `${file}: expected one page body`);
  assert.ok(hasClass(body[0], 'marketing-theme'), `${file}: shared design must be explicitly scoped on the body`);
  assert.ok(!hasClass(body[0], 'lattice-home'), `${file}: do not inherit homepage-only layout rules`);

  const links = tags(html, 'link');
  const stylesheets = links.filter(link => link.rel === 'stylesheet').map(link => link.href);
  const sharedStyles = ['site-shell.css', 'marketing-theme.css'].map(name => `${prefix}${name}`);
  for (const name of sharedStyles) assert.equal(stylesheets.filter(href => href === name).length, 1, `${file}: ${name} must load exactly once with the correct relative path`);
  assert.deepEqual(stylesheets.slice(-2), sharedStyles, `${file}: shared shell and detail-page theme must follow the original component styles`);
  assert.ok(!stylesheets.some(href => /(?:^|\/)landing(?:-grid)?\.css$/.test(href)), `${file}: homepage-only card and disclosure styles must not leak into detail pages`);

  const preloads = links.filter(link => link.rel === 'preload' && link.as === 'font');
  assert.equal(preloads.length, 1, `${file}: preload only the displayed DM Sans font`);
  assert.equal(preloads[0].href, `${prefix}assets/fonts/dm-sans.woff2`, `${file}: typography must use the same locally hosted DM Sans as the homepage`);
  assert.equal(preloads[0].type, 'font/woff2');
  assert.ok(Object.hasOwn(preloads[0], 'crossorigin'), `${file}: font preload needs crossorigin to match the CSS font request`);
  for (const link of links.filter(link => ['stylesheet', 'preload'].includes(link.rel))) {
    assert.ok(!/^(?:https?:)?\/\//.test(link.href || ''), `${file}: presentation must not add third-party font or style requests`);
  }

  const footers = [...html.matchAll(/<footer\b[^>]*>([\s\S]*?)<\/footer>/gi)];
  assert.equal(footers.length, 1, `${file}: expected one shared footer`);
  const footer = footers[0][1];
  const footerLinks = tags(footer, 'a').map(link => link.href);
  assert.equal(tags(footer, 'div').filter(tag => hasClass(tag, 'shell-footer-grid')).length, 1, `${file}: footer needs one shared grid`);
  assert.equal(tags(footer, 'nav').filter(tag => hasClass(tag, 'shell-footer-group')).length, 4, `${file}: footer must retain the four-column information structure`);
  for (const destination of [
    'index.html', 'platform.html', 'solutions.html', 'index.html#tour', 'enterprise.html',
    ...productSlugs.map(slug => `products/${slug}.html`)
  ]) {
    assert.ok(footerLinks.includes(`${prefix}${destination}`), `${file}: footer must expose ${destination}`);
  }
  assert.ok(tags(footer, 'nav').every(nav => nav['aria-label']?.trim()), `${file}: footer navigation groups need accessible labels`);

  // The redesign must keep the existing progressive-enhancement hooks in place.
  for (const script of ['solutions-nav.js', 'platform-nav.js', 'solutions.js', 'story-demo.js']) {
    const matching = tags(html, 'script').filter(tag => tag.src === `${prefix}${script}`);
    assert.equal(matching.length, 1, `${file}: retain ${script} exactly once`);
    assert.ok(Object.hasOwn(matching[0], 'defer'), `${file}: ${script} must remain deferred`);
  }
  for (const className of ['platform-nav', 'solutions-nav']) {
    assert.equal(tags(html, 'div').filter(tag => hasClass(tag, className) && tag['data-root'] === prefix).length, 1, `${file}: preserve the shared ${className} root`);
  }
  if (prefix) {
    assert.equal(tags(html, 'form').filter(tag => Object.hasOwn(tag, 'data-pilot-form')).length, 1, `${file}: preserve the local pilot planner`);
    assert.equal(tags(html, 'div').filter(tag => tag.role === 'tablist').length, 1, `${file}: preserve workflow tabs`);
  }
}

const base = await read('styles.css');
assert.match(base, /@font-face\s*\{[^}]*font-family:\s*['"]?DM Sans['"]?\s*;[^}]*src:\s*url\(['"]?assets\/fonts\/dm-sans\.woff2['"]?\)[^}]*font-display:\s*swap/s, 'The shared font must retain its local declaration and non-blocking display');
const theme = await read('marketing-theme.css');
assert.match(theme, /\.marketing-theme\s*\{[^}]*--display:\s*['"]DM Sans['"]\s*,\s*sans-serif/s, 'Detail-page headings must use the same licensed free font as the homepage');
assert.ok(!/@import|url\(\s*['"]?(?:https?:|\/\/)/i.test(theme), 'The new theme must not introduce remote resources');
assert.match(theme, /:focus-visible/, 'The new theme must retain visible keyboard focus');
assert.match(theme, /prefers-reduced-motion\s*:\s*reduce/, 'The new theme must honor reduced motion');
assert.match(theme, /@media\s*\([^)]*max-width/, 'The new theme must provide a narrow-screen layout');
assert.match(theme, /\.marketing-theme\s+::selection\s*\{[^}]*background:\s*#d4f6ca\s*;[^}]*color:\s*#082725/s, 'Selection needs a contrasting light-green surface after replacing the original coral token');
assert.match(theme, /\.marketing-theme\s+main\s+\.enterprise-wrap\s*\{/, 'Content widths must not override the shared navigation and footer widths');

// Inspect selector groups, including those inside media queries. This catches
// accidental global h1/body/button overrides without depending on a CSS package.
function selectors(css) {
  const result = [];
  let cursor = 0;
  while (cursor < css.length) {
    const open = css.indexOf('{', cursor);
    if (open < 0) break;
    const prelude = css.slice(cursor, open).trim();
    let depth = 1;
    let close = open + 1;
    for (; close < css.length && depth; close++) {
      if (css[close] === '{') depth++;
      else if (css[close] === '}') depth--;
    }
    assert.equal(depth, 0, 'New theme contains an unclosed CSS rule');
    const content = css.slice(open + 1, close - 1);
    if (/^@(?:media|supports|layer|container)\b/.test(prelude)) result.push(...selectors(content));
    else {
      assert.ok(!prelude.startsWith('@'), `New theme must not introduce unscoped global at-rules: ${prelude}`);
      let start = 0;
      let nesting = 0;
      for (let index = 0; index <= prelude.length; index++) {
        if ('(['.includes(prelude[index])) nesting++;
        else if (')]'.includes(prelude[index])) nesting--;
        if (index === prelude.length || prelude[index] === ',' && nesting === 0) {
          result.push(prelude.slice(start, index).trim());
          start = index + 1;
        }
      }
    }
    cursor = close;
  }
  return result;
}
for (const [file, css] of [['marketing-theme.css', theme], ['site-shell.css', await read('site-shell.css')]]) {
  const scopedSelectors = selectors(css.replace(/\/\*[\s\S]*?\*\//g, ''));
  assert.ok(scopedSelectors.length > 0, `${file}: shared styling must contain scoped rules`);
  assert.ok(!/@import|url\(\s*['"]?(?:https?:|\/\/)/i.test(css), `${file}: shared styling must stay locally hosted`);
  for (const selector of scopedSelectors) {
    assert.match(selector, /^\.marketing-theme(?=$|[\s.:#\[>+~])/, `${file}: selector must not restyle unrelated pages: ${selector}`);
  }
}

console.log('PASS: 32 product/solution pages share scoped typography and visual assets, one local DM Sans preload, consistent footer destinations, retained navigation/workflow/planner hooks, responsive styles, keyboard focus and reduced motion.');
