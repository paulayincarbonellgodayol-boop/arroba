'use strict';

// ══════════════════════════════════════════
//  LOG — REGISTRE DE DIA
//  Depends on: app.js globals (dbGetAll, dbGet, dbPut, dbAdd, dbDelete,
//              renderDashboard, logOcasioSelected, renderLogOcasioSelected)
//              utils.js (toast, formatDate, esc)
//  Loaded before app.js; all calls happen at runtime only.
// ══════════════════════════════════════════

const LOG_CATS = [
  {key:'DALT',     label:'Dalt'},
  {key:'BAIX',     label:'Baix'},
  {key:'SENCER',   label:'Sencer'},
  {key:'JAQUETA',  label:'Jaqueta / Dessuadora'},
  {key:'SABATES',  label:'Sabates'},
  {key:'ARRACADES',label:'Arracades'},
  {key:'BOLSO',    label:'Bolso'},
  {key:'ALTRES',   label:'Altres'},
];

let logPieces = {};
let logItemCache = [];
let logDateInited = false;

async function initLogView(){
  logItemCache = await dbGetAll('items');
  if(!logDateInited){
    document.getElementById('log-date').value = new Date().toISOString().split('T')[0];
    logDateInited = true;
  }
  logPieces = {};
  LOG_CATS.forEach(c => { logPieces[c.key] = []; });
  renderLogCats();
  await loadDayHistory();
}

function renderLogCats(){
  const container = document.getElementById('log-categories');
  container.innerHTML = LOG_CATS.map(cat =>
    '<div class="log-cat-section">'
    + '<div class="log-cat-header">'
    + '<span class="log-cat-label">' + cat.label + '</span>'
    + '<button class="log-add-btn" data-addcat="' + cat.key + '">+ Afegir</button>'
    + '</div>'
    + '<div id="logrows-' + cat.key + '">'
    + '<div style="font-size:12px;color:var(--text3);padding:2px 0 6px">Cap peça seleccionada</div>'
    + '</div></div>'
  ).join('');
  container.querySelectorAll('[data-addcat]').forEach(btn => {
    btn.addEventListener('click', () => addLogPiece(btn.dataset.addcat));
  });
  updateLogCPW();
}

function renderCatRows(catKey){
  const container = document.getElementById('logrows-' + catKey);
  if(!container) return;
  const pieces = logPieces[catKey] || [];
  if(!pieces.length){
    container.innerHTML = '<div style="font-size:12px;color:var(--text3);padding:2px 0 6px">Cap peça seleccionada</div>';
    return;
  }
  let html = '';
  pieces.forEach((p, i) => {
    const ghostClass = p.ghost ? ' ghost' : '';
    const ghostHint = p.ghost
      ? '<div class="ghost-hint">⚠ Peça nova &mdash; recorda actualitzar l\'armari</div>'
      : '';
    html += '<div class="log-piece-row" data-cat="' + catKey + '" data-idx="' + i + '">'
      + '<div class="ac-wrap">'
      + '<input class="log-piece-input' + ghostClass + '" id="loginput-' + catKey + '-' + i + '"'
      + ' type="text" placeholder="Busca o escriu..." value="' + esc(p.text) + '" autocomplete="off">'
      + '<div class="ac-drop" id="acdrop-' + catKey + '-' + i + '"></div>'
      + '</div>'
      + '<button class="log-rm-btn" data-rmcat="' + catKey + '" data-rmidx="' + i + '">&#215;</button>'
      + '</div>' + ghostHint;
  });
  container.innerHTML = html;
  container.querySelectorAll('[data-rmcat]').forEach(btn => {
    btn.addEventListener('click', () => removeLogPiece(btn.dataset.rmcat, parseInt(btn.dataset.rmidx)));
  });
  container.querySelectorAll('input.log-piece-input').forEach(input => {
    const row = input.closest('[data-cat]');
    const cat = row.dataset.cat;
    const idx = parseInt(row.dataset.idx);
    input.addEventListener('input', () => onLogInput(cat, idx, input.value));
    input.addEventListener('focus', () => onLogInput(cat, idx, input.value));
    input.addEventListener('keydown', e => onLogKey(e, cat, idx));
  });
}

function addLogPiece(catKey){
  logPieces[catKey].push({itemId:null, text:'', ghost:false});
  renderCatRows(catKey);
  const idx = logPieces[catKey].length - 1;
  setTimeout(() => {
    const el = document.getElementById('loginput-' + catKey + '-' + idx);
    if(el) el.focus();
  }, 30);
}

function removeLogPiece(catKey, idx){
  logPieces[catKey].splice(idx, 1);
  renderCatRows(catKey);
  updateLogCPW();
}

let acHiIdx = -1;

function onLogInput(catKey, idx, val){
  if(!logPieces[catKey] || logPieces[catKey][idx] === undefined) return;
  logPieces[catKey][idx].text = val;
  if(!val.trim()){
    logPieces[catKey][idx].itemId = null;
    logPieces[catKey][idx].ghost = false;
    closeDrop(catKey, idx);
    updateLogCPW();
    return;
  }
  showDrop(catKey, idx, val);
  updateLogCPW();
}

