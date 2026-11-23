import { app } from './app';
import { env } from './config/env';
import { logger } from './utils/logger';

const PORT = env.PORT;

app.listen(PORT, () => {
  logger.info({ port: PORT, env: env.NODE_ENV }, `🚀 Jobify backend server running on http://localhost:${PORT}`);
});
