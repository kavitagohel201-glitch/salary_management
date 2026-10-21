const prisma = require('../db/prisma');
const { COUNTRY_CURRENCIES } = require('../config/countries');

function buildEmployeeWhere(filters) {
  const where = {};
  if (filters.country) where.country = filters.country;
  if (filters.department) where.department = filters.department;
  if (filters.jobTitle) where.jobTitle = filters.jobTitle;
  if (filters.search) {
    where.OR = [
      { fullName: { contains: filters.search, mode: 'insensitive' } },
      { email: { contains: filters.search, mode: 'insensitive' } },
    ];
  }
  return where;
}

async function list({ page, pageSize, sortBy, sortOrder, filters }) {
  const where = buildEmployeeWhere(filters);
  const [data, total] = await prisma.$transaction([
    prisma.employee.findMany({
      where,
      orderBy: [{ [sortBy]: sortOrder }, { id: 'asc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.employee.count({ where }),
  ]);
  return {
    data,
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  };
}

function findById(id) {
  return prisma.employee.findUnique({ where: { id } });
}

function create(data) {
  return prisma.employee.create({ data });
}

function update(id, data) {
  return prisma.employee.update({ where: { id }, data });
}

function remove(id) {
  return prisma.employee.delete({ where: { id } });
}

async function getFilters() {
  const [countries, departments, jobTitles] = await Promise.all([
    prisma.employee.findMany({ distinct: ['country'], select: { country: true }, orderBy: { country: 'asc' } }),
    prisma.employee.findMany({ distinct: ['department'], select: { department: true }, orderBy: { department: 'asc' } }),
    prisma.employee.findMany({ distinct: ['jobTitle'], select: { jobTitle: true }, orderBy: { jobTitle: 'asc' } }),
  ]);
  return {
    countries: countries.map((item) => item.country),
    supportedCountries: Object.entries(COUNTRY_CURRENCIES).map(([country, currency]) => ({ country, currency })),
    departments: departments.map((item) => item.department),
    jobTitles: jobTitles.map((item) => item.jobTitle),
  };
}

module.exports = {
  list,
  findById,
  create,
  update,
  remove,
  getFilters,
};
