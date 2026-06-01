# CLAUDE.md

ClientPulse backend — a single **NestJS** service on Railway. Connects to PostgreSQL (tenant data), Redis (BullMQ queues + sessions), and Supabase Storage (media/generated sites). The `client-pulse-api` GraphQL service triggers workflows and integration syncs through it.

## Commands

```bash
npm run dev              # dev server, watch mode (port 3001)
npm run build            # compile TypeScript to dist/
npm start                # run production build
npm run lint             # ESLint
npm run typecheck        # type-check src + tests
npm run format           # Prettier write
npm run format:check     # Prettier check
npm test                 # unit tests (Jest)
npm run test:coverage    # unit tests + coverage gate
```

Single unit file: `npm test -- --testPathPattern=websocket`.

## CI and hooks

GitHub Actions (`.github/workflows/ci.yml`) runs lint/format/typecheck, unit
tests with coverage, and build on every PR and push to `main`. The coverage
gate is enforced by `coverageThreshold` in `jest.config.ts`.

The Husky pre-commit hook runs `lint-staged` on staged TypeScript files, then
`npm run typecheck`.
