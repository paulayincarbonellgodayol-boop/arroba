'use strict';

// ══════════════════════════════════════════
//  DB — IndexedDB wrapper
// ══════════════════════════════════════════
const DB_NAME = 'roba_db';
const DB_VER  = 3;
let db;

function openDB(){
  return new Promise((res,rej)=>{
    const req = indexedDB.open(DB_NAME, DB_VER);
    req.onupgradeneeded = e => {
      const d = e.target.result;
      // items store
      if(!d.objectStoreNames.contains('items')){
        const s = d.createObjectStore('items',{keyPath:'id'});
        s.createIndex('category','category',{unique:false});
        s.createIndex('brand','brand',{unique:false});
        s.createIndex('needsInfo','needsInfo',{unique:false});
      }
      // wear log store
      if(!d.objectStoreNames.contains('wears')){
        const w = d.createObjectStore('wears',{keyPath:'id',autoIncrement:true});
        w.createIndex('date','date',{unique:false});
        w.createIndex('itemId','itemId',{unique:false});
      }
      // meta store (settings, seed flag)
      if(!d.objectStoreNames.contains('meta')){
        d.createObjectStore('meta',{keyPath:'key'});
      }
      // outfits store
      if(!d.objectStoreNames.contains('outfits')){
        d.createObjectStore('outfits',{keyPath:'id'});
      }
      // v3: migrate color strings to arrays
      if(e.oldVersion < 3){
        // Migration runs after upgrade — handled in boot
      }
      // trash store (soft-deleted items, auto-clean after 24h)
      if(!d.objectStoreNames.contains('trash')){
        const tr = d.createObjectStore('trash',{keyPath:'id'});
        tr.createIndex('deletedAt','deletedAt',{unique:false});
      }
    };
    req.onsuccess = e => { db = e.target.result; res(db); };
    req.onerror   = e => rej(e.target.error);
  });
}

function dbGet(store, key){
  return new Promise((res,rej)=>{
    const tx = db.transaction(store,'readonly');
    const req = tx.objectStore(store).get(key);
    req.onsuccess = () => res(req.result);
    req.onerror   = () => rej(req.error);
  });
}
function dbPut(store, val){
  return new Promise((res,rej)=>{
    const tx = db.transaction(store,'readwrite');
    const req = tx.objectStore(store).put(val);
    req.onsuccess = () => res(req.result);
    req.onerror   = () => rej(req.error);
  });
}
async function migrateColorsToArrays(){
  const items = await dbGetAll('items');
  for(const item of items){
    // Skip if already an array
    if(Array.isArray(item.colors)) continue;
    const colorStr = item.color || '';
    // Split on " i " and ","
    const parts = colorStr.split(/\s+i\s+|,\s*/).map(c=>c.trim()).filter(Boolean);
    item.colors = parts.length ? parts : (colorStr ? [colorStr] : []);
    await dbPut('items', item);
  }
  console.log('Color migration done');
}

function dbAdd(store, val){
  return new Promise((res,rej)=>{
    const tx = db.transaction(store,'readwrite');
    const req = tx.objectStore(store).add(val);
    req.onsuccess = () => res(req.result);
    req.onerror   = e => rej(e.target.error);
  });
}
function dbDelete(store, key){
  return new Promise((res,rej)=>{
    const tx = db.transaction(store,'readwrite');
    tx.objectStore(store).delete(key);
    tx.oncomplete = res;
    tx.onerror = e => rej(e.target.error);
  });
}
function dbGetAll(store){
  return new Promise((res,rej)=>{
    const tx = db.transaction(store,'readonly');
    const req = tx.objectStore(store).getAll();
    req.onsuccess = () => res(req.result);
    req.onerror   = () => rej(req.error);
  });
}
function dbGetIndex(store, indexName, query){
  return new Promise((res,rej)=>{
    const tx = db.transaction(store,'readonly');
    const req = tx.objectStore(store).index(indexName).getAll(query);
    req.onsuccess = () => res(req.result);
    req.onerror   = () => rej(req.error);
  });
}

// ══════════════════════════════════════════
//  SEED DATA — all imported from spreadsheet
// ══════════════════════════════════════════

// Helper: map old "Entretemps" season to [primavera, tardor]
function mapSeason(s){
  if(!s||s===''||s==='–') return [];
  if(s==='Entretemps') return ['primavera','tardor'];
  if(s==='Estiu')  return ['estiu'];
  if(s==='Hivern') return ['hivern'];
  return [];
}
// Formality auto-assign
function autoFormality(type,name){
  const n=(name||'').toLowerCase();
  const t=(type||'').toLowerCase();
  if(n.includes('xandall')) return ['casual'];
  if(t==='americana'||n.includes('americana')) return ['formal'];
  if(t==='abric') return ['formal'];
  return [];
}

