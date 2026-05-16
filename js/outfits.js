'use strict';

// ══════════════════════════════════════════
//  OUTFITS — historial + creador + footer stats
//  Depends on: app.js globals (dbGetAll, dbGet, dbPut, dbAdd, dbDelete,
//              renderDashboard, closeAllDrops)
//              wardrobe.js (CAT_LABELS)
//              log.js (LOG_CATS)
//              utils.js (toast, formatDate, esc)
//  Loaded before app.js; all calls happen at runtime only.
// ══════════════════════════════════════════

let outfitBuilderPieces = {};
let historyOutfitsCache = [];
let historyIMap = {};
let historySort = 'count';
let smartSelectedItem = null;

async function initOutfitsView(){
  const allWears = await dbGetAll('wears');
  const allItems = await dbGetAll('items');
  const iMap = {};
  allItems.forEach(it => iMap[it.id] = it);

  historyIMap = iMap;
  historyOutfitsCache = buildHistoryOutfits(allWears, iMap);

  outfitBuilderPieces = {};
  LOG_CATS.forEach(c => { outfitBuilderPieces[c.key] = []; });
  renderOutfitBuilder(allItems);

  renderHistoryOutfits();
  await renderOutfitsList();
  renderSmartSelector(allItems, iMap);
}

// ── COLUMN A: History outfits ──

function buildHistoryOutfits(allWears, iMap){
  const dayGroups = {};
  allWears.forEach(w => {
    const key = w.outfitId || ('day-' + w.date);
    if(!dayGroups[key]) dayGroups[key] = {date: w.date, items: []};
    if(w.itemId && iMap[w.itemId]) dayGroups[key].items.push(w.itemId);
  });

  const nucleusMap = {};
  Object.values(dayGroups).forEach(day => {
    if(!day.items.length) return;
    const dalts   = day.items.filter(id => iMap[id]?.category === 'DALT').sort();
    const baixos  = day.items.filter(id => iMap[id]?.category === 'BAIX').sort();
    const sencers = day.items.filter(id => iMap[id]?.category === 'SENCER').sort();

    let nucleusKey;
    if(sencers.length && !dalts.length && !baixos.length){
      nucleusKey = 'S:' + sencers.join('|');
    } else if(dalts.length || baixos.length){
      nucleusKey = 'D:' + dalts.join('|') + '+B:' + baixos.join('|');
    } else return;

    if(!nucleusMap[nucleusKey]){
      nucleusMap[nucleusKey] = {
        nucleusKey,
        daltIds: dalts,
        baixIds: baixos,
        sencerIds: sencers,
        dates: [],
        variants: {}
      };
    }
    nucleusMap[nucleusKey].dates.push(day.date);

    const varKey = day.items.slice().sort().join('|');
    if(!nucleusMap[nucleusKey].variants[varKey]){
      nucleusMap[nucleusKey].variants[varKey] = {items: day.items, count: 0, dates: []};
    }
    nucleusMap[nucleusKey].variants[varKey].count++;
    nucleusMap[nucleusKey].variants[varKey].dates.push(day.date);
  });

  return Object.values(nucleusMap).map(n => {
    let cpwTotal = 0;
    [...n.daltIds, ...n.baixIds, ...n.sencerIds].forEach(id => {
      const it = iMap[id];
      if(it && it.wears > 0) cpwTotal += it.cpw;
    });
    return {
      ...n,
      count: n.dates.length,
      cpwTotal,
      lastWorn: n.dates.slice().sort().pop(),
    };
  });
}

function sortHistoryOutfits(by, btn){
  historySort = by;
  document.querySelectorAll('#ob-sort-count,#ob-sort-cpw').forEach(b => b.classList.remove('on'));
  if(btn) btn.classList.add('on');
  renderHistoryOutfits();
}

