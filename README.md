# Task Vader

Task Vader is a task-count management system for the LOLC Holdings PLC operations team. It replaces weekly Excel submissions with a role-based web app where staff enter daily units completed, supervisors approve tasks and leave overrides, and dashboards summarize workload and productivity.

## Stack

- Backend: NestJS + Fastify
- Database: PostgreSQL with Prisma
- Cache: Redis-ready infrastructure
- Frontend: Next.js + Tailwind CSS
- API: REST
- Auth: JWT + role-based access control
- Deployment: Docker, Vercel-ready frontend, managed PostgreSQL-ready backend

## Key Rules Implemented

- Task duration is entered as minutes or seconds and always stored as seconds.
- Task complexity uses 1 to 5: very low, low, medium, high, very high.
- Any user can create a task, but the selected supervisor must approve it.
- Supervisors can approve their own submitted task.
- Supervisors/admins can create users and assign/remove approved tasks.
- Each task can have one permanent owner and up to five acting staff members.
- A permanent owner cannot also be an acting owner for the same task.
- Daily work logs are stored per user, task, and date, so multiple people can contribute to the same task on the same day without overwriting each other.
- Total time is stored as `completedUnits * timePerUnitSeconds`.
- Staff can edit records only within 10 days.
- Future work-log dates are blocked.
- Weekends and holidays do not count toward the 10-working-day missing-update warning.
- Approved leave requests act as day override flags.
- Supervisors can see all work logs; staff can only see their own.
- Everyone can see the top 3 performers from the previous week.
- Task detail pages show task-level average units over the last 30 active days, without exposing other staff members’ individual performance.

## Local Setup

1. Copy environment variables:

```bash
cp .env.example .env
```

2. Start PostgreSQL and Redis:

```bash
docker compose up -d
```

3. Install dependencies:

```bash
npm install
```

4. Generate Prisma client and migrate:

```bash
npm run prisma:generate
npm run prisma:migrate
```

5. Seed demo users:

```bash
npm run prisma:seed
```

6. Start both apps:

```bash
npm run dev
```

Frontend: `http://localhost:3000`

API: `http://localhost:4000/api`

Seed login:

- `supervisor@lolc.com`
- `TaskVader@123`

## Production Notes

- Use a managed PostgreSQL database and set `DATABASE_URL`.
- Use a managed Redis service and set `REDIS_URL`.
- Deploy `apps/web` to Vercel with `NEXT_PUBLIC_API_URL` pointing to the backend API.
- Deploy `apps/api` as a container or Node service.
- Replace `JWT_SECRET` with a long random secret before production use.
