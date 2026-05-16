'use strict';

// ════════════════════════════════════════
//  CATEGORY ICONS (placeholder for photos)
// ════════════════════════════════════════
// ── Color multi-select for forms ──
let itemColors=[];
let colorOptionsCache=[];

async function initColorSelector(existingColors){
  itemColors=existingColors?[...existingColors]:[];
  const allItems=await dbGetAll('items');
  const cs=new Set();
  allItems.forEach(it=>{
    const cols=Array.isArray(it.colors)?it.colors:(it.color?it.color.split(/\s+i\s+|,\s*/).map(c=>c.trim()).filter(Boolean):[]);
    cols.forEach(c=>{if(c)cs.add(c);});
  });
  colorOptionsCache=[...cs].sort();
  renderColorSelector();
}

function renderColorSelector(){
  // Update just the pills div — don't recreate the whole wrap (input stays focused)
  const pillsEl = document.getElementById('if-color-pills');
  if(!pillsEl) return;
  pillsEl.innerHTML = itemColors.map((c,i)=>
    '<span style="display:inline-flex;align-items:center;gap:3px;background:var(--bg2);border:1px solid var(--border);border-radius:100px;padding:2px 8px 2px 4px;font-size:12px">'
    +flowerSVG(c,11)+' '+esc(c)
    +'<span data-rmcolor="'+i+'" style="cursor:pointer;color:var(--text3);font-size:14px;line-height:1;margin-left:1px">&times;</span>'
    +'</span>'
  ).join('');
  pillsEl.querySelectorAll('[data-rmcolor]').forEach(btn=>{
    btn.addEventListener('click',()=>{itemColors.splice(parseInt(btn.dataset.rmcolor),1);renderColorSelector();});
  });
}

function showColorDrop(val){
  const drop=document.getElementById('if-color-drop');
  if(!drop) return;
  const q=val.toLowerCase().trim();
  const filtered=colorOptionsCache.filter(c=>!itemColors.includes(c)&&(!q||c.toLowerCase().includes(q))).slice(0,10);
  let html=filtered.map(c=>
    '<div class="ac-item" data-addcolor="'+esc(c)+'" style="display:flex;align-items:center;gap:8px">'+flowerSVG(c,14)+' '+esc(c)+'</div>'
  ).join('');
  if(val.trim()&&!colorOptionsCache.includes(val.trim())){
    html+='<div class="ac-item ac-ghost-item" data-addnewcolor="'+esc(val.trim())+'">+ Afegir "'+esc(val.trim())+'" com a color nou</div>';
  }
  drop.innerHTML=html||'<div style="padding:0.5rem 0.9rem;font-size:12px;color:var(--text3)">Cap resultat</div>';
  drop.style.display='block';
  drop.querySelectorAll('[data-addcolor]').forEach(el=>{
    el.addEventListener('mousedown',e=>{
      e.preventDefault();
      if(!itemColors.includes(el.dataset.addcolor)){itemColors.push(el.dataset.addcolor);}
      const inp=document.getElementById('if-color-input'); if(inp) inp.value='';
      drop.style.display='none'; renderColorSelector();
    });
  });
  drop.querySelectorAll('[data-addnewcolor]').forEach(el=>{
    el.addEventListener('mousedown',e=>{
      e.preventDefault();
      const c=el.dataset.addnewcolor;
      if(!itemColors.includes(c)){itemColors.push(c);}
      if(!colorOptionsCache.includes(c)){colorOptionsCache.push(c);colorOptionsCache.sort();}
      const inp=document.getElementById('if-color-input'); if(inp) inp.value='';
      drop.style.display='none'; renderColorSelector();
    });
  });
}

// Color drop closed via onblur timeout on input

// ══════════════════════════════════════════
//  BOOT & SEED
// ══════════════════════════════════════════
async function boot(){
  setBootProgress(10,'Obrint base de dades…');
  await openDB();
  setBootProgress(30,'Comprovant dades…');
  const seeded = await dbGet('meta','seeded');
  if(!seeded){
    setBootProgress(50,'Important peces de roba…');
    for(const raw of RAW_ITEMS){
      await dbPut('items', buildItem(raw));
    }
    setBootProgress(75,'Important registre de roba…');
    for(const w of RAW_WEARS){
      for(const itemId of w.items){
        await dbAdd('wears',{date:w.date, itemId, outfitLabel:'', seeded:true});
      }
    }
    // Set lastWorn + recalc wear counts from actual wear records
    await refreshLastWorn();
    await recalcWearCounts();
    await dbPut('meta',{key:'seeded', value:true, version:1});
    setBootProgress(90,'Finalitzant…');
  } else {
    setBootProgress(90,'Carregant dades…');
  }
  await migrateColorsToArrays();
  await loadOcasions();
  await bootExtras();
  setBootProgress(100,'Llest!');
  await new Promise(r=>setTimeout(r,300));
  document.getElementById('boot').style.opacity='0';
  setTimeout(()=>{ document.getElementById('boot').remove(); document.getElementById('main-nav').style.display='flex'; },400);
  await renderDashboard();
  await renderFooter();
  debugCheckData();
}

async function refreshLastWorn(){
  const wears = await dbGetAll('wears');
  const lastMap = {};
  for(const w of wears){
    if(!lastMap[w.itemId] || w.date > lastMap[w.itemId]) lastMap[w.itemId] = w.date;
  }
  for(const [id,date] of Object.entries(lastMap)){
    const item = await dbGet('items',id);
    if(item){ item.lastWorn = date; await dbPut('items',item); }
  }
}

