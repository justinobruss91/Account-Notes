# Account Notes
An exploration of Apex Account Notes directions.

## Concept prototype

A clickable HTML prototype of the Account Notes concepts from Figma (file *005 – Account Notes*), for walking coworkers through them.

| # | Experience | Who | Figma source |
|---|---|---|---|
| 1 | **Enhancement: Related on Dashboard** — HQ/regional files on the Visit Dashboard, with an in-app preview | TM · Apex iPad | Quick Wins page |
| 2 | **TM: Updated Account Notes** — Hot Topic + 5 Ps, summaries, files by category, opened before the visit, "reviewed" logging | TM · Apex iPad | Future – Concepts |
| 3 | **AM: Guided Publishing** — HQ record tab, 6-step wizard + Review & Publish, live iPad preview, reviewed % | AM · Salesforce | AM Wizard – Salesforce |

The experiences share one data store: what an AM publishes in **3** shows up in **2** (with "Updated" badges), and TMs opening categories in **2** moves the reviewed % in **3**. Use **Reset demo** (top right) to return to the seed data.

## Run it

- **Easiest:** double-click `index.html` (it needs internet access for the CDN).
- **Local server:** `powershell -ExecutionPolicy Bypass -File serve.ps1`, then open http://localhost:5173. Deep links: `#quick`, `#tm`, `#am`.

There is no build step: Preact + [htm](https://github.com/developit/htm) load from jsDelivr as plain scripts.

## Design system: SLDS 2

- Blueprints and icons come from `@salesforce-ux/design-system@2.264.3`. That release ships the **SLDS 2 global styling hooks** (`--slds-g-color-*`, `--slds-g-spacing-*`, `--slds-g-radius-border-*`, `--slds-g-shadow-*`, `--slds-g-font-scale-*`).
- SLDS blueprints used: page header (record home), context bar, tabs, cards, data table, path, rich text editor, file selector, vertical navigation, badges, progress bar, radio, checkbox, scoped notification, toast.
- `styles/app.css` uses **only `--slds-g-*` hooks** for color, spacing, radius, shadow and type. Raw values appear only for the iPad device geometry and the mock file art. So the CSS can move to LWC/SLDS 2 as-is.

## Code map (one file per area, roughly one LWC per component)

```
index.html        loads SLDS CSS, Preact/htm, then the scripts below
src/data.js       seed content, categories, shared store (localStorage)
src/ui.js         Icon, FileTile, FilePreview, Ipad frame, Toast, ProgressBar
src/tm.js         Apex chrome, short-term dashboard, AccountNotesView, updated TM flow
src/am.js         Salesforce shell, record Account Notes tab, wizard steps, review & publish
src/app.js        prototype shell + experience switcher
styles/app.css    custom layer on SLDS 2 hooks
```

Likely LWC split later: `accountNotesView` (shared by Apex and the AM live preview), `accountNotesWizard`, `accountNotesCategoryStep`, `accountNotesFileDropzone`, `accountNotesRecordTab`, `relatedFilesStrip`.

## Notes

- File previews are generated mock art. Files you upload in the wizard are real: images and PDFs preview in-app until the page reloads.
- Content comes from the Casey's example in the Figma file. Store numbers, store counts and reviewed % are made up.
