# My Tasks

A single-user to-do application built from the supplied requirements, with a **Spring Boot backend**, a Next.js frontend, and PostgreSQL persistence.

## Features

- Create, edit and permanently delete tasks with confirmation.
- Optional descriptions, date-only deadlines and subtasks.
- Low, Medium and High priorities.
- Today, Upcoming, All Tasks and Completed tabs.
- Search titles and descriptions; filter by priority within each tab.
- Immediate completion styling with rollback when saving fails.
- Independent subtask completion; completing subtasks never completes their parent.
- In-app overdue notices and background cleanup.
- Responsive layout, keyboard tab navigation and accessible Radix dialogs.

No accounts, categories, projects or other out-of-scope features are included.

## Stack and layout

- Java 21+, Spring Boot, Spring Web, Spring Data JPA, Jakarta Bean Validation.
- PostgreSQL for development, production and automated integration tests; Flyway SQL migrations.
- Next.js App Router, strict TypeScript, React, Tailwind CSS, shadcn-style Radix components, Lucide icons and Zod.
- JUnit/MockMvc for backend tests; Vitest for frontend business rules.

```text
src/main/java/com/example/todo/    Spring Boot API and scheduled cleanup
src/main/resources/db/migration/  Flyway migrations
src/test/                        Backend tests
compose.yaml                     Local PostgreSQL
```

The frontend lives in the repository's `frontend` directory. Its `src/app`, `src/components` and `src/lib` directories contain the Next.js application.

The Java backend replaces the document's suggested Prisma persistence and JavaScript server operations. Zod validates frontend forms; Jakarta Bean Validation validates all API mutations. Flyway replaces Prisma migrations.

## Prerequisites

- Java 21 or newer (the project targets Java 21).
- Node.js 22 LTS or newer supported LTS release, with npm.
- Docker Desktop for local PostgreSQL, or an existing PostgreSQL database.

Maven is included through the Maven Wrapper; a global Maven installation is unnecessary.

## Start locally

From the repository root:

```powershell
docker compose up -d db
.\mvnw.cmd spring-boot:run
```

In a second terminal:

```powershell
cd frontend
npm ci
npm run dev
```

Open **http://127.0.0.1:3000**. Spring Boot listens on **http://127.0.0.1:8080**. On macOS/Linux, use `./mvnw` instead of `.\mvnw.cmd`.

PostgreSQL is required locally. The supplied `compose.yaml` starts the development database and persists it in the `todo_data` Docker volume. Spring Boot reads its connection from `src/main/resources/application.properties`.

## Environment configuration

The root `.env.example` documents backend variables. **Spring Boot does not automatically read `.env` files.** Set variables in your shell, IDE run configuration or hosting environment. Docker Compose reads a root `.env` for its own variables.

```powershell
$env:DATABASE_URL = 'jdbc:postgresql://localhost:5432/todo'
$env:DATABASE_USERNAME = 'todo'
$env:DATABASE_PASSWORD = 'your-password'
.\mvnw.cmd spring-boot:run
```

The defaults in `compose.yaml` and Spring Boot match for local development. Set the same password in both when changing it.

| Variable | Default | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | `jdbc:postgresql://localhost:5432/todo` | PostgreSQL JDBC URL |
| `DATABASE_USERNAME` | `todo` | Database username |
| `DATABASE_PASSWORD` | `todo` | Local development password; replace when deploying |
| `DATABASE_MAX_POOL_SIZE` | `5` | Maximum database connections used by this service |
| `APP_API_KEY` | empty | Shared server-to-server key; required on Render |
| `PORT` | `8080` | Backend port |

In the `frontend` folder, copy `.env.example` to `.env.local` to override `BACKEND_URL`. `BACKEND_URL` and `BACKEND_API_KEY` are server-only variables. The API key must match the backend's `APP_API_KEY`. Browser requests use the Next.js same-origin API proxy, so neither value is exposed to browser JavaScript and no CORS configuration is needed.

## Database migrations

Flyway applies `src/main/resources/db/migration/V1__create_tasks.sql` at startup. Hibernate validates the schema and never silently modifies it. Add later migrations as `V2__description.sql`, `V3__description.sql`, etc.; do not edit a migration after deploying it.

The schema uses UUIDs, a SQL `DATE` for due dates, UTC instants for timestamps and a foreign key with `ON DELETE CASCADE` for subtasks. Task and subtask updates happen in one transaction.

## Timezones and automatic deletion

**Deletion is permanent, including all subtasks.**

