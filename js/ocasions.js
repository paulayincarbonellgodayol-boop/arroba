// ════════════════════════════════════════
//  OCASIONS
// ════════════════════════════════════════

const OCASIONS_PRESET = [
  'Treball','Casual','Cap de setmana','Nit de festa','Sopar',
  'Viatge','Platja/Piscina','Esport','Esdeveniment formal',
  'Casament','Cita','Casa','Classe'
];

// Ocasions state: stored in meta store as JSON
let ocasionsList = [];    // [{id, name, preset}]
let logOcasioSelected = [];  // names selected in log form

async function loadOcasions(){
  const meta = await dbGet('meta','ocasions');
  if(meta && meta.value){
    ocasionsList = meta.value;
  } else {
    // First time: init with presets
    ocasionsList = OCASIONS_PRESET.map((name,i) => ({id:'oc'+i, name, preset:true}));
    await dbPut('meta',{key:'ocasions', value:ocasionsList});
  }
}

async function saveOcasions(){
  await dbPut('meta',{key:'ocasions', value:ocasionsList});
}

async function initOcasionsView(){
  await loadOcasions();
  // Collect all ocasions used in wears (auto-create from tags)
  const allWears = await dbGetAll('wears');
  const usedOcasions = new Set();
  allWears.forEach(w => {
    if(w.ocasions) w.ocasions.forEach(o => usedOcasions.add(o));
  });
  // Add any used ocasion not in list
  usedOcasions.forEach(name => {
    if(!ocasionsList.find(o=>o.name===name)){
      ocasionsList.push({id:'oc_'+Date.now()+'_'+Math.random().toString(36).slice(2,5), name, preset:false});
    }
  });
  await saveOcasions();

  document.getElementById('ocasions-main').style.display = 'block';
  document.getElementById('ocasions-detail').style.display = 'none';
  renderOcasionsGrid(allWears);
}

function ocasionColors(){
  const palette = ['#C8622A','#1A6B8C','#2A7A3A','#8B3DA5','#B87A10','#1A3A5C','#A32020','#2A5A8C','#6A4A2A','#3A6A4A'];
  return palette;
}

function renderOcasionsGrid(allWears){
  const grid = document.getElementById('ocasions-grid');
  if(!grid) return;
  const palette = ocasionColors();

  // Count outfits per ocasio
  const counts = {};
  allWears.forEach(w => {
    if(w.ocasions) w.ocasions.forEach(o => { counts[o] = (counts[o]||0) + 1; });
  });

  if(!ocasionsList.length){
    grid.innerHTML = '<div class="empty"><div class="empty-title">Cap ocasi\u00f3 encara</div><p>Crea la primera ocasi\u00f3 o registra un outfit amb una etiqueta.</p></div>';
    return;
  }

  grid.innerHTML = ocasionsList.map((oc, idx) => {
    const col = palette[idx % palette.length];
    const n = counts[oc.name] || 0;
    return '<div class="ocasio-card" data-ocname="' + esc(oc.name) + '">'
      + '<button class="ocasio-del" data-deloc="' + esc(oc.id) + '" title="Eliminar">\u00d7</button>'
      + '<div style="display:flex;align-items:center;margin-bottom:0.35rem">'
      + '<span class="ocasio-dot" style="background:' + col + '"></span>'
      + '<div class="ocasio-name">' + esc(oc.name) + '</div>'
      + '</div>'
      + '<div class="ocasio-count">' + n + ' outfit' + (n!==1?'s':'') + '</div>'
      + '</div>';
  }).join('');

  // Click to open detail
  grid.querySelectorAll('.ocasio-card').forEach(card => {
    card.addEventListener('click', e => {
      if(e.target.closest('[data-deloc]')) return;
      openOcasioDetail(card.dataset.ocname, allWears);
    });
  });
  // Delete
  grid.querySelectorAll('[data-deloc]').forEach(btn => {
    btn.addEventListener('click', async e => {
      e.stopPropagation();
      const id = btn.dataset.deloc;
      const oc = ocasionsList.find(o=>o.id===id);
      if(!oc) return;
      if(!confirm('Eliminar l\u0027ocasi\u00f3 "' + oc.name + '"? Els outfits no es perdran.')) return;
      ocasionsList = ocasionsList.filter(o=>o.id!==id);
      await saveOcasions();
      initOcasionsView();
    });
  });
}

