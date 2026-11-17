/* Territory Manager (Apex, iPad) experiences */
(function () {
  const AN = window.AN;
  const { html, useState } = window.htmPreact;
  const { Icon, StdIcon, Badge, FileTile, FilePreview } = AN;

  // ---------- Apex chrome (iOS shell around SLDS content) ----------
  AN.ApexChrome = ({ title = 'Account Notes', onBack, children, footer, overlay }) => html`
    <div class="an-apex">
      <div class="an-apex__status"><span>11:34 AM  Mon Nov 17</span><span>100% ▮</span></div>
      <div class="an-apex__toolbar">
        <button class="an-apex__round" onClick=${onBack} aria-label="Back"><${Icon} name="back" /></button>
        <div class="an-apex__segments">${['Home', 'Maps Mobile', 'Account Search', 'Menu'].map((t, i) => html`<span class=${i === 0 ? 'is-active' : ''}>${t}</span>`)}<${Icon} name="search" size="x-small" /></div>
        <div class="an-apex__actions"><span class="an-apex__round"><${Icon} name="share" /></span><span class="an-apex__round"><${Icon} name="notification" /></span></div>
      </div>
      <div class="an-apex__title">${title}</div>
      <div class="an-apex__content">${children}</div>
      ${footer ? html`<div class="an-apex__rail">${footer}</div>` : null}
      ${overlay}
    </div>`;

  const AccountHeader = ({ account }) => html`
    <div class="an-acct">
      <${StdIcon} name="account" size="large" />
      <div class="slds-grow"><a class="an-acct__name">${account.store}</a><div class="an-meta">${account.address}</div></div>
      <div class="an-acct__stats">
        ${[['retail_execution', 'Store Care'], ['chart', 'Wide Outlet'], ['knowledge_base', 'Competitive Intel']].map(([i, l]) => html`<span><${Icon} name=${i} /><small>${l}</small></span>`)}
        <span class="an-acct__ring">0 of 3<small>Visits complete</small></span>
      </div>
    </div>`;

  const Section = ({ icon, title, badge, meta, open, onToggle, children, highlight }) => html`
    <section class="an-section ${highlight ? 'an-section_new' : ''}">
      <button class="an-section__head" onClick=${onToggle} aria-expanded=${!!open}>
        <${Icon} name=${icon} size="small" cls="an-section__icon" />
        <span class="an-section__title">${title}</span>
        ${badge}
        ${meta ? html`<span class="an-meta">${meta}</span>` : null}
        <span class="slds-col_bump-left"><${Icon} name=${open ? 'chevronup' : 'chevrondown'} /></span>
      </button>
      ${open ? html`<div class="an-section__body">${children}</div>` : null}
    </section>`;

  const StartVisit = ({ onClick }) => html`<button class="slds-button slds-button_brand an-pill-btn" onClick=${onClick}>Start Visit Now</button>`;

  // Split plain note text into text + inline file links (first match of each phrase).
  const linkify = (text, links = [], files, onOpen) => {
    const hits = links
      .map(([phrase, id]) => ({ phrase, file: files[id], at: text.indexOf(phrase) }))
      .filter((h) => h.file && h.at >= 0)
      .sort((a, b) => a.at - b.at);
    const out = [];
    let i = 0;
    hits.forEach((h) => {
      if (h.at < i) return; // overlapping phrase
      out.push(text.slice(i, h.at));
      out.push(html`<button class="an-inline-link" title=${'Open ' + h.file.name} onClick=${() => onOpen(h.file)}>
        <${AN.DocIcon} type=${h.file.type} size="x-small" />${h.phrase}</button>`);
      i = h.at + h.phrase.length;
    });
    out.push(text.slice(i));
    return out;
  };

  // ---------- Experience 1: short-term — Related files on the dashboard ----------
  AN.ShortTermDashboard = ({ onToast }) => {
    const s = AN.useStore();
    const [open, setOpen] = useState({ notes: true, related: true });
    const [legacy, setLegacy] = useState(null);
    const [file, setFile] = useState(null);
    const [filter, setFilter] = useState('All');
    const files = Object.values(s.files);
    const sources = ['All', ...Array.from(new Set(files.map((f) => f.source)))];
    const shown = files.filter((f) => filter === 'All' || f.source === filter);
    const t = (k) => setOpen({ ...open, [k]: !open[k] });

    const overlay = file
      ? html`<${FilePreview} file=${file} onClose=${() => setFile(null)} />`
      : legacy
      ? html`<div class="an-overlay" onClick=${() => setLegacy(null)}>
          <section class="an-preview an-legacy" onClick=${(e) => e.stopPropagation()}>
            <header class="an-preview__header"><h2 class="an-preview__title slds-grow">${AN.catMeta(legacy).name}</h2>
              <button class="slds-button slds-button_icon slds-button_icon-border-filled" onClick=${() => setLegacy(null)}><${Icon} name="close" size="x-small" /></button></header>
            <div class="an-legacy__body">${linkify(AN.LEGACY_NOTES[legacy] || 'No notes entered.', AN.LEGACY_LINKS[legacy], s.files, setFile)}</div>
            <footer class="an-legacy__foot"><${Icon} name="link" size="x-small" /> Enhancement: file references in the note now open the matching file from Related Files.</footer>
          </section></div>`
      : null;

    return html`<${AN.ApexChrome} footer=${html`<${StartVisit} onClick=${() => onToast({ title: 'Visit started', tone: 'info' })} />`} overlay=${overlay}>
      <${AccountHeader} account=${s.account} />
      <${Section} icon="note" title="Account Notes" open=${open.notes} onToggle=${() => t('notes')}>
        <div class="an-rows">${AN.CATEGORIES.slice(0, 5).map((c) => html`
          <button class="an-row" onClick=${() => setLegacy(c.id)}><span class="slds-grow">${c.name}</span><${Icon} name="page" size="x-small" /></button>`)}</div>
      </${Section}>
      <${Section} icon="attach" title=${`Related Files (${files.length})`} highlight open=${open.related} onToggle=${() => t('related')}
        badge=${html`<${Badge} tone="new">New</${Badge}>`}>
        <p class="an-meta slds-m-bottom_small">Files your Account Manager attached to the HQ and regional accounts for this chain. Tap one to open it without leaving the dashboard.</p>
        <div class="an-chips" role="radiogroup">${sources.map((src) => {
          const n = src === 'All' ? files.length : files.filter((f) => f.source === src).length;
          return html`<button role="radio" aria-checked=${filter === src} class="an-filter ${filter === src ? 'is-on' : ''}" onClick=${() => setFilter(src)}>${src} (${n})</button>`;
        })}</div>
        <div class="an-files">${shown.map((f) => html`<${FileTile} file=${f} onOpen=${setFile} />`)}</div>
        <a class="an-link" href="#" onClick=${(e) => { e.preventDefault(); onToast({ title: 'Opens the full Related tab', body: 'Kept as a fallback for older files.', tone: 'info' }); }}>View all in Related tab →</a>
      </${Section}>
      <${Section} icon="retail_execution" title="0 Surveys Available" open=${false} onToggle=${() => {}} />
      <${Section} icon="clock" title="History" open=${false} onToggle=${() => {}} />
    </${AN.ApexChrome}>`;
  };

  // ---------- Shared: Account Notes by category (also used as the AM live preview) ----------
  AN.AccountNotesView = ({ cats, files, account, selected, onSelect, onOpenFile, updatedIds = [], myReviewed = {}, isPreview }) => {
    const cat = cats.find((c) => c.id === selected) || cats[0];
    const meta = AN.catMeta(cat.id);
    const catFiles = cat.fileIds.map((id) => files[id]).filter(Boolean);
    const isUpdated = (id) => updatedIds.includes(id) && !myReviewed[id];
    const clickDetails = (e) => {
      const el = e.target.closest('[data-file-id]');
      if (el && files[el.dataset.fileId]) onOpenFile(files[el.dataset.fileId]);
    };
    return html`<div class="an-notes">
      <div class="an-notes__strip">
        <div class="slds-grow"><div class="an-notes__store">${account.store}</div>
          <div class="an-meta">Chain notes from ${account.hq} + Midwest Region · ${isPreview ? 'Draft preview' : 'Updated ' + AN.fmtDate(cats.reduce((m, c) => (c.updatedAt > m ? c.updatedAt : m), '0'))} by ${account.am} (AM)</div></div>
        <${Badge} tone="success">Pre-visit · timer not started</${Badge}>
      </div>
      <div class="an-notes__body">
        <nav class="slds-nav-vertical slds-nav-vertical_compact an-notes__nav" aria-label="Categories">
          <div class="slds-nav-vertical__section">
            <h2 class="slds-nav-vertical__title">Categories</h2>
            <ul>${cats.map((c) => html`
              <li class="slds-nav-vertical__item ${c.id === cat.id ? 'slds-is-active' : ''}">
                <a href="#" class="slds-nav-vertical__action" aria-current=${c.id === cat.id ? 'page' : null} onClick=${(e) => { e.preventDefault(); onSelect(c.id); }}>
                  <span class="slds-grow">${AN.catMeta(c.id).name}</span>
                  ${isUpdated(c.id) ? html`<span class="an-dot" title="Updated"></span>` : null}
                  ${c.fileIds.length ? html`<span class="slds-badge an-count">${c.fileIds.length}</span>` : null}
                </a></li>`)}</ul>
          </div>
        </nav>
        <div class="an-notes__content">
          <div class="an-notes__heading"><h1>${meta.name}</h1>${isUpdated(cat.id) ? html`<${Badge} tone="info">Updated ${AN.fmtDate(cat.updatedAt)}</${Badge}>` : html`<span class="an-meta">Updated ${AN.fmtDate(cat.updatedAt)}</span>`}</div>
          ${cat.summary ? html`<div class="an-callout ${cat.id === 'hot' ? 'an-callout_hot' : ''}">
            <div class="an-callout__label">${cat.id === 'hot' ? 'What to do this week' : 'Key directive'}</div>
            <div class="an-callout__text">${cat.summary}</div></div>` : html`<div class="an-callout an-callout_empty">No summary yet</div>`}
          ${catFiles.length ? html`<div><div class="an-label">Files for ${meta.name} (${catFiles.length})</div>
            <div class="an-files">${catFiles.map((f) => html`<${FileTile} file=${f} onOpen=${onOpenFile} />`)}</div></div>` : null}
          <div class="an-rich" onClick=${clickDetails} dangerouslySetInnerHTML=${{ __html: cat.details || '' }}></div>
        </div>
      </div>
    </div>`;
  };

  // Structured dashboard rows (used by the TM dashboard and the AM review preview)
  AN.NotesRows = ({ cats, files, updatedIds = [], myReviewed = {}, onOpen }) => html`
    <div class="an-rows">${cats.map((c) => {
      const upd = updatedIds.includes(c.id) && !myReviewed[c.id];
      return html`<button class="an-row an-row_rich ${c.id === 'hot' ? 'an-row_hot' : ''}" onClick=${() => onOpen(c.id)}>
        <span class="slds-grow slds-text-align_left"><span class="an-row__title">${AN.catMeta(c.id).name}</span><span class="an-row__sum">${c.summary}</span></span>
        ${upd ? html`<${Badge} tone="info">Updated</${Badge}>` : null}
        ${c.fileIds.length ? html`<${Badge}><${Icon} name="attach" size="xx-small" /> ${c.fileIds.length} ${c.fileIds.length > 1 ? 'files' : 'file'}</${Badge}>` : null}
        <${Icon} name="chevronright" size="x-small" />
      </button>`;
    })}</div>`;

  AN.DashboardBody = ({ s, cats, updatedIds, myReviewed, onOpen }) => html`
    <${AccountHeader} account=${s.account} />
    <${Section} icon="note" title="Account Notes" meta=${`Updated ${AN.fmtDate(s.published.publishedAt)} · ${s.account.am} (AM)`} open=${true} onToggle=${() => {}}>
      <${AN.NotesRows} cats=${cats} files=${s.files} updatedIds=${updatedIds} myReviewed=${myReviewed} onOpen=${onOpen} />
    </${Section}>
    <${Section} icon="retail_execution" title="0 Surveys Available" open=${false} onToggle=${() => {}} />
    <${Section} icon="clock" title="History" open=${false} onToggle=${() => {}} />`;

  // ---------- Experience 2: updated TM flow ----------
  AN.UpdatedTM = ({ onToast }) => {
    const s = AN.useStore();
    const [view, setView] = useState({ name: 'dashboard' });
    const [file, setFile] = useState(null);
    const cats = s.published.categories;
    const open = (id) => {
      setView({ name: 'notes', cat: id });
      if (!s.myReviewed[id]) AN.store.set((st) => { st.myReviewed[id] = true; st.reviewed[id] = Math.min(1, (st.reviewed[id] || 0) + 0.01); return st; });
    };
    const footer = html`<span class="an-meta slds-m-right_medium">${view.name === 'notes' ? 'Opening a category marks it reviewed for your AM.' : ''}</span>
      <${StartVisit} onClick=${() => onToast({ title: 'Visit started', body: 'Account Notes stay one tap away during the visit.', tone: 'info' })} />`;
    const overlay = file ? html`<${FilePreview} file=${file} onClose=${() => setFile(null)} />` : null;

    if (view.name === 'notes') {
      return html`<${AN.ApexChrome} title="Account Notes" onBack=${() => setView({ name: 'dashboard' })} footer=${footer} overlay=${overlay}>
        <${AN.AccountNotesView} cats=${cats} files=${s.files} account=${s.account} selected=${view.cat} onSelect=${open}
          onOpenFile=${setFile} updatedIds=${s.updatedIds} myReviewed=${s.myReviewed} />
      </${AN.ApexChrome}>`;
    }
    return html`<${AN.ApexChrome} title="PreVisit Dashboard" footer=${footer} overlay=${overlay}>
      <${AN.DashboardBody} s=${s} cats=${cats} updatedIds=${s.updatedIds} myReviewed=${s.myReviewed} onOpen=${open} />
    </${AN.ApexChrome}>`;
  };
})();
