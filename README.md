# ACME People

Salary management and people analytics for ACME. The app uses a React/Vite client, a layered Express API, Prisma, and PostgreSQL.

## Requirements

- Node.js 20.19+ or 22.12+
- PostgreSQL 14+

## Local setup

1. Create a PostgreSQL database named `salary_management`.
2. Copy `server/.env.example` to `server/.env` and set `DATABASE_URL` to the local database connection string. Set `PORT` or `CLIENT_ORIGIN` only if your local setup differs from the defaults.
3. Install dependencies, apply the schema migration, and load seed employees:

   ```powershell
   Set-Location server
   npm install
   npm run db:generate
   npm run db:migrate
   npm run db:seed
   npm run dev
   ```

4. In a second terminal, install and start the web client:

   ```powershell
   Set-Location client
   npm install
   npm run dev
   ```

The Vite development server proxies `/api` requests to `http://localhost:3000` (the API's default port). The seed command inserts 10,000 representative employee records in batches and skips duplicate seed emails on subsequent runs.

## Useful commands

- `npm run db:generate` — generate the Prisma client.
- `npm run db:migrate` — apply checked-in Prisma migrations.
- `npm run db:seed` — add any missing seed employees.
- `npm test` — run API input-validation tests.
- From `client`: `npm run build` and `npm run lint`.

The first release intentionally has no authentication or role checks. Do not expose the API or salary data to an untrusted network. Currency is derived from the supported countries in `server/src/config/countries.js`; insights are grouped by country so salary statistics are never combined across currencies.
