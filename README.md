# client-pulse-backend

ClientPulse backend service — single Node.js process on Railway with WebSocket, Workflow Engine, and Integration Hub modules. See `CLAUDE.md` for commands and architecture.

## Environments

| Env | Where | Purpose |
| --- | --- | --- |
| local | localhost | Your own dev loop on `http://localhost:3001` |
| development | Railway | Shared integration target for frontend, WebSocket, and Integration Hub work |
| staging | Railway | Production mirror and release gate |
| production | Railway | Live service |
