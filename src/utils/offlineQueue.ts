import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface POSDB extends DBSchema {
  outbox: {
    key: string;
    value: {
      idempotency_key: string;
      items: Array<{ product_id: string; qty: number }>;
      total_amount: number;
      created_at: number;
      status: 'pending' | 'failed' | 'synced';
      error_message?: string;
    };
    indexes: { 'by-status': string };
  };
}

let dbPromise: Promise<IDBPDatabase<POSDB>> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<POSDB>('warung-pos-db', 1, {
      upgrade(db) {
        const store = db.createObjectStore('outbox', {
          keyPath: 'idempotency_key',
        });
        store.createIndex('by-status', 'status');
      },
    });
  }
  return dbPromise;
}

export async function addCheckoutToOutbox(checkoutData: {
  idempotency_key: string;
  items: Array<{ product_id: string; qty: number }>;
  total_amount: number;
}) {
  const db = await getDB();
  await db.add('outbox', {
    ...checkoutData,
    created_at: Date.now(),
    status: 'pending'
  });
}

export async function getPendingOutboxItems() {
  const db = await getDB();
  return db.getAllFromIndex('outbox', 'by-status', 'pending');
}

export async function markOutboxItemSynced(idempotency_key: string) {
  const db = await getDB();
  const item = await db.get('outbox', idempotency_key);
  if (item) {
    item.status = 'synced';
    await db.put('outbox', item);
  }
}

export async function markOutboxItemFailed(idempotency_key: string, error: string) {
  const db = await getDB();
  const item = await db.get('outbox', idempotency_key);
  if (item) {
    item.status = 'failed';
    item.error_message = error;
    await db.put('outbox', item);
  }
}

export async function clearSyncedOutboxItems() {
  const db = await getDB();
  const synced = await db.getAllFromIndex('outbox', 'by-status', 'synced');
  const tx = db.transaction('outbox', 'readwrite');
  for (const item of synced) {
    tx.store.delete(item.idempotency_key);
  }
  await tx.done;
}
