const repository = require('../repositories/employeeRepository');
const { HttpError } = require('../utils/httpError');
const { validateEmployeeInput, parseEmployeeQuery, validateUuid } = require('../utils/validation');

async function listEmployees(query) {
  return repository.list(parseEmployeeQuery(query));
}

async function getEmployee(id) {
  const employee = await repository.findById(validateUuid(id));
  if (!employee) throw new HttpError(404, 'Employee not found.');
  return employee;
}

async function createEmployee(body) {
  return repository.create(validateEmployeeInput(body));
}

async function updateEmployee(id, body) {
  return repository.update(validateUuid(id), validateEmployeeInput(body));
}

async function deleteEmployee(id) {
  await repository.remove(validateUuid(id));
}

module.exports = {
  listEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getFilters: repository.getFilters,
};
