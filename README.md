# Hirebrew enterprise website and visual identity

Standalone marketing website concept, animated-product-story edition v5, created 11 October 2026. Existing operational portals were not modified. The homepage and buyer journey were restructured after studying the official Deel HR, BambooHR and Lattice sites. Their proprietary copy, logos, media and customer evidence are not reproduced.

## Preview

### Handoff identity refinement (12 October 2026)

The selected Handoff concept is now the website's shared identity: two folded bands with an open channel, a bold outlined wordmark, monochrome/reversed/stacked variants, an optical-size favicon and offset-band patterns. SVGs are self-contained; lettering uses the bundled OFL Bricolage Grotesque at weight 800, optical size 36, with pair-spacing adjustments. This is not a new custom typeface. Matching PNG exports are included in `assets/hirebrew-brand-kit.zip`. Trademark clearance remains pending.

The old identity and kit are preserved outside the website at `../brand-exploration/2026-10-12/previous-lift/`. `build-brand.py` regenerates the SVG assets using Python with `fonttools[woff]` and `brotli`; those are optional authoring tools, not website dependencies. PNG exports must be refreshed from the SVGs after artwork changes. Rebuild the asset ZIP from `assets/` with `zip -qr hirebrew-brand-kit.zip brand brand-tokens.json fonts ASSET-NOTES.txt future-form.webp`. The visual size proof is `review/handoff-proof.html`.

Verified the homepage and brand guide at 1440 px and 390 px, with no horizontal overflow or failed image loads in the inspected views, and no browser errors/warnings. Inspected the symbol at 22/24/32/48 px, dedicated favicon at 16/24/32/48 px and wordmark lockups at 120/148 px. The complete kit downloaded successfully through the brand guide. `npm run check` now includes `check-brand.mjs`: master SVG geometry, safety, outlined lettering, variant colours, PNG dimensions and byte-for-byte kit consistency (27 files). Proof and responsive captures are saved under `review/handoff-*.png`.

### Start the website

Run `npm run dev` in this folder and open http://localhost:4173. No dependencies or build step are required. The preview server binds to loopback only. Use `PORT=4174 npm run dev` to choose another local port.

- `index.html`: marketing website and interactive sample workflows.
- `enterprise-home.css` / `enterprise-home.js`: enterprise homepage styling, accessible navigation, product-family explorer and local handoff preview.
- `enterprise.html`: governance, integration scope, rollout, commercial planning and buyer resources.
- `enterprise.css` / `enterprise.js`: enterprise page and local pilot-brief builder.
- `platform.html`: overview of the six connected Hirebrew products.
- `products/*.html`: dedicated pages for Hire, Onboard, People, Grow, Intelligence and Brew AI. Each includes a tailored value proposition, four capabilities, three use cases, a four-stage workflow, AI context, pilot planner, FAQs and related products/solutions.
- `platform-nav.css` / `platform-nav.js`: shared six-product Platform menu on the homepage, enterprise page and all generated product/solution pages, with mouse, keyboard and mobile support.
- `product-pages.css`: product landing pages and overview styling, extending the solution-page design system.
- `content/products-*.json` / `build-products.mjs`: authored product copy and static page/brief generator. Run `npm run build` after edits; do not edit generated product pages directly.
- `marketing-shell.mjs`: shared metadata, navigation and footer for both page generators.
- `assets/resources/products/`: six product-specific starting briefs, also available without JavaScript.
- `content/demo-products.json` / `content/demo-solutions.json`: 30 authored fictional storyboards, each with four stages and a contrasting scattered-workflow example. Scenarios use sample people, not customers or live records.
- `demo-scenes.mjs`: validates and renders the shared product-story component as static HTML, including a readable no-JavaScript transcript.
- `story-demo.css` / `story-demo.js`: responsive two-column demos, staged transitions, playback and step controls, and reduced-motion support. No animation library or external service is required.
- `build-story-demos.mjs`: updates guarded demo slots on the hand-authored homepage and enterprise page. The two page generators embed their own demos. All 34 customer-facing marketing pages have one demo; brand and research reference documents retain their original purpose.
- `solutions-nav.css` / `solutions-nav.js`: shared three-column Solutions menu, grouped by business size, team and industry. Used on the homepage, enterprise page and solution finder.
- `solutions.html`: searchable directory for 3 business sizes, 5 teams and 16 industries. The original profile hash links continue to resolve to their dedicated pages.
- `solutions/*.html`: 24 independently addressable pages, each with tailored priorities, a four-handoff workflow, relevant capabilities, an illustrative AI use case, pilot scope, FAQs and related solutions.
- `solution-pages.css` / `solutions.js`: responsive page system, keyboard-accessible workflow tabs, directory filtering and local pilot-brief generation. The earlier `solutions.css` is retained for reference but is no longer loaded.
- `content/solutions-*.json` / `build-solutions.mjs`: authored content and dependency-free static generator. Edit the content or template, then run `npm run build` to regenerate the solution pages and briefs. Do not edit generated pages directly.
- `assets/resources/pilots/`: 24 tailored starting briefs, available without JavaScript. The inline planner adds selected priorities and local notes to a separate download.
- `assets/resources/`: downloadable enterprise evaluation checklist and rollout brief.
- `brand.html`: visual identity, logo variants, colour, type and pattern guidance.
- `design-notes.html`: official research sources, design rationale, asset provenance and launch gaps.
- `assets/brand/`: portable outlined SVG logos and derived patterns.
- `assets/brand-tokens.json`: implementation-ready identity tokens.
- `assets/fonts/`: local fonts and their SIL Open Font Licences.
- `assets/future-form.png`: original generated brand artwork; the regional section uses the compressed WebP. Product workflows now lead the hero.

