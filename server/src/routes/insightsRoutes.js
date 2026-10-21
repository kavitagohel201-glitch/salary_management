const express = require('express');
const { createInsightsController } = require('../controllers/insightsController');
const { asyncHandler } = require('../utils/asyncHandler');

function createInsightsRoutes(service) {
  const controller = createInsightsController(service);
  const router = express.Router();
  router.get('/summary', asyncHandler(controller.summary));
  router.get('/by-country', asyncHandler(controller.byCountry));
  router.get('/by-department', asyncHandler(controller.byDepartment));
  router.get('/by-job-title', asyncHandler(controller.byJobTitle));
  router.get('/distribution', asyncHandler(controller.distribution));
  return router;
}

module.exports = { createInsightsRoutes };
