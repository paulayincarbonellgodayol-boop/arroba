'use strict';
// ══════════════════════════════════════════
//  SEED DATA — demo wardrobe (fictional)
// ══════════════════════════════════════════

function mapSeason(s){
  if(!s||s===''||s==='–') return [];
  if(s==='Entretemps') return ['primavera','tardor'];
  if(s==='Estiu')  return ['estiu'];
  if(s==='Hivern') return ['hivern'];
  return [];
}
function autoFormality(type,name){
  const n=(name||'').toLowerCase();
  const t=(type||'').toLowerCase();
  if(n.includes('xandall')||t==='leggings') return ['casual'];
  if(t==='americana'||n.includes('americana')) return ['formal'];
  if(t==='abric') return ['formal'];
  return [];
}

const RAW_ITEMS = [
/* ── DALT ─────────────────────────────────────────────────────────── */
{id:'d001',category:'DALT',brand:'Stradivarius',name:'Samarreta bàsica',color:'Blanc',type:'Samarreta',rawSeason:'Estiu',price:12.99,quantity:2,wears:28,purchaseYear:'2022',rawFormality:'casual'},
{id:'d002',category:'DALT',brand:'Stradivarius',name:'Samarreta bàsica',color:'Negre',type:'Samarreta',rawSeason:'Estiu',price:12.99,quantity:2,wears:35,purchaseYear:'2022',rawFormality:'casual'},
{id:'d003',category:'DALT',brand:'Stradivarius',name:'Top cropped',color:'Beige',type:'Top',rawSeason:'Estiu',price:15.99,quantity:1,wears:18,purchaseYear:'2022',rawFormality:'casual'},
{id:'d004',category:'DALT',brand:'Stradivarius',name:'Brusa volants',color:'Blanc',type:'Brusa',rawSeason:'Estiu',price:22.99,quantity:1,wears:12,purchaseYear:'2023',rawFormality:'smart-casual'},
{id:'d005',category:'DALT',brand:'Stradivarius',name:'Jersei coll alt',color:'Negre',type:'Jersei',rawSeason:'Hivern',price:25.99,quantity:1,wears:22,purchaseYear:'2022',rawFormality:'smart-casual'},
{id:'d006',category:'DALT',brand:'Stradivarius',name:'Cardigan bàsic',color:'Gris',type:'Cardigan',rawSeason:'Entretemps',price:19.99,quantity:1,wears:19,purchaseYear:'2022',rawFormality:'casual'},
{id:'d007',category:'DALT',brand:'Mango',name:'Samarreta Chalapi VNeck',color:'Negre',type:'Samarreta',rawSeason:'Estiu',price:7.99,quantity:3,wears:45,purchaseYear:'2022',rawFormality:'casual'},
{id:'d008',category:'DALT',brand:'Mango',name:'Samarreta Chalapi VNeck',color:'Blanc',type:'Samarreta',rawSeason:'Estiu',price:7.99,quantity:2,wears:30,purchaseYear:'2022',rawFormality:'casual'},
{id:'d009',category:'DALT',brand:'Mango',name:'Cardigan Luca',color:'Negre',type:'Cardigan',rawSeason:'Entretemps',price:22.99,quantity:1,wears:21,purchaseYear:'2022',rawFormality:'smart-casual'},
{id:'d010',category:'DALT',brand:'Mango',name:'Camisa satí',color:'Blanc',type:'Camisa',rawSeason:'Entretemps',price:35.99,quantity:1,wears:14,purchaseYear:'2023',rawFormality:'smart-casual'},
{id:'d011',category:'DALT',brand:'Mango',name:'Jersei de ratlles',color:'Negre i Blanc',type:'Jersei',rawSeason:'Hivern',price:29.99,quantity:1,wears:17,purchaseYear:'2022',rawFormality:'casual'},
{id:'d012',category:'DALT',brand:'Mango',name:'Camisa clàssica',color:'Blau marí',type:'Camisa',rawSeason:'Entretemps',price:29.99,quantity:1,wears:10,purchaseYear:'2023',rawFormality:'formal'},
{id:'d013',category:'DALT',brand:'Mango',name:'Samarreta màniga llarga',color:'Gris',type:'Samarreta',rawSeason:'Entretemps',price:19.99,quantity:1,wears:20,purchaseYear:'2022',rawFormality:'casual'},
{id:'d014',category:'DALT',brand:'Mango',name:'Brusa de vol',color:'Blanc',type:'Brusa',rawSeason:'Estiu',price:25.99,quantity:1,wears:11,purchaseYear:'2023',rawFormality:'smart-casual'},
{id:'d015',category:'DALT',brand:'Massimo Dutti',name:'Camisa clàssica',color:'Blanc',type:'Camisa',rawSeason:'Entretemps',price:49.95,quantity:1,wears:16,purchaseYear:'2022',rawFormality:'formal'},
{id:'d016',category:'DALT',brand:'Massimo Dutti',name:'Camisa de seda',color:'Blau cel',type:'Camisa',rawSeason:'Entretemps',price:59.95,quantity:1,wears:8,purchaseYear:'2023',rawFormality:'formal'},
{id:'d017',category:'DALT',brand:'Massimo Dutti',name:'Jersei merino',color:'Beige',type:'Jersei',rawSeason:'Hivern',price:59.95,quantity:1,wears:14,purchaseYear:'2022',rawFormality:'smart-casual'},
{id:'d018',category:'DALT',brand:'Massimo Dutti',name:'Jersei merino coll alt',color:'Negre',type:'Jersei',rawSeason:'Hivern',price:59.95,quantity:1,wears:11,purchaseYear:'2022',rawFormality:'smart-casual'},
{id:'d019',category:'DALT',brand:'Jack Wills',name:'Samarreta coll rodó',color:'Blanc',type:'Samarreta',rawSeason:'Estiu',price:16.03,quantity:2,wears:26,purchaseYear:'2022',rawFormality:'casual'},
{id:'d020',category:'DALT',brand:'Jack Wills',name:'Samarreta coll rodó',color:'Negre',type:'Samarreta',rawSeason:'Estiu',price:16.03,quantity:1,wears:18,purchaseYear:'2022',rawFormality:'casual'},
{id:'d021',category:'DALT',brand:'Jack Wills',name:'Brusa de vol',color:'Blanc',type:'Brusa',rawSeason:'Estiu',price:28,quantity:1,wears:13,purchaseYear:'2022',rawFormality:'smart-casual'},
{id:'d022',category:'DALT',brand:'Liujo',name:'Brusa de volants',color:'Negre',type:'Brusa',rawSeason:'Estiu',price:65,quantity:1,wears:14,purchaseYear:'2022',rawFormality:'smart-casual'},
{id:'d023',category:'DALT',brand:'Liujo',name:'Jersei brillants',color:'Gris',type:'Jersei',rawSeason:'Hivern',price:55,quantity:1,wears:10,purchaseYear:'2023',rawFormality:'smart-casual'},
{id:'d024',category:'DALT',brand:'Liujo',name:'Camisa texana',color:'Negre',type:'Camisa',rawSeason:'Entretemps',price:55,quantity:1,wears:7,purchaseYear:'2022',rawFormality:'smart-casual'},
{id:'d025',category:'DALT',brand:'Polo Ralph Lauren',name:'Camisa Oxford',color:'Blanc',type:'Camisa',rawSeason:'Entretemps',price:125,quantity:1,wears:22,purchaseYear:'2021',rawFormality:'smart-casual'},
{id:'d026',category:'DALT',brand:'Polo Ralph Lauren',name:'Camisa Oxford ralles',color:'Blanc i Blau',type:'Camisa',rawSeason:'Entretemps',price:99,quantity:1,wears:9,purchaseYear:'2023',rawFormality:'smart-casual'},
{id:'d027',category:'DALT',brand:'Fracomina',name:'Jersei de botons',color:'Negre',type:'Jersei',rawSeason:'Hivern',price:45,quantity:1,wears:13,purchaseYear:'2022',rawFormality:'smart-casual'},
{id:'d028',category:'DALT',brand:'Fracomina',name:'Jersei de botons',color:'Beige',type:'Jersei',rawSeason:'Hivern',price:45,quantity:1,wears:8,purchaseYear:'2022',rawFormality:'smart-casual'},
{id:'d029',category:'DALT',brand:'Zara',name:'Samarreta VNeck',color:'Blanc',type:'Samarreta',rawSeason:'Estiu',price:11.99,quantity:1,wears:14,purchaseYear:'2022',rawFormality:'casual'},
{id:'d030',category:'DALT',brand:'Zara',name:'Samarreta VNeck',color:'Negre',type:'Samarreta',rawSeason:'Estiu',price:7.99,quantity:1,wears:20,purchaseYear:'2022',rawFormality:'casual'},
{id:'d031',category:'DALT',brand:'H&M',name:'Samarreta bàsica',color:'Blanc',type:'Samarreta',rawSeason:'Estiu',price:9.99,quantity:1,wears:16,purchaseYear:'2022',rawFormality:'casual'},
{id:'d032',category:'DALT',brand:'H&M',name:'Brusa escotada',color:'Negre',type:'Brusa',rawSeason:'Estiu',price:19.99,quantity:1,wears:9,purchaseYear:'2023',rawFormality:'smart-casual'},
{id:'d033',category:'DALT',brand:'Scalpers',name:'Camisa clàssica ralles',color:'Blanc i Blau',type:'Camisa',rawSeason:'Entretemps',price:69.99,quantity:1,wears:8,purchaseYear:'2022',rawFormality:'smart-casual'},
{id:'d034',category:'DALT',brand:'Guess',name:'Jersei oversize',color:'Vermell',type:'Jersei',rawSeason:'Hivern',price:89.99,quantity:1,wears:7,purchaseYear:'2022',rawFormality:'casual'},
{id:'d035',category:'DALT',brand:'Only',name:'Camisa bàsica',color:'Blanc',type:'Camisa',rawSeason:'Entretemps',price:29.99,quantity:1,wears:9,purchaseYear:'2023',rawFormality:'smart-casual'},

/* ── BAIX ─────────────────────────────────────────────────────────── */
{id:'b001',category:'BAIX',brand:'Stradivarius',name:'Texans campana',color:'Texà',type:'Texans',rawSeason:'',price:19.99,quantity:2,wears:32,purchaseYear:'2021',rawFormality:'casual'},
{id:'b002',category:'BAIX',brand:'Stradivarius',name:'Texans estrets',color:'Negre',type:'Texans',rawSeason:'',price:29.99,quantity:1,wears:18,purchaseYear:'2022',rawFormality:'casual'},
{id:'b003',category:'BAIX',brand:'Stradivarius',name:'Pantalons campana',color:'Negre',type:'Pantalons',rawSeason:'',price:22.99,quantity:1,wears:24,purchaseYear:'2022',rawFormality:'smart-casual'},
{id:'b004',category:'BAIX',brand:'Stradivarius',name:'Pantalons campana',color:'Blanc',type:'Pantalons',rawSeason:'',price:22.99,quantity:1,wears:16,purchaseYear:'2022',rawFormality:'smart-casual'},
{id:'b005',category:'BAIX',brand:'Stradivarius',name:'Faldilla texana',color:'Texà',type:'Faldilla',rawSeason:'',price:19.99,quantity:1,wears:15,purchaseYear:'2022',rawFormality:'casual'},
{id:'b006',category:'BAIX',brand:'Stradivarius',name:'Faldilla recta',color:'Negre',type:'Faldilla',rawSeason:'',price:24.99,quantity:1,wears:14,purchaseYear:'2022',rawFormality:'smart-casual'},
{id:'b007',category:'BAIX',brand:'Stradivarius',name:'Shorts texans',color:'Texà',type:'Shorts',rawSeason:'',price:19.99,quantity:1,wears:19,purchaseYear:'2021',rawFormality:'casual'},
{id:'b008',category:'BAIX',brand:'Mango',name:'Texans Nayara',color:'Texà',type:'Texans',rawSeason:'',price:29.99,quantity:1,wears:28,purchaseYear:'2023',rawFormality:'casual'},
{id:'b009',category:'BAIX',brand:'Mango',name:'Faldilla texana',color:'Texà',type:'Faldilla',rawSeason:'',price:22.99,quantity:1,wears:22,purchaseYear:'2022',rawFormality:'casual'},
{id:'b010',category:'BAIX',brand:'Mango',name:'Pantalons amples',color:'Negre',type:'Pantalons',rawSeason:'',price:25.99,quantity:1,wears:20,purchaseYear:'2022',rawFormality:'smart-casual'},
{id:'b011',category:'BAIX',brand:'Mango',name:'Faldilla recta midi',color:'Negre',type:'Faldilla',rawSeason:'',price:29.99,quantity:1,wears:12,purchaseYear:'2023',rawFormality:'smart-casual'},
{id:'b012',category:'BAIX',brand:'Mango',name:'Shorts texans',color:'Texà',type:'Shorts',rawSeason:'',price:22.99,quantity:1,wears:14,purchaseYear:'2022',rawFormality:'casual'},
{id:'b013',category:'BAIX',brand:'Replay',name:'Texans campana',color:'Texà',type:'Texans',rawSeason:'',price:79.99,quantity:2,wears:36,purchaseYear:'2021',rawFormality:'casual'},
{id:'b014',category:'BAIX',brand:'Replay',name:'Texans estrets',color:'Negre',type:'Texans',rawSeason:'',price:79.99,quantity:1,wears:14,purchaseYear:'2022',rawFormality:'casual'},
{id:'b015',category:'BAIX',brand:'Only',name:'Pantalons amples',color:'Beige',type:'Pantalons',rawSeason:'',price:39.99,quantity:1,wears:18,purchaseYear:'2022',rawFormality:'smart-casual'},
{id:'b016',category:'BAIX',brand:'Only',name:'Faldilla de vellut',color:'Negre',type:'Faldilla',rawSeason:'',price:25.99,quantity:1,wears:16,purchaseYear:'2023',rawFormality:'smart-casual'},
{id:'b017',category:'BAIX',brand:'Only',name:'Faldilla mini',color:'Texà',type:'Faldilla',rawSeason:'',price:29.99,quantity:1,wears:11,purchaseYear:'2022',rawFormality:'casual'},
{id:'b018',category:'BAIX',brand:'Massimo Dutti',name:'Pantalons slim',color:'Negre',type:'Pantalons',rawSeason:'',price:49.95,quantity:1,wears:12,purchaseYear:'2022',rawFormality:'formal'},
{id:'b019',category:'BAIX',brand:'Massimo Dutti',name:'Pantalons bàsics',color:'Beige',type:'Pantalons',rawSeason:'',price:45.95,quantity:1,wears:10,purchaseYear:'2022',rawFormality:'smart-casual'},
{id:'b020',category:'BAIX',brand:'Liujo',name:'Pantalons',color:'Marró',type:'Pantalons',rawSeason:'',price:59,quantity:1,wears:14,purchaseYear:'2023',rawFormality:'smart-casual'},
{id:'b021',category:'BAIX',brand:'Liujo',name:'Faldilla recta',color:'Negre',type:'Faldilla',rawSeason:'',price:65,quantity:1,wears:10,purchaseYear:'2023',rawFormality:'smart-casual'},
{id:'b022',category:'BAIX',brand:'Calzedonia',name:'Mitges 30 denier',color:'Negre',type:'Mitges',rawSeason:'',price:9.95,quantity:4,wears:44,purchaseYear:'2022',rawFormality:'smart-casual'},
{id:'b023',category:'BAIX',brand:'Calzedonia',name:'Mitges tupides',color:'Negre',type:'Mitges',rawSeason:'',price:8,quantity:1,wears:18,purchaseYear:'2022',rawFormality:'smart-casual'},
{id:'b024',category:'BAIX',brand:'Tommy Hilfiger',name:'Pantalons chino',color:'Beige',type:'Pantalons',rawSeason:'',price:79.99,quantity:1,wears:7,purchaseYear:'2022',rawFormality:'smart-casual'},
{id:'b025',category:'BAIX',brand:'Jack Wills',name:'Pantalons xandall',color:'Negre',type:'Pantalons',rawSeason:'',price:35,quantity:1,wears:22,purchaseYear:'2023',rawFormality:'casual'},
{id:'b026',category:'BAIX',brand:'Nike',name:'Leggings',color:'Negre',type:'Leggings',rawSeason:'',price:35,quantity:1,wears:16,purchaseYear:'2022',rawFormality:'casual'},
{id:'b027',category:'BAIX',brand:"D'elle",name:'Pantalons pinça',color:'Marró',type:'Pantalons',rawSeason:'',price:100,quantity:1,wears:9,purchaseYear:'2022',rawFormality:'smart-casual'},
{id:'b028',category:'BAIX',brand:'Pep Llasera',name:'Pantalons de fil',color:'Blanc i Blau',type:'Pantalons',rawSeason:'',price:28,quantity:1,wears:12,purchaseYear:'2022',rawFormality:'smart-casual'},

/* ── SENCER ───────────────────────────────────────────────────────── */
{id:'s001',category:'SENCER',brand:'Only',name:'Vestit wrap',color:'Negre',type:'Vestit',rawSeason:'Entretemps',price:29.99,quantity:1,wears:12,purchaseYear:'2023',rawFormality:'smart-casual'},
{id:'s002',category:'SENCER',brand:'Zara',name:'Vestit camisero',color:'Blanc',type:'Vestit',rawSeason:'Estiu',price:50,quantity:1,wears:8,purchaseYear:'2022',rawFormality:'casual'},
{id:'s003',category:'SENCER',brand:'Mango',name:'Vestit midi satí',color:'Negre',type:'Vestit',rawSeason:'',price:59.99,quantity:1,wears:6,purchaseYear:'2023',rawFormality:'formal'},
{id:'s004',category:'SENCER',brand:'Mango',name:'Vestit floral',color:'Multicolor',type:'Vestit',rawSeason:'Estiu',price:39.99,quantity:1,wears:7,purchaseYear:'2022',rawFormality:'casual'},
{id:'s005',category:'SENCER',brand:'Stradivarius',name:'Vestit caqui',color:'Verd',type:'Vestit',rawSeason:'Entretemps',price:30,quantity:1,wears:5,purchaseYear:'2022',rawFormality:'casual'},
{id:'s006',category:'SENCER',brand:'Stradivarius',name:'Vestit camisero',color:'Texà',type:'Vestit',rawSeason:'Estiu',price:26.99,quantity:1,wears:4,purchaseYear:'2023',rawFormality:'casual'},
{id:'s007',category:'SENCER',brand:'Hollister',name:'Mono',color:'Blanc',type:'Mono',rawSeason:'Estiu',price:40,quantity:1,wears:5,purchaseYear:'2023',rawFormality:'casual'},
{id:'s008',category:'SENCER',brand:'Jack Wills',name:'Mono brodat',color:'Blanc',type:'Mono',rawSeason:'Estiu',price:60,quantity:1,wears:4,purchaseYear:'2022',rawFormality:'smart-casual'},
{id:'s009',category:'SENCER',brand:'Liujo',name:'Vestit lleopard',color:'Multicolor',type:'Vestit',rawSeason:'',price:100,quantity:1,wears:3,purchaseYear:'2023',rawFormality:'formal'},
{id:'s010',category:'SENCER',brand:'H&M',name:'Vestit sundress',color:'Rosa',type:'Vestit',rawSeason:'Estiu',price:24.99,quantity:1,wears:6,purchaseYear:'2022',rawFormality:'casual'},
{id:'s011',category:'SENCER',brand:'River Island',name:'Vestit mini',color:'Blanc',type:'Vestit',rawSeason:'Estiu',price:60,quantity:1,wears:3,purchaseYear:'2023',rawFormality:'smart-casual'},
{id:'s012',category:'SENCER',brand:'Rinascimento',name:'Vestit midi',color:'Negre',type:'Vestit',rawSeason:'',price:80,quantity:1,wears:4,purchaseYear:'2022',rawFormality:'formal'},

/* ── JAQUETA ──────────────────────────────────────────────────────── */
{id:'j001',category:'JAQUETA',brand:'Henry Arroway',name:'Anorac',color:'Negre',type:'Anorac',rawSeason:'Hivern',price:395,quantity:1,wears:155,purchaseYear:'2020',rawFormality:'casual'},
{id:'j002',category:'JAQUETA',brand:'Jack Wills',name:'Jaqueta texana',color:'Blanc',type:'Texana',rawSeason:'Entretemps',price:55,quantity:1,wears:68,purchaseYear:'2022',rawFormality:'casual'},
{id:'j003',category:'JAQUETA',brand:'Jack Wills',name:'Dessuadora',color:'Blanc',type:'Dessuadora',rawSeason:'Entretemps',price:40,quantity:1,wears:42,purchaseYear:'2022',rawFormality:'casual'},
{id:'j004',category:'JAQUETA',brand:'Jack Wills',name:'Dessuadora',color:'Blau',type:'Dessuadora',rawSeason:'Entretemps',price:40,quantity:1,wears:28,purchaseYear:'2022',rawFormality:'casual'},
{id:'j005',category:'JAQUETA',brand:'GAP',name:'Dessuadora',color:'Blanc',type:'Dessuadora',rawSeason:'Entretemps',price:39.95,quantity:1,wears:34,purchaseYear:'2021',rawFormality:'casual'},
{id:'j006',category:'JAQUETA',brand:'GAP',name:'Jaqueta texana',color:'Texà',type:'Texana',rawSeason:'Entretemps',price:40,quantity:1,wears:18,purchaseYear:'2020',rawFormality:'casual'},
{id:'j007',category:'JAQUETA',brand:'Michael Kors',name:'Jaqueta curta',color:'Negre',type:'Curta',rawSeason:'Entretemps',price:150,quantity:1,wears:88,purchaseYear:'2021',rawFormality:'smart-casual'},
{id:'j008',category:'JAQUETA',brand:'Massimo Dutti',name:'Jaqueta de pell',color:'Negre',type:'Pell',rawSeason:'Entretemps',price:180,quantity:1,wears:45,purchaseYear:'2021',rawFormality:'smart-casual'},
{id:'j009',category:'JAQUETA',brand:'Massimo Dutti',name:'Jaqueta de pell',color:'Marró',type:'Pell',rawSeason:'Entretemps',price:180,quantity:1,wears:22,purchaseYear:'2022',rawFormality:'smart-casual'},
{id:'j010',category:'JAQUETA',brand:'Hollister',name:'Jaqueta curta',color:'Gris',type:'Curta',rawSeason:'Entretemps',price:125,quantity:1,wears:38,purchaseYear:'2021',rawFormality:'casual'},
{id:'j011',category:'JAQUETA',brand:'Kocca',name:'Abric llarg',color:'Negre',type:'Abric',rawSeason:'Hivern',price:200,quantity:1,wears:16,purchaseYear:'2022',rawFormality:'smart-casual'},
{id:'j012',category:'JAQUETA',brand:'Stradivarius',name:'Blazer',color:'Blanc',type:'Americana',rawSeason:'Entretemps',price:30,quantity:1,wears:12,purchaseYear:'2022',rawFormality:'smart-casual'},
{id:'j013',category:'JAQUETA',brand:'Geospirit',name:'Anorac',color:'Gris',type:'Anorac',rawSeason:'Hivern',price:200,quantity:1,wears:20,purchaseYear:'2021',rawFormality:'casual'},
{id:'j014',category:'JAQUETA',brand:'Emporio Armani',name:'Anorac punts',color:'Negre',type:'Anorac',rawSeason:'Hivern',price:200,quantity:1,wears:18,purchaseYear:'2020',rawFormality:'casual'},
{id:'j015',category:'JAQUETA',brand:'Penny Black',name:'Jaqueta texana',color:'Texà',type:'Texana',rawSeason:'Entretemps',price:200,quantity:1,wears:25,purchaseYear:'2021',rawFormality:'casual'},

/* ── SABATES ──────────────────────────────────────────────────────── */
{id:'sa001',category:'SABATES',brand:'Victoria',name:'Bambes lona',color:'Blanc i Negre',type:'Bambes',rawSeason:'',price:59.9,quantity:3,wears:195,purchaseYear:'2021',rawFormality:'casual'},
{id:'sa002',category:'SABATES',brand:'Nero Giardini',name:'Botina xarol cordons',color:'Negre',type:'Botina',rawSeason:'',price:140,quantity:1,wears:112,purchaseYear:'2023',rawFormality:'smart-casual'},
{id:'sa003',category:'SABATES',brand:'Nero Giardini',name:'Sandàlies planes',color:'Daurat',type:'Sandàlies',rawSeason:'',price:140,quantity:1,wears:55,purchaseYear:'2021',rawFormality:'smart-casual'},
{id:'sa004',category:'SABATES',brand:'Nero Giardini',name:'Botina civella',color:'Negre',type:'Botina',rawSeason:'',price:140,quantity:2,wears:78,purchaseYear:'2022',rawFormality:'smart-casual'},
{id:'sa005',category:'SABATES',brand:'Nero Giardini',name:'Sandàlies de taló',color:'Marró',type:'Sandàlies',rawSeason:'',price:140,quantity:1,wears:38,purchaseYear:'2022',rawFormality:'smart-casual'},
{id:'sa006',category:'SABATES',brand:'Nero Giardini',name:'Botina serp',color:'Negre',type:'Botina',rawSeason:'',price:140,quantity:1,wears:32,purchaseYear:'2022',rawFormality:'smart-casual'},
{id:'sa007',category:'SABATES',brand:'Nero Giardini',name:'Sandàlies planes platejades',color:'Platejat',type:'Sandàlies',rawSeason:'',price:140,quantity:1,wears:22,purchaseYear:'2022',rawFormality:'smart-casual'},
{id:'sa008',category:'SABATES',brand:'Nero Giardini',name:'Botina blanca',color:'Blanc',type:'Botina',rawSeason:'',price:140,quantity:1,wears:18,purchaseYear:'2022',rawFormality:'smart-casual'},
{id:'sa009',category:'SABATES',brand:'Asics',name:'Bambes',color:'Negre',type:'Bambes',rawSeason:'',price:70,quantity:1,wears:28,purchaseYear:'2022',rawFormality:'casual'},
{id:'sa010',category:'SABATES',brand:'Asics',name:'Bambes trail',color:'Negre i Gris',type:'Bambes',rawSeason:'',price:90,quantity:1,wears:22,purchaseYear:'2023',rawFormality:'casual'},
{id:'sa011',category:'SABATES',brand:'No Name',name:'Bambes',color:'Blanc i Beige',type:'Bambes',rawSeason:'',price:100,quantity:1,wears:30,purchaseYear:'2021',rawFormality:'casual'},
{id:'sa012',category:'SABATES',brand:'No Name',name:'Bambes negres',color:'Negre',type:'Bambes',rawSeason:'',price:100,quantity:1,wears:18,purchaseYear:'2022',rawFormality:'casual'},
{id:'sa013',category:'SABATES',brand:'Converse',name:'Bambes altes',color:'Negre',type:'Bambes',rawSeason:'',price:75,quantity:1,wears:24,purchaseYear:'2022',rawFormality:'casual'},
{id:'sa014',category:'SABATES',brand:'Converse',name:'Bambes baixes',color:'Blanc',type:'Bambes',rawSeason:'',price:70,quantity:1,wears:20,purchaseYear:'2023',rawFormality:'casual'},
{id:'sa015',category:'SABATES',brand:'Mango',name:'Sandàlies de taló',color:'Negre',type:'Sandàlies',rawSeason:'',price:59.99,quantity:1,wears:16,purchaseYear:'2023',rawFormality:'smart-casual'},
{id:'sa016',category:'SABATES',brand:'GAP',name:'Xancletes',color:'Lila',type:'Xancletes',rawSeason:'',price:20,quantity:1,wears:12,purchaseYear:'2022',rawFormality:'casual'},
{id:'sa017',category:'SABATES',brand:'Roxy',name:'Xancletes',color:'Blanc',type:'Xancletes',rawSeason:'',price:25,quantity:1,wears:8,purchaseYear:'2023',rawFormality:'casual'},

/* ── ARRACADES ────────────────────────────────────────────────────── */
{id:'ar001',category:'ARRACADES',brand:'Tous',name:'Arracades perla gran',color:'Platejat',type:'Curta',rawSeason:'',price:65,quantity:1,wears:95,purchaseYear:'2021',rawFormality:'smart-casual'},
{id:'ar002',category:'ARRACADES',brand:'Tous',name:'Arracades perla petita',color:'Platejat',type:'Curta',rawSeason:'',price:59,quantity:2,wears:120,purchaseYear:'2022',rawFormality:'smart-casual'},
{id:'ar003',category:'ARRACADES',brand:'Tous',name:'Arracades aro',color:'Platejat',type:'Aro',rawSeason:'',price:50,quantity:1,wears:72,purchaseYear:'2021',rawFormality:'casual'},
{id:'ar004',category:'ARRACADES',brand:'Bijou Brigitte',name:'Arracades fulles',color:'Platejat',type:'Llarga',rawSeason:'',price:19.9,quantity:1,wears:58,purchaseYear:'2022',rawFormality:'casual'},
{id:'ar005',category:'ARRACADES',brand:'Bijou Brigitte',name:'Arracades línia perles',color:'Perla',type:'Llarga',rawSeason:'',price:19.9,quantity:1,wears:62,purchaseYear:'2022',rawFormality:'casual'},
{id:'ar006',category:'ARRACADES',brand:'Bijou Brigitte',name:'Arracades cercles',color:'Platejat',type:'Llarga',rawSeason:'',price:19.99,quantity:1,wears:44,purchaseYear:'2022',rawFormality:'casual'},
{id:'ar007',category:'ARRACADES',brand:'Bijou Brigitte',name:'Arracades espiral',color:'Platejat',type:'Llarga',rawSeason:'',price:19.9,quantity:1,wears:38,purchaseYear:'2022',rawFormality:'casual'},
{id:'ar008',category:'ARRACADES',brand:'Bijou Brigitte',name:'Arracades flor',color:'Platejat',type:'Curta',rawSeason:'',price:17.95,quantity:1,wears:28,purchaseYear:'2022',rawFormality:'casual'},
{id:'ar009',category:'ARRACADES',brand:'Bijou Brigitte',name:"Arracades Natàlia",color:'Daurat',type:'Llarga',rawSeason:'',price:14.9,quantity:1,wears:20,purchaseYear:'2023',rawFormality:'casual'},
{id:'ar010',category:'ARRACADES',brand:'Roma',name:"Arracades gotes d'aigua",color:'Blanc i Platejat',type:'Llarga',rawSeason:'',price:18,quantity:1,wears:96,purchaseYear:'2022',rawFormality:'casual'},
{id:'ar011',category:'ARRACADES',brand:'Malta',name:'Arracades cercle gran',color:'Platejat',type:'Llarga',rawSeason:'',price:19.99,quantity:1,wears:108,purchaseYear:'2023',rawFormality:'casual'},
{id:'ar012',category:'ARRACADES',brand:'Pdpaola',name:'Arracades arc',color:'Daurat',type:'Aro',rawSeason:'',price:49,quantity:1,wears:34,purchaseYear:'2023',rawFormality:'smart-casual'},
{id:'ar013',category:'ARRACADES',brand:'Pdpaola',name:'Arracades perla',color:'Daurat i Perla',type:'Curta',rawSeason:'',price:55,quantity:1,wears:22,purchaseYear:'2023',rawFormality:'smart-casual'},
{id:'ar014',category:'ARRACADES',brand:'Bijou Brigitte',name:'Arracades penjant',color:'Perla',type:'Curta',rawSeason:'',price:17.99,quantity:1,wears:16,purchaseYear:'2022',rawFormality:'casual'},

/* ── BOLSO ────────────────────────────────────────────────────────── */
{id:'bo001',category:'BOLSO',brand:'Eastpak',name:'Motxilla',color:'Negre',type:'Motxilla',rawSeason:'',price:60,quantity:2,wears:310,purchaseYear:'2021',rawFormality:'casual'},
{id:'bo002',category:'BOLSO',brand:'Jack Wills',name:'Bolso 2 butxaques',color:'Beige',type:'Bandolera',rawSeason:'',price:37.8,quantity:1,wears:88,purchaseYear:'2022',rawFormality:'casual'},
{id:'bo003',category:'BOLSO',brand:'Jack Wills',name:'Bolso 2 butxaques',color:'Negre',type:'Bandolera',rawSeason:'',price:37.8,quantity:1,wears:52,purchaseYear:'2022',rawFormality:'casual'},
{id:'bo004',category:'BOLSO',brand:'Tous',name:'Bolso 2021',color:'Marró',type:'Bandolera',rawSeason:'',price:150,quantity:1,wears:68,purchaseYear:'2021',rawFormality:'smart-casual'},
{id:'bo005',category:'BOLSO',brand:'Tous',name:'Bolso civella',color:'Negre',type:'Formal',rawSeason:'',price:100,quantity:1,wears:24,purchaseYear:'2022',rawFormality:'formal'},
{id:'bo006',category:'BOLSO',brand:'Bimba & Lola',name:'Bolso midi',color:'Beige',type:'Bandolera',rawSeason:'',price:105,quantity:1,wears:75,purchaseYear:'2022',rawFormality:'smart-casual'},
{id:'bo007',category:'BOLSO',brand:'Bimba & Lola',name:'Bolso petit',color:'Negre',type:'Bandolera',rawSeason:'',price:105,quantity:1,wears:44,purchaseYear:'2023',rawFormality:'smart-casual'},
{id:'bo008',category:'BOLSO',brand:'George Gina & Lucy',name:'Bolso gran',color:'Beige',type:'Nanses',rawSeason:'',price:139.9,quantity:1,wears:48,purchaseYear:'2021',rawFormality:'smart-casual'},
{id:'bo009',category:'BOLSO',brand:'George Gina & Lucy',name:'Bolso petit rosa',color:'Rosa',type:'Bandolera',rawSeason:'',price:140,quantity:1,wears:32,purchaseYear:'2022',rawFormality:'casual'},
{id:'bo010',category:'BOLSO',brand:'Kipling',name:'Bolso',color:'Rosa',type:'Bandolera',rawSeason:'',price:120,quantity:1,wears:28,purchaseYear:'2021',rawFormality:'casual'},
{id:'bo011',category:'BOLSO',brand:'Liujo',name:'Bolso brodat',color:'Negre',type:'Formal',rawSeason:'',price:120,quantity:1,wears:14,purchaseYear:'2023',rawFormality:'formal'},
{id:'bo012',category:'BOLSO',brand:'Decathlon',name:'Motxilla esport',color:'Rosa',type:'Motxilla',rawSeason:'',price:20,quantity:1,wears:10,purchaseYear:'2022',rawFormality:'casual'},

/* ── ALTRES ───────────────────────────────────────────────────────── */
{id:'al001',category:'ALTRES',brand:'Guess',name:'Ulleres de sol',color:'Fosc',type:'Ulleres de sol',rawSeason:'',price:120,quantity:1,wears:98,purchaseYear:'2021',rawFormality:'casual'},
{id:'al002',category:'ALTRES',brand:'Ray-Ban',name:'Ulleres de sol',color:'Negre',type:'Ulleres de sol',rawSeason:'',price:145,quantity:1,wears:42,purchaseYear:'2022',rawFormality:'casual'},
{id:'al003',category:'ALTRES',brand:'Stradivarius',name:'Cinturó bàsic',color:'Negre',type:'Cinturó',rawSeason:'',price:15,quantity:1,wears:45,purchaseYear:'2021',rawFormality:'casual'},
{id:'al004',category:'ALTRES',brand:'Stradivarius',name:'Cinturó bàsic',color:'Marró',type:'Cinturó',rawSeason:'',price:15,quantity:1,wears:20,purchaseYear:'2021',rawFormality:'casual'},
{id:'al005',category:'ALTRES',brand:'Stradivarius',name:'Cinturó prim',color:'Negre',type:'Cinturó',rawSeason:'',price:15,quantity:1,wears:18,purchaseYear:'2022',rawFormality:'smart-casual'},
{id:'al006',category:'ALTRES',brand:'Calzedonia',name:'Biquini',color:'Negre',type:'Biquini',rawSeason:'Estiu',price:50,quantity:1,wears:8,purchaseYear:'2022',rawFormality:'casual'},
{id:'al007',category:'ALTRES',brand:'Calzedonia',name:'Biquini volants',color:'Blanc',type:'Biquini',rawSeason:'Estiu',price:60,quantity:1,wears:6,purchaseYear:'2022',rawFormality:'casual'},
{id:'al008',category:'ALTRES',brand:'DeDins',name:'Biquini',color:'Fucsia',type:'Biquini',rawSeason:'Estiu',price:90,quantity:1,wears:5,purchaseYear:'2023',rawFormality:'casual'},
{id:'al009',category:'ALTRES',brand:'Vogue',name:'Paraigües',color:'Marró',type:'Paraigües',rawSeason:'',price:19.99,quantity:1,wears:12,purchaseYear:'2022',rawFormality:'casual'},
{id:'al010',category:'ALTRES',brand:'Pretty',name:'Cinturó de cuir',color:'Negre',type:'Cinturó',rawSeason:'',price:50,quantity:1,wears:22,purchaseYear:'2022',rawFormality:'smart-casual'},
];