## Functional scope

Accessible product/solutions menus, five product-family tabs, local hero handoffs, role selection, HR-to-candidate state handoffs, candidate replies, sample scorecards, a welcome checklist, scripted AI drafts with editable human review, responsive navigation, accessible dialogs, FAQ disclosure, downloadable buyer resources, and local pilot-brief builders. Dedicated solution pages add 24 tailored brief planners and keyboard-accessible workflow explorers; the directory has live filtering and an empty-result state. Six product pages add 18 practical use cases and six product-specific brief planners. Product demo links select the relevant homepage perspective or overview; they do not imply separate live operational demos. Sample state lives in memory only. Reloading resets it. The hero is a separate illustrative mini-workflow from the role-based tour. There are no API calls, analytics, cookies or third-party runtime dependencies.

The local pilot planner does not submit an enquiry. No AI model, live messaging service, database or operational portal is connected to this marketing concept. Those controls are deliberate and disclosed in the UI. Dedicated solution pages are audience-specific evaluations of the demonstrated workflows, not claims of live industry-specialist systems. Finance as an industry is distinct from Finance teams; Technology covers product-led businesses while IT covers technology service delivery.

The animated stories are explicitly fictional mini-product illustrations inspired by the supplied side-by-side reference, not screenshots of deployed features or measured customer results. Each plays once when at least 20% of its changing workspace is visible, pauses offscreen or in a background tab, and supports Pause, Replay, Back, Next and direct stage selection. Arrow keys, Home and End work on the stage controls. Reduced-motion preference disables autoplay and transitions, retaining manual navigation. Hidden stages reserve layout space without remaining visible or interactive. Manual changes announce the current step; automatic changes do not flood the screen-reader live region. All source copy is escaped before HTML rendering.

## Before public launch

### Static deployment

This directory is the Hirebrew marketing-website repository root. Run `npm run build:deploy` to generate a browser-only `dist/` directory. Vercel uses the included `vercel.json` (Other framework, `dist` output, no install step). Keep `.html` URLs; this is a multi-page static site, not a single-page application. `npm run check` is the pre-release verification suite. Neither the preview server nor private parent-folder documents are included in the deployed files.

Publishing a URL does not activate an HR backend or lead inbox. The fictional-demo disclosures, local-only brief downloads and noindex directives remain intentional for this demo release.

Approve the identity and obtain trademark review; verify every live capability and proof point; connect a real contact destination; review legal/privacy copy; integrate the chosen hosting route/domain; replace noindex only after approval; and validate with intended customers and accessibility testing. The supplied server is for a local preview. Deploy the static files to the chosen production host rather than treating this preview server as production infrastructure.

Craftwork's project-local guidance was installed at `../.agents/skills/craftwork-assets`. Public metadata was consulted. No paid Craftwork asset is included. See `design-notes.html` for the image prompt and source links.

## Verification

`npm run check` checks interaction scripts, generated content, relative resources, page anchors, duplicate IDs, accessible reference targets, outlined logos, token JSON, preview privacy constraints and accessibility stylesheet rules. Coverage includes all 24 solution pages, six product pages, both directories and shared-menu destinations. Navigation unit checks cover idempotent rendering, root/nested URLs, active links, keyboard opening, Escape, outside focus, mutually exclusive menus and mobile focus-to-click transitions.

V2 browser-checked at desktop 1440 px, tablet 768 px and phones 390/320 px:

