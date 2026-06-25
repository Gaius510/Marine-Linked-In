# Fixes applied

- Fixed the SQLite database path in `.env` so Prisma can find the included `db/custom.db` after extracting the project locally.
- Added an explicit `SESSION_SECRET` entry in `.env` so the auth session secret is configurable.
- Made production start work with standard Node.js instead of requiring Bun.
- Added `prisma generate` to the build script so the Prisma client is generated before building.
- Removed `ignoreBuildErrors: true` from `next.config.ts` so production builds no longer hide TypeScript errors.
- Reduced Prisma logging noise from query logging to warning/error logging in development and errors in production.
- Fixed the recruiter/admin `minYears` filter: it previously compared experience years as strings, which gives wrong results such as `10` being treated as smaller than `2`. It now filters numerically.

## Recommended local commands

```bash
npm install
npm run db:generate
npm run lint
npm run build
npm run dev
```

Demo accounts from the project worklog:

- `admin@maritimenet.com` / `admin123`
- `sarah@maersk-recruit.com` / `recruiter123`
- `seafarer1@maritimenet.com` / `seafarer123`
