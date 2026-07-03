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
SESSION_SECRET=""
```

Generate a strong local session secret and place it only in your ignored `.env` file:

```bash
openssl rand -base64 48
```

`SESSION_SECRET` is required for local development and production. The app rejects missing, empty, placeholder, and short values. For production, configure a newly generated `SESSION_SECRET` in the deployment environment and use a production-ready database if needed.

## Docker

```bash
docker compose up --build
```

The app will be available at `http://localhost:3000`.

Docker Compose requires `SESSION_SECRET` from the shell or deployment environment:

```bash
SESSION_SECRET="$(openssl rand -base64 48)" docker compose up --build
```

## Deployment notes

For Vercel or another host, configure these environment variables in the hosting dashboard:

- `DATABASE_URL`
- `SESSION_SECRET`

SQLite is fine for local testing. For a real public deployment, use a hosted database such as PostgreSQL and adjust the Prisma datasource accordingly.

### Session secret rotation

The former hardcoded Docker session secret must be considered compromised. Every deployment needs a newly generated `SESSION_SECRET`.

Changing `SESSION_SECRET` invalidates existing stateless sessions because session cookies are HMAC-signed with that secret. Users must log in again after rotation.

## Changes applied

See [`FIXES_APPLIED.md`](./FIXES_APPLIED.md) for the fixes and cleanup already applied to this uploaded project.