- Homepage hero and full-page layouts, five product tabs, product and solutions menus; no horizontal overflow in the checked widths.
- Hero handoff states and reset, product-tab Arrow/Home/End navigation, and mobile menu Escape/focus restoration.
- Fixed local-art aspect ratio, narrow-phone headline wrapping and nested-menu Escape behaviour.
- Mouse and arrow-key role selection, candidate advancement and candidate reply reflected in HR.
- Required recommendation validation, scorecard save and onboarding completion.
- Scripted AI prompt selection, editable review and saved status.
- Mobile menu, FAQ disclosure and dialog close/focus behaviour.
- Homepage pilot brief form and actual text-file download.
- Enterprise page, required-field error messages, generated brief and actual download, plus an actual evaluation-checklist download over HTTP.
- No console errors or broken images in the checked page states.
- Existing brand-guide colour copying and SVG downloads were verified in v1; brand assets and guide interaction were preserved in v2.
- Solutions update: desktop three-column menu, stacked mobile groups, ArrowDown entry, Escape focus restoration, coordination with the Platform menu, direct HR/Oil & Gas profile links, all-industry directory and browser-back navigation. No horizontal overflow at 390/320 px in the checked solution views; no browser warnings or errors in the checked states.

This is focused implementation verification, not a formal WCAG conformance audit or a production integration test. The operational backend was intentionally outside the changes.

V3 verification:

- All 24 dedicated pages opened successfully at 1440 px and 390 px; no horizontal overflow, one primary heading, four workflow steps and visible pilot planners. Hero actions remained within the first viewport.
- Desktop full-page Construction and HR layouts and the full-page mobile Startups layout were reviewed; HR, directory and Manufacturing were also checked at narrow widths. The shared menu had no overflow at 320 px.
- Workflow arrow-key selection and focus movement, nested Solutions-menu Escape behavior, active-page links, directory search, empty-result recovery, legacy HR deep-link forwarding and FAQ disclosure were exercised in the browser.
- A Construction pilot brief was actually downloaded and its selected priority and sample success criterion verified. Editing the form hid the stale download until regeneration.
- `npm run check` passed for 29 HTML pages, 1,242 local resources/anchors, 24 authored profiles and 25 menu destinations. No browser warnings or errors were recorded during the dedicated-page route sweep.

V4 verification:

- All six dedicated product pages opened at 1440 px and 390 px with no horizontal overflow, one primary heading, three use cases and four workflow steps. The platform overview was checked at desktop and phone widths.
- Full-page Hire desktop, Brew AI mobile and platform overview layouts were reviewed. Shared Platform navigation was checked at 320 px, including active-page identification and single-column narrow-phone layout.
- Product workflow arrow-key selection/focus, use-case and FAQ disclosure, nested-menu Escape/focus restoration and Platform/Solutions switching in both directions were exercised in the browser. A mobile focus-related layout-shift issue was fixed and regression-tested.
- A Hire pilot brief was downloaded; selected priorities and a sample success criterion were verified in the file. Editing the form hid the stale download.
- Onboard opens the employee perspective; Intelligence opens its selected overview; Brew AI opens the illustrative AI experience. Homepage product-detail links follow the selected product.
- `npm run check` passed for 36 HTML pages, 1,590 local resources/anchors, 24 solutions, six products, 18 use cases, generated briefs and shared navigation.

V5 verification:

- All 34 marketing pages checked at 1440 px and 390 px (68 browser page/viewport checks): no horizontal overflow, one enhanced demo, four frames, exactly one visible frame and available controls.
- Actual Hire and Onboard progression, direct step selection, Home/End focus movement, pause state and stable frame height were checked in the browser. Mobile playback was confirmed to wait until the workspace, not just its introductory copy, entered view.
- The shipped runtime is also exercised with a controlled clock: completion without looping, replay, manual and keyboard controls, focus pause, viewport and document visibility, page lifecycle, reduced motion, missing-observer fallback, invalid-data fallback and idempotent enhancement.
- Generated HTML tests cover all 30 unique storyboards, all 34 destinations, no-JavaScript transcripts, disclosure text, safe HTML/embedded JSON and accessible references. The static-page builder is byte-for-byte idempotent.
- `npm run check` passes for 36 HTML pages and 1,692 local resources/anchors, plus product, solution and animation checks. This remains implementation verification, not a formal accessibility certification.

Browser-review captures are in `review/`. The distribution archive excludes review images and test scratch files. Previous archives are preserved in the project folder; `Hirebrew-Enterprise-Website-v5.zip` includes the animated-story edition.
