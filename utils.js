'use strict';

// ══════════════════════════════════════════
//  UTILS / SHARED HELPERS
// ══════════════════════════════════════════

const COLOR_HEX = {
  'negre':'#1A1714','blanc':'#FAFAF8','gris':'#9A9490','beige':'#E8DCC8',
  'marró':'#8B5E3C','vermell':'#C8272A','rosa':'#F0A0B0','blau':'#2A5AAF',
  'blau marí':'#1A3A6B','verd':'#2A7A3A','groc':'#E8C820','taronja':'#C8622A',
  'lila':'#8B3DA5','morat':'#6A2A8B','daurat':'#B8922A','platejat':'#909898',
  'texà':'#7090B8','multicolor':'#E07830','fucsia':'#D8208A',
  'carn':'#E8C0A0','perla':'#F0EDE8','beix':'#E8DCC8','caqui':'#8B8A50',
  'coral':'#E86050','turquesa':'#30A0B0','vi':'#8B1A3A','crema':'#F5EDD8',
};

function colorToHex(name){
  if(!name) return '#C8C0B8';
  const key = name.toLowerCase().trim();
  if(COLOR_HEX[key]) return COLOR_HEX[key];
  for(const [k,v] of Object.entries(COLOR_HEX)){
    if(key.includes(k)||k.includes(key)) return v;
  }
  let hash=0;
  for(const c of key) hash=((hash<<5)-hash)+c.charCodeAt(0);
  return 'hsl(' + (Math.abs(hash)%360) + ',55%,55%)';
}

function isColorDark(hex){
  if(!hex.startsWith('#')) return false;
  const h = hex.replace('#','');
  if(h.length < 6) return false;
  const r = parseInt(h.slice(0,2),16);
  const g = parseInt(h.slice(2,4),16);
  const b = parseInt(h.slice(4,6),16);
  return (r*299 + g*587 + b*114)/1000 < 128;
}

function flowerSVG(colorName, size){
  size = size || 14;
  const hex = colorToHex(colorName);
  const isDark = isColorDark(hex);
  const stroke = isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.15)';
  const r = size / 2;
  const pr = r * 0.38;
  const pc = r * 0.42;
  let petals = '';
  for(let i = 0; i < 6; i++){
    const a = (i / 6) * Math.PI * 2;
    const cx = (r + Math.cos(a) * pc).toFixed(1);
    const cy = (r + Math.sin(a) * pc).toFixed(1);
    const rot = (a * 180 / Math.PI).toFixed(1);
    petals += '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + pr.toFixed(1) + '" ry="' + (pr * 0.65).toFixed(1) + '" fill="' + hex + '" stroke="' + stroke + '" stroke-width="0.5" transform="rotate(' + rot + ',' + cx + ',' + cy + ')"/>';
  }
  const cr = (r * 0.28).toFixed(1);
  const cc = isDark ? '#E8DCC8' : '#1A1714';
  return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 ' + size + ' ' + size + '" xmlns="http://www.w3.org/2000/svg" style="flex-shrink:0;vertical-align:middle">' + petals + '<circle cx="' + r + '" cy="' + r + '" r="' + cr + '" fill="' + cc + '" opacity="0.7"/></svg>';
}

function colorPill(colorName){
  return '<span style="display:inline-flex;align-items:center;gap:3px;background:var(--bg2);border:1px solid var(--border);border-radius:100px;padding:2px 7px 2px 4px;font-size:11px">' + flowerSVG(colorName,11) + ' ' + esc(colorName) + '</span>';
}

function catIconSVG(category, colors, size){
  size = size || 80;
  const col = colors && colors.length ? colorToHex(colors[0]) : '#1A1714';
  const paths = {
    DALT: 'M20,55 Q20,30 50,25 Q80,30 80,55 L80,70 L20,70 Z M35,25 Q35,15 50,12 Q65,15 65,25',
    BAIX: 'M25,30 L35,70 L50,55 L65,70 L75,30 L60,28 L50,40 L40,28 Z',
    SENCER: 'M30,20 Q30,15 50,13 Q70,15 70,20 L72,55 Q72,70 50,72 Q28,70 28,55 Z M38,20 Q38,35 50,38 Q62,35 62,20',
    JAQUETA: 'M20,25 L30,20 L50,28 L70,20 L80,25 L78,70 L22,70 Z M30,20 L28,45 M70,20 L72,45 M38,28 L38,50 M62,28 L62,50',
    SABATES: 'M15,62 Q15,55 25,52 L55,50 Q70,49 80,54 L82,62 Q70,68 50,68 Q25,70 15,62 Z M25,52 L28,38 Q30,30 40,30 L50,32 L55,50',
    ARRACADES: 'M42,20 Q38,20 38,25 Q38,30 42,30 Q46,30 46,25 Q46,20 42,20 Z M42,30 Q38,40 36,52 Q38,62 42,64 Q46,62 48,52 Q46,40 42,30 Z M58,18 Q54,18 54,23 Q54,28 58,28 Q62,28 62,23 Q62,18 58,18 Z M58,28 Q54,38 52,50 Q54,60 58,62 Q62,60 64,50 Q62,38 58,28 Z',
    BOLSO: 'M30,40 Q30,30 50,28 Q70,30 70,40 L72,70 Q72,74 50,75 Q28,74 28,70 Z M38,40 Q38,32 50,30 Q62,32 62,40 M40,55 L60,55',
    ALTRES: 'M50,20 L55,35 L70,35 L58,45 L63,60 L50,50 L37,60 L42,45 L30,35 L45,35 Z',
    SENCER_MONO: 'M35,20 L65,20 L68,70 L32,70 Z M35,20 Q35,14 50,12 Q65,14 65,20',
  };
  const d = paths[category] || paths.ALTRES;
  const isDark = isColorDark(col);
  const bg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)';
  return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">'
    + '<rect width="100" height="100" fill="' + bg + '" rx="8"/>'
    + '<path d="' + d + '" fill="none" stroke="' + col + '" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.7"/>'
    + '</svg>';
}

