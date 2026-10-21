const { HttpError } = require('./httpError');
const { COUNTRY_CURRENCIES } = require('../config/countries');

const SORTABLE_FIELDS = new Set([
  'fullName',
  'email',
  'jobTitle',
  'department',
  'country',
  'salary',
  'hireDate',
  'createdAt',
]);

function requiredString(value, field, maxLength) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new HttpError(400, `${field} is required.`);
  }

  const normalized = value.trim();
  if (normalized.length > maxLength) {
    throw new HttpError(400, `${field} must be ${maxLength} characters or fewer.`);
  }

  return normalized;
}

function validateEmployeeInput(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new HttpError(400, 'A JSON employee object is required.');
  }

  const fullName = requiredString(body.fullName, 'Full name', 150);
  const email = requiredString(body.email, 'Email', 200).toLowerCase();
  const jobTitle = requiredString(body.jobTitle, 'Job title', 100);
  const department = requiredString(body.department, 'Department', 100);
  const country = requiredString(body.country, 'Country', 100);
  const salaryValue = body.salary;
  const salaryString = typeof salaryValue === 'number' ? String(salaryValue) : salaryValue;

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new HttpError(400, 'Email must be valid.');
  }

  if (!Object.hasOwn(COUNTRY_CURRENCIES, country)) {
    throw new HttpError(400, 'Country must be a supported country.');
  }

  if (typeof salaryString !== 'string' || !/^\d{1,10}(?:\.\d{1,2})?$/.test(salaryString) || Number(salaryString) <= 0) {
    throw new HttpError(400, 'Salary must be a positive amount with no more than two decimal places.');
  }

  const hireDate = requiredString(body.hireDate, 'Hire date', 10);
  const parsedHireDate = new Date(`${hireDate}T00:00:00.000Z`);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(hireDate)
    || Number.isNaN(parsedHireDate.getTime())
    || parsedHireDate.toISOString().slice(0, 10) !== hireDate
  ) {
    throw new HttpError(400, 'Hire date must be a valid date in YYYY-MM-DD format.');
  }

  return {
    fullName,
    email,
    jobTitle,
    department,
    country,
    currency: COUNTRY_CURRENCIES[country],
    salary: salaryString,
    hireDate: parsedHireDate,
  };
}

function parseEmployeeQuery(query) {
  const page = Number(query.page ?? 1);
  const pageSize = Number(query.pageSize ?? 25);
  if (!Number.isInteger(page) || page < 1) {
    throw new HttpError(400, 'Page must be a positive integer.');
  }
  if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100) {
    throw new HttpError(400, 'Page size must be an integer between 1 and 100.');
  }

  const sortBy = query.sortBy ?? 'fullName';
  const sortOrder = query.sortOrder ?? 'asc';
  if (!SORTABLE_FIELDS.has(sortBy)) {
    throw new HttpError(400, 'Sort field is not supported.');
  }
  if (!['asc', 'desc'].includes(sortOrder)) {
    throw new HttpError(400, 'Sort order must be asc or desc.');
  }

  const filters = {};
  for (const field of ['country', 'department', 'jobTitle']) {
    if (query[field]) filters[field] = String(query[field]).trim();
  }
  if (query.search) {
    const search = String(query.search).trim();
    if (search.length > 100) throw new HttpError(400, 'Search must be 100 characters or fewer.');
    if (search) filters.search = search;
  }

  return { page, pageSize, sortBy, sortOrder, filters };
}

function validateUuid(value) {
  if (typeof value !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
    throw new HttpError(400, 'Employee ID must be a valid UUID.');
  }
  return value;
}

function optionalCountry(query) {
  if (!query.country) return undefined;
  const country = String(query.country).trim();
  if (!Object.hasOwn(COUNTRY_CURRENCIES, country)) {
    throw new HttpError(400, 'Country must be a supported country.');
  }
  return country;
}

module.exports = { validateEmployeeInput, parseEmployeeQuery, validateUuid, optionalCountry };