function showDrop(catKey, idx, val){
  const drop = document.getElementById('acdrop-' + catKey + '-' + idx);
  if(!drop) return;
  const q = val.toLowerCase();
  const matches = logItemCache
    .filter(it => it.category === catKey &&
      (it.brand.toLowerCase().includes(q) ||
       it.name.toLowerCase().includes(q) ||
       it.color.toLowerCase().includes(q)))
    .slice(0, 7);

  let html = matches.map((it, mi) => {
    const cpwStr = it.wears > 0 ? it.cpw.toFixed(2) + '€/ús' : '—';
    return '<div class="ac-item" data-action="pick" data-cat="' + catKey + '" data-idx="' + idx + '" data-id="' + it.id + '" data-text="' + esc(it.brand + ' ' + it.name) + '">'
      + '<div><span class="ac-main">' + esc(it.brand) + ' ' + esc(it.name) + '</span>'
      + ' <span class="ac-sub">' + esc(it.color) + '</span></div>'
      + '<span class="ac-sub">' + it.wears + ' usos · ' + cpwStr + '</span>'
      + '</div>';
  }).join('');

  html += '<div class="ac-ghost-item" data-action="ghost" data-cat="' + catKey + '" data-idx="' + idx + '" data-text="' + esc(val) + '">'
    + '+ Afegir "' + esc(val) + '" com a peça nova'
    + '</div>';

  drop.innerHTML = html;
  drop.style.display = 'block';
  acHiIdx = -1;

  drop.querySelectorAll('[data-action="pick"]').forEach(el => {
    el.addEventListener('mousedown', e => {
      e.preventDefault();
      pickItem(e, el.dataset.cat, parseInt(el.dataset.idx), el.dataset.id, el.dataset.text);
    });
  });
  drop.querySelectorAll('[data-action="ghost"]').forEach(el => {
    el.addEventListener('mousedown', e => {
      e.preventDefault();
      pickGhost(e, el.dataset.cat, parseInt(el.dataset.idx), el.dataset.text);
    });
  });
}

function pickItem(e, catKey, idx, itemId, text){
  e.preventDefault();
  logPieces[catKey][idx] = {itemId, text, ghost:false};
  renderCatRows(catKey);
  closeAllDrops();
  updateLogCPW();
}

function pickGhost(e, catKey, idx, text){
  e.preventDefault();
  logPieces[catKey][idx] = {itemId:null, text, ghost:true};
  renderCatRows(catKey);
  closeAllDrops();
  updateLogCPW();
}

function onLogKey(e, catKey, idx){
  const drop = document.getElementById('acdrop-' + catKey + '-' + idx);
  if(!drop || drop.style.display === 'none') return;
  const items = drop.querySelectorAll('.ac-item, .ac-ghost-item');
  if(e.key === 'ArrowDown'){ e.preventDefault(); acHiIdx = Math.min(acHiIdx+1, items.length-1); hiDrop(items); }
  else if(e.key === 'ArrowUp'){ e.preventDefault(); acHiIdx = Math.max(acHiIdx-1, 0); hiDrop(items); }
  else if(e.key === 'Enter' && acHiIdx >= 0){ e.preventDefault(); items[acHiIdx].dispatchEvent(new MouseEvent('mousedown')); }
  else if(e.key === 'Escape'){ closeDrop(catKey, idx); }
}

function hiDrop(items){ items.forEach((el,i) => el.classList.toggle('hi', i===acHiIdx)); }
function closeDrop(catKey, idx){ const d = document.getElementById('acdrop-'+catKey+'-'+idx); if(d) d.style.display='none'; }
function closeAllDrops(){ document.querySelectorAll('.ac-drop').forEach(d => d.style.display='none'); }
document.addEventListener('click', e => { if(!e.target.closest('.ac-wrap')) closeAllDrops(); });

function updateLogCPW(){
  let total = 0, count = 0;
  LOG_CATS.forEach(cat => {
    (logPieces[cat.key]||[]).forEach(p => {
      if(p.itemId){
        const it = logItemCache.find(i => i.id === p.itemId);
        if(it && it.wears > 0){ total += it.cpw; count++; }
      }
    });
  });
  const el = document.getElementById('log-cpw-preview');
  if(el) el.textContent = count > 0 ? 'CPU del conjunt: ' + total.toFixed(2) + '€' : '';
}