async function recalcWearCounts(){
  const wears = await dbGetAll('wears');
  const counts = {};
  wears.forEach(w => { if(w.itemId) counts[w.itemId] = (counts[w.itemId]||0) + 1; });
  const items = await dbGetAll('items');
  for(const item of items){
    const realCount = counts[item.id] || 0;
    if(item.seeded && realCount !== item.wears){
      // Keep seeded wears count (from spreadsheet totals) — real wears = seeded count
      // But update lastWorn which we know from records
    }
    // For non-seeded items, wears = actual records
    if(!item.seeded){
      item.wears = realCount;
      item.cpw = item.totalCost > 0 && realCount > 0 ? item.totalCost / realCount : item.totalCost;
      await dbPut('items', item);
    }
  }
}

function setBootProgress(pct, msg){
  document.getElementById('boot-fill').style.width = pct+'%';
  document.getElementById('boot-msg').textContent = msg;
}

// ══════════════════════════════════════════
//  NAV / VIEW ROUTING
// ══════════════════════════════════════════
function showView(name, btn){
  document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('active'));
  document.getElementById('view-'+name).classList.add('active');
  if(btn && btn.classList.contains('nav-btn')) btn.classList.add('active');
  // Lazy render
  if(name==='wardrobe') renderWardrobe();
  if(name==='calendar') renderCalendar();
  if(name==='favourites') renderFavourites();
  if(name==='dashboard') renderDashboard();
  if(name==='log') initLogView();
  if(name==='outfits') initOutfitsView();
  if(name==='brands') renderBrands();
  if(name==='ocasions') initOcasionsView();
}

// ══════════════════════════════════════════
//  DASHBOARD
// ══════════════════════════════════════════
async function renderDashboard(){
  const now = new Date();
  const dayNames  = ['Diumenge','Dilluns','Dimarts','Dimecres','Dijous','Divendres','Dissabte'];
  const monthNames= ['gener','febrer','mar\u00e7','abril','maig','juny','juliol','agost','setembre','octubre','novembre','desembre'];
  getCached('dash-date-sub').textContent =
    `${dayNames[now.getDay()]}, ${now.getDate()} de ${monthNames[now.getMonth()]} de ${now.getFullYear()}`;

  const [allItems, allWears] = await Promise.all([dbGetAll('items'), dbGetAll('wears')]);
  const iMap = allItems.reduce((map,it)=>{ map[it.id] = it; return map; }, {});

  const totalItems = allItems.length;
  const totalWears = allWears.length;
  const needsCount = allItems.reduce((count,item)=>count + (item.needsInfo ? 1 : 0), 0);

  const itemsWithWears = allItems.filter(item => item.wears > 0 && item.totalCost > 0);
  const avgCPU = itemsWithWears.length > 0
    ? (itemsWithWears.reduce((sum,item)=>sum + item.cpw, 0) / itemsWithWears.length).toFixed(2)
    : '—';

  const wearsWithDate = allWears.filter(wear => wear.date);
  const sortedWears = [...wearsWithDate].sort((a,b)=>b.date.localeCompare(a.date));
  const lastWearDate = sortedWears.length ? formatDate(sortedWears[0].date) : '—';

  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
  const monthWears = wearsWithDate.filter(wear => wear.date.startsWith(currentMonthKey));
  const monthDays = new Set(monthWears.map(wear => wear.date)).size;
  const monthStats = computeMonthStats(monthWears, iMap);
  const monthAvgCPU = monthStats.average !== null ? `${monthStats.average.toFixed(2)}€` : '—';
  const monthLatestDate = monthStats.latestDate ? formatDate(monthStats.latestDate) : '—';

  const activeItems = allItems.filter(item => item.wears > 0 && !(item.units && item.units.every(u=>u.retired)));
  const highlights = selectHighlights(activeItems);
  const highlightsHTML = [
    highlights.mostWorn && highlightCardHTML(highlights.mostWorn, 'trophy', 'Més portada', item => `${item.wears} usos · CPU ${item.cpw.toFixed(2)}€`),
    highlights.leastWorn && highlightCardHTML(highlights.leastWorn, 'sleep', 'Menys portada', item => `${item.wears} us${item.wears===1?'':'os'} · CPU ${item.cpw.toFixed(2)}€`),
    highlights.longestAgo && highlightCardHTML(highlights.longestAgo, 'hourglass', 'Fa temps que no portes', item => `Últim cop: ${formatDate(item.lastWorn)}`)
  ].filter(Boolean).join('');

  getCached('dash-stats').innerHTML = buildStatStripHTML({ totalItems, avgCPU, lastWearDate, totalWears, monthDays });

  const highlightsContainer = getCached('dash-highlights');
  highlightsContainer.innerHTML = highlightsHTML;
  if (!highlightsContainer.dataset.delegateAttached) {
    highlightsContainer.addEventListener('click', event => {
      const card = event.target.closest('[data-itemid]');
      if (!card) return;
      const wardrobeButton = document.querySelector('.nav-btn[data-view="wardrobe"]');
      showView('wardrobe', wardrobeButton);
      setTimeout(() => openItemModal(card.dataset.itemid), 150);
    });
    highlightsContainer.dataset.delegateAttached = '1';
  }

  getCached('dash-month').innerHTML = buildMonthSummaryHTML({
    monthDays,
    monthAvgCPU,
    monthWearsCount: monthWears.length,
    monthLatestDate
  });

  renderCPUChart(wearsWithDate, iMap);

  const banner = getCached('dash-needsinfo-banner');
  if (needsCount > 0) {
    banner.style.display = 'flex';
    getCached('dash-needsinfo-text').textContent =
      `${needsCount} peça${needsCount !== 1 ? 's' : ''} necessiten informació`;

    const bannerButton = banner.querySelector('[data-needsinfo]');
    if (bannerButton && !bannerButton.dataset.listenerAttached) {
      bannerButton.addEventListener('click', () => {
        const wardrobeButton = document.querySelector('.nav-btn[data-view="wardrobe"]');
        showView('wardrobe', wardrobeButton);
        setTimeout(() => filterChip('needs_info'), 100);
      });
      bannerButton.dataset.listenerAttached = '1';
    }
  } else {
    banner.style.display = 'none';
  }
}