const RAW_ITEMS = [
/* ── DALT ─────────────────────────────────────────────────────────── */
{id:'d001',category:'DALT',brand:'Stradivarius',name:'Brusa brodat 2019',color:'Blanc',type:'Brusa',rawSeason:'Estiu',price:30,quantity:1,wears:19,purchaseYear:'2019'},
{id:'d002',category:'DALT',brand:'Stradivarius',name:'Brusa tirants brodat',color:'Blanc',type:'Brusa',rawSeason:'Estiu',price:12.99,quantity:1,wears:14,purchaseYear:'2020'},
{id:'d003',category:'DALT',brand:'Stradivarius',name:'Top off-shoulder',color:'Negre',type:'Top',rawSeason:'Estiu',price:12.99,quantity:1,wears:11,purchaseYear:'2017'},
{id:'d004',category:'DALT',brand:'Stradivarius',name:'Top de punt',color:'Blanc',type:'Top',rawSeason:'Estiu',price:10,quantity:1,wears:8,purchaseYear:'2021'},
{id:'d005',category:'DALT',brand:'Stradivarius',name:'Jersei de Ratlles',color:'Blanc i Negre',type:'Jersei',rawSeason:'Hivern',price:25,quantity:1,wears:8,purchaseYear:'2021'},
{id:'d006',category:'DALT',brand:'Stradivarius',name:'Jersei off-shoulder',color:'Negre',type:'Jersei',rawSeason:'Hivern',price:13.99,quantity:1,wears:7,purchaseYear:'2023'},
{id:'d007',category:'DALT',brand:'Stradivarius',name:'Brusa tirants brodat curta',color:'Negre',type:'Brusa',rawSeason:'Estiu',price:15,quantity:1,wears:7,purchaseYear:'2020'},
{id:'d008',category:'DALT',brand:'Stradivarius',name:'Brusa escotada botons',color:'Negre',type:'Brusa',rawSeason:'Entretemps',price:20,quantity:1,wears:3,purchaseYear:'2021'},
{id:'d009',category:'DALT',brand:'Stradivarius',name:'Jersei cropped',color:'Gris',type:'Jersei',rawSeason:'Hivern',price:25,quantity:1,wears:3,purchaseYear:'2020'},
{id:'d010',category:'DALT',brand:'Stradivarius',name:'Brusa tirants brodat',color:'Negre',type:'Brusa',rawSeason:'Estiu',price:20,quantity:1,wears:4,purchaseYear:'2019'},
{id:'d011',category:'DALT',brand:'Stradivarius',name:'Jersei coll de pic',color:'Gris',type:'Jersei',rawSeason:'',price:15.99,quantity:1,wears:1,purchaseYear:'2023'},
{id:'d012',category:'DALT',brand:'Mango',name:'Cardigan Luca',color:'Negre',type:'Cardigan',rawSeason:'Entretemps',price:22.99,quantity:1,wears:17,purchaseYear:'2022'},
{id:'d013',category:'DALT',brand:'Mango',name:'Samarreta Màniga Curta Anella',color:'Negre',type:'Samarreta',rawSeason:'Estiu',price:22.49,quantity:1,wears:17,purchaseYear:'2022'},
{id:'d014',category:'DALT',brand:'Mango',name:'Jersei Lucca ralles',color:'Negre i Marró',type:'Jersei',rawSeason:'Hivern',price:19.99,quantity:1,wears:14,purchaseYear:'2022'},
{id:'d015',category:'DALT',brand:'Mango',name:'Cardigan Crochi',color:'Negre',type:'Cardigan',rawSeason:'Entretemps',price:19.99,quantity:1,wears:11,purchaseYear:'2022'},
{id:'d016',category:'DALT',brand:'Mango',name:'Samarreta Màniga Llarga Figo',color:'Gris',type:'Samarreta',rawSeason:'Entretemps',price:19.99,quantity:1,wears:9,purchaseYear:'2022'},
{id:'d017',category:'DALT',brand:'Mango',name:'Samarreta Màniga Curta Anella',color:'Vermell',type:'Samarreta',rawSeason:'Estiu',price:14.99,quantity:1,wears:4,purchaseYear:'2022'},
{id:'d018',category:'DALT',brand:'Mango',name:'Camisa',color:'Negre',type:'Camisa',rawSeason:'Hivern',price:25.99,quantity:1,wears:3,purchaseYear:'2022'},
{id:'d019',category:'DALT',brand:'Mango',name:'Cardigan Crochi',color:'Taronja',type:'Cardigan',rawSeason:'Entretemps',price:19.99,quantity:1,wears:3,purchaseYear:'2022'},
{id:'d020',category:'DALT',brand:'Mango',name:'Samarreta Amalfi',color:'Rosa',type:'Samarreta',rawSeason:'Estiu',price:12.99,quantity:1,wears:1,purchaseYear:'2023'},
{id:'d021',category:'DALT',brand:'Mango',name:'Samarreta Chalapi VNeck',color:'Negre',type:'Samarreta',rawSeason:'Estiu',price:7.99,quantity:5,wears:32,purchaseYear:'2022'},
{id:'d022',category:'DALT',brand:'Mango',name:'Samarreta Chalapi VNeck',color:'Blanc',type:'Samarreta',rawSeason:'Estiu',price:7.99,quantity:3,wears:12,purchaseYear:'2022'},
{id:'d023',category:'DALT',brand:'Jack Wills',name:'Samarreta Màniga Curta coll rodó',color:'Blanc',type:'Samarreta',rawSeason:'Estiu',price:16.03,quantity:2,wears:26,purchaseYear:'2022'},
{id:'d024',category:'DALT',brand:'Jack Wills',name:'Samarreta Màniga Curta coll rodó',color:'Negre',type:'Samarreta',rawSeason:'Estiu',price:16.03,quantity:1,wears:11,purchaseYear:'2022'},
{id:'d025',category:'DALT',brand:'Jack Wills',name:'Samarreta Màniga Curta coll rodó',color:'Gris',type:'Samarreta',rawSeason:'Estiu',price:16.03,quantity:1,wears:8,purchaseYear:'2022'},
{id:'d026',category:'DALT',brand:'Jack Wills',name:'Brusa de vol',color:'Negre',type:'Brusa',rawSeason:'Estiu',price:25,quantity:1,wears:12,purchaseYear:'2022'},
{id:'d027',category:'DALT',brand:'Jack Wills',name:'Brusa de vol',color:'Blanc',type:'Brusa',rawSeason:'Estiu',price:25,quantity:1,wears:4,purchaseYear:'2022'},
{id:'d028',category:'DALT',brand:'Jack Wills',name:'Brusa off-shoulder',color:'Rosa',type:'Brusa',rawSeason:'Estiu',price:30,quantity:1,wears:6,purchaseYear:'2017'},
{id:'d029',category:'DALT',brand:'Jack Wills',name:'Camisa',color:'Blanc',type:'Camisa',rawSeason:'Entretemps',price:40,quantity:1,wears:5,purchaseYear:'2019'},
{id:'d030',category:'DALT',brand:'Jack Wills',name:'Camisa Màniga curta quadres',color:'Blanc i Negre',type:'Camisa',rawSeason:'Estiu',price:30,quantity:1,wears:1,purchaseYear:'2019'},
{id:'d031',category:'DALT',brand:'Massimo Dutti',name:'Samarreta Màniga Llarga',color:'Negre',type:'Samarreta',rawSeason:'Estiu',price:29.95,quantity:2,wears:27,purchaseYear:''},
{id:'d032',category:'DALT',brand:'Massimo Dutti',name:'Camisa',color:'Blanc',type:'Camisa',rawSeason:'Hivern',price:49.95,quantity:1,wears:11,purchaseYear:'2022'},
{id:'d033',category:'DALT',brand:'Massimo Dutti',name:'Camisa',color:'Blau',type:'Camisa',rawSeason:'Hivern',price:49.95,quantity:1,wears:8,purchaseYear:'2022'},
{id:'d034',category:'DALT',brand:'Massimo Dutti',name:'Jersei',color:'Beige',type:'Jersei',rawSeason:'Hivern',price:40,quantity:1,wears:5,purchaseYear:'2021'},
{id:'d035',category:'DALT',brand:'Massimo Dutti',name:'Jersei',color:'Vi',type:'Jersei',rawSeason:'Hivern',price:40,quantity:1,wears:2,purchaseYear:'2021'},
{id:'d036',category:'DALT',brand:'Liujo',name:'Brusa volants',color:'Negre',type:'Brusa',rawSeason:'Estiu',price:60,quantity:1,wears:15,purchaseYear:'2021'},
{id:'d037',category:'DALT',brand:'Liujo',name:'Brusa volants',color:'Blanc',type:'Brusa',rawSeason:'Estiu',price:60,quantity:1,wears:10,purchaseYear:'2020'},
{id:'d038',category:'DALT',brand:'Liujo',name:'Jersei brillants coll de pic',color:'Gris',type:'Jersei',rawSeason:'Hivern',price:45,quantity:1,wears:10,purchaseYear:'2023'},
{id:'d039',category:'DALT',brand:'Liujo',name:'Jersei línies',color:'Blanc i Negre',type:'Jersei',rawSeason:'Hivern',price:40,quantity:1,wears:5,purchaseYear:'2023'},
{id:'d040',category:'DALT',brand:'Liujo',name:'Jersei línia brillant',color:'Vermell',type:'Jersei',rawSeason:'Hivern',price:35,quantity:1,wears:5,purchaseYear:'2022'},
{id:'d041',category:'DALT',brand:'Liujo',name:'Jersei cordills Màniga',color:'Negre',type:'Jersei',rawSeason:'Hivern',price:60,quantity:1,wears:4,purchaseYear:'2022'},
{id:'d042',category:'DALT',brand:'Liujo',name:'Camisa texana',color:'Negre',type:'Camisa',rawSeason:'Entretemps',price:50,quantity:1,wears:3,purchaseYear:'2022'},
{id:'d043',category:'DALT',brand:'Polo Ralph Lauren',name:'Camisa',color:'Blanc',type:'Camisa',rawSeason:'Entretemps',price:130,quantity:1,wears:25,purchaseYear:'2022'},
{id:'d044',category:'DALT',brand:'Polo Ralph Lauren',name:'Camisa',color:'Blanc i Blau',type:'Camisa',rawSeason:'Entretemps',price:99,quantity:1,wears:4,purchaseYear:'2023'},
{id:'d045',category:'DALT',brand:'Fracomina',name:'Jersei Botons Màniga',color:'Negre',type:'Jersei',rawSeason:'Hivern',price:40,quantity:1,wears:15,purchaseYear:'2019'},
{id:'d046',category:'DALT',brand:'Fracomina',name:'Camisa satí',color:'Negre',type:'Camisa',rawSeason:'Entretemps',price:100,quantity:1,wears:3,purchaseYear:'2021'},
{id:'d047',category:'DALT',brand:'Fracomina',name:'Jersei Botons Màniga',color:'Blau',type:'Jersei',rawSeason:'Hivern',price:40,quantity:1,wears:2,purchaseYear:'2019'},
{id:'d048',category:'DALT',brand:'Trovels',name:'Camisa',color:'Blanc',type:'Camisa',rawSeason:'Entretemps',price:100,quantity:1,wears:12,purchaseYear:'2022'},
{id:'d049',category:'DALT',brand:'Trovels',name:'Camisa',color:'Negre',type:'Camisa',rawSeason:'Entretemps',price:100,quantity:1,wears:4,purchaseYear:'2022'},
{id:'d050',category:'DALT',brand:'Guess',name:'Jersei',color:'Vermell',type:'Jersei',rawSeason:'Hivern',price:100,quantity:1,wears:6,purchaseYear:'2020'},
{id:'d051',category:'DALT',brand:'Guess',name:'Camisa Tatxes',color:'Negre',type:'Camisa',rawSeason:'Entretemps',price:60,quantity:1,wears:5,purchaseYear:'2020'},
{id:'d052',category:'DALT',brand:'Guess',name:'Jersei',color:'Negre',type:'Jersei',rawSeason:'Hivern',price:100,quantity:1,wears:3,purchaseYear:'2020'},
{id:'d053',category:'DALT',brand:'Salsa',name:'Jersei Albina línia platejada',color:'Negre',type:'Jersei',rawSeason:'Hivern',price:60,quantity:1,wears:10,purchaseYear:'2020'},
{id:'d054',category:'DALT',brand:'Rinascimento',name:'Jersei',color:'Beige',type:'Jersei',rawSeason:'Hivern',price:70,quantity:1,wears:9,purchaseYear:'2021'},
{id:'d055',category:'DALT',brand:'Scalpers',name:'Camisa clàssica brodat pit ralles',color:'Blanc i Blau',type:'Camisa',rawSeason:'Entretemps',price:69.99,quantity:1,wears:5,purchaseYear:'2022'},
{id:'d056',category:'DALT',brand:'Scalpers',name:'Camisa clàssica brodat pit',color:'Blau',type:'Camisa',rawSeason:'Entretemps',price:69.99,quantity:1,wears:4,purchaseYear:'2022'},
{id:'d057',category:'DALT',brand:'Decathlon',name:'Samarreta Màniga Curta',color:'Rosa',type:'Samarreta',rawSeason:'Estiu',price:15,quantity:1,wears:7,purchaseYear:'2020'},
{id:'d058',category:'DALT',brand:'Monari',name:'Camisa floral',color:'Blanc',type:'Camisa',rawSeason:'Entretemps',price:100,quantity:1,wears:7,purchaseYear:'2021'},
{id:'d059',category:'DALT',brand:'Superdry',name:'Top off-shoulder',color:'Blanc',type:'Top',rawSeason:'Estiu',price:35,quantity:2,wears:6,purchaseYear:'2022'},
{id:'d060',category:'DALT',brand:'Springfield',name:'Brusa brodat',color:'Blanc',type:'Brusa',rawSeason:'Estiu',price:20,quantity:1,wears:4,purchaseYear:'2022'},
{id:'d061',category:'DALT',brand:'Springfield',name:'Brusa off-shoulder',color:'Blanc',type:'Brusa',rawSeason:'Estiu',price:19.99,quantity:1,wears:2,purchaseYear:'2016'},
{id:'d062',category:'DALT',brand:'Marta',name:'Jersei prim',color:'Blanc',type:'Jersei',rawSeason:'Entretemps',price:50,quantity:1,wears:5,purchaseYear:'2018'},
{id:'d063',category:'DALT',brand:'Biscuter',name:'Samarreta brodat',color:'Negre',type:'Samarreta',rawSeason:'Estiu',price:50,quantity:1,wears:5,purchaseYear:'2021'},
{id:'d064',category:'DALT',brand:'Blanes',name:'Top parada tirants',color:'Blanc',type:'Top',rawSeason:'Estiu',price:15,quantity:1,wears:4,purchaseYear:'2021'},
{id:'d065',category:'DALT',brand:'Lola Casademunt',name:'Jersei llis relleu Albina',color:'Negre',type:'Jersei',rawSeason:'Hivern',price:70,quantity:1,wears:2,purchaseYear:'2021'},
{id:'d066',category:'DALT',brand:'Etxart & Panno',name:'Brusa tirants',color:'Negre',type:'Brusa',rawSeason:'Estiu',price:60,quantity:1,wears:10,purchaseYear:'2017'},
{id:'d067',category:'DALT',brand:'Zara',name:'Samarreta VNeck',color:'Blanc',type:'Samarreta',rawSeason:'Estiu',price:11.99,quantity:1,wears:7,purchaseYear:'2020'},
{id:'d068',category:'DALT',brand:'Zara',name:'Samarreta VNeck',color:'Negre',type:'Samarreta',rawSeason:'Estiu',price:7.99,quantity:1,wears:15,purchaseYear:'2020'},
{id:'d069',category:'DALT',brand:'Pretty',name:'Brusa llaç',color:'Blanc',type:'Brusa',rawSeason:'Estiu',price:50,quantity:1,wears:1,purchaseYear:'2021'},
{id:'d070',category:'DALT',brand:'Hollister',name:'Brusa coll de pic vol',color:'Blanc',type:'Brusa',rawSeason:'Estiu',price:30,quantity:1,wears:1,purchaseYear:'2023'},
{id:'d071',category:'DALT',brand:'Subdued',name:'Top off-shoulder',color:'Negre',type:'Top',rawSeason:'Estiu',price:17.5,quantity:1,wears:3,purchaseYear:'2021'},
{id:'d072',category:'DALT',brand:'Olympia',name:'Samarreta',color:'Rosa',type:'Samarreta',rawSeason:'Estiu',price:15,quantity:1,wears:1,purchaseYear:'2023'},
{id:'d073',category:'DALT',brand:'Only',name:'Camisa',color:'Blanc',type:'Camisa',rawSeason:'',price:30,quantity:1,wears:2,purchaseYear:'2023'},
{id:'d074',category:'DALT',brand:'Only',name:'Camisa',color:'Blau marí',type:'Camisa',rawSeason:'Entretemps',price:30,quantity:1,wears:1,purchaseYear:'2023'},
{id:'d075',category:'DALT',brand:'H&M',name:'Brusa off-shoulder',color:'Blanc',type:'Brusa',rawSeason:'Entretemps',price:30,quantity:1,wears:2,purchaseYear:'2019'},
{id:'d076',category:'DALT',brand:'H&M',name:'Top tirants',color:'Blanc',type:'Top',rawSeason:'Estiu',price:15,quantity:1,wears:1,purchaseYear:'2019'},
{id:'d077',category:'DALT',brand:'UVic',name:'Samarreta',color:'Vermell',type:'Samarreta',rawSeason:'Estiu',price:0,quantity:1,wears:1,purchaseYear:'2023'},

/* ── BAIX ─────────────────────────────────────────────────────────── */
{id:'b001',category:'BAIX',brand:'Stradivarius',name:'Texans campana',color:'Texà',type:'Texans',rawSeason:'',price:19.99,quantity:2,wears:17,purchaseYear:'2021'},
{id:'b002',category:'BAIX',brand:'Stradivarius',name:'Texans campana texà clar',color:'Texà',type:'Texans',rawSeason:'',price:19.99,quantity:1,wears:6,purchaseYear:'2021'},
{id:'b003',category:'BAIX',brand:'Stradivarius',name:'Texans estrets',color:'Negre',type:'Texans',rawSeason:'',price:39.98,quantity:1,wears:7,purchaseYear:'2021'},
{id:'b004',category:'BAIX',brand:'Stradivarius',name:'Texans estrets',color:'Texà',type:'Texans',rawSeason:'',price:19.99,quantity:4,wears:14,purchaseYear:'2021'},
{id:'b005',category:'BAIX',brand:'Stradivarius',name:'Pantalons campana',color:'Negre',type:'Pantalons',rawSeason:'',price:19.99,quantity:2,wears:24,purchaseYear:'2022'},
{id:'b006',category:'BAIX',brand:'Stradivarius',name:'Pantalons campana',color:'Blanc',type:'Pantalons',rawSeason:'',price:19.99,quantity:1,wears:11,purchaseYear:'2021'},
{id:'b007',category:'BAIX',brand:'Stradivarius',name:'Pantalons mom slim',color:'Negre',type:'Pantalons',rawSeason:'',price:19.99,quantity:1,wears:8,purchaseYear:'2022'},
{id:'b008',category:'BAIX',brand:'Stradivarius',name:'Pantalons amples fil',color:'Negre',type:'Pantalons',rawSeason:'',price:19.99,quantity:1,wears:3,purchaseYear:'2020'},
{id:'b009',category:'BAIX',brand:'Stradivarius',name:'Faldilla pantaló punts',color:'Blanc i Negre',type:'Faldilla',rawSeason:'',price:19.99,quantity:1,wears:13,purchaseYear:'2020'},
{id:'b010',category:'BAIX',brand:'Stradivarius',name:'Faldilla pantaló llisa',color:'Blanc',type:'Faldilla',rawSeason:'',price:17.49,quantity:1,wears:11,purchaseYear:'2021'},
{id:'b011',category:'BAIX',brand:'Stradivarius',name:'Faldilla floral',color:'Blau',type:'Faldilla',rawSeason:'',price:19.99,quantity:1,wears:9,purchaseYear:'2020'},
{id:'b012',category:'BAIX',brand:'Stradivarius',name:'Faldilla texana',color:'Blanc',type:'Faldilla',rawSeason:'',price:19.99,quantity:1,wears:10,purchaseYear:'2021'},
{id:'b013',category:'BAIX',brand:'Stradivarius',name:'Faldilla pantaló llisa',color:'Negre',type:'Faldilla',rawSeason:'',price:19.99,quantity:1,wears:5,purchaseYear:'2020'},
{id:'b014',category:'BAIX',brand:'Stradivarius',name:'Faldilla',color:'Beige',type:'Faldilla',rawSeason:'',price:19.99,quantity:1,wears:1,purchaseYear:'2021'},
{id:'b015',category:'BAIX',brand:'Stradivarius',name:'Shorts texans',color:'Texà',type:'Shorts',rawSeason:'',price:19.99,quantity:1,wears:12,purchaseYear:'2017'},
{id:'b016',category:'BAIX',brand:'Stradivarius',name:'Shorts texans',color:'Blanc',type:'Shorts',rawSeason:'',price:12.99,quantity:2,wears:6,purchaseYear:'2021'},
{id:'b017',category:'BAIX',brand:'Stradivarius',name:'Shorts arreglar',color:'Negre',type:'Shorts',rawSeason:'',price:19.99,quantity:1,wears:2,purchaseYear:'2021'},
{id:'b018',category:'BAIX',brand:'Stradivarius',name:'Shorts arreglar',color:'Blanc',type:'Shorts',rawSeason:'',price:19.99,quantity:1,wears:0,purchaseYear:'2021'},
{id:'b019',category:'BAIX',brand:'Stradivarius',name:'Shorts tennis',color:'Blanc',type:'Shorts',rawSeason:'',price:19.99,quantity:1,wears:1,purchaseYear:'2022'},
{id:'b020',category:'BAIX',brand:'Stradivarius',name:'Shorts',color:'Negre',type:'Shorts',rawSeason:'',price:19.99,quantity:1,wears:2,purchaseYear:'2021'},
{id:'b021',category:'BAIX',brand:'Mango',name:'Texans Nayara',color:'Texà',type:'Texans',rawSeason:'',price:29.99,quantity:1,wears:26,purchaseYear:'2023'},
{id:'b022',category:'BAIX',brand:'Mango',name:'Texans línia brillant',color:'Texà',type:'Texans',rawSeason:'',price:29.99,quantity:1,wears:20,purchaseYear:'2020'},
{id:'b023',category:'BAIX',brand:'Mango',name:'Faldilla texana',color:'Texà',type:'Faldilla',rawSeason:'',price:22.99,quantity:1,wears:20,purchaseYear:'2019'},
{id:'b024',category:'BAIX',brand:'Mango',name:'Faldilla Grunge civella',color:'Gris',type:'Faldilla',rawSeason:'',price:25.99,quantity:1,wears:6,purchaseYear:'2022'},
{id:'b025',category:'BAIX',brand:'Mango',name:'Faldilla recta',color:'Negre',type:'Faldilla',rawSeason:'',price:19.99,quantity:1,wears:8,purchaseYear:'2019'},
{id:'b026',category:'BAIX',brand:'Mango',name:'Shorts texans',color:'Texà',type:'Shorts',rawSeason:'',price:22.99,quantity:1,wears:3,purchaseYear:'2019'},
{id:'b027',category:'BAIX',brand:'Mango',name:'Pantalons Macaron-a',color:'Negre',type:'Pantalons',rawSeason:'',price:25.99,quantity:1,wears:4,purchaseYear:'2022'},
{id:'b028',category:'BAIX',brand:'Replay',name:'Texans campana',color:'Texà',type:'Texans',rawSeason:'',price:70,quantity:2,wears:34,purchaseYear:'2021'},
{id:'b029',category:'BAIX',brand:'Monari',name:'Pantalons amples',color:'Blanc',type:'Pantalons',rawSeason:'',price:100,quantity:1,wears:23,purchaseYear:'2021'},
{id:'b030',category:'BAIX',brand:'Only',name:'Pantalons amples fils',color:'Beige',type:'Pantalons',rawSeason:'',price:39.99,quantity:1,wears:16,purchaseYear:'2022'},
{id:'b031',category:'BAIX',brand:'Only',name:'Faldilla Vellut',color:'Negre',type:'Faldilla',rawSeason:'',price:25.99,quantity:1,wears:16,purchaseYear:'2023'},
{id:'b032',category:'BAIX',brand:'Only',name:'Faldilla Missouri',color:'Marró',type:'Faldilla',rawSeason:'',price:34.99,quantity:1,wears:13,purchaseYear:'2021'},
{id:'b033',category:'BAIX',brand:'Only',name:'Faldilla Amazing',color:'Texà',type:'Faldilla',rawSeason:'',price:29.99,quantity:1,wears:6,purchaseYear:'2021'},
{id:'b034',category:'BAIX',brand:'Only',name:'Faldilla Vellut',color:'Marró',type:'Faldilla',rawSeason:'',price:25.99,quantity:1,wears:5,purchaseYear:'2023'},
{id:'b035',category:'BAIX',brand:'Liujo',name:'Pantalons',color:'Marró',type:'Pantalons',rawSeason:'',price:53,quantity:1,wears:15,purchaseYear:'2023'},
{id:'b036',category:'BAIX',brand:'Liujo',name:'Faldilla civella',color:'Texà',type:'Faldilla',rawSeason:'',price:40,quantity:1,wears:8,purchaseYear:'2023'},
{id:'b037',category:'BAIX',brand:'Liujo',name:'Faldilla',color:'Negre',type:'Faldilla',rawSeason:'',price:53,quantity:1,wears:6,purchaseYear:'2023'},
{id:'b038',category:'BAIX',brand:'Jack Wills',name:'Pantalons xandall 2023',color:'Negre',type:'Pantalons',rawSeason:'',price:28,quantity:2,wears:19,purchaseYear:'2023'},
{id:'b039',category:'BAIX',brand:'Jack Wills',name:'Pantalons xandall',color:'Negre',type:'Pantalons',rawSeason:'',price:30,quantity:1,wears:2,purchaseYear:'2018'},
{id:'b040',category:'BAIX',brand:'Jack Wills',name:'Texans',color:'Blau',type:'Texans',rawSeason:'',price:35,quantity:1,wears:6,purchaseYear:'2019'},
{id:'b041',category:'BAIX',brand:'Fracomina',name:'Pantalons xandall',color:'Negre',type:'Pantalons',rawSeason:'',price:50,quantity:1,wears:13,purchaseYear:'2018'},
{id:'b042',category:'BAIX',brand:'Fracomina',name:'Texans',color:'Texà',type:'Texans',rawSeason:'',price:96,quantity:1,wears:7,purchaseYear:'2018'},
{id:'b043',category:'BAIX',brand:'Guess',name:'Texans estrets',color:'Texà',type:'Texans',rawSeason:'',price:70,quantity:1,wears:10,purchaseYear:'2021'},
{id:'b044',category:'BAIX',brand:'Nike',name:'Malles',color:'Negre',type:'Altres',rawSeason:'',price:29.99,quantity:1,wears:7,purchaseYear:'2022'},
{id:'b045',category:'BAIX',brand:'Adidas',name:'Malles mama',color:'Negre',type:'Altres',rawSeason:'',price:0,quantity:1,wears:3,purchaseYear:'2023'},
{id:'b046',category:'BAIX',brand:'Pep Llasera',name:'Pantalons fil ralles',color:'Blanc i Blau',type:'Pantalons',rawSeason:'',price:25,quantity:1,wears:10,purchaseYear:'2021'},
{id:'b047',category:'BAIX',brand:'Pep Llasera',name:'Pantalons fil',color:'Blanc',type:'Pantalons',rawSeason:'',price:25,quantity:1,wears:8,purchaseYear:'2021'},
{id:'b048',category:'BAIX',brand:'D\'elle',name:'Pantalons pinça',color:'Marró',type:'Pantalons',rawSeason:'',price:100,quantity:1,wears:7,purchaseYear:'2021'},
{id:'b049',category:'BAIX',brand:'D\'elle',name:'Pantalons pinça',color:'Beige',type:'Pantalons',rawSeason:'',price:100,quantity:1,wears:3,purchaseYear:'2021'},
{id:'b050',category:'BAIX',brand:'Massimo Dutti',name:'Pantalons mom slim',color:'Negre',type:'Pantalons',rawSeason:'',price:40,quantity:1,wears:9,purchaseYear:'2021'},
{id:'b051',category:'BAIX',brand:'Massimo Dutti',name:'Texans mom slim',color:'Texà',type:'Texans',rawSeason:'',price:40,quantity:1,wears:1,purchaseYear:'2021'},
{id:'b052',category:'BAIX',brand:'River Island',name:'Shorts civella',color:'Negre',type:'Shorts',rawSeason:'',price:35,quantity:1,wears:8,purchaseYear:'2022'},
{id:'b053',category:'BAIX',brand:'Etxart & Panno',name:'Shorts cinturó',color:'Negre',type:'Shorts',rawSeason:'',price:40,quantity:1,wears:4,purchaseYear:'2018'},
{id:'b054',category:'BAIX',brand:'Calzedonia',name:'Mitges trenta',color:'Negre',type:'Mitges',rawSeason:'',price:9.95,quantity:4,wears:39,purchaseYear:'2022'},
{id:'b055',category:'BAIX',brand:'Calzedonia',name:'Mitges trenta',color:'Platejat i Negre',type:'Mitges',rawSeason:'',price:15,quantity:1,wears:1,purchaseYear:'2023'},
{id:'b056',category:'BAIX',brand:'Calzedonia',name:'Mitges tupides',color:'Negre',type:'Mitges',rawSeason:'',price:8,quantity:1,wears:11,purchaseYear:'2019'},
{id:'b057',category:'BAIX',brand:'Calzedonia',name:'Mitges quinze',color:'Carn',type:'Mitges',rawSeason:'',price:8,quantity:1,wears:6,purchaseYear:'2023'},
{id:'b058',category:'BAIX',brand:'Calzedonia',name:'Shorts fil',color:'Negre',type:'Shorts',rawSeason:'',price:10,quantity:1,wears:7,purchaseYear:'2022'},
{id:'b059',category:'BAIX',brand:'Calzedonia',name:'Shorts fil',color:'Taronja',type:'Shorts',rawSeason:'',price:10,quantity:1,wears:4,purchaseYear:'2022'},
{id:'b060',category:'BAIX',brand:'Janira',name:'Mitges',color:'Negre',type:'Mitges',rawSeason:'',price:8,quantity:1,wears:6,purchaseYear:'2022'},
{id:'b061',category:'BAIX',brand:'Marta',name:'Pantalons Palazzo',color:'Negre',type:'Pantalons',rawSeason:'',price:80,quantity:1,wears:5,purchaseYear:'2018'},
{id:'b062',category:'BAIX',brand:'Tommy Hilfiger',name:'Pantalons chino',color:'Beige',type:'Pantalons',rawSeason:'',price:139,quantity:1,wears:2,purchaseYear:'2022'},
{id:'b063',category:'BAIX',brand:'Subdued',name:'Faldilla',color:'Blanc',type:'Faldilla',rawSeason:'',price:35,quantity:1,wears:3,purchaseYear:'2021'},
{id:'b064',category:'BAIX',brand:'Blanes',name:'Faldilla llarga',color:'Blanc',type:'Faldilla',rawSeason:'',price:25,quantity:1,wears:2,purchaseYear:'2022'},

/* ── SENCER ───────────────────────────────────────────────────────── */
{id:'s001',category:'SENCER',brand:'Only',name:'Vestit wrap',color:'Negre',type:'Vestit',rawSeason:'',price:29.99,quantity:1,wears:10,purchaseYear:'2023'},
{id:'s002',category:'SENCER',brand:'Zara',name:'Vestit Button-Down',color:'Blanc',type:'Vestit',rawSeason:'',price:50,quantity:1,wears:6,purchaseYear:'2020'},
{id:'s003',category:'SENCER',brand:'Sevilla',name:'Vestit brodat',color:'Blanc',type:'Vestit',rawSeason:'',price:40,quantity:1,wears:10,purchaseYear:'2021'},
{id:'s004',category:'SENCER',brand:'Sevilla',name:'Vestit llarg',color:'Vermell',type:'Vestit',rawSeason:'',price:25,quantity:1,wears:2,purchaseYear:'2021'},
{id:'s005',category:'SENCER',brand:'Melitea',name:'Vestit Roma vellut',color:'Negre',type:'Vestit',rawSeason:'',price:40,quantity:1,wears:5,purchaseYear:'2019'},
{id:'s006',category:'SENCER',brand:'Hollister',name:'Mono',color:'Blanc',type:'Mono',rawSeason:'',price:40,quantity:1,wears:4,purchaseYear:'2023'},
{id:'s007',category:'SENCER',brand:'Jack Wills',name:'Mono brodat',color:'Blanc',type:'Mono',rawSeason:'',price:60,quantity:1,wears:4,purchaseYear:'2019'},
{id:'s008',category:'SENCER',brand:'Liujo',name:'Vestit estampat lleopard',color:'Multicolor',type:'Vestit',rawSeason:'',price:100,quantity:1,wears:2,purchaseYear:'2022'},
{id:'s009',category:'SENCER',brand:'Liujo',name:'Vestit caputxa',color:'Negre',type:'Vestit',rawSeason:'',price:100,quantity:1,wears:3,purchaseYear:'2018'},
{id:'s010',category:'SENCER',brand:'Roma',name:'Mono brillants',color:'Negre',type:'Mono',rawSeason:'',price:30,quantity:1,wears:2,purchaseYear:'2017'},
{id:'s011',category:'SENCER',brand:'Etxart & Panno',name:'Mono vellut',color:'Marró',type:'Mono',rawSeason:'',price:100,quantity:1,wears:3,purchaseYear:'2017'},
{id:'s012',category:'SENCER',brand:'Altres',name:'Vestit ganxos tirants',color:'Negre',type:'Vestit',rawSeason:'',price:100,quantity:1,wears:1,purchaseYear:'2020'},
{id:'s013',category:'SENCER',brand:'Altres',name:'Vestit pell serp',color:'Negre',type:'Vestit',rawSeason:'',price:150,quantity:1,wears:2,purchaseYear:'2020'},
{id:'s014',category:'SENCER',brand:'Next',name:'Vestit floral',color:'Multicolor',type:'Vestit',rawSeason:'',price:38,quantity:1,wears:1,purchaseYear:'2022'},
{id:'s015',category:'SENCER',brand:'River Island',name:'Vestit',color:'Blanc',type:'Vestit',rawSeason:'',price:60,quantity:1,wears:1,purchaseYear:'2023'},
{id:'s016',category:'SENCER',brand:'Stradivarius',name:'Vestit Caqui',color:'Verd',type:'Vestit',rawSeason:'',price:30,quantity:1,wears:1,purchaseYear:'2022'},
{id:'s017',category:'SENCER',brand:'Stradivarius',name:'Vestit Button-Down',color:'Texà',type:'Vestit',rawSeason:'',price:26.59,quantity:1,wears:1,purchaseYear:''},
{id:'s018',category:'SENCER',brand:'Mango',name:'Vestit vellut',color:'Lila',type:'Vestit',rawSeason:'',price:29.99,quantity:1,wears:1,purchaseYear:'2023'},
{id:'s019',category:'SENCER',brand:'Roma',name:'Vestit off-shoulder',color:'Negre',type:'Vestit',rawSeason:'',price:40,quantity:1,wears:1,purchaseYear:'2019'},

/* ── JAQUETA ──────────────────────────────────────────────────────── */
{id:'j001',category:'JAQUETA',brand:'Henry Arroway',name:'Anorac',color:'Negre',type:'Anorac',rawSeason:'',price:395,quantity:1,wears:174,purchaseYear:'2020'},
{id:'j002',category:'JAQUETA',brand:'Henry Arroway',name:'Anorac gruixut',color:'Negre',type:'Anorac',rawSeason:'',price:400,quantity:1,wears:1,purchaseYear:'2023'},
{id:'j003',category:'JAQUETA',brand:'Jack Wills',name:'Jaqueta texana',color:'Blanc',type:'Texana',rawSeason:'',price:50,quantity:1,wears:68,purchaseYear:'2016'},
{id:'j004',category:'JAQUETA',brand:'Michael Kors',name:'Jaqueta',color:'Negre',type:'Curta',rawSeason:'',price:150,quantity:1,wears:103,purchaseYear:'2021'},
{id:'j005',category:'JAQUETA',brand:'Please',name:'Jaqueta texana',color:'Blanc',type:'Texana',rawSeason:'',price:100,quantity:1,wears:36,purchaseYear:'2018'},
{id:'j006',category:'JAQUETA',brand:'Hollister',name:'Jaqueta curta',color:'Gris',type:'Curta',rawSeason:'',price:125,quantity:1,wears:36,purchaseYear:'2017'},
{id:'j007',category:'JAQUETA',brand:'Massimo Dutti',name:'Jaqueta de pell',color:'Negre',type:'Pell',rawSeason:'',price:150,quantity:1,wears:29,purchaseYear:'2020'},
{id:'j008',category:'JAQUETA',brand:'Massimo Dutti',name:'Jaqueta de pell',color:'Marró',type:'Pell',rawSeason:'',price:150,quantity:1,wears:5,purchaseYear:''},
{id:'j009',category:'JAQUETA',brand:'Jack Wills',name:'Dessuadora',color:'Blanc',type:'Dessuadora',rawSeason:'',price:40,quantity:1,wears:22,purchaseYear:'2018'},
{id:'j010',category:'JAQUETA',brand:'Jack Wills',name:'Dessuadora',color:'Blau',type:'Dessuadora',rawSeason:'',price:40,quantity:1,wears:10,purchaseYear:'2022'},
{id:'j011',category:'JAQUETA',brand:'Jack Wills',name:'Dessuadora cremallera',color:'Blau',type:'Dessuadora',rawSeason:'',price:40,quantity:1,wears:6,purchaseYear:'2022'},
{id:'j012',category:'JAQUETA',brand:'Jack Wills',name:'Dessuadora 2',color:'Blanc',type:'Dessuadora',rawSeason:'',price:40,quantity:1,wears:7,purchaseYear:'2021'},
{id:'j013',category:'JAQUETA',brand:'GAP',name:'Dessuadora',color:'Blanc',type:'Dessuadora',rawSeason:'',price:39.95,quantity:1,wears:31,purchaseYear:'2017'},
{id:'j014',category:'JAQUETA',brand:'GAP',name:'Dessuadora 2023',color:'Blanc',type:'Dessuadora',rawSeason:'',price:39.95,quantity:1,wears:9,purchaseYear:'2023'},
{id:'j015',category:'JAQUETA',brand:'GAP',name:'Jaqueta texana',color:'Texà',type:'Texana',rawSeason:'',price:40,quantity:1,wears:3,purchaseYear:'2014'},
{id:'j016',category:'JAQUETA',brand:'Penny Black',name:'Jaqueta texana',color:'Texà',type:'Texana',rawSeason:'',price:200,quantity:1,wears:23,purchaseYear:'2019'},
{id:'j017',category:'JAQUETA',brand:'Kocca',name:'Abric',color:'Negre',type:'Abric',rawSeason:'',price:200,quantity:1,wears:13,purchaseYear:'2021'},
{id:'j018',category:'JAQUETA',brand:'Kocca',name:'Americana',color:'Gris',type:'Americana',rawSeason:'',price:200,quantity:1,wears:2,purchaseYear:'2022'},
{id:'j019',category:'JAQUETA',brand:'Stradivarius',name:'Abric',color:'Negre',type:'Abric',rawSeason:'',price:40,quantity:1,wears:5,purchaseYear:'2021'},
{id:'j020',category:'JAQUETA',brand:'Stradivarius',name:'Blazer',color:'Blanc',type:'Americana',rawSeason:'',price:30,quantity:1,wears:5,purchaseYear:'2020'},
{id:'j021',category:'JAQUETA',brand:'Stradivarius',name:'Jaqueta curta Raquel',color:'Marró',type:'Curta',rawSeason:'',price:0,quantity:1,wears:1,purchaseYear:'2023'},
{id:'j022',category:'JAQUETA',brand:'Geospirit',name:'Anorac',color:'Gris',type:'Anorac',rawSeason:'',price:200,quantity:1,wears:12,purchaseYear:'2018'},
{id:'j023',category:'JAQUETA',brand:'Emporio Armani',name:'Anorac punts',color:'Negre',type:'Anorac',rawSeason:'',price:200,quantity:1,wears:11,purchaseYear:'2016'},
{id:'j024',category:'JAQUETA',brand:'Hollister',name:'Jaqueta curta',color:'Rosa',type:'Curta',rawSeason:'',price:60,quantity:1,wears:4,purchaseYear:'2017'},
{id:'j025',category:'JAQUETA',brand:'Massimo Dutti',name:'Jaqueta pluma',color:'Blanc',type:'Curta',rawSeason:'',price:100,quantity:1,wears:3,purchaseYear:'2018'},
{id:'j026',category:'JAQUETA',brand:'StreetOne',name:'Jaqueta texana',color:'Blanc',type:'Texana',rawSeason:'',price:150,quantity:1,wears:3,purchaseYear:''},
{id:'j027',category:'JAQUETA',brand:'Decathlon',name:'Impermeable',color:'Blanc',type:'Curta',rawSeason:'',price:30,quantity:1,wears:3,purchaseYear:'2021'},
{id:'j028',category:'JAQUETA',brand:'Molly Bracken',name:'Dessuadora',color:'Negre',type:'Dessuadora',rawSeason:'',price:50,quantity:1,wears:4,purchaseYear:'2018'},
{id:'j029',category:'JAQUETA',brand:'UVic',name:'Dessuadora',color:'Vermell',type:'Dessuadora',rawSeason:'',price:0,quantity:1,wears:1,purchaseYear:'2023'},

/* ── SABATES ──────────────────────────────────────────────────────── */
{id:'sa001',category:'SABATES',brand:'Victoria',name:'Bambes',color:'Blanc i Negre',type:'Bambes',rawSeason:'',price:59.9,quantity:5,wears:229,purchaseYear:'2020'},
{id:'sa002',category:'SABATES',brand:'Nero Giardini',name:'Botina Xarol cordons',color:'Negre',type:'Botina',rawSeason:'',price:140,quantity:1,wears:126,purchaseYear:'2023'},
{id:'sa003',category:'SABATES',brand:'Nero Giardini',name:'Sandàlies planes',color:'Daurat',type:'Sandàlies',rawSeason:'',price:140,quantity:1,wears:50,purchaseYear:'2018'},
{id:'sa004',category:'SABATES',brand:'Nero Giardini',name:'Botina Civella',color:'Negre',type:'Botina',rawSeason:'',price:140,quantity:2,wears:36,purchaseYear:'2022'},
{id:'sa005',category:'SABATES',brand:'Nero Giardini',name:'Sandàlies taló',color:'Marró',type:'Sandàlies',rawSeason:'',price:140,quantity:1,wears:34,purchaseYear:'2020'},
{id:'sa006',category:'SABATES',brand:'Asics',name:'Bambes muntanya',color:'Negre',type:'Bambes',rawSeason:'',price:46,quantity:1,wears:26,purchaseYear:'2023'},
{id:'sa007',category:'SABATES',brand:'No Name',name:'Bambes',color:'Blanc i Beige',type:'Bambes',rawSeason:'',price:100,quantity:1,wears:28,purchaseYear:'2018'},
{id:'sa008',category:'SABATES',brand:'Nero Giardini',name:'Sandàlies taló 2017',color:'Beige',type:'Sandàlies',rawSeason:'',price:140,quantity:1,wears:24,purchaseYear:'2017'},
{id:'sa009',category:'SABATES',brand:'Nero Giardini',name:'Botina Serp',color:'Negre',type:'Botina',rawSeason:'',price:140,quantity:1,wears:22,purchaseYear:'2022'},
{id:'sa010',category:'SABATES',brand:'Nero Giardini',name:'Botina Civella baixa',color:'Negre',type:'Botina',rawSeason:'',price:140,quantity:1,wears:22,purchaseYear:'2016'},
{id:'sa011',category:'SABATES',brand:'Asics',name:'Bambes',color:'Negre',type:'Bambes',rawSeason:'',price:70,quantity:1,wears:17,purchaseYear:'2020'},
{id:'sa012',category:'SABATES',brand:'Nero Giardini',name:'Sandàlies planes',color:'Platejat',type:'Sandàlies',rawSeason:'',price:140,quantity:1,wears:19,purchaseYear:'2019'},
{id:'sa013',category:'SABATES',brand:'Jack Wills',name:'Xancletes',color:'Blanc i Negre',type:'Xancletes',rawSeason:'',price:30,quantity:1,wears:7,purchaseYear:'2017'},
{id:'sa014',category:'SABATES',brand:'Can Muns',name:'Sandàlies brillant',color:'Negre',type:'Sandàlies',rawSeason:'',price:90,quantity:1,wears:5,purchaseYear:'2022'},
{id:'sa015',category:'SABATES',brand:'GAP',name:'Xancletes',color:'Lila',type:'Xancletes',rawSeason:'',price:20,quantity:1,wears:5,purchaseYear:'2015'},
{id:'sa016',category:'SABATES',brand:'Nero Giardini',name:'Botina pell Serp',color:'Negre',type:'Botina',rawSeason:'',price:140,quantity:1,wears:4,purchaseYear:'2018'},
{id:'sa017',category:'SABATES',brand:'No Name',name:'Bambes',color:'Negre',type:'Bambes',rawSeason:'',price:100,quantity:1,wears:2,purchaseYear:'2018'},
{id:'sa018',category:'SABATES',brand:'Roxy',name:'Xancletes',color:'Blanc',type:'Xancletes',rawSeason:'',price:20,quantity:1,wears:1,purchaseYear:'2023'},
{id:'sa019',category:'SABATES',brand:'Nero Giardini',name:'Botina Xarol',color:'Negre',type:'Botina',rawSeason:'',price:140,quantity:1,wears:12,purchaseYear:'2022'},
{id:'sa020',category:'SABATES',brand:'Nero Giardini',name:'Botina',color:'Blanc',type:'Botina',rawSeason:'',price:140,quantity:1,wears:5,purchaseYear:'2022'},
{id:'sa021',category:'SABATES',brand:'Nero Giardini',name:'Sandàlies taló',color:'Beige',type:'Sandàlies',rawSeason:'',price:140,quantity:1,wears:1,purchaseYear:'2021'},
{id:'sa022',category:'SABATES',brand:'Nero Giardini',name:'Bambes',color:'Negre',type:'Bambes',rawSeason:'',price:140,quantity:1,wears:1,purchaseYear:'2019'},

/* ── ARRACADES ────────────────────────────────────────────────────── */
{id:'ar001',category:'ARRACADES',brand:'Altres',name:'Arracades Annarita',color:'Daurat',type:'Llarga',rawSeason:'',price:30,quantity:1,wears:83,purchaseYear:'2010'},
{id:'ar002',category:'ARRACADES',brand:'Tous',name:'Arracades Perla Gran',color:'Platejat',type:'Curta',rawSeason:'',price:65,quantity:1,wears:94,purchaseYear:'2019'},
{id:'ar003',category:'ARRACADES',brand:'Tous',name:'Arracades Perla Petita',color:'Platejat',type:'Curta',rawSeason:'',price:59,quantity:2,wears:118,purchaseYear:'2022'},
{id:'ar004',category:'ARRACADES',brand:'Roma',name:'Arracades Gotes d\'Aigua',color:'Blanc i Platejat',type:'Llarga',rawSeason:'',price:18,quantity:1,wears:98,purchaseYear:'2022'},
{id:'ar005',category:'ARRACADES',brand:'Malta',name:'Arracades cercle',color:'Platejat',type:'Llarga',rawSeason:'',price:19.99,quantity:1,wears:108,purchaseYear:'2023'},
{id:'ar006',category:'ARRACADES',brand:'Porto',name:'Arracades Cercle Perla',color:'Perla i Platejat',type:'Curta',rawSeason:'',price:19.99,quantity:1,wears:53,purchaseYear:'2022'},
{id:'ar007',category:'ARRACADES',brand:'Bijou Brigitte',name:'Arracades fulles',color:'Platejat',type:'Llarga',rawSeason:'',price:19.9,quantity:1,wears:51,purchaseYear:'2022'},
{id:'ar008',category:'ARRACADES',brand:'Bijou Brigitte',name:'Arracades línia perles',color:'Perla',type:'Llarga',rawSeason:'',price:19.9,quantity:1,wears:57,purchaseYear:'2021'},
{id:'ar009',category:'ARRACADES',brand:'Bijou Brigitte',name:'Arracades cercles solapats',color:'Platejat',type:'Llarga',rawSeason:'',price:19.99,quantity:1,wears:36,purchaseYear:'2022'},
{id:'ar010',category:'ARRACADES',brand:'Tous',name:'Arracades aro amb tous',color:'Platejat',type:'Aro',rawSeason:'',price:50,quantity:1,wears:31,purchaseYear:'2019'},
{id:'ar011',category:'ARRACADES',brand:'Tous',name:'Arracades anella llisa',color:'Platejat',type:'Aro',rawSeason:'',price:60,quantity:1,wears:4,purchaseYear:'2018'},
{id:'ar012',category:'ARRACADES',brand:'Tous',name:'Arracades anella ossos',color:'Platejat',type:'Aro',rawSeason:'',price:90,quantity:1,wears:4,purchaseYear:'2021'},
{id:'ar013',category:'ARRACADES',brand:'Bijou Brigitte',name:'Arracades espiral',color:'Platejat',type:'Llarga',rawSeason:'',price:19.9,quantity:1,wears:15,purchaseYear:'2020'},
{id:'ar014',category:'ARRACADES',brand:'Bijou Brigitte',name:'Arracades Natàlia',color:'Daurat',type:'Llarga',rawSeason:'',price:14.9,quantity:1,wears:5,purchaseYear:'2022'},
{id:'ar015',category:'ARRACADES',brand:'Bijou Brigitte',name:'Arracades flor',color:'Platejat',type:'Curta',rawSeason:'',price:17.95,quantity:1,wears:4,purchaseYear:'2022'},
{id:'ar016',category:'ARRACADES',brand:'Bijou Brigitte',name:'Arracades perla penjant',color:'Perla',type:'Curta',rawSeason:'',price:17.99,quantity:1,wears:3,purchaseYear:'2021'},
{id:'ar017',category:'ARRACADES',brand:'Bijou Brigitte',name:'Arracades cercles',color:'Platejat',type:'Llarga',rawSeason:'',price:19.99,quantity:1,wears:4,purchaseYear:'2019'},
{id:'ar018',category:'ARRACADES',brand:'Roma',name:'Arracades Rodones',color:'Negre i Platejat',type:'Llarga',rawSeason:'',price:18,quantity:1,wears:1,purchaseYear:'2022'},

/* ── BOLSO ────────────────────────────────────────────────────────── */
{id:'bo001',category:'BOLSO',brand:'Eastpak',name:'Motxilla',color:'Negre',type:'Motxilla',rawSeason:'',price:60,quantity:2,wears:324,purchaseYear:'2020'},
{id:'bo002',category:'BOLSO',brand:'Jack Wills',name:'Bolso 2 butxaques',color:'Beige',type:'Bandolera',rawSeason:'',price:37.8,quantity:1,wears:93,purchaseYear:'2022'},
{id:'bo003',category:'BOLSO',brand:'Tous',name:'Bolso 2017',color:'Marró',type:'Bandolera',rawSeason:'',price:150,quantity:1,wears:71,purchaseYear:'2017'},
{id:'bo004',category:'BOLSO',brand:'Bimba & Lola',name:'Bolso',color:'Beige',type:'Bandolera',rawSeason:'',price:105,quantity:1,wears:70,purchaseYear:'2021'},
{id:'bo005',category:'BOLSO',brand:'Jack Wills',name:'Bolso 2 butxaques',color:'Negre',type:'Bandolera',rawSeason:'',price:37.8,quantity:1,wears:45,purchaseYear:'2022'},
{id:'bo006',category:'BOLSO',brand:'George Gina & Lucy',name:'Bolso petit',color:'Rosa',type:'Bandolera',rawSeason:'',price:140,quantity:1,wears:31,purchaseYear:'2016'},
{id:'bo007',category:'BOLSO',brand:'Kipling',name:'Bolso petit',color:'Rosa',type:'Bandolera',rawSeason:'',price:120,quantity:1,wears:21,purchaseYear:'2014'},
{id:'bo008',category:'BOLSO',brand:'George Gina & Lucy',name:'Bolso gran',color:'Beige',type:'Nanses',rawSeason:'',price:139.9,quantity:1,wears:45,purchaseYear:'2020'},
{id:'bo009',category:'BOLSO',brand:'George Gina & Lucy',name:'Bolso petit',color:'Negre',type:'Bandolera',rawSeason:'',price:140,quantity:1,wears:17,purchaseYear:'2018'},
{id:'bo010',category:'BOLSO',brand:'DeDins',name:'Bolso',color:'Blau',type:'Nanses',rawSeason:'',price:70,quantity:1,wears:17,purchaseYear:'2021'},
{id:'bo011',category:'BOLSO',brand:'Liujo',name:'Bolso Mama',color:'Negre',type:'Formal',rawSeason:'',price:50,quantity:1,wears:9,purchaseYear:'2023'},
{id:'bo012',category:'BOLSO',brand:'Decathlon',name:'Motxilla',color:'Rosa',type:'Motxilla',rawSeason:'',price:20,quantity:1,wears:6,purchaseYear:''},
{id:'bo013',category:'BOLSO',brand:'Decathlon',name:'Ronyonera',color:'Negre',type:'Ronyonera',rawSeason:'',price:10,quantity:1,wears:5,purchaseYear:'2022'},
{id:'bo014',category:'BOLSO',brand:'Tous',name:'Bolso civella',color:'Negre',type:'Formal',rawSeason:'',price:100,quantity:1,wears:7,purchaseYear:'2017'},
{id:'bo015',category:'BOLSO',brand:'Bimba & Lola',name:'Bolso',color:'Negre',type:'Bandolera',rawSeason:'',price:105,quantity:2,wears:4,purchaseYear:'2022'},
{id:'bo016',category:'BOLSO',brand:'Liujo',name:'Bolso brodat',color:'Negre',type:'Formal',rawSeason:'',price:120,quantity:1,wears:7,purchaseYear:'2023'},
{id:'bo017',category:'BOLSO',brand:'Altres',name:'Bolso Mama Perles',color:'Negre',type:'Formal',rawSeason:'',price:100,quantity:1,wears:4,purchaseYear:''},
{id:'bo018',category:'BOLSO',brand:'Mèxic',name:'Bolso flors',color:'Negre',type:'Bandolera',rawSeason:'',price:10,quantity:1,wears:1,purchaseYear:'2019'},
{id:'bo019',category:'BOLSO',brand:'George Gina & Lucy',name:'Bolso petit',color:'Marró',type:'Nanses',rawSeason:'',price:139.9,quantity:1,wears:1,purchaseYear:'2020'},

/* ── ALTRES ───────────────────────────────────────────────────────── */
{id:'al001',category:'ALTRES',brand:'Guess',name:'Ulleres de sol',color:'Fosc',type:'Ulleres de sol',rawSeason:'',price:120,quantity:1,wears:104,purchaseYear:'2017'},
{id:'al002',category:'ALTRES',brand:'Vogue',name:'Paraigües',color:'Marró',type:'Paraigües',rawSeason:'',price:19.99,quantity:1,wears:14,purchaseYear:'2021'},
{id:'al003',category:'ALTRES',brand:'Vogue',name:'Paraigües',color:'Gris',type:'Paraigües',rawSeason:'',price:25,quantity:1,wears:3,purchaseYear:'2023'},
{id:'al004',category:'ALTRES',brand:'Stradivarius',name:'Cinturó',color:'Negre',type:'Cinturó',rawSeason:'',price:15,quantity:1,wears:46,purchaseYear:'2018'},
{id:'al005',category:'ALTRES',brand:'Stradivarius',name:'Cinturó',color:'Marró',type:'Cinturó',rawSeason:'',price:15,quantity:1,wears:14,purchaseYear:'2019'},
{id:'al006',category:'ALTRES',brand:'Stradivarius',name:'Cinturó',color:'Blanc',type:'Cinturó',rawSeason:'',price:15,quantity:1,wears:1,purchaseYear:'2019'},
{id:'al007',category:'ALTRES',brand:'Stradivarius',name:'Cinturó prim',color:'Negre',type:'Cinturó',rawSeason:'',price:15,quantity:1,wears:2,purchaseYear:'2018'},
{id:'al008',category:'ALTRES',brand:'Pretty',name:'Cinturó',color:'Negre',type:'Cinturó',rawSeason:'',price:50,quantity:1,wears:19,purchaseYear:'2022'},
{id:'al009',category:'ALTRES',brand:'Altres',name:'Guants llaç',color:'Negre',type:'Guants',rawSeason:'',price:30,quantity:1,wears:15,purchaseYear:''},
{id:'al010',category:'ALTRES',brand:'Rayban',name:'Ulleres',color:'Negre',type:'Ulleres de sol',rawSeason:'',price:145,quantity:1,wears:19,purchaseYear:'2019'},
{id:'al011',category:'ALTRES',brand:'Victoria\'s Secret',name:'Ulleres',color:'Negre',type:'Ulleres de sol',rawSeason:'',price:140,quantity:1,wears:10,purchaseYear:'2020'},
{id:'al012',category:'ALTRES',brand:'Ale Hop',name:'Ulleres',color:'Marró',type:'Ulleres de sol',rawSeason:'',price:15,quantity:1,wears:11,purchaseYear:'2017'},
{id:'al013',category:'ALTRES',brand:'Ale Hop',name:'Ulleres',color:'Blanc',type:'Ulleres de sol',rawSeason:'',price:15,quantity:1,wears:4,purchaseYear:'2022'},
{id:'al014',category:'ALTRES',brand:'DeDins',name:'Biquini ralles',color:'Blanc i Blau',type:'Biquini',rawSeason:'',price:70,quantity:1,wears:10,purchaseYear:'2021'},
{id:'al015',category:'ALTRES',brand:'DeDins',name:'Biquini volants',color:'Blanc',type:'Biquini',rawSeason:'',price:90,quantity:1,wears:4,purchaseYear:'2021'},
{id:'al016',category:'ALTRES',brand:'DeDins',name:'Biquini',color:'Fucsia',type:'Biquini',rawSeason:'',price:140,quantity:1,wears:4,purchaseYear:'2023'},
{id:'al017',category:'ALTRES',brand:'Benetton',name:'Biquini',color:'Blau',type:'Biquini',rawSeason:'',price:50,quantity:1,wears:5,purchaseYear:'2020'},
{id:'al018',category:'ALTRES',brand:'Calzedonia',name:'Biquini anella',color:'Negre',type:'Biquini',rawSeason:'',price:50,quantity:1,wears:2,purchaseYear:'2022'},
];

