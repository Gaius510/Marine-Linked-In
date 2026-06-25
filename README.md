# Marine LinkedIn

Marine LinkedIn is a Next.js application for a maritime professional network. It uses React, Tailwind CSS, shadcn/ui-style components and Prisma with SQLite for local development.

## Requirements

- Node.js 22 or newer
- npm

## Run locally

```bash
npm install
cp .env.example .env
npm run db:push
npm run db:seed
npm run dev
```

Open the app at:

```text
http://localhost:3000
```

## Demo accounts after seeding

```text
Admin:     admin@maritimenet.com / admin123
Recruiter: sarah@maersk-recruit.com / recruiter123
Seafarer:  seafarer1@maritimenet.com / seafarer123
```

## Useful commands

```bash
npm run dev          # start development server
npm run build        # generate Prisma client and build Next.js
npm run start        # start production server after build
npm run lint         # run ESLint
npm run db:push      # sync Prisma schema to SQLite database
npm run db:seed      # add demo data
npm run setup        # install dependencies, create DB schema and seed data
```

## Environment variables

Create `.env` from `.env.example`:

```env
DATABASE_URL="file:../db/custom.db"
SESSION_SECRET="replace-this-with-a-long-random-secret"
```

For production, replace `SESSION_SECRET` with a long random secret and use a production-ready database if needed.

## Docker

```bash
docker compose up --build
```

The app will be available at `http://localhost:3000`.

## Deployment notes

For Vercel or another host, configure these environment variables in the hosting dashboard:

- `DATABASE_URL`
- `SESSION_SECRET`

SQLite is fine for local testing. For a real public deployment, use a hosted database such as PostgreSQL and adjust the Prisma datasource accordingly.

## Changes applied

See [`FIXES_APPLIED.md`](./FIXES_APPLIED.md) for the fixes and cleanup already applied to this uploaded project.