//  ITEM DETAIL MODAL
// ══════════════════════════════════════════
async function openItemModal(id){
  const item = await dbGet('items', id);
  if(!item) return;
  const modal = document.getElementById('item-modal-inner');
  const cpwStr = item.wears > 0 ? item.cpw.toFixed(2) + '\u20ac' : '\u2014';
  const seasons  = item.seasons.map(s => SEASON_LABELS[s]||s).join(', ') || 'Sense especificar';
  const formality= item.formality.map(f => FORMAL_LABELS[f]||f).join(', ') || 'Sense especificar';
  const lastWornStr = item.lastWorn ? formatDate(item.lastWorn) : (item.seeded&&item.wears>0 ? 'Dades importades' : 'Mai registrat');

  // All wear records for this item
  const wears = await dbGetIndex('wears','itemId',id);
  wears.sort((a,b) => b.date.localeCompare(a.date));

  // All wears to find companion pieces
  const allWears = await dbGetAll('wears');
  const allItems = await dbGetAll('items');
  const iMap = {};
  allItems.forEach(it => iMap[it.id] = it);

  // Wear history with companions (PENDENT 10)
  const wearHistHTML = wears.length > 0 ? (() => {
    const rows = wears.map(w => {
      // Find companions on same date (same outfitId if available, else same date)
      const companions = allWears.filter(ow =>
        ow.date === w.date &&
        ow.itemId !== id &&
        (w.outfitId ? ow.outfitId === w.outfitId : true)
      ).map(ow => {
        const it = iMap[ow.itemId];
        return it ? it.brand + ' ' + it.name : null;
      }).filter(Boolean);

      const companionStr = companions.length > 0
        ? '<div style="font-size:11px;color:var(--text3);margin-top:2px">amb: ' + companions.slice(0,4).join(', ') + (companions.length>4?' +' + (companions.length-4)+'...':'') + '</div>'
        : '';
      return '<div class="wh-chip" data-date="' + w.date + '" style="display:block;border-radius:var(--radius-sm);padding:0.4rem 0.65rem;margin-bottom:4px">'
        + '<span style="font-weight:500">' + formatDate(w.date) + '</span>'
        + companionStr
        + '</div>';
    });
    return '<div style="margin-top:1rem;padding-top:1rem;border-top:1px solid var(--border2)">'
      + '<div style="font-size:12px;text-transform:uppercase;letter-spacing:0.08em;color:var(--text3);margin-bottom:0.5rem;font-weight:500">Historial d\'usos (' + wears.length + ')</div>'
      + '<div style="max-height:220px;overflow-y:auto">' + rows.join('') + '</div>'
      + '</div>';
  })() : '';

  // Units HTML
  const units = item.units || [];
  const activeUnits = units.filter(u => !u.retired);
  const retiredUnits = units.filter(u => u.retired);
  let unitsHTML = '';
  if(units.length){
    const unitRows = units.map((u,i) =>
      '<div class="unit-row ' + (u.retired?'retired':'') + '">'
      + '<div><span class="unit-badge ' + (u.retired?'badge-retired':'badge-active') + '">' + (u.retired?'Retirada':'Activa') + '</span>'
      + '<div style="font-size:12px;color:var(--text3);margin-top:2px">Compra: ' + (u.purchaseDate?formatDate(u.purchaseDate):item.purchaseYear||'Desconegut') + '</div></div>'
      + '<div style="font-size:12px;color:var(--text3)">' + (u.retired?'Retirada: '+formatDate(u.retiredDate):'') + '</div>'
      + '<div class="unit-actions">' + (!u.retired?'<button class="unit-btn danger" data-retire="'+i+'">Retirar</button>':'') + '</div>'
      + '</div>'
    ).join('');
    unitsHTML = '<div style="margin-top:1rem;padding-top:1rem;border-top:1px solid var(--border2)">'
      + '<div style="font-size:12px;text-transform:uppercase;letter-spacing:0.08em;color:var(--text3);margin-bottom:0.5rem;font-weight:500">Unitats (' + activeUnits.length + ' actives' + (retiredUnits.length?', '+retiredUnits.length+' retirades':'') + ')</div>'
      + '<div class="unit-list">' + unitRows + '</div>'
      + '<button class="btn btn-secondary btn-sm" style="margin-top:0.6rem" data-addunit="1">+ Afegir unitat</button>'
      + '</div>';
  }

  modal.innerHTML = '<div class="modal-header"><div>'
    + '<div style="font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:var(--text3);margin-bottom:0.2rem">' + item.brand + ' \u00b7 ' + (CAT_LABELS[item.category]||item.category) + '</div>'
    + '<div class="modal-title">' + item.name + '</div>'
    + (()=>{
      const cols=Array.isArray(item.colors)&&item.colors.length?item.colors:(item.color?item.color.split(/\s+i\s+|,\s*/).map(c=>c.trim()).filter(Boolean):[item.color||'']);
      return '<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:0.3rem;align-items:center">'
        +cols.map(c=>colorPill(c)).join('')
        +(item.type?'<span style="color:var(--text3);font-size:13px;margin-left:4px">\u00b7 '+item.type+'</span>':'')
        +'</div>';
    })()
    + '</div><button class="modal-close" onclick="closeItemModal()">\u00d7</button></div>'
    + (()=>{
      const cols=Array.isArray(item.colors)&&item.colors.length?item.colors:(item.color?item.color.split(/\s+i\s+|,\s*/).map(c=>c.trim()).filter(Boolean):[]);
      return '<div class="detail-photo" style="display:flex;align-items:center;justify-content:center;background:var(--bg3)">'+catIconSVG(item.category,cols,80)+'</div>';
    })()
    + '<div class="detail-stats">'
    + '<div class="ds-item"><div class="ds-val">' + item.wears + '</div><div class="ds-lbl">Usos</div></div>'
    + '<div class="ds-item"><div class="ds-val">' + (item.totalCost>0?item.totalCost.toFixed(0)+'\u20ac':'\u2014') + '</div><div class="ds-lbl">Cost total</div></div>'
    + '<div class="ds-item"><div class="ds-val">' + cpwStr + '</div><div class="ds-lbl">Cost/\u00fas</div></div>'
    + '</div>'
    + '<div class="detail-row"><span class="detail-key">\u00daltima vegada portada</span><span class="detail-val">' + lastWornStr + '</span></div>'
    + '<div class="detail-row"><span class="detail-key">Preu unitari</span><span class="detail-val">' + (item.price>0?item.price.toFixed(2)+'\u20ac':'\u2014') + '</span></div>'
    + '<div class="detail-row"><span class="detail-key">Unitats actives / total</span><span class="detail-val">' + (item.quantity||1) + ' / ' + ((item.units||[0]).length||1) + '</span></div>'
    + '<div class="detail-row"><span class="detail-key">Estaci\u00f3</span><span class="detail-val">' + seasons + '</span></div>'
    + '<div class="detail-row"><span class="detail-key">Formalitat</span><span class="detail-val">' + formality + '</span></div>'
    + '<div class="detail-row"><span class="detail-key">Any de compra</span><span class="detail-val">' + (item.purchaseYear||'Desconegut') + '</span></div>'
    + '<div class="detail-row"><span class="detail-key">Talla</span><span class="detail-val">' + (item.size||'No registrada') + '</span></div>'
    + (item.notes?'<div class="detail-row"><span class="detail-key">Notes</span><span class="detail-val">'+item.notes+'</span></div>':'')
    + (item.needsInfo?'<div class="needs-banner" style="margin-top:1rem">\u26a0\ufe0f Aquesta pe\u00e7a necessita actualitzar la informaci\u00f3.</div>':'')
    + unitsHTML
    + wearHistHTML
    + '<div style="display:flex;gap:0.5rem;margin-top:1.5rem;flex-wrap:wrap">'
    + '<button class="chip ' + (item.favourite?'accent-on':'') + '" data-favbtn="1">' + (item.favourite?'\u2665 Preferit':'\u2661 Afegir als preferits') + '</button>'
    + '<button class="btn btn-secondary btn-sm" data-logwearbtn="1">+ Registrar ús avui</button>'
    + '<button class="btn btn-secondary btn-sm" data-editbtn="1">\u270e Editar</button>'
    + '<button class="btn btn-danger btn-sm" data-delbtn="1">Eliminar pe\u00e7a</button>'
    + '</div>';

  document.getElementById('item-modal').classList.add('open');

  // Attach events via JS (no inline onclick)
  modal.querySelector('[data-favbtn]').addEventListener('click', async function(){
    const it = await dbGet('items', id);
    it.favourite = !it.favourite;
    await dbPut('items', it);
    this.textContent = it.favourite ? '\u2665 Preferit' : '\u2661 Afegir als preferits';
    this.classList.toggle('accent-on', it.favourite);
    toast(it.favourite ? 'Afegit als preferits \u2665' : 'Eliminat dels preferits');
  });
  modal.querySelector('[data-logwearbtn]').addEventListener('click', async () => {
    const date = new Date().toISOString().split('T')[0];
    const it = await dbGet('items', id);
    if(!it) return;
    it.wears = (it.wears||0)+1;
    it.cpw = it.totalCost>0 ? it.totalCost/it.wears : 0;
    if(!it.lastWorn||date>it.lastWorn) it.lastWorn=date;
    await dbPut('items', it);
    await dbAdd('wears',{date, itemId:id, outfitId:null, outfitLabel:'', freeText:null, catKey:it.category, seeded:false});
    toast(it.brand+' '+it.name+' — ús registrat avui ✓');
    closeItemModal();
    renderDashboard();
  });
  modal.querySelector('[data-editbtn]').addEventListener('click', () => openEditItemModal(id));
  modal.querySelector('[data-delbtn]').addEventListener('click', () => confirmDeleteItem(id));
  modal.querySelectorAll('[data-retire]').forEach(btn => {
    btn.addEventListener('click', () => openRetireModal(id, parseInt(btn.dataset.retire)));
  });
  const addUnitBtn = modal.querySelector('[data-addunit]');
  if(addUnitBtn) addUnitBtn.addEventListener('click', () => addUnitToItem(id));

  // Wear history date chips -> open day modal
  modal.querySelectorAll('.wh-chip[data-date]').forEach(el => {
    el.addEventListener('click', () => {
      const [y,m] = el.dataset.date.split('-').map(Number);
      calYear = y; calMonth = m-1;
      closeItemModal();
      setTimeout(() => {
        showView('calendar', document.querySelector('.nav-btn[data-view="calendar"]'));
        setTimeout(() => openDayModal(el.dataset.date), 300);
      }, 150);
    });
  });
}
function closeItemModal(){ document.getElementById('item-modal').classList.remove('open'); }

