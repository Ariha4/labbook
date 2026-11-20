# labbook

A web app for research labs to book shared equipment (microscopes, PCR machines,
centrifuges) without double-booking, and to log the experiment runs that happen
during each booking.

> **Status:** early development. This is the project scaffold; the database,
> equipment, bookings, auth and UI land in follow-up PRs (see the roadmap below).

## Stack

- [Next.js](https://nextjs.org/) (App Router) + TypeScript in strict mode
- [Vitest](https://vitest.dev/) for unit tests
- ESLint (Next.js core-web-vitals + TypeScript rules) and Prettier
- GitHub Actions CI: format check, lint, typecheck, tests and production build on
  every pull request

## Getting started

Requires Node.js 22 (see `.nvmrc`; 20.9+ works).

```bash
git clone https://github.com/Ariha4/labbook.git
cd labbook
npm install
npm run dev        # http://localhost:3000
```

## Scripts

| Command                | What it does                                  |
| ---------------------- | --------------------------------------------- |
| `npm run dev`          | Start the dev server                          |
| `npm run build`        | Production build                              |
| `npm run lint`         | ESLint, failing on any warning                |
| `npm run typecheck`    | `tsc --noEmit`                                |
| `npm test`             | Run unit tests once                           |
| `npm run test:watch`   | Run unit tests in watch mode                  |
| `npm run format`       | Format all files with Prettier                |
| `npm run format:check` | Check formatting without writing (used in CI) |

CI runs `format:check`, `lint`, `typecheck`, `test` and `build`; run them locally
before pushing to get the same result.

## Project layout

```
src/
  app/          Next.js routes (App Router)
  lib/          Framework-free logic, unit tested with Vitest
```

## Design notes

**Booking times are half-open ranges, `[start, end)`.** A booking from 09:00 to
10:00 and another from 10:00 to 11:00 do not overlap, so back-to-back slots are
allowed. Two ranges overlap exactly when each starts before the other ends. See
`src/lib/time-range.ts`.

**Timestamps must carry a timezone offset.** The API will reject `2026-03-02T09:00`
and accept `2026-03-02T09:00Z` or `2026-03-02T09:00-05:00`, so a booking never
depends on the timezone the server runs in.

## Roadmap

1. ~~Scaffold: Next.js, strict TypeScript, lint/format, Vitest, CI~~
2. Database: Prisma schema (User, Lab, Equipment, Booking), Docker Compose Postgres,
   seed script
3. Equipment CRUD API with Zod validation
4. Bookings with conflict detection inside a database transaction
5. Auth.js login and per-lab roles (admin / member)
6. UI: equipment list, weekly calendar, booking form
7. Experiment run log attached to bookings, with search and filters
8. Playwright end-to-end tests in CI
9. Deploy-readiness: env validation, error handling, rate limiting, architecture
   docs

## License

[MIT](LICENSE)