function renderHistoryOutfits(filter){
  const container = document.getElementById('history-outfits-list');
  if(!container) return;

  let outfits = [...historyOutfitsCache];

  if(smartSelectedItem){
    outfits = outfits.filter(o =>
      o.daltIds.includes(smartSelectedItem.itemId) ||
      o.baixIds.includes(smartSelectedItem.itemId) ||
      o.sencerIds.includes(smartSelectedItem.itemId) ||
      Object.values(o.variants).some(v => v.items.includes(smartSelectedItem.itemId))
    );
  }

  if(historySort === 'count') outfits.sort((a,b) => b.count - a.count);
  else outfits.sort((a,b) => b.cpwTotal - a.cpwTotal);

  if(!outfits.length){
    container.innerHTML = '<div style="font-size:13px;color:var(--text3);padding:1rem 0">'
      + (smartSelectedItem ? 'Cap outfit trobat amb aquesta peça.' : 'Cap historial encara. Registra el teu primer dia!') + '</div>';
    return;
  }

  container.innerHTML = outfits.slice(0,50).map((o, oi) => {
    const daltNames = o.daltIds.map(id => {
      const it = historyIMap[id];
      return it ? it.brand + ' ' + it.name : id;
    }).join(' + ');
    const baixNames = o.baixIds.map(id => {
      const it = historyIMap[id];
      return it ? it.brand + ' ' + it.name : id;
    }).join(' + ');
    const sencerNames = o.sencerIds.map(id => {
      const it = historyIMap[id];
      return it ? it.brand + ' ' + it.name : id;
    }).join(' + ');

    const nucleusStr = o.sencerIds.length
      ? sencerNames
      : [daltNames, baixNames].filter(Boolean).join(' · ');

    const cpwStr = o.cpwTotal > 0 ? o.cpwTotal.toFixed(2) + '€' : '—';
    const lastStr = o.lastWorn ? formatDate(o.lastWorn) : '—';

    const variants = Object.values(o.variants).sort((a,b) => b.count - a.count);
    const varHTML = variants.map(v => {
      const extras = v.items.filter(id => !o.daltIds.includes(id) && !o.baixIds.includes(id) && !o.sencerIds.includes(id));
      const extraNames = extras.map(id => {
        const it = historyIMap[id];
        return it ? it.brand + ' ' + it.name : id;
      }).join(', ');
      return '<div class="hoc-variant">'
        + '<div class="hoc-variant-name">' + (extraNames || 'Sense accessoris extra') + '</div>'
        + '<div class="hoc-variant-stat">' + v.count + '× · ' + formatDate(v.dates[v.dates.length-1]) + '</div>'
        + '</div>';
    }).join('');

    return '<div class="hoc" id="hoc-' + oi + '">'
      + '<div class="hoc-header" data-hocidx="' + oi + '">'
      + '<div class="hoc-names">' + nucleusStr + '</div>'
      + '<div class="hoc-meta"><div class="hoc-count">' + o.count + '</div><div class="hoc-count-lbl">cops</div></div>'
      + '<span class="hoc-arrow">›</span>'
      + '</div>'
      + '<div class="hoc-body">'
      + '<div style="padding:0.6rem 1rem;font-size:11px;color:var(--text3);display:flex;gap:1rem">'
      + '<span>CPU nucli: ' + cpwStr + '</span><span>Últim: ' + lastStr + '</span>'
      + '</div>'
      + varHTML
      + '<div class="hoc-actions">'
      + '<button class="btn btn-secondary btn-sm" style="font-size:11px" data-nameoutfit="' + oi + '">Posar nom</button>'
      + '</div>'
      + '</div>'
      + '</div>';
  }).join('');

  container.querySelectorAll('.hoc-header').forEach(el => {
    el.addEventListener('click', () => {
      const hoc = document.getElementById('hoc-' + el.dataset.hocidx);
      hoc.classList.toggle('open');
    });
  });

  container.querySelectorAll('[data-nameoutfit]').forEach(btn => {
    btn.addEventListener('click', async e => {
      e.stopPropagation();
      const idx = parseInt(btn.dataset.nameoutfit);
      const o = outfits[idx];
      const name = prompt('Nom per aquest outfit:');
      if(!name) return;
      const saved = {
        id: 'outfit_' + Date.now(),
        name,
        pieces: [...o.daltIds, ...o.baixIds, ...o.sencerIds].map(id => ({
          catKey: historyIMap[id]?.category || '',
          itemId: id,
          text: (historyIMap[id]?.brand || '') + ' ' + (historyIMap[id]?.name || ''),
        })),
        createdAt: new Date().toISOString(),
        wears: o.count,
        lastWorn: o.lastWorn,
        favourite: false,
      };
      await dbPut('outfits', saved);
      toast('Outfit "' + name + '" guardat ✓');
      await renderOutfitsList();
    });
  });
}

