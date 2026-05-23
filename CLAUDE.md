# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # dev server with watch mode (port 3001)
npm run build        # compile TypeScript to dist/
npm start            # run production build
npm run lint         # ESLint
npm run format       # Prettier format src/
npm run format:check # check formatting without writing
npm test             # unit tests
npm run test:watch   # unit tests in watch mode
npm run test:coverage # unit tests with coverage report
```

To run a single test file: `npm test -- --testPathPattern=websocket`

## Architecture

Single Node.js process on Railway with three co-located modules. The intent is cheap and simple to start — split into separate Railway services later if one outgrows the others.

```
src/
  main.ts                           # bootstrap — starts HTTP server on PORT (default 3001)
  server.ts                         # wires all three modules together
  modules/
    websocket/index.ts              # Socket.io attached to the HTTP server
    workflow-engine/index.ts        # BullMQ queue + worker + node-cron jobs
    integration-hub/index.ts        # Express router — webhooks + OAuth adapters
```

Each module exports a factory function (`createWebSocketModule`, `createIntegrationHubRouter`, `registerCronJobs`) consumed by `server.ts`. Adding a new integration means adding an adapter under `integration-hub/` and registering it on the router.

## Module responsibilities

| Module | What it does |
| --- | --- |
| **WebSocket** | Real-time push to frontend via Socket.io — presence, live updates |
| **Workflow Engine** | BullMQ job queue (Redis-backed) + node-cron for scheduled triggers |
| **Integration Hub** | Express routes for incoming webhooks + OAuth flows for third-party APIs |

## Testing conventions

- Unit test files use `.test.ts` suffix, co-located with source
- BullMQ and node-cron are mocked in unit tests — integration with real Redis is an e2e concern
- WebSocket connection/disconnect callbacks use `/* istanbul ignore next */` — covered by e2e
- 100% coverage threshold enforced via `jest.config.ts`

## Stack

- **Node.js 22** + **TypeScript 6** — `tsconfig.json` targets ES2022/CommonJS
- **Express 5** — HTTP layer for Integration Hub webhooks
- **Socket.io 4** — WebSocket module
- **BullMQ 5** + **node-cron** — Workflow Engine
- **Jest 30** + **ts-jest** — unit tests (`tsconfig.test.json` used for test compilation)
- **Prettier** — single quotes, 2-space tabs
- **tsx** — dev server watch mode (no compilation step)

## This project

ClientPulse backend service — deployed as a single Railway service. Connects to PostgreSQL (tenant data), Redis (BullMQ queues + sessions), and S3 (media/generated sites). The NestJS GraphQL API (`client-pulse-api`) triggers workflows and integration syncs via this service.