// ──────────────────────────────────────────
//  buildItem — converts raw entry to full item object
// ──────────────────────────────────────────
function buildItem(raw){
  const seasons  = mapSeason(raw.rawSeason);
  const formality= autoFormality(raw.type, raw.name);
  const totalCost= raw.price * raw.quantity;
  const cpw      = raw.wears > 0 ? totalCost / raw.wears : totalCost;
  const units    = [];
  for(let i=0;i<raw.quantity;i++){
    units.push({
      id:`${raw.id}_u${i+1}`,
      purchaseDate: raw.purchaseYear ? raw.purchaseYear+'-01-01' : '',
      purchaseYear: raw.purchaseYear||'',
      retired: false,
      retiredDate: ''
    });
  }
  return {
    id: raw.id, category: raw.category, brand: raw.brand, name: raw.name,
    color: raw.color,
    colors: raw.color ? raw.color.split(/\s+i\s+|,\s*/).map(c=>c.trim()).filter(Boolean) : [],
    type: raw.type, seasons, formality,
    price: raw.price, quantity: raw.quantity, units,
    totalCost, wears: raw.wears, cpw,
    purchaseYear: raw.purchaseYear||'',
    size:'', images:[], favourite:false, needsInfo:false,
    retired:false, retiredUnits:0, notes:'', lastWorn:null, seeded:true,
  };
}