// Build full item objects from raw data
function buildItem(raw){
  const seasons = mapSeason(raw.rawSeason);
  const formality = autoFormality(raw.type, raw.name);
  const totalCost = raw.price * raw.quantity;
  const cpw = raw.wears > 0 ? totalCost / raw.wears : totalCost;
  // Build units array — one per quantity, all active, with purchaseYear as rough date
  const units = [];
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
    id: raw.id,
    category: raw.category,
    brand: raw.brand,
    name: raw.name,
    color: raw.color,
    type: raw.type,
    seasons: seasons,
    formality: formality,
    price: raw.price,
    quantity: raw.quantity,
    units: units,
    totalCost: totalCost,
    wears: raw.wears,
    cpw: cpw,
    purchaseYear: raw.purchaseYear || '',
    size: '',
    images: [],
    favourite: false,
    needsInfo: false,
    retired: false,
    retiredUnits: 0,
    notes: '',
    lastWorn: null,
    seeded: true,
  };
}

// SEED WEAR LOG (sample from spreadsheet — last 50 confirmed entries)
const RAW_WEARS = [
  {date:'2014-12-29',items:['bo007']},
  {date:'2014-12-30',items:['bo007']},
  {date:'2014-12-31',items:['bo007']},
  {date:'2015-01-01',items:['bo007']},
  {date:'2015-01-02',items:['bo007']},
  {date:'2015-01-03',items:['bo007']},
  {date:'2016-06-19',items:['d061']},
  {date:'2016-06-29',items:['d061']},
  {date:'2016-08-01',items:['bo006']},
  {date:'2016-08-13',items:['j003','bo006']},
  {date:'2016-08-22',items:['bo006']},
  {date:'2016-10-01',items:['bo006']},
  {date:'2016-12-10',items:['j023']},
  {date:'2016-12-11',items:['j023']},
  {date:'2016-12-17',items:['j023']},
  {date:'2016-12-18',items:['j023','sa010','ar003']},
  {date:'2016-12-26',items:['j023','sa010','ar003']},
  {date:'2016-12-27',items:['j023','sa010','ar003']},
  {date:'2016-12-28',items:['j023','sa010','ar003']},
  {date:'2016-12-29',items:['j023','sa010','ar003']},
  {date:'2017-01-07',items:['j023','sa010','ar003']},
  {date:'2017-01-24',items:['j023','sa010','ar003']},
  {date:'2017-03-11',items:['ar003']},
  {date:'2017-03-18',items:['ar003']},
  {date:'2017-03-25',items:['j006','ar003']},
  {date:'2017-04-01',items:['j006','ar003']},
  {date:'2017-04-02',items:['j006','ar003']},
  {date:'2017-04-03',items:['j006','ar003']},
  {date:'2017-04-04',items:['j006','ar003']},
  {date:'2017-04-05',items:['j006','ar003']},
  {date:'2017-04-06',items:['j006','ar003']},
  {date:'2017-04-07',items:['j006','ar003']},
  {date:'2017-04-08',items:['j006','ar003']},
  {date:'2017-04-09',items:['j006','ar003']},
  {date:'2017-04-12',items:['ar003']},
  {date:'2017-04-23',items:['bo007']},
  {date:'2017-04-30',items:['sa008','ar003']},
  {date:'2017-05-13',items:['ar003']},
  {date:'2017-06-04',items:['sa008','ar003']},
  {date:'2017-06-11',items:['sa008']},
  {date:'2017-06-23',items:['sa008','ar003']},
  {date:'2017-06-30',items:['b015','j003']},
  {date:'2017-07-16',items:['sa008']},
  {date:'2017-07-22',items:['ar003','bo003']},
  {date:'2017-07-23',items:['ar003','bo003']},
  {date:'2017-07-29',items:['ar003','bo003']},
  {date:'2017-08-03',items:['ar003']},
  {date:'2017-08-05',items:['sa008','ar003']},
  {date:'2017-08-10',items:['d028','sa008','ar003','bo003','al012','b015','j015','ar003','bo006']},
  {date:'2017-08-11',items:['sa008','ar003','bo003','al012']},
  {date:'2017-08-12',items:['sa008','ar003','bo003','al012']},
  {date:'2017-08-13',items:['sa008','ar003','bo003','al012']},
  {date:'2017-08-14',items:['b015','sa008','ar003','bo003','al012']},
  {date:'2017-08-15',items:['sa008','ar003','bo003','al012']},
  {date:'2017-08-16',items:['d028','sa008','ar003','bo003','al012']},
  {date:'2017-08-17',items:['d003','b015','sa008','ar003','bo003','al012']},
  {date:'2017-08-18',items:['d028','sa008','ar003','bo003','al012']},
  {date:'2017-08-19',items:['sa008','ar003','bo003','al012']},
  {date:'2017-08-20',items:['ar003','bo003','al012']},
  {date:'2017-08-22',items:['bo006']},
  {date:'2017-08-23',items:['bo006']},
  {date:'2017-08-24',items:['bo006']},
  {date:'2017-08-25',items:['d003','bo006']},
  {date:'2017-09-08',items:['d028']},
  {date:'2017-09-23',items:['bo003']},
  {date:'2017-10-28',items:['bo003']},
  {date:'2017-10-31',items:['j013']},
  {date:'2017-11-19',items:['ar003']},
  {date:'2017-11-29',items:['j013','ar003']},
  {date:'2017-12-02',items:['ar003','bo003']},
  {date:'2017-12-07',items:['j013','sa010','ar003']},
  {date:'2017-12-08',items:['j013','sa010','ar003']},
  {date:'2017-12-22',items:['sa008','ar003']},
  {date:'2017-12-26',items:['sa010','ar003','bo003']},
  {date:'2017-12-27',items:['sa010','ar003','bo003']},
  {date:'2017-12-28',items:['sa010','ar003','bo003']},
  {date:'2017-12-29',items:['sa010','ar003','sa010','ar003','bo003']},
  {date:'2017-12-30',items:['sa010','ar003']},
  {date:'2017-12-31',items:['s011','sa008','ar003','sa010']},
  {date:'2018-01-01',items:['s010','sa008','ar003']},
  {date:'2018-02-24',items:['s011']},
  {date:'2018-03-10',items:['b042','sa007','ar003','bo003','al001']},
  {date:'2018-03-11',items:['d062','b042','sa007']},
  {date:'2018-03-13',items:['b042','sa007','ar003','bo003','al001']},
  {date:'2018-03-19',items:['al001']},
  {date:'2018-03-29',items:['b042','sa007','ar003','bo003','al001']},
  {date:'2018-03-30',items:['d062','b042','sa007','ar003','bo003','al001']},
  {date:'2018-03-31',items:['sa007']},
  {date:'2018-04-01',items:['sa007']},
  {date:'2018-04-29',items:['b042','sa017','ar003','bo003','al001']},
  {date:'2018-05-20',items:['sa003','ar003','bo003','al001']},
  {date:'2018-05-26',items:['s011','sa008','ar003']},
  {date:'2018-06-03',items:['d028','sa008','ar003','bo003','al001']},
  {date:'2018-06-08',items:['j015','ar003','bo003']},
  {date:'2018-06-21',items:['sa021']},
  {date:'2018-06-23',items:['s010','sa021','ar003']},
  {date:'2018-07-01',items:['ar003','bo003','al001']},
  {date:'2018-07-14',items:['sa003','ar003','bo003','al001']},
  {date:'2018-07-16',items:['j015']},
  {date:'2018-08-06',items:['j009','sa007','ar003','bo006']},
  {date:'2018-08-08',items:['b009','sa007','ar003','bo006','al001']},
  {date:'2018-08-12',items:['b046','j016','sa007','bo006']},
  {date:'2018-08-14',items:['sa007','ar003','bo006','al001']},
  {date:'2018-08-15',items:['sa007','ar003','bo006','al001']},
  {date:'2018-08-16',items:['sa007','ar003','bo006','al001']},
  {date:'2018-08-17',items:['sa007','ar003','bo006','al001']},
  {date:'2018-08-18',items:['sa007','ar003','bo006','al001']},
  {date:'2018-08-19',items:['sa007','ar003','bo006','al001']},
  {date:'2018-08-20',items:['sa007','ar003','bo006','al001']},
  {date:'2018-08-21',items:['sa007','ar003','bo006','al001']},
  {date:'2018-08-28',items:['j009']},
  {date:'2018-12-08',items:['sa010','ar003']},
  {date:'2018-12-24',items:['j023']},
  {date:'2018-12-25',items:['b056','s009']},
  {date:'2018-12-27',items:['j022','ar003','bo009','al009']},
  {date:'2018-12-28',items:['j022','ar003','bo009','al009']},
  {date:'2018-12-29',items:['j022','sa010','ar003','bo009','al009']},
  {date:'2018-12-30',items:['j022','sa010','ar003','bo009','al009']},
  {date:'2018-12-31',items:['j022','sa010','ar003','bo009','al009']},
  {date:'2019-01-01',items:['j022','sa010','ar003','bo009','al009']},
  {date:'2019-02-21',items:['ar003']},
  {date:'2019-02-28',items:['j006','ar003']},
  {date:'2019-03-21',items:['j016']},
  {date:'2019-04-19',items:['j016','sa007','ar001','bo009','al001']},
  {date:'2019-04-20',items:['j016','sa007','ar001','bo009','al001']},
  {date:'2019-04-27',items:['j016','sa017','ar001','al001']},
  {date:'2019-04-29',items:['ar003','al001']},
  {date:'2019-04-30',items:['ar003','al001']},
  {date:'2019-05-12',items:['sa007','al004']},
  {date:'2019-05-14',items:['j026']},
  {date:'2019-05-18',items:['j007','ar003']},
  {date:'2019-05-21',items:['sa007']},
  {date:'2019-05-23',items:['sa007']},
  {date:'2019-05-29',items:['bo003']},
  {date:'2019-06-02',items:['ar001']},
  {date:'2019-06-05',items:['ar003']},
  {date:'2019-06-06',items:['d001']},
  {date:'2019-06-07',items:['ar001']},
  {date:'2019-06-09',items:['d066','j003','ar003','bo003']},
  {date:'2019-06-13',items:['j016']},
  {date:'2019-06-21',items:['d066','b061']},
  {date:'2019-06-23',items:['d066','j003']},
  {date:'2019-06-26',items:['bo003','al001']},
  {date:'2019-07-07',items:['d001','b003','j003','ar001','bo009','al010']},
  {date:'2019-07-12',items:['b004','j003','ar001','bo001','al010']},
  {date:'2019-07-14',items:['b003','j003','ar001','bo009']},
  {date:'2019-07-19',items:['d075','j003','ar001','bo003','d029','ar001','bo009']},
  {date:'2019-07-21',items:['b040','j026','ar001','bo009','al010']},
  {date:'2019-07-22',items:['b004','j003','ar001','bo008','al010']},
  {date:'2019-07-26',items:['d001','sa003','ar001','bo008','al010']},
  {date:'2019-07-27',items:['d001','al010']},
  {date:'2019-07-28',items:['j003','ar001','bo003']},
  {date:'2019-07-31',items:['j003','sa003','ar001','bo003']},
  {date:'2019-08-02',items:['s007','j003','sa008','ar001','bo003']},
  {date:'2019-08-07',items:['b023','sa003','ar001','bo003','al005']},
  {date:'2019-08-08',items:['d002','j003','sa003','ar001','bo003']},
  {date:'2019-08-09',items:['d066','b053','j003','sa003','ar001','bo003']},
  {date:'2019-08-12',items:['d068','b046','j016','sa007','ar003','bo007']},
  {date:'2019-08-13',items:['d001','b040','j016','sa007','bo007','al001']},
  {date:'2019-08-14',items:['b040','bo007','al001']},
  {date:'2019-08-15',items:['b040','sa007','bo007','al001']},
  {date:'2019-08-16',items:['bo007','al001']},
  {date:'2019-08-17',items:['bo007','al001']},
  {date:'2019-08-18',items:['d064','b046','j016','ar003','bo007','al001']},
  {date:'2019-08-19',items:['b040','j009','ar003','bo007','al001']},
  {date:'2019-08-20',items:['b016','ar003','bo007','al001']},
  {date:'2019-08-21',items:['b016','ar003','bo007','al001']},
  {date:'2019-08-22',items:['s007','j016','sa003','ar003','bo007','al001']},
  {date:'2019-08-23',items:['ar003','bo007','al001']},
  {date:'2019-08-24',items:['ar003','bo007','al001']},
  {date:'2019-08-25',items:['s007','sa003','ar003','al001']},
  {date:'2019-08-27',items:['d068','b046','sa007','ar003','bo007','al001']},
  {date:'2019-08-30',items:['d068','b023','j003','sa003','ar001','bo003','al001']},
  {date:'2019-08-31',items:['b016','j003','ar001','bo003','al010']},
  {date:'2019-09-01',items:['d002','b025','j003','sa003','ar001','bo014']},
  {date:'2019-09-04',items:['d001','b040','sa003','ar003','bo008']},
  {date:'2019-09-06',items:['b023','j003','sa007','ar001','bo008','al010']},
  {date:'2019-09-08',items:['d002','b023','j003','sa003','ar001','bo003']},
  {date:'2019-09-09',items:['b023','j003','sa008','ar001','bo014']},
  {date:'2019-09-12',items:['j026','ar001']},
  {date:'2019-09-23',items:['d001','j003']},
  {date:'2019-09-28',items:['d066','j003','sa008','ar001','bo003','al010']},
  {date:'2019-10-07',items:['d001','ar001']},
  {date:'2019-10-19',items:['d029','ar001']},
  {date:'2019-10-24',items:['d062']},
  {date:'2019-11-02',items:['d029','ar001','bo003','al010']},
  {date:'2019-11-08',items:['bo003']},
  {date:'2019-12-04',items:['ar003']},
  {date:'2019-12-05',items:['ar001']},
  {date:'2019-12-06',items:['sa001','ar003']},
  {date:'2019-12-07',items:['sa001','ar003']},
  {date:'2019-12-11',items:['j007']},
  {date:'2019-12-14',items:['ar002']},
  {date:'2019-12-15',items:['j007','sa016','ar001','bo003','al010']},
  {date:'2019-12-25',items:['b042','j022','ar002','bo008','al004']},
  {date:'2019-12-26',items:['j022','ar010','bo009']},
  {date:'2019-12-27',items:['j022','ar010','bo009']},
  {date:'2019-12-28',items:['j022','ar010','bo009']},
  {date:'2019-12-29',items:['j022','ar010','bo009']},
  {date:'2019-12-30',items:['j022','ar010','bo008']},
  {date:'2019-12-31',items:['b056','s005','ar010']},
  {date:'2020-01-10',items:['j006','ar010']},
  {date:'2020-01-12',items:['ar001']},
  {date:'2020-01-18',items:['b056','s005']},
  {date:'2020-01-20',items:['ar001']},
  {date:'2020-01-21',items:['al004']},
  {date:'2020-02-21',items:['al001']},
  {date:'2020-02-26',items:['b056','s009','sa016','ar010']},
  {date:'2020-02-28',items:['ar002']},
  {date:'2020-02-29',items:['ar017']},
  {date:'2020-03-05',items:['j006','ar002']},
  {date:'2020-03-06',items:['ar017']},
  {date:'2020-03-09',items:['ar017','bo001']},
  {date:'2020-03-10',items:['j006','bo001']},
  {date:'2020-03-11',items:['d057','sa011','ar002','bo001']},
  {date:'2020-03-28',items:['j013']},
  {date:'2020-04-04',items:['ar002']},
  {date:'2020-04-05',items:['al001']},
  {date:'2020-04-14',items:['ar002']},
  {date:'2020-04-15',items:['ar001']},
  {date:'2020-04-17',items:['ar002']},
  {date:'2020-05-07',items:['j013']},
  {date:'2020-05-22',items:['s013','sa005','ar011']},
  {date:'2020-05-24',items:['j016']},
  {date:'2020-07-07',items:['d001','b004','j003','sa003','ar013','bo008']},
  {date:'2020-07-15',items:['b004','sa001','ar013','bo003']},
  {date:'2020-07-17',items:['d066','b061','j003','sa005','ar013','bo003']},
  {date:'2020-08-05',items:['d002','b011','sa005','ar013','bo003']},
  {date:'2020-08-07',items:['d002','b023','j003','sa003','ar013','bo003','al001']},
  {date:'2020-08-10',items:['d010','b023','sa003','ar013','bo003','al001']},
  {date:'2020-08-11',items:['d002','b009','sa005','ar013','bo003','al001']},
  {date:'2020-08-13',items:['b009','j003','sa003','ar013','bo003','al001']},
  {date:'2020-08-19',items:['al017']},
  {date:'2020-08-21',items:['d001','sa001']},
  {date:'2020-08-22',items:['d037','sa001']},
  {date:'2020-08-24',items:['bo003','al001']},
  {date:'2020-08-30',items:['d066','b061','j020','sa005','ar002','bo003']},
  {date:'2020-08-31',items:['ar013','bo003']},
  {date:'2020-09-05',items:['d057','j013','sa011','ar002','bo012']},
  {date:'2020-09-09',items:['d037','j016']},
  {date:'2020-09-11',items:['d002','b011','j003','sa003','ar002','bo003']},
  {date:'2020-09-13',items:['d066','j008','sa005','ar002','bo003']},
  {date:'2020-09-19',items:['d066','j008','sa005','bo003']},
  {date:'2020-10-02',items:['sa004','ar002','bo001']},
  {date:'2020-10-03',items:['j007','sa004','ar001','bo019']},
  {date:'2020-11-02',items:['ar002']},
  {date:'2020-11-16',items:['j013','ar002']},
  {date:'2020-11-25',items:['ar002']},
  {date:'2020-12-02',items:['ar002']},
  {date:'2020-12-16',items:['ar002','bo001']},
  {date:'2020-12-18',items:['ar002','bo001']},
  {date:'2020-12-21',items:['j001','ar002','bo001']},
  {date:'2020-12-24',items:['sa004']},
  {date:'2020-12-25',items:['s009','j001','sa004','ar013','bo003']},
  {date:'2020-12-26',items:['j001','sa001','ar013','bo003']},
  {date:'2020-12-27',items:['j001','sa004','ar013','bo003']},
  {date:'2020-12-28',items:['j001','sa004','ar013','bo003']},
  {date:'2020-12-31',items:['ar002']},
  {date:'2021-01-06',items:['d051','ar001']},
  {date:'2021-01-07',items:['d050','b003']},
  {date:'2021-01-08',items:['j013']},
  {date:'2021-01-11',items:['ar010']},
  {date:'2021-01-18',items:['b003','ar010']},
  {date:'2021-01-21',items:['j013']},
  {date:'2021-01-22',items:['d050','j001','ar010']},
  {date:'2021-01-25',items:['b003','j001','sa004']},
  {date:'2021-01-28',items:['j001','sa004','ar010','bo003']},
  {date:'2021-02-03',items:['b043','j025','sa004','ar013','bo001']},
  {date:'2021-02-07',items:['ar002']},
  {date:'2021-02-14',items:['b004','j001','sa004','ar013']},
  {date:'2021-03-06',items:['d068']},
  {date:'2021-03-17',items:['d062','sa001','ar001','bo001']},
  {date:'2021-04-02',items:['d058','b001','j008','sa001','ar001','bo003','al010']},
  {date:'2021-06-07',items:['j016']},
  {date:'2021-06-14',items:['ar002']},
  {date:'2021-06-19',items:['d004']},
  {date:'2021-06-23',items:['b001','j016','sa003','ar008','bo003']},
  {date:'2021-06-24',items:['d002','b011','j003','sa005','ar008','bo003']},
  {date:'2021-06-25',items:['al015']},
  {date:'2021-06-26',items:['d003','b012','j003','sa021','ar008','bo003','al001']},
  {date:'2021-06-27',items:['sa001','ar008']},
  {date:'2021-06-29',items:['d066','b061','j003','sa003','ar008','bo003','al001']},
  {date:'2021-06-30',items:['d068','j003','sa001','ar008']},
  {date:'2021-07-01',items:['d067']},
  {date:'2021-07-02',items:['d068','b046','j009','sa001','ar008','bo004','al001','d064','b046','j003','sa001','ar008','bo004','al001']},
  {date:'2021-07-03',items:['d003','b009','sa001','ar008','bo004','al001']},
  {date:'2021-07-04',items:['d001','b016','sa001','ar008','bo004','al010']},
  {date:'2021-07-09',items:['d068']},
  {date:'2021-07-10',items:['ar008']},
  {date:'2021-07-11',items:['b016','sa013','bo010','al015']},
  {date:'2021-07-17',items:['d037']},
  {date:'2021-07-22',items:['sa001']},
  {date:'2021-07-23',items:['b016','j009','sa001','ar008','bo004','al010']},
  {date:'2021-07-24',items:['d001','sa003','ar008','bo004','al010']},
  {date:'2021-07-25',items:['d003','b009','sa003','ar008','bo004','al010','d002','b009','sa003','ar008','bo004','al010']},
  {date:'2021-07-26',items:['d067','s004','sa001','ar008','bo004','al010','d068','b046','j009','sa001','ar008','bo004','al010']},
  {date:'2021-07-29',items:['d071','b063','j003','sa005','ar008','bo004','al017']},
  {date:'2021-07-30',items:['s004','j003','sa005','ar008','bo004','al014']},
  {date:'2021-07-31',items:['d002','b046','j009','sa005','ar008','bo004','al017']},
  {date:'2021-08-01',items:['d071','b063','j003','sa005','ar008','bo004','b046','j009']},
  {date:'2021-08-02',items:['d068','j009','sa001','ar008','bo004']},
  {date:'2021-08-03',items:['s003','j003','sa005','ar008','bo004']},
  {date:'2021-08-05',items:['d068']},
  {date:'2021-08-07',items:['j003']},
  {date:'2021-08-08',items:['b063','sa003','ar008','bo004','s003','sa005','ar008','bo004','al001']},
  {date:'2021-08-10',items:['d067','b046','j009','sa013','ar008','bo010','al015']},
  {date:'2021-08-12',items:['d002','sa003','ar008','bo004','al001']},
  {date:'2021-08-13',items:['s003','sa003','ar008','bo004']},
  {date:'2021-08-16',items:['d067','b028','j009','sa001','ar008','bo004','al001']},
  {date:'2021-08-17',items:['d063','b028','j016','sa001','ar008','bo004','al001']},
  {date:'2021-08-18',items:['b028','j009','sa001','ar008','bo004','al001']},
  {date:'2021-08-19',items:['d001','b028','j009','sa001','ar008','bo004','al001']},
  {date:'2021-08-20',items:['d068','b028','j009','sa001','ar008','bo004','al001']},
  {date:'2021-08-21',items:['d037','b028','j016','sa001','ar008','bo004','al001']},
  {date:'2021-08-22',items:['d069','b028','j016','sa001','ar008','bo004','al001']},
  {date:'2021-08-23',items:['b012','j016','sa001','ar008','bo004','al001']},
  {date:'2021-08-25',items:['d001','j003','sa001','ar008','bo004','al001']},
  {date:'2021-08-26',items:['j003','sa003','ar008','bo004']},
  {date:'2021-08-28',items:['d068']},
  {date:'2021-09-09',items:['d028','j003','sa005','ar008','bo004','al002']},
  {date:'2021-09-22',items:['d063','b029','j003','sa001','ar008','bo001']},
  {date:'2021-09-30',items:['d003','b029','j003','sa001','ar008','bo001']},
  {date:'2021-10-02',items:['b005','j012','sa001','ar008','bo001']},
  {date:'2021-10-04',items:['d063','b029','j007','sa001','ar008','bo001']},
  {date:'2021-10-05',items:['d051','j007','sa001','ar008','bo008']},
  {date:'2021-10-11',items:['b029','j007','sa004','ar010','bo004']},
  {date:'2021-10-15',items:['j012']},
  {date:'2021-10-18',items:['j012','ar008']},
  {date:'2021-10-19',items:['sa001','ar010','bo001']},
  {date:'2021-10-22',items:['d034','b043','j007','ar001','bo001']},
  {date:'2021-10-24',items:['d035','sa001','ar016','bo004']},
  {date:'2021-10-27',items:['d031','b041','j013','sa001','ar002','bo001']},
  {date:'2021-10-30',items:['d035','b028','j004','sa001','ar016']},
  {date:'2021-10-31',items:['b001','sa001','ar016']},
  {date:'2021-11-05',items:['j004']},
  {date:'2021-11-06',items:['d045','b029','j004','sa004','ar010','bo004']},
  {date:'2021-11-08',items:['bo001']},
  {date:'2021-11-09',items:['bo001']},
  {date:'2021-11-10',items:['d054','j004','sa004','ar010','bo001']},
  {date:'2021-11-11',items:['bo001']},
  {date:'2021-11-12',items:['d054','j004','sa004','bo001']},
  {date:'2021-11-13',items:['j004','ar001']},
  {date:'2021-11-22',items:['d054','j004','sa004','ar001','bo001']},
  {date:'2021-11-23',items:['d005','b005','j004','sa004','ar002','bo001']},
  {date:'2021-11-24',items:['d065','b004','j004','sa004','ar001','bo001']},
  {date:'2021-11-25',items:['j004','sa004','ar001','bo001']},
  {date:'2021-11-26',items:['d034','b022','j004','sa004','ar002','bo001']},
  {date:'2021-11-27',items:['d005','b005','j004','sa004','ar010','bo004']},
  {date:'2021-11-30',items:['d054','b005','j004','sa004','ar001','bo001']},
  {date:'2021-12-04',items:['ar001']},
  {date:'2021-12-07',items:['d050','j004','sa004','ar001','bo004']},
  {date:'2021-12-09',items:['j004','sa004','bo001']},
  {date:'2021-12-10',items:['j004','sa004','bo001']},
  {date:'2021-12-15',items:['ar001']},
  {date:'2021-12-18',items:['d045','b014','j019','sa009','ar010','bo005']},
  {date:'2021-12-19',items:['d005','b005','j019','sa004','ar010','bo001']},
  {date:'2021-12-20',items:['j019','sa004','ar010','bo001']},
  {date:'2021-12-21',items:['d054','b043','j019','sa004','ar010','bo001']},
  {date:'2021-12-22',items:['j019','sa004','ar010','bo008']},
  {date:'2021-12-23',items:['d052']},
  {date:'2021-12-24',items:['d031','b005','sa009','ar010']},
  {date:'2021-12-25',items:['b056','s005','j001','sa009','ar010','bo004','al001']},
  {date:'2021-12-26',items:['d054','b022','j004','sa001','ar010','bo004','al001']},
  {date:'2021-12-27',items:['d053','b022','j004','sa001','ar010','bo004','al001']},
  {date:'2021-12-30',items:['d052']},
  {date:'2021-12-31',items:['b056','s005','sa009','ar010']},
  {date:'2022-01-02',items:['d005','b005','j001','sa004','ar010','bo004']},
  {date:'2022-01-11',items:['d050','b005','j001','sa004','ar002','bo004']},
  {date:'2022-01-13',items:['b022','j001','sa004','ar001','bo004']},
  {date:'2022-01-19',items:['d053','j013','sa004','ar011']},
  {date:'2022-01-23',items:['j013','ar017']},
  {date:'2022-01-24',items:['bo008']},
  {date:'2022-01-25',items:['d054','j001']},
  {date:'2022-01-29',items:['d053','b029','j017','sa009','ar011','bo004']},
  {date:'2022-01-31',items:['bo001']},
  {date:'2022-02-01',items:['bo001']},
  {date:'2022-02-02',items:['d041','ar012','bo001']},
  {date:'2022-02-03',items:['d053','b004','j001','sa001','ar002','bo001']},
  {date:'2022-02-04',items:['ar001','bo001']},
  {date:'2022-02-05',items:['d041','b022','j001','sa009','ar010','bo004']},
  {date:'2022-02-07',items:['bo001']},
  {date:'2022-02-08',items:['bo001']},
  {date:'2022-02-09',items:['bo001']},
  {date:'2022-02-10',items:['bo001']},
  {date:'2022-02-11',items:['ar001','bo001']},
  {date:'2022-02-14',items:['bo001']},
  {date:'2022-02-15',items:['bo001']},
  {date:'2022-02-16',items:['bo001']},
  {date:'2022-02-17',items:['bo001']},
  {date:'2022-02-18',items:['bo001']},
  {date:'2022-02-19',items:['d053','b022','j001','sa009','ar010','bo004']},
  {date:'2022-02-20',items:['d047','b001','j001','sa001','ar010','bo004']},
  {date:'2022-02-21',items:['j001','sa004','bo001']},
  {date:'2022-02-22',items:['j001','sa001','bo001']},
  {date:'2022-02-23',items:['bo001']},
  {date:'2022-02-24',items:['bo001']},
  {date:'2022-02-25',items:['bo001']},
  {date:'2022-02-28',items:['bo001']},
  {date:'2022-03-01',items:['bo001']},
  {date:'2022-03-02',items:['d045','b004','j001','bo001']},
  {date:'2022-03-03',items:['bo001']},
  {date:'2022-03-04',items:['bo001']},
  {date:'2022-03-07',items:['bo001']},
  {date:'2022-03-08',items:['bo001']},
  {date:'2022-03-09',items:['bo001']},
  {date:'2022-03-10',items:['bo001']},
  {date:'2022-03-11',items:['bo001']},
  {date:'2022-03-13',items:['d008','j017','sa009','ar001','bo004','al008']},
  {date:'2022-03-14',items:['d034','b005','j001','sa004','ar001','bo001','al004']},
  {date:'2022-03-15',items:['bo001']},
  {date:'2022-03-16',items:['bo001']},
  {date:'2022-03-17',items:['d062','j001','sa004','ar002','bo001']},
  {date:'2022-03-18',items:['bo001']},
  {date:'2022-03-19',items:['d008','j017','sa009','bo004','al008']},
  {date:'2022-03-20',items:['j004','ar002','bo004']},
  {date:'2022-03-21',items:['j001']},
  {date:'2022-03-25',items:['ar001']},
  {date:'2022-03-26',items:['d008','j017','sa009','ar002','bo004','al008']},
  {date:'2022-03-28',items:['d045','ar001','bo001']},
  {date:'2022-03-29',items:['d015','ar002','bo001']},
  {date:'2022-03-30',items:['bo001']},
  {date:'2022-03-31',items:['d040','ar002','bo001']},
  {date:'2022-04-01',items:['d034','b001','j004','sa001','ar001','bo001']},
  {date:'2022-04-04',items:['b027','sa009','ar002','bo008','al001']},
  {date:'2022-04-05',items:['b027','sa009','ar002','bo008','al001']},
  {date:'2022-04-06',items:['b027','sa009','ar002','bo008','al001']},
  {date:'2022-04-07',items:['b027','sa009','ar002','bo008','al001']},
  {date:'2022-04-09',items:['d040','b005','j004','sa001','ar002','bo004','al001']},
  {date:'2022-04-10',items:['d015','j004','sa001','ar002','bo004','al001']},
  {date:'2022-04-11',items:['d019','b005','j004','sa001','ar002','bo004','al001']},
  {date:'2022-04-12',items:['b005','j004','sa001','ar002','bo004','al001']},
  {date:'2022-04-17',items:['d067','b041','j013','ar002']},
  {date:'2022-04-18',items:['d067','b005','j013','ar002']},
  {date:'2022-04-19',items:['d019','j004','sa001','bo001']},
  {date:'2022-04-20',items:['j004','sa001','bo001']},
  {date:'2022-04-21',items:['d015','j004','sa001','bo001']},
  {date:'2022-04-22',items:['j004','bo001']},
  {date:'2022-04-25',items:['d018','b030','j004','sa001','ar002','bo001','al004']},
  {date:'2022-04-26',items:['d058','b005','j004','sa001','bo001']},
  {date:'2022-04-27',items:['j004','bo001']},
  {date:'2022-04-28',items:['j004','bo001']},
  {date:'2022-04-29',items:['d015','b030','j004','sa001','ar001','bo001']},
  {date:'2022-04-30',items:['d015','j004','sa001','ar001']},
  {date:'2022-05-02',items:['d018','b004','j004','sa001','bo001','al004']},
  {date:'2022-05-03',items:['bo001']},
  {date:'2022-05-04',items:['d058','b001','j004','sa001','bo001']},
  {date:'2022-05-05',items:['bo001']},
  {date:'2022-05-06',items:['d040','b005','j004','sa001','bo001']},
  {date:'2022-05-08',items:['d068','bo004']},
  {date:'2022-05-09',items:['bo001']},
  {date:'2022-05-10',items:['d001','sa001','bo001']},
  {date:'2022-05-11',items:['bo001']},
  {date:'2022-05-12',items:['d075','bo001']},
  {date:'2022-05-13',items:['bo001']},
  {date:'2022-05-16',items:['bo001']},
  {date:'2022-05-17',items:['bo001']},
  {date:'2022-05-18',items:['bo001']},
  {date:'2022-05-19',items:['bo001']},
  {date:'2022-05-20',items:['bo001']},
  {date:'2022-05-22',items:['d076']},
  {date:'2022-05-23',items:['bo001']},
  {date:'2022-05-24',items:['bo001']},
  {date:'2022-05-25',items:['d067','bo001']},
  {date:'2022-05-26',items:['bo001']},
  {date:'2022-05-27',items:['d068','sa001','bo001']},
  {date:'2022-05-30',items:['d001','b004','sa001','ar001','bo001']},
  {date:'2022-06-03',items:['d036','b053','j003','sa005','bo014']},
  {date:'2022-06-07',items:['d022']},
  {date:'2022-06-09',items:['d036','b053','sa001','bo004','al001']},
  {date:'2022-06-10',items:['d013','b009','sa001','ar002','bo013']},
  {date:'2022-06-11',items:['d021','b009','sa001','ar002','bo013','d036','b053','sa001','bo004']},
  {date:'2022-06-12',items:['d021','b009','sa001','ar002','bo013']},
  {date:'2022-06-13',items:['d002']},
  {date:'2022-06-15',items:['d021','j009','sa001','ar007','bo008']},
  {date:'2022-06-16',items:['d013','b009','j003','sa001','ar007','bo004','al008']},
  {date:'2022-06-17',items:['d017','b026','sa001','ar007','bo008']},
  {date:'2022-06-18',items:['d021','b013','j003','sa001','ar007','bo008','al001']},
  {date:'2022-06-19',items:['d022','j003','sa001','ar007','bo008','al001']},
  {date:'2022-06-22',items:['d021']},
  {date:'2022-06-23',items:['d060','b017','j003','sa005','bo004']},
  {date:'2022-06-24',items:['d017','b019','sa003','ar006','bo004']},
  {date:'2022-06-25',items:['d013','b047','j009','sa005','ar006','bo004','al008']},
  {date:'2022-06-28',items:['d003','bo010']},
  {date:'2022-06-29',items:['d002','bo010','al013']},
  {date:'2022-06-30',items:['d064','b064','sa003','bo010','al013','d003','b058','sa001','bo004','al018']},
  {date:'2022-07-05',items:['d022','b009','sa003','ar006','bo004']},
  {date:'2022-07-07',items:['s003','j009','sa003']},
  {date:'2022-07-09',items:['d021','b047','j009','sa001','ar006','bo001']},
  {date:'2022-07-10',items:['d013','b009','sa001','ar006','bo008','al008','d036','b061','sa003','ar006','bo017']},
  {date:'2022-07-11',items:['s002','sa003','ar006','bo008','al001','s019','sa003','ar006','bo017','al008']},
  {date:'2022-07-12',items:['d013','b012','j003','sa003','ar006','bo008','al001']},
  {date:'2022-07-13',items:['d017','b008','j003','sa003','ar006','bo008','al001']},
  {date:'2022-07-14',items:['d060','b017','j003','sa003','ar006','bo008','al001','d022','b009','j009','sa001','ar002','bo013']},
  {date:'2022-07-15',items:['d021','b047','sa003','ar006','bo008','s012','j020','sa014','ar006','bo017']},
  {date:'2022-07-16',items:['d021','b013','j003','sa001','ar006','bo008','al008']},
  {date:'2022-07-17',items:['d022','ar006']},
  {date:'2022-07-19',items:['d022','sa003','ar006','bo008','al001']},
  {date:'2022-07-20',items:['d013','b012','sa003','bo004']},
  {date:'2022-07-21',items:['bo004']},
  {date:'2022-07-22',items:['d001','b004','j003','sa001','ar006','bo004']},
  {date:'2022-07-24',items:['d013','b011','j003','sa001','ar006','bo008','al008']},
  {date:'2022-07-25',items:['bo008']},
  {date:'2022-07-26',items:['bo008']},
  {date:'2022-07-27',items:['bo008']},
  {date:'2022-07-28',items:['bo008']},
  {date:'2022-07-29',items:['d026','b006','sa001','ar006','bo008','s014','sa014','ar006','bo017']},
  {date:'2022-07-30',items:['d036','b052','j003','sa001','ar006','bo002']},
  {date:'2022-07-31',items:['d021','b047','j009','sa001','ar006','bo001']},
  {date:'2022-08-01',items:['d013','b011','sa001','al008']},
  {date:'2022-08-04',items:['d013','b012','sa003','ar006','bo002','al005']},
  {date:'2022-08-07',items:['d064','b064','sa005','ar006','bo002','al001','s003','j003','sa005','ar006','bo002']},
  {date:'2022-08-08',items:['d059','b012','j003','sa005','ar006','bo002','al004']},
  {date:'2022-08-10',items:['al014']},
  {date:'2022-08-11',items:['d059','b012','sa005','ar006','bo002','al015']},
  {date:'2022-08-13',items:['d010','ar006']},
  {date:'2022-08-14',items:['s003','j003','sa005','bo002']},
  {date:'2022-08-16',items:['d021','b023','j003','sa003','ar006','bo002','al005','d021','b047','j010','sa001','ar006','bo008','al001']},
  {date:'2022-08-17',items:['d021','b004','j010','sa001','ar006','bo002','d037','b004','j010','sa001','ar006','bo008','al001']},
  {date:'2022-08-18',items:['d023','b026','sa001','ar006','bo002','al001']},
  {date:'2022-08-19',items:['d025','b004','j010','sa001','ar006','bo002','al002']},
  {date:'2022-08-22',items:['d021','b047','j010','sa001','ar006','bo002']},
  {date:'2022-08-23',items:['d003','b008','j003','sa003','ar006','bo002']},
  {date:'2022-08-24',items:['d023','b001','j004','sa001','ar006','bo002']},
  {date:'2022-08-25',items:['d021','b008','j010','sa001','ar006','bo002','al001']},
  {date:'2022-08-31',items:['d022','j003','sa003','ar006','bo002']},
  {date:'2022-09-01',items:['d023','j003','sa003','bo002']},
  {date:'2022-09-02',items:['d060','b026','j003','sa001','bo002','d036','b052','j003','sa003','bo002']},
  {date:'2022-09-04',items:['s003','sa001','ar002','bo002']},
  {date:'2022-09-07',items:['s003','j003','sa001','bo002']},
  {date:'2022-09-08',items:['d013','b011','j003','sa001','bo002','al008']},
  {date:'2022-09-09',items:['d036','b052','j003','sa003','bo002']},
  {date:'2022-09-10',items:['d013','b011','sa001','bo002','al008']},
  {date:'2022-09-11',items:['d026','b012','j003','sa003','bo002']},
  {date:'2022-09-12',items:['s003','sa003','bo001']},
  {date:'2022-09-13',items:['d013','b011','sa001','bo001','al008']},
  {date:'2022-09-14',items:['ar014','bo001']},
  {date:'2022-09-15',items:['ar014','bo001']},
  {date:'2022-09-16',items:['ar014','bo001']},
  {date:'2022-09-17',items:['d013','b011','sa005','al008']},
  {date:'2022-09-19',items:['s002','sa001','bo001']},
  {date:'2022-09-20',items:['d013','b023','sa003','bo001']},
  {date:'2022-09-23',items:['d036','b006','j003','sa001','bo008','al002']},
  {date:'2022-09-25',items:['d057','b044','sa011','bo015']},
  {date:'2022-09-26',items:['d022','bo001']},
  {date:'2022-09-27',items:['bo001']},
  {date:'2022-09-28',items:['bo001']},
  {date:'2022-09-29',items:['bo001']},
  {date:'2022-09-30',items:['d001','sa001','ar001','bo001']},
  {date:'2022-10-01',items:['d057','b044','j013','sa011','ar002','bo012']},
  {date:'2022-10-02',items:['d025','b022','sa001']},
  {date:'2022-10-03',items:['bo001']},
  {date:'2022-10-04',items:['d026','sa001','bo001']},
  {date:'2022-10-05',items:['bo001']},
  {date:'2022-10-06',items:['bo001']},
  {date:'2022-10-07',items:['d029','b022','sa001','bo001']},
  {date:'2022-10-08',items:['b060','s008','j007','sa009','bo014']},
  {date:'2022-10-10',items:['bo001']},
  {date:'2022-10-11',items:['d051','j007','ar014','bo001']},
  {date:'2022-10-12',items:['bo001']},
  {date:'2022-10-13',items:['d023','b004','ar002','bo001']},
  {date:'2022-10-14',items:['bo001']},
  {date:'2022-10-17',items:['bo001']},
  {date:'2022-10-18',items:['bo001']},
  {date:'2022-10-19',items:['bo001']},
  {date:'2022-10-20',items:['bo001']},
  {date:'2022-10-21',items:['d021','bo001']},
  {date:'2022-10-24',items:['bo001']},
  {date:'2022-10-25',items:['d049','b024','j004','sa009','ar018','bo015','d063','b051','bo001']},
  {date:'2022-10-26',items:['bo001']},
  {date:'2022-10-27',items:['bo001']},
  {date:'2022-10-28',items:['bo001']},
  {date:'2022-10-31',items:['b024','j004','sa009']},
  {date:'2022-11-02',items:['bo001']},
  {date:'2022-11-03',items:['bo001']},
  {date:'2022-11-04',items:['bo001']},
  {date:'2022-11-07',items:['bo001']},
  {date:'2022-11-08',items:['bo001']},
  {date:'2022-11-09',items:['bo001']},
  {date:'2022-11-10',items:['bo001']},
  {date:'2022-11-11',items:['bo001']},
  {date:'2022-11-14',items:['bo001']},
  {date:'2022-11-15',items:['bo001']},
  {date:'2022-11-16',items:['bo001']},
  {date:'2022-11-17',items:['bo001']},
  {date:'2022-11-18',items:['bo001']},
  {date:'2022-11-21',items:['bo001']},
  {date:'2022-11-22',items:['bo001']},
  {date:'2022-11-23',items:['bo001']},
  {date:'2022-11-24',items:['bo001']},
  {date:'2022-11-25',items:['bo001']},
  {date:'2022-11-26',items:['d031','b044','j006','sa011','ar002','bo012']},
  {date:'2022-11-27',items:['d040','b043','j004','sa001','ar001','bo001']},
  {date:'2022-11-28',items:['j001','bo001']},
  {date:'2022-11-29',items:['j001','bo001']},
  {date:'2022-11-30',items:['d005','b030','j001','sa001','bo001']},
  {date:'2022-12-01',items:['d032','j001','sa001','bo001']},
  {date:'2022-12-02',items:['d048','b022','j001','sa001','ar001','bo001']},
  {date:'2022-12-03',items:['d031','b044','j006','sa011','ar002','bo001','al009']},
  {date:'2022-12-05',items:['d054','b005','j001','sa001','ar001','bo001']},
  {date:'2022-12-07',items:['j001','bo001']},
  {date:'2022-12-08',items:['d045','j001','sa019','bo005','al002']},
  {date:'2022-12-09',items:['d033','b005','j001','sa020','ar002','bo002']},
  {date:'2022-12-11',items:['d031','b044','j013','sa011','ar002','bo015']},
  {date:'2022-12-12',items:['j001','sa019','ar001','bo001']},
  {date:'2022-12-13',items:['d048','b005','j001','sa019','ar002','bo001']},
  {date:'2022-12-14',items:['d054','b005','j001','sa020','bo001','al002']},
  {date:'2022-12-15',items:['j001','sa019','bo001']},
  {date:'2022-12-16',items:['d051','b030','j001','sa019','bo001']},
  {date:'2022-12-17',items:['d045','b024','j001','sa022','bo005']},
  {date:'2022-12-18',items:['d005','b041','j001','sa001']},
  {date:'2022-12-19',items:['d005','b030','j001','sa019','bo001']},
  {date:'2022-12-20',items:['d041','b024','j001','sa001','ar014','bo001']},
  {date:'2022-12-21',items:['d033','b029','j001','sa001','bo001']},
  {date:'2022-12-22',items:['d029','j001','sa001','ar001','bo001']},
  {date:'2022-12-23',items:['d050','b003','j001','sa001','ar002']},
  {date:'2022-12-24',items:['d041','b022','j001','sa019','ar002','bo002','al009','d052','b005','j001','sa001','ar002','al009']},
  {date:'2022-12-25',items:['d012','b030','j001','sa001','ar002','bo002','al004','d031','b028','j004','sa001','ar002','bo002','b060','s008','sa009','ar002','bo014']},
  {date:'2022-12-26',items:['d016','b030','j001','sa001','ar002','bo002','al001']},
  {date:'2022-12-27',items:['d033','b029','j001','sa001','ar002','bo002','al001']},
  {date:'2022-12-28',items:['d055','b030','j001','sa001','ar002','bo002']},
  {date:'2022-12-29',items:['d031','b028','j001','sa001','ar002','bo002']},
  {date:'2022-12-30',items:['b041','j013','sa001']},
  {date:'2022-12-31',items:['d031','b041','j006','sa011','b060','s013','sa009','ar012','al008']},
  {date:'2023-01-01',items:['d049','b024','sa009','ar012','d031','b041','j006','sa011']},
  {date:'2023-01-02',items:['d014','b005','j001','sa001','ar002','bo001']},
  {date:'2023-01-03',items:['d034','b005','j001','sa001','ar002','al009']},
  {date:'2023-01-04',items:['d057','b039','j006','sa011']},
  {date:'2023-01-05',items:['d016','b007','j001','sa001','ar002','bo002','d050','b007','j001','sa019','ar002','al009']},
  {date:'2023-01-06',items:['d014','b025','j001','sa010','ar006','bo015','al009']},
  {date:'2023-01-07',items:['d031','b039','j012','sa011','d055','b029','j001','sa001','ar012','al009']},
  {date:'2023-01-08',items:['d031','b041','j006','sa011']},
  {date:'2023-01-10',items:['d043','b007','j001','sa002','bo008']},
  {date:'2023-01-12',items:['d014','b023','j001','sa002','bo008']},
  {date:'2023-01-13',items:['d014','b007','j001','sa002','ar002','bo001']},
  {date:'2023-01-15',items:['d031','b041','j006','sa011']},
  {date:'2023-01-16',items:['d012','b029','j001','sa002','bo001']},
  {date:'2023-01-18',items:['b041','j001','sa001']},
  {date:'2023-01-19',items:['d056','b028','j001','sa002','bo001']},
  {date:'2023-01-20',items:['d031','b041','j006','sa011','ar002','d012','j001','sa002']},
  {date:'2023-01-21',items:['d031','b041','j006','sa011','d014','b029','j001','sa002','bo005','d012','j001','sa002']},
  {date:'2023-01-22',items:['d057','b038','j006','sa011']},
  {date:'2023-01-23',items:['d012','j001','sa002','bo001']},
  {date:'2023-01-24',items:['d014','b029','j001','sa002','bo005']},
  {date:'2023-01-25',items:['d012','b029','j001','sa002']},
  {date:'2023-01-26',items:['d048','b050','j001','sa002','ar002','bo005']},
  {date:'2023-01-27',items:['d055','b029','j001','sa002','ar002','bo001','d043','b050','j001','sa002','ar002','bo005']},
  {date:'2023-01-28',items:['d031','b038','j006','sa011','ar002','bo012']},
  {date:'2023-01-29',items:['b060','s016','sa009']},
  {date:'2023-01-30',items:['d012','b029','j001','sa002','bo001']},
  {date:'2023-01-31',items:['d053','b030','j001','sa002','bo001']},
  {date:'2023-02-01',items:['d014','b028','j001','sa002','bo001']},
  {date:'2023-02-02',items:['d055','b030','j001','sa002','bo001']},
  {date:'2023-02-03',items:['d053','b024','j001','sa002','bo001']},
  {date:'2023-02-04',items:['d043','b062','j001','sa002','bo005']},
  {date:'2023-02-05',items:['d031','b038','j006','sa006']},
  {date:'2023-02-06',items:['d045','b022','j001','sa002','bo001']},
  {date:'2023-02-07',items:['d065','b030','j001','sa002','bo001']},
  {date:'2023-02-08',items:['d012','b022','j001','sa002','bo001']},
  {date:'2023-02-09',items:['d031','b038','j006','sa006','ar002','d038','b050','j001','sa002','ar002','bo001']},
  {date:'2023-02-10',items:['d012','b029','j001','sa002','bo001']},
  {date:'2023-02-11',items:['d031','b038','j006','sa006','d045','b029','j001','sa002','bo005']},
  {date:'2023-02-12',items:['d031','b038','j006','sa006']},
  {date:'2023-02-13',items:['d038','b050','j001','sa002','bo001']},
  {date:'2023-02-14',items:['d016','b021','j001','sa002','bo001']},
  {date:'2023-02-15',items:['d009','b050','j001','sa002','bo001']},
  {date:'2023-02-16',items:['d032','b022','j001','sa004','ar002','bo001']},
  {date:'2023-02-17',items:['d016','b050','j001','sa002','bo001']},
  {date:'2023-02-18',items:['d031','b038','j006','sa006','ar002','bo012']},
  {date:'2023-02-19',items:['d032','b037','j017','sa002','bo005']},
  {date:'2023-02-20',items:['d014','b050','j001','sa002','ar001','bo001']},
  {date:'2023-02-21',items:['d012','b028','j001','sa002','ar001','bo001']},
  {date:'2023-02-22',items:['d014','b022','j001','sa002','bo001','d038','b007','j001','sa002','bo001']},
  {date:'2023-02-23',items:['d009','b021','j001','sa002','ar001','bo001']},
  {date:'2023-02-24',items:['d032','b028','j001','sa002','ar008','bo001','al004','d045','b030','j001','sa002','bo005']},
  {date:'2023-02-25',items:['d031','b038','j006','sa006','d049','b035','j001','sa019','bo005']},
  {date:'2023-02-27',items:['d019','b021','j001','sa002','ar008','bo001']},
  {date:'2023-02-28',items:['d009','b022','j001','sa002','ar008','bo001','al004']},
  {date:'2023-03-01',items:['d048','b021','j001','sa002','bo001']},
  {date:'2023-03-02',items:['d040','b050','j001','sa002','ar008','bo001']},
  {date:'2023-03-03',items:['d043','b037','j017','sa002','ar006','bo011','al004','d012','b035','j001','sa002','ar001','bo001']},
  {date:'2023-03-06',items:['d043','b021','j001','sa002','ar008','bo001']},
  {date:'2023-03-07',items:['d005','b022','j001','sa002','ar008','bo001']},
  {date:'2023-03-08',items:['d042','b021','j001','sa002','ar008','bo001']},
  {date:'2023-03-09',items:['d014','b007','j001','sa002','ar008','bo001']},
  {date:'2023-03-10',items:['d033','b043','j007','sa002','ar001','bo001','d016','b043','j007','sa002','ar001','bo001']},
  {date:'2023-03-11',items:['d043','b023','j007','sa002','bo005','al004']},
  {date:'2023-03-12',items:['d031','b038']},
  {date:'2023-03-13',items:['d048','b023','j007','sa002','bo001','al004']},
  {date:'2023-03-14',items:['d031','b021','j008','sa002','ar008','bo001']},
  {date:'2023-03-15',items:['d056','b030','j008','sa002','ar002','bo001','al004']},
  {date:'2023-03-16',items:['d015','b035','j007','sa002','ar006','bo001','al004']},
  {date:'2023-03-17',items:['d042','b062','j007','sa002','ar001','bo001']},
  {date:'2023-03-20',items:['d018','b021','j007','sa002','bo008','al004']},
  {date:'2023-03-21',items:['d032','b023','j007','sa002','ar001','bo008','al004']},
  {date:'2023-03-22',items:['d033','b043','j007','sa002','bo008']},
  {date:'2023-03-23',items:['d016','b007','j007','sa002','ar008','bo008','al004']},
  {date:'2023-03-24',items:['d012','b043','j007','sa002','ar008','bo001','al004']},
  {date:'2023-03-25',items:['d077','b021','j029','sa002','bo005','al005']},
  {date:'2023-03-27',items:['d026','b021','j007','sa002','bo001','al004']},
  {date:'2023-03-28',items:['d016','b003','j007','sa002','ar008','bo001','al004']},
  {date:'2023-03-29',items:['d023','b043','j007','sa002','bo001','al004']},
  {date:'2023-03-30',items:['d024','b043','j007','sa002','ar002','bo001']},
  {date:'2023-03-31',items:['d032','b030','sa002','bo001','al004','d063','b030','j007','sa002','bo001','al004']},
  {date:'2023-04-01',items:['d045','b021','j004','sa002','bo005','al004']},
  {date:'2023-04-02',items:['d014','b050','j004','sa001','bo005','al004']},
  {date:'2023-04-03',items:['d043','b023','j004','sa002','bo005','al004']},
  {date:'2023-04-04',items:['d048','b023','j004','sa002','bo005','al004']},
  {date:'2023-04-05',items:['d012','b022','j004','sa002','bo005','al004']},
  {date:'2023-04-06',items:['d012','b022','sa002','ar003']},
  {date:'2023-04-09',items:['d022','b038','j004','sa006','ar003']},
  {date:'2023-04-10',items:['d032','b023','j004','sa002','ar003','al004']},
  {date:'2023-04-11',items:['d048','b037','j004','sa002','bo001','al004']},
  {date:'2023-04-12',items:['b032','j004','sa002','ar006','bo001','al008']},
  {date:'2023-04-13',items:['d049','b052','j004','sa002','ar002','bo001']},
  {date:'2023-04-14',items:['d048','b033','j004','sa020','bo001','al005']},
  {date:'2023-04-15',items:['d022','b041','j004','sa006']},
  {date:'2023-04-16',items:['d068','b041','j004','sa006']},
  {date:'2023-04-17',items:['d043','b037','j004','sa002','bo001','al004']},
  {date:'2023-04-18',items:['d016','b022','j004','sa002','bo001']},
  {date:'2023-04-19',items:['d012','b035','j004','sa002','bo001']},
  {date:'2023-04-20',items:['d053','b028','j004','sa002','ar003','bo001','al004']},
  {date:'2023-04-21',items:['d033','b021','j004','sa002','ar001','bo001','al004']},
  {date:'2023-04-22',items:['d048','b021','j004','sa002','bo005','al004','d053','b029','j004','sa002','bo005','al004']},
  {date:'2023-04-23',items:['d056','b029','j004','sa001','bo005','b054','s001','j018','sa009','bo014']},
  {date:'2023-04-24',items:['d058','b028','j004','sa001','ar003','bo001','al005']},
  {date:'2023-04-25',items:['d042','b006','j004','sa001','ar001','bo001','al004']},
  {date:'2023-04-26',items:['d056','b006','j004','sa001','ar003','bo001']},
  {date:'2023-04-27',items:['d032','b028','j004','sa001','ar003','bo001']},
  {date:'2023-04-28',items:['d016','b006','j004','sa001','ar002','bo001','al004','d023','b028','j016','sa001','ar002','bo001','al004']},
  {date:'2023-04-29',items:['d021','b038','sa006']},
  {date:'2023-04-30',items:['d057','b045','j013','sa006']},
  {date:'2023-05-01',items:['d022','b045','j013','sa006']},
  {date:'2023-05-02',items:['d026','b021','j016','sa001','bo001','al004']},
  {date:'2023-05-03',items:['d037','b022','j016','sa001','ar003','bo001','d026','b021','j016','sa001','ar003','bo001','al004']},
  {date:'2023-05-04',items:['d027','b021','j016','sa001','bo001','al005']},
  {date:'2023-05-05',items:['d023','b032','j005','sa001','ar002','bo001']},
  {date:'2023-05-06',items:['d021','b045','j013','sa006']},
  {date:'2023-05-08',items:['d026','b035','j005','sa001','ar001','bo001']},
  {date:'2023-05-09',items:['d055','b029','j005','sa001','bo001']},
  {date:'2023-05-10',items:['d023','b033','j005','sa001','ar002','bo001','al005','d023','b035','j005','sa001','ar002','bo001']},
  {date:'2023-05-11',items:['d013','b032','j005','sa001','bo001','al008']},
  {date:'2023-05-12',items:['d025','b033','j005','sa001','ar001','bo001','al005','d046','b035','sa019','bo011']},
  {date:'2023-05-13',items:['d021','b038','j013','sa006']},
  {date:'2023-05-14',items:['d021','b038','j013','sa006','d026','b035','j005','sa019','bo011']},
  {date:'2023-05-15',items:['d058','b002','j005','sa020','ar015','bo001']},
  {date:'2023-05-16',items:['d043','b002','j005','sa001','ar015','bo001']},
  {date:'2023-05-17',items:['d033','b021','j005','sa001','ar015','bo001']},
  {date:'2023-05-18',items:['d024','b021','j005','sa001','ar015','bo001']},
  {date:'2023-05-19',items:['d027','b002','sa001','ar009','bo001']},
  {date:'2023-05-20',items:['d021','b038','j013','sa006','ar003']},
  {date:'2023-05-21',items:['d021','b038','j013','sa006']},
  {date:'2023-05-22',items:['d058','b002','j005','sa001','ar009','bo001']},
  {date:'2023-05-24',items:['d058','b021','j005','sa001','ar009','bo001']},
  {date:'2023-05-25',items:['d043','b021','j005','sa001','ar009','bo001']},
  {date:'2023-05-26',items:['d043','b021','j005','sa001','ar009','bo001']},
  {date:'2023-05-27',items:['d021','b044','j013','sa006','ar009','bo001']},
  {date:'2023-05-28',items:['ar009']},
  {date:'2023-05-30',items:['d025','b021','j005','sa001','ar003','bo001']},
  {date:'2023-05-31',items:['b044']},
  {date:'2023-06-01',items:['d024','b006','j005','sa001','ar009','bo001']},
  {date:'2023-06-02',items:['d033','b006','j005','sa001','ar001','bo001']},
  {date:'2023-06-05',items:['d025','b002','j005','sa001','ar003','bo001']},
  {date:'2023-06-06',items:['d024','b002','j005','sa001','ar003','bo001','al002']},
  {date:'2023-06-07',items:['d037','b021','j005','sa001','ar009']},
  {date:'2023-06-08',items:['d021','b021','sa001','bo002']},
  {date:'2023-06-09',items:['d026','b021','j005','sa001','ar009','bo002','al004','d026','b006','j007','sa001','ar009','bo001']},
  {date:'2023-06-10',items:['d004','b059']},
  {date:'2023-06-11',items:['d004','b059']},
  {date:'2023-06-12',items:['d023','b032','j005','sa001','ar001','bo001']},
  {date:'2023-06-13',items:['d023','b021','j005','sa001','ar001','bo002']},
  {date:'2023-06-14',items:['d023','b015','j013','sa001','ar001','bo002','al017']},
  {date:'2023-06-15',items:['d004','b059']},
  {date:'2023-06-16',items:['d021','b020','sa001','ar002','bo013']},
  {date:'2023-06-17',items:['d021','b013','sa001','ar009','bo005']},
  {date:'2023-06-18',items:['d004','b059','s001','sa014','ar009','bo011']},
  {date:'2023-06-19',items:['d023','b015','sa006','ar009','bo002']},
  {date:'2023-06-20',items:['d023','b015','sa012','ar009','bo010','al014']},
  {date:'2023-06-21',items:['s002','sa012','ar009','bo001','al014']},
  {date:'2023-06-22',items:['d030','b005','j028','sa012','ar009','bo002']},
  {date:'2023-06-23',items:['s001','j020','sa014','ar009','bo011']},
  {date:'2023-06-24',items:['s002','sa005','ar009','bo002','al014','d071','b032','j009','sa012','ar009','bo002','al014']},
  {date:'2023-06-25',items:['d023','b032','sa012','ar009','bo002','al016']},
  {date:'2023-06-26',items:['d025','b015','sa015','bo010','al016']},
  {date:'2023-06-27',items:['d059','b058','sa015','bo010','b047','j009','sa015','bo002','s001','j005','sa005','ar009','bo011']},
  {date:'2023-06-28',items:['d017','b033','sa001','ar009','bo002','d024','b010','sa012','ar009','bo001']},
  {date:'2023-06-29',items:['d036','b010','j005','sa001','ar009','bo002']},
  {date:'2023-06-30',items:['d021','b015','j005','sa001','ar009','bo005']},
  {date:'2023-07-01',items:['d036','b020','sa001','ar009','bo005']},
  {date:'2023-07-02',items:['d021','b028','j028','sa001','ar009','bo001','al004','s001','sa012','ar009','bo011']},
  {date:'2023-07-03',items:['d043','b028','j004','sa001','ar009','bo008']},
  {date:'2023-07-04',items:['d043','b001','j004','sa001','ar009','bo008','al002']},
  {date:'2023-07-05',items:['d026','b001','j004','sa001','ar009','bo001']},
  {date:'2023-07-06',items:['d048','b032','j007','sa001','ar009','bo001']},
  {date:'2023-07-07',items:['d021','b010','j007','sa001','ar009','bo001']},
  {date:'2023-07-08',items:['d037','b028','j004','sa001','ar009','bo002','al002','d027','b028','j004','sa001','ar009','bo002']},
  {date:'2023-07-09',items:['d023','b028','j004','sa001','ar007','bo002']},
  {date:'2023-07-10',items:['s017','sa001','ar007','bo001']},
  {date:'2023-07-11',items:['s002','sa001','ar007','bo002','al002','b028','j028','sa001','ar007','bo001']},
  {date:'2023-07-12',items:['d025','b028','j028','sa001','ar007','bo001']},
  {date:'2023-07-13',items:['d024','b010','sa001','ar007','bo001','s002','sa001','ar007','bo002']},
  {date:'2023-07-14',items:['d043','b001','j027','sa001','ar007','bo001','al002','d022','b001','j027','sa001','ar007']},
  {date:'2023-07-15',items:['d023','b001','j004','sa001','ar007','bo002','d027','b001','j004','sa001','ar007','bo002']},
  {date:'2023-07-16',items:['d036','b006','j005','sa001','ar007','bo002']},
  {date:'2023-07-17',items:['d037','b028','j004','sa001','ar007','bo001']},
  {date:'2023-07-18',items:['d037','b028','j004','sa001','ar007','bo001']},
  {date:'2023-07-19',items:['d026','b028','j004','sa001','ar007','bo001']},
  {date:'2023-07-20',items:['d043','b032','j004','sa001','ar007','bo002']},
  {date:'2023-07-21',items:['d036','b052','j020','sa001','ar007','bo011','d023','b032','j004','sa001','ar007','bo001','al003','s001','j020','sa014','ar007','bo011']},
  {date:'2023-07-22',items:['d043','b028','j004','sa006','ar007','bo002']},
  {date:'2023-07-23',items:['d048','b028','j004','sa006','ar007','bo002']},
  {date:'2023-07-24',items:['d024','b028','j004','sa006','ar007','bo002','al003']},
  {date:'2023-07-25',items:['d023','b028','j004','sa006','ar007','bo002']},
  {date:'2023-07-26',items:['d025','b001','j004','sa001','ar007','bo002','al003']},
  {date:'2023-07-27',items:['d043','b001','j004','sa006','ar007','bo002']},
  {date:'2023-07-28',items:['d021','b001','j010','sa001','ar007','bo002']},
  {date:'2023-07-29',items:['d023','b058','sa013','bo010','al016','d070','b015','sa001','ar007','bo004','s006','sa001','ar007','bo004']},
  {date:'2023-07-30',items:['d023','b058','sa013','bo010','al016','s006','sa001','ar007','bo004']},
  {date:'2023-07-31',items:['d013','b012','sa001','ar007','bo004','d020','b006','j010','sa001','ar007','bo002']},
  {date:'2023-08-01',items:['d013','b010','sa001','ar007','bo002']},
  {date:'2023-08-02',items:['d036','b052','sa012','ar007','bo002']},
  {date:'2023-08-03',items:['s006','sa001','ar007','bo002']},
  {date:'2023-08-04',items:['d059','b010','sa012','ar007','bo002']},
  {date:'2023-08-05',items:['d010','b010','sa012','ar007','bo002','d002','b033','sa012','ar007','bo002']},
  {date:'2023-08-06',items:['d059','b033','sa012','ar007','bo002','d007','b010','j005','sa012','ar007','bo002']},
  {date:'2023-08-07',items:['d024','b006','j010','sa001','ar007','bo002','d004','b058','sa013','bo010','al001','d010','b010','j005','sa012','ar001','bo002']},
  {date:'2023-08-08',items:['s006','sa001','ar007','bo002','al014']},
  {date:'2023-08-09',items:['d007','b015','sa012','ar007','bo002','al014']},
  {date:'2023-08-10',items:['d007','b010','sa005','ar007','bo002']},
  {date:'2023-08-11',items:['d007','b058','sa012','ar007','bo002']},
  {date:'2023-08-12',items:['d007','b010','sa001','ar007','bo002']},
  {date:'2023-08-14',items:['d021','b047','j010','sa001','ar006','bo009','d036','b052','sa005','ar006','bo016']},
  {date:'2023-08-15',items:['d004','b057','sa018','ar002','bo018','s001','sa005','ar006','bo016']},
  {date:'2023-08-16',items:['d060','b015','sa001','ar011','bo002','s001','sa005','ar006','bo016']},
  {date:'2023-08-17',items:['d007','b013','sa005','ar002','bo016','sa001','ar007','bo002']},
  {date:'2023-08-18',items:['s001','sa005','ar006','bo016','s007','sa001','ar006','bo002']},
  {date:'2023-08-19',items:['d023','b032','sa001','ar006','bo002','s015','sa005','ar006','bo016']},
  {date:'2023-08-20',items:['d059','b012','sa001','ar006','bo002']},
  {date:'2023-08-27',items:['d004','b058','sa012','ar005','bo001','al001']},
  {date:'2023-09-07',items:['d007','b013','j005','sa012','ar001','bo002']},
  {date:'2023-09-09',items:['s001','sa012','ar005']},
  {date:'2023-09-10',items:['d021','sa001','ar002','bo002','d036','b052','sa005','ar005','bo016']},
  {date:'2023-09-11',items:['d024']},
  {date:'2023-09-14',items:['d043','b036','sa001','ar005','bo001']},
  {date:'2023-09-15',items:['d044','b036','sa001','ar005','bo001','d023','b005','j021','sa002','ar006','bo005']},
  {date:'2023-09-16',items:['ar005']},
  {date:'2023-09-17',items:['ar005']},
  {date:'2023-09-18',items:['ar005']},
  {date:'2023-09-19',items:['ar005']},
  {date:'2023-09-20',items:['d043','b037','sa001','ar005','bo001','al007']},
  {date:'2023-09-21',items:['d032','b036','sa001','ar005','bo001']},
  {date:'2023-09-22',items:['d032','b023','sa001','ar005','bo001']},
  {date:'2023-09-23',items:['d044','b036','j005','sa001','ar005','bo001']},
  {date:'2023-09-24',items:['ar005']},
  {date:'2023-09-25',items:['ar005']},
  {date:'2023-09-26',items:['ar005']},
  {date:'2023-09-27',items:['d074','b032','sa001','ar005','bo001']},
  {date:'2023-09-28',items:['d023','b034','sa001','ar005','bo001']},
  {date:'2023-09-29',items:['ar005']},
  {date:'2023-09-30',items:['ar005']},
  {date:'2023-10-01',items:['ar005']},
  {date:'2023-10-02',items:['d023','ar005']},
  {date:'2023-10-03',items:['d051','b034','j004','sa002','ar005','bo001']},
  {date:'2023-10-04',items:['ar005']},
  {date:'2023-10-05',items:['d032','b036','j004','sa001','ar005','bo001']},
  {date:'2023-10-06',items:['d043','b023','j004','sa001','ar005','bo001']},
  {date:'2023-10-07',items:['j004','ar005']},
  {date:'2023-10-08',items:['j004','ar005']},
  {date:'2023-10-09',items:['j004','ar005']},
  {date:'2023-10-10',items:['j004','ar005']},
  {date:'2023-10-11',items:['j004','ar005']},
  {date:'2023-10-12',items:['j004','ar005']},
  {date:'2023-10-13',items:['j004','ar005']},
  {date:'2023-10-14',items:['j004','ar005']},
  {date:'2023-10-15',items:['j004','ar005']},
  {date:'2023-10-16',items:['d044','b036','j004','sa001','ar005','bo001']},
  {date:'2023-10-17',items:['d043','b037','j001','sa002','ar005','bo001','al007']},
  {date:'2023-10-18',items:['d039','b031','j004','sa002','ar005','bo001']},
  {date:'2023-10-19',items:['b032','j001','sa002','ar005','bo001','al008']},
  {date:'2023-10-20',items:['j001','ar005']},
  {date:'2023-10-21',items:['j001','ar005']},
  {date:'2023-10-22',items:['j001','ar005']},
  {date:'2023-10-23',items:['d043','b028','j001','sa001','ar005','bo001']},
  {date:'2023-10-24',items:['d039','j001','sa002','ar005','bo001']},
  {date:'2023-10-25',items:['j001','ar005']},
  {date:'2023-10-26',items:['j001','ar005']},
  {date:'2023-10-27',items:['d045','b025','j001','sa002','ar005','bo001','al008']},
  {date:'2023-10-28',items:['j001','ar005']},
  {date:'2023-10-29',items:['j001','ar005']},
  {date:'2023-10-30',items:['d045','b025','j001','sa020','ar005','bo001']},
  {date:'2023-10-31',items:['j001','ar005']},
  {date:'2023-11-01',items:['d045','b025','j017','sa002','ar002','bo014']},
  {date:'2023-11-02',items:['j001','ar005']},
  {date:'2023-11-03',items:['j001','ar005']},
  {date:'2023-11-04',items:['j001','ar005']},
  {date:'2023-11-05',items:['j001','ar005']},
  {date:'2023-11-06',items:['d015','b031','j001','sa002','ar005','bo001']},
  {date:'2023-11-07',items:['j001','ar005']},
  {date:'2023-11-08',items:['j001','ar005']},
  {date:'2023-11-09',items:['j001','ar005']},
  {date:'2023-11-10',items:['d012','b035','j001','sa002','ar005','bo001']},
  {date:'2023-11-11',items:['j001','ar005']},
  {date:'2023-11-12',items:['j001','ar005']},
  {date:'2023-11-13',items:['j001','ar005']},
  {date:'2023-11-14',items:['j001','ar005']},
  {date:'2023-11-15',items:['d043','b031','j001','sa002','ar005','bo001']},
  {date:'2023-11-16',items:['j001','ar005']},
  {date:'2023-11-17',items:['d043','j001','sa002','ar005','bo001']},
  {date:'2023-11-18',items:['j001','ar005']},
  {date:'2023-11-19',items:['j001','ar005']},
  {date:'2023-11-20',items:['j001','ar005']},
  {date:'2023-11-21',items:['j001','ar005']},
  {date:'2023-11-22',items:['d006','b031','j001','sa002','ar005','bo001']},
  {date:'2023-11-23',items:['d038','b031','j001','sa002','ar005','bo001']},
  {date:'2023-11-24',items:['j001','ar005']},
  {date:'2023-11-25',items:['j001','ar005']},
  {date:'2023-11-26',items:['d031','b038','j006','sa006','ar005','bo002']},
  {date:'2023-11-27',items:['d015','b023','j001','sa002','ar005','bo001']},
  {date:'2023-11-28',items:['d006','b032','j001','sa002','ar005','bo001','j001','ar005']},
  {date:'2023-11-29',items:['d044','b034','j001','sa002','ar005','bo001']},
  {date:'2023-11-30',items:['d006','b031','j001','sa002','ar005','bo001']},
  {date:'2023-12-01',items:['d038','b036','j001','sa002','ar005','bo001']},
  {date:'2023-12-02',items:['d006','b031','j001','sa002','ar005','bo002']},
  {date:'2023-12-03',items:['d006','b031','j001','sa002','ar005','bo005']},
  {date:'2023-12-04',items:['d038','b031','j001','sa002','ar005','bo001','d038','b028','j001','sa002','ar005','bo001']},
  {date:'2023-12-05',items:['d015','b035','j001','sa002','ar005','bo001']},
  {date:'2023-12-06',items:['d006','b031','j001','sa002','ar005','bo005']},
  {date:'2023-12-07',items:['d031','b038','j006','sa006','ar002','bo012']},
  {date:'2023-12-11',items:['d015','b031','j001','sa002','ar005','bo001']},
  {date:'2023-12-12',items:['d012','b035','j001','sa002','ar005','bo001']},
  {date:'2023-12-13',items:['d038','b025','j001','sa002','ar005','bo001','d048','b035','j001','sa002','ar005','bo005']},
  {date:'2023-12-14',items:['d014','b023','j001','sa002','ar005','bo001']},
  {date:'2023-12-15',items:['d006','b036','j001','sa002','ar005','bo001']},
  {date:'2023-12-16',items:['d038','b031','j001','sa002','ar005','bo005','d024','b007','j001','sa001','ar005','al009']},
  {date:'2023-12-18',items:['d039','b031','j001','sa002','ar005','bo001']},
  {date:'2023-12-19',items:['d024','b029','j001','sa002','ar005','bo001']},
  {date:'2023-12-20',items:['d039','b031','j001','sa002','ar005','bo001']},
  {date:'2023-12-21',items:['d021','b034','j001','sa002','bo005']},
  {date:'2023-12-25',items:['d031','b035','j001','sa002','ar005','bo005','b055','s005','sa016','ar005','bo005']},
  {date:'2023-12-26',items:['d011','b029','sa002','ar005','bo005']},
  {date:'2023-12-27',items:['d031','b035','sa002','ar005','bo005']},
  {date:'2023-12-28',items:['d014','b035','sa002','ar005','bo005']},
  {date:'2023-12-29',items:['d014','b029','sa002','ar005','bo005']},
  {date:'2023-12-30',items:['d053','b034','j001','sa002','ar005','bo005']},
  {date:'2023-12-31',items:['b054','s018','sa016','ar005']},
  {date:'2024-01-02',items:['d045','b038']},
  {date:'2024-01-04',items:['d045','b038']},
  {date:'2024-01-06',items:['d039','b031','j002','sa019','ar005','bo005']},
  {date:'2024-02-21',items:['d003','b031','j017']},
  {date:'2024-02-22',items:['d046','b025','j017','j017']},
  {date:'2024-02-28',items:['d046','b025','j018','j017']},
  {date:'2024-02-29',items:['j017']},
  {date:'2024-03-01',items:['b001','j017']},
];



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
    statCardHTML(IC.coin, 2, 'CPU mitj\u00e0', avgCPU !== '—' ? `${avgCPU}€` : '—', 'per peça portada') +
    statCardHTML(IC.calendar, 3, 'Últim registre', `<span style="font-size:1.2rem">${lastWearDate}</span>`, `${totalWears} usos en total`) +
    statCardHTML(IC.month, 4, 'Aquest mes', monthDays, 'dies registrats');
}

