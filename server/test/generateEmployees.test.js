const test = require('node:test');
const assert = require('node:assert/strict');
const { generateEmployees, COUNTRIES, DEPARTMENTS } = require('../src/seed/generateEmployees');
const { seed } = require('../prisma/seed');

test('generates the requested number of employees', () => {
  assert.equal(generateEmployees(100).length, 100);
});

test('generates deterministic employee data from the fixed faker seed', () => {
  assert.deepEqual(generateEmployees(25), generateEmployees(25));
});

test('generates unique emails', () => {
  const employees = generateEmployees(1000);
  assert.equal(new Set(employees.map((employee) => employee.email)).size, employees.length);
});

test('keeps salaries within the configured country range after the department multiplier', () => {
  const countryByName = new Map(COUNTRIES.map((country) => [country.name, country]));
  const departmentByName = new Map(DEPARTMENTS.map((department) => [department.name, department]));

  for (const employee of generateEmployees(1000)) {
    const country = countryByName.get(employee.country);
    const department = departmentByName.get(employee.department);
    const role = department.jobTitles.find(({ title }) => title === employee.jobTitle);

    assert.ok(employee.salary >= country.minSalary, `${employee.salary} is below ${country.name} minimum`);
    assert.ok(employee.salary <= country.maxSalary, `${employee.salary} is above ${country.name} maximum`);
    assert.ok(role);
    assert.equal(employee.currency, country.currency);
    assert.match(employee.email, /^\S+@\S+\.\S+$/);
  }
});

test('rejects invalid employee counts', () => {
  assert.throws(() => generateEmployees(-1), /non-negative integer/);
  assert.throws(() => generateEmployees(1.5), /non-negative integer/);
});

test('truncates first and seeds exactly 10,000 employees in batches of 1,000', async () => {
  const calls = [];
  const client = {
    async $executeRaw() {
      calls.push({ operation: 'truncate' });
    },
    employee: {
      async createMany({ data }) {
        calls.push({ operation: 'createMany', count: data.length });
        return { count: data.length };
      },
    },
  };

  assert.equal(await seed(client), 10000);
  assert.deepEqual(calls[0], { operation: 'truncate' });
  assert.deepEqual(calls.slice(1), Array.from({ length: 10 }, () => ({
    operation: 'createMany',
    count: 1000,
  })));
});
