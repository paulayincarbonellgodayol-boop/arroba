'use strict';

// ══════════════════════════════════════════
//  CALENDAR — state + rendering
//  Depends on: app.js globals (dbGetAll, showView, deleteOutfit,
//              openItemModal, closeItemModal)
//              utils.js (formatDate, esc)
//  Loaded before app.js; all calls happen at runtime only.
// ══════════════════════════════════════════

let calYear = new Date().getFullYear();
let calMonth = new Date().getMonth();

const CAT_COLOR = {
  DALT:'#EDE3F5',BAIX:'#E3EFF5',SENCER:'#F5E3E3',
  JAQUETA:'#FEF3E2',SABATES:'#E3F5E3',ARRACADES:'#F5EDE3',
  BOLSO:'#E3EDF5',ALTRES:'var(--bg3)'
};
const CAT_DOT = {
  DALT:'#8B3DA5',BAIX:'#1E6B8C',SENCER:'#A32020',
  JAQUETA:'#B87A10',SABATES:'#2A6B3A',ARRACADES:'#C8622A',
  BOLSO:'#3A5A8C',ALTRES:'#8C8279'
};
const MONTHS_CA = ['Gener','Febrer','Març','Abril','Maig','Juny','Juliol','Agost','Setembre','Octubre','Novembre','Desembre'];

function initCalendarSelectors(){
  const mSel = document.getElementById('cal-month-sel');
  const ySel = document.getElementById('cal-year-sel');
  if(!mSel||!ySel) return;
  if(mSel.options.length === 0){
    MONTHS_CA.forEach((name,i) => {
      const o = document.createElement('option');
      o.value = i; o.textContent = name;
      mSel.appendChild(o);
    });
  }
  if(ySel.options.length === 0){
    const thisYear = new Date().getFullYear();
    for(let y = thisYear; y >= thisYear - 10; y--){
      const o = document.createElement('option');
      o.value = y; o.textContent = y;
      ySel.appendChild(o);
    }
  }
}

function calJump(){
  const mSel = document.getElementById('cal-month-sel');
  const ySel = document.getElementById('cal-year-sel');
  calMonth = parseInt(mSel.value);
  calYear  = parseInt(ySel.value);
  renderCalendar();
}

function calMove(dir){
  calMonth += dir;
  if(calMonth > 11){ calMonth = 0; calYear++; }
  else if(calMonth < 0){ calMonth = 11; calYear--; }
  renderCalendar();
}

function calGoToday(){
  const now = new Date();
  calYear = now.getFullYear();
  calMonth = now.getMonth();
  renderCalendar();
}

