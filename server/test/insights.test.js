const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { createInsightsService, getSalaryBandIndex } = require('../src/services/insightsService');
const { createInsightsRepository } = require('../src/repositories/insightsRepository');
const { createApp } = require('../src/app');

const statRow = {
  country: 'United States',
  currency: 'USD',
  headcount: 3,
  min_salary: '50000.00',
  max_salary: '100000.00',
  avg_salary: '75000.126',
  median_salary: '75000.00',
};

test('maps aggregate values to numbers and rounds average salaries to two decimals', async () => {
  const service = createInsightsService({
    async getByCountry() {
      return [statRow];
    },
  });

  assert.deepEqual(await service.getByCountry(), [{
    country: 'United States',
    currency: 'USD',
    headcount: 3,
    min_salary: 50000,
    max_salary: 100000,
    avg_salary: 75000.13,
    median_salary: 75000,
  }]);
});

test('returns an empty array for empty aggregate results', async () => {
  const service = createInsightsService({
    async getByCountry() {
      return [];
    },
  });
  assert.deepEqual(await service.getByCountry(), []);
});

test('rounds decimal halfway values consistently to two places', async () => {
  const service = createInsightsService({
    async getByCountry() {
      return [
        { ...statRow, avg_salary: '100000000.005' },
        { ...statRow, avg_salary: '1.005' },
      ];
    },
  });

  assert.deepEqual((await service.getByCountry()).map((row) => row.avg_salary), [
    100000000.01,
    1.01,
  ]);
});

test('groups salary distribution into five equal-width bands per country', async () => {
  const service = createInsightsService({
    async getDistribution() {
      return [
        { country: 'United States', currency: 'USD', min_salary: '50000', max_salary: '100000', band_index: 0, headcount: 1 },
        { country: 'United States', currency: 'USD', min_salary: '50000', max_salary: '100000', band_index: 2, headcount: 2 },
        { country: 'United States', currency: 'USD', min_salary: '50000', max_salary: '100000', band_index: 4, headcount: 1 },
        { country: 'India', currency: 'INR', min_salary: '1000000', max_salary: '2000000', band_index: 1, headcount: 3 },
      ];
    },
  });

  const bands = await service.getDistribution();
  const usBands = bands.filter((band) => band.country === 'United States');
  const indiaBands = bands.filter((band) => band.country === 'India');

  assert.equal(usBands.length, 5);
  assert.equal(indiaBands.length, 5);
  assert.deepEqual(usBands.map((band) => band.headcount), [1, 0, 2, 0, 1]);
  assert.deepEqual(indiaBands.map((band) => band.headcount), [0, 3, 0, 0, 0]);
  assert.equal(usBands.reduce((total, band) => total + band.headcount, 0), 4);
  assert.equal(indiaBands.reduce((total, band) => total + band.headcount, 0), 3);
});

test('assigns every salary to exactly one valid band, including endpoints and equal ranges', () => {
  assert.deepEqual(
    [50, 60, 70, 80, 90, 100].map((salary) => getSalaryBandIndex(salary, 50, 100)),
    [0, 1, 2, 3, 4, 4],
  );
  assert.equal(getSalaryBandIndex(75, 75, 75), 0);
});

test('passes country filters to the repository and shapes summary values', async () => {
  const calls = [];
  const service = createInsightsService({
    async getSummary() {
      return { headcount: '12', countriesCount: '3', departmentsCount: '4' };
    },
    async getByGroup(groupBy, country) {
      calls.push({ groupBy, country });
      return [statRow];
    },
  });

  assert.deepEqual(await service.getSummary(), {
    headcount: 12,
    countriesCount: 3,
    departmentsCount: 4,
  });
  await service.getByDepartment('India');
  await service.getByJobTitle('Japan');
  assert.deepEqual(calls, [
    { groupBy: 'department', country: 'India' },
    { groupBy: 'jobTitle', country: 'Japan' },
  ]);
});

test('parameterizes country filters and whitelists grouped SQL identifiers', async () => {
  const calls = [];
  const repository = createInsightsRepository({
    $queryRaw(query) {
      calls.push(query);
      return Promise.resolve([]);
    },
  });
  const hostileCountry = "India' OR TRUE --";

  await repository.getByGroup('jobTitle', hostileCountry);
  const query = calls[0];
  assert.ok(query.values.includes(hostileCountry));
  assert.ok(!query.sql.includes(hostileCountry));
  assert.match(query.sql, /percentile_cont\(0\.5\) WITHIN GROUP \(ORDER BY salary\)/);
  assert.match(query.sql, /ROUND\(AVG\(salary\)::numeric, 2\)/);
  assert.throws(() => repository.getByGroup('salary; DROP TABLE employees', undefined), /Unsupported/);

  await repository.getDistribution(hostileCountry);
  const distributionQuery = calls[1];
  assert.ok(distributionQuery.values.includes(hostileCountry));
  assert.ok(!distributionQuery.sql.includes(hostileCountry));
  assert.match(distributionQuery.sql, /FLOOR/);
  assert.match(distributionQuery.sql, /ranges\.min_salary = ranges\.max_salary/);
});

test('serves summary, grouped, country, and distribution insight routes with a fake repository', async () => {
  const calls = [];
  const repository = {
    async getSummary() {
      return { headcount: '8', countriesCount: '2', departmentsCount: '3' };
    },
    async getByCountry() {
      return [statRow];
    },
    async getByGroup(groupBy, country) {
      calls.push({ groupBy, country });
      return [statRow];
    },
    async getDistribution(country) {
      calls.push({ distributionCountry: country });
      return [
        { country: 'United States', currency: 'USD', min_salary: '50000', max_salary: '100000', band_index: 0, headcount: 2 },
      ];
    },
  };
  const app = createApp({ insightsRepository: repository });

  const summary = await request(app).get('/api/insights/summary').expect(200);
  assert.deepEqual(summary.body, { headcount: 8, countriesCount: 2, departmentsCount: 3 });
  const byCountry = await request(app).get('/api/insights/by-country').expect(200);
  assert.equal(byCountry.body[0].avg_salary, 75000.13);
  const byDepartment = await request(app).get('/api/insights/by-department?country=India').expect(200);
  assert.equal(byDepartment.body[0].country, 'United States');
  const byJobTitle = await request(app).get('/api/insights/by-job-title?country=Japan').expect(200);
  assert.equal(byJobTitle.body[0].headcount, 3);
  const distribution = await request(app).get('/api/insights/distribution?country=United%20States').expect(200);
  assert.equal(distribution.body.length, 5);
  assert.deepEqual(calls, [
    { groupBy: 'department', country: 'India' },
    { groupBy: 'jobTitle', country: 'Japan' },
    { distributionCountry: 'United States' },
  ]);
});