async function openOcasioDetail(ocasioName, allWears){
  document.getElementById('ocasions-main').style.display = 'none';
  document.getElementById('ocasions-detail').style.display = 'block';
  document.getElementById('ocasions-detail-title').textContent = ocasioName;

  const matching = allWears.filter(w => w.ocasions && w.ocasions.includes(ocasioName));
  document.getElementById('ocasions-detail-count').textContent = matching.length + ' registre' + (matching.length!==1?'s':'');

  // Group by outfitId
  const groups = {};
  matching.forEach(w => {
    const gid = w.outfitId || ('leg-'+w.date);
    if(!groups[gid]) groups[gid] = {date:w.date, outfitId:gid, label:w.outfitLabel||'', items:[]};
    if(w.itemId) groups[gid].items.push(w.itemId);
  });

  const allItems = await dbGetAll('items');
  const iMap = {};
  allItems.forEach(it => iMap[it.id]=it);

  const grid = document.getElementById('ocasions-outfits-grid');
  const sorted = Object.values(groups).sort((a,b)=>b.date.localeCompare(a.date));

  if(!sorted.length){
    grid.innerHTML = '<div class="empty"><div class="empty-title">Cap outfit registrat per aquesta ocasi\u00f3</div></div>';
    return;
  }

  grid.innerHTML = sorted.map(g => {
    const cols = Array.isArray(g.items) ? g.items : [];
    const cats = [...new Set(cols.map(id=>iMap[id]?.category).filter(Boolean))];
    // Icon placeholder
    const firstItem = iMap[cols[0]];
    const iconColors = firstItem && Array.isArray(firstItem.colors) && firstItem.colors.length ? firstItem.colors : [];
    const iconHTML = firstItem ? catIconSVG(firstItem.category, iconColors, 40) : '';
    const names = cols.map(id=>iMap[id]?iMap[id].brand+' '+iMap[id].name:'?').join(' \u00b7 ');
    return '<div class="item-card" style="cursor:pointer" data-gdate="' + g.date + '">'
      + '<div class="ic-photo" style="display:flex;align-items:center;justify-content:center;background:var(--bg3)">' + iconHTML + '</div>'
      + '<div class="ic-brand">' + formatDate(g.date) + (g.label?' \u00b7 '+g.label:'') + '</div>'
      + '<div class="ic-name" style="font-size:13px">' + (names.length > 60 ? names.slice(0,57)+'\u2026' : names) + '</div>'
      + '</div>';
  }).join('');

  grid.querySelectorAll('[data-gdate]').forEach(card => {
    card.addEventListener('click', () => {
      const d = card.dataset.gdate;
      const [y,m] = d.split('-').map(Number);
      calYear=y; calMonth=m-1;
      showView('calendar', document.querySelector('.nav-btn[data-view="calendar"]'));
      setTimeout(()=>openDayModal(d), 300);
    });
  });
}

function closeOcasioDetail(){
  document.getElementById('ocasions-main').style.display = 'block';
  document.getElementById('ocasions-detail').style.display = 'none';
}

async function addOcasio(){
  const input = document.getElementById('ocasio-new-input');
  const name = input?.value?.trim();
  if(!name){ toast('Escriu el nom de l\u0027ocasi\u00f3'); return; }
  await loadOcasions();
  if(ocasionsList.find(o=>o.name.toLowerCase()===name.toLowerCase())){
    toast('Aquesta ocasi\u00f3 ja existeix'); return;
  }
  ocasionsList.push({id:'oc_'+Date.now(), name, preset:false});
  await saveOcasions();
  if(input) input.value='';
  initOcasionsView();
  toast('Ocasi\u00f3 "'+name+'" creada \u2713');
}

