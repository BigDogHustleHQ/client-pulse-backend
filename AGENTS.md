# AGENTS.md

This file points agents to the repository guidance in `CLAUDE.md`, `.claude/rules/`, and `.claude/settings.json`.

## Imported Guidance

- Read `CLAUDE.md` first — project overview and commands. Detailed guidance is split into `.claude/rules/` (architecture, stack, type organization, testing, CI), which Claude Code auto-loads by path.
- Read `.claude/settings.json` before editing API docs. It configures worktree isolation and runs `node scripts/sync-api-docs.mjs` whenever `openapi.yaml` is edited.
