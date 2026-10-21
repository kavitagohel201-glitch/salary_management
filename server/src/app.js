const express = require('express');
const cors = require('cors');
const employeeRoutes = require('./routes/employeeRoutes');
const metaRoutes = require('./routes/metaRoutes');
const { createInsightsRoutes } = require('./routes/insightsRoutes');
const { createInsightsRepository } = require('./repositories/insightsRepository');
const { createInsightsService } = require('./services/insightsService');
const { errorHandler } = require('./middleware/errorHandler');

function createApp({ insightsRepository = createInsightsRepository() } = {}) {
  const app = express();

  app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
  app.use(express.json({ limit: '32kb' }));
  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
  app.use('/api/employees', employeeRoutes);
  app.use('/api/meta', metaRoutes);
  app.use('/api/insights', createInsightsRoutes(createInsightsService(insightsRepository)));
  app.use((_req, res) => res.status(404).json({ error: 'Route not found.' }));
  app.use(errorHandler);

  return app;
}

const app = createApp();
app.createApp = createApp;

module.exports = app;
