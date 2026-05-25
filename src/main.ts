import { createApp } from './server';
import { createModuleLogger } from './modules/logger';

const log = createModuleLogger('server');
const PORT = process.env.PORT ?? 3001;

createApp().listen(PORT, () => {
  log.info(`listening on port ${PORT}`);
});
