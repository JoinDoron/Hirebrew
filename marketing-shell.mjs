/* Shared static shell for product and solution landing pages. */
export const e=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
export const arrow='<span aria-hidden="true">↗</span>';
export const head=(title,description,prefix,{styles=[]}={})=>`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#F7F5EF">
<meta name="description" content="${e(description)}">
<meta name="robots" content="noindex, nofollow">
<meta property="og:title" content="${e(title)}">
<meta property="og:description" content="${e(description)}">
<meta property="og:type" content="website">
<title>${e(title)}</title>
<link rel="icon" href="${prefix}assets/brand/favicon.svg" type="image/svg+xml">
<link rel="preload" href="${prefix}assets/fonts/bricolage.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="${prefix}assets/fonts/dm-sans.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="${prefix}styles.css">
<link rel="stylesheet" href="${prefix}enterprise.css">
<link rel="stylesheet" href="${prefix}solution-pages.css">
${styles.map(file=>`<link rel="stylesheet" href="${prefix}${e(file)}">`).join('\n')}
<link rel="stylesheet" href="${prefix}solutions-nav.css">
<link rel="stylesheet" href="${prefix}platform-nav.css">
<link rel="stylesheet" href="${prefix}story-demo.css">
<script src="${prefix}solutions-nav.js" defer></script>
<script src="${prefix}platform-nav.js" defer></script>
<script src="${prefix}solutions.js" defer></script>
<script src="${prefix}story-demo.js" defer></script>
<noscript><style>.enterprise-nav{height:auto;min-height:72px;flex-wrap:wrap;padding-block:16px}.enterprise-menu{display:none!important}.enterprise-header .enterprise-links{display:flex;position:static;flex-wrap:wrap;flex-direction:row;gap:15px;padding:0;width:100%;max-height:none}.solution-pilot-layout{grid-template-columns:1fr}</style></noscript>
</head>`;
export const header=(prefix,cta='#pilot')=>`<a class="skip-link" href="#main">Skip to content</a>
<header class="enterprise-header"><nav class="enterprise-nav enterprise-wrap" aria-label="Main navigation">
<a href="${prefix}index.html" aria-label="Hirebrew home"><img src="${prefix}assets/brand/logo.svg" width="157" height="40" alt="Hirebrew"></a>
<button class="enterprise-menu" type="button" aria-expanded="false" aria-controls="enterprise-links">Menu <span aria-hidden="true">+</span></button>
<div class="enterprise-links" id="enterprise-links">
<div class="platform-nav" data-root="${prefix}"><a class="platform-fallback" href="${prefix}platform.html">Platform</a></div>
<div class="solutions-nav" data-root="${prefix}"><a class="solutions-fallback" href="${prefix}solutions.html">Solutions</a></div>
<a href="${prefix}enterprise.html">Enterprise</a>
<a href="${prefix}index.html#tour">Product tour</a>
<a class="enterprise-button enterprise-button-small" href="${cta}">Plan your pilot ${arrow}</a>
</div></nav></header>`;
export const footer=prefix=>`<footer class="enterprise-footer enterprise-wrap">
<div><a href="${prefix}index.html" aria-label="Hirebrew home"><img src="${prefix}assets/brand/logo.svg" width="157" height="40" alt="Hirebrew"></a><p>Good people. Great futures.</p></div>
<nav aria-label="Footer navigation"><a href="${prefix}platform.html">All products</a><a href="${prefix}solutions.html">All solutions</a><a href="${prefix}index.html#tour">Product tour</a><a href="${prefix}enterprise.html#resources">Buyer resources</a></nav>
<div class="enterprise-footer-bottom"><span>© 2026 Hirebrew</span><span>Product preview. Evaluate with sample data.</span></div>
</footer>`;
