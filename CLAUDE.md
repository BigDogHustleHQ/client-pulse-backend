# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # dev server with watch mode (port 3001)
npm run build        # compile TypeScript to dist/
npm start            # run production build
npm run lint         # ESLint
npm run typecheck    # tsc --noEmit (type-check src + tests, no output)
npm run format       # Prettier format src/
npm run format:check # check formatting without writing
npm test             # unit tests
npm run test:watch   # unit tests in watch mode
npm run test:coverage # unit tests with coverage report
```

To run a single test file: `npm test -- --testPathPattern=websocket`

## CI & pre-commit

- **GitHub Actions** (`.github/workflows/ci.yml`) runs three jobs on every PR and on pushes to `main`: **Lint & typecheck** (`lint` + `format:check` + `typecheck`), **Unit tests & coverage** (`test:coverage`), and **Build** (`build`). The coverage gate is the `coverageThreshold` in `jest.config.ts` (100% global) — a PR that drops coverage fails the test job.
- **Pre-commit hook** (Husky, `.husky/pre-commit`) runs `lint-staged` (ESLint `--fix` + Prettier on staged `*.ts`) then `npm run typecheck`. Hooks install automatically via the `prepare` script on `npm install`.

## Architecture

Single Node.js process on Railway, built on **NestJS**. The intent is cheap and simple to start — split into separate Railway services later if one outgrows the others.

```
src/
  main.ts                           # bootstrap — NestFactory boots AppModule, global ValidationPipe, listens on PORT (default 3001)
  server.ts                         # AppModule — imports every feature module
  modules/
    websocket/index.ts              # @WebSocketGateway — Socket.io real-time push
    workflow-engine/index.ts        # @Injectable — BullMQ queue + worker + node-cron (lifecycle hooks)
    integration-hub/index.ts        # @Controller — webhook intake + OAuth adapters
  routes/
    tenants/                        # @Controller + DTOs — tenant read/update
    storage/                        # @Controller + DTOs — Supabase Storage object writes
    dependencies/                   # @Controller — DB + storage health probes
  services/
    postgres/                       # Supabase Postgres client
    blob-storage/                   # Supabase Storage client
    tenants/                        # tenant domain service (update + audit log)
  lib/
    logger/                         # Winston logger + createModuleLogger()
    validation/                     # custom class-validator decorators
  types/                            # enums + shared interfaces (see Type organization)
```

`main.ts` boots `AppModule` via `NestFactory` with a global `ValidationPipe({ whitelist: true, transform: true })`. Each feature is a Nest `@Module` exporting controllers/providers, imported by `AppModule` in `server.ts`. Controllers (under `modules/` and `routes/`) are the HTTP/WebSocket entry points; `services/` holds the clients and domain logic they depend on, wired via dependency injection. Adding a new integration means adding an adapter under `integration-hub/` and registering it on the controller.

## Module responsibilities

| Module | What it does |
| --- | --- |
| **WebSocket** | Nest `@WebSocketGateway` (Socket.io) — real-time push to frontend |
| **Workflow Engine** | `@Injectable` managing a BullMQ queue/worker (Redis-backed) + node-cron via `OnModuleInit`/`OnModuleDestroy` |
| **Integration Hub** | Nest controller for incoming webhooks + OAuth flows for third-party APIs |
| **Tenants / Storage / Dependencies** (`routes/`) | HTTP controllers backed by Supabase Postgres/Storage clients in `services/` |

## Testing conventions

- Unit test files use `.test.ts` suffix, co-located with source
- BullMQ and node-cron are mocked in unit tests — integration with real Redis is an e2e concern
- WebSocket connection/disconnect callbacks use `/* istanbul ignore next */` — covered by e2e
- 100% coverage threshold enforced via `jest.config.ts`

## Stack

- **Node.js 24** + **TypeScript 6** — `tsconfig.json` targets ES2022/CommonJS, with `experimentalDecorators`/`emitDecoratorMetadata` enabled for Nest
- **NestJS 11** — application framework (DI, modules, controllers, gateways); `@nestjs/platform-express` is the HTTP adapter, `@nestjs/platform-socket.io` the WebSocket adapter
- **Express 5** — underlying HTTP platform for Nest
- **Socket.io 4** — WebSocket module
- **BullMQ 5** + **node-cron** — Workflow Engine
- **Supabase JS** — Postgres + Storage clients (service-role key)
- **class-validator** + **class-transformer** — DTO validation via the global `ValidationPipe`
- **Winston** — logging (`src/lib/logger`); colorized in dev, JSON in prod, silent in test
- **Jest 30** + **ts-jest** — unit tests
- **Prettier** — single quotes, 2-space tabs
- **tsx** — dev server watch mode (no compilation step)

## This project

ClientPulse backend service — deployed as a single Railway service. Connects to PostgreSQL (tenant data), Redis (BullMQ queues + sessions), and S3 (media/generated sites). The NestJS GraphQL API (`client-pulse-api`) triggers workflows and integration syncs via this service.
