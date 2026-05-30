# CLAUDE.md

ClientPulse backend — a single **NestJS** service on Railway. Connects to PostgreSQL (tenant data), Redis (BullMQ queues + sessions), and Supabase Storage (media/generated sites). The `client-pulse-api` GraphQL service triggers workflows and integration syncs through it.

## Commands

```bash
npm run dev              # dev server, watch mode (port 3001)
npm run build            # compile TypeScript to dist/
npm start                # run production build
npm run lint             # ESLint
npm run typecheck        # tsc --noEmit (src + tests)
npm run format           # Prettier write
npm run format:check     # Prettier check
npm test                 # unit tests (Jest)
npm run test:coverage    # unit tests + coverage gate
npm run test:integration # Cucumber integration tests (every HTTP endpoint)
```

Single unit file: `npm test -- --testPathPattern=websocket`.
Single feature: `npm run test:integration -- integration/features/tenants.feature`.

## Detailed guidance

Project rules live in `.claude/rules/` and auto-load by path:

- `architecture.md` — layout, boot flow, module responsibilities (`src/**`)
- `stack.md` — libraries and versions (`src/**`, `integration/**`)
- `types.md` — type organization (`src/**`)
- `testing.md` — unit + integration conventions (test/config files)
- `ci.md` — CI jobs + pre-commit hooks (workflow/config files)
