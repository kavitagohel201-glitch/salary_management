const test = require('node:test');
const assert = require('node:assert/strict');
const {
  validateEmployeeInput,
  parseEmployeeQuery,
  validateUuid,
  optionalCountry,
} = require('../src/utils/validation');

const validEmployee = {
  fullName: 'Taylor Morgan',
  email: 'Taylor.Morgan@acme.example',
  jobTitle: 'People Analyst',
  department: 'Human Resources',
  country: 'United States',
  salary: '85000.50',
  hireDate: '2024-02-29',
};

test('normalizes employee input and derives currency from country', () => {
  const employee = validateEmployeeInput(validEmployee);

  assert.equal(employee.fullName, 'Taylor Morgan');
  assert.equal(employee.email, 'taylor.morgan@acme.example');
  assert.equal(employee.currency, 'USD');
  assert.equal(employee.salary, '85000.50');
  assert.equal(employee.hireDate.toISOString(), '2024-02-29T00:00:00.000Z');
});

test('rejects invalid email, unsupported countries, nonpositive salary, and impossible dates', () => {
  assert.throws(() => validateEmployeeInput({ ...validEmployee, email: 'invalid' }), /Email must be valid/);
  assert.throws(() => validateEmployeeInput({ ...validEmployee, country: 'Atlantis' }), /supported country/);
  assert.throws(() => validateEmployeeInput({ ...validEmployee, salary: '0' }), /positive amount/);
  assert.throws(() => validateEmployeeInput({ ...validEmployee, hireDate: '2025-02-29' }), /valid date/);
});

test('validates pagination and whitelists sort fields', () => {
  assert.deepEqual(parseEmployeeQuery({ page: '2', pageSize: '50', sortBy: 'salary', sortOrder: 'desc' }), {
    page: 2,
    pageSize: 50,
    sortBy: 'salary',
    sortOrder: 'desc',
    filters: {},
  });
  assert.throws(() => parseEmployeeQuery({ pageSize: '101' }), /between 1 and 100/);
  assert.throws(() => parseEmployeeQuery({ sortBy: 'salary; DROP TABLE employees' }), /Sort field is not supported/);
});

test('validates employee UUIDs and insight country filters', () => {
  const id = '33a76013-a1e4-4a9a-a0e0-751ceb3f2a12';
  assert.equal(validateUuid(id), id);
  assert.throws(() => validateUuid('not-a-uuid'), /valid UUID/);
  assert.equal(optionalCountry({ country: 'India' }), 'India');
  assert.equal(optionalCountry({}), undefined);
  assert.throws(() => optionalCountry({ country: 'Atlantis' }), /supported country/);
});
