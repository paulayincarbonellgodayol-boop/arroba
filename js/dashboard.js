'use strict';

// ══════════════════════════════════════════
//  DASHBOARD — pure rendering helpers
//  Depends on: utils.js (getLast12MonthKeys, computeMonthlyAverage)
//  Loaded after utils.js, before app.js
// ══════════════════════════════════════════

function getCached(id) {
  return document.getElementById(id);
}

function buildStatStripHTML({ totalItems, avgCPU, lastWearDate, totalWears, monthDays }) {
  const IC = {
    hanger:   '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C8622A" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4a2 2 0 0 1 2 2c0 1.5-2 2.8-2 2.8S10 7.5 10 6a2 2 0 0 1 2-2z"/><path d="M12 9L3 17h18z"/></svg>',
    coin:     '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C8622A" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M15.5 8.5A5 5 0 1 0 15.5 15.5M8 10.5h6M8 13.5h6"/></svg>',
    calendar: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C8622A" stroke-width="1.8" stroke-linecap="round"><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/><path d="M9 16l2 2 4-4"/></svg>',
    month:    '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C8622A" stroke-width="1.8" stroke-linecap="round"><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M16 2v4M8 2v4M3 10h18M8 14h8M8 18h5"/></svg>'
  };

  return '' +
    statCardHTML(IC.hanger, 1, 'Armari', totalItems, 'peces totals') +
    statCardHTML(IC.coin, 2, 'CPU mitjà', avgCPU !== '—' ? `${avgCPU}€` : '—', 'per peça portada') +
    statCardHTML(IC.calendar, 3, 'Últim registre', `<span style="font-size:1.2rem">${lastWearDate}</span>`, `${totalWears} usos en total`) +
    statCardHTML(IC.month, 4, 'Aquest mes', monthDays, 'dies registrats');
}

function statCardHTML(icon, variant, label, value, note) {
  return `<div class="stat-card stat-c${variant}">` +
    `<div class="highlight-icon">${icon}</div>` +
    `<div><div class="stat-label">${label}</div><div class="stat-value">${value}</div><div class="stat-note">${note}</div></div>` +
    `</div>`;
}

function highlightCardHTML(item, iconKey, label, subtitleFn) {
  const IC = {
    trophy: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C8622A" stroke-width="1.8" stroke-linecap="round"><path d="M6 4h12v7a6 6 0 0 1-12 0V4z"/><path d="M6 7H3a3 3 0 0 0 3 3M18 7h3a3 3 0 0 1-3 3M12 17v3M8 20h8"/></svg>',
    sleep: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C8622A" stroke-width="1.8" stroke-linecap="round"><path d="M7 8h10M9 12h6M11 16h2"/></svg>',
    hourglass: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C8622A" stroke-width="1.8" stroke-linecap="round"><path d="M5 4h14M5 20h14M7 4l5 7 5-7M7 20l5-7 5 7"/></svg>'
  };
  return `<div class="highlight-card" style="cursor:pointer" data-itemid="${item.id}">` +
    `<div class="highlight-icon">${IC[iconKey] || ''}</div>` +
    `<div class="highlight-body"><div class="highlight-label">${label}</div>` +
    `<div class="highlight-value">${item.brand} ${item.name}</div>` +
    `<div class="highlight-sub">${subtitleFn(item)}</div></div></div>`;
}

function buildMonthSummaryHTML({ monthDays, monthAvgCPU, monthWearsCount, monthLatestDate }) {
  return `
    <div class="dash-month-grid">
      <div class="dash-month-item"><div class="dash-month-val">${monthDays}</div><div class="dash-month-lbl">Dies</div></div>
      <div class="dash-month-item"><div class="dash-month-val">${monthAvgCPU}</div><div class="dash-month-lbl">CPU mitjà</div></div>
      <div class="dash-month-item"><div class="dash-month-val">${monthWearsCount}</div><div class="dash-month-lbl">Registres</div></div>
      <div class="dash-month-item"><div class="dash-month-val">${monthLatestDate}</div><div class="dash-month-lbl">Últim</div></div>
    </div>
  `;
}

