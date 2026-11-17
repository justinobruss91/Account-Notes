/* Account Manager (Salesforce, desktop) — Account Notes record tab + guided publishing wizard */
(function () {
  const AN = window.AN;
  const { html, useState, useEffect, useRef } = window.htmPreact;
  const { Icon, StdIcon, Badge, DocIcon, FilePreview } = AN;
  const STEPS = [...AN.CATEGORIES.map((c) => c.name), 'Review & Publish'];

  const isChanged = (s, id) => {
    if (!s.draft) return false;
    const a = s.draft.find((c) => c.id === id), b = s.published.categories.find((c) => c.id === id);
    return JSON.stringify([a.summary, a.details, a.fileIds]) !== JSON.stringify([b.summary, b.details, b.fileIds]);
  };
  const changedIds = (s) => AN.CATEGORIES.map((c) => c.id).filter((id) => isChanged(s, id));

  // ---------- Salesforce shell ----------
  const Shell = ({ children }) => html`
    <div class="an-sf">
      <header class="an-sf__global">
        <span class="an-sf__logo" aria-label="Salesforce"></span>
        <div class="slds-form-element an-sf__search"><div class="slds-form-element__control slds-input-has-icon slds-input-has-icon_left">
          <span class="slds-input__icon slds-input__icon_left an-sf__search-icon"><${Icon} name="search" size="x-small" /></span>
          <input class="slds-input" placeholder="Search..." /></div></div>
        <span class="an-sf__avatar">CD</span>
      </header>
      <div class="slds-context-bar an-sf__context">
        <div class="slds-context-bar__primary"><div class="slds-context-bar__item slds-no-hover">
          <span class="slds-context-bar__icon-action"><${Icon} name="apps" /></span>
          <span class="slds-context-bar__label-action slds-context-bar__app-name"><span class="slds-truncate">Sales</span></span></div></div>
        <nav class="slds-context-bar__secondary"><ul class="slds-grid">${['Home', 'Opportunities', 'Accounts', 'Contacts', 'Reports', 'Dashboards'].map((t) => html`
          <li class="slds-context-bar__item ${t === 'Accounts' ? 'slds-is-active' : ''}"><a href="#" class="slds-context-bar__label-action" onClick=${(e) => e.preventDefault()}><span class="slds-truncate">${t}</span></a></li>`)}</ul></nav>
      </div>
      <main class="an-sf__main">${children}</main>
    </div>`;

  const RecordHeader = ({ account, actions }) => html`
    <div class="slds-page-header slds-page-header_record-home">
      <div class="slds-page-header__row">
        <div class="slds-page-header__col-title"><div class="slds-media">
          <div class="slds-media__figure"><${StdIcon} name="account" /></div>
          <div class="slds-media__body"><div class="slds-page-header__name"><div class="slds-page-header__name-title"><h1>
            <span>Account · HQ</span><span class="slds-page-header__title slds-truncate">${account.hq}</span></h1></div></div></div>
        </div></div>
        <div class="slds-page-header__col-actions"><div class="slds-page-header__controls"><div class="slds-page-header__control">${actions}</div></div></div>
      </div>
      <div class="slds-page-header__row slds-page-header__row_gutters"><div class="slds-page-header__col-details">
        <ul class="slds-page-header__detail-row">${[['Child accounts', `${account.stores.toLocaleString()} stores`], ['Regions', account.regions], ['Account Manager', account.am], ['Type', 'Chain HQ']].map(([k, v]) => html`
          <li class="slds-page-header__detail-block"><div class="slds-text-title slds-truncate">${k}</div><div class="slds-truncate">${v}</div></li>`)}</ul>
      </div></div>
    </div>`;

  // ---------- Record page: Account Notes tab ----------
  const RecordView = ({ s, onEdit, justPublished }) => {
    const cats = s.published.categories;
    const least = cats.reduce((m, c) => (s.reviewed[c.id] < s.reviewed[m.id] ? c : m), cats[0]);
    return html`
      <${RecordHeader} account=${s.account} actions=${html`<ul class="slds-button-group-list">
        <li><button class="slds-button slds-button_neutral">Edit</button></li>
        <li><button class="slds-button slds-button_brand" onClick=${onEdit}>${s.draft ? 'Continue draft' : 'Update Account Notes'}</button></li></ul>`} />
      <article class="slds-card an-sf__card">
        <div class="slds-tabs_default">
          <ul class="slds-tabs_default__nav" role="tablist">${['Related', 'Details', 'Account Notes', 'Activity'].map((t) => html`
            <li class="slds-tabs_default__item ${t === 'Account Notes' ? 'slds-is-active' : ''}" role="presentation"><a class="slds-tabs_default__link" role="tab" href="#" onClick=${(e) => e.preventDefault()}>${t}</a></li>`)}</ul>
          <div class="slds-tabs_default__content slds-show slds-p-horizontal_medium">
            <div class="slds-grid slds-grid_vertical-align-center slds-m-bottom_x-small">
              <h2 class="slds-text-heading_medium slds-grow">Account Notes</h2>
              <span class="an-meta">${justPublished ? 'Published just now' : 'Last published ' + AN.fmtDate(s.published.publishedAt)} · reaches ${(s.published.audience ? s.published.audience.stores : s.account.stores).toLocaleString()} stores${s.published.audience && s.published.audience.stores < s.account.stores ? ` (${s.published.audience.label})` : ''}</span>
            </div>
            <p class="an-meta slds-m-bottom_small">What Territory Managers see in Apex for every store under this HQ. “Reviewed” is logged automatically when a TM opens a category.</p>
            ${s.draft ? html`<div class="slds-scoped-notification slds-media slds-media_center an-draft-note" role="status">
              <div class="slds-media__figure"><${Icon} name="edit" size="x-small" /></div>
              <div class="slds-media__body">You have unpublished changes in ${changedIds(s).length} ${changedIds(s).length === 1 ? 'category' : 'categories'}. TMs still see the published version.</div></div>` : null}
            <table class="slds-table slds-table_cell-buffer slds-table_bordered an-table">
              <thead><tr class="slds-line-height_reset">${['Category', 'TM-facing summary', 'Files', 'Updated', 'Reviewed by TMs'].map((h) => html`<th scope="col"><div class="slds-truncate">${h}</div></th>`)}</tr></thead>
              <tbody>${cats.map((c) => {
                const fresh = justPublished && s.updatedIds.includes(c.id);
                return html`<tr class=${fresh ? 'an-row-fresh' : ''}>
                  <th scope="row"><div class="slds-truncate"><b>${AN.catMeta(c.id).name}</b></div></th>
                  <td><div class="slds-truncate an-table__sum">${c.summary}</div></td>
                  <td>${c.fileIds.length}</td>
                  <td>${fresh ? 'Just now' : AN.fmtDate(c.updatedAt)}</td>
                  <td><${AN.ProgressBar} value=${s.reviewed[c.id] || 0} /></td></tr>`;
              })}</tbody>
            </table>
            <div class="slds-scoped-notification slds-media slds-media_center slds-m-top_medium an-insight" role="status">
              <div class="slds-media__figure"><${Icon} name="info" size="x-small" /></div>
              <div class="slds-media__body">${justPublished
                ? (s.updatedIds.length
                  ? `TMs with visits today will see an “Updated” badge on ${s.updatedIds.map((id) => AN.catMeta(id).name).join(' and ')}. Reviewed % refreshes as they open notes.`
                  : 'Current notes were re-sent unchanged, so no “Updated” badges were added for TMs.')
                : `Lowest review rate: ${AN.catMeta(least.id).name} (${Math.round(s.reviewed[least.id] * 100)}%). Most-opened file this month: POG_VusePro_VeloMax_Sept26.pdf.`}</div></div>
          </div>
        </div>
      </article>`;
  };

  // ---------- Wizard pieces ----------
  const Path = ({ step, setStep, s }) => html`
    <div class="slds-path an-path"><div class="slds-grid slds-path__track"><div class="slds-grid slds-path__scroller-container"><div class="slds-path__scroller"><div class="slds-path__scroller_inner">
      <ul class="slds-path__nav" role="listbox" aria-orientation="horizontal">${STEPS.map((name, i) => {
        const st = i < step ? 'slds-is-complete' : i === step ? 'slds-is-current slds-is-active' : 'slds-is-incomplete';
        const dirty = i < 6 && isChanged(s, AN.CATEGORIES[i].id);
        return html`<li class="slds-path__item ${st}" role="presentation">
          <a aria-selected=${i === step} class="slds-path__link" href="#" role="option" onClick=${(e) => { e.preventDefault(); setStep(i); }}>
            <span class="slds-path__stage"><${Icon} name="check" size="x-small" /></span>
            <span class="slds-path__title">${name}${dirty ? ' •' : ''}</span></a></li>`;
      })}</ul></div></div></div></div></div>`;

  const RichEditor = ({ cat, files, onChange }) => {
    const ref = useRef();
    useEffect(() => { ref.current.innerHTML = cat.details || ''; }, [cat.id]);
    const cmd = (c, v) => (e) => { e.preventDefault(); ref.current.focus(); document.execCommand(c, false, v); onChange(ref.current.innerHTML); };
    const linkFile = (e) => {
      const f = files[e.target.value]; e.target.value = '';
      if (!f) return;
      ref.current.focus();
      document.execCommand('insertHTML', false, `<span class="an-chip" data-file-id="${f.id}" contenteditable="false">${f.name}</span>&nbsp;`);
      onChange(ref.current.innerHTML);
    };
    const tools = [['richtextbulletedlist', 'insertUnorderedList', 'Bulleted list'], ['richtextnumberedlist', 'insertOrderedList', 'Numbered list']];
    return html`<div class="slds-rich-text-editor slds-grid slds-grid_vertical slds-nowrap an-rte">
      <div role="toolbar" class="slds-rich-text-editor__toolbar">
        <ul class="slds-button-group-list"><li><button class="slds-button slds-button_neutral an-rte__h" onMouseDown=${cmd('formatBlock', 'h3')}>Heading</button></li>
          <li><button class="slds-button slds-button_neutral an-rte__h" onMouseDown=${cmd('formatBlock', 'p')}>Text</button></li></ul>
        <ul class="slds-button-group-list">${[['bold', 'bold', 'Bold'], ['italic', 'italic', 'Italic'], ['underline', 'underline', 'Underline']].map(([i, c, t]) => html`
          <li><button class="slds-button slds-button_icon slds-button_icon-border-filled" title=${t} onMouseDown=${cmd(c)}><${Icon} name=${i} size="x-small" /></button></li>`)}</ul>
        <ul class="slds-button-group-list">${tools.map(([i, c, t]) => html`
          <li><button class="slds-button slds-button_icon slds-button_icon-border-filled" title=${t} onMouseDown=${cmd(c)}><${Icon} name=${i} size="x-small" /></button></li>`)}</ul>
        <div class="slds-select_container an-rte__link"><select class="slds-select" onChange=${linkFile} aria-label="Link a file">
          <option value="">Link a file…</option>${Object.values(files).map((f) => html`<option value=${f.id}>${f.name}</option>`)}</select></div>
      </div>
      <div class="slds-rich-text-editor__textarea slds-grid">
        <div ref=${ref} class="slds-rich-text-area__content slds-grow an-rich an-rte__area" contenteditable="true" aria-label="Details" onInput=${(e) => onChange(e.currentTarget.innerHTML)}></div>
      </div>
    </div>`;
  };

  const guessKind = (name) => /pog|planogram|placement/i.test(name) ? 'pog' : /\.(xlsx?|csv)$/i.test(name) ? 'sheet' : /\.(png|jpe?g|gif)$/i.test(name) ? 'pos' : 'deck';
  const guessType = (name) => /\.pdf$/i.test(name) ? 'pdf' : /\.(xlsx?|csv)$/i.test(name) ? 'excel' : /\.(png|jpe?g|gif|webp)$/i.test(name) ? 'image' : 'ppt';
  const fmtSize = (b) => (b > 1e6 ? (b / 1e6).toFixed(1) + ' MB' : Math.max(1, Math.round(b / 1e3)) + ' KB');
  const REGIONS = [['Midwest', 812], ['South', 472]];
  const SCOPES = ['All stores', 'Midwest Region', 'South Region', 'KS, MI, OH', 'CEFCO outlets', 'Participating states'];

  const Dropzone = ({ cat, s, onFilesChange }) => {
    const [over, setOver] = useState(false);
    const meta = AN.catMeta(cat.id);
    const add = (list) => {
      const added = Array.from(list).map((file) => {
        const id = AN.uid(), url = URL.createObjectURL(file);
        AN.rememberUrl(id, url);
        return { id, name: file.name, type: guessType(file.name), kind: guessKind(file.name), size: fmtSize(file.size), source: "Casey's HQ", category: cat.id, scope: 'All stores', url };
      });
      AN.store.set((st) => { added.forEach((f) => (st.files[f.id] = f)); st.draft.find((c) => c.id === cat.id).fileIds.push(...added.map((f) => f.id)); return st; });
    };
    const files = cat.fileIds.map((id) => s.files[id]).filter(Boolean);
    return html`<div class="slds-form-element">
      <span class="slds-form-element__label an-field-label">Files for ${meta.name}</span>
      <div class="slds-form-element__control"><div class="slds-file-selector slds-file-selector_files an-drop">
        <div class="slds-file-selector__dropzone ${over ? 'slds-has-drag-over' : ''}"
          onDragOver=${(e) => { e.preventDefault(); setOver(true); }} onDragLeave=${() => setOver(false)}
          onDrop=${(e) => { e.preventDefault(); setOver(false); add(e.dataTransfer.files); }}>
          <input type="file" multiple class="slds-file-selector__input slds-assistive-text" id=${'up-' + cat.id} onChange=${(e) => { add(e.target.files); e.target.value = ''; }} />
          <label class="slds-file-selector__body" for=${'up-' + cat.id}>
            <span class="slds-file-selector__button slds-button slds-button_neutral"><${Icon} name="upload" size="x-small" cls="slds-m-right_x-small" />Upload files</span>
            <span class="slds-file-selector__text">${over ? `Drop to add to ${meta.name}` : `or drop files — they'll show under “${meta.name}” in Apex`}</span>
          </label>
        </div></div></div>
      <ul class="an-filelist">${files.map((f) => html`
        <li class="an-filelist__row">
          <${DocIcon} type=${f.type} size="small" />
          <div class="slds-grow slds-truncate"><div class="slds-truncate"><b>${f.name}</b></div><div class="an-meta">${f.size} · ${f.source}</div></div>
          <div class="slds-select_container an-scope"><select class="slds-select" aria-label="Applies to" value=${f.scope}
            onChange=${(e) => AN.store.set((st) => { st.files[f.id].scope = e.target.value; return st; })}>
            ${[...new Set([f.scope, ...SCOPES])].map((o) => html`<option value=${o}>Applies to: ${o}</option>`)}</select></div>
          <button class="slds-button slds-button_icon slds-button_icon-border-filled" title="Remove from category"
            onClick=${() => AN.store.set((st) => { const c = st.draft.find((x) => x.id === cat.id); c.fileIds = c.fileIds.filter((x) => x !== f.id); return st; })}>
            <${Icon} name="delete" size="x-small" /></button>
        </li>`)}</ul>
    </div>`;
  };

  const checksFor = (cat) => {
    const out = [];
    const len = (cat.summary || '').length;
    out.push(len === 0 ? [false, 'Add a summary — it is the first thing TMs read'] : len > AN.SUMMARY_MAX ? [false, `Summary is ${len - AN.SUMMARY_MAX} characters too long`] : [true, `Summary is under ${AN.SUMMARY_MAX} characters`]);
    out.push(cat.fileIds.length ? [true, `${cat.fileIds.length} file${cat.fileIds.length > 1 ? 's' : ''} linked to this category`] : [null, 'No files — fine if none apply']);
    if (cat.fileIds.length) out.push(/data-file-id/.test(cat.details || '') ? [true, 'A file is linked inside the text'] : [null, 'Tip: link a file in the text so TMs know when to open it']);
    if (/DM is out|\bTeams\b|email/i.test(cat.details || '')) out.push([false, 'Points TMs to another channel — attach the file here instead']);
    return out;
  };
  const Check = ([ok, text]) => html`<li class=${ok === true ? 'an-ok' : ok === false ? 'an-warn' : 'an-tip'}><${Icon} name=${ok === true ? 'success' : ok === false ? 'warning' : 'info'} size="x-small" /> ${text}</li>`;

  // Live iPad preview of what TMs will see
  const LivePreview = ({ s, step, setStep }) => {
    const [file, setFile] = useState(null);
    const overlay = file ? html`<${FilePreview} file=${file} onClose=${() => setFile(null)} />` : null;
    const chg = changedIds(s);
    return html`<aside class="slds-card an-live">
      <div class="slds-grid slds-grid_vertical-align-center slds-m-bottom_small">
        <h3 class="slds-text-heading_small slds-grow"><b>Live iPad preview</b></h3><${Badge} tone="success">● Live</${Badge}></div>
      <${AN.Ipad} maxWidth=${460}>
        ${step < 6
          ? html`<${AN.ApexChrome} title="Account Notes" overlay=${overlay}><${AN.AccountNotesView} isPreview cats=${s.draft} files=${s.files} account=${s.account}
              selected=${AN.CATEGORIES[step].id} onSelect=${(id) => setStep(AN.CATEGORIES.findIndex((c) => c.id === id))} onOpenFile=${setFile} updatedIds=${chg} /></${AN.ApexChrome}>`
          : html`<${AN.ApexChrome} title="PreVisit Dashboard"><${AN.DashboardBody} s=${s} cats=${s.draft} updatedIds=${chg} myReviewed=${{}} onOpen=${(id) => setStep(AN.CATEGORIES.findIndex((c) => c.id === id))} /></${AN.ApexChrome}>`}
      </${AN.Ipad}>
      <p class="an-meta slds-m-vertical_small">${step < 6 ? 'Exactly what Territory Managers see in Apex — before their visit starts. Tap a category or file to try it.' : '“Updated” badges appear on the categories you changed.'}</p>
      ${step < 6 ? html`<div class="an-label">Quality checks</div><ul class="an-checks">${checksFor(s.draft[step]).map(Check)}</ul>` : null}
    </aside>`;
  };

  const ReviewStep = ({ s, setStep, onPublish }) => {
    const chg = changedIds(s);
    const [aud, setAud] = useState('all');
    const [opts, setOpts] = useState({ notify: true, track: true, email: false });
    const [regions, setRegions] = useState({ Midwest: true, South: false });
    const [confirm, setConfirm] = useState(false);
    const picked = REGIONS.filter(([r]) => regions[r]);
    const audience = aud === 'all'
      ? { label: `All child accounts`, stores: s.account.stores }
      : { label: picked.map(([r]) => r + ' Region').join(' + ') || 'No regions selected', stores: picked.reduce((n, [, c]) => n + c, 0) };
    const canPublish = audience.stores > 0;
    const issues = s.draft.flatMap((c) => checksFor(c).filter(([ok]) => ok === false).map(([, t]) => `${AN.catMeta(c.id).name}: ${t}`));
    return html`<div class="an-editor">
      <div><div class="an-step">Step 7 of 7</div><h2 class="an-h2">Review & Publish</h2>
        <p class="an-meta">Check each category, choose who receives it, then publish once. Apex updates for every TM automatically.</p></div>
      <ul class="an-review">${s.draft.map((c, i) => {
        const bad = checksFor(c).some(([ok]) => ok === false);
        return html`<li class="an-review__row">
          <span class=${bad ? 'an-warn' : 'an-ok'}><${Icon} name=${bad ? 'warning' : 'success'} size="x-small" /></span>
          <div class="slds-grow slds-truncate"><b>${AN.catMeta(c.id).name}</b><div class="an-meta slds-truncate">${c.summary || '—'}</div></div>
          ${chg.includes(c.id) ? html`<${Badge} tone="info">Changed</${Badge}>` : null}
          <span class="an-meta">${c.fileIds.length} ${c.fileIds.length === 1 ? 'file' : 'files'}</span>
          <button class="slds-button" onClick=${() => setStep(i)}>Edit</button></li>`;
      })}</ul>
      <fieldset class="slds-form-element"><legend class="slds-form-element__legend slds-form-element__label an-field-label">Who receives this</legend>
        <div class="slds-form-element__control an-audience">${[['all', `All child accounts (${s.account.stores.toLocaleString()} stores)`, 'HQ → Midwest, South regions → stores. Store-level notes are kept and shown underneath.'], ['regions', 'Selected regions only', 'Choose regions or states']].map(([v, l, d]) => html`
          <label class="an-audience__opt ${aud === v ? 'is-on' : ''}"><span class="slds-radio"><input type="radio" name="aud" checked=${aud === v} onChange=${() => setAud(v)} /><span class="slds-radio__label"><span class="slds-radio_faux"></span></span></span>
            <span><b>${l}</b><span class="an-meta" style="display:block">${d}</span></span></label>`)}
          ${aud === 'regions' ? html`<div class="an-regions">${REGIONS.map(([r, c]) => html`
            <div class="slds-checkbox"><input type="checkbox" id=${'r-' + r} checked=${!!regions[r]} onChange=${() => setRegions({ ...regions, [r]: !regions[r] })} />
              <label class="slds-checkbox__label" for=${'r-' + r}><span class="slds-checkbox_faux"></span><span class="slds-form-element__label">${r} Region · ${c.toLocaleString()} stores</span></label></div>`)}</div>` : null}
        </div></fieldset>
      <div class="an-opts">${[['notify', 'Notify TMs in Apex (shows “Updated” on changed categories)'], ['track', 'Track reviews (log when a TM opens a category or file)'], ['email', 'Also email this summary to DMs']].map(([k, l]) => html`
        <div class="slds-checkbox"><input type="checkbox" id=${'o-' + k} checked=${opts[k]} onChange=${() => setOpts({ ...opts, [k]: !opts[k] })} />
          <label class="slds-checkbox__label" for=${'o-' + k}><span class="slds-checkbox_faux"></span><span class="slds-form-element__label">${l}</span></label></div>`)}</div>
      ${issues.length ? html`<div class="slds-scoped-notification slds-media slds-media_center an-draft-note"><div class="slds-media__figure"><${Icon} name="warning" size="x-small" /></div><div class="slds-media__body">${issues.length} check${issues.length > 1 ? 's' : ''} to look at: ${issues[0]}${issues.length > 1 ? '…' : ''}</div></div>` : null}
      <div class="an-footer">
        <span class="an-meta slds-grow">${chg.length ? `${chg.length} ${chg.length === 1 ? 'category' : 'categories'} changed` : 'No edits yet — publishing re-sends the current notes.'}</span>
        <button class="slds-button slds-button_neutral" onClick=${() => setStep(5)}>Back</button>
        <button class="slds-button slds-button_brand" disabled=${!canPublish} title=${canPublish ? '' : 'Select at least one region'} onClick=${() => setConfirm(true)}>Preview & publish</button>
      </div>
      ${confirm ? html`<${ConfirmPublish} s=${s} chg=${chg} audience=${audience} opts=${opts} issues=${issues}
        onCancel=${() => setConfirm(false)} onPublish=${() => { setConfirm(false); onPublish(chg, audience); }} />` : null}
    </div>`;
  };

  // Final check: browse exactly what TMs will get, then publish for real.
  const ConfirmPublish = ({ s, chg, audience, opts, issues, onCancel, onPublish }) => {
    const [cat, setCat] = useState(null); // null = dashboard
    const [file, setFile] = useState(null);
    const overlay = file ? html`<${FilePreview} file=${file} onClose=${() => setFile(null)} />` : null;
    const files = s.draft.reduce((n, c) => n + c.fileIds.length, 0);
    useEffect(() => { const k = (e) => e.key === 'Escape' && onCancel(); addEventListener('keydown', k); return () => removeEventListener('keydown', k); }, []);
    return html`<div>
      <section role="dialog" aria-modal="true" aria-labelledby="confirm-title" class="slds-modal slds-fade-in-open slds-modal_large an-confirm">
        <div class="slds-modal__container">
          <button class="slds-button slds-button_icon slds-modal__close slds-button_icon-inverse" title="Close" onClick=${onCancel}><${Icon} name="close" /></button>
          <div class="slds-modal__header"><h1 id="confirm-title" class="slds-modal__title slds-hyphenate">Review before publishing</h1>
            <p class="slds-m-top_x-small an-meta">This is exactly what Territory Managers will see. Tap through it, then publish.</p></div>
          <div class="slds-modal__content an-confirm__body">
            <div class="an-confirm__summary">
              <div><div class="an-label">Sending to</div>
                <div class="an-confirm__big">${audience.stores.toLocaleString()} stores</div>
                <div class="an-meta">${audience.label} · from ${s.account.hq}</div></div>
              <div><div class="an-label">What changes for TMs</div>
                <ul class="an-confirm__list">${s.draft.map((c) => html`
                  <li class=${cat === c.id ? 'is-on' : ''}><button class="an-confirm__cat" onClick=${() => setCat(c.id)}>
                    <span class="slds-grow">${AN.catMeta(c.id).name}</span>
                    ${chg.includes(c.id) ? html`<${Badge} tone="info">Updated</${Badge}>` : html`<span class="an-meta">No change</span>`}
                  </button></li>`)}</ul>
                <button class="slds-button slds-m-top_x-small" onClick=${() => setCat(null)}>View dashboard</button></div>
              <div><div class="an-label">Delivery</div>
                <ul class="an-checks">
                  <li class=${opts.notify ? 'an-ok' : 'an-tip'}><${Icon} name=${opts.notify ? 'success' : 'info'} size="x-small" /> ${opts.notify ? 'TMs notified in Apex' : 'No Apex notification'}</li>
                  <li class=${opts.track ? 'an-ok' : 'an-tip'}><${Icon} name=${opts.track ? 'success' : 'info'} size="x-small" /> ${opts.track ? 'Review tracking on' : 'Review tracking off'}</li>
                  <li class="an-tip"><${Icon} name="attach" size="x-small" /> ${files} files across 6 categories</li>
                  ${opts.email ? html`<li class="an-tip"><${Icon} name="email" size="x-small" /> Summary emailed to DMs</li>` : null}
                  ${issues.map((t) => html`<li class="an-warn"><${Icon} name="warning" size="x-small" /> ${t}</li>`)}
                </ul></div>
            </div>
            <div class="an-confirm__device">
              <${AN.Ipad} maxWidth=${760}>
                ${cat
                  ? html`<${AN.ApexChrome} title="Account Notes" onBack=${() => setCat(null)} overlay=${overlay}><${AN.AccountNotesView} cats=${s.draft} files=${s.files} account=${s.account}
                      selected=${cat} onSelect=${setCat} onOpenFile=${setFile} updatedIds=${chg} /></${AN.ApexChrome}>`
                  : html`<${AN.ApexChrome} title="PreVisit Dashboard" overlay=${overlay}><${AN.DashboardBody} s=${s} cats=${s.draft} updatedIds=${chg} myReviewed=${{}} onOpen=${setCat} /></${AN.ApexChrome}>`}
              </${AN.Ipad}>
            </div>
          </div>
          <div class="slds-modal__footer">
            <button class="slds-button slds-button_neutral" onClick=${onCancel}>Back to editing</button>
            <button class="slds-button slds-button_brand" onClick=${onPublish}>Publish to ${audience.stores.toLocaleString()} stores</button>
          </div>
        </div>
      </section>
      <div class="slds-backdrop slds-backdrop_open" role="presentation"></div>
    </div>`;
  };

  const CategoryStep = ({ s, step, setStep, onExit, onToast }) => {
    const cat = s.draft[step];
    const meta = AN.catMeta(cat.id);
    const update = (patch) => AN.store.set((st) => { Object.assign(st.draft[step], patch); return st; });
    const len = (cat.summary || '').length;
    return html`<div class="an-editor">
      <div><div class="an-step">Step ${step + 1} of 7</div><h2 class="an-h2">${meta.name}</h2><p class="an-meta">${meta.prompt}</p></div>
      <div class="slds-form-element ${len > AN.SUMMARY_MAX ? 'slds-has-error' : ''}">
        <div class="slds-grid"><label class="slds-form-element__label an-field-label slds-grow" for="sum"><abbr class="slds-required" title="required">* </abbr>${meta.summaryLabel}</label>
          <span class="an-meta">${len} / ${AN.SUMMARY_MAX}</span></div>
        <div class="slds-form-element__control"><textarea id="sum" class="slds-textarea" rows="2" value=${cat.summary} onInput=${(e) => update({ summary: e.target.value })}></textarea></div>
        ${len > AN.SUMMARY_MAX ? html`<div class="slds-form-element__help">Keep it short — TMs see this line on the dashboard.</div>` : null}
      </div>
      <div class="slds-form-element"><span class="slds-form-element__label an-field-label">Details</span>
        <${RichEditor} cat=${cat} files=${s.files} onChange=${(h) => update({ details: h })} /></div>
      <${Dropzone} cat=${cat} s=${s} />
      <div class="an-footer">
        <span class="slds-grow"></span>
        <button class="slds-button slds-button_neutral" onClick=${() => (step ? setStep(step - 1) : onExit())}>${step ? 'Back' : 'Cancel'}</button>
        <button class="slds-button slds-button_neutral" onClick=${() => onToast({ title: 'Draft saved', body: 'TMs still see the published version.', tone: 'info' })}>Save draft</button>
        <button class="slds-button slds-button_brand" onClick=${() => setStep(step + 1)}>Next: ${STEPS[step + 1]}</button>
      </div>
    </div>`;
  };

  const Wizard = ({ s, step, setStep, onExit, onPublish, onToast }) => html`
    <article class="slds-card an-sf__card an-wizard">
      <div class="an-wizard__top">
        <div class="slds-grid slds-grid_vertical-align-center slds-m-bottom_small">
          <h2 class="slds-text-heading_medium slds-grow"><b>Account Notes — Guided Publishing</b></h2>
          <span class="an-meta slds-m-right_small">Draft autosaves · TMs see changes only after you publish</span>
          <button class="slds-button slds-button_neutral" onClick=${onExit}>Exit</button>
        </div>
        <${Path} step=${step} setStep=${setStep} s=${s} />
      </div>
      <div class="an-wizard__body">
        ${step < 6 ? html`<${CategoryStep} key=${step} s=${s} step=${step} setStep=${setStep} onExit=${onExit} onToast=${onToast} />` : html`<${ReviewStep} s=${s} setStep=${setStep} onPublish=${onPublish} />`}
        <${LivePreview} s=${s} step=${step} setStep=${setStep} />
      </div>
    </article>`;

  // ---------- Experience 3 ----------
  AN.AmApp = ({ onToast }) => {
    const s = AN.useStore();
    const [route, setRoute] = useState({ name: 'record' });
    const [step, setStep] = useState(0);
    const startEdit = () => {
      if (!s.draft) AN.store.set((st) => { st.draft = AN.clone(st.published.categories); return st; });
      setRoute({ name: 'wizard' });
    };
    const publish = (chg, audience) => {
      const n = audience.stores;
      const today = AN.today();
      AN.store.set((st) => {
        st.draft.forEach((c) => { if (chg.includes(c.id)) c.updatedAt = today; });
        st.published = { categories: st.draft, publishedAt: today, audience };
        st.draft = null; st.updatedIds = chg;
        chg.forEach((id) => { st.reviewed[id] = 0; delete st.myReviewed[id]; });
        return st;
      });
      setRoute({ name: 'record', justPublished: true }); setStep(0);
      onToast({ title: `Account Notes published to ${n.toLocaleString()} stores`, body: `${audience.label}. Switch to “TM: Updated Account Notes” to see it.` });
    };
    useEffect(() => { if (route.name === 'wizard' && !s.draft) setRoute({ name: 'record' }); }, [s.draft]);
    return html`<${Shell}>
      ${route.name === 'wizard' && s.draft
        ? html`<${Wizard} s=${s} step=${step} setStep=${setStep} onExit=${() => setRoute({ name: 'record' })} onPublish=${publish} onToast=${onToast} />`
        : html`<${RecordView} s=${s} onEdit=${startEdit} justPublished=${route.justPublished} />`}
    </${Shell}>`;
  };
})();