// ── Smart selector ──
function renderSmartSelector(allItems, iMap){
  historyIMap = iMap;

  const wrap = document.getElementById('smart-selector-wrap');
  if(!wrap) return;

  const sel1 = document.createElement('select');
  sel1.className = 'ss-select';
  sel1.innerHTML = '<option value="">— Tria una peça —</option>';

  const byCat = {};
  allItems.forEach(it => {
    if(!byCat[it.category]) byCat[it.category] = [];
    byCat[it.category].push(it);
  });

  Object.entries(CAT_LABELS).forEach(([cat, catLabel]) => {
    if(!byCat[cat]?.length) return;
    const grp = document.createElement('optgroup');
    grp.label = catLabel;
    byCat[cat].sort((a,b) => b.wears - a.wears).forEach(it => {
      const o = document.createElement('option');
      o.value = it.id;
      o.dataset.cat = it.category;
      o.textContent = it.brand + ' ' + it.name + ' (' + it.wears + ' usos)';
      grp.appendChild(o);
    });
    sel1.appendChild(grp);
  });

  const clearBtn = document.createElement('button');
  clearBtn.className = 'chip';
  clearBtn.textContent = 'Netejar filtre';
  clearBtn.style.marginTop = '0.4rem';
  clearBtn.addEventListener('click', () => {
    sel1.value = '';
    smartSelectedItem = null;
    renderHistoryOutfits();
  });

  sel1.addEventListener('change', () => {
    if(!sel1.value){ smartSelectedItem = null; renderHistoryOutfits(); return; }
    const opt = sel1.querySelector('option[value="' + sel1.value + '"]');
    smartSelectedItem = {catKey: opt?.dataset.cat || '', itemId: sel1.value};
    renderHistoryOutfits();
  });

  wrap.innerHTML = '';
  wrap.appendChild(sel1);
  wrap.appendChild(clearBtn);
}

// ── COLUMN B: Builder ──
function renderOutfitBuilder(allItems){
  const container = document.getElementById('outfit-builder-cats');
  if(!container) return;

  container.innerHTML = LOG_CATS.map(cat =>
    '<div class="log-cat-section">'
    + '<div class="log-cat-header">'
    + '<span class="log-cat-label">' + cat.label + '</span>'
    + '<button class="log-add-btn" data-obcat="' + cat.key + '">+ Afegir</button>'
    + '</div>'
    + '<div id="obrows-' + cat.key + '"><div style="font-size:12px;color:var(--text3);padding:2px 0 4px">Cap peça</div></div>'
    + '</div>'
  ).join('');

  container.querySelectorAll('[data-obcat]').forEach(btn => {
    btn.addEventListener('click', () => addOutfitBuilderPiece(btn.dataset.obcat, allItems));
  });
}

function addOutfitBuilderPiece(catKey, allItems){
  outfitBuilderPieces[catKey].push({itemId:null, text:''});
  renderOutfitBuilderRows(catKey, allItems);
}

function renderOutfitBuilderRows(catKey, allItems){
  const container = document.getElementById('obrows-' + catKey);
  if(!container) return;
  const pieces = outfitBuilderPieces[catKey] || [];
  if(!pieces.length){
    container.innerHTML = '<div style="font-size:12px;color:var(--text3);padding:2px 0 4px">Cap peça</div>';
    return;
  }
  let html = '';
  pieces.forEach((p, i) => {
    html += '<div class="log-piece-row" data-obcat="' + catKey + '" data-obidx="' + i + '">'
      + '<div class="ac-wrap">'
      + '<input class="log-piece-input" id="obinput-' + catKey + '-' + i + '" type="text"'
      + ' placeholder="Busca una peça…" value="' + esc(p.text) + '" autocomplete="off">'
      + '<div class="ac-drop" id="obacdrop-' + catKey + '-' + i + '"></div>'
      + '</div>'
      + '<button class="log-rm-btn" data-obrmcat="' + catKey + '" data-obrmidx="' + i + '">&#215;</button>'
      + '</div>';
  });
  container.innerHTML = html;
  container.querySelectorAll('[data-obrmcat]').forEach(btn => {
    btn.addEventListener('click', () => {
      outfitBuilderPieces[btn.dataset.obrmcat].splice(parseInt(btn.dataset.obrmidx), 1);
      renderOutfitBuilderRows(catKey, allItems);
      checkDuplicateNucleus();
    });
  });
  container.querySelectorAll('input.log-piece-input').forEach(input => {
    const row = input.closest('[data-obcat]');
    const cat = row.dataset.obcat;
    const idx = parseInt(row.dataset.obidx);
    input.addEventListener('input', () => { showObDrop(cat, idx, input.value, allItems); checkDuplicateNucleus(); });
    input.addEventListener('focus', () => showObDrop(cat, idx, input.value, allItems));
  });
}

