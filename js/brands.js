'use strict';

// ══════════════════════════════════════════
//  BRANDS — rendering
//  Depends on: app.js globals (dbGetAll, showView, renderWardrobe,
//              wrdActiveFilters, updateBadge, esc)
//  Loaded before app.js; all calls happen at runtime only.
// ══════════════════════════════════════════

async function renderBrands(){
  document.getElementById('brands-grid').innerHTML = '<div style="padding:1rem;color:var(--text3)">Carregant…</div>';
  const allItems = await dbGetAll('items');
  const sort = document.getElementById('brands-sort')?.value||'wears';
  const brandMap = {};
  allItems.forEach(it=>{
    if(!brandMap[it.brand]) brandMap[it.brand]={name:it.brand,items:0,wears:0,cost:0,cpwSum:0,cpwN:0};
    const b=brandMap[it.brand];
    b.items++; b.wears+=it.wears; b.cost+=it.totalCost||0;
    if(it.wears>0){b.cpwSum+=it.cpw;b.cpwN++;}
  });
  let brands=Object.values(brandMap);
  if(sort==='wears') brands.sort((a,b)=>b.wears-a.wears);
  else if(sort==='items') brands.sort((a,b)=>b.items-a.items);
  else if(sort==='cost') brands.sort((a,b)=>b.cost-a.cost);
  else if(sort==='cpw') brands.sort((a,b)=>(a.cpwN?a.cpwSum/a.cpwN:9999)-(b.cpwN?b.cpwSum/b.cpwN:9999));
  else brands.sort((a,b)=>a.name.localeCompare(b.name,'ca'));

  document.getElementById('brands-grid').innerHTML = brands.map(b=>{
    const avgCPW = b.cpwN>0?(b.cpwSum/b.cpwN).toFixed(2)+'€':'—';
    return '<div class="brand-card" onclick="filterByBrand(\''+esc(b.name)+'\')">'
      +'<div class="brand-name">'+esc(b.name)+'</div>'
      +'<div class="brand-stats">'
      +'<div class="brand-stat"><div class="brand-stat-val">'+b.items+'</div><div class="brand-stat-lbl">Peces</div></div>'
      +'<div class="brand-stat"><div class="brand-stat-val">'+b.wears+'</div><div class="brand-stat-lbl">Usos</div></div>'
      +'<div class="brand-stat"><div class="brand-stat-val">'+(b.cost>0?b.cost.toFixed(0)+'€':'—')+'</div><div class="brand-stat-lbl">Inversió</div></div>'
      +'<div class="brand-stat"><div class="brand-stat-val">'+avgCPW+'</div><div class="brand-stat-lbl">CPU mitjà</div></div>'
      +'</div></div>';
  }).join('');
}

function filterByBrand(brand){
  showView('wardrobe', document.querySelector('.nav-btn[data-view="wardrobe"]'));
  setTimeout(()=>{
    renderWardrobe().then(()=>{
      const panel = document.getElementById('fp-brand');
      if(panel){
        panel.querySelectorAll('input[type=checkbox]').forEach(cb=>{
          if(cb.value===brand){cb.checked=true; wrdActiveFilters.brands=[brand]; updateBadge('brands'); wrdPage=1; renderWardrobe();}
        });
      }
    });
  }, 100);
}
