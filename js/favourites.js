'use strict';

// ══════════════════════════════════════════
//  FAVOURITES — rendering
//  Depends on: app.js globals (dbGetAll, openItemModal, wearSavedOutfit,
//              CAT_LABELS), utils.js (catIconSVG, esc, formatDate)
//  Loaded before app.js; all calls happen at runtime only.
// ══════════════════════════════════════════

async function renderFavourites(){
  await renderFavItems();
  await renderFavOutfits();
}

function switchFavTab(tab, btn){
  document.querySelectorAll('#fav-tab-items,#fav-tab-outfits').forEach(b=>b.classList.remove('on'));
  btn.classList.add('on');
  document.getElementById('fav-items-section').style.display   = tab==='items'   ? 'block' : 'none';
  document.getElementById('fav-outfits-section').style.display = tab==='outfits' ? 'block' : 'none';
}

async function renderFavItems(){
  const items = (await dbGetAll('items')).filter(i=>i.favourite);
  const grid  = document.getElementById('fav-grid');
  const empty = document.getElementById('fav-empty');
  if(!items.length){ grid.innerHTML=''; empty.style.display='block'; return; }
  empty.style.display='none';
  grid.innerHTML = items.map(item =>
    '<div class="item-card favourite" data-id="'+item.id+'">'
    +(()=>{ const cols=Array.isArray(item.colors)&&item.colors.length?item.colors:(item.color?item.color.split(/\s+i\s+|,\s*/).map(c=>c.trim()).filter(Boolean):[]); return '<div class="ic-photo" style="display:flex;align-items:center;justify-content:center;background:var(--bg3)">'+catIconSVG(item.category,cols,56)+'</div>'; })()
    +'<div class="ic-brand">'+item.brand+'</div>'
    +'<div class="ic-name">'+item.name+' · '+item.color+'</div>'
    +'<div class="ic-pills"><span class="pill pill-cat">'+(CAT_LABELS[item.category]||item.category)+'</span>'+(item.type?'<span class="pill pill-type">'+item.type+'</span>':'')+'</div>'
    +'<div class="ic-stats">'
    +'<div class="ic-stat"><div class="ic-stat-val">'+item.wears+'</div><div class="ic-stat-lbl">Usos</div></div>'
    +'<div class="ic-stat"><div class="ic-stat-val">'+(item.totalCost>0?item.totalCost.toFixed(0)+'€':'—')+'</div><div class="ic-stat-lbl">Cost total</div></div>'
    +'<div class="ic-stat"><div class="ic-stat-val">'+(item.wears>0?item.cpw.toFixed(2)+'€':'—')+'</div><div class="ic-stat-lbl">CPU</div></div>'
    +'</div></div>'
  ).join('');
  grid.querySelectorAll('.item-card[data-id]').forEach(card =>
    card.addEventListener('click', () => openItemModal(card.dataset.id))
  );
}

async function renderFavOutfits(){
  const outfits = (await dbGetAll('outfits')).filter(o=>o.favourite);
  const allItems = await dbGetAll('items');
  const iMap = {};
  allItems.forEach(it => iMap[it.id]=it);
  const grid  = document.getElementById('fav-outfits-grid');
  const empty = document.getElementById('fav-outfits-empty');
  if(!outfits.length){ grid.innerHTML=''; empty.style.display='block'; return; }
  empty.style.display='none';
  grid.innerHTML = outfits.map(o => {
    const names = o.pieces.map(p=>{const it=iMap[p.itemId]; return it?it.brand+' '+it.name:p.text;}).join(' · ');
    return '<div class="day-card" style="margin-bottom:0.75rem">'
      +'<div class="day-card-top"><div style="flex:1">'
      +'<div style="font-weight:600;font-size:14px;margin-bottom:0.25rem">★ '+esc(o.name)+'</div>'
      +'<div class="day-card-pieces">'+names+'</div>'
      +'<div class="day-card-cpw">'+(o.wears||0)+' cops · '+(o.lastWorn?formatDate(o.lastWorn):'—')+'</div>'
      +'</div>'
      +'<button class="btn btn-primary btn-sm" style="font-size:11px" data-wearfav="'+o.id+'">Registrar avui</button>'
      +'</div></div>';
  }).join('');
  grid.querySelectorAll('[data-wearfav]').forEach(btn =>
    btn.addEventListener('click', () => wearSavedOutfit(btn.dataset.wearfav))
  );
}
