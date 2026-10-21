const { Faker, en } = require('@faker-js/faker');

const COUNTRIES = Object.freeze([
  { name: 'Australia', currency: 'AUD', minSalary: 50000, maxSalary: 200000 },
  { name: 'Brazil', currency: 'BRL', minSalary: 60000, maxSalary: 350000 },
  { name: 'Canada', currency: 'CAD', minSalary: 55000, maxSalary: 210000 },
  { name: 'France', currency: 'EUR', minSalary: 40000, maxSalary: 145000 },
  { name: 'Germany', currency: 'EUR', minSalary: 45000, maxSalary: 160000 },
  { name: 'India', currency: 'INR', minSalary: 600000, maxSalary: 4000000 },
  { name: 'Japan', currency: 'JPY', minSalary: 5000000, maxSalary: 25000000 },
  { name: 'Singapore', currency: 'SGD', minSalary: 45000, maxSalary: 220000 },
  { name: 'United Kingdom', currency: 'GBP', minSalary: 40000, maxSalary: 150000 },
  { name: 'United States', currency: 'USD', minSalary: 60000, maxSalary: 220000 },
]);

const DEPARTMENTS = Object.freeze([
  {
    name: 'Engineering',
    jobTitles: [
      { title: 'Software Engineer', multiplier: 1 },
      { title: 'Senior Software Engineer', multiplier: 1.35 },
      { title: 'Engineering Manager', multiplier: 1.6 },
    ],
  },
  {
    name: 'Finance',
    jobTitles: [
      { title: 'Financial Analyst', multiplier: 1 },
      { title: 'Senior Accountant', multiplier: 1.3 },
      { title: 'Finance Director', multiplier: 1.7 },
    ],
  },
  {
    name: 'Human Resources',
    jobTitles: [
      { title: 'HR Coordinator', multiplier: 1 },
      { title: 'HR Business Partner', multiplier: 1.3 },
      { title: 'HR Director', multiplier: 1.65 },
    ],
  },
  {
    name: 'Legal',
    jobTitles: [
      { title: 'Legal Assistant', multiplier: 1 },
      { title: 'Legal Counsel', multiplier: 1.4 },
      { title: 'General Counsel', multiplier: 1.8 },
    ],
  },
  {
    name: 'Marketing',
    jobTitles: [
      { title: 'Marketing Specialist', multiplier: 1 },
      { title: 'Marketing Manager', multiplier: 1.35 },
      { title: 'Marketing Director', multiplier: 1.7 },
    ],
  },
  {
    name: 'Operations',
    jobTitles: [
      { title: 'Operations Associate', multiplier: 1 },
      { title: 'Operations Manager', multiplier: 1.35 },
      { title: 'Operations Director', multiplier: 1.7 },
    ],
  },
  {
    name: 'Product',
    jobTitles: [
      { title: 'Product Analyst', multiplier: 1 },
      { title: 'Product Manager', multiplier: 1.4 },
      { title: 'Senior Product Manager', multiplier: 1.7 },
    ],
  },
  {
    name: 'Sales',
    jobTitles: [
      { title: 'Sales Representative', multiplier: 1 },
      { title: 'Account Executive', multiplier: 1.3 },
      { title: 'Sales Director', multiplier: 1.7 },
    ],
  },
]);

const SEED = 42;
const HIRE_DATE_START = new Date('2012-01-01T00:00:00.000Z');
const HIRE_DATE_END = new Date('2025-12-31T00:00:00.000Z');

function salaryInRange(faker, country, multiplier) {
  const minimumBaseCents = Math.ceil((country.minSalary * 100) / multiplier);
  const maximumBaseCents = Math.floor((country.maxSalary * 100) / multiplier);
  const baseCents = faker.number.int({ min: minimumBaseCents, max: maximumBaseCents });
  return ((baseCents * multiplier) / 100).toFixed(2);
}

function generateEmployees(count) {
  if (!Number.isInteger(count) || count < 0) {
    throw new RangeError('Employee count must be a non-negative integer.');
  }

  const faker = new Faker({ locale: [en] });
  faker.seed(SEED);

  return Array.from({ length: count }, (_, index) => {
    const country = faker.helpers.arrayElement(COUNTRIES);
    const department = faker.helpers.arrayElement(DEPARTMENTS);
    const role = faker.helpers.arrayElement(department.jobTitles);
    const fullName = faker.person.fullName();

    return {
      fullName: fullName.slice(0, 150),
      email: `employee${String(index + 1).padStart(5, '0')}@acme.example`,
      jobTitle: role.title,
      department: department.name,
      country: country.name,
      currency: country.currency,
      salary: salaryInRange(faker, country, role.multiplier),
      hireDate: faker.date.between({ from: HIRE_DATE_START, to: HIRE_DATE_END }),
    };
  });
}

module.exports = { generateEmployees, COUNTRIES, DEPARTMENTS };