async function toggleFav(id, btn){
  const item = await dbGet('items', id);
  if(!item) return;
  item.favourite = !item.favourite;
  await dbPut('items', item);
  btn.textContent = item.favourite ? '♥ Preferit' : '♡ Afegir als preferits';
  btn.classList.toggle('accent-on', item.favourite);
  toast(item.favourite ? 'Afegit als preferits ♥' : 'Eliminat dels preferits');
}


// ══════════════════════════════════════════
//  ITEM FORM — ADD / EDIT
// ══════════════════════════════════════════
let editingItemId = null;
let formUnits = []; // [{id, purchaseDate, purchaseYear, retired, retiredDate}]
let unitCounter = 0;

function openAddItemModal(){
  editingItemId = null;
  formUnits = [{id:'u'+(++unitCounter), purchaseDate:'', purchaseYear:'', retired:false, retiredDate:''}];
  document.getElementById('item-form-title').textContent = 'Nova peça';
  document.getElementById('item-form-submit').textContent = 'Desar peça';
  document.getElementById('item-form').reset();
  // Clear multiselects
  document.querySelectorAll('#if-seasons .ms-chip, #if-formality .ms-chip').forEach(c=>c.classList.remove('selected','sel-accent'));
  renderFormUnits();
  document.getElementById('item-form-modal').classList.add('open');
  setTimeout(hookCategorySelector, 50);
  initColorSelector([]);
}

