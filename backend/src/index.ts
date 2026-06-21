import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { config } from './config';
import logger from './lib/logger';
import { errorHandler } from './middleware/error.middleware';

import authRoutes from './routes/auth.routes';
import agentsRoutes from './routes/agents.routes';
import battleRoutes from './routes/battle.routes';
import leaderboardRoutes from './routes/leaderboard.routes';

const app = express();

app.use(helmet());
app.use(cors({ origin: config.frontend.url, credentials: true }));
app.use(compression());
app.use(express.json());

const apiPrefix = config.server.apiPrefix;

app.get(`${apiPrefix}/health`, (_req, res) => {
  res.json({ success: true, data: { status: 'ok', timestamp: Date.now() } });
});

app.use(`${apiPrefix}/auth`, authRoutes);
app.use(`${apiPrefix}/agents`, agentsRoutes);
app.use(`${apiPrefix}/battle`, battleRoutes);
app.use(`${apiPrefix}/leaderboard`, leaderboardRoutes);

app.use(errorHandler);

app.listen(config.server.port, () => {
  logger.info(`Gladiator Arena backend listening on port ${config.server.port} (${config.server.nodeEnv})`);
  logger.info(`API available at http://localhost:${config.server.port}${apiPrefix}`);
});
