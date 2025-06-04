import { openDB, DBSchema } from 'idb';
import { OfflineAction } from '../types/product';
import { v4 as uuidv4 } from 'uuid';

interface InventoryDB extends DBSchema {
  offlineActions: {
    key: string;
    value: OfflineAction;
    indexes: { 'by-synced': boolean };
  };
}

const DB_NAME = 'kyobo-inventory-db';
const DB_VERSION = 1;

export const initDB = async () => {
  return openDB<InventoryDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      const offlineStore = db.createObjectStore('offlineActions', {
        keyPath: 'id',
      });
      offlineStore.createIndex('by-synced', 'synced');
    },
  });
};

export const offlineService = {
  async queueInventoryAdjustment(
    productId: string,
    quantity: number,
    memo?: string,
  ): Promise<string> {
    const db = await initDB();
    const action: OfflineAction = {
      id: uuidv4(),
      type: 'ADJUST_INVENTORY',
      data: { productId, quantity, memo },
      timestamp: Date.now(),
      synced: false,
    };

    await db.add('offlineActions', action);
    return action.id;
  },

  async queueLocationMove(
    productId: string,
    toLocation: string,
  ): Promise<string> {
    const db = await initDB();
    const action: OfflineAction = {
      id: uuidv4(),
      type: 'MOVE_LOCATION',
      data: { productId, toLocation },
      timestamp: Date.now(),
      synced: false,
    };

    await db.add('offlineActions', action);
    return action.id;
  },

  async getPendingActions(): Promise<OfflineAction[]> {
    const db = await initDB();
    return db.getAllFromIndex('offlineActions', 'by-synced', false);
  },

  async markActionSynced(id: string): Promise<void> {
    const db = await initDB();
    const action = await db.get('offlineActions', id);
    if (action) {
      action.synced = true;
      await db.put('offlineActions', action);
    }
  },

  async clearSyncedActions(): Promise<void> {
    const db = await initDB();
    const syncedActions = await db.getAllFromIndex(
      'offlineActions',
      'by-synced',
      true,
    );

    const tx = db.transaction('offlineActions', 'readwrite');
    for (const action of syncedActions) {
      await tx.store.delete(action.id);
    }
    await tx.done;
  },
};