async function openEditItemModal(id){
  const item = await dbGet('items', id);
  if(!item) return;
  editingItemId = id;
  formUnits = item.units ? JSON.parse(JSON.stringify(item.units)) : [{id:'u'+(++unitCounter), purchaseDate:item.purchaseYear?item.purchaseYear+'-01-01':'', purchaseYear:item.purchaseYear||'', retired:false, retiredDate:''}];

  document.getElementById('item-form-title').textContent = 'Editar peça';
  document.getElementById('item-form-submit').textContent = 'Desar canvis';

  document.getElementById('if-brand').value   = item.brand||'';
  document.getElementById('if-name').value    = item.name||'';
  // color handled by initColorSelector below
  document.getElementById('if-type').value    = item.type||'';
  // Init color selector with existing colors
  const existingColors = item.colors || (item.color ? item.color.split(/\s+i\s+|,\s*/).map(c=>c.trim()).filter(Boolean) : []);
  initColorSelector(existingColors);
  // Trigger type selector update after category is set
  setTimeout(() => {
    updateTypeSelector();
    const typeSelect = document.getElementById('if-type-select');
    const typeInput  = document.getElementById('if-type');
    if(typeSelect && item.type){
      const exists = Array.from(typeSelect.options).some(o => o.value === item.type);
      if(exists){ typeSelect.value = item.type; typeInput.style.display='none'; }
      else{ typeSelect.value='__custom__'; onTypeSelectChange(); typeInput.value=item.type; }
    }
  }, 50);
  document.getElementById('if-size').value    = item.size||'';
  document.getElementById('if-price').value   = item.price||'';
  document.getElementById('if-notes').value   = item.notes||'';
  document.getElementById('if-category').value= item.category||'';

  // Multi-selects
  document.querySelectorAll('#if-seasons .ms-chip').forEach(c=>{
    c.classList.toggle('selected', (item.seasons||[]).includes(c.dataset.val));
  });
  document.querySelectorAll('#if-formality .ms-chip').forEach(c=>{
    c.classList.toggle('selected', (item.formality||[]).includes(c.dataset.val));
  });

  renderFormUnits();
  closeItemModal();
  document.getElementById('item-form-modal').classList.add('open');
}


function closeItemFormModal(){
  document.getElementById('item-form-modal').classList.remove('open');
}

function toggleMS(chip){
  chip.classList.toggle('selected');
}

function getMultiSelectValues(containerId){
  return [...document.querySelectorAll(`#${containerId} .ms-chip.selected`)].map(c=>c.dataset.val);
}

// Unit rows in the form
function renderFormUnits(){
  const list = document.getElementById('if-units');
  if(!formUnits.length){ list.innerHTML='<div style="font-size:13px;color:var(--text3);padding:0.5rem 0">Cap unitat. Afegeix-ne almenys una.</div>'; return; }
  list.innerHTML = formUnits.map((u,i)=>`
    <div class="unit-row ${u.retired?'retired':''}">
      <div>
        <span class="unit-badge ${u.retired?'badge-retired':'badge-active'}">${u.retired?'Retirada':'Activa'}</span>
        <input class="form-input" style="margin-top:0.35rem;font-size:12px" type="date"
          value="${u.purchaseDate||''}"
          placeholder="Data de compra"
          onchange="formUnits[${i}].purchaseDate=this.value">
      </div>
      <div>
        ${u.retired?`<div style="font-size:11px;color:var(--text3)">Retirada: ${u.retiredDate||'—'}</div>`:''}
      </div>
      <div class="unit-actions">
        ${!u.retired && formUnits.filter(x=>!x.retired).length>1 ?
          `<button type="button" class="unit-btn danger" onclick="removeFormUnit(${i})">Eliminar</button>` : ''}
        ${u.retired?'':`<button type="button" class="unit-btn" onclick="retireFormUnit(${i})">Retirar</button>`}
      </div>
    </div>`).join('');
}

function addUnitRow(){
  formUnits.push({id:'u'+(++unitCounter), purchaseDate:'', purchaseYear:'', retired:false, retiredDate:''});
  renderFormUnits();
}

function removeFormUnit(i){
  formUnits.splice(i,1);
  renderFormUnits();
}

function retireFormUnit(i){
  // Quick inline retire (sets today's date)
  const today = new Date().toISOString().split('T')[0];
  formUnits[i].retired = true;
  formUnits[i].retiredDate = today;
  renderFormUnits();
  toast('Unitat marcada com a retirada');
}

