require('dotenv').config();
const app = require('./src/app');
const prisma = require('./src/db/prisma');

const port = Number(process.env.PORT || 3000);
let server;

async function start() {
  await prisma.$connect();
  server = app.listen(port, () => {
    console.log(`Salary management API listening on port ${port}`);
  });
}

async function shutdown(signal) {
  console.log(`${signal} received; shutting down API.`);
  if (server) {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
  await prisma.$disconnect();
}

start().catch(async (error) => {
  console.error('Failed to start API. Check DATABASE_URL and database migrations.', error);
  await prisma.$disconnect();
  process.exitCode = 1;
});

process.once('SIGINT', () => shutdown('SIGINT').catch((error) => {
  console.error('Failed to shut down cleanly:', error);
  process.exitCode = 1;
}));
process.once('SIGTERM', () => shutdown('SIGTERM').catch((error) => {
  console.error('Failed to shut down cleanly:', error);
  process.exitCode = 1;
}));