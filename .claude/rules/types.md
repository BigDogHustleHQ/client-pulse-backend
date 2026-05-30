---
paths:
  - "src/**"
---

# Type organization

- Enums always live in `src/types/enums/`.
- Shared interfaces and type aliases live in `src/types/index.ts` only when used by two or more modules.
- Module-local interfaces and type aliases live in `src/modules/<name>/types.ts` (or the route/service's own `types.ts`).
