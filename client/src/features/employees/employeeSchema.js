import { z } from 'zod'

const calendarDate = /^\d{4}-\d{2}-\d{2}$/
const supportedCountries = new Set([
  'Australia',
  'Brazil',
  'Canada',
  'France',
  'Germany',
  'India',
  'Japan',
  'Singapore',
  'United Kingdom',
  'United States',
])

export const employeeSchema = z.object({
  fullName: z.string().trim().min(1, 'Full name is required.').max(150, 'Full name must be 150 characters or fewer.'),
  email: z.string().trim().email('Enter a valid email address.').max(200, 'Email must be 200 characters or fewer.'),
  jobTitle: z.string().trim().min(1, 'Job title is required.').max(100, 'Job title must be 100 characters or fewer.'),
  department: z.string().trim().min(1, 'Department is required.').max(100, 'Department must be 100 characters or fewer.'),
  country: z.string().trim().min(1, 'Country is required.').max(100)
    .refine((value) => supportedCountries.has(value), 'Select a supported country.'),
  salary: z.string()
    .trim()
    .regex(/^\d{1,10}(?:\.\d{1,2})?$/, 'Enter a positive salary with at most two decimal places.')
    .refine((value) => Number(value) > 0, 'Salary must be greater than zero.'),
  hireDate: z.string().regex(calendarDate, 'Enter a valid hire date in YYYY-MM-DD format.')
    .refine((value) => {
      if (!calendarDate.test(value)) return false
      const date = new Date(`${value}T00:00:00.000Z`)
      return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
    }, 'Enter a valid calendar date.'),
})
