import { describe, expect, it } from 'vitest'
import { formatCurrency } from './currency'

describe('formatCurrency', () => {
  it.each([
    ['INR', '₹1,234.56'],
    ['USD', '$1,234.56'],
    ['EUR', '€1,234.56'],
  ])('formats %s amounts', (currency, expected) => {
    expect(formatCurrency(1234.56, currency)).toBe(expected)
  })
})