async function renderCalendar(){
  initCalendarSelectors();
  const mSel = document.getElementById('cal-month-sel');
  const ySel = document.getElementById('cal-year-sel');
  if(mSel) mSel.value = calMonth;
  if(ySel) ySel.value = calYear;

  const allWears = await dbGetAll('wears');
  const allItems = await dbGetAll('items');
  const itemMap = {};
  allItems.forEach(it => itemMap[it.id] = it);

  const dateMap = {};
  allWears.forEach(w => {
    const [y,m] = w.date.split('-').map(Number);
    if(y === calYear && m-1 === calMonth){
      if(!dateMap[w.date]) dateMap[w.date] = [];
      dateMap[w.date].push(w);
    }
  });

  const daysWithData = Object.keys(dateMap).length;
  let monthCPWSum = 0, monthDaysWithCPW = 0;
  Object.entries(dateMap).forEach(([date, wears]) => {
    let dayCPW = 0, dayCPWN = 0;
    wears.forEach(w => {
      const it = itemMap[w.itemId];
      if(it && it.wears > 0){ dayCPW += it.cpw; dayCPWN++; }
    });
    if(dayCPWN > 0){ monthCPWSum += dayCPW; monthDaysWithCPW++; }
  });
  const summaryEl = document.getElementById('cal-summary');
  if(summaryEl){
    summaryEl.textContent = daysWithData > 0
      ? daysWithData + ' dies registrats · CPU mitjà/dia: ' + (monthDaysWithCPW > 0 ? (monthCPWSum/monthDaysWithCPW).toFixed(2) + '€' : '—')
      : 'Cap registre aquest mes';
  }

  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth+1, 0).getDate();
  const today = new Date();
  const todayStr = today.getFullYear() + '-' + String(today.getMonth()+1).padStart(2,'0') + '-' + String(today.getDate()).padStart(2,'0');

  let html = '<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px;margin-bottom:4px">';
  ['Dl','Dt','Dc','Dj','Dv','Ds','Dg'].forEach(d => {
    html += '<div style="text-align:center;font-size:11px;color:var(--text3);padding:4px;font-weight:500">' + d + '</div>';
  });
  html += '</div><div style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px">';

  const offset = (firstDay + 6) % 7;
  for(let i = 0; i < offset; i++) html += '<div></div>';

  for(let d = 1; d <= daysInMonth; d++){
    const dateStr = calYear + '-' + String(calMonth+1).padStart(2,'0') + '-' + String(d).padStart(2,'0');
    const dayWears = dateMap[dateStr] || [];
    const isToday = dateStr === todayStr;
    const hasData = dayWears.length > 0;

    let dayCPW = 0, dayCPWN = 0;
    dayWears.forEach(w => {
      const it = itemMap[w.itemId];
      if(it && it.wears > 0){ dayCPW += it.cpw; dayCPWN++; }
    });
    const cpwStr = dayCPWN > 0 ? dayCPW.toFixed(2) + '€' : '';

    const cats = [...new Set(dayWears.map(w => itemMap[w.itemId]?.category).filter(Boolean))];
    const dots = cats.map(cat =>
      '<span class="cal-dot" style="background:' + (CAT_DOT[cat]||'#999') + '"></span>'
    ).join('');

    const labels = dayWears.slice(0,2).map(w => {
      const it = itemMap[w.itemId];
      if(!it) return '';
      return '<span class="cal-piece-pill" style="background:' + (CAT_COLOR[it.category]||'var(--bg3)') + ';color:var(--text2)">' + it.brand + '</span>';
    }).join('');
    const more = dayWears.length > 2 ? '<span style="font-size:9px;color:var(--text3)">+' + (dayWears.length-2) + '</span>' : '';

    html += '<div class="cal-day' + (hasData?' has-data':'') + (isToday?' is-today':'') + '" data-date="' + dateStr + '">'
      + '<div class="cal-day-num">' + d + '</div>'
      + (hasData ? '<div class="cal-dot-row">' + dots + '</div>' + labels + more : '')
      + (cpwStr ? '<span class="cal-cpw">' + cpwStr + '</span>' : '')
      + '</div>';
  }
  html += '</div>';

  const grid = document.getElementById('cal-grid');
  grid.innerHTML = html;

  grid.querySelectorAll('.cal-day.has-data').forEach(el => {
    el.addEventListener('click', () => openDayModal(el.dataset.date));
  });
}