function renderCPUChart(allWears, iMap){
  const canvas = document.getElementById('dash-cpu-chart');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.clientWidth || 400;
  const H = 120;
  if (canvas.width !== W || canvas.height !== H) {
    canvas.width = W;
    canvas.height = H;
  }
  ctx.clearRect(0,0,W,H);

  const months = getLast12MonthKeys(new Date());
  const values = months.map(monthKey => computeMonthlyAverage(monthKey, allWears, iMap));

  const nonNull = values.filter(v => v !== null);
  if (!nonNull.length) {
    ctx.fillStyle = '#9A9490';
    ctx.font = '12px DM Sans,sans-serif';
    ctx.fillText('Sense dades suficients', 10, 60);
    return;
  }

  const maxVal = Math.max(...nonNull) * 1.15;
  const minVal = Math.min(...nonNull) * 0.85;
  const range  = maxVal - minVal || 1;

  const padL=8, padR=8, padT=12, padB=28;
  const chartW = W-padL-padR;
  const chartH = H-padT-padB;

  ctx.strokeStyle='rgba(26,23,20,0.06)';
  ctx.lineWidth=1;
  for(let g=0;g<=3;g++){
    const y = padT + (chartH/3)*g;
    ctx.beginPath(); ctx.moveTo(padL,y); ctx.lineTo(W-padR,y); ctx.stroke();
  }

  const pts = values.map((v,i)=>({
    x: padL + (i/(months.length-1))*chartW,
    y: v===null ? null : padT + chartH - ((v-minVal)/range)*chartH,
    v
  }));

  const gradient = ctx.createLinearGradient(0,padT,0,padT+chartH);
  gradient.addColorStop(0,'rgba(200,98,42,0.18)');
  gradient.addColorStop(1,'rgba(200,98,42,0)');

  ctx.beginPath();
  let started=false;
  pts.forEach(p=>{
    if(p.y===null) return;
    if(!started){ ctx.moveTo(p.x,p.y); started=true; }
    else ctx.lineTo(p.x,p.y);
  });

  const validPts = pts.filter(p=>p.y!==null);
  const firstPt = validPts[0];
  const lastPt = validPts[validPts.length-1];
  if (firstPt && lastPt) {
    ctx.lineTo(lastPt.x,padT+chartH);
    ctx.lineTo(firstPt.x,padT+chartH);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();
  }

  ctx.beginPath(); started=false;
  pts.forEach(p=>{
    if(p.y===null){ started=false; return; }
    if(!started){ ctx.moveTo(p.x,p.y); started=true; }
    else ctx.lineTo(p.x,p.y);
  });
  ctx.strokeStyle='#C8622A'; ctx.lineWidth=2; ctx.lineJoin='round';
  ctx.stroke();

  pts.forEach(p=>{
    if(p.y===null) return;
    ctx.beginPath(); ctx.arc(p.x,p.y,3,0,Math.PI*2); ctx.fillStyle='#C8622A'; ctx.fill();
    ctx.fillStyle='#FAF8F4'; ctx.beginPath(); ctx.arc(p.x,p.y,1.5,0,Math.PI*2); ctx.fill();
  });

  const mLabels=['Gen','Feb','Mar','Abr','Mai','Jun','Jul','Ago','Set','Oct','Nov','Des'];
  ctx.fillStyle='#8C8279'; ctx.font='10px DM Sans,sans-serif'; ctx.textAlign='center';
  months.forEach((m,i)=>{
    if(i%3===0||i===months.length-1){
      const x = padL+(i/(months.length-1))*chartW;
      const mIdx = parseInt(m.split('-')[1], 10) - 1;
      ctx.fillText(mLabels[mIdx], x, H-6);
    }
  });
}
