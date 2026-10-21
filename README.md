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

The Vite development server proxies `/api` requests to `http://localhost:3000` (the API's default port). The safe seed command inserts any missing records from the deterministic set of 10,000 representative employees in batches and skips seed emails already present. To deliberately replace the entire employee table with those seed records, run `npm run db:reset-seed`; this command truncates the table first and deletes existing employee data.

## Useful commands

- `npm run db:generate` — generate the Prisma client.
- `npm run db:migrate` — apply checked-in Prisma migrations.
- `npm run db:seed` — add any missing seed employees.
- `npm run db:reset-seed` — **destructively** replace all employee rows with the 10,000 seed employees.
- `npm test` — run API input-validation tests.
- From `client`: `npm run build` and `npm run lint`.

The first release intentionally has no authentication or role checks. Do not expose the API or salary data to an untrusted network. Currency is derived from the supported countries in `server/src/config/countries.js`; insights are grouped by country so salary statistics are never combined across currencies.

## AI-assisted development

- **Used for:** Reviewing the project against the assessment requirements and identifying the seed script's destructive rerun behavior.
- **Applied to:** Making the regular seed command safe to rerun and adding an explicit reset command with corresponding tests.
- **Reviewed by:** Checking the changes against the existing employee generator, Prisma schema, and seed command.
- **Verification:** Tests were added for the safe default and explicit reset behavior. The test suite has not yet been run; run it before submission.
