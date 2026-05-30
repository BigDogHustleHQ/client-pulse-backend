# Testing conventions

Two layers:

- **Unit tests (Jest)** — `.test.ts` suffix, co-located with source. Mock at the service/provider boundary; 100% coverage threshold enforced via `jest.config.ts`. BullMQ and node-cron are mocked here; WebSocket connect/disconnect callbacks use `/* istanbul ignore next */`.
- **Integration tests (Cucumber)** — under `integration/`. Boot the real HTTP app (routing, controllers, validation) and drive every endpoint with supertest; the service-level providers are replaced by in-memory fakes (`support/fakes.ts`), so no Redis/Postgres/storage is needed. Layout: `features/` (Gherkin, one per controller), `steps/steps.ts`, `support/` (world+hooks, app boot, fakes). `cucumber.cjs` loads the `.ts` files via `ts-node` (`tsconfig.integration.json`). Not part of the Jest coverage gate.
