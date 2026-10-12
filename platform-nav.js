/* Shared Platform navigation. Product pages remain accessible without JavaScript. */
(() => {
  'use strict';
  const products = [
    ['Hire', 'From approved role to confident decision.', 'hire'],
    ['Onboard', 'A thoughtful start for every new joiner.', 'onboard'],
    ['People', 'A clearer home for everyday HR.', 'people'],
    ['Grow', 'Goals, feedback and the next opportunity.', 'grow'],
    ['Intelligence', 'People context for your next decision.', 'intelligence'],
    ['Brew AI', 'A useful first draft. Your final say.', 'brew-ai']
  ];

  document.querySelectorAll('.platform-nav').forEach((root, index) => {
    if (root.dataset.platformReady === 'true') return;
    root.dataset.platformReady = 'true';
    const prefix = root.dataset.root || './';
    const button = document.createElement('button');
    button.className = 'platform-toggle';
    button.type = 'button';
    button.innerHTML = 'Platform <span aria-hidden="true">⌄</span>';
    button.setAttribute('aria-expanded', 'false');
    const panel = document.createElement('div');
    panel.className = 'platform-panel';
    panel.id = `platform-menu${index ? `-${index}` : ''}`;
    panel.hidden = true;
    button.setAttribute('aria-controls', panel.id);

    const intro = document.createElement('div');
    intro.className = 'platform-menu-intro';
    const label = document.createElement('p');
    label.className = 'platform-menu-kicker';
    label.textContent = 'THE CONNECTED PEOPLE PLATFORM';
    const heading = document.createElement('h2');
    heading.innerHTML = 'One story.<br>Every stage.';
    const overview = document.createElement('a');
    overview.className = 'platform-overview-link';
    overview.href = `${prefix}platform.html`;
    overview.innerHTML = 'Explore the platform <span aria-hidden="true">→</span>';
    if (overview.pathname === window.location.pathname) overview.setAttribute('aria-current', 'page');
    intro.append(label, heading, overview);

    const list = document.createElement('ul');
    list.className = 'platform-menu-products';
    products.forEach(([name, description, slug]) => {
      const item = document.createElement('li');
      const link = document.createElement('a');
      link.href = `${prefix}products/${slug}.html`;
      link.dataset.platformProduct = slug;
      if (link.pathname === window.location.pathname) link.setAttribute('aria-current', 'page');
      const title = document.createElement('strong');
      title.textContent = name;
      const note = document.createElement('span');
      note.textContent = description;
      link.append(title, note);
      item.append(link);
      list.append(item);
    });
    panel.append(intro, list);
    root.replaceChildren(button, panel);

    let hoverTimer;
    function close(restoreFocus = false) {
      clearTimeout(hoverTimer);
      button.setAttribute('aria-expanded', 'false');
      panel.hidden = true;
      if (restoreFocus) button.focus();
    }
    function open() {
      clearTimeout(hoverTimer);
      document.dispatchEvent(new CustomEvent('hirebrew:platform-open'));
      button.setAttribute('aria-expanded', 'true');
      panel.hidden = false;
    }
    button.addEventListener('click', () => {
      if (panel.hidden) open();
      else close();
    });
    button.addEventListener('keydown', event => {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        open();
        panel.querySelector('a').focus();
      }
    });
    root.addEventListener('pointerenter', () => {
      if (matchMedia('(hover:hover) and (min-width:801px)').matches) {
        clearTimeout(hoverTimer);
        hoverTimer = setTimeout(open, 160);
      }
    });
    root.addEventListener('pointerleave', () => {
      clearTimeout(hoverTimer);
      if (matchMedia('(hover:hover) and (min-width:801px)').matches && !root.contains(document.activeElement)) {
        hoverTimer = setTimeout(() => close(), 180);
      }
    });
    document.addEventListener('hirebrew:solutions-open', () => close());
    document.addEventListener('click', event => { if (!root.contains(event.target)) close(); });
    document.addEventListener('focusin', event => {
      // Keep the layout stable between pointer focus and a sibling toggle's click.
      // Its open event will close this panel after the click has reached its target.
      if (!root.contains(event.target) && !event.target.closest?.('.solutions-toggle')) close();
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && !panel.hidden) {
        event.preventDefault();
        event.stopPropagation();
        close(true);
      }
    }, true);
    panel.querySelectorAll('a').forEach(link => link.addEventListener('click', () => close()));
  });
})();
