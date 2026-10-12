import assert from 'node:assert/strict';
import {readFile, readdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';

const root = path.dirname(fileURLToPath(import.meta.url));
const files = ['solutions-business.json', 'solutions-industries-a.json', 'solutions-industries-b.json'];
const solutions = (await Promise.all(files.map(async file => JSON.parse(await readFile(path.join(root, 'content', file), 'utf8'))))).flat();
const requiredIndustries = ['advertising', 'ai', 'bpo', 'construction', 'crypto', 'education', 'finance', 'fintech', 'gaming', 'healthcare', 'it', 'manufacturing', 'nonprofit', 'oil-gas', 'retail', 'technology'];
const strings = ['slug', 'legacyId', 'category', 'name', 'metaTitle', 'metaDescription', 'headline', 'subhead', 'summary', 'challengeTitle', 'challenge', 'workflowTitle', 'workflowIntro'];
const capabilityDestinations = new Set(['index.html#platform', 'index.html#tour', 'index.html#brew', 'enterprise.html#governance', 'enterprise.html#integrations', 'enterprise.html#rollout', 'enterprise.html#resources']);
const slugs = new Set(solutions.map(solution => solution.slug));
const decodeText = value => value.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&#x27;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
const normalize = value => value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

assert.equal(solutions.length, 24, 'Expected 24 solution profiles');
assert.equal(slugs.size, solutions.length, 'Solution slugs must be unique');
assert.equal(new Set(solutions.map(solution => solution.legacyId)).size, solutions.length, 'Legacy IDs must be unique');
for (const [category, expected] of [['size', 3], ['team', 5], ['industry', 16]]) {
  assert.equal(solutions.filter(solution => solution.category === category).length, expected, `Expected ${expected} ${category} solutions`);
}
assert.deepEqual(solutions.filter(solution => solution.category === 'industry').map(solution => solution.slug).sort(), requiredIndustries, 'Industry coverage does not match the requested directory');
for (const field of ['metaTitle', 'metaDescription', 'headline', 'summary']) {
  assert.equal(new Set(solutions.map(solution => normalize(solution[field]))).size, solutions.length, `Every solution needs a unique ${field}`);
}

const generated = (await readdir(path.join(root, 'solutions'))).filter(file => file.endsWith('.html')).sort();
assert.deepEqual(generated, solutions.map(solution => `${solution.slug}.html`).sort(), 'Generated pages must exactly match the content sources');
const directory = await readFile(path.join(root, 'solutions.html'), 'utf8');
const titles = new Set();
const descriptions = new Set();
for (const solution of solutions) {
  const context = solution.slug;
  for (const field of strings) assert.ok(typeof solution[field] === 'string' && solution[field].trim().length, `${context}: missing ${field}`);
  assert.match(solution.slug, /^[a-z]+(?:-[a-z]+)*$/, `${context}: invalid slug`);
  assert.ok(solution.headline.split(/\s+/).length >= 3, `${context}: headline must convey a specific proposition`);
  assert.ok(solution.metaDescription.length >= 60, `${context}: description is too brief to explain the solution`);
  assert.ok(!/[\u2013\u2014<>]/.test(JSON.stringify(solution)), `${context}: content must be plain text without HTML or long dashes`);
  for (const [field, count, keys] of [
    ['priorities', 3, ['title', 'body']],
    ['steps', 4, ['label', 'owner', 'title', 'body']],
    ['capabilities', 4, ['name', 'body', 'href']],
    ['faqs', 3, ['q', 'a']]
  ]) {
    assert.ok(Array.isArray(solution[field]), `${context}: ${field} must be an array`);
    assert.equal(solution[field].length, count, `${context}: expected ${count} ${field}`);
    for (const item of solution[field]) {
      for (const key of keys) assert.ok(typeof item[key] === 'string' && item[key].trim().length, `${context}: ${field} entry missing ${key}`);
    }
  }
  for (const key of ['title', 'body', 'example']) assert.ok(solution.ai?.[key]?.trim(), `${context}: missing AI ${key}`);
  for (const key of ['title', 'body', 'boundary']) assert.ok(solution.pilot?.[key]?.trim(), `${context}: missing pilot ${key}`);
  assert.equal(solution.pilot.checks.length, 3, `${context}: expected three pilot checks`);
  assert.ok(solution.pilot.checks.every(check => typeof check === 'string' && check.trim()), `${context}: pilot checks must have content`);
  assert.equal(solution.related.length, 3, `${context}: expected three related solutions`);
  assert.equal(new Set(solution.related).size, solution.related.length, `${context}: related solutions must be distinct`);
  for (const slug of solution.related) assert.ok(slugs.has(slug) && slug !== solution.slug, `${context}: invalid related solution ${slug}`);
  for (const capability of solution.capabilities) assert.ok(capabilityDestinations.has(capability.href), `${context}: unsupported capability link ${capability.href}`);

  const html = await readFile(path.join(root, 'solutions', `${solution.slug}.html`), 'utf8');
  const title = decodeText(html.match(/<title>([\s\S]*?)<\/title>/)?.[1] || '');
  const description = decodeText(html.match(/<meta\s+name="description"\s+content="([^"]+)"/)?.[1] || '');
  assert.equal(title, solution.metaTitle, `${context}: generated title differs from the content source`);
  assert.equal(description, solution.metaDescription, `${context}: generated description differs from the content source`);
  assert.ok(!titles.has(title), `${context}: duplicate generated title`);
  assert.ok(!descriptions.has(description), `${context}: duplicate generated description`);
  titles.add(title); descriptions.add(description);
  const visibleText = decodeText(html.replace(/<[^>]*>/g, ' '));
  assert.ok(visibleText.includes(solution.headline), `${context}: bespoke headline missing from generated page`);
  assert.ok(visibleText.includes(solution.pilot.boundary), `${context}: pilot boundary missing from generated page`);
  assert.match(html, /data-root="\.\.\/"/, `${context}: nested shared navigation needs a parent-relative root`);
  assert.ok(/class="platform-nav"\s+data-root="\.\.\/"/.test(html), `${context}: every solution page must expose the shared product menu`);
  assert.ok(html.includes('../platform-nav.js') && html.includes('../platform-nav.css'), `${context}: shared Platform navigation assets are missing`);
  assert.ok(directory.includes(`solutions/${solution.slug}.html`), `${context}: dedicated page missing from the directory`);
  const brief = await readFile(path.join(root, 'assets', 'resources', 'pilots', `${solution.slug}.txt`), 'utf8');
  assert.ok(brief.includes(solution.name), `${context}: pilot brief must identify its audience`);
  for (const check of solution.pilot.checks) assert.ok(brief.includes(check), `${context}: pilot brief missing acceptance criterion`);
  assert.ok(brief.includes(solution.pilot.boundary), `${context}: pilot brief missing its scope boundary`);
}
assert.ok(directory.includes('id="industries"'), 'All industries directory anchor missing');

// Execute the navigation renderer against an intentionally small DOM double.
// These are source-level unit tests; actual layout and browser interactions are checked separately.
const navSource = await readFile(path.join(root, 'solutions-nav.js'), 'utf8');
function createNavigation(pagePath, prefix) {
  let document;
  class Element {
    constructor(tagName) { this.tagName = tagName.toLowerCase(); this.children = []; this.attributes = new Map(); this.events = new Map(); this.dataset = {}; this.textContent = ''; }
    append(...children) { this.children.push(...children); }
    replaceChildren(...children) { this.children = children; }
    setAttribute(name, value) { this.attributes.set(name, String(value)); }
    getAttribute(name) { return this.attributes.get(name) ?? null; }
    addEventListener(name, listener) { this.events.set(name, [...this.events.get(name) || [], listener]); }
    querySelectorAll(selector) { return this.children.flatMap(child => [...(child.tagName === selector ? [child] : []), ...child.querySelectorAll(selector)]); }
    querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
    contains(target) { return this === target || this.children.some(child => child.contains(target)); }
    focus() { document.activeElement = this; }
    set href(value) { this.url = new URL(value, `https://hirebrew.test${pagePath}`); }
    get href() { return this.url.href; }
    get pathname() { return this.url.pathname; }
    get hash() { return this.url.hash; }
    trigger(name, event = {}) { for (const listener of this.events.get(name) || []) listener(event); }
  }
  const mount = new Element('div');
  mount.dataset.root = prefix;
  const events = new Map();
  document = {
    activeElement: null,
    createElement: tagName => new Element(tagName),
    querySelectorAll: selector => selector === '.solutions-nav' ? [mount] : [],
    addEventListener(name, listener) { events.set(name, [...events.get(name) || [], listener]); },
    dispatchEvent(event) { for (const listener of events.get(event.type) || []) listener(event); }
  };
  vm.runInNewContext(navSource, {
    document, window: {location: {pathname: pagePath}},
    CustomEvent: class { constructor(type) { this.type = type; } },
    matchMedia: () => ({matches: false}), setTimeout, clearTimeout
  }, {timeout: 1000, filename: 'solutions-nav.js'});
  return {mount, document};
}

for (const [pagePath, prefix] of [['/index.html', ''], ['/solutions/construction.html', '../']]) {
  const {mount, document} = createNavigation(pagePath, prefix);
  const links = mount.querySelectorAll('a');
  assert.equal(links.length, 25, `${pagePath}: expected 24 solutions and an industry directory link`);
  assert.deepEqual(links.filter(link => !link.hash).map(link => link.pathname).sort(), solutions.map(solution => `/solutions/${solution.slug}.html`).sort(), `${pagePath}: navigation destinations must resolve from this page`);
  const directoryLink = links.find(link => link.hash === '#industries');
  assert.equal(directoryLink?.pathname, '/solutions.html', `${pagePath}: industry directory path is incorrect`);
  const badge = directoryLink.querySelectorAll('span').find(span => span.className === 'solutions-count');
  assert.equal(String(badge?.textContent), '16', `${pagePath}: industry count must be 16`);
  assert.equal(badge?.getAttribute('aria-label'), '16 industries', `${pagePath}: industry badge needs an accessible label`);
  const [button, panel] = mount.children;
  assert.equal(button.getAttribute('aria-controls'), panel.id, `${pagePath}: toggle must control its own panel`);
  assert.equal(button.getAttribute('aria-expanded'), 'false');
  assert.equal(panel.hidden, true);
  let prevented = false;
  button.trigger('keydown', {key: 'ArrowDown', preventDefault() { prevented = true; }});
  assert.ok(prevented, `${pagePath}: ArrowDown should take ownership of keyboard opening`);
  assert.equal(button.getAttribute('aria-expanded'), 'true');
  assert.equal(panel.hidden, false);
  assert.equal(document.activeElement, links[0], `${pagePath}: keyboard opening should focus the first link`);
  let stopped = false;
  document.dispatchEvent({type: 'keydown', key: 'Escape', preventDefault() {}, stopPropagation() { stopped = true; }});
  assert.ok(stopped, `${pagePath}: Escape must not also dismiss the parent mobile navigation`);
  assert.equal(panel.hidden, true);
  assert.equal(document.activeElement, button, `${pagePath}: Escape should restore focus`);
  button.trigger('click');
  document.dispatchEvent({type: 'click', target: {}});
  assert.equal(panel.hidden, true, `${pagePath}: outside click must close the panel`);
  if (prefix) assert.equal(links.find(link => link.pathname === pagePath)?.getAttribute('aria-current'), 'page', 'Active dedicated solution needs aria-current');
}

console.log('PASS: 24 bespoke solution profiles, 16 industries, generated metadata and pilot briefs, related destinations, root/nested menu URLs, keyboard opening, Escape focus return and outside dismissal.');