function statCardHTML(icon, variant, label, value, note) {
  return `<div class="stat-card stat-c${variant}">` +
    `<div class="highlight-icon">${icon}</div>` +
    `<div><div class="stat-label">${label}</div><div class="stat-value">${value}</div><div class="stat-note">${note}</div></div>` +
    `</div>`;
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

// ══════════════════════════════════════════
//  WARDROBE
// ══════════════════════════════════════════
const CAT_LABELS = {DALT:'Dalt',BAIX:'Baix',SENCER:'Sencer',JAQUETA:'Jaqueta',SABATES:'Sabates',ARRACADES:'Arracades',BOLSO:'Bolso',ALTRES:'Altres'};

const TYPES_BY_CAT = {
  DALT:['Samarreta','Brusa','Camisa','Jersei','Cardigan','Top','Altres'],
  BAIX:['Texans','Pantalons','Faldilla','Shorts','Mitges','Altres'],
  SENCER:['Vestit','Mono','Altres'],
  JAQUETA:['Jaqueta','Texana','Abric','Americana','Dessuadora','Anorac','Impermeable','Altres'],
  SABATES:['Bambes','Botina','Sandàlies','Xancletes','Altres'],
  ARRACADES:['Llarga','Curta','Aro','Altres'],
  BOLSO:['Bandolera','Motxilla','Nanses','Formal','Ronyonera','Altres'],
  ALTRES:['Cinturó','Ulleres de sol','Biquíni','Guants','Paraigüies','Altres'],
};

let wrdPage = 1;
const WRD_PER = 16;
let wrdSelectMode = false;
let wrdSelected = new Set();
let wrdActiveFilters = {
  cat:'', type:'',
  seasons:[], formality:[], colors:[], brands:[], sizes:[], status:[],
  priceMin:null, priceMax:null, cpuMin:null, cpuMax:null, needsInfo:false,
  colorOp:'AND'
};
let wrdFilterBarBuilt = false;

const SEASON_LABELS   = {estiu:'Estiu',hivern:'Hivern',primavera:'Primavera',tardor:'Tardor'};
const FORMAL_LABELS   = {casual:'Casual','smart-casual':'Smart Casual',formal:'Formal'};
const STATUS_LABELS   = {active:'Activa',retired:'Retirada','needs-info':'Cal info'};

// ── Filter bar ──
function buildFilterBar(allItems){
  if(wrdFilterBarBuilt) return;
  wrdFilterBarBuilt = true;

  // Extract individual colors — split "Blanc i Negre" into ["Blanc", "Negre"]
  const colorSet = new Set();
  allItems.forEach(it => {
    if(!it.color) return;
    it.color.split(/\s+i\s+|,\s*/).forEach(c => { const t=c.trim(); if(t) colorSet.add(t); });
  });
  const colors = [...colorSet].sort();
  const brands = [...new Set(allItems.map(i=>i.brand).filter(Boolean))].sort();
  const sizes  = [...new Set(allItems.map(i=>i.size).filter(Boolean))].sort();

  buildMultiPanel('fp-season',   Object.keys(SEASON_LABELS),  SEASON_LABELS,  'seasons');
  buildMultiPanel('fp-formality',Object.keys(FORMAL_LABELS),  FORMAL_LABELS,  'formality');
  buildMultiPanelWithFlowers('fp-color', colors, 'colors');
  buildMultiPanel('fp-brand',    brands, null, 'brands');
  buildMultiPanel('fp-size',     sizes,  null, 'sizes');
  buildMultiPanel('fp-status',   Object.keys(STATUS_LABELS),  STATUS_LABELS,  'status');

  // Panel toggle
  document.querySelectorAll('.fbar-btn[data-fb]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const panel = document.getElementById('fp-' + btn.dataset.fb);
      const wasOpen = panel.classList.contains('open');
      document.querySelectorAll('.fbar-panel').forEach(p=>p.classList.remove('open'));
      if(!wasOpen) panel.classList.add('open');
    });
  });
  document.addEventListener('click', () => document.querySelectorAll('.fbar-panel').forEach(p=>p.classList.remove('open')));
}