async function submitItemForm(e){
  e.preventDefault();
  const brand    = document.getElementById('if-brand').value.trim();
  const name     = document.getElementById('if-name').value.trim();
  const color     = itemColors.join(', ');  // keep string for display compat
  const colors_arr = [...itemColors];
  const type     = getTypeValue();
  const category = document.getElementById('if-category').value;
  const size     = document.getElementById('if-size').value.trim();
  const price    = parseFloat(document.getElementById('if-price').value)||0;
  const notes    = document.getElementById('if-notes').value.trim();
  const seasons  = getMultiSelectValues('if-seasons');
  const formality= getMultiSelectValues('if-formality');

  // Units can all be retired — piece stays as archived in wardrobe

  const activeUnits  = formUnits.filter(u=>!u.retired).length;
  const totalUnits   = formUnits.length;
  const totalCost    = price * totalUnits;

  if(editingItemId){
    // Edit existing
    const existing = await dbGet('items', editingItemId);
    const wears = existing.wears||0;
    const cpw   = wears>0 ? totalCost/wears : totalCost;
    const updated = {...existing, brand, name, color, colors: colors_arr, type, category, size, price, notes,
      seasons, formality, units:formUnits, quantity:activeUnits, totalCost, cpw,
      purchaseYear: formUnits[0]?.purchaseDate?.slice(0,4)||existing.purchaseYear||''};
    await dbPut('items', updated);
    toast('Peça actualitzada ✓');
  } else {
    // New item
    const id = 'item_'+Date.now()+'_'+Math.random().toString(36).slice(2,7);
    const item = {
      id, brand, name, color, type, category, size, price, notes,
      seasons, formality, units:formUnits,
      quantity:activeUnits, totalCost, cpw:totalCost,
      wears:0, lastWorn:null,
      images:[], favourite:false, needsInfo:false, seeded:false,
      purchaseYear: formUnits[0]?.purchaseDate?.slice(0,4)||''
    };
    await dbPut('items', item);
    toast('Peça afegida a l\'armari ✓');
  }

  closeItemFormModal();
  renderWardrobe();
  renderDashboard();
}

async function addUnitToItem(itemId){
  const item = await dbGet('items', itemId);
  if(!item) return;
  const units = item.units||[];
  units.push({id:'u'+(++unitCounter), purchaseDate:'', purchaseYear:'', retired:false, retiredDate:''});
  item.units = units;
  item.quantity = units.filter(u=>!u.retired).length;
  item.totalCost = item.price * units.length;
  item.cpw = item.wears>0 ? item.totalCost/item.wears : item.totalCost;
  await dbPut('items', item);
  toast('Unitat afegida ✓');
  openItemModal(itemId);
}

// ══════════════════════════════════════════
// ══════════════════════════════════════════
let retireContext = {itemId:null, unitIndex:null};

function openRetireModal(itemId, unitIndex){
  retireContext = {itemId, unitIndex};
  document.getElementById('retire-date').value = new Date().toISOString().split('T')[0];
  document.getElementById('retire-modal').classList.add('open');
}
function closeRetireModal(){
  document.getElementById('retire-modal').classList.remove('open');
}
async function confirmRetire(){
  const {itemId, unitIndex} = retireContext;
  const item = await dbGet('items', itemId);
  if(!item||!item.units) return;
  item.units[unitIndex].retired = true;
  item.units[unitIndex].retiredDate = document.getElementById('retire-date').value;
  item.quantity = item.units.filter(u=>!u.retired).length;
  // CPW recalculation: total cost = price × ALL units ever (not just active)
  item.totalCost = item.price * item.units.length;
  item.cpw = item.wears>0 ? item.totalCost/item.wears : item.totalCost;
  await dbPut('items', item);
  closeRetireModal();
  toast('Unitat retirada. El CPU s\'ha recalculat.');
  openItemModal(itemId);
}

// ══════════════════════════════════════════
//  START
// ══════════════════════════════════════════
boot().catch(e=>{ console.error(e); document.getElementById('boot-msg').textContent='Error: '+e.message; });

// ════════════════════════════════════════
//  TRASH — paperera amb neteja 24h
// ════════════════════════════════════════
async function confirmDeleteItem(id){
  const item = await dbGet('items', id);
  if(!item) return;
  if(!confirm('Mou "' + item.brand + ' ' + item.name + '" a la paperera? Tens 24h per recuperar-la.')) return;

  // Move to trash
  item.deletedAt = Date.now();
  await dbPut('trash', item);

  // Remove from items + wears
  await dbDelete('items', id);
  closeItemModal();
  toast('Peça moguda a la paperera');
  renderWardrobe();
  renderDashboard();
}

async function cleanTrash(){
  const trashItems = await dbGetAll('trash');
  const cutoff = Date.now() - 24*60*60*1000;
  for(const it of trashItems){
    if(it.deletedAt < cutoff) await dbDelete('trash', it.id);
  }
}

async function restoreFromTrash(id){
  const item = await dbGet('trash', id);
  if(!item) return;
  delete item.deletedAt;
  await dbPut('items', item);
  await dbDelete('trash', id);
  toast('Peça restaurada \u2713');
  renderWardrobe();
  renderDashboard();
  renderTrashModal();
}

async function renderTrashModal(){
  const trashItems = await dbGetAll('trash');
  const modal = document.getElementById('item-modal-inner');
  if(!trashItems.length){
    modal.innerHTML = '<div class="modal-header"><div class="modal-title">Paperera</div><button class="modal-close" onclick="closeItemModal()">\u00d7</button></div>'
      + '<div class="empty" style="padding:2rem"><span class="empty-icon">🗑️</span><div class="empty-title">Paperera buida</div></div>';
    document.getElementById('item-modal').classList.add('open');
    return;
  }
  const now = Date.now();
  let html = '<div class="modal-header"><div class="modal-title">Paperera</div><button class="modal-close" onclick="closeItemModal()">\u00d7</button></div>'
    + '<p style="font-size:13px;color:var(--text3);margin-bottom:1rem">Les peces s\'eliminen definitivament passades 24h.</p>';
  trashItems.forEach(it => {
    const hoursLeft = Math.max(0, Math.ceil((it.deletedAt + 24*60*60*1000 - now) / 3600000));
    html += '<div class="detail-row"><span class="detail-key">' + it.brand + ' ' + it.name + '<br><span style="font-size:11px;color:var(--text3)">Expira en ' + hoursLeft + 'h</span></span>'
      + '<button class="btn btn-secondary btn-sm" data-restore="' + it.id + '">Restaurar</button></div>';
  });
  modal.innerHTML = html;
  document.getElementById('item-modal').classList.add('open');
  modal.querySelectorAll('[data-restore]').forEach(btn => {
    btn.addEventListener('click', () => restoreFromTrash(btn.dataset.restore));
  });
}

