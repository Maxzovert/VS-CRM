# Verience CRM

Production-ready Personal CRM for freelance web developers and agency owners.

## Stack

- **Next.js 15+** (App Router, Server Components, Server Actions)
- **PostgreSQL** (Neon)
- **Prisma ORM**
- **Tailwind CSS + shadcn/ui**
- **TanStack Table**, React Hook Form, Zod, Framer Motion
- **Resend** (email reminders)
- **Custom auth** (email + password, JWT session cookie)

## Getting Started

### 1. Clone and install

```bash
npm install
```

### 2. Environment variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Neon PostgreSQL connection string (use pooled URL for serverless) |
| `AUTH_SECRET` | Session signing secret (min 32 characters) |
| `RESEND_API_KEY` | Resend API key |
| `RESEND_FROM_EMAIL` | Verified sender address |
| `CRON_SECRET` | Bearer token for Vercel Cron |

Generate `AUTH_SECRET`:

```bash
openssl rand -base64 32
```

### 3. Database setup

```bash
npx prisma migrate dev --name init
npx prisma db seed
```

Demo credentials after seeding:

- **Email:** `demo@verience.dev`
- **Password:** `password123`

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Deployment

### Neon

1. Create a project at [neon.tech](https://neon.tech)
2. Copy the **pooled** connection string to `DATABASE_URL`
3. Run migrations: `npx prisma migrate deploy`

### Vercel

1. Connect your repository
2. Set all environment variables from `.env.example`
3. Build command (default works with `postinstall` hook): `prisma generate && next build`
4. Cron job runs daily at 08:00 UTC via `vercel.json`

### Resend

1. Verify your sending domain
2. Set `RESEND_FROM_EMAIL` to a verified address

## Features

- **Client management** — search, sort, filter, bulk actions, slide-over detail panel
- **Projects** — track scope, amounts, deadlines, status
- **Invoices & payments** — outstanding/overdue calculations, revenue metrics
- **Follow-ups** — list, kanban, and calendar views
- **Email reminders** — automated 7-day, 3-day, due date, and overdue reminders
- **Activity timeline** — audit log of all important actions
- **Dashboard** — today's follow-ups, upcoming payments, attention list, revenue snapshot

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run db:migrate` | Run migrations (dev) |
| `npm run db:deploy` | Deploy migrations (production) |
| `npm run db:seed` | Seed demo data |
| `npm run db:studio` | Open Prisma Studio |

## Project Structure

```
src/
├── app/
│   ├── (auth)/          # Login & register
│   ├── (dashboard)/     # Protected app routes
│   ├── actions/         # Server Actions
│   └── api/cron/        # Scheduled reminders
├── components/
│   ├── ui/              # shadcn/ui
│   ├── layout/          # Sidebar, header
│   ├── clients/         # Table, slide-over
│   ├── follow-ups/      # List, kanban, calendar
│   └── dashboard/       # Widgets
└── lib/
    ├── auth/            # Password + session
    ├── email/           # Resend integration
    └── validations/     # Zod schemas
```