function showObDrop(catKey, idx, val, allItems){
  const drop = document.getElementById('obacdrop-' + catKey + '-' + idx);
  if(!drop) return;
  if(!val.trim()){ drop.style.display='none'; return; }
  const q = val.toLowerCase();
  const matches = allItems.filter(it =>
    it.category === catKey &&
    (it.brand.toLowerCase().includes(q) || it.name.toLowerCase().includes(q))
  ).slice(0,7);
  let html = matches.map(it =>
    '<div class="ac-item" data-obpick="1" data-obcat="' + catKey + '" data-obidx="' + idx
    + '" data-obid="' + it.id + '" data-obtext="' + esc(it.brand+' '+it.name) + '">'
    + '<span class="ac-main">' + esc(it.brand) + ' ' + esc(it.name) + '</span>'
    + ' <span class="ac-sub">' + esc(it.color) + '</span>'
    + '</div>'
  ).join('');
  drop.innerHTML = html;
  drop.style.display = html ? 'block' : 'none';
  drop.querySelectorAll('[data-obpick]').forEach(el => {
    el.addEventListener('mousedown', e => {
      e.preventDefault();
      const cat = el.dataset.obcat;
      const i   = parseInt(el.dataset.obidx);
      outfitBuilderPieces[cat][i] = {itemId: el.dataset.obid, text: el.dataset.obtext};
      renderOutfitBuilderRows(cat, allItems);
      closeAllDrops();
      checkDuplicateNucleus();
    });
  });
}

function checkDuplicateNucleus(){
  const dalts  = (outfitBuilderPieces['DALT']||[]).map(p=>p.itemId).filter(Boolean).sort();
  const baixos = (outfitBuilderPieces['BAIX']||[]).map(p=>p.itemId).filter(Boolean).sort();
  if(!dalts.length && !baixos.length){ document.getElementById('outfit-dup-warning').style.display='none'; return; }
  const nucleusKey = 'D:' + dalts.join('|') + '+B:' + baixos.join('|');
  const isDup = historyOutfitsCache.some(o => o.nucleusKey === nucleusKey);
  document.getElementById('outfit-dup-warning').style.display = isDup ? 'block' : 'none';
}

function clearOutfitBuilder(){
  LOG_CATS.forEach(c => { outfitBuilderPieces[c.key] = []; });
  const nameInput = document.getElementById('outfit-name-input');
  if(nameInput) nameInput.value = '';
  const container = document.getElementById('outfit-builder-cats');
  if(container) LOG_CATS.forEach(cat => {
    const rows = document.getElementById('obrows-' + cat.key);
    if(rows) rows.innerHTML = '<div style="font-size:12px;color:var(--text3);padding:2px 0 4px">Cap peça</div>';
  });
  document.getElementById('outfit-dup-warning').style.display = 'none';
}

async function saveOutfit(){
  const name = document.getElementById('outfit-name-input')?.value?.trim() || '';
  const pieces = [];
  LOG_CATS.forEach(cat => {
    (outfitBuilderPieces[cat.key]||[]).forEach(p => {
      if(p.itemId) pieces.push({catKey: cat.key, itemId: p.itemId, text: p.text});
    });
  });
  if(!pieces.length){ toast('Afegeix almenys una peça'); return; }

  const outfit = {
    id: 'outfit_' + Date.now(),
    name: name || 'Outfit ' + new Date().toLocaleDateString('ca'),
    pieces,
    createdAt: new Date().toISOString(),
    wears: 0,
    lastWorn: null,
    favourite: false,
  };
  await dbPut('outfits', outfit);
  toast('Outfit guardat ✓');
  clearOutfitBuilder();
  await renderOutfitsList();
}