// ════════════════════════════════════════
//  EXPORT / IMPORT JSON
// ════════════════════════════════════════
async function exportData(){
  const items = await dbGetAll('items');
  const wears = await dbGetAll('wears');
  const meta  = await dbGetAll('meta');
  const data = {version:2, exportedAt: new Date().toISOString(), items, wears, meta};
  const blob = new Blob([JSON.stringify(data, null, 2)], {type:'application/json'});
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url;
  a.download = 'roba_backup_' + new Date().toISOString().slice(0,10) + '.json';
  a.click();
  URL.revokeObjectURL(url);
  toast('Backup exportat \u2713');
}

async function importData(file){
  if(!file) return;
  const text = await file.text();
  let data;
  try { data = JSON.parse(text); } catch(e){ toast('Error: fitxer JSON invàlid'); return; }
  if(!data.items || !data.wears){ toast('Error: format de backup no reconegut'); return; }
  if(!confirm('Importar aquest backup? Les dades actuals es mantindran i s\'afegiran les noves.')) return;

  let added = 0;
  for(const item of data.items){
    const existing = await dbGet('items', item.id);
    if(!existing){ await dbPut('items', item); added++; }
  }
  // Deduplicate wears: skip if same date+itemId+outfitId already exists
  const existingWears = await dbGetAll('wears');
  const wearKeys = new Set(existingWears.map(w => w.date + '|' + (w.itemId||'') + '|' + (w.outfitId||'')));
  let wearsAdded = 0;
  for(const wear of data.wears){
    const key = wear.date + '|' + (wear.itemId||'') + '|' + (wear.outfitId||'');
    if(!wearKeys.has(key)){
      const {id, ...wearData} = wear;
      await dbAdd('wears', wearData);
      wearKeys.add(key);
      wearsAdded++;
    }
  }
  toast(added + ' peces i ' + wearsAdded + ' registres importats \u2713');
  renderWardrobe();
  renderDashboard();
}

// ════════════════════════════════════════
//  DEBUG — read-only data health checks
// ════════════════════════════════════════
async function debugCheckData(){
  if(!db) await openDB();

  const [items, wears, outfits, meta, trash] = await Promise.all([
    dbGetAll('items'),
    dbGetAll('wears'),
    dbGetAll('outfits'),
    dbGetAll('meta'),
    dbGetAll('trash')
  ]);

  const warnings = [];
  const addWarning = (type, id, message, extra) => {
    warnings.push({type, id: id || '', message, extra: extra || null});
  };
  const isNum = value => typeof value === 'number' && Number.isFinite(value);
  const approx = (a, b) => Math.abs((a || 0) - (b || 0)) < 0.01;
  const itemMap = new Map();

  items.forEach(item => {
    if(!item || !item.id){
      addWarning('item.missingId', '', 'Item without an id', item);
      return;
    }

    itemMap.set(item.id, item);

    ['brand','name','category','type'].forEach(field => {
      if(typeof item[field] !== 'string') addWarning('item.fieldType', item.id, field + ' should be a string');
    });
    ['seasons','formality','units','images'].forEach(field => {
      if(!Array.isArray(item[field])) addWarning('item.fieldType', item.id, field + ' should be an array');
    });
    ['price','quantity','totalCost','wears','cpw'].forEach(field => {
      if(!isNum(item[field])) addWarning('item.fieldType', item.id, field + ' should be a number');
    });

    if(!item.color && (!Array.isArray(item.colors) || !item.colors.length)){
      addWarning('item.color', item.id, 'Item has neither legacy color nor colors array');
    }
    if(item.colors !== undefined && !Array.isArray(item.colors)){
      addWarning('item.colors', item.id, 'colors exists but is not an array');
    }

    if(Array.isArray(item.units)){
      item.units.forEach((unit, index) => {
        if(!unit || typeof unit !== 'object') addWarning('unit.shape', item.id, 'Unit ' + index + ' is not an object');
        else if(typeof unit.retired !== 'boolean') addWarning('unit.retired', item.id, 'Unit ' + (unit.id || index) + ' retired should be boolean');
      });

      const expectedTotalCost = (item.price || 0) * item.units.length;
      const activeUnits = item.units.filter(unit => unit && !unit.retired).length;
      if(isNum(item.totalCost) && !approx(item.totalCost, expectedTotalCost)){
        addWarning('item.totalCost', item.id, 'totalCost does not match price * total units', {stored:item.totalCost, expected:expectedTotalCost});
      }
      if(isNum(item.quantity) && item.quantity !== activeUnits){
        addWarning('item.quantity', item.id, 'quantity does not match active units', {stored:item.quantity, expected:activeUnits});
      }
    }

    if(isNum(item.wears) && isNum(item.totalCost) && isNum(item.cpw) && item.wears > 0){
      const expectedCpw = item.totalCost > 0 ? item.totalCost / item.wears : 0;
      if(!approx(item.cpw, expectedCpw)){
        addWarning('item.cpw', item.id, 'cpw does not match totalCost / wears', {stored:item.cpw, expected:expectedCpw});
      }
    }
  });

  wears.forEach(wear => {
    if(!wear || typeof wear !== 'object'){
      addWarning('wear.shape', '', 'Wear record is not an object', wear);
      return;
    }
    if(!wear.date || typeof wear.date !== 'string'){
      addWarning('wear.date', wear.id, 'Wear record has no date string');
    }
    if(!wear.itemId){
      addWarning('wear.itemId', wear.id, 'Wear record has no itemId');
    } else if(!itemMap.has(wear.itemId)){
      addWarning('wear.missingItem', wear.id, 'Wear references a missing item', {itemId:wear.itemId, date:wear.date});
    }
    if(wear.ocasions !== undefined && !Array.isArray(wear.ocasions)){
      addWarning('wear.ocasions', wear.id, 'ocasions should be an array when present');
    }
  });

  outfits.forEach(outfit => {
    if(!outfit || !outfit.id){
      addWarning('outfit.missingId', '', 'Outfit without an id', outfit);
      return;
    }
    if(!Array.isArray(outfit.pieces)){
      addWarning('outfit.pieces', outfit.id, 'Outfit pieces should be an array');
      return;
    }
    outfit.pieces.forEach(piece => {
      if(!piece.itemId) addWarning('outfit.pieceItem', outfit.id, 'Outfit piece has no itemId', piece);
      else if(!itemMap.has(piece.itemId)) addWarning('outfit.missingItem', outfit.id, 'Outfit references a missing item', piece);
    });
  });

  meta.forEach(record => {
    if(!record || typeof record.key !== 'string'){
      addWarning('meta.key', '', 'Meta record has no string key', record);
    }
    if(record && record.key === 'ocasions' && !Array.isArray(record.value)){
      addWarning('meta.ocasions', 'ocasions', 'Ocasions meta value should be an array');
    }
  });

  trash.forEach(item => {
    if(!item || !item.id) addWarning('trash.missingId', '', 'Trash item has no id', item);
    if(!isNum(item && item.deletedAt)) addWarning('trash.deletedAt', item && item.id, 'Trash item has no numeric deletedAt');
  });

  const byType = warnings.reduce((acc, warning) => {
    acc[warning.type] = (acc[warning.type] || 0) + 1;
    return acc;
  }, {});
  const result = {
    ok: warnings.length === 0,
    counts: {
      items: items.length,
      wears: wears.length,
      outfits: outfits.length,
      meta: meta.length,
      trash: trash.length
    },
    warningCount: warnings.length,
    byType,
    warnings
  };

  console.groupCollapsed('ROBA data check: ' + (result.ok ? 'OK' : warnings.length + ' warning(s)'));
  console.table(result.counts);
  if(warnings.length) console.table(warnings);
  console.groupEnd();

  return result;
}

