# Repository guide

## Structure

- The repository root contains the Java 21 Spring Boot API.
- `src/main/java/com/example/todo/` contains API, service, persistence, and cleanup logic.
- `src/main/resources/db/migration/` contains Flyway database migrations.
- `src/test/` contains backend tests.
- `frontend/` contains the Next.js App Router application.
- `frontend/src/components/` contains UI components, and `frontend/src/lib/` contains shared task rules, types, validation, and API helpers.

## Working rules

- Prefer readable code, clear names, small functions, and simple control flow.
- Reuse existing task logic instead of duplicating business rules.
- Keep frontend and backend API types and validation aligned.
- Add a new Flyway migration for schema changes; do not edit an applied migration.
- Keep secrets and local environment files out of Git.
- Do not commit or push unless the user asks.

## Verification

- Backend: `.\mvnw.cmd test`
- Frontend: run `npm test`, `npm run typecheck`, and `npm run build` from `frontend/`.
