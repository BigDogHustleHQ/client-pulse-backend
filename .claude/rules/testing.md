# Testing conventions

Two layers:

- **Unit tests (Jest)** — `.test.ts` suffix, co-located with source. Mock at the service/provider boundary; 100% coverage threshold enforced via `jest.config.ts`. BullMQ and node-cron are mocked here. WebSocket connection/disconnect callbacks use `/* istanbul ignore next */`.
- **Integration tests (Cucumber)** — live under `integration/`. `cucumber.cjs` loads `.ts` steps via `ts-node` (`tsconfig.integration.json`). They boot the **real** HTTP app (controllers → services → Postgres/BlobStorage clients) and drive every endpoint with supertest; only the Supabase network boundary is replaced by in-memory fakes (`integration/support/fakes.ts`), so no Redis/Postgres/storage is required. Layout: `features/` (Gherkin, one per controller), `steps/` (step definitions), `support/` (World, hooks, app boot, fakes). Cucumber is **not** part of the Jest coverage gate.
