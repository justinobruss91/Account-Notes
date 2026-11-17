/* Prototype shell: switch between the three experiences */
(function () {
  const AN = window.AN;
  const { html, render, useState, useEffect } = window.htmPreact;

  const EXPERIENCES = [
    { id: 'quick', label: 'Enhancement: Related on Dashboard', who: 'Territory Manager · Apex iPad',
      blurb: 'Short-term fix: the HQ/regional files from the Related tab sit right on the Visit Dashboard. TMs tap a file and preview it without leaving the dashboard.',
      view: (p) => html`<div class="an-stage"><${AN.Ipad}><${AN.ShortTermDashboard} ...${p} /></${AN.Ipad}></div>` },
    { id: 'tm', label: 'TM: Updated Account Notes', who: 'Territory Manager · Apex iPad',
      blurb: 'Notes organized by Hot Topic + the 5 Ps, each with a short summary and its files. Open before the visit timer starts; opening a category logs it as reviewed.',
      view: (p) => html`<div class="an-stage"><${AN.Ipad}><${AN.UpdatedTM} ...${p} /></${AN.Ipad}></div>` },
    { id: 'am', label: 'AM: Guided Publishing', who: 'Account Manager · Salesforce desktop',
      blurb: 'Account Managers publish once from the HQ account: one step per category, files dropped where they belong, and a live iPad preview of what TMs will see.',
      view: (p) => html`<div class="an-stage an-stage_desktop"><${AN.AmApp} ...${p} /></div>` },
  ];

  const readHash = () => (EXPERIENCES.find((e) => '#' + e.id === location.hash) || EXPERIENCES[0]).id;

  function App() {
    const [exp, setExp] = useState(readHash());
    const [toast, setToast] = useState(null);
    useEffect(() => { const h = () => setExp(readHash()); addEventListener('hashchange', h); return () => removeEventListener('hashchange', h); }, []);
    const cur = EXPERIENCES.find((e) => e.id === exp);
    const go = (id) => { location.hash = id; setExp(id); };
    return html`
      <div class="an-app">
        <header class="an-topbar">
          <div class="an-topbar__brand"><span class="an-topbar__mark"><${AN.Icon} name="note" /></span><div><b>Account Notes</b><div class="an-meta">Concept prototype · SLDS 2</div></div></div>
          <nav class="an-topbar__tabs" role="tablist">${EXPERIENCES.map((e, i) => html`
            <button role="tab" aria-selected=${e.id === exp} class="an-tab ${e.id === exp ? 'is-on' : ''}" onClick=${() => go(e.id)}><span class="an-tab__n">${i + 1}</span>${e.label}</button>`)}</nav>
          <button class="slds-button slds-button_neutral" onClick=${() => { AN.store.reset(); setToast({ title: 'Demo data reset', tone: 'info' }); }}>Reset demo</button>
        </header>
        <div class="an-intro"><span class="slds-badge an-badge">${cur.who}</span><p>${cur.blurb}</p></div>
        ${cur.view({ onToast: setToast, key: cur.id })}
        <${AN.Toast} toast=${toast} onClose=${() => setToast(null)} />
      </div>`;
  }

  render(html`<${App} />`, document.getElementById('app'));
})();
