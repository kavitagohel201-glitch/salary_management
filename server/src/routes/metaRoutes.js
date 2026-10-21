const express = require('express');
const controller = require('../controllers/metaController');
const { asyncHandler } = require('../utils/asyncHandler');

const router = express.Router();
router.get('/filters', asyncHandler(controller.filters));

module.exports = router;
