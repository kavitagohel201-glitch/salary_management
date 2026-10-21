export function formatCurrency(value, currency, locale = 'en') {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: currency === 'JPY' ? 0 : 2,
  }).format(Number(value))
}
