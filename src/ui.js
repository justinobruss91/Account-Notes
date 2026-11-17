/* Shared UI pieces. Each maps to an SLDS blueprint or a future LWC/base component. */
(function () {
  const AN = window.AN;
  const { html, useState, useEffect, useRef } = window.htmPreact;
  const A = AN.SLDS_ASSETS;

  // Utility icon recolorable via currentColor (CSS mask over the SLDS SVG).
  AN.Icon = ({ name, sprite = 'utility', size = 'small', cls = '' }) =>
    html`<span class="an-icon an-icon_${size} ${cls}" aria-hidden="true" style=${`--icon:url(${A}/icons/${sprite}/${name}.svg)`}></span>`;

  // Standard (object) icon: colored tile + white glyph, like slds-icon-standard-*.
  AN.StdIcon = ({ name, size = 'medium' }) =>
    html`<span class="slds-icon_container slds-icon-standard-${name.replace(/_/g, '-')} an-std an-std_${size}" aria-hidden="true">
      <span class="an-icon an-std__glyph" style=${`--icon:url(${A}/icons/standard/${name}.svg)`}></span></span>`;

  AN.DocIcon = ({ type, size = 'small' }) =>
    html`<img class="an-doc an-doc_${size}" alt="" src=${`${A}/icons/doctype/${type === 'excel' ? 'excel' : type === 'image' ? 'image' : type === 'ppt' ? 'ppt' : 'pdf'}.svg`} />`;

  AN.Badge = ({ children, tone }) => html`<span class="slds-badge an-badge ${tone ? 'an-badge_' + tone : ''}">${children}</span>`;

  // slds-file style tile
  AN.FileTile = ({ file, onOpen, compact }) => html`
    <button class="an-file ${compact ? 'an-file_compact' : ''}" onClick=${() => onOpen(file)} title=${file.name}>
      <span class="an-file__thumb an-thumb_${file.kind}"><${AN.FileArt} file=${file} mini /></span>
      <span class="an-file__title"><${AN.DocIcon} type=${file.type} size="x-small" /><span class="slds-truncate">${file.name}</span></span>
    </button>`;

  // Mock document art so previews feel real without shipping real files.
  AN.FileArt = ({ file, mini }) => {
    if (file.url && file.type === 'image') return html`<img class="an-art__img" src=${file.url} alt="" />`;
    if (file.url && file.type === 'pdf' && !mini) return html`<iframe class="an-art__frame" src=${file.url} title=${file.name}></iframe>`;
    const k = file.kind || 'deck';
    if (k === 'pog') {
      const shelves = mini ? 3 : 5, facings = mini ? 6 : 12;
      return html`<div class="an-art an-art_pog">${Array.from({ length: shelves }, (_, s) => html`<div class="an-art__shelf">${Array.from({ length: facings }, (_, i) => html`<i class=${'c' + ((s + i) % 5)}></i>`)}</div>`)}</div>`;
    }
    if (k === 'sheet') {
      const rows = mini ? 4 : 12;
      return html`<div class="an-art an-art_sheet">${Array.from({ length: rows }, (_, r) => html`<div class=${r ? '' : 'h'}><i></i><i></i><i></i><i></i></div>`)}</div>`;
    }
    if (k === 'pos') return html`<div class="an-art an-art_pos"><b>SAVE $3</b><span>on Grizz Nic Pouch</span><em>with any Dip purchase</em></div>`;
    if (k === 'map') return html`<div class="an-art an-art_map">${Array.from({ length: mini ? 12 : 30 }, (_, i) => html`<i class=${i % 3 === 0 ? 'tm' : i % 4 === 0 ? 'cf' : 'tp'}></i>`)}</div>`;
    return html`<div class="an-art an-art_deck"><b></b><span></span><span></span><span class="short"></span></div>`;
  };

  // In-app preview sheet (rendered inside whatever frame it's placed in)
  AN.FilePreview = ({ file, onClose }) => {
    if (!file) return null;
    const cat = AN.catMeta(file.category);
    return html`
      <div class="an-overlay" onClick=${onClose}>
        <section class="an-preview" role="dialog" aria-label=${file.name} onClick=${(e) => e.stopPropagation()}>
          <header class="an-preview__header">
            <${AN.DocIcon} type=${file.type} size="small" />
            <div class="slds-grow slds-truncate">
              <h2 class="an-preview__title slds-truncate">${file.name}</h2>
              <p class="an-meta">${file.source} · ${cat ? cat.name : 'Related'} · Applies to ${file.scope}</p>
            </div>
            <button class="slds-button slds-button_neutral">Share</button>
            <button class="slds-button slds-button_neutral">Open in Files</button>
            <button class="slds-button slds-button_icon slds-button_icon-border-filled" title="Close" onClick=${onClose}><${AN.Icon} name="close" size="x-small" /></button>
          </header>
          <div class="an-preview__body">
            <div class="an-preview__page an-page_${file.kind}"><${AN.FileArt} file=${file} /></div>
            <p class="an-preview__hint">Page 1 of 4 · Pinch to zoom</p>
          </div>
        </section>
      </div>`;
  };

  // iPad bezel that scales a 1194×834 screen to the space available.
  AN.Ipad = ({ children, maxWidth }) => {
    const ref = useRef();
    const [scale, setScale] = useState(1);
    useEffect(() => {
      const el = ref.current;
      const fit = () => { const w = Math.min(el.clientWidth, maxWidth || 99999); setScale(Math.min(1, w / 1234)); };
      fit();
      const ro = new ResizeObserver(fit); ro.observe(el);
      return () => ro.disconnect();
    }, [maxWidth]);
    return html`<div class="an-ipad-wrap" ref=${ref} style=${`height:${874 * scale}px`}>
      <div class="an-ipad" style=${`transform:scale(${scale})`}><div class="an-ipad__screen">${children}</div></div>
    </div>`;
  };

  AN.Toast = ({ toast, onClose }) => {
    useEffect(() => { if (!toast) return; const t = setTimeout(onClose, 5000); return () => clearTimeout(t); }, [toast]);
    if (!toast) return null;
    return html`<div class="slds-notify_container an-toast-container">
      <div class="slds-notify slds-notify_toast slds-theme_${toast.tone || 'success'}" role="status">
        <span class="slds-icon_container slds-m-right_small"><${AN.Icon} name=${toast.tone === 'info' ? 'info' : 'success'} /></span>
        <div class="slds-notify__content"><h2 class="slds-text-heading_small">${toast.title}</h2>${toast.body ? html`<p>${toast.body}</p>` : null}</div>
        <div class="slds-notify__close"><button class="slds-button slds-button_icon slds-button_icon-inverse" title="Close" onClick=${onClose}><${AN.Icon} name="close" size="x-small" /></button></div>
      </div></div>`;
  };

  AN.ProgressBar = ({ value }) => html`
    <div class="an-progress">
      <div class="slds-progress-bar slds-progress-bar_small slds-progress-bar_circular" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow=${Math.round(value * 100)}>
        <span class="slds-progress-bar__value ${value > 0.7 ? 'slds-progress-bar__value_success' : ''}" style=${`width:${Math.max(2, value * 100)}%`}></span>
      </div><span class="an-progress__label">${Math.round(value * 100)}%</span>
    </div>`;
})();