- An incomplete task is valid for its entire due date in the browser's timezone.
- A task due September 28 becomes overdue September 29 at 00:00.
- It remains available September 29 and September 30.
- Its deletion deadline is October 1 at 00:00, using calendar days even across daylight-saving transitions.
- Completed tasks expire exactly 30 elapsed days after `completedAt`, regardless of due date.
- Undated active tasks do not expire.
- Rescheduling an overdue task changes its deadline.

The browser sends its IANA timezone on each task fetch. Because V1 is single-user, the last browser timezone is saved in `app_settings` and used by the scheduler while the app is closed. Opening the app in another timezone updates that preference. A deployment starts with UTC until the first browser fetch.

Spring's scheduled job runs every minute. Expired tasks are removed on the next run, normally within one minute of the deadline. Fetching tasks also removes expired records. After downtime, the next startup/scheduled run catches up. Keep one backend instance running continuously for cleanup while the browser is closed. The cleanup component is excluded automatically under the `test` profile.

The interface refreshes every minute while visible and when the window regains focus. Overdue notices use a stable banner, can be dismissed for the current set of overdue tasks, and do not repeatedly toast. All Tasks means active tasks only; completed records appear in Completed after refresh.

## API

| Method | Path | Behavior |
| --- | --- | --- |
| GET | `/api/tasks` | Fetch tasks; `X-Timezone` persists the browser timezone |
| POST | `/api/tasks` | Create task and subtasks |
| PUT | `/api/tasks/{id}` | Replace editable fields and reconcile subtasks |
| PATCH | `/api/tasks/{id}/completion` | Set `{ "completed": true/false }` |
| PATCH | `/api/tasks/{id}/subtasks/{subtaskId}/completion` | Set independent subtask completion |
| DELETE | `/api/tasks/{id}` | Permanently delete parent and subtasks |

When `APP_API_KEY` is configured, every `/api/*` request must send the same value in the `X-API-Key` header. The Next.js proxy adds this header using its server-only `BACKEND_API_KEY`. `/actuator/health` remains public for platform health checks and does not expose health details.

Task input:

```json
{
  "title": "Finish assignment",
  "description": "Review questions 1–5",
  "dueDate": "2026-09-28",
  "priority": "MEDIUM",
  "subtasks": [{ "title": "Review question 1", "completed": false }]
}
```

Description and due date may be null. Send an empty array for no subtasks. When editing, include existing subtask IDs to preserve their identity; omit an ID for a new subtask and omit a subtask from the array to remove it. IDs belonging to another task and duplicate IDs are rejected. Parent completion does not alter subtask states.

## Verification

```powershell
.\mvnw.cmd test
cd frontend
npm test
npm run typecheck
npm run build
```

Backend integration tests use Testcontainers to start an isolated PostgreSQL 17 container, apply the real Flyway migration and discard the database after the test run. Docker Desktop must be running for `mvn test`. Tests cover CRUD, server validation, subtask identity and independence, completion idempotency, cascading deletion, persisted timezones, scheduled cleanup, 30-day and two-overdue-day boundaries, daylight-saving changes, local dates, tab membership, search, filtering and sorting.

## Production deployment

1. Create a Render PostgreSQL database and backend web service in the same region.
2. Choose the Docker runtime, use the repository-root `Dockerfile`, and leave Docker Command empty. Set the health check path to `/actuator/health`.
3. Configure `DATABASE_URL` as a JDBC URL based on Render's internal database host, plus `DATABASE_USERNAME` and `DATABASE_PASSWORD`. Render supplies `PORT` automatically.
4. Generate a random `APP_API_KEY` of at least 32 characters in Render. The service intentionally refuses to start on Render without a strong key.
5. Deploy the `frontend` folder as the Vercel project root at [hng-todo-app-lemon.vercel.app](https://hng-todo-app-lemon.vercel.app/). Set `BACKEND_URL` to the Render HTTPS URL and set `BACKEND_API_KEY` to the exact value used for `APP_API_KEY`.
6. Enable Vercel Deployment Protection or another access-control layer if the tasks must be private. The shared API key authenticates the Next.js server to the backend; it does not authenticate individual visitors.
7. For a free Render web service, the scheduled GitHub Actions workflow calls the Vercel `/api/health` route every ten minutes. That status-only route uses the server-side `BACKEND_URL` to keep Render awake. Read requests also wait longer and retry once if Render is waking up; mutations are never retried automatically.

Spring Boot runs separately from the Vercel frontend. Flyway migrations run when the backend starts, and cleanup uses Spring scheduling rather than Vercel Cron. The public Render health endpoint reports only status; application data endpoints require the server-to-server key.
