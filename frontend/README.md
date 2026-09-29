# My Tasks — frontend

This directory contains the Next.js frontend. The Spring Boot backend lives at the repository root.

## Run

Start PostgreSQL and the backend from the repository root:

```powershell
docker compose up -d db
.\mvnw.cmd spring-boot:run
```

Then run in this folder's VS Code terminal:

```powershell
npm ci
npm run dev
```

Open http://127.0.0.1:3000. The server-side Next.js API proxy connects to Spring Boot at http://127.0.0.1:8080. Copy `.env.example` to `.env.local` if you need to change `BACKEND_URL`.

## Checks

```powershell
npm test
npm run typecheck
npm run build
```

Uses Next.js, strict TypeScript, React, Tailwind, Radix/shadcn-style UI primitives, Lucide and Zod. No global state library is required. See the backend README for database setup, API contracts, deployment and automatic deletion rules.

Deploy this directory as the Vercel project root and configure `BACKEND_URL` to the separately hosted Spring Boot server. There is no application authentication in V1; use deployment-level access restrictions for private tasks.
