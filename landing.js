/* Local homepage disclosure navigation. No persistence or external requests. */
'use strict';
(() => {
  const notice = document.querySelector('#landing-notice');
  document.querySelector('[data-dismiss-notice]')?.addEventListener('click', () => {
    notice.hidden = true;
    document.querySelector('.wordmark')?.focus();
  });
  function revealTarget(hash, scroll = false) {
    if (!hash || hash === '#') return;
    let id;
    try { id = decodeURIComponent(hash.slice(1)); } catch { return; }
    const target = document.getElementById(id);
    if (!target) return;
    let parent = target.closest('details');
    while (parent) {
      parent.open = true;
      parent = parent.parentElement?.closest('details');
    }
    if (scroll) target.scrollIntoView({block:'start', behavior:'auto'});
  }
  document.addEventListener('click', event => {
    const link = event.target.closest('a[href^="#"]');
    if (link) revealTarget(link.hash);
  });
  window.addEventListener('hashchange', () => revealTarget(window.location.hash, true));
  const product = new URLSearchParams(window.location.search).get('product');
  if (['hire','onboard','people','grow','intelligence'].includes(product)) {
    const explorer = document.querySelector('#workflow-explorer');
    if (explorer) explorer.open = true;
    const showExplorer = () => requestAnimationFrame(() => revealTarget('#product-explorer', true));
    // Run after the browser's initial fragment jump, which otherwise wins over
    // query-selected product navigation when the page is first loaded.
    if (document.readyState === 'complete') showExplorer();
    else window.addEventListener('load', showExplorer, {once:true});
  } else {
    revealTarget(window.location.hash);
  }
})();