async function renderOutfitsList(){
  const container = document.getElementById('outfits-list');
  if(!container) return;
  const outfits = await dbGetAll('outfits');
  if(!outfits.length){ container.innerHTML = '<div style="font-size:12px;color:var(--text3)">Cap outfit guardat encara.</div>'; return; }
  outfits.sort((a,b) => (b.wears||0) - (a.wears||0));
  container.innerHTML = outfits.map(o =>
    '<div class="day-card" style="margin-bottom:0.5rem">'
    + '<div class="day-card-top">'
    + '<div style="flex:1"><div style="font-weight:600;font-size:13px">' + (o.favourite?'★ ':'') + esc(o.name) + '</div>'
    + '<div class="day-card-cpw">' + (o.wears||0) + ' cops · ' + (o.lastWorn?formatDate(o.lastWorn):'—') + '</div></div>'
    + '<div style="display:flex;gap:0.35rem;flex-wrap:wrap">'
    + '<button class="btn btn-primary btn-sm" style="font-size:11px" data-wearoutfit="' + o.id + '">Registrar</button>'
    + '<button class="chip ' + (o.favourite?'accent-on':'') + '" style="font-size:11px;padding:0.3rem 0.6rem" data-favoutfit="' + o.id + '">' + (o.favourite?'★':'☆') + '</button>'
    + '<button class="btn btn-danger btn-sm" style="font-size:11px" data-deloutfit="' + o.id + '">×</button>'
    + '</div></div></div>'
  ).join('');
  container.querySelectorAll('[data-wearoutfit]').forEach(btn => btn.addEventListener('click', () => wearSavedOutfit(btn.dataset.wearoutfit)));
  container.querySelectorAll('[data-favoutfit]').forEach(btn => btn.addEventListener('click', async () => {
    const o = await dbGet('outfits', btn.dataset.favoutfit);
    if(!o) return;
    o.favourite = !o.favourite;
    await dbPut('outfits', o);
    toast(o.favourite ? 'Outfit afegit als preferits ★' : 'Tret dels preferits');
    renderOutfitsList();
  }));
  container.querySelectorAll('[data-deloutfit]').forEach(btn => btn.addEventListener('click', async () => {
    if(!confirm('Eliminar aquest outfit guardat?')) return;
    await dbDelete('outfits', btn.dataset.deloutfit);
    toast('Outfit eliminat');
    renderOutfitsList();
  }));
}

async function wearSavedOutfit(outfitId){
  const outfit = await dbGet('outfits', outfitId);
  if(!outfit) return;
  const date = new Date().toISOString().split('T')[0];
  const wearOutfitId = 'o' + Date.now();
  for(const p of outfit.pieces){
    await dbAdd('wears', {date, itemId: p.itemId, outfitId: wearOutfitId, outfitLabel: outfit.name, freeText: null, catKey: p.catKey, seeded: false});
    const it = await dbGet('items', p.itemId);
    if(it){
      it.wears = (it.wears||0) + 1;
      it.cpw = it.totalCost > 0 ? it.totalCost / it.wears : 0;
      if(!it.lastWorn || date > it.lastWorn) it.lastWorn = date;
      await dbPut('items', it);
    }
  }
  outfit.wears = (outfit.wears||0) + 1;
  outfit.lastWorn = date;
  await dbPut('outfits', outfit);
  toast('Outfit registrat avui ✓');
  renderOutfitsList();
  renderDashboard();
}

// ── Footer stats ──
async function renderFooter(){
  const footer = document.getElementById('app-footer');
  if(footer) footer.style.display = 'block';
  const allItems = await dbGetAll('items');
  const allWears = await dbGetAll('wears');
  const totalCost = allItems.reduce((s,i) => s + (i.totalCost||0), 0);
  const el = document.getElementById('footer-stats');
  if(el){
    el.innerHTML =
      '<span class="footer-stat-val">' + allItems.length + '</span> peces<br>'
      + '<span class="footer-stat-val">' + allWears.length + '</span> usos registrats<br>'
      + '<span class="footer-stat-val">' + totalCost.toFixed(0) + '€</span> invertits en total';
  }
}
