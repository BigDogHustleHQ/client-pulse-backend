---
paths:
  - "src/**"
---

# Architecture

Single Node.js process on Railway, built on **NestJS**. Cheap and simple to start — split into separate Railway services later if one outgrows the others.

```
src/
  main.ts                # bootstrap — NestFactory boots AppModule, global ValidationPipe, listens on PORT (3001)
  server.ts              # AppModule — imports every feature module
  modules/
    websocket/           # @WebSocketGateway — Socket.io real-time push
    workflow-engine/     # @Injectable — BullMQ queue + worker + node-cron (lifecycle hooks)
    integration-hub/     # @Controller — webhook intake + OAuth adapters
  routes/
    tenants/             # @Controller + DTOs — tenant read/update
    storage/             # @Controller + DTOs — Supabase Storage object writes
    dependencies/        # @Controller — DB + storage health probes
  services/
    postgres/            # Supabase Postgres client
    blob-storage/        # Supabase Storage client
    tenants/             # tenant domain service (update + audit log)
  lib/
    logger/              # Winston logger + createModuleLogger()
    validation/          # custom class-validator decorators
  types/                 # enums + shared interfaces (see types rule)
```

`main.ts` boots `AppModule` via `NestFactory` with a global `ValidationPipe({ whitelist: true, transform: true })`. Each feature is a Nest `@Module` exporting controllers/providers, imported by `AppModule` in `server.ts`. Controllers (`modules/`, `routes/`) are the HTTP/WebSocket entry points; `services/` holds the clients and domain logic, wired via DI. Adding an integration means adding an adapter under `integration-hub/` and registering it on the controller.

| Module | What it does |
| --- | --- |
| **WebSocket** | `@WebSocketGateway` (Socket.io) — real-time push to frontend |
| **Workflow Engine** | `@Injectable` BullMQ queue/worker (Redis) + node-cron via `OnModuleInit`/`OnModuleDestroy` |
| **Integration Hub** | Controller for incoming webhooks + OAuth flows for third-party APIs |
| **Tenants / Storage / Dependencies** (`routes/`) | HTTP controllers backed by Supabase Postgres/Storage clients in `services/` |
