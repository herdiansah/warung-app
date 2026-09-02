# Warung App

Warung App is an open-source sales, inventory, and profit-recording application for Indonesian micro-retail businesses (“warung”) and neighborhood shops. It is designed to make daily shop operations approachable without accounting expertise.

## Current features

- Dashboard for daily sales, transaction count, best-selling products, and low-stock alerts.
- Product management with pricing, stock, categories, search, and soft deletion for sold products.
- Point-of-sale checkout with server-side pricing and stock validation.
- Stock adjustments and an auditable stock-movement history.
- Monthly sales reports with revenue, transaction totals, gross profit, and best-selling products.
- JWT-protected API endpoints and bcrypt password hashes.

## Status

This is an actively maintained MVP. It requires MySQL and is not yet offline-first; PWA/offline synchronization, multi-user roles, exports, automated database backups, and a daily report endpoint remain planned work. See the GitHub issues and project documentation for details.

## Tech stack

- Frontend: React 19, Vite, Tailwind CSS, React Router.
- Backend: Node.js, Express, TypeScript.
- Data: MySQL and Prisma ORM.

## Quick start

Prerequisites: Node.js 22+, MySQL 8+, and npm.

```bash
git clone https://github.com/herdiansah/warung-app.git
cd warung-app
npm ci
cp .env.example .env
```

Edit `.env` with a MySQL connection string and a unique `JWT_SECRET` that is at least 32 characters. The server defaults to `127.0.0.1:3000`; place it behind a reverse proxy when public access is needed.

Apply migrations, create the first owner account, and start development mode:

```bash
npx prisma migrate dev
ADMIN_EMAIL=owner@example.com ADMIN_PASSWORD='use-a-unique-12-plus-character-password' npm run prisma -- db seed
npm run dev
```

The development server runs at `http://127.0.0.1:3000`.

## Quality checks

```bash
npm test
npm run lint
npm run build
```

## Security

- Never commit `.env`, database dumps, customer data, or credentials.
- Initial owner credentials are provided only when running the seed command; the application does not create a default account.
- Read [SECURITY.md](SECURITY.md) for vulnerability reporting and deployment guidance.

## Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md) before opening an issue or pull request. Community participation is governed by [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

## License

Warung App is released under the [MIT License](LICENSE).
