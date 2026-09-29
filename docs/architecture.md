# Spring Boot adaptation

The supplied SRD is preserved in `requirements-original.md`. The user's explicit backend choice takes precedence over its Prisma and Next.js server-operation examples.

The Spring Boot backend lives at the repository root, and the Next.js application lives in `frontend`. They are versioned together while remaining independently deployable.

| SRD suggestion | Implementation |
| --- | --- |
| Unspecified backend | Spring Boot REST API, Java 21 |
| Prisma database models | JPA entities and Flyway SQL migrations |
| Zod server validation | Jakarta Bean Validation on backend; Zod on frontend |
| Next.js server database operations | Same-origin Next.js proxy to Spring Boot |
| Vercel Cron or scheduled server process | Spring `@Scheduled`, every minute |
| Due date represented as timestamp | SQL DATE / Java LocalDate / ISO date string |
| Vercel application deployment | Next.js on Vercel; Spring Boot on a separate Java host |

Data flows from browser forms through Zod, the Next.js proxy and validated Spring REST DTOs into transactional JPA operations. The server returns DTOs, never ORM entities. Optional subtasks are created/edited/removed atomically with their parent; completion also has a dedicated endpoint.

Search, tab membership, priority filters and sorting operate on the fetched task collection, appropriate to the specified small, single-user application. The database remains the source of truth. Optimistic completion updates roll back on network errors; refreshes cannot overwrite in-flight mutations.

Timezone preference is stored globally because V1 has one user. The most recently fetched browser timezone applies to background cleanup. Due-date deletion is the start of `dueDate + 3 calendar days` in that zone. Completion retention is `completedAt + 30 elapsed days`. This is explicitly tested across daylight-saving changes.

The app intentionally has no authentication. Local services bind to loopback by default; an externally hosted copy needs deployment-level access restrictions if it contains private data.
