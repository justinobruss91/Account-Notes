/* Seed data + a tiny shared store.
 * Both experiences read the same state: the AM wizard edits `draft`,
 * publishing copies it to `published`, which is what TMs see in Apex. */
(function () {
  const AN = (window.AN = window.AN || {});
  const { useReducer, useEffect } = window.htmPreact;

  AN.SLDS_ASSETS = 'https://cdn.jsdelivr.net/npm/@salesforce-ux/design-system@2.264.3/assets';

  AN.CATEGORIES = [
    { id: 'hot', name: 'Hot Topic', prompt: 'Lead with what is urgent. TMs see this first on the dashboard and before they start a visit.', summaryLabel: 'Hot Topic summary' },
    { id: 'availability', name: 'Product Availability', prompt: 'What should be on the shelf? Link the current planograms so TMs never have to search for them.', summaryLabel: 'Key directive' },
    { id: 'pricing', name: 'Pricing', prompt: 'Pricing rules, price points and what TMs should capture for follow-up.', summaryLabel: 'Key directive' },
    { id: 'presence', name: 'Presence', prompt: 'Fixtures, POS and tools that affect how products show up in store.', summaryLabel: 'Key directive' },
    { id: 'promotions', name: 'Promotions', prompt: 'Active and upcoming promotions, with the POS that supports them.', summaryLabel: 'Key directive' },
    { id: 'selling', name: 'Personal Selling', prompt: 'Conversations TMs should have with Store Managers this cycle.', summaryLabel: 'Key directive' },
  ];
  AN.SUMMARY_MAX = 150;

  const chip = (id, name) => `<span class="an-chip" data-file-id="${id}" contenteditable="false">${name}</span>`;

  const FILES = {
    f1: { id: 'f1', name: 'Caseys_Q4_Account_Notes.ppt', type: 'ppt', kind: 'deck', size: '4.2 MB', source: "Casey's HQ", category: 'hot', scope: 'All stores' },
    f2: { id: 'f2', name: 'NPI_Rollout_Map_2026.pdf', type: 'pdf', kind: 'map', size: '1.1 MB', source: "Casey's HQ", category: 'hot', scope: 'All stores' },
    f3: { id: 'f3', name: 'POG_VusePro_VeloMax_Sept26.pdf', type: 'pdf', kind: 'pog', size: '8.6 MB', source: "Casey's HQ", category: 'availability', scope: 'All stores' },
    f4: { id: 'f4', name: 'Camel_Craft_Placement.pdf', type: 'pdf', kind: 'pog', size: '2.3 MB', source: 'Midwest Region', category: 'availability', scope: 'KS, MI, OH' },
    f5: { id: 'f5', name: 'CEFCO_Interim_Stores.xlsx', type: 'excel', kind: 'sheet', size: '640 KB', source: 'Midwest Region', category: 'availability', scope: 'CEFCO outlets' },
    f6: { id: 'f6', name: 'POG_Tool_Quick_Guide.pdf', type: 'pdf', kind: 'deck', size: '900 KB', source: "Casey's HQ", category: 'presence', scope: 'All stores' },
    f7: { id: 'f7', name: 'Grizz_Mo_POS_Guide.png', type: 'image', kind: 'pos', size: '1.8 MB', source: "Casey's HQ", category: 'promotions', scope: 'Participating states' },
    f8: { id: 'f8', name: 'Q3_Special_Event_Return.xlsx', type: 'excel', kind: 'sheet', size: '220 KB', source: "Casey's HQ", category: 'selling', scope: 'All stores' },
  };

  const CATS = {
    hot: {
      summary: "Vuse Pro + Velo Max accepted chain-wide. Don't start TM-led cut-ins until the Sept 2026 POG is communicated to your store.",
      details: `<h3>NPI execution by state</h3><ul><li><b>3rd-party</b> (Vuse Pro + Velo Max): AR, FL, IL, IN, KS, MI, MN, MO, ND, NE, OH, SD, TX</li><li><b>TM-led</b> (Velo Max only): IA, KY, OK, TN, WI</li><li><b>CEFCO outlets:</b> TMs cut in Vuse Pro within existing Vapor space</li></ul><p>Monthly highlights are summarized in ${chip('f1', 'Caseys_Q4_Account_Notes.ppt')}</p><h3>Contacts</h3><ul><li>Chandler Davis — Lead Manager, Account Planning</li><li>Ambur Howerton — Manager, Account Operations (POG Tool issues)</li><li>Anita Jackson — Retail Execution Manager (3rd-party merchandising)</li></ul>`,
      fileIds: ['f1', 'f2'], updatedAt: '2026-11-12',
    },
    availability: {
      summary: 'Sept 2026 POGs (with Vuse Pro + Velo Max) are loaded below. Check whether your state is 3rd-party or TM-led before cutting in.',
      details: `<h3>Timing</h3><ul><li>TM-led execution can't start until POGs are communicated (labeled Sept 2026, sent via Casey's Connect 8/24).</li><li>See ${chip('f3', 'POG_VusePro_VeloMax_Sept26.pdf')} for the shelf layout.</li><li>Stores receive the October POG update in the coming weeks.</li></ul><h3>Camel Craft (5 styles)</h3><ul><li>TM-led cut-ins in KS, MI, OH — use ${chip('f4', 'Camel_Craft_Placement.pdf')} for brand load.</li></ul>`,
      fileIds: ['f3', 'f4', 'f5'], updatedAt: '2026-11-12',
    },
    pricing: {
      summary: 'Capture pricing and promotional opportunities here so the Account Manager can follow up.',
      details: `<ul><li>Note competitive price points you see in-store.</li><li>Flag any shelf tags that don't match the chain price file.</li></ul>`,
      fileIds: [], updatedAt: '2026-10-02',
    },
    presence: {
      summary: 'POG Tool is live — enter the store # to open that outlet’s POG. No new Ad Box until September.',
      details: `<ul><li>Some one-off sets show as “unassigned” — contact Ambur Howerton.</li><li>September Ad Box updates are Vuse headers only.</li><li>How-to: ${chip('f6', 'POG_Tool_Quick_Guide.pdf')}</li></ul>`,
      fileIds: ['f6'], updatedAt: '2026-10-02',
    },
    promotions: {
      summary: 'Grizz Mo: Buy any Dip, save $3 on Grizz Nic Pouch. Place chain-produced POS in the moist space.',
      details: `<ul><li>Participating states only.</li><li>POS placement: ${chip('f7', 'Grizz_Mo_POS_Guide.png')}</li></ul>`,
      fileIds: ['f7'], updatedAt: '2026-09-18',
    },
    selling: {
      summary: 'Q3 Special Event return — rotate ASC products and prompt Store Managers to return within the window.',
      details: `<ul><li>Return all Prismatic SKUs, Grizzly Nic Pouch Original 9mg and 12mg.</li><li>McLane-supplied locations (AL, FL, TX) need stickers per TMCs.</li><li>SKU list: ${chip('f8', 'Q3_Special_Event_Return.xlsx')}</li></ul>`,
      fileIds: ['f8'], updatedAt: '2026-09-18',
    },
  };

  // What TMs see today: one unformatted text blob per category.
  AN.LEGACY_NOTES = {
    hot: "CASEY'S GENERAL STORES and CEFCO locations: 08/25/2026 TMs should be receiving an email each month (forwarded from DMs) capturing key highlights for Casey's. If your DM is out and/or a recent transition- please reach out to Chandler Davis. NPI STATUS UPDATE: Casey's (including CEFCO) 2026 NPI Rollout Casey's has officially accepted Vuse Pro and Velo Max. Execution split by state: Anderson Third-Party team execution (both Vuse Pro + Velo Max) excluding CEFCO branded outlets: AR, FL*, IL, IN, KS, MI, MN, MO, ND, NE, OH, SD, TX* - The Anderson schedule will be posted on Casey's Teams channel - Vertical Alignment - REM 3rd party folder. TM-led cut-in (Velo Max only): IA, KY, OK, TN, WI CEFCO branded outlets- TMs will cut in VUSE Pro within existing Vapor space. We are working on a 3rd party work order for an interim set that will provide the space for Velo Max... please reference APEX FILE- APPROVED Placement Camel CRAFT for brand load.",
    pricing: "Communicating pricing/promotional opportunities- please reference 'Pricing section' of Account Notes to ensure the needed information is captured to prompt follow-up.",
    availability: "Key timing/notes: TM-led execution activities can't start until POGs (planograms) are communicated. Stores have the new POGs available (labeled Sept 2026) communicated via Casey's Connect on 8.24. POGs capturing VUSE PRO and VELO MAX are loaded in the FILE section.",
    presence: "PRESENCE: 1) Casey's - POG Tool launching week of 08/25 – POGs will be released with NPIs in updates and deletes for return (example Prismatic). TM can enter store # and it will directly connect to the POG for the outlet. Note some one-off set scenarios will show up as 'unassigned'. 3) No new Adbox until September - Updates to the September adbox will only be VUSE Headers.",
    promotions: "For states participating in the Grizz Mo - Buy any Dip Save $3 on Grizz Nic Pouch - chain produced POS should be placed within the moist space.",
  };

  // Enhancement (#1): phrases in today's notes that refer to a file become tappable links
  // to that file in Related Files. [phrase as written in the note, file id]
  AN.LEGACY_LINKS = {
    hot: [["capturing key highlights for Casey's", 'f1'], ['2026 NPI Rollout', 'f2'], ['APEX FILE- APPROVED Placement Camel CRAFT', 'f4']],
    availability: [['new POGs available (labeled Sept 2026)', 'f3'], ['loaded in the FILE section', 'f3']],
    presence: [['POG Tool', 'f6']],
    promotions: [['chain produced POS', 'f7']],
  };

  const clone = (o) => JSON.parse(JSON.stringify(o));

  function seed() {
    const cats = AN.CATEGORIES.map((c) => ({ id: c.id, ...CATS[c.id] }));
    return {
      version: 3,
      account: { store: "Casey's General Stores #2841", address: '1111 Main St, Ankeny, IA 50023', hq: "Casey's General Stores (HQ)", stores: 1284, regions: 'Midwest, South', am: 'Chandler Davis' },
      files: clone(FILES),
      published: { categories: cats, publishedAt: '2026-11-12' },
      draft: null,
      updatedIds: ['hot', 'availability'],
      reviewed: { hot: 0.86, availability: 0.71, pricing: 0.64, presence: 0.58, promotions: 0.66, selling: 0.52 },
      myReviewed: {},
    };
  }

  const KEY = 'an-concepts-state';
  function load() {
    try {
      const s = JSON.parse(localStorage.getItem(KEY));
      return s && s.version === 3 ? s : null;
    } catch (e) { return null; }
  }
  function save(state) {
    try {
      // object URLs from uploads don't survive a reload, so strip them
      const s = clone(state);
      Object.values(s.files).forEach((f) => delete f.url);
      localStorage.setItem(KEY, JSON.stringify(s));
    } catch (e) { /* storage unavailable: demo still works in memory */ }
  }

  let state = load() || seed();
  const subs = new Set();
  AN.store = {
    get: () => state,
    set(fn) { state = fn(clone(state)) ; restoreUrls(state); save(state); subs.forEach((s) => s()); },
    reset() { urls = {}; state = seed(); save(state); subs.forEach((s) => s()); },
    subscribe(fn) { subs.add(fn); return () => subs.delete(fn); },
  };
  // keep upload object URLs across clone() calls in memory
  let urls = {};
  AN.rememberUrl = (id, url) => { urls[id] = url; };
  function restoreUrls(s) { Object.keys(urls).forEach((id) => { if (s.files[id]) s.files[id].url = urls[id]; }); }

  AN.useStore = function () {
    const [, force] = useReducer((x) => x + 1, 0);
    useEffect(() => AN.store.subscribe(force), []);
    return AN.store.get();
  };

  AN.clone = clone;
  AN.catMeta = (id) => AN.CATEGORIES.find((c) => c.id === id);
  AN.fmtDate = (iso) => new Date(iso + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  AN.today = () => new Date().toISOString().slice(0, 10);
  AN.uid = () => 'u' + Math.random().toString(36).slice(2, 9);
})();
