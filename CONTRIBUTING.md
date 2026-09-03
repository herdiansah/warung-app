# Contributing to Warung App

Thank you for helping improve a practical open-source POS and inventory tool for small merchants.

## Before you start

1. Check existing issues and open a discussion/issue for changes that affect product behavior.
2. Fork the repository and create a focused branch from `main`.
3. Do not commit `.env` files, credentials, customer data, or generated database files.

## Local setup

```bash
npm ci
cp .env.example .env
# Set DATABASE_URL and a JWT_SECRET of at least 32 characters in .env
npx prisma migrate dev
ADMIN_EMAIL=owner@example.com ADMIN_PASSWORD='replace-with-a-unique-12-plus-character-password' npx prisma db seed
npm run dev
```

## Quality checks

Run these before opening a pull request:

```bash
npm test
npm run lint
npm run build
```

Add or update tests for behavior changes, especially checkout, stock movement, authentication, and reports. Keep pull requests focused and explain user-facing effects.

## Commit and pull request guidance

Use clear conventional commit messages, for example `fix: reject invalid checkout quantities`. Include a short summary, test evidence, and migration notes when database schema changes.

## Code of conduct

By participating, you agree to follow the Code of Conduct in `CODE_OF_CONDUCT.md`.
