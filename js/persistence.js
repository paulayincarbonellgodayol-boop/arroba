'use strict';

// ══════════════════════════════════════════
//  DB — IndexedDB wrapper
// ══════════════════════════════════════════
const DB_NAME = 'roba_db_demo';
const DB_VER  = 1;
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
