const service = require('../services/employeeService');

async function filters(_req, res) {
  res.json(await service.getFilters());
}

module.exports = { filters };
