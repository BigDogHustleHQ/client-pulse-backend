import { createApp } from './server';

const PORT = process.env.PORT ?? 3001;

createApp().listen(PORT, () => {
  console.log(`[server] listening on port ${PORT}`);
});
