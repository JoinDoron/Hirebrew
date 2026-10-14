/* Homepage structure and retained interaction contracts; no copy snapshots. */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';

const root = path.dirname(fileURLToPath(import.meta.url));
const read = file => readFile(path.join(root, file), 'utf8');
const html = await read('index.html');

// A small tree is sufficient for structural checks without adding a browser or
// parsing dependency to this dependency-free static website's release checks.
const document = {tag:'#document', attributes:{}, parent:null, children:[]};
const stack = [document];
const nodes = [];
const voidTags = new Set(['area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr']);
const tokens = /<!--[\s\S]*?-->|<\/?([a-z][\w:-]*)\b([^<>]*?)>/gi;
for (const match of html.matchAll(tokens)) {
  if (!match[1]) continue;
  const tag = match[1].toLowerCase();
  if (match[0].startsWith('</')) {
    const index = stack.findLastIndex(node => node.tag === tag);
    if (index > 0) stack.length = index;
    continue;
  }
  const attributes = {};
  for (const attribute of match[2].matchAll(/([^\s=/'"<>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s<>]+)))?/g)) {
    attributes[attribute[1].toLowerCase()] = attribute[2] ?? attribute[3] ?? attribute[4] ?? '';
  }
  const node = {tag, attributes, parent:stack.at(-1), children:[], offset:match.index};
  node.parent.children.push(node);
  nodes.push(node);
  if (!voidTags.has(tag) && !/\/\s*>$/.test(match[0])) stack.push(node);
}

const hasClass = (node, name) => (node.attributes.class || '').split(/\s+/).includes(name);
const within = (node, ancestor) => {
  for (let parent = node.parent; parent; parent = parent.parent) if (parent === ancestor) return true;
  return false;
};
const byId = id => {
  const matching = nodes.filter(node => node.attributes.id === id);
  assert.equal(matching.length, 1, `Homepage requires exactly one #${id}`);
  return matching[0];
};
const descendants = (ancestor, predicate) => nodes.filter(node => within(node, ancestor) && predicate(node));
const body = nodes.find(node => node.tag === 'body');
assert.ok(body && hasClass(body, 'lattice-home'), 'New homepage styling must be scoped to .lattice-home');
for (const file of ['landing.css', 'landing-grid.css']) {
  assert.equal(nodes.filter(node => node.tag === 'link' && node.attributes.rel === 'stylesheet' && node.attributes.href === file).length, 1, `${file}: load exactly once on the homepage`);
}
const landingScripts = nodes.filter(node => node.tag === 'script' && node.attributes.src === 'landing.js');
assert.equal(landingScripts.length, 1, 'Homepage disclosure navigation must load exactly once');
assert.ok(Object.hasOwn(landingScripts[0].attributes, 'defer'), 'Homepage enhancement must defer until markup is ready');
for (const file of ['platform.html', 'enterprise.html', 'solutions.html', 'products/hire.html', 'solutions/enterprise.html']) {
  const source = await read(file);
  assert.ok(!/href="landing(?:-grid)?\.css"|src="landing\.js"|class="[^"]*\blattice-home\b/.test(source), `${file}: homepage redesign must not restyle existing detail pages`);
}

const platform = byId('platform');
const grid = descendants(platform, node => hasClass(node, 'lp-product-grid'));
assert.equal(grid.length, 1, 'Platform needs one product grid');
const cards = descendants(grid[0], node => hasClass(node, 'lp-product-card'));
assert.equal(cards.length, 8, 'Platform grid must retain eight linked product/use-case cards');
const expectedLinks = [
  ...['hire','onboard','people','grow','intelligence','brew-ai'].map(slug => `products/${slug}.html`),
  'products/people.html#capabilities', 'enterprise.html#governance'
];
assert.deepEqual(cards.map(card => card.attributes.href).sort(), expectedLinks.sort(), 'Every card must reach its supported product or enterprise detail');
for (const card of cards) {
  assert.equal(card.tag, 'a', 'The full product card must be an accessible link');
  assert.ok(card.attributes['aria-label']?.trim(), 'Product card needs a clear accessible destination');
  assert.equal(descendants(card, node => node.tag === 'h3').length, 1, 'Each card needs one visible heading');
  assert.equal(descendants(card, node => ['a','button','input','select','textarea'].includes(node.tag) || Object.hasOwn(node.attributes, 'tabindex')).length, 0, 'Product illustrations must not nest interactive controls in a linked card');
  const previews = descendants(card, node => hasClass(node, 'lp-mini'));
  assert.equal(previews.length, 1, 'Every product card needs one illustrative product view');
  assert.equal(previews[0].attributes['aria-hidden'], 'true', 'Decorative product sample should not duplicate card content for assistive technology');
}

const tour = byId('tour');
const conversation = byId('conversation-walkthrough');
const workflow = byId('workflow-explorer');
for (const disclosure of [conversation, workflow]) {
  assert.equal(disclosure.tag, 'details', 'Optional walkthroughs must remain native keyboard-accessible disclosures');
  assert.equal(disclosure.children.filter(node => node.tag === 'summary').length, 1, 'Every walkthrough requires one direct summary');
}
assert.ok(conversation.offset > tour.offset, 'Conversation walkthrough must follow the tour');
assert.ok(within(byId('story-demo'), conversation), 'Generated conversation demo must live inside its disclosure');
assert.equal((html.match(/<!-- STORY-DEMO:START -->/g) || []).length, 1, 'Keep one generated-story opening marker');
assert.equal((html.match(/<!-- STORY-DEMO:END -->/g) || []).length, 1, 'Keep one generated-story closing marker');
const explorer = byId('product-explorer');
assert.ok(within(explorer, workflow), 'Product-family controls must live inside the workflow disclosure');
for (const id of ['module-panel','module-title','module-description','module-features','module-map','module-action','module-detail']) {
  assert.ok(within(byId(id), explorer), `#${id} must stay in the product explorer`);
}
for (const product of ['hire','onboard','people','grow','intelligence']) {
  const tab = byId(`module-tab-${product}`);
  assert.equal(tab.attributes['data-module'], product);
  assert.equal(tab.attributes['aria-controls'], 'module-panel');
  assert.ok(within(tab, explorer));
}
for (const id of ['workspace-count','workspace-progress-bar','workspace-insight','workspace-status','workspace-reset']) {
  assert.ok(within(byId(id), workflow), `#${id} must stay with the retained handoff preview`);
}
assert.deepEqual(descendants(workflow, node => Object.hasOwn(node.attributes, 'data-handoff')).map(node => node.attributes['data-handoff']).sort(), ['invite','review','welcome']);

for (const role of ['hr','manager','candidate','employee']) {
  const tab = byId(`tab-${role}`);
  assert.equal(tab.attributes['data-role'], role);
  assert.equal(tab.attributes['aria-controls'], 'demo-panel');
  assert.ok(within(tab, tour));
}
for (const id of ['demo-panel','demo-context','demo-nav','demo-content','reset-demo','demo-live']) {
  assert.ok(within(byId(id), tour), `#${id} must remain available to the role-tour runtime`);
}
assert.equal(descendants(tour, node => hasClass(node, 'sidebar-bottom')).length, 1);
const brew = byId('brew');
for (const id of ['draft-title','draft-text','draft-context','draft-state','approve-draft']) {
  assert.ok(within(byId(id), brew), `#${id} must remain available for human-reviewed AI illustrations`);
}
assert.deepEqual(descendants(brew, node => Object.hasOwn(node.attributes, 'data-prompt')).map(node => node.attributes['data-prompt']).sort(), ['invite','plan','summary']);
for (const id of ['pilot-dialog','review-dialog','privacy-dialog']) {
  const dialog = byId(id);
  assert.equal(dialog.tag, 'dialog');
  assert.equal(descendants(dialog, node => Object.hasOwn(node.attributes, 'data-close')).length, 1);
}
for (const id of ['pilot-form','pilot-team','pilot-size','pilot-focus','pilot-goal','form-error','form-success','review-text','save-review','privacy-info','nav-links','landing-notice']) byId(id);
assert.equal(nodes.filter(node => Object.hasOwn(node.attributes, 'data-dismiss-notice')).length, 1, 'Notice dismissal needs one control and its retained target');
assert.equal(nodes.filter(node => hasClass(node, 'menu-toggle')).length, 1, 'Mobile navigation toggle must remain available');
assert.equal(nodes.filter(node => hasClass(node, 'platform-nav')).length, 1);
assert.equal(nodes.filter(node => hasClass(node, 'solutions-nav')).length, 1);

const css = await read('landing.css');
assert.match(css, /\.lattice-home\s*\{[^}]*--display:\s*['"]DM Sans['"]\s*,\s*sans-serif/, 'Homepage typography must use the locally licensed DM Sans alternative');
assert.match(css, /:focus-visible/, 'Homepage needs visible keyboard focus');
assert.match(css, /prefers-reduced-motion/, 'Homepage needs reduced-motion styling');
assert.ok(!/@import|url\(\s*['"]?https?:/i.test(css), 'Homepage fonts and styling must remain locally hosted');
const script = await read('landing.js');
assert.ok(!/\b(?:fetch|XMLHttpRequest|WebSocket|sendBeacon|localStorage|sessionStorage|indexedDB)\b/.test(script), 'Homepage enhancement must not add network calls or persistence');
assert.ok(nodes.some(node => node.tag === 'meta' && node.attributes.name === 'robots' && /noindex/.test(node.attributes.content)), 'Demo release must retain its noindex boundary');

// Exercise the actual enhancement with a small DOM fixture. Cross-page links
// must reveal their previously visible destinations after those sections move
// into disclosures, including query-driven product selection.
function runLanding({hash='', search='', readyState='loading'} = {}) {
  const frames = [];
  const elements = new Map();
  class Target {
    constructor() { this.listeners = new Map(); }
    addEventListener(type, callback, options={}) { this.listeners.set(type, [...this.listeners.get(type) || [], {callback,once:options.once === true}]); }
    trigger(type, event={}) {
      for (const listener of [...this.listeners.get(type) || []]) {
        if (listener.once) this.listeners.set(type, this.listeners.get(type).filter(item => item !== listener));
        listener.callback(event);
      }
    }
  }
  class Element extends Target {
    constructor(id, tag='div', parent=null) {
      super(); this.id=id; this.tag=tag; this.parentElement=parent; this.open=false; this.hidden=false; this.scrolled=[]; this.focused=false;
      elements.set(id, this);
    }
    closest(selector) {
      for (let node=this; node; node=node.parentElement) {
        if (selector==='details' && node.tag==='details') return node;
        if (selector==='a[href^="#"]' && node.tag==='a' && node.hash?.startsWith('#')) return node;
      }
      return null;
    }
    scrollIntoView(options) { this.scrolled.push({...options}); }
    focus() { this.focused=true; }
  }
  const conversation = new Element('conversation-walkthrough', 'details');
  const nested = new Element('nested-walkthrough', 'details', conversation);
  const story = new Element('story-demo', 'section', nested);
  const workflow = new Element('workflow-explorer', 'details');
  const explorer = new Element('product-explorer', 'section', workflow);
  const notice = new Element('landing-notice');
  const dismiss = new Element('dismiss-notice', 'button');
  const logo = new Element('wordmark', 'a');
  const document = new Target();
  document.readyState = readyState;
  document.getElementById = id => elements.get(id) || null;
  document.querySelector = selector => ({'[data-dismiss-notice]':dismiss, '.wordmark':logo}[selector] || elements.get(selector.slice(1)) || null);
  const window = Object.assign(new Target(), {location:{hash,search}});
  const context = vm.createContext({document,window,URLSearchParams,requestAnimationFrame:callback=>frames.push(callback)});
  vm.runInContext(script, context, {timeout:1000, filename:'landing.js'});
  const clickLink = targetHash => {
    const link = new Element('test-link', 'a'); link.hash=targetHash;
    document.trigger('click', {target:new Element('link-label', 'span', link)});
  };
  return {conversation,nested,story,workflow,explorer,notice,dismiss,logo,document,window,frames,clickLink};
}
const initial = runLanding({hash:'#story-demo'});
assert.ok(initial.conversation.open && initial.nested.open, 'Direct hashes must reveal every containing disclosure');
assert.equal(initial.story.scrolled.length, 0, 'Initial hash navigation should retain the browser’s normal scroll handling');
assert.ok(!initial.workflow.open, 'Unrelated disclosures should remain closed');
initial.clickLink('#product-explorer');
assert.ok(initial.workflow.open, 'Clicks on a nested anchor label must reveal the destination before navigation');
initial.workflow.open=false;
initial.window.location.hash='#product-explorer';
initial.window.trigger('hashchange');
assert.ok(initial.workflow.open);
assert.deepEqual(initial.explorer.scrolled, [{block:'start',behavior:'auto'}]);
initial.dismiss.trigger('click');
assert.ok(initial.notice.hidden && initial.logo.focused, 'Dismissing the notice must return focus to a useful visible control');
for (const hash of ['', '#', '#missing', '#%E0%A4%A']) assert.doesNotThrow(() => initial.clickLink(hash), 'Invalid hashes should remain harmless');
const encoded = runLanding({hash:'#%73tory-demo'});
assert.ok(encoded.conversation.open, 'Encoded fragment identifiers must resolve');
for (const product of ['hire','onboard','people','grow','intelligence']) {
  for (const readyState of ['loading','interactive','complete']) {
    const selected = runLanding({search:`?product=${product}`, hash:'#platform', readyState});
    assert.ok(selected.workflow.open, `${product}: query-selected explorer must become visible immediately`);
    assert.equal(selected.explorer.scrolled.length, 0, 'Query navigation must wait for its animation frame before scrolling');
    if (readyState !== 'complete') {
      assert.equal(selected.frames.length, 0, 'Do not queue query scrolling before the native initial fragment jump');
      assert.equal(selected.window.listeners.get('load')?.length, 1, 'A loading document needs one load listener');
      selected.document.readyState='complete';
      selected.window.trigger('load');
      assert.equal(selected.window.listeners.get('load')?.length, 0, 'The load listener must remove itself after one execution');
    } else {
      assert.equal(selected.window.listeners.get('load')?.length || 0, 0, 'An already loaded document must not wait for a load event that has passed');
    }
    assert.equal(selected.frames.length, 1, 'Query navigation must queue exactly one post-load animation frame');
    selected.window.trigger('load');
    assert.equal(selected.frames.length, 1, 'A repeated load event must not duplicate query navigation');
    selected.frames.shift()();
    assert.deepEqual(selected.explorer.scrolled, [{block:'start',behavior:'auto'}]);
  }
}
const unknown = runLanding({search:'?product=unknown', hash:'#story-demo'});
assert.ok(unknown.conversation.open && !unknown.workflow.open, 'Unknown products should preserve ordinary fragment navigation');

console.log('PASS: scoped landing design, eight accessible product cards, preserved product/role/AI/planner hooks, nested walkthroughs, local typography, reduced motion, privacy boundaries, disclosure deep links, post-load query navigation and notice focus return.');
