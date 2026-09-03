# M3: Store accounts, roles, and auditability Implementation Plan

**Goal:** Support real shop operations with controlled access and accountable actions.

**Architecture:** Extend Prisma models with a `Store` relationship to support multiple shops in the future, and add `role` to users. Add server-side authorization middleware (RBAC). Replace hard deletes on transactions with voids.

**Tech Stack:** Prisma, Express middleware, React UI.

---

### Task 1: Add Store Model and User Roles

**Objective:** Add `Store` model to schema and migrate existing data. Introduce `role` (owner, manager, cashier) on `User`.

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/...`

**Step 1: Update Schema**
```prisma
model Store {
  id         String   @id @default(uuid())
  name       String
  created_at DateTime @default(now())

  users        User[]
  transactions Transaction[]
  products     Product[]
}

model User {
  // existing...
  role       String   @default("cashier") // owner, manager, cashier
  store_id   String?
  store      Store?   @relation(fields: [store_id], references: [id])
}

// Add store_id to Product and Transaction too, to sandbox data.
```
*(Wait, this is an offline-first POS for warung, maybe we just do `role` first and defer `Store` multi-tenancy until necessary, as requested by "Add Store ownership to business data". Let's stick to the simplest Store structure).*

**Step 2: Generate Migration**
```bash
npx prisma migrate dev --name add_store_and_roles
```

---

### Task 2: Implement RBAC Middleware

**Objective:** Create server-side middleware to restrict endpoints by role.

**Files:**
- Modify: `src/middlewares/authMiddleware.ts`

**Step 1: Create Role Check**
```typescript
export const authorizeRole = (allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden: insufficient permissions" });
    }
    next();
  };
};
```

---

### Task 3: Transaction Void Workflow

**Objective:** Prevent hard-deletes on `Transaction`; introduce soft-delete (`status = "void"`) with a reason.

**Files:**
- Modify: `server.ts`
- Modify: `prisma/schema.prisma`

**Step 1: Add void fields to Schema**
Add `status String @default("completed")`, `void_reason String?`, and `voided_by String?` to `Transaction`.

**Step 2: Update Delete Endpoint**
Change `app.delete("/api/transactions/:id")` to `app.post("/api/transactions/:id/void")`. Restrict to `owner` or `manager`. Put stock back when voided.

---

### Task 4: User Management UI

**Objective:** Build a simple UI to list, invite, and change roles.

**Files:**
- Create: `src/pages/Users.tsx`
- Modify: `src/components/Layout.tsx` (Add nav item)

**Step 1: API Endpoint**
Add `GET /api/users` and `POST /api/users` in `server.ts` protected by `owner` role.

**Step 2: React Page**
A simple table showing users and their roles.

---

**Next Steps:** Proceed task by task.
