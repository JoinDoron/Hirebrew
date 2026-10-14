/* Shared static shell for product and solution landing pages. */
export const e=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
export const arrow='<span aria-hidden="true">↗</span>';
export const head=(title,description,prefix,{styles=[]}={})=>`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#FFFFFF">
<meta name="description" content="${e(description)}">
<meta name="robots" content="noindex, nofollow">
<meta property="og:title" content="${e(title)}">
<meta property="og:description" content="${e(description)}">
<meta property="og:type" content="website">
<title>${e(title)}</title>
<link rel="icon" href="${prefix}assets/brand/favicon.svg" type="image/svg+xml">
<link rel="preload" href="${prefix}assets/fonts/dm-sans.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="${prefix}styles.css">
<link rel="stylesheet" href="${prefix}enterprise.css">
<link rel="stylesheet" href="${prefix}solution-pages.css">
${styles.map(file=>`<link rel="stylesheet" href="${prefix}${e(file)}">`).join('\n')}
<link rel="stylesheet" href="${prefix}solutions-nav.css">
<link rel="stylesheet" href="${prefix}platform-nav.css">
<link rel="stylesheet" href="${prefix}story-demo.css">
<link rel="stylesheet" href="${prefix}site-shell.css">
<link rel="stylesheet" href="${prefix}marketing-theme.css">
<script src="${prefix}solutions-nav.js" defer></script>
<script src="${prefix}platform-nav.js" defer></script>
<script src="${prefix}solutions.js" defer></script>
<script src="${prefix}story-demo.js" defer></script>
<noscript><style>.marketing-theme .enterprise-header .enterprise-nav{height:auto;min-height:72px;flex-wrap:wrap;padding-block:16px}.marketing-theme .enterprise-header .enterprise-menu{display:none!important}.marketing-theme .enterprise-header .enterprise-links{display:flex;position:static;flex-wrap:wrap;flex-direction:row;gap:15px;padding:0;width:100%;max-height:none;flex-basis:100%;margin-left:0;overflow:visible}.solution-pilot-layout{grid-template-columns:1fr}</style></noscript>
</head>`;
export const header=(prefix,cta='#pilot')=>`<a class="skip-link" href="#main">Skip to content</a>
<header class="enterprise-header"><nav class="enterprise-nav enterprise-wrap" aria-label="Main navigation">
<a class="shell-brand" href="${prefix}index.html" aria-label="Hirebrew home"><img src="${prefix}assets/brand/logo.svg" width="157" height="40" alt="Hirebrew"></a>
<button class="enterprise-menu" id="enterprise-menu" type="button" aria-expanded="false" aria-controls="enterprise-links">Menu <span aria-hidden="true">+</span></button>
<div class="enterprise-links" id="enterprise-links">
<div class="platform-nav" data-root="${prefix}"><a class="platform-fallback" href="${prefix}platform.html">Platform</a></div>
<div class="solutions-nav" data-root="${prefix}"><a class="solutions-fallback" href="${prefix}solutions.html">Solutions</a></div>
<a href="${prefix}enterprise.html">Enterprise</a>
<a href="${prefix}enterprise.html#resources">Resources</a>
<a class="shell-tour" href="${prefix}index.html#tour">Take a tour</a>
<a class="enterprise-button enterprise-button-small" href="${cta}">Plan your pilot ${arrow}</a>
</div></nav></header>`;
export const footer=prefix=>`<footer class="enterprise-footer enterprise-wrap">
<div class="shell-footer-grid">
<nav class="shell-footer-group" aria-label="Platform"><h2>Platform</h2><a href="${prefix}products/hire.html">Hire</a><a href="${prefix}products/onboard.html">Onboard</a><a href="${prefix}products/people.html">People</a><a href="${prefix}products/grow.html">Grow</a><a href="${prefix}products/intelligence.html">Intelligence</a><a href="${prefix}products/brew-ai.html">Brew AI</a><a href="${prefix}platform.html">All products</a><h2>See it in action</h2><a href="${prefix}index.html#tour">Interactive product tour</a><a href="${prefix}index.html#story-demo">Candidate conversation</a></nav>
<nav class="shell-footer-group" aria-label="Solutions"><h2>Solutions</h2><a href="${prefix}solutions/startups.html">Startups</a><a href="${prefix}solutions/mid-market.html">Mid-market</a><a href="${prefix}solutions/enterprise.html">Enterprise</a><a href="${prefix}solutions/hr-teams.html">HR teams</a><a href="${prefix}solutions/finance-teams.html">Finance teams</a><a href="${prefix}solutions/it-teams.html">IT teams</a><a href="${prefix}solutions/founders.html">Founders</a><a href="${prefix}solutions.html#industries">All industries</a><a href="${prefix}solutions.html">All solutions</a></nav>
<nav class="shell-footer-group" aria-label="Enterprise and resources"><h2>Enterprise</h2><a href="${prefix}enterprise.html">Why Hirebrew for enterprise</a><a href="${prefix}enterprise.html#rollout">Implementation planning</a><a href="${prefix}enterprise.html#integrations">Integrations</a><a href="${prefix}enterprise.html#governance">Governance and controls</a><a href="${prefix}enterprise.html#pricing">Commercial planning</a><h2>Resources</h2><a href="${prefix}enterprise.html#resources">Buyer’s toolkit</a><a href="${prefix}index.html#questions">Frequently asked questions</a></nav>
<nav class="shell-footer-group" aria-label="Hirebrew"><h2>Hirebrew</h2><a href="${prefix}index.html#why-hirebrew">Built for what’s next</a><a href="${prefix}brand.html">Brand and visual identity</a><a href="${prefix}design-notes.html">Design and research</a><a href="${prefix}enterprise.html#rollout">Plan your pilot</a></nav>
</div>
<div class="enterprise-footer-bottom"><a class="shell-brand" href="${prefix}index.html" aria-label="Hirebrew home"><img src="${prefix}assets/brand/logo.svg" width="157" height="40" alt="Hirebrew"></a><span>© 2026 Hirebrew</span><span>Product preview.<br>Evaluate with sample data.</span></div>
</footer>`;
