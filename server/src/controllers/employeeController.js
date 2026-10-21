const service = require('../services/employeeService');

async function list(req, res) {
  res.json(await service.listEmployees(req.query));
}

async function get(req, res) {
  res.json(await service.getEmployee(req.params.id));
}

async function create(req, res) {
  res.status(201).json(await service.createEmployee(req.body));
}

async function update(req, res) {
  res.json(await service.updateEmployee(req.params.id, req.body));
}

async function remove(req, res) {
  await service.deleteEmployee(req.params.id);
  res.status(204).end();
}

module.exports = { list, get, create, update, remove };
