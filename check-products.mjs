import assert from 'node:assert/strict';
import {readFile, readdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';

const root = path.dirname(fileURLToPath(import.meta.url));
const read = file => readFile(path.join(root, file), 'utf8');
const products = (await Promise.all(['products-core.json', 'products-growth.json'].map(async file => JSON.parse(await read(`content/${file}`))))).flat();
const expectedSlugs = ['hire', 'onboard', 'people', 'grow', 'intelligence', 'brew-ai'];
const slugs = new Set(products.map(product => product.slug));
const solutions = (await readdir(path.join(root, 'solutions'))).filter(file => file.endsWith('.html')).map(file => file.slice(0, -5));
const decode = value => value.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&#x27;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
const normalize = value => decode(value).replace(/\s+/g, ' ').trim();
const textOf = html => normalize(html.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ').replace(/<[^>]*>/g, ' '));
const hasText = (html, text, message) => assert.ok(textOf(html).includes(normalize(text)), message);

assert.equal(products.length, 6, 'Expected six Platform products');
assert.equal(slugs.size, products.length, 'Product slugs must be distinct');
assert.deepEqual([...slugs].sort(), [...expectedSlugs].sort(), 'Every Platform menu product requires a dedicated page');
for (const field of ['metaTitle', 'metaDescription', 'headline', 'summary', 'challenge']) {
  assert.equal(new Set(products.map(product => normalize(product[field]).toLowerCase())).size, products.length, `Every product needs a unique ${field}`);
}
const generated = (await readdir(path.join(root, 'products'))).filter(file => file.endsWith('.html')).sort();
assert.deepEqual(generated, products.map(product => `${product.slug}.html`).sort(), 'Generated product pages must match their content sources');
const directory = await read('platform.html');
const homepage = await read('index.html');
const footer = homepage.match(/<footer\b[\s\S]*?<\/footer>/)?.[0] || '';
for (const slug of expectedSlugs) assert.ok(footer.includes(`href="products/${slug}.html"`), `${slug}: homepage footer must reach the dedicated product page`);
assert.match(homepage, /id="module-detail"[^>]*href="products\/hire.html"/, 'Homepage overview needs a dedicated-product link alongside its local demo');
assert.ok(directory.includes('class="platform-nav"') && directory.includes('platform-nav.js'), 'Platform overview must use the shared product navigation');

for (const product of products) {
  const context = product.slug;
  for (const field of ['slug', 'name', 'metaTitle', 'metaDescription', 'headline', 'subhead', 'summary', 'challengeTitle', 'challenge', 'workflowTitle', 'workflowIntro']) {
    assert.ok(typeof product[field] === 'string' && product[field].trim(), `${context}: missing ${field}`);
  }
  assert.match(product.slug, /^[a-z]+(?:-[a-z]+)*$/, `${context}: unsafe product slug`);
  assert.ok(product.metaDescription.length >= 60, `${context}: search description must explain the product`);
  assert.ok(!/[\u2013\u2014<>]/.test(JSON.stringify(product)), `${context}: content must be plain text without HTML or long dashes`);
  for (const [field, count, keys] of [
    ['priorities', 3, ['title', 'body']],
    ['steps', 4, ['label', 'owner', 'title', 'body']],
    ['capabilities', 4, ['name', 'body']],
    ['useCases', 3, ['title', 'situation', 'workflow', 'outcome']],
    ['faqs', 3, ['q', 'a']],
    ['related', 2, ['slug', 'why']],
    ['audiences', 2, ['slug', 'why']]
  ]) {
    assert.ok(Array.isArray(product[field]), `${context}: ${field} must be an array`);
    assert.equal(product[field].length, count, `${context}: expected ${count} ${field}`);
    for (const item of product[field]) {
      for (const key of keys) assert.ok(typeof item[key] === 'string' && item[key].trim(), `${context}: ${field} entry missing ${key}`);
    }
  }
  for (const key of ['title', 'body', 'example']) assert.ok(product.ai?.[key]?.trim(), `${context}: missing AI ${key}`);
  for (const key of ['title', 'body', 'boundary']) assert.ok(product.pilot?.[key]?.trim(), `${context}: missing pilot ${key}`);
  assert.equal(product.pilot.checks.length, 3, `${context}: expected three pilot acceptance criteria`);
  assert.ok(product.pilot.checks.every(check => typeof check === 'string' && check.trim()), `${context}: blank pilot criterion`);
  assert.equal(new Set(product.related.map(item => item.slug)).size, 2, `${context}: related products must be distinct`);
  for (const related of product.related) assert.ok(slugs.has(related.slug) && related.slug !== product.slug, `${context}: invalid related product ${related.slug}`);
  for (const audience of product.audiences) assert.ok(solutions.includes(audience.slug), `${context}: invalid solution audience ${audience.slug}`);
  assert.ok(product.demo?.label?.trim(), `${context}: missing demo call to action`);
  const demo = new URL(product.demo.href, 'https://hirebrew.test/');
  assert.equal(demo.origin, 'https://hirebrew.test', `${context}: product preview must stay local`);
  assert.equal(demo.pathname, '/index.html', `${context}: demo must target an existing homepage experience`);
  assert.ok(['#tour', '#platform', '#brew'].includes(demo.hash), `${context}: unsupported demo experience`);
  for (const [key, value] of demo.searchParams) {
    assert.ok(key === 'perspective' && ['hr', 'manager', 'candidate', 'employee'].includes(value) || key === 'product' && ['hire', 'onboard', 'people', 'grow', 'intelligence'].includes(value), `${context}: unsupported demo parameter ${key}=${value}`);
  }

  const html = await read(`products/${product.slug}.html`);
  const title = decode(html.match(/<title>([\s\S]*?)<\/title>/)?.[1] || '');
  const description = decode(html.match(/<meta\s+name="description"\s+content="([^"]+)"/)?.[1] || '');
  assert.equal(title, product.metaTitle, `${context}: generated title differs from source`);
  assert.equal(description, product.metaDescription, `${context}: generated description differs from source`);
  for (const field of ['headline', 'subhead', 'challengeTitle', 'challenge', 'workflowTitle', 'workflowIntro']) hasText(html, product[field], `${context}: generated page missing ${field}`);
  for (const step of product.steps) for (const field of ['label', 'owner', 'title', 'body']) hasText(html, step[field], `${context}: workflow step missing ${field}`);
  for (const capability of product.capabilities) for (const field of ['name', 'body']) hasText(html, capability[field], `${context}: capability missing ${field}`);
  for (const useCase of product.useCases) for (const field of ['title', 'situation', 'workflow', 'outcome']) hasText(html, useCase[field], `${context}: use case missing ${field}`);
  for (const faq of product.faqs) for (const field of ['q', 'a']) hasText(html, faq[field], `${context}: FAQ missing ${field}`);
  for (const field of ['title', 'body', 'example']) hasText(html, product.ai[field], `${context}: missing AI ${field}`);
  hasText(html, product.pilot.boundary, `${context}: preview scope boundary missing`);
  assert.ok(/class="platform-nav"\s+data-root="\.\.\/"/.test(html), `${context}: nested shared Platform navigation needs the parent-relative root`);
  assert.ok(html.includes(`href="../${product.demo.href.replace(/&/g, '&amp;')}"`), `${context}: demo route missing`);
  for (const related of product.related) assert.ok(html.includes(`${related.slug}.html`), `${context}: related product link missing`);
  for (const audience of product.audiences) assert.ok(html.includes(`solutions/${audience.slug}.html`), `${context}: solution audience link missing`);
  assert.ok(directory.includes(`products/${product.slug}.html`), `${context}: product missing from platform overview`);
  const brief = await read(`assets/resources/products/${product.slug}.txt`);
  assert.ok(brief.toLowerCase().includes(`hirebrew ${product.name.toLowerCase()}`), `${context}: brief must identify its product`);
  for (const check of product.pilot.checks) assert.ok(brief.includes(check), `${context}: brief missing acceptance criterion`);
  assert.ok(brief.includes(product.pilot.boundary), `${context}: brief missing scope boundary`);
}

// Minimal DOM unit tests exercise the actual navigation code; browser QA handles layout.
const platformSource = await read('platform-nav.js');
const solutionsSource = await read('solutions-nav.js');
function createNavigation(pagePath, prefix) {
  let document;
  class Element {
    constructor(tag) { this.tagName = tag; this.children = []; this.attributes = new Map(); this.events = new Map(); this.dataset = {}; this.textContent = ''; }
    append(...children) { this.children.push(...children); }
    replaceChildren(...children) { this.children = children; }
    setAttribute(name, value) { this.attributes.set(name, String(value)); }
    getAttribute(name) { return this.attributes.get(name) ?? null; }
    addEventListener(name, listener) { this.events.set(name, [...this.events.get(name) || [], listener]); }
    querySelectorAll(selector) { return this.children.flatMap(child => [...(child.tagName === selector ? [child] : []), ...child.querySelectorAll(selector)]); }
    querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
    closest(selector) { return selector.startsWith('.') && this.className?.split(/\s+/).includes(selector.slice(1)) ? this : null; }
    contains(target) { return this === target || this.children.some(child => child.contains(target)); }
    focus() { document.activeElement = this; }
    set href(value) { this.url = new URL(value, `https://hirebrew.test${pagePath}`); }
    get href() { return this.url.href; }
    get pathname() { return this.url.pathname; }
    get hash() { return this.url.hash; }
    trigger(name, event = {}) { for (const listener of this.events.get(name) || []) listener(event); }
  }
  const platform = new Element('div');
  const solutions = new Element('div');
  for (const element of [platform, solutions]) element.dataset.root = prefix;
  const events = new Map();
  document = {
    activeElement: null,
    createElement: tag => new Element(tag),
    querySelectorAll: selector => selector === '.platform-nav' ? [platform] : selector === '.solutions-nav' ? [solutions] : [],
    addEventListener(name, listener, capture = false) { events.set(name, [...events.get(name) || [], {listener, capture}]); },
    dispatchEvent(event) { for (const {listener} of events.get(event.type) || []) listener(event); }
  };
  const context = vm.createContext({document, window: {location: {pathname: pagePath}}, CustomEvent: class { constructor(type) { this.type = type; } }, matchMedia: () => ({matches: false}), setTimeout, clearTimeout});
  const run = () => {
    vm.runInContext(platformSource, context, {timeout: 1000, filename: 'platform-nav.js'});
    vm.runInContext(solutionsSource, context, {timeout: 1000, filename: 'solutions-nav.js'});
  };
  run();
  return {platform, solutions, document, events, run};
}

for (const [pagePath, prefix] of [['/index.html', ''], ['/platform.html', './'], ['/products/hire.html', '../'], ['/solutions/construction.html', '../']]) {
  const {platform, solutions, document, events, run} = createNavigation(pagePath, prefix);
  const [button, panel] = platform.children;
  const [solutionsButton, solutionsPanel] = solutions.children;
  const links = platform.querySelectorAll('a');
  assert.equal(links.length, 7, `${pagePath}: expected six products and one platform overview`);
  assert.deepEqual(links.map(link => link.pathname).sort(), ['/platform.html', ...expectedSlugs.map(slug => `/products/${slug}.html`)].sort(), `${pagePath}: Platform destinations must resolve correctly`);
  assert.equal(button.getAttribute('aria-controls'), panel.id, `${pagePath}: Platform button needs its own controlled panel`);
  assert.equal(button.getAttribute('aria-expanded'), 'false');
  assert.equal(panel.hidden, true);
  let prevented = false;
  button.trigger('keydown', {key: 'ArrowDown', preventDefault() { prevented = true; }});
  assert.ok(prevented, `${pagePath}: ArrowDown should open the menu`);
  assert.equal(panel.hidden, false);
  assert.equal(document.activeElement, links[0], `${pagePath}: ArrowDown should focus the first destination`);
  let stopped = false;
  document.dispatchEvent({type: 'keydown', key: 'Escape', preventDefault() {}, stopPropagation() { stopped = true; }});
  assert.ok(stopped, `${pagePath}: Escape should preserve the parent mobile menu`);
  assert.equal(panel.hidden, true);
  assert.equal(document.activeElement, button, `${pagePath}: Escape should restore focus to Platform`);
  assert.ok(events.get('keydown').every(event => event.capture === true), `${pagePath}: both disclosure Escape handlers need capture phase`);
  button.trigger('click');
  document.dispatchEvent({type: 'focusin', target: solutionsButton});
  assert.equal(panel.hidden, false, `${pagePath}: focusing Solutions must keep Platform's layout stable until the toggle click`);
  solutionsButton.trigger('click');
  assert.equal(panel.hidden, true, `${pagePath}: opening Solutions must close Platform`);
  assert.equal(solutionsPanel.hidden, false);
  document.dispatchEvent({type: 'focusin', target: button});
  assert.equal(solutionsPanel.hidden, false, `${pagePath}: focusing Platform must keep Solutions' layout stable until the toggle click`);
  button.trigger('click');
  assert.equal(panel.hidden, false);
  assert.equal(solutionsPanel.hidden, true, `${pagePath}: opening Platform must close Solutions`);
  document.dispatchEvent({type: 'click', target: {}});
  assert.equal(panel.hidden, true, `${pagePath}: outside clicks must close Platform`);
  button.trigger('click');
  document.dispatchEvent({type: 'focusin', target: {}});
  assert.equal(panel.hidden, true, `${pagePath}: moving focus outside must close Platform`);
  const active = links.filter(link => link.getAttribute('aria-current') === 'page');
  assert.equal(active.length, ['/platform.html', '/products/hire.html'].includes(pagePath) ? 1 : 0, `${pagePath}: active page should be identified exactly once when applicable`);
  if (active.length) assert.equal(active[0].pathname, pagePath);
  const listeners = [...events.values()].reduce((count, list) => count + list.length, 0);
  run();
  assert.equal(platform.children[0], button, `${pagePath}: rerunning the navigation should preserve the existing controls`);
  assert.equal([...events.values()].reduce((count, list) => count + list.length, 0), listeners, `${pagePath}: rerunning navigation should not register duplicate handlers`);
}

console.log('PASS: six distinct product pages and briefs, 18 tailored use cases, metadata, related products and solution links, root/nested Platform URLs, active states, keyboard and Escape behaviour, menu mutual exclusion and idempotence.');