function buildMultiPanelWithFlowers(panelId, values, filterKey){
  const panel=document.getElementById(panelId);
  if(!panel||!values.length){if(panel)panel.innerHTML='<div style="padding:0.5rem 0.85rem;font-size:12px;color:var(--text3)">Cap valor</div>';return;}
  panel.innerHTML='<div style="padding:0.4rem 0.5rem;border-bottom:1px solid var(--border2);display:flex;gap:0.4rem">'
    +'<button class="chip" style="font-size:11px;padding:0.2rem 0.6rem" data-colorop="OR">OR</button>'
    +'<button class="chip on" style="font-size:11px;padding:0.2rem 0.6rem" data-colorop="AND">AND</button>'
    +'</div>'
    +values.map(v=>
      '<label class="fbar-option" style="gap:8px"><input type="checkbox" value="'+v+'" data-fkey="'+filterKey+'">'+flowerSVG(v,14)+' '+esc(v)+'</label>'
    ).join('');
  // OR/AND toggle
  panel.querySelectorAll('[data-colorop]').forEach(btn=>{
    btn.addEventListener('click',()=>{
      panel.querySelectorAll('[data-colorop]').forEach(b=>b.classList.remove('on'));
      btn.classList.add('on');
      wrdActiveFilters.colorOp=btn.dataset.colorop;
      wrdPage=1;renderWardrobe();
    });
  });
  panel.querySelectorAll('input[type=checkbox]').forEach(cb=>{
    cb.addEventListener('change',()=>{
      if(cb.checked){if(!wrdActiveFilters[cb.dataset.fkey].includes(cb.value))wrdActiveFilters[cb.dataset.fkey].push(cb.value);}
      else wrdActiveFilters[cb.dataset.fkey]=wrdActiveFilters[cb.dataset.fkey].filter(x=>x!==cb.value);
      updateBadge(cb.dataset.fkey);wrdPage=1;renderWardrobe();
    });
  });
}

