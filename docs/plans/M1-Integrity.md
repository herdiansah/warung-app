# M1: Transaction and Inventory Integrity Implementation Plan

**Goal:** Ensure checkout, stock, and financial records remain correct under valid and invalid requests.

**Architecture:** Add full testing suite (Vitest + Supertest) for the Express API. Enhance the Prisma data model to include `actor`, `reason`, and `reference_id` in `StockLog`. Introduce robust transactional boundaries for checkout, handling concurrent stock decrements properly without overselling. Expose daily reporting explicitly timezone-aware.

**Tech Stack:** Express, Prisma, Vitest, Supertest, date-fns-tz.

---

### Task 1: Setup API Testing Infrastructure

**Objective:** Install supertest and setup a test database environment wrapper.

**Files:**
- Create: `tests/api/setup.ts`
- Modify: `package.json`

**Step 1: Install dependencies**
```bash
npm install -D supertest @types/supertest testcontainers
```

**Step 2: Add API test wrapper**
Create `tests/api/setup.ts`:
```typescript
// Minimal placeholder, we will use the actual server config
import request from 'supertest';
import app from '../../server.js'; // Ensure app is exported from server.ts

export const api = request(app);
```

**Step 3: Export app from server.ts**
In `server.ts`, at the bottom:
```typescript
// Export for testing
export default app;
```
*(Make sure `app.listen` is conditional if `import.meta.url === ...` or similar, to avoid port conflicts in tests. We'll refine this in the actual task execution).*

---

### Task 2: Implement Input Validation & Schema Enforcement

**Objective:** Enforce structured validation on all POST/PUT endpoints using Zod (or similar lightweight native validation).

**Files:**
- Modify: `server.ts`

**Step 1: Add structured error handling**
Create middleware or helper functions for input validation (e.g. Products, Login) returning 400 with consistent structure.

---

### Task 3: Concurrency-Safe Stock Decrement

**Objective:** Prevent overselling during simultaneous checkouts using Prisma `$transaction` and conditional updates.

**Files:**
- Modify: `server.ts` (POST `/api/transactions`)

**Step 1: Write test for concurrent checkouts**
Write a test that fires 5 simultaneous checkouts for a product with stock = 3. Expect 3 success, 2 failures.

**Step 2: Update implementation**
Modify the Prisma transaction to explicitly check stock *inside* the transaction or use atomic decrement:
```typescript
await prisma.$transaction(async (tx) => {
  // Lock or atomic check
  const product = await tx.product.updateMany({
    where: { id: item.product_id, stock: { gte: item.qty } },
    data: { stock: { decrement: item.qty } }
  });
  if (product.count === 0) throw new Error("Insufficient stock");
  // ... create TransactionItem
})
```

---

### Task 4: Immutable Stock Audit Trail

**Objective:** Expand `StockLog` to include `actor`, `reason`, and `reference_id`.

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/...`

**Step 1: Update Schema**
```prisma
model StockLog {
  // ... existing
  actor         String?
  reason        String?
  reference_id  String?
}
```

**Step 2: Generate Migration**
```bash
npx prisma migrate dev --name add_stock_log_audit_fields
```

---

### Task 5: Timezone-Aware Daily & Monthly Reporting

**Objective:** Add `/api/reports/daily?date=YYYY-MM-DD` and ensure timezone is explicitly `Asia/Jakarta`.

**Files:**
- Modify: `server.ts`

**Step 1: Implement Daily Report Endpoint**
Filter transactions bounded by 00:00:00 to 23:59:59 in `Asia/Jakarta`.

---

**Next Steps:** Proceed task by task.
