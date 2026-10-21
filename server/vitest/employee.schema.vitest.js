import { describe, expect, it } from 'vitest';
import { employeeInputSchema } from '../src/schemas/employee.schema.js';

const validEmployee = {
  fullName: 'Taylor Morgan',
  email: 'taylor.morgan@example.com',
  jobTitle: 'People Analyst',
  department: 'Human Resources',
  country: 'United States',
  currency: 'USD',
  salary: 85000.5,
  hireDate: '2024-02-29',
};

const tomorrow = () => {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
};

describe('employeeInputSchema', () => {
  it('accepts valid employee input', () => {
    expect(employeeInputSchema.safeParse(validEmployee).success).toBe(true);
  });

  it('accepts full names from 1 through 150 characters', () => {
    expect(employeeInputSchema.safeParse({ ...validEmployee, fullName: 'A' }).success).toBe(true);
    expect(employeeInputSchema.safeParse({ ...validEmployee, fullName: 'A'.repeat(150) }).success).toBe(true);
  });

  it('rejects empty and overlong full names', () => {
    expect(employeeInputSchema.safeParse({ ...validEmployee, fullName: '' }).success).toBe(false);
    expect(employeeInputSchema.safeParse({ ...validEmployee, fullName: 'A'.repeat(151) }).success).toBe(false);
  });

  it('rejects invalid email addresses', () => {
    expect(employeeInputSchema.safeParse({ ...validEmployee, email: 'not-an-email' }).success).toBe(false);
  });

  it.each(['jobTitle', 'department', 'country'])('rejects an empty %s', (field) => {
    expect(employeeInputSchema.safeParse({ ...validEmployee, [field]: ' ' }).success).toBe(false);
  });

  it('requires currency to be three uppercase letters', () => {
    for (const currency of ['usD', 'US', 'USDD', 'U1D']) {
      expect(employeeInputSchema.safeParse({ ...validEmployee, currency }).success).toBe(false);
    }
  });

  it('accepts a positive numeric salary with at most two decimal places below 100,000,000', () => {
    expect(employeeInputSchema.safeParse({ ...validEmployee, salary: 99999999.99 }).success).toBe(true);
  });

  it.each([0, -1, 100000000, 1.001, '85000.50'])('rejects invalid salary %s', (salary) => {
    expect(employeeInputSchema.safeParse({ ...validEmployee, salary }).success).toBe(false);
  });

  it('rejects malformed, impossible, and future hire dates', () => {
    for (const hireDate of ['not-a-date', '2025-02-29', tomorrow()]) {
      expect(employeeInputSchema.safeParse({ ...validEmployee, hireDate }).success).toBe(false);
    }
  });
});