function buildMultiPanel(panelId, values, displayMap, filterKey){
  const panel = document.getElementById(panelId);
  if(!panel || !values.length){ if(panel) panel.innerHTML='<div style="padding:0.5rem 0.85rem;font-size:12px;color:var(--text3)">Cap valor</div>'; return; }
  panel.innerHTML = values.map(v =>
    '<label class="fbar-option"><input type="checkbox" value="' + v + '" data-fkey="' + filterKey + '">' + (displayMap?.[v]||v) + '</label>'
  ).join('');
  panel.querySelectorAll('input[type=checkbox]').forEach(cb => {
    cb.addEventListener('change', () => {
      if(cb.checked){ if(!wrdActiveFilters[cb.dataset.fkey].includes(cb.value)) wrdActiveFilters[cb.dataset.fkey].push(cb.value); }
      else wrdActiveFilters[cb.dataset.fkey] = wrdActiveFilters[cb.dataset.fkey].filter(x=>x!==cb.value);
      updateBadge(cb.dataset.fkey);
      wrdPage=1; renderWardrobe();
    });
  });
}

function updateBadge(filterKey){
  const fbMap = {seasons:'season',formality:'formality',colors:'color',brands:'brand',sizes:'size',status:'status'};
  const fbKey = fbMap[filterKey] || filterKey;
  const badge = document.getElementById('fb-badge-' + fbKey);
  if(!badge) return;
  const n = wrdActiveFilters[filterKey]?.length || 0;
  badge.textContent = n; badge.classList.toggle('show', n>0);
  const btn = document.querySelector('[data-fb="'+fbKey+'"]');
  if(btn) btn.classList.toggle('has-filter', n>0);
  updateClearBtn();
}