// ──────────────────────────────────────────
//  buildWears — generates plausible 3-year wear log
//  Conditions: seasonal logic · formality matching · color coherence · category completeness
// ──────────────────────────────────────────
function buildWears(){
  // Deterministic seeded PRNG
  let _s=20250516;
  function rand(){ _s=Math.imul(_s^(_s>>>16),0x45d9f3b);_s=Math.imul(_s^(_s>>>16),0x45d9f3b);return((_s^(_s>>>16))>>>0)/0xffffffff; }
  function pick(arr){ return arr[Math.floor(rand()*arr.length)]; }
  function maybe(p){ return rand()<p; }

  // Index items by category
  const byCat={};
  RAW_ITEMS.forEach(it=>{ if(!byCat[it.category])byCat[it.category]=[]; byCat[it.category].push(it); });

  // Season bucket by month (1–12)
  function bkt(mo){ if(mo>=6&&mo<=8)return 'estiu'; if(mo>=11||mo<=2)return 'hivern'; return 'entretemps'; }

  // Seasonal fit
  function fitsSeason(it,b){
    if(!it.rawSeason||it.rawSeason==='') return true;
    if(it.rawSeason==='Estiu')      return b==='estiu';
    if(it.rawSeason==='Hivern')     return b==='hivern';
    if(it.rawSeason==='Entretemps') return b==='entretemps'||b==='estiu';
    return true;
  }

  // Formality fit
  function fitsFormality(it,outfit){
    const f=it.rawFormality||'casual';
    if(outfit==='casual')  return f!=='formal';
    if(outfit==='formal')  return f!=='casual';
    return true; // smart-casual: accept all
  }

  // Color compatibility
  const WARM=new Set(['Vermell','Taronja','Fucsia','Rosa','Groc']);
  const COOL=new Set(['Blau','Blau marí','Blau cel','Lila','Verd']);
  function fam(c){ const m=(c||'').split(/\s+i\s+/)[0]; if(WARM.has(m))return'warm';if(COOL.has(m))return'cool';return'neutral'; }
  function colOk(c1,c2){ const f1=fam(c1),f2=fam(c2); if(f1==='neutral'||f2==='neutral')return true; if(f1===f2)return true; return false; }

  // Combined filter (season + formality + optional color reference)
  function fil(pool,b,outfit,ref){
    let r=pool.filter(it=>fitsSeason(it,b)&&fitsFormality(it,outfit));
    if(ref){ const fc=r.filter(it=>colOk(it.color,ref)); if(fc.length>0)r=fc; }
    return r;
  }

  const wears=[];
  const start=new Date('2022-09-01');
  const end  =new Date('2025-05-14');

  for(let d=new Date(start);d<=end;d.setDate(d.getDate()+1)){
    if(!maybe(0.68)) continue;

    const date=d.toISOString().slice(0,10);
    const mo=d.getMonth()+1;
    const season=bkt(mo);
    const fr=rand();
    const outfit=fr<0.70?'casual':fr<0.95?'smart-casual':'formal';
    const ids=[];
    let ref='Negre'; // reference color for outfit coherence

    // ── Core piece ──
    const sPool=fil(byCat['SENCER']||[],season,outfit,null);
    if(season!=='hivern'&&sPool.length>0&&maybe(0.18)){
      const s=pick(sPool); ids.push(s.id); ref=s.color;
    } else {
      const dPool=fil(byCat['DALT']||[],season,outfit,null);
      if(dPool.length>0){
        const top=pick(dPool); ids.push(top.id); ref=top.color;
        const bPool=fil(
          (byCat['BAIX']||[]).filter(it=>it.type!=='Mitges'&&it.type!=='Leggings'&&it.type!=='Biquini'),
          season,outfit,ref
        );
        if(bPool.length>0) ids.push(pick(bPool).id);
      }
    }

    // ── Jacket (mandatory in winter, likely in shoulder seasons) ──
    const needsJacket=season==='hivern'||(season==='entretemps'&&maybe(0.62))||(season==='estiu'&&maybe(0.06));
    if(needsJacket){
      const jPool=fil(byCat['JAQUETA']||[],season,outfit,ref);
      if(jPool.length>0) ids.push(pick(jPool).id);
    }

    // ── Shoes (always) ──
    let saPre=(byCat['SABATES']||[]).filter(it=>{
      if((it.type==='Sandàlies'||it.type==='Xancletes')&&season==='hivern') return false;
      if(it.type==='Xancletes'&&season==='entretemps'&&mo<5) return false;
      if(it.type==='Botina'&&season==='estiu') return false;
      return true;
    });
    let saPool=fil(saPre,season,outfit,ref);
    if(saPool.length===0) saPool=saPre.length>0?saPre:byCat['SABATES']||[];
    if(saPool.length>0) ids.push(pick(saPool).id);

    // ── Earrings (80%) ──
    const arAll=byCat['ARRACADES']||[];
    if(maybe(0.80)&&arAll.length>0) ids.push(pick(arAll).id);

    // ── Bag (72%) ──
    if(maybe(0.72)){
      const bPool=fil((byCat['BOLSO']||[]).filter(it=>it.type!=='Biquini'),season,outfit,ref);
      if(bPool.length>0) ids.push(pick(bPool).id);
    }

    // ── Accessories (sunglasses in summer; belt for non-casual) ──
    const altres=byCat['ALTRES']||[];
    if(season==='estiu'&&maybe(0.45)){
      const sg=altres.filter(it=>it.type==='Ulleres de sol');
      if(sg.length>0) ids.push(pick(sg).id);
    }
    if(outfit!=='casual'&&maybe(0.28)){
      const belts=altres.filter(it=>it.type==='Cinturó');
      const cb=belts.filter(it=>colOk(it.color,ref));
      const src=cb.length>0?cb:belts;
      if(src.length>0) ids.push(pick(src).id);
    }

    if(ids.length>0) wears.push({date,items:ids});
  }

  // Mirror May 2023 → May 2026 (up to today) so the current month is populated
  const today='2026-05-16';
  wears.filter(w=>w.date.startsWith('2023-05')&&w.date.slice(8)<=today.slice(8))
    .forEach(w=>wears.push({date:w.date.replace('2023-05','2026-05'),items:[...w.items]}));

  return wears;
}

const RAW_WEARS=buildWears();
