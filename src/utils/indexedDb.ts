import * as Interfaces from "../interfaces";

const DB_NAME = "inventory_manager_db";
const STORE_NAME = "catalog_store";
const DB_VERSION = 1;

let db: IDBDatabase;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };

    request.onsuccess = (event) => {
      db = (event.target as IDBOpenDBRequest).result;
      resolve(db);
    };

    request.onerror = (event) => {
      reject("Error opening IndexedDB: " + (event.target as IDBOpenDBRequest).error);
    };
  });
}

export async function getCatalogFromIndexedDB(): Promise<Interfaces.IProducto[] | null> {
  if (!db) {
    db = await openDB();
  }
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get("catalog"); // Assuming catalog is stored with key 'catalog'

    request.onsuccess = () => {
      resolve(request.result ? request.result.data : null);
    };

    request.onerror = (event) => {
      reject("Error getting catalog from IndexedDB: " + (event.target as IDBRequest).error);
    };
  });
}

export async function saveCatalogToIndexedDB(catalog: Interfaces.IProducto[]): Promise<void> {
  if (!db) {
    db = await openDB();
  }
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put({ id: "catalog", data: catalog });

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = (event) => {
      reject("Error saving catalog to IndexedDB: " + (event.target as IDBRequest).error);
    };
  });
}
