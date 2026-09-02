# M2: Offline-first PWA POS Implementation Plan

**Goal:** Allow a cashier to sell during an unreliable internet connection without silently losing data.

**Architecture:** Use `vite-plugin-pwa` to generate a service worker for caching the app shell. Store offline checkout intents in IndexedDB via the `idb` library. Introduce an `idempotency_key` on the server to prevent double processing when connectivity resumes. Create an Offline Sync UI component to manage pending and failed intents.

**Tech Stack:** React, Vite, vite-plugin-pwa, idb, Express.

---

### Task 1: Setup PWA and Service Worker

**Objective:** Configure Vite to generate a PWA manifest and service worker.

**Files:**
- Modify: `vite.config.ts`
- Modify: `index.html`

**Step 1: Update Vite Config**
Add `VitePWA` plugin to cache static assets and register the service worker auto-update.

**Step 2: Update HTML head**
Add `<meta name="theme-color">` and link to icons. (We will use placeholder icons for now if real ones don't exist).

---

### Task 2: Server-Side Idempotency Handling

**Objective:** Ensure the backend ignores duplicate checkout requests using an idempotency key.

**Files:**
- Modify: `prisma/schema.prisma`
- Modify: `server.ts`

**Step 1: Update Schema**
Add `idempotency_key` (String, unique, optional) to the `Transaction` model.

**Step 2: Update POST /api/transactions**
Expect `idempotency_key` in the request body. Before processing, check if a transaction with that key already exists. If it does, return 200 with the existing transaction ID.

---

### Task 3: IndexedDB Offline Queue Setup

**Objective:** Create a local database wrapper to store failed checkout intents.

**Files:**
- Create: `src/utils/offlineQueue.ts`

**Step 1: Write IndexedDB Wrapper**
Use `idb` to create a `warung-pos-db` with an `outbox` store. Functions needed: `addToOutbox`, `getOutboxItems`, `removeFromOutbox`.

---

### Task 4: Frontend Offline Checkout Logic

**Objective:** Modify the POS page to save to the outbox when a network error occurs.

**Files:**
- Modify: `src/pages/POS.tsx`

**Step 1: Update POS Checkout**
Generate a UUID for the `idempotency_key` *before* the fetch call.
If the fetch fails (TypeError: Failed to fetch), save the intent (cart items, total, key, timestamp) to the IndexedDB outbox and notify the user it will sync later.

---

### Task 5: Background Sync and Conflict UI

**Objective:** Build a UI to show pending transactions and sync them when back online.

**Files:**
- Create: `src/components/SyncManager.tsx`
- Modify: `src/App.tsx` (to include SyncManager globally)

**Step 1: Build SyncManager**
A component that polls `navigator.onLine` and `getOutboxItems()`. When online, it attempts to POST pending intents to `/api/transactions`.
- If 200/201: Remove from outbox.
- If 400 (e.g., insufficient stock): Move to a "failed/conflict" state requiring user intervention.

**Step 2: Add Visual Indicator**
Show a small cloud icon in the nav bar indicating "Online", "Offline (N pending)", or "Sync Error".

---

**Next Steps:** Proceed task by task, committing sequentially.