function updateClearBtn(){
  const has = ['seasons','formality','colors','brands','sizes','status'].some(k=>wrdActiveFilters[k].length>0)
    || document.getElementById('fp-price-min')?.value
    || document.getElementById('fp-price-max')?.value
    || document.getElementById('fp-cpu-min')?.value
    || document.getElementById('fp-cpu-max')?.value;
  const btn = document.getElementById('fbar-clear');
  if(btn) btn.style.display = has ? 'inline' : 'none';
}

function clearAllFilters(){
  ['seasons','formality','colors','brands','sizes','status'].forEach(k=>{ wrdActiveFilters[k]=[]; }); wrdActiveFilters.colorOp='AND';
  document.querySelectorAll('.fbar-panel input[type=checkbox]').forEach(cb=>cb.checked=false);
  document.querySelectorAll('.fbar-badge').forEach(b=>{b.textContent='';b.classList.remove('show');});
  document.querySelectorAll('.fbar-btn').forEach(b=>b.classList.remove('has-filter'));
  ['fp-price-min','fp-price-max','fp-cpu-min','fp-cpu-max'].forEach(id=>{ const el=document.getElementById(id); if(el) el.value=''; });
  updateClearBtn(); wrdPage=1; renderWardrobe();
}

// ── Select mode ──
function toggleSelectMode(){
  wrdSelectMode = !wrdSelectMode; wrdSelected.clear();
  document.getElementById('wrd-select-mode')?.classList.toggle('on', wrdSelectMode);
  document.getElementById('wrd-delete-selected').style.display = 'none';
  renderWardrobe();
}
async function deleteSelected(){
  if(!wrdSelected.size) return;
  if(!confirm('Eliminar ' + wrdSelected.size + ' pe' + (wrdSelected.size!==1?'ces':'ça') + ' seleccionades? Aniran a la paperera.')) return;
  for(const id of wrdSelected){
    const item = await dbGet('items', id);
    if(item){ item.deletedAt = Date.now(); await dbPut('trash', item); await dbDelete('items', id); }
  }
  toast(wrdSelected.size + ' pe' + (wrdSelected.size!==1?'ces':'ça') + ' mogudes a la paperera');
  wrdSelected.clear(); wrdSelectMode=false;
  document.getElementById('wrd-select-mode')?.classList.remove('on');
  document.getElementById('wrd-delete-selected').style.display='none';
  renderWardrobe(); renderDashboard();
}

// ── Main render ──
async function renderWardrobe(){
  const search = (document.getElementById('wrd-search')?.value||'').toLowerCase();
  const sort   = document.getElementById('wrd-sort')?.value||'reps_desc';
  let items = await dbGetAll('items');

  if(!document.getElementById('cat-chips').children.length) buildWardrobeChips();
  buildFilterBar(items);

  const pMin = parseFloat(document.getElementById('fp-price-min')?.value)||null;
  const pMax = parseFloat(document.getElementById('fp-price-max')?.value)||null;
  const cMin = parseFloat(document.getElementById('fp-cpu-min')?.value)||null;
  const cMax = parseFloat(document.getElementById('fp-cpu-max')?.value)||null;
  ['price','cpu'].forEach(k => {
    const min = k==='price'?pMin:cMin, max = k==='price'?pMax:cMax;
    const badge = document.getElementById('fb-badge-'+k);
    if(badge){ badge.textContent=min||max?'1':''; badge.classList.toggle('show',!!(min||max)); }
    const btn = document.querySelector('[data-fb="'+k+'"]');
    if(btn) btn.classList.toggle('has-filter',!!(min||max));
  });

  // Apply filters
  if(wrdActiveFilters.cat) items = items.filter(i=>i.category===wrdActiveFilters.cat);
  if(wrdActiveFilters.type) items = items.filter(i=>(i.type||'').toLowerCase()===wrdActiveFilters.type.toLowerCase());
  if(wrdActiveFilters.seasons.length) items = items.filter(i=>i.seasons.length===0||wrdActiveFilters.seasons.some(s=>i.seasons.includes(s)));
  if(wrdActiveFilters.formality.length) items = items.filter(i=>i.formality.length===0||wrdActiveFilters.formality.some(f=>i.formality.includes(f)));
  if(wrdActiveFilters.colors.length) items = items.filter(i=>{
    const cols=(Array.isArray(i.colors)&&i.colors.length?i.colors:(i.color?i.color.split(/\s+i\s+|,\s*/).map(c=>c.trim()).filter(Boolean):[])).map(c=>c.toLowerCase());
    if(wrdActiveFilters.colorOp==='AND')
      return wrdActiveFilters.colors.every(c=>cols.includes(c.toLowerCase()));
    return wrdActiveFilters.colors.some(c=>cols.includes(c.toLowerCase()));
  });
  if(wrdActiveFilters.brands.length) items = items.filter(i=>wrdActiveFilters.brands.includes(i.brand));
  if(wrdActiveFilters.sizes.length)  items = items.filter(i=>wrdActiveFilters.sizes.includes(i.size));
  if(wrdActiveFilters.status.length) items = items.filter(i=>wrdActiveFilters.status.some(s=>{
    const isRetired = i.units?.length>0 && i.units.every(u=>u.retired);
    if(s==='active') return !isRetired;
    if(s==='retired') return isRetired;
    if(s==='needs-info') return i.needsInfo;
    return true;
  }));
  if(pMin!=null) items = items.filter(i=>i.price>=pMin);
  if(pMax!=null) items = items.filter(i=>i.price<=pMax);
  if(cMin!=null) items = items.filter(i=>i.wears>0&&i.cpw>=cMin);
  if(cMax!=null) items = items.filter(i=>i.wears>0&&i.cpw<=cMax);
  if(wrdActiveFilters.needsInfo) items = items.filter(i=>i.needsInfo);
  if(search) items = items.filter(i=>
    i.brand.toLowerCase().includes(search)||i.name.toLowerCase().includes(search)||
    i.color.toLowerCase().includes(search)||(i.type||'').toLowerCase().includes(search));

  // Sort
  if(sort==='reps_desc') items.sort((a,b)=>b.wears-a.wears);
  else if(sort==='reps_asc') items.sort((a,b)=>a.wears-b.wears);
  else if(sort==='cpw_asc') items.sort((a,b)=>(a.wears?a.cpw:9999)-(b.wears?b.cpw:9999));
  else if(sort==='cpw_desc') items.sort((a,b)=>b.cpw-a.cpw);
  else if(sort==='price_desc') items.sort((a,b)=>b.price-a.price);
  else if(sort==='alpha') items.sort((a,b)=>(a.brand+a.name).localeCompare(b.brand+b.name,'ca'));

  const needsCount = items.filter(i=>i.needsInfo).length;
  const niEl = document.getElementById('needs-info-banner');
  if(needsCount&&!wrdActiveFilters.needsInfo){ document.getElementById('needs-info-text').textContent=needsCount+' peça'+(needsCount!==1?'s':'')+' sense informació completa'; niEl.style.display='flex'; }
  else niEl.style.display='none';

  document.getElementById('wardrobe-sub').textContent = items.length+' pe'+(items.length!==1?'ces':'ça')+' trobades';

  const startI=(wrdPage-1)*WRD_PER, slice=items.slice(startI,startI+WRD_PER);
  const grid=document.getElementById('wardrobe-grid');
  if(!slice.length){ grid.innerHTML='<div class="empty"><span class="empty-icon">👗</span><div class="empty-title">Cap peça trobada</div><p>Prova a canviar els filtres.</p></div>'; document.getElementById('wardrobe-pag').innerHTML=''; return; }

  const delBtn=document.getElementById('wrd-delete-selected');
  if(delBtn) delBtn.style.display=wrdSelectMode&&wrdSelected.size>0?'inline-flex':'none';

  grid.innerHTML = slice.map(item => {
    const isRetired = item.units?.length>0&&item.units.every(u=>u.retired);
    const cpwStr = item.wears>0?item.cpw.toFixed(2)+'\u20ac':'\u2014';
    const seasons = item.seasons.map(s=>'<span class="pill pill-season">'+(SEASON_LABELS[s]||s)+'</span>').join('');
    const formalPills = item.formality.map(f=>'<span class="pill pill-formal">'+(FORMAL_LABELS[f]||f)+'</span>').join('');
    const needsPill = item.needsInfo?'<span class="pill pill-warn">Cal info</span>':'';
    const retiredPill = isRetired?'<span class="pill" style="background:#E5E5E5;color:#888">Retirada</span>':'';
    const isSelected = wrdSelected.has(item.id);
    return '<div class="item-card fade-in'+(item.needsInfo?' needs-info':'')+(item.favourite?' favourite':'')+(wrdSelectMode?' selectable':'')+(isSelected?' selected-card':'')+'" data-id="'+item.id+'" style="'+(isRetired?'opacity:0.55':'')+'">'
      +(wrdSelectMode?'<input type="checkbox" class="select-checkbox"'+(isSelected?' checked':'')+'>'  :'')
      +(()=>{
      const cols=Array.isArray(item.colors)&&item.colors.length?item.colors:(item.color?item.color.split(/\s+i\s+|,\s*/).map(c=>c.trim()).filter(Boolean):[]);
      return '<div class="ic-photo" style="display:flex;align-items:center;justify-content:center;background:var(--bg3)">'+catIconSVG(item.category,cols,56)+'</div>';
    })()
      +'<div class="ic-brand">'+item.brand+'</div>'
      +(()=>{
      const cols=Array.isArray(item.colors)&&item.colors.length?item.colors:(item.color?item.color.split(/\s+i\s+|,\s*/).map(c=>c.trim()).filter(Boolean):[item.color||'']);
      return '<div class="ic-name">'+item.name+'</div>'
        +'<div style="display:flex;flex-wrap:wrap;gap:3px;margin-bottom:0.4rem">'+cols.map(c=>colorPill(c)).join('')+'</div>';
    })()
      +'<div class="ic-pills"><span class="pill pill-cat">'+(CAT_LABELS[item.category]||item.category)+'</span>'+(item.type?'<span class="pill pill-type">'+item.type+'</span>':'')+seasons+formalPills+needsPill+retiredPill+'</div>'
      +'<div class="ic-stats"><div class="ic-stat"><div class="ic-stat-val">'+item.wears+'</div><div class="ic-stat-lbl">Usos</div></div><div class="ic-stat"><div class="ic-stat-val">'+(item.totalCost>0?item.totalCost.toFixed(0)+'\u20ac':'\u2014')+'</div><div class="ic-stat-lbl">Cost total</div></div><div class="ic-stat"><div class="ic-stat-val">'+cpwStr+'</div><div class="ic-stat-lbl">CPU</div></div></div>'
      +'</div>';
  }).join('');

  grid.querySelectorAll('.item-card').forEach(card=>{
    card.addEventListener('click', e=>{
      if(wrdSelectMode){
        const id=card.dataset.id, cb=card.querySelector('.select-checkbox');
        if(wrdSelected.has(id)){wrdSelected.delete(id);card.classList.remove('selected-card');if(cb)cb.checked=false;}
        else{wrdSelected.add(id);card.classList.add('selected-card');if(cb)cb.checked=true;}
        const db2=document.getElementById('wrd-delete-selected');
        if(db2) db2.style.display=wrdSelected.size>0?'inline-flex':'none';
        return;
      }
      openItemModal(card.dataset.id);
    });
  });
  buildPaginator('wardrobe-pag',items.length,wrdPage,WRD_PER,p=>{wrdPage=p;renderWardrobe();});
}

function buildWardrobeChips(){
  const catEl=document.getElementById('cat-chips');
  catEl.innerHTML='';
  const allBtn=document.createElement('button'); allBtn.className='chip on'; allBtn.textContent='Totes';
  allBtn.addEventListener('click',()=>toggleCatChip('',allBtn)); catEl.appendChild(allBtn);
  Object.entries(CAT_LABELS).forEach(([k,v])=>{
    const btn=document.createElement('button'); btn.className='chip'; btn.textContent=v;
    btn.addEventListener('click',()=>toggleCatChip(k,btn)); catEl.appendChild(btn);
  });
}