async function loadDayHistory(){
  const dateEl = document.getElementById('log-date');
  const container = document.getElementById('log-day-existing');
  if(!dateEl || !container) return;
  const date = dateEl.value;
  if(!date){ container.innerHTML = ''; return; }

  const allWears = await dbGetAll('wears');
  const dayWears = allWears.filter(w => w.date === date);
  if(!dayWears.length){ container.innerHTML = ''; return; }

  const groups = {};
  dayWears.forEach(w => {
    const gid = w.outfitId || ('leg-' + date);
    if(!groups[gid]) groups[gid] = {label: w.outfitLabel||'', pieces:[]};
    groups[gid].pieces.push(w);
  });

  const allItems = await dbGetAll('items');
  const iMap = {};
  allItems.forEach(it => iMap[it.id] = it);

  let html = '<div style="font-size:12px;text-transform:uppercase;letter-spacing:0.08em;color:var(--text3);margin-bottom:0.5rem;font-weight:500">Registrat — ' + formatDate(date) + '</div>';
  Object.entries(groups).forEach(([gid, g]) => {
    const names = g.pieces.map(w => {
      const it = iMap[w.itemId];
      return it ? it.brand + ' ' + it.name : (w.freeText || '?');
    }).join(' · ');

    let cpwTotal = 0, cpwN = 0;
    g.pieces.forEach(w => {
      const it = iMap[w.itemId];
      if(it && it.wears > 0){ cpwTotal += it.cpw; cpwN++; }
    });
    const cpwStr = cpwN > 0 ? 'CPU: ' + cpwTotal.toFixed(2) + '€' : '';
    const labelHtml = g.label ? '<div class="day-card-label">' + g.label + '</div>' : '';

    html += '<div class="day-card"><div class="day-card-top">'
      + '<div style="flex:1">' + labelHtml
      + '<div class="day-card-pieces">' + names + '</div>'
      + (cpwStr ? '<div class="day-card-cpw">' + cpwStr + '</div>' : '')
      + '</div>'
      + '<button class="day-card-del" data-delid="' + gid + '" data-deldate="' + date + '" title="Eliminar">&#215;</button>'
      + '</div></div>';
  });
  container.innerHTML = html;
  container.querySelectorAll('[data-delid]').forEach(btn => {
    btn.addEventListener('click', () => deleteOutfit(btn.dataset.delid, btn.dataset.deldate));
  });
}

async function deleteOutfit(outfitId, date){
  if(!confirm('Eliminar aquest conjunt registrat?')) return;
  const allWears = await dbGetAll('wears');
  const toDelete = allWears.filter(w => (w.outfitId || ('leg-' + w.date)) === outfitId);
  for(const w of toDelete){
    if(w.itemId){
      const it = await dbGet('items', w.itemId);
      if(it){
        it.wears = Math.max(0, (it.wears||1) - 1);
        it.cpw = it.wears > 0 ? it.totalCost / it.wears : it.totalCost;
        await dbPut('items', it);
        const ci = logItemCache.findIndex(i => i.id === it.id);
        if(ci >= 0) logItemCache[ci] = it;
      }
    }
    if(w.id !== undefined) await dbDelete('wears', w.id);
  }
  toast('Conjunt eliminat');
  await loadDayHistory();
  updateLogCPW();
  renderDashboard();
}

function clearLogForm(){
  LOG_CATS.forEach(c => { logPieces[c.key] = []; });
  logOcasioSelected = [];
  renderLogOcasioSelected();
  renderLogCats();
}

async function submitLog(){
  const date  = document.getElementById('log-date').value;
  const label = document.getElementById('log-label').value;
  if(!date){ toast('Selecciona una data'); return; }

  const allPieces = [];
  LOG_CATS.forEach(cat => {
    (logPieces[cat.key]||[]).forEach(p => {
      if(p.text.trim()) allPieces.push(Object.assign({}, p, {catKey:cat.key}));
    });
  });
  if(!allPieces.length){ toast('Afegeix almenys una peça'); return; }

  const outfitId = 'o' + Date.now();

  for(const p of allPieces){
    let itemId = p.itemId;
    if(p.ghost && !itemId){
      const gid = 'ghost_' + Date.now() + '_' + Math.random().toString(36).slice(2,6);
      const ghost = {
        id:gid, category:p.catKey, brand:'?', name:p.text, color:'?', type:'',
        seasons:[], formality:[], price:0, quantity:1, totalCost:0,
        units:[{id:'u1', purchaseDate:'', purchaseYear:'', retired:false, retiredDate:''}],
        wears:1, cpw:0, lastWorn:date,
        images:[], favourite:false, needsInfo:true, seeded:false, notes:'', purchaseYear:'', size:''
      };
      await dbPut('items', ghost);
      logItemCache.push(ghost);
      itemId = gid;
    } else if(itemId){
      const it = await dbGet('items', itemId);
      if(it){
        it.wears = (it.wears||0) + 1;
        it.cpw   = it.totalCost > 0 ? it.totalCost / it.wears : 0;
        if(!it.lastWorn || date > it.lastWorn) it.lastWorn = date;
        await dbPut('items', it);
        const ci = logItemCache.findIndex(i => i.id === itemId);
        if(ci >= 0) logItemCache[ci] = it;
      }
    }
    await dbAdd('wears', {date, itemId, outfitId, outfitLabel:label, ocasions:[...logOcasioSelected], freeText: p.ghost ? p.text : null, catKey:p.catKey, seeded:false});
  }

  const ghosts = allPieces.filter(p => p.ghost).length;
  toast('Conjunt registrat — ' + allPieces.length + ' peça' + (allPieces.length!==1?'ces':'ça') + ' ✓');
  clearLogForm();
  await loadDayHistory();
  renderDashboard();
  if(ghosts > 0) setTimeout(() => toast('⚠ ' + ghosts + ' peça nova — actualitza la informació a l\'armari'), 2800);
}
