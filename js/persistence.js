'use strict';

const DB_NAME = 'roba_db';
const DB_VER = 3;
let dbInstance;

export async function openDatabase() {
  if (dbInstance) return dbInstance;
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VER);
    request.onupgradeneeded = event => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('items')) {
        const store = db.createObjectStore('items', { keyPath: 'id' });
        store.createIndex('category', 'category', { unique: false });
        store.createIndex('brand', 'brand', { unique: false });
        store.createIndex('needsInfo', 'needsInfo', { unique: false });
      }
      if (!db.objectStoreNames.contains('wears')) {
        const store = db.createObjectStore('wears', { keyPath: 'id', autoIncrement: true });
        store.createIndex('date', 'date', { unique: false });
        store.createIndex('itemId', 'itemId', { unique: false });
      }
      if (!db.objectStoreNames.contains('meta')) {
        db.createObjectStore('meta', { keyPath: 'key' });
      }
      if (!db.objectStoreNames.contains('outfits')) {
        db.createObjectStore('outfits', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('trash')) {
        const store = db.createObjectStore('trash', { keyPath: 'id' });
        store.createIndex('deletedAt', 'deletedAt', { unique: false });
      }
    };
    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function getDatabase() {
  return dbInstance || openDatabase();
}

function getTransaction(storeName, mode = 'readonly') {
  return getDatabase().then(db => db.transaction(storeName, mode));
}

export async function dbGet(store, key) {
  const db = await getDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readonly');
    const req = tx.objectStore(store).get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function dbPut(store, value) {
  const db = await getDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite');
    const req = tx.objectStore(store).put(value);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function dbAdd(store, value) {
  const db = await getDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite');
    const req = tx.objectStore(store).add(value);
    req.onsuccess = () => resolve(req.result);
    req.onerror = e => reject(e.target.error);
  });
}

export async function dbDelete(store, key) {
  const db = await getDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite');
    tx.objectStore(store).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = e => reject(e.target.error);
  });
}

export async function dbGetAll(store) {
  const db = await getDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readonly');
    const req = tx.objectStore(store).getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function dbGetIndex(store, indexName, query) {
  const db = await getDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readonly');
    const req = tx.objectStore(store).index(indexName).getAll(query);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function migrateColorsToArrays(items) {
  const data = items || await dbGetAll('items');
  for (const item of data) {
    if (Array.isArray(item.colors)) continue;
    const colorStr = item.color || '';
    const parts = colorStr.split(/\s+i\s+|,\s*/).map(c => c.trim()).filter(Boolean);
    item.colors = parts.length ? parts : (colorStr ? [colorStr] : []);
    await dbPut('items', item);
  }
  return true;
}
