(() => {
  'use strict';
  const menuButton = document.querySelector('.enterprise-menu');
  const menu = document.querySelector('#enterprise-links');
  const closeMenu = () => { menu.classList.remove('is-open'); menuButton.setAttribute('aria-expanded', 'false'); menuButton.querySelector('span').textContent = '+'; };
  menuButton.addEventListener('click', () => {
    const open = menuButton.getAttribute('aria-expanded') !== 'true';
    menu.classList.toggle('is-open', open);
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.querySelector('span').textContent = open ? '−' : '+';
  });
  menu.querySelectorAll('a,button:not(.solutions-toggle):not(.platform-toggle)').forEach(element => element.addEventListener('click', closeMenu));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') { closeMenu(); menuButton.focus(); }
  });
  const dialog = document.querySelector('#enterprise-brief-dialog');
  const form = document.querySelector('#enterprise-brief-form');
  const result = document.querySelector('#enterprise-brief-result');
  const download = document.querySelector('#enterprise-download');
  const status = document.querySelector('#enterprise-form-status');
  let opener;
  let downloadUrl;
  document.querySelectorAll('[data-enterprise-brief]').forEach(button => button.addEventListener('click', () => {
    opener = button;
    dialog.showModal();
    document.querySelector('#enterprise-organisation').focus();
  }));
  document.querySelector('.enterprise-dialog-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => opener?.focus());
  dialog.addEventListener('click', event => {
    const rect = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) dialog.close();
  });
  const fields = [
    { name: 'organisation', message: 'Enter your organisation name.' },
    { name: 'size', message: 'Choose a workforce size.' },
    { name: 'scope', message: 'Choose an initial scope.' },
    { name: 'priority', message: 'Describe the main priority for your pilot.' }
  ];
  function clearResult() {
    result.hidden = true;
    status.textContent = '';
    if (downloadUrl) { URL.revokeObjectURL(downloadUrl); downloadUrl = undefined; download.removeAttribute('href'); }
  }
  fields.forEach(({name}) => {
    const field = form.elements.namedItem(name);
    field.addEventListener('input', () => {
      clearResult();
      if (field.value.trim()) { field.removeAttribute('aria-invalid'); document.querySelector(`#enterprise-${name}-error`).textContent = ''; }
    });
  });
  form.addEventListener('submit', event => {
    event.preventDefault();
    clearResult();
    let firstInvalid;
    fields.forEach(({name, message}) => {
      const field = form.elements.namedItem(name);
      const valid = Boolean(field.value.trim());
      document.querySelector(`#enterprise-${name}-error`).textContent = valid ? '' : message;
      if (valid) field.removeAttribute('aria-invalid');
      else { field.setAttribute('aria-invalid', 'true'); firstInvalid ??= field; }
    });
    if (firstInvalid) { status.textContent = 'Please complete the required fields.'; firstInvalid.focus(); return; }
    const values = Object.fromEntries(new FormData(form));
    const documentText = `HIREBREW | PILOT BRIEF\nGood people. Great futures.\n\nPrepared locally on ${new Date().toLocaleDateString('en-GB')}\n\nYOUR STARTING POINT\nOrganisation: ${values.organisation.trim()}\nWorkforce size: ${values.size}\nInitial scope: ${values.scope}\n\nMain priority:\n${values.priority.trim()}\n\nAGREE TOGETHER\nExecutive sponsor: ____________________\nHR / workflow owner: ____________________\nIT / security owner: ____________________\nPrivacy / legal reviewer: ____________________\nPilot cohort and locations: ____________________\nTarget review date: ____________________\n\nMEASURABLE SUCCESS\nBaseline today: ____________________\nTarget outcome: ____________________\nHow it will be measured: ____________________\nWho signs off: ____________________\n\nPROPOSED ROLLOUT\n1. ALIGN: Confirm scope, entities, locations, stakeholders and the systems of record.\n2. VALIDATE: Review data, permissions and integrations. Test critical journeys with sample data.\n3. PILOT: Introduce an approved cohort only after readiness gates are met. Train participants and record issues.\n4. EXPAND: Review measured outcomes and make an explicit go or no-go decision.\n\nBEFORE REAL PEOPLE DATA\n[ ] Verify identity, MFA, recovery and server-side role permissions.\n[ ] Confirm hosting, encryption, subprocessors and cross-border data responsibilities.\n[ ] Test record access, audit history, export, retention and deletion.\n[ ] Validate backup restoration, incident ownership and support escalation.\n[ ] Confirm AI provider data use, human review, source context and evaluation.\n[ ] Validate each external connection, its permissions, mapping, costs and failure handling.\n[ ] Obtain appropriate security, privacy, operational and commercial approvals.\n\nSCOPE BOUNDARIES\nThis website is a product preview, not a production service commitment. Confirm module availability and deployment readiness. Integration categories require scoping and validation. Payroll history does not imply payroll calculation, tax filing or payment execution. Commercial terms and support commitments must be established separately.\n\nPRIVACY\nThis file was generated in your browser. No information was submitted to Hirebrew. Share it only with the intended stakeholders.\n`;
    try {
      downloadUrl = URL.createObjectURL(new Blob([documentText], {type: 'text/plain;charset=utf-8'}));
      download.href = downloadUrl;
      result.querySelector('h3').textContent = 'Your brief is ready.';
      result.querySelector('p').textContent = 'Download it and add your stakeholders, target measures and approval owners. No information has been sent.';
      result.hidden = false;
      status.textContent = 'Your brief is ready. Use Download your brief to save the file. Nothing has been sent.';
      result.focus();
    } catch {
      status.textContent = 'Your browser could not create the file. Please use the rollout template in Buyer resources instead.';
      result.hidden = false;
      result.querySelector('h3').textContent = 'The brief could not be created.';
      result.querySelector('p').textContent = 'Use the downloadable rollout template in Buyer resources instead. Nothing has been sent.';
      download.href = 'assets/resources/enterprise-rollout-brief.txt';
      result.focus();
    }
  });
  window.addEventListener('pagehide', () => { if (downloadUrl) URL.revokeObjectURL(downloadUrl); });
})();