function buildTypeChips(cat){
  const typeEl=document.getElementById('type-chips');
  if(!cat||!TYPES_BY_CAT[cat]){typeEl.style.display='none';wrdActiveFilters.type='';return;}
  typeEl.innerHTML='<span style="font-size:12px;color:var(--text3);margin-right:0.25rem;align-self:center">Tipus:</span>';
  const allBtn=document.createElement('button'); allBtn.className='chip on'; allBtn.textContent='Tots';
  allBtn.addEventListener('click',()=>{typeEl.querySelectorAll('.chip').forEach(c=>c.classList.remove('on'));allBtn.classList.add('on');wrdActiveFilters.type='';wrdPage=1;renderWardrobe();});
  typeEl.appendChild(allBtn);
  TYPES_BY_CAT[cat].forEach(t=>{
    const btn=document.createElement('button'); btn.className='chip'; btn.textContent=t;
    btn.addEventListener('click',()=>{typeEl.querySelectorAll('.chip').forEach(c=>c.classList.remove('on'));btn.classList.add('on');wrdActiveFilters.type=t;wrdPage=1;renderWardrobe();});
    typeEl.appendChild(btn);
  });
  typeEl.style.display='flex';
}

function toggleCatChip(cat,btn){
  document.querySelectorAll('#cat-chips .chip').forEach(c=>c.classList.remove('on'));
  btn.classList.add('on'); wrdActiveFilters.cat=cat; wrdActiveFilters.type='';
  buildTypeChips(cat); wrdPage=1; renderWardrobe();
}
function filterChip(type){if(type==='needs_info'){wrdActiveFilters.needsInfo=true;wrdPage=1;renderWardrobe();}}

// ── Brands view ──
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
    const avgCPW = b.cpwN>0?(b.cpwSum/b.cpwN).toFixed(2)+'\u20ac':'\u2014';
    return '<div class="brand-card" onclick="filterByBrand(\''+esc(b.name)+'\')">'
      +'<div class="brand-name">'+esc(b.name)+'</div>'
      +'<div class="brand-stats">'
      +'<div class="brand-stat"><div class="brand-stat-val">'+b.items+'</div><div class="brand-stat-lbl">Peces</div></div>'
      +'<div class="brand-stat"><div class="brand-stat-val">'+b.wears+'</div><div class="brand-stat-lbl">Usos</div></div>'
      +'<div class="brand-stat"><div class="brand-stat-val">'+(b.cost>0?b.cost.toFixed(0)+'\u20ac':'\u2014')+'</div><div class="brand-stat-lbl">Inversi\u00f3</div></div>'
      +'<div class="brand-stat"><div class="brand-stat-val">'+avgCPW+'</div><div class="brand-stat-lbl">CPU mitj\u00e0</div></div>'
      +'</div></div>';
  }).join('');
}

function filterByBrand(brand){
  // Navigate to wardrobe filtered by this brand
  showView('wardrobe', document.querySelector('.nav-btn[data-view="wardrobe"]'));
  setTimeout(()=>{
    renderWardrobe().then(()=>{
      // Check the brand checkbox
      const panel = document.getElementById('fp-brand');
      if(panel){
        panel.querySelectorAll('input[type=checkbox]').forEach(cb=>{
          if(cb.value===brand){cb.checked=true; wrdActiveFilters.brands=[brand]; updateBadge('brands'); wrdPage=1; renderWardrobe();}
        });
      }
    });
  }, 100);
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
      const [y,m,d] = el.dataset.date.split('-').map(Number);
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
//  CALENDAR
// ══════════════════════════════════════════
//  CALENDAR
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
const MONTHS_CA = ['Gener','Febrer','Mar\u00e7','Abril','Maig','Juny','Juliol','Agost','Setembre','Octubre','Novembre','Desembre'];

function initCalendarSelectors(){
  const mSel = document.getElementById('cal-month-sel');
  const ySel = document.getElementById('cal-year-sel');
  if(!mSel||!ySel) return;
  if(mSel.options.length) return; // already built
  MONTHS_CA.forEach((m,i) => {
    const o = document.createElement('option');
    o.value = i; o.textContent = m;
    mSel.appendChild(o);
  });
  for(let y = 2014; y <= new Date().getFullYear()+1; y++){
    const o = document.createElement('option');
    o.value = y; o.textContent = y;
    ySel.appendChild(o);
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
  // Sync selectors
  const mSel = document.getElementById('cal-month-sel');
  const ySel = document.getElementById('cal-year-sel');
  if(mSel) mSel.value = calMonth;
  if(ySel) ySel.value = calYear;

  const allWears = await dbGetAll('wears');
  const allItems = await dbGetAll('items');
  const itemMap = {};
  allItems.forEach(it => itemMap[it.id] = it);

  // Build dateMap for this month
  const dateMap = {}; // date -> [wear entries]
  allWears.forEach(w => {
    const [y,m] = w.date.split('-').map(Number);
    if(y === calYear && m-1 === calMonth){
      if(!dateMap[w.date]) dateMap[w.date] = [];
      dateMap[w.date].push(w);
    }
  });

  // Month stats — CPU mensual = mitjana de les CPU diàries
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

    // CPU for day
    let dayCPW = 0, dayCPWN = 0;
    dayWears.forEach(w => {
      const it = itemMap[w.itemId];
      if(it && it.wears > 0){ dayCPW += it.cpw; dayCPWN++; }
    });
    const cpwStr = dayCPWN > 0 ? dayCPW.toFixed(2) + '\u20ac' : '';

    // Color dots by category
    const cats = [...new Set(dayWears.map(w => itemMap[w.itemId]?.category).filter(Boolean))];
    const dots = cats.map(cat =>
      '<span class="cal-dot" style="background:' + (CAT_DOT[cat]||'#999') + '"></span>'
    ).join('');

    // Piece labels (up to 2)
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

  // Attach click events
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

  // Group by outfitId
  const groups = {};
  dayWears.forEach(w => {
    const gid = w.outfitId || ('leg-' + dateStr);
    if(!groups[gid]) groups[gid] = {label: w.outfitLabel||'', pieces:[]};
    groups[gid].pieces.push(w);
  });

  // Check if this exact outfit combo has been worn before
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
      const cpw = it.wears > 0 ? it.cpw.toFixed(2) + '\u20ac' : '\u2014';
      if(it.wears > 0){ cpwTotal += it.cpw; cpwN++; }
      return '<div class="outfit-piece-row" data-itemid="' + it.id + '">'
        + '<span class="outfit-cat-dot" style="background:' + (CAT_DOT[it.category]||'#999') + '"></span>'
        + '<span class="outfit-piece-name"><strong>' + it.brand + '</strong> ' + it.name + ' <span style="color:var(--text3)">' + it.color + '</span></span>'
        + '<span class="outfit-piece-cpw">' + cpw + '/\u00fas</span>'
        + '</div>';
    }).join('');
    const labelHTML = g.label ? '<div class="outfit-section-label">' + g.label + '</div>' : '';
    const totalHTML = cpwN > 0 ? '<div class="outfit-total-cpw">CPU total: ' + cpwTotal.toFixed(2) + '\u20ac</div>' : '';
    const delBtn = '<button class="btn btn-danger btn-sm" style="margin-top:0.5rem;font-size:11px" data-deloutfit="' + gid + '" data-deldate="' + dateStr + '">Eliminar conjunt</button>';
    outfitsHTML += '<div class="outfit-section">' + labelHTML + piecesHTML + totalHTML + delBtn + '</div>';
  });

  const lastWornHTML = matchingDays.length > 0
    ? '<div style="font-size:12px;color:var(--text3);margin-top:0.75rem">'
      + 'Aquest conjunt exacte tamb\u00e9 portat: '
      + matchingDays.slice(0,5).map(d => '<span class="wh-chip" data-date="' + d + '">' + formatDate(d) + '</span>').join(' ')
      + (matchingDays.length > 5 ? ' <span style="color:var(--text3)">+' + (matchingDays.length-5) + ' cops m\u00e9s</span>' : '')
      + '</div>'
    : '';

  modal.innerHTML = '<div class="day-modal-header">'
    + '<div>'
    + '<div class="day-modal-date">' + formatDate(dateStr) + '</div>'
    + '<div class="day-modal-sub">' + dayWears.length + ' pe\u00e7' + (dayWears.length!==1?'es':'a') + ' registrades</div>'
    + '</div>'
    + '<button class="modal-close" onclick="closeItemModal()">\u00d7</button>'
    + '</div>'
    + outfitsHTML
    + lastWornHTML;

  document.getElementById('item-modal').classList.add('open');

  // Attach piece click -> open item modal
  modal.querySelectorAll('.outfit-piece-row[data-itemid]').forEach(el => {
    el.addEventListener('click', () => { closeItemModal(); setTimeout(()=>openItemModal(el.dataset.itemid),150); });
  });
  // Attach date chips -> navigate to that day
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
  // Delete outfit buttons in day modal
  modal.querySelectorAll('[data-deloutfit]').forEach(btn => {
    btn.addEventListener('click', async () => {
      if(!confirm('Eliminar aquest conjunt registrat?')) return;
      await deleteOutfit(btn.dataset.deloutfit, btn.dataset.deldate);
      closeItemModal();
      renderCalendar();
    });
  });
}

// ══════════════════════════════════════════
//  FAVOURITES
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
    +'<div class="ic-name">'+item.name+' \u00b7 '+item.color+'</div>'
    +'<div class="ic-pills"><span class="pill pill-cat">'+(CAT_LABELS[item.category]||item.category)+'</span>'+(item.type?'<span class="pill pill-type">'+item.type+'</span>':'')+'</div>'
    +'<div class="ic-stats">'
    +'<div class="ic-stat"><div class="ic-stat-val">'+item.wears+'</div><div class="ic-stat-lbl">Usos</div></div>'
    +'<div class="ic-stat"><div class="ic-stat-val">'+(item.totalCost>0?item.totalCost.toFixed(0)+'\u20ac':'\u2014')+'</div><div class="ic-stat-lbl">Cost total</div></div>'
    +'<div class="ic-stat"><div class="ic-stat-val">'+(item.wears>0?item.cpw.toFixed(2)+'\u20ac':'\u2014')+'</div><div class="ic-stat-lbl">CPU</div></div>'
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
    const names = o.pieces.map(p=>{const it=iMap[p.itemId]; return it?it.brand+' '+it.name:p.text;}).join(' \u00b7 ');
    return '<div class="day-card" style="margin-bottom:0.75rem">'
      +'<div class="day-card-top"><div style="flex:1">'
      +'<div style="font-weight:600;font-size:14px;margin-bottom:0.25rem">\u2605 '+esc(o.name)+'</div>'
      +'<div class="day-card-pieces">'+names+'</div>'
      +'<div class="day-card-cpw">'+(o.wears||0)+' cops \u00b7 '+(o.lastWorn?formatDate(o.lastWorn):'\u2014')+'</div>'
      +'</div>'
      +'<button class="btn btn-primary btn-sm" style="font-size:11px" data-wearfav="'+o.id+'">Registrar avui</button>'
      +'</div></div>';
  }).join('');
  grid.querySelectorAll('[data-wearfav]').forEach(btn =>
    btn.addEventListener('click', () => wearSavedOutfit(btn.dataset.wearfav))
  );
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

function toggleMS(chip, containerId){
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
//  LOG — REGISTRE DE DIA
// ════════════════════════════════════════

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
    + '<div style="font-size:12px;color:var(--text3);padding:2px 0 6px">Cap pe\u00e7a seleccionada</div>'
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
    container.innerHTML = '<div style="font-size:12px;color:var(--text3);padding:2px 0 6px">Cap pe\u00e7a seleccionada</div>';
    return;
  }
  let html = '';
  pieces.forEach((p, i) => {
    const ghostClass = p.ghost ? ' ghost' : '';
    const ghostHint = p.ghost
      ? '<div class="ghost-hint">&#9888; Pe\u00e7a nova &mdash; recorda actualitzar l&#39;armari</div>'
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

  // Use data attributes to avoid all quoting issues in onclick
  let html = matches.map((it, mi) => {
    const cpwStr = it.wears > 0 ? it.cpw.toFixed(2) + '\u20ac/\u00fas' : '\u2014';
    return '<div class="ac-item" data-action="pick" data-cat="' + catKey + '" data-idx="' + idx + '" data-id="' + it.id + '" data-text="' + esc(it.brand + ' ' + it.name) + '">'
      + '<div><span class="ac-main">' + esc(it.brand) + ' ' + esc(it.name) + '</span>'
      + ' <span class="ac-sub">' + esc(it.color) + '</span></div>'
      + '<span class="ac-sub">' + it.wears + ' usos &middot; ' + cpwStr + '</span>'
      + '</div>';
  }).join('');

  html += '<div class="ac-ghost-item" data-action="ghost" data-cat="' + catKey + '" data-idx="' + idx + '" data-text="' + esc(val) + '">'
    + '+ Afegir &ldquo;' + esc(val) + '&rdquo; com a pe\u00e7a nova'
    + '</div>';

  drop.innerHTML = html;
  drop.style.display = 'block';
  acHiIdx = -1;

  // Attach events via JS, not inline onclick
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
  if(el) el.textContent = count > 0 ? 'CPU del conjunt: ' + total.toFixed(2) + '\u20ac' : '';
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

  let html = '<div style="font-size:12px;text-transform:uppercase;letter-spacing:0.08em;color:var(--text3);margin-bottom:0.5rem;font-weight:500">Registrat &mdash; ' + formatDate(date) + '</div>';
  Object.entries(groups).forEach(([gid, g]) => {
    const names = g.pieces.map(w => {
      const it = iMap[w.itemId];
      return it ? it.brand + ' ' + it.name : (w.freeText || '?');
    }).join(' &middot; ');

    let cpwTotal = 0, cpwN = 0;
    g.pieces.forEach(w => {
      const it = iMap[w.itemId];
      if(it && it.wears > 0){ cpwTotal += it.cpw; cpwN++; }
    });
    const cpwStr = cpwN > 0 ? 'CPU: ' + cpwTotal.toFixed(2) + '\u20ac' : '';
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
  // Attach delete buttons via JS
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
  if(!allPieces.length){ toast('Afegeix almenys una pea'); return; }

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
  toast('Conjunt registrat \u2014 ' + allPieces.length + ' pe\u00e7a' + (allPieces.length!==1?'ces':'\u00e7a') + ' \u2713');
  clearLogForm();
  await loadDayHistory();
  renderDashboard();
  if(ghosts > 0) setTimeout(() => toast('\u26a0 ' + ghosts + ' pe\u00e7a nova \u2014 actualitza la informaci\u00f3 a l\u0027armari'), 2800);
}


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


// ════════════════════════════════════════
// ════════════════════════════════════════
//  OUTFITS — historial + creador
// ════════════════════════════════════════
let outfitBuilderPieces = {};
let historyOutfitsCache = [];
let historyIMap = {};
let historySort = 'count';
let smartSelectedItem = null;

// ── Init ──
async function initOutfitsView(){
  const allWears = await dbGetAll('wears');
  const allItems = await dbGetAll('items');
  const iMap = {};
  allItems.forEach(it => iMap[it.id] = it);

  // Store iMap globally BEFORE any render that uses it
  historyIMap = iMap;

  // Build history outfits from wear records
  historyOutfitsCache = buildHistoryOutfits(allWears, iMap);

  // Init builder
  outfitBuilderPieces = {};
  LOG_CATS.forEach(c => { outfitBuilderPieces[c.key] = []; });
  renderOutfitBuilder(allItems);

  // Render columns
  renderHistoryOutfits();
  await renderOutfitsList();
  renderSmartSelector(allItems, iMap);
}

// ── COLUMN A: History outfits ──

function buildHistoryOutfits(allWears, iMap){
  // Group wears by date+outfitId to get day outfits
  const dayGroups = {};
  allWears.forEach(w => {
    const key = w.outfitId || ('day-' + w.date);
    if(!dayGroups[key]) dayGroups[key] = {date: w.date, items: []};
    if(w.itemId && iMap[w.itemId]) dayGroups[key].items.push(w.itemId);
  });

  // Extract nucleus (DALT+BAIX or SENCER) per day
  const nucleusMap = {}; // nucleusKey -> {dates, variants}
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
    } else return; // no nucleus

    if(!nucleusMap[nucleusKey]){
      nucleusMap[nucleusKey] = {
        nucleusKey,
        daltIds: dalts,
        baixIds: baixos,
        sencerIds: sencers,
        dates: [],
        variants: {}  // variantKey -> {items, count, dates}
      };
    }
    nucleusMap[nucleusKey].dates.push(day.date);

    // Full variant (all items sorted)
    const varKey = day.items.slice().sort().join('|');
    if(!nucleusMap[nucleusKey].variants[varKey]){
      nucleusMap[nucleusKey].variants[varKey] = {items: day.items, count: 0, dates: []};
    }
    nucleusMap[nucleusKey].variants[varKey].count++;
    nucleusMap[nucleusKey].variants[varKey].dates.push(day.date);
  });

  return Object.values(nucleusMap).map(n => {
    // Compute CPW sum for nucleus
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

  // Filter by smart selector
  if(smartSelectedItem){
    outfits = outfits.filter(o =>
      o.daltIds.includes(smartSelectedItem.itemId) ||
      o.baixIds.includes(smartSelectedItem.itemId) ||
      o.sencerIds.includes(smartSelectedItem.itemId) ||
      Object.values(o.variants).some(v => v.items.includes(smartSelectedItem.itemId))
    );
  }

  // Sort
  if(historySort === 'count') outfits.sort((a,b) => b.count - a.count);
  else outfits.sort((a,b) => b.cpwTotal - a.cpwTotal);

  if(!outfits.length){
    container.innerHTML = '<div style="font-size:13px;color:var(--text3);padding:1rem 0">'
      + (smartSelectedItem ? 'Cap outfit trobat amb aquesta pe\u00e7a.' : 'Cap historial encara. Registra el teu primer dia!') + '</div>';
    return;
  }

  container.innerHTML = outfits.slice(0,50).map((o, oi) => {
    // Already loaded items from closure — use global cache
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
      : [daltNames, baixNames].filter(Boolean).join(' \u00b7 ');

    const cpwStr = o.cpwTotal > 0 ? o.cpwTotal.toFixed(2) + '\u20ac' : '\u2014';
    const lastStr = o.lastWorn ? formatDate(o.lastWorn) : '\u2014';

    // Variants
    const variants = Object.values(o.variants).sort((a,b) => b.count - a.count);
    const varHTML = variants.map(v => {
      const extras = v.items.filter(id => !o.daltIds.includes(id) && !o.baixIds.includes(id) && !o.sencerIds.includes(id));
      const extraNames = extras.map(id => {
        const it = historyIMap[id];
        return it ? it.brand + ' ' + it.name : id;
      }).join(', ');
      return '<div class="hoc-variant">'
        + '<div class="hoc-variant-name">' + (extraNames || 'Sense accessoris extra') + '</div>'
        + '<div class="hoc-variant-stat">' + v.count + '\u00d7 \u00b7 ' + formatDate(v.dates[v.dates.length-1]) + '</div>'
        + '</div>';
    }).join('');

    return '<div class="hoc" id="hoc-' + oi + '">'
      + '<div class="hoc-header" data-hocidx="' + oi + '">'
      + '<div class="hoc-names">' + nucleusStr + '</div>'
      + '<div class="hoc-meta"><div class="hoc-count">' + o.count + '</div><div class="hoc-count-lbl">cops</div></div>'
      + '<span class="hoc-arrow">\u203a</span>'
      + '</div>'
      + '<div class="hoc-body">'
      + '<div style="padding:0.6rem 1rem;font-size:11px;color:var(--text3);display:flex;gap:1rem">'
      + '<span>CPU nucli: ' + cpwStr + '</span><span>\u00daltim: ' + lastStr + '</span>'
      + '</div>'
      + varHTML
      + '<div class="hoc-actions">'
      + '<button class="btn btn-secondary btn-sm" style="font-size:11px" data-nameoutfit="' + oi + '">Posar nom</button>'
      + '</div>'
      + '</div>'
      + '</div>';
  }).join('');

  // Attach toggle events
  container.querySelectorAll('.hoc-header').forEach(el => {
    el.addEventListener('click', () => {
      const hoc = document.getElementById('hoc-' + el.dataset.hocidx);
      hoc.classList.toggle('open');
    });
  });

  // Name outfit
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
      toast('Outfit "' + name + '" guardat \u2713');
      await renderOutfitsList();
    });
  });
}

// ── Smart selector ──
function renderSmartSelector(allItems, iMap){
  // Store iMap on cache for use in renderHistoryOutfits
  historyIMap = iMap;

  const wrap = document.getElementById('smart-selector-wrap');
  if(!wrap) return;

  // Step 1: pick any item
  const sel1 = document.createElement('select');
  sel1.className = 'ss-select';
  sel1.innerHTML = '<option value="">— Tria una pe\u00e7a —</option>';

  // Group by category
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
    + '<div id="obrows-' + cat.key + '"><div style="font-size:12px;color:var(--text3);padding:2px 0 4px">Cap pe\u00e7a</div></div>'
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
    container.innerHTML = '<div style="font-size:12px;color:var(--text3);padding:2px 0 4px">Cap pe\u00e7a</div>';
    return;
  }
  let html = '';
  pieces.forEach((p, i) => {
    html += '<div class="log-piece-row" data-obcat="' + catKey + '" data-obidx="' + i + '">'
      + '<div class="ac-wrap">'
      + '<input class="log-piece-input" id="obinput-' + catKey + '-' + i + '" type="text"'
      + ' placeholder="Busca una pe\u00e7a\u2026" value="' + esc(p.text) + '" autocomplete="off">'
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
    if(rows) rows.innerHTML = '<div style="font-size:12px;color:var(--text3);padding:2px 0 4px">Cap pe\u00e7a</div>';
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
  if(!pieces.length){ toast('Afegeix almenys una pe\u00e7a'); return; }

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
  toast('Outfit guardat \u2713');
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
    + '<div style="flex:1"><div style="font-weight:600;font-size:13px">' + (o.favourite?'\u2605 ':'') + esc(o.name) + '</div>'
    + '<div class="day-card-cpw">' + (o.wears||0) + ' cops \u00b7 ' + (o.lastWorn?formatDate(o.lastWorn):'\u2014') + '</div></div>'
    + '<div style="display:flex;gap:0.35rem;flex-wrap:wrap">'
    + '<button class="btn btn-primary btn-sm" style="font-size:11px" data-wearoutfit="' + o.id + '">Registrar</button>'
    + '<button class="chip ' + (o.favourite?'accent-on':'') + '" style="font-size:11px;padding:0.3rem 0.6rem" data-favoutfit="' + o.id + '">' + (o.favourite?'\u2605':'\u2606') + '</button>'
    + '<button class="btn btn-danger btn-sm" style="font-size:11px" data-deloutfit="' + o.id + '">\u00d7</button>'
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
  toast('Outfit registrat avui \u2713');
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
      + '<span class="footer-stat-val">' + totalCost.toFixed(0) + '&euro;</span> invertits en total';
  }
}

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
