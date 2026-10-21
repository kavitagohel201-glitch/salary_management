const { Prisma } = require('@prisma/client');
const prisma = require('../db/prisma');

const GROUP_COLUMNS = Object.freeze({
  department: Prisma.raw('"department"'),
  jobTitle: Prisma.raw('"job_title"'),
});

function countryFilter(country) {
  return country ? Prisma.sql`WHERE country = ${country}` : Prisma.empty;
}

function createInsightsRepository(prismaClient = prisma) {
  async function getSummary() {
    const [row] = await prismaClient.$queryRaw(Prisma.sql`
      SELECT
        COUNT(*)::int AS headcount,
        COUNT(DISTINCT country)::int AS "countriesCount",
        COUNT(DISTINCT department)::int AS "departmentsCount"
      FROM employees
    `);
    return row;
  }

  function getByCountry() {
    return prismaClient.$queryRaw(Prisma.sql`
      SELECT country, currency,
        COUNT(*)::int AS headcount,
        MIN(salary) AS min_salary,
        MAX(salary) AS max_salary,
        ROUND(AVG(salary)::numeric, 2) AS avg_salary,
        percentile_cont(0.5) WITHIN GROUP (ORDER BY salary) AS median_salary
      FROM employees
      GROUP BY country, currency
      ORDER BY country
    `);
  }

  function getByGroup(groupBy, country) {
    const groupColumn = GROUP_COLUMNS[groupBy];
    if (!groupColumn) {
      throw new Error(`Unsupported insight grouping: ${groupBy}`);
    }

    return prismaClient.$queryRaw(Prisma.sql`
      SELECT country, currency, ${groupColumn} AS group_name,
        COUNT(*)::int AS headcount,
        MIN(salary) AS min_salary,
        MAX(salary) AS max_salary,
        ROUND(AVG(salary)::numeric, 2) AS avg_salary,
        percentile_cont(0.5) WITHIN GROUP (ORDER BY salary) AS median_salary
      FROM employees
      ${countryFilter(country)}
      GROUP BY country, currency, ${groupColumn}
      ORDER BY country, group_name
    `);
  }

  function getDistribution(country) {
    return prismaClient.$queryRaw(Prisma.sql`
      WITH country_ranges AS (
        SELECT country, currency, MIN(salary) AS min_salary, MAX(salary) AS max_salary
        FROM employees
        ${countryFilter(country)}
        GROUP BY country, currency
      )
      SELECT e.country, e.currency, ranges.min_salary, ranges.max_salary,
        CASE
          WHEN ranges.min_salary = ranges.max_salary THEN 0
          ELSE LEAST(4, FLOOR(
            ((e.salary - ranges.min_salary) / (ranges.max_salary - ranges.min_salary)) * 5
          )::int)
        END AS band_index,
        COUNT(*)::int AS headcount
      FROM employees e
      JOIN country_ranges ranges
        ON ranges.country = e.country AND ranges.currency = e.currency
      GROUP BY e.country, e.currency, ranges.min_salary, ranges.max_salary, band_index
      ORDER BY e.country, band_index
    `);
  }

  return { getSummary, getByCountry, getByGroup, getDistribution };
}

module.exports = { createInsightsRepository };
