# MyInstaller

A production-ready, self-hosted web platform for **OS deployment and provisioning automation** targeting VPS, cloud instances, and dedicated servers that you **legally own or are explicitly authorized to manage**.

![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?logo=tailwindcss)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql)
![Redis](https://img.shields.io/badge/Redis-7-DC382D?logo=redis)

---

## Important Legal Notice

> **MyInstaller is designed exclusively for authorized system administration.**
>
> - You must **own** or have **explicit written authorization** to manage any target server.
> - This tool does **not** support pirated software, unauthorized access, or any illegal activities.
> - All deployment jobs require explicit legal acknowledgement before execution.
> - The platform includes simulation/dry-run mode for safe testing.

---

## Features

- **Deployment Profiles** — Pre-configured templates for common server setups (LAMP, LEMP, Docker, monitoring, etc.)
- **Job Queue System** — BullMQ-powered async deployment pipeline with retry logic and real-time logging
- **Bootstrap Generator** — Generate shell scripts or cloud-init configs for manual deployment
- **Multi-Step Job Wizard** — Guided deployment creation with target validation and legal acknowledgements
- **Simulation Mode** — Full dry-run capability that simulates deployments without touching target servers
- **Access Key System** — Invite-based registration with redeemable access codes
- **Admin Panel** — Complete administrative dashboard for users, profiles, jobs, settings, and audit logs
- **Dark/Light Theme** — System-aware theme with manual toggle
- **Audit Logging** — Comprehensive activity tracking for compliance and security
- **AES-256-GCM Encryption** — All credentials encrypted at rest, never stored in plaintext

---

## Tech Stack

| Layer        | Technology                              |
| ------------ | --------------------------------------- |
| Framework    | Next.js 15 (App Router)                 |
| Language     | TypeScript 5                            |
| Styling      | Tailwind CSS + shadcn/ui components     |
| Database     | PostgreSQL 16 via Prisma ORM            |
| Queue        | BullMQ + Redis 7                        |
| Auth         | Custom session-based (bcryptjs)         |
| Encryption   | AES-256-GCM (Node.js crypto)            |
| Validation   | Zod                                     |
| Logging      | Pino (structured)                       |
| Icons        | Lucide React                            |
| Container    | Docker + Docker Compose                 |

---

## Project Structure

```
├── .devcontainer/          # Dev container configuration
├── prisma/
│   ├── schema.prisma       # Database schema (12 models, 6 enums)
│   └── seed.ts             # Seed script with demo data
├── src/
│   ├── app/
│   │   ├── (admin)/        # Admin panel routes
│   │   ├── (auth)/         # Login & register pages
│   │   ├── (dashboard)/    # User dashboard routes
│   │   ├── (marketing)/    # Public marketing pages
│   │   ├── api/            # API route handlers
│   │   ├── globals.css     # Tailwind + theme variables
│   │   └── layout.tsx      # Root layout
│   ├── components/
│   │   ├── shared/         # Reusable app components
│   │   └── ui/             # shadcn/ui primitives
│   ├── lib/
│   │   ├── auth/           # Auth system + session helpers
│   │   ├── crypto/         # Encryption utilities
│   │   ├── env/            # Environment validation
│   │   ├── logger/         # Pino logger
│   │   └── utils/          # General utilities
│   ├── server/
│   │   ├── audit/          # Audit logging service
│   │   ├── db/             # Prisma client singleton
│   │   ├── deploy/         # Deployment engine + adapters
│   │   ├── queue/          # BullMQ queue setup
│   │   ├── services/       # Business logic services
│   │   └── validators/     # Zod validation schemas
│   └── worker/             # BullMQ worker process
├── docker-compose.yml      # Production Docker Compose
├── docker-compose.dev.yml  # Development Docker Compose
├── Dockerfile              # Multi-stage production build
└── package.json
```

---

## Getting Started

### Prerequisites

- **Node.js** 20+
- **PostgreSQL** 16+
- **Redis** 7+
- **npm** 10+

### Quick Start (Local Development)

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/Myinstaller.git
cd Myinstaller

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env with your database URL, Redis URL, and secrets

# 4. Generate Prisma client
npm run db:generate

# 5. Push schema to database
npm run db:push

# 6. Seed the database with demo data
npm run db:seed

# 7. Start the development server
npm run dev

# 8. (Optional) Start the worker process in a separate terminal
npm run dev:worker
```

The app will be available at **http://localhost:3000**

### Demo Credentials

After seeding, these accounts are available:

| Email                    | Password    | Role  |
| ------------------------ | ----------- | ----- |
| admin@myinstaller.local  | Admin123!   | Admin |
| jane@example.com         | User1234!   | User  |
| bob@example.com          | User1234!   | User  |

### Docker Compose (Production)

```bash
# Start all services (app, worker, PostgreSQL, Redis)
docker compose up -d

# Run database migrations
docker compose exec app npx prisma db push

# Seed the database
docker compose exec app npx tsx prisma/seed.ts
```

### GitHub Codespaces

This project includes a `.devcontainer` configuration for GitHub Codespaces:

1. Open the repo in GitHub
2. Click **Code** → **Codespaces** → **Create codespace**
3. The container will auto-install dependencies and set up the database
4. Run `npm run dev` to start

---

## Key Pages

### Public (Marketing)
- `/` — Landing page with features and how-it-works
- `/about` — Project overview and principles
- `/pricing` — Deployment tiers (self-hosted)
- `/docs` — Comprehensive documentation
- `/terms` — Terms of Service
- `/contact` — Contact information and form

### Authentication
- `/login` — User login with rate limiting
- `/register` — User registration

### Dashboard (Authenticated)
- `/dashboard` — Overview with stats and recent jobs
- `/dashboard/jobs` — List and filter deployment jobs
- `/dashboard/jobs/new` — Multi-step job creation wizard
- `/dashboard/jobs/[id]` — Job detail with real-time logs
- `/dashboard/profiles` — Browse deployment profiles
- `/dashboard/bootstrap` — Generate bootstrap scripts
- `/dashboard/settings` — Account settings and access key redemption

### Admin (Admin Role Required)
- `/admin` — Admin dashboard with system stats
- `/admin/users` — User management (promote/demote/disable)
- `/admin/access-keys` — Create and manage access keys
- `/admin/profiles` — CRUD deployment profiles
- `/admin/jobs` — View all system jobs
- `/admin/settings` — System configuration
- `/admin/audit` — Audit log viewer

---

## API Routes

| Method | Route                       | Description                |
| ------ | --------------------------- | -------------------------- |
| POST   | `/api/auth/register`        | Register new user          |
| POST   | `/api/auth/login`           | Login and get session      |
| POST   | `/api/auth/logout`          | Logout and clear session   |
| GET    | `/api/auth/me`              | Get current user           |
| GET    | `/api/profiles`             | List deployment profiles   |
| POST   | `/api/profiles`             | Create profile (admin)     |
| GET    | `/api/profiles/[id]`        | Get profile detail         |
| PUT    | `/api/profiles/[id]`        | Update profile (admin)     |
| DELETE | `/api/profiles/[id]`        | Delete profile (admin)     |
| GET    | `/api/jobs`                 | List jobs                  |
| POST   | `/api/jobs`                 | Create deployment job      |
| GET    | `/api/jobs/[id]`            | Get job detail             |
| GET    | `/api/jobs/[id]/logs`       | Get job logs               |
| POST   | `/api/jobs/[id]/cancel`     | Cancel job                 |
| POST   | `/api/jobs/[id]/retry`      | Retry failed job           |
| GET    | `/api/jobs/stats`           | Get job statistics         |
| POST   | `/api/bootstrap`            | Generate bootstrap script  |
| GET    | `/api/access-keys`          | List access keys (admin)   |
| POST   | `/api/access-keys`          | Create access key (admin)  |
| POST   | `/api/access-keys/redeem`   | Redeem access key          |
| GET    | `/api/admin/dashboard`      | Admin stats                |
| GET    | `/api/admin/users`          | List all users (admin)     |
| PUT    | `/api/admin/users/[id]`     | Update user (admin)        |
| GET    | `/api/admin/settings`       | Get system settings        |
| PUT    | `/api/admin/settings`       | Update setting (admin)     |
| GET    | `/api/admin/audit`          | Get audit log (admin)      |
| GET    | `/api/health`               | Health check endpoint      |

---

## Deployment Engine

The deployment engine uses an **adapter pattern** with three adapters:

1. **SimulationAdapter** — Simulates a full deployment lifecycle with realistic timings (default for dry-run mode)
2. **GenericSSHAdapter** — Connects to targets via SSH for real deployments
3. **CloudInitAdapter** — Renders cloud-init templates for cloud provider integration

### Script Renderer

Generates deployment scripts in multiple formats:
- Shell scripts (bash)
- Cloud-init YAML configs
- Bootstrap one-liners
- Security hardening scripts
- Dry-run verification scripts

---

## Security

- **Session-based authentication** with HTTP-only cookies (7-day expiry)
- **Rate limiting** on login attempts (5 attempts, 15-minute lockout)
- **AES-256-GCM encryption** for all stored credentials
- **Bcrypt password hashing** (12 rounds)
- **Audit logging** for all significant actions
- **Role-based access control** (User / Admin)
- **Input validation** with Zod schemas on all endpoints
- **Sensitive field redaction** in structured logs

---

## Environment Variables

| Variable               | Description                    | Required |
| ---------------------- | ------------------------------ | -------- |
| `DATABASE_URL`         | PostgreSQL connection string   | Yes      |
| `REDIS_URL`            | Redis connection string        | Yes      |
| `AUTH_SECRET`          | Session signing secret         | Yes      |
| `ENCRYPTION_KEY`       | 64-char hex AES-256 key        | Yes      |
| `NEXT_PUBLIC_APP_NAME` | Application display name       | No       |
| `NEXT_PUBLIC_APP_URL`  | Public URL                     | No       |
| `LOG_LEVEL`            | Pino log level (debug/info)    | No       |
| `WORKER_CONCURRENCY`   | BullMQ worker concurrency      | No       |

---

## NPM Scripts

| Script          | Description                        |
| --------------- | ---------------------------------- |
| `npm run dev`   | Start dev server (Turbopack)       |
| `npm run build` | Production build                   |
| `npm start`     | Start production server            |
| `npm run lint`  | Run ESLint                         |
| `npm run db:generate` | Generate Prisma client        |
| `npm run db:push`     | Push schema to database       |
| `npm run db:migrate`  | Run database migrations       |
| `npm run db:seed`     | Seed database with demo data  |
| `npm run db:studio`   | Open Prisma Studio            |
| `npm run worker`      | Start BullMQ worker           |
| `npm run dev:worker`  | Start worker with hot-reload  |

---

## License

This project is for educational and authorized system administration purposes only. See [Terms of Service](/terms) for details.
