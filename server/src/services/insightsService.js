function toNumber(value, field) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    throw new TypeError(`Insight field "${field}" must be a finite number.`);
  }
  return number;
}

function roundToCents(value) {
  const decimal = String(value);
  const match = decimal.match(/^(-?)(\d+)(?:\.(\d*))?$/);
  if (!match) {
    throw new TypeError('Average salary must use a finite decimal representation.');
  }

  const fraction = match[3] || '';
  let cents = BigInt(match[2]) * 100n + BigInt(fraction.padEnd(2, '0').slice(0, 2));
  if (fraction.length > 2 && fraction[2] >= '5') cents += 1n;
  if (match[1]) cents *= -1n;
  return Number(cents) / 100;
}

function mapStatRow(row) {
  return {
    ...row,
    headcount: toNumber(row.headcount, 'headcount'),
    min_salary: toNumber(row.min_salary, 'min_salary'),
    max_salary: toNumber(row.max_salary, 'max_salary'),
    avg_salary: roundToCents(toNumber(row.avg_salary, 'avg_salary')),
    median_salary: toNumber(row.median_salary, 'median_salary'),
  };
}

function getSalaryBandIndex(salary, minimum, maximum) {
  const value = toNumber(salary, 'salary');
  const min = toNumber(minimum, 'minimum salary');
  const max = toNumber(maximum, 'maximum salary');
  if (max < min || value < min || value > max) {
    throw new RangeError('Salary must fall within a valid country salary range.');
  }
  if (max === min) return 0;
  return Math.min(4, Math.floor(((value - min) / (max - min)) * 5));
}

function formatBound(value) {
  return value.toLocaleString('en-US', { maximumFractionDigits: 2 });
}

function buildSalaryBands(rows) {
  const groups = new Map();
  for (const row of rows) {
    const key = JSON.stringify([row.country, row.currency]);
    let group = groups.get(key);
    if (!group) {
      group = {
        country: row.country,
        currency: row.currency,
        min_salary: toNumber(row.min_salary, 'min_salary'),
        max_salary: toNumber(row.max_salary, 'max_salary'),
        counts: [0, 0, 0, 0, 0],
      };
      groups.set(key, group);
    }

    const bandIndex = toNumber(row.band_index, 'band_index');
    if (!Number.isInteger(bandIndex) || bandIndex < 0 || bandIndex > 4) {
      throw new RangeError('Salary band index must be an integer from 0 through 4.');
    }
    group.counts[bandIndex] += toNumber(row.headcount, 'headcount');
  }

  const bands = [];
  for (const group of groups.values()) {
    const width = (group.max_salary - group.min_salary) / 5;
    for (let bandIndex = 0; bandIndex < 5; bandIndex += 1) {
      const lowerBound = group.min_salary + width * bandIndex;
      const upperBound = bandIndex === 4 ? group.max_salary : group.min_salary + width * (bandIndex + 1);
      bands.push({
        country: group.country,
        currency: group.currency,
        band: `${formatBound(lowerBound)} – ${formatBound(upperBound)}`,
        bandIndex,
        lowerBound,
        upperBound,
        headcount: group.counts[bandIndex],
      });
    }
  }
  return bands;
}

function createInsightsService(repository) {
  return {
    async getSummary() {
      const row = await repository.getSummary();
      return {
        headcount: toNumber(row.headcount, 'headcount'),
        countriesCount: toNumber(row.countriesCount, 'countriesCount'),
        departmentsCount: toNumber(row.departmentsCount, 'departmentsCount'),
      };
    },
    async getByCountry() {
      return (await repository.getByCountry()).map(mapStatRow);
    },
    async getByDepartment(country) {
      return (await repository.getByGroup('department', country)).map(mapStatRow);
    },
    async getByJobTitle(country) {
      return (await repository.getByGroup('jobTitle', country)).map(mapStatRow);
    },
    async getDistribution(country) {
      return buildSalaryBands(await repository.getDistribution(country));
    },
  };
}

module.exports = { createInsightsService, getSalaryBandIndex, buildSalaryBands };
