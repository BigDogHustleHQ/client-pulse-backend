---
paths:
  - "src/**"
  - "integration/**"
---

# Stack

- **Node.js 24** + **TypeScript 6** — `tsconfig.json` targets ES2022/CommonJS, with `experimentalDecorators`/`emitDecoratorMetadata` for Nest
- **NestJS 11** — DI, modules, controllers, gateways; `@nestjs/platform-express` (HTTP), `@nestjs/platform-socket.io` (WebSocket)
- **Express 5** — underlying HTTP platform
- **Socket.io 4** — WebSocket module
- **BullMQ 5** + **node-cron** — Workflow Engine
- **Supabase JS** — Postgres + Storage clients (service-role key)
- **class-validator** + **class-transformer** — DTO validation via the global `ValidationPipe`
- **Winston** — logging (`src/lib/logger`); colorized in dev, JSON in prod, silent in test
- **Jest 30** + **ts-jest** — unit tests
- **Prettier** — single quotes, 2-space tabs
- **tsx** — dev server watch mode (no compile step)
