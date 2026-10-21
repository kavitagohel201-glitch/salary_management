require('dotenv').config();

const prisma = require('../src/db/prisma');
const { generateEmployees } = require('../src/seed/generateEmployees');

const EMPLOYEE_COUNT = 10000;
const BATCH_SIZE = 1000;

async function seed(client = prisma, { reset = false } = {}) {
  const startedAt = process.hrtime.bigint();
  const employees = generateEmployees(EMPLOYEE_COUNT);

  if (reset) {
    await client.$executeRaw`TRUNCATE TABLE employees RESTART IDENTITY CASCADE`;
  }

  let inserted = 0;
  for (let start = 0; start < employees.length; start += BATCH_SIZE) {
    const batch = employees.slice(start, start + BATCH_SIZE);
    const result = await client.employee.createMany({
      data: batch,
      skipDuplicates: true,
    });
    inserted += result.count;
  }

  const elapsedMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
  console.log(`Seeded ${inserted} missing employees in ${elapsedMs.toFixed(0)} ms.`);
  return inserted;
}

if (require.main === module) {
  const reset = process.argv.includes('--reset');
  seed(prisma, { reset })
    .catch((error) => {
      console.error('Employee seed failed:', error);
      process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
}

module.exports = { seed };
