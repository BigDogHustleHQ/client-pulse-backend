---
paths:
  - ".github/**"
  - ".husky/**"
  - "package.json"
  - "jest.config.ts"
  - "eslint.config.mjs"
  - ".prettierrc"
  - ".nvmrc"
---

# CI & pre-commit

- **GitHub Actions** (`.github/workflows/ci.yml`) runs four jobs on every PR and on pushes to `main`: **Lint & typecheck** (`lint` + `format:check` + `typecheck`), **Unit tests & coverage** (`test:coverage`), **Build** (`build`), and **Integration tests (Cucumber)** (`test:integration`). The coverage gate is the `coverageThreshold` in `jest.config.ts` (100% global) — a PR that drops coverage fails the test job.
- **Pre-commit hook** (Husky, `.husky/pre-commit`) runs `lint-staged` (ESLint `--fix` + Prettier on staged `*.ts`) then `npm run typecheck`. Hooks install automatically via the `prepare` script on `npm install`.