function showOcasioDrop(val){
  const drop = document.getElementById('ocasio-new-drop');
  if(!drop) return;
  const q = (val||'').toLowerCase();
  const matches = ocasionsList.filter(o=>!q||o.name.toLowerCase().includes(q)).slice(0,8);
  if(!matches.length){ drop.style.display='none'; return; }
  drop.innerHTML = matches.map(o=>
    '<div class="ac-item" data-ocpick="'+esc(o.name)+'">' + esc(o.name) + '</div>'
  ).join('');
  drop.style.display = 'block';
  drop.querySelectorAll('[data-ocpick]').forEach(el=>{
    el.addEventListener('mousedown', e=>{
      e.preventDefault();
      const inp = document.getElementById('ocasio-new-input');
      if(inp) inp.value = el.dataset.ocpick;
      drop.style.display='none';
    });
  });
}

// ── Log form ocasio ──
function showLogOcasioDrop(val){
  const drop = document.getElementById('log-ocasio-drop');
  if(!drop) return;
  const q = (val||'').toLowerCase();
  const matches = ocasionsList.filter(o=>
    !logOcasioSelected.includes(o.name) &&
    (!q || o.name.toLowerCase().includes(q))
  ).slice(0,8);

  let html = matches.map(o=>
    '<div class="ac-item" data-logocpick="'+esc(o.name)+'">' + esc(o.name) + '</div>'
  ).join('');

  if(val.trim() && !ocasionsList.find(o=>o.name.toLowerCase()===val.trim().toLowerCase())){
    html += '<div class="ac-ghost-item" data-logocnew="'+esc(val.trim())+'">+ Crear "'+esc(val.trim())+'"</div>';
  }

  drop.innerHTML = html || '<div style="padding:0.5rem;font-size:12px;color:var(--text3)">Cap resultat</div>';
  drop.style.display = html ? 'block' : 'none';

  drop.querySelectorAll('[data-logocpick]').forEach(el=>{
    el.addEventListener('mousedown', e=>{
      e.preventDefault();
      addLogOcasio(el.dataset.logocpick);
    });
  });
  drop.querySelectorAll('[data-logocnew]').forEach(el=>{
    el.addEventListener('mousedown', async e=>{
      e.preventDefault();
      const name = el.dataset.logocnew;
      await loadOcasions();
      if(!ocasionsList.find(o=>o.name.toLowerCase()===name.toLowerCase())){
        ocasionsList.push({id:'oc_'+Date.now(), name, preset:false});
        await saveOcasions();
      }
      addLogOcasio(name);
    });
  });
}

function addLogOcasio(name){
  if(!logOcasioSelected.includes(name)) logOcasioSelected.push(name);
  const inp = document.getElementById('log-ocasio-input');
  if(inp) inp.value='';
  const drop = document.getElementById('log-ocasio-drop');
  if(drop) drop.style.display='none';
  renderLogOcasioSelected();
}

function renderLogOcasioSelected(){
  const el = document.getElementById('log-ocasio-selected');
  if(!el) return;
  el.innerHTML = logOcasioSelected.map((name,i)=>
    '<span style="display:inline-flex;align-items:center;gap:3px;background:var(--bg2);border:1px solid var(--border);border-radius:100px;padding:2px 8px 2px 7px;font-size:12px">'
    + esc(name)
    + '<span data-rmoc="'+i+'" style="cursor:pointer;color:var(--text3);font-size:14px;line-height:1;margin-left:2px">&times;</span>'
    + '</span>'
  ).join('');
  el.querySelectorAll('[data-rmoc]').forEach(btn=>{
    btn.addEventListener('click',()=>{ logOcasioSelected.splice(parseInt(btn.dataset.rmoc),1); renderLogOcasioSelected(); });
  });
}
