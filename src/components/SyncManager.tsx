import { useEffect, useState } from 'react';
import { Cloud, CloudOff, RefreshCw } from 'lucide-react';
import { getPendingOutboxItems, markOutboxItemSynced, markOutboxItemFailed, clearSyncedOutboxItems } from '../utils/offlineQueue';

export function SyncManager() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const checkQueue = async () => {
      const items = await getPendingOutboxItems();
      setPendingCount(items.length);
    };

    const handleOnline = () => {
      setIsOnline(true);
      syncOutbox();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Check queue periodically (every 10s) and on mount
    checkQueue();
    const interval = setInterval(checkQueue, 10000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  const syncOutbox = async () => {
    if (!navigator.onLine || isSyncing) return;
    setIsSyncing(true);

    try {
      const pendingItems = await getPendingOutboxItems();
      if (pendingItems.length === 0) return;

      const token = localStorage.getItem("warung_token");
      if (!token) return; // Need login to sync

      for (const item of pendingItems) {
        try {
          const res = await fetch('/api/transactions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              idempotency_key: item.idempotency_key,
              items: item.items
            })
          });

          if (res.ok) {
            await markOutboxItemSynced(item.idempotency_key);
          } else {
            const data = await res.json();
            // Stop syncing this item but keep it to show conflict
            await markOutboxItemFailed(item.idempotency_key, data.error || 'Sync failed');
          }
        } catch (err) {
          // Network error during sync, will retry later
          break;
        }
      }

      await clearSyncedOutboxItems();
      const remaining = await getPendingOutboxItems();
      setPendingCount(remaining.length);
    } finally {
      setIsSyncing(false);
    }
  };

  if (!isOnline) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
        <CloudOff size={16} />
        <span>Offline {pendingCount > 0 && `(${pendingCount} antrean)`}</span>
      </div>
    );
  }

  if (pendingCount > 0) {
    return (
      <button 
        onClick={syncOutbox}
        disabled={isSyncing}
        className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-800 hover:bg-blue-200 rounded-full text-sm font-medium transition-colors"
      >
        <RefreshCw size={16} className={isSyncing ? "animate-spin" : ""} />
        <span>Sync {pendingCount} antrean</span>
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-800 rounded-full text-sm font-medium">
      <Cloud size={16} />
      <span>Online</span>
    </div>
  );
}
