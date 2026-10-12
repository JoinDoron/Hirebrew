/* Progressive enhancement. Content and starting briefs work without JavaScript. */
(() => {
  'use strict';
  const menu = document.querySelector('.enterprise-menu');
  const nav = document.getElementById('enterprise-links');
  function closeMenu(returnFocus = false) {
    nav.classList.remove('is-open');
    menu.setAttribute('aria-expanded', 'false');
    menu.querySelector('span').textContent = '+';
    if (returnFocus) menu.focus();
  }
  menu.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('is-open');
    menu.setAttribute('aria-expanded', String(isOpen));
    menu.querySelector('span').textContent = isOpen ? '−' : '+';
  });
  nav.addEventListener('click', event => {
    if (event.target.closest('.solutions-toggle')) return;
    if (event.target.closest('a')) closeMenu();
  });
  document.addEventListener('keydown', event => {
    if (event.defaultPrevented) return;
    if (event.key === 'Escape' && nav.classList.contains('is-open')) closeMenu(true);
  });
  window.matchMedia('(min-width: 801px)').addEventListener('change', event => { if (event.matches) closeMenu(); });

  // Old profile URLs remain useful after moving to independent pages.
  const directoryItems = [...document.querySelectorAll('[data-directory-item]')];
  function legacyDestination() {
    const item = directoryItems.find(item => `#${item.id}` === location.hash);
    if (item) location.replace(item.href);
  }
  legacyDestination();
  window.addEventListener('hashchange', legacyDestination);
  const search = document.getElementById('solution-search');
  if (search) {
    document.querySelector('.directory-search').hidden = false;
    const clearButtons = [...document.querySelectorAll('[data-clear-search]')];
    function filter() {
      const words = search.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
      let count = 0;
      directoryItems.forEach(item => {
        item.hidden = !words.every(word => item.dataset.search.includes(word));
        if (!item.hidden) count++;
      });
      document.querySelectorAll('[data-directory-group]').forEach(group => {
        group.hidden = ![...group.querySelectorAll('[data-directory-item]')].some(item => !item.hidden);
      });
      document.querySelector('.directory-empty').hidden = count > 0;
      clearButtons[0].hidden = words.length === 0;
      document.getElementById('search-status').textContent = `${count} ${count === 1 ? 'solution' : 'solutions'} to explore.`;
    }
    search.addEventListener('input', filter);
    clearButtons.forEach(button => button.addEventListener('click', () => {search.value = ''; filter(); search.focus();}));
    document.querySelectorAll('a[href$="#industries"],a[href$="#teams"],a[href$="#business-sizes"]').forEach(link => link.addEventListener('click', () => {search.value = ''; filter();}));
  }

  const tablist = document.querySelector('.workflow-tabs');
  if (tablist) {
    const tabs = [...tablist.querySelectorAll('[role=tab]')];
    const panels = [...document.querySelectorAll('[data-workflow-panel]')];
    tablist.hidden = false;
    panels.forEach((panel, i) => {panel.setAttribute('role', 'tabpanel'); panel.setAttribute('aria-labelledby', tabs[i].id); panel.tabIndex = 0;});
    function activate(index, focus = false) {
      tabs.forEach((tab, i) => {tab.setAttribute('aria-selected', String(i === index)); tab.tabIndex = i === index ? 0 : -1; panels[i].hidden = i !== index;});
      if (focus) tabs[index].focus();
    }
    tabs.forEach((tab, i) => {
      tab.addEventListener('click', () => activate(i));
      tab.addEventListener('keydown', event => {
        let index;
        if (event.key === 'ArrowRight') index = (i + 1) % tabs.length;
        if (event.key === 'ArrowLeft') index = (i + tabs.length - 1) % tabs.length;
        if (event.key === 'Home') index = 0;
        if (event.key === 'End') index = tabs.length - 1;
        if (index !== undefined) {event.preventDefault(); activate(index, true);}
      });
    });
    activate(0);
  }

  const form = document.querySelector('[data-pilot-form]');
  if (form) {
    const content = JSON.parse(document.getElementById('pilot-content').textContent);
    const result = form.querySelector('.planner-result');
    const link = form.querySelector('[data-pilot-download]');
    const error = document.getElementById('pilot-error');
    let downloadUrl;
    form.hidden = false;
    function discard() {
      result.hidden = true; error.textContent = ''; link.removeAttribute('href');
      if (downloadUrl) {URL.revokeObjectURL(downloadUrl); downloadUrl = undefined;}
    }
    form.addEventListener('input', discard);
    form.addEventListener('submit', event => {
      event.preventDefault(); discard();
      try {
        const priorities = [...form.querySelectorAll('input[name=priority]:checked')].map(input => input.value);
        const outcome = form.elements.outcome.value.trim();
        const personal = `\nYOUR EVALUATION PRIORITIES\n${priorities.length ? priorities.map(value => '- ' + value).join('\n') : 'Not selected yet. Review the validation checklist with your team.'}\n\nYOUR SUCCESS CRITERIA\n${outcome || 'To be defined with the pilot owner.'}\n\nCreated locally. Nothing has been submitted or booked.\n`;
        downloadUrl = URL.createObjectURL(new Blob([content.brief + personal], {type: 'text/plain;charset=utf-8'}));
        link.href = downloadUrl; result.hidden = false;
      } catch {
        error.textContent = 'Your browser could not create the file. Use “Download the starting brief” and add your notes there.';
      }
    });
    window.addEventListener('pagehide', () => {if (downloadUrl) URL.revokeObjectURL(downloadUrl);});
    window.addEventListener('pageshow', event => {if (event.persisted) discard();});
  }
})();