window.robaDebug = Object.assign(window.robaDebug || {}, {
  checkData: debugCheckData,
  item: async (id) => {
    const it = await dbGet('items', id);
    console.log(it || 'Not found: ' + id);
    return it;
  },
  items: async (filter) => {
    const all = await dbGetAll('items');
    const result = filter ? all.filter(filter) : all;
    console.table(result.map(it => ({id:it.id, brand:it.brand, name:it.name, category:it.category, wears:it.wears, cpw:it.cpw?.toFixed(2)})));
    return result;
  },
  wears: async (itemId) => {
    const all = await dbGetAll('wears');
    const result = itemId ? all.filter(w => w.itemId === itemId) : all;
    console.table(result);
    return result;
  },
  stats: async () => {
    const [items, wears, outfits, trash] = await Promise.all([dbGetAll('items'), dbGetAll('wears'), dbGetAll('outfits'), dbGetAll('trash')]);
    const s = {
      items: items.length,
      wears: wears.length,
      outfits: outfits.length,
      trash: trash.length,
      totalCost: items.reduce((s,it) => s + (it.totalCost||0), 0).toFixed(2),
      avgCpw: (items.reduce((s,it) => s + (it.cpw||0), 0) / (items.length||1)).toFixed(2),
    };
    console.table(s);
    return s;
  }
});

// ════════════════════════════════════════
//  ITEM FORM — TYPE SELECTOR per categoria
// ════════════════════════════════════════
function hookCategorySelector(){
  const catSel = document.getElementById('if-category');
  if(catSel && !catSel._hooked){
    catSel._hooked = true;
    catSel.addEventListener('change', updateTypeSelector);
  }
}

function updateTypeSelector(){
  const cat = document.getElementById('if-category')?.value;
  const typeInput = document.getElementById('if-type');
  const typeSelect = document.getElementById('if-type-select');
  if(!typeInput || !typeSelect) return;

  if(!cat || !TYPES_BY_CAT[cat]){
    typeInput.value = '';
    typeInput.placeholder = 'Selecciona una categoria primer…';
    typeInput.readOnly = true;
    typeInput.style.background = 'var(--bg3)';
    typeInput.style.cursor = 'not-allowed';
    typeSelect.style.display = 'none';
    return;
  }

  // Build select options
  typeSelect.innerHTML = '<option value="">— Selecciona tipus —</option>';
  TYPES_BY_CAT[cat].forEach(t => {
    const o = document.createElement('option');
    o.value = t; o.textContent = t;
    typeSelect.appendChild(o);
  });
  // Add custom option
  const custom = document.createElement('option');
  custom.value = '__custom__'; custom.textContent = '+ Escriure personalitzat…';
  typeSelect.appendChild(custom);

  typeSelect.style.display = 'block';
  typeInput.style.display = 'none';
}

function onTypeSelectChange(){
  const typeSelect = document.getElementById('if-type-select');
  const typeInput = document.getElementById('if-type');
  if(!typeSelect || !typeInput) return;
  if(typeSelect.value === '__custom__'){
    typeInput.style.display = 'block';
    typeInput.readOnly = false;
    typeInput.style.background = '';
    typeInput.style.cursor = '';
    typeInput.value = '';
    typeInput.placeholder = 'Escriu el tipus…';
    typeInput.focus();
  } else {
    typeInput.value = typeSelect.value;
    typeInput.style.display = 'none';
  }
}

function getTypeValue(){
  const typeSelect = document.getElementById('if-type-select');
  const typeInput = document.getElementById('if-type');
  if(typeSelect && typeSelect.style.display !== 'none' && typeSelect.value && typeSelect.value !== '__custom__'){
    return typeSelect.value;
  }
  return typeInput?.value?.trim() || '';
}

// ════════════════════════════════════════
//  SETTINGS / TRASH button in nav
// ════════════════════════════════════════
// Run trash cleanup on boot
async function bootExtras(){
  await cleanTrash();
}