function formatDate(str){
  if(!str) return '—';
  const [y, m, d] = str.split('-').map(Number);
  const months = ['gen','feb','mar','abr','mai','jun','jul','ago','set','oct','nov','des'];
  return `${d} ${months[m-1]} ${y}`;
}

function selectHighlights(items) {
  const result = { mostWorn: null, leastWorn: null, longestAgo: null };
  items.forEach(item => {
    if (item.wears > 0) {
      if (!result.mostWorn || item.wears > result.mostWorn.wears) result.mostWorn = item;
      if (!result.leastWorn || item.wears < result.leastWorn.wears) result.leastWorn = item;
    }
    if (item.lastWorn && (!result.longestAgo || item.lastWorn < result.longestAgo.lastWorn)) {
      result.longestAgo = item;
    }
  });
  return result;
}

function computeMonthStats(monthWears, itemMap) {
  const days = new Map();
  let latestDate = '';

  monthWears.forEach(wear => {
    if (wear.date > latestDate) latestDate = wear.date;
    if (!days.has(wear.date)) days.set(wear.date, []);
    days.get(wear.date).push(wear);
  });

  let total = 0;
  let dayCount = 0;

  days.forEach(wears => {
    let daySum = 0;
    let count = 0;
    wears.forEach(wear => {
      const item = itemMap[wear.itemId];
      if (item && item.wears > 0) {
        daySum += item.cpw;
        count += 1;
      }
    });
    if (count > 0) {
      total += daySum / count;
      dayCount += 1;
    }
  });

  return {
    average: dayCount > 0 ? total / dayCount : null,
    latestDate
  };
}

function getLast12MonthKeys(referenceDate) {
  const monthKeys = [];
  for (let offset = 11; offset >= 0; offset--) {
    const d = new Date(referenceDate.getFullYear(), referenceDate.getMonth() - offset, 1);
    monthKeys.push(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`);
  }
  return monthKeys;
}

function computeMonthlyAverage(monthKey, allWears, iMap) {
  const byDay = new Map();
  allWears.forEach(wear => {
    if (!wear.date || !wear.date.startsWith(monthKey)) return;
    if (!byDay.has(wear.date)) byDay.set(wear.date, []);
    byDay.get(wear.date).push(wear);
  });

  let total = 0;
  let count = 0;
  byDay.forEach(wears => {
    let daySum = 0;
    let dayCount = 0;
    wears.forEach(wear => {
      const item = iMap[wear.itemId];
      if (item && item.wears > 0) {
        daySum += item.cpw;
        dayCount += 1;
      }
    });
    if (dayCount > 0) {
      total += daySum / dayCount;
      count += 1;
    }
  });

  return count > 0 ? total / count : null;
}

function esc(s){
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function buildPaginator(id, total, current, perPage, onChange){
  const pages = Math.ceil(total/perPage);
  const el = document.getElementById(id);
  if(!el||pages<=1){if(el)el.innerHTML='';return;}
  let html=`<button class="pg-btn" ${current<=1?'disabled':''} onclick="(${onChange.toString()})(${current-1})">‹</button>`;
  for(let p=1;p<=pages;p++){
    if(p===1||p===pages||Math.abs(p-current)<=1) html+=`<button class="pg-btn${p===current?' active':''}" onclick="(${onChange.toString()})(${p})">${p}</button>`;
    else if(Math.abs(p-current)===2) html+=`<span class="pg-info">…</span>`;
  }
  html+=`<button class="pg-btn" ${current>=pages?'disabled':''} onclick="(${onChange.toString()})(${current+1})">›</button>`;
  el.innerHTML=html;
}

let toastTimer;
function toast(msg){
  const el=document.getElementById('toast');
  el.textContent=msg; el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer=setTimeout(()=>el.classList.remove('show'),2500);
}
