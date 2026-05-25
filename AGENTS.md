# AGENTS.md

This file imports the repository guidance from `CLAUDE.md` and `.claude/settings.json` for agents working in this repo.

## Imported Guidance

- Read `CLAUDE.md` before making code changes. It defines commands, architecture, module boundaries, testing conventions, stack details, and type organization rules.
- Read `.claude/settings.json` before editing API docs. It configures worktree isolation and runs `node scripts/sync-api-docs.mjs` whenever `openapi.yaml` is edited.

## Type Organization

- Enums always live in `src/types/enums/`.
- Shared interfaces and type aliases live in `src/types/index.ts` only when used by two or more modules.
- Module-local interfaces and type aliases live in `src/modules/<name>/types.ts`.

## Commands

```bash
npm run build
npm run lint
npm run format:check
npm test
```
