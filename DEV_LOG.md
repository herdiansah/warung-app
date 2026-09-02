# Development Log

## Rules
- Append a new entry using the template below every time a task is completed.
- Do not log sensitive data (passwords, tokens, database credentials).
- Keep entries concise and focused on technical changes and verifications.

---

### Template
```markdown
## [YYYY-MM-DD] TASK-[ID]: [Brief Description]
**Role:** [LD / FE / QA]
**Modules/Functions:** [e.g., Auth, Checkout]
**Files Touched:**
- `path/to/file1`
- `path/to/file2`
**Tests/Validation:** [How it was verified]
**Problems/Solutions:** [Any tricky bugs and how they were fixed]
**Follow-ups:** [Any minor technical debt left behind]
```

---

## [2026-09-02] TASK-M0: OSS Readiness & DB Setup
**Role:** LD / QA
**Modules/Functions:** Database config, Environment, Auth Security, CI
**Files Touched:**
- `prisma/seed.ts`
- `server.ts`
- `src/middlewares/authMiddleware.ts`
- `.env.example`
- `.github/workflows/ci.yml`
- `docs/MILESTONES.md`
**Tests/Validation:** 
- Verified `npx prisma migrate status` against TiDB Serverless.
- Verified manual local API tests (Auth, CRUD Product, Transaction checkout).
- E2E passed.
**Problems/Solutions:**
- **Problem:** TiDB Serverless requires TLS, but Prisma failed with standard URI params.
- **Solution:** Replaced MongoDB-style `?ssl={"rejectUnauthorized":true}` with Prisma MySQL-style `?sslaccept=accept_invalid_certs`.
- **Problem:** `Setting` table missing from `schema.prisma` causing seed to fail.
- **Solution:** Removed arbitrary `Setting` upsert from `seed.ts`.
**Follow-ups:** None. Proceeding to M1.