async function openDayModal(dateStr){
  const allWears = await dbGetAll('wears');
  const dayWears = allWears.filter(w => w.date === dateStr);
  if(!dayWears.length) return;

  const allItems = await dbGetAll('items');
  const itemMap = {};
  allItems.forEach(it => itemMap[it.id] = it);

  const groups = {};
  dayWears.forEach(w => {
    const gid = w.outfitId || ('leg-' + dateStr);
    if(!groups[gid]) groups[gid] = {label: w.outfitLabel||'', pieces:[]};
    groups[gid].pieces.push(w);
  });

  const outfitIds = dayWears.map(w=>w.itemId).filter(Boolean).sort().join('|');
  const allOutfitDays = {};
  allWears.forEach(w => {
    if(!allOutfitDays[w.date]) allOutfitDays[w.date] = [];
    if(w.itemId) allOutfitDays[w.date].push(w.itemId);
  });
  const matchingDays = Object.entries(allOutfitDays)
    .filter(([d,ids]) => d !== dateStr && ids.sort().join('|') === outfitIds)
    .map(([d]) => d)
    .sort().reverse();

  const modal = document.getElementById('item-modal-inner');

  let outfitsHTML = '';
  Object.entries(groups).forEach(([gid, g]) => {
    let cpwTotal = 0, cpwN = 0;
    const piecesHTML = g.pieces.map(w => {
      const it = itemMap[w.itemId];
      if(!it) return '';
      const cpw = it.wears > 0 ? it.cpw.toFixed(2) + '€' : '—';
      if(it.wears > 0){ cpwTotal += it.cpw; cpwN++; }
      return '<div class="outfit-piece-row" data-itemid="' + it.id + '">'
        + '<span class="outfit-cat-dot" style="background:' + (CAT_DOT[it.category]||'#999') + '"></span>'
        + '<span class="outfit-piece-name"><strong>' + it.brand + '</strong> ' + it.name + ' <span style="color:var(--text3)">' + it.color + '</span></span>'
        + '<span class="outfit-piece-cpw">' + cpw + '/ús</span>'
        + '</div>';
    }).join('');
    const labelHTML = g.label ? '<div class="outfit-section-label">' + g.label + '</div>' : '';
    const totalHTML = cpwN > 0 ? '<div class="outfit-total-cpw">CPU total: ' + cpwTotal.toFixed(2) + '€</div>' : '';
    const delBtn = '<button class="btn btn-danger btn-sm" style="margin-top:0.5rem;font-size:11px" data-deloutfit="' + gid + '" data-deldate="' + dateStr + '">Eliminar conjunt</button>';
    outfitsHTML += '<div class="outfit-section">' + labelHTML + piecesHTML + totalHTML + delBtn + '</div>';
  });

  const lastWornHTML = matchingDays.length > 0
    ? '<div style="font-size:12px;color:var(--text3);margin-top:0.75rem">'
      + 'Aquest conjunt exacte també portat: '
      + matchingDays.slice(0,5).map(d => '<span class="wh-chip" data-date="' + d + '">' + formatDate(d) + '</span>').join(' ')
      + (matchingDays.length > 5 ? ' <span style="color:var(--text3)">+' + (matchingDays.length-5) + ' cops més</span>' : '')
      + '</div>'
    : '';

  modal.innerHTML = '<div class="day-modal-header">'
    + '<div>'
    + '<div class="day-modal-date">' + formatDate(dateStr) + '</div>'
    + '<div class="day-modal-sub">' + dayWears.length + ' peç' + (dayWears.length!==1?'es':'a') + ' registrades</div>'
    + '</div>'
    + '<button class="modal-close" onclick="closeItemModal()">×</button>'
    + '</div>'
    + outfitsHTML
    + lastWornHTML;

  document.getElementById('item-modal').classList.add('open');

  modal.querySelectorAll('.outfit-piece-row[data-itemid]').forEach(el => {
    el.addEventListener('click', () => { closeItemModal(); setTimeout(()=>openItemModal(el.dataset.itemid),150); });
  });
  modal.querySelectorAll('.wh-chip[data-date]').forEach(el => {
    el.addEventListener('click', () => {
      const [y,m,d] = el.dataset.date.split('-').map(Number);
      calYear = y; calMonth = m-1;
      closeItemModal();
      setTimeout(() => {
        showView('calendar', document.querySelector('.nav-btn[data-view="calendar"]'));
        setTimeout(() => openDayModal(el.dataset.date), 300);
      }, 150);
    });
  });
  modal.querySelectorAll('[data-deloutfit]').forEach(btn => {
    btn.addEventListener('click', async () => {
      if(!confirm('Eliminar aquest conjunt registrat?')) return;
      await deleteOutfit(btn.dataset.deloutfit, btn.dataset.deldate);
      closeItemModal();
      renderCalendar();
    });
  });
}
