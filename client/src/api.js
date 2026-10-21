const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  })

  if (response.status === 204) return null

  const payload = await response.json()
  if (!response.ok) {
    throw new Error(payload.error || `Request failed (${response.status})`)
  }
  return payload
}

export function getEmployees(params, signal) {
  return request(`/employees?${params}`, { signal })
}

export function getFilters(signal) {
  return request('/meta/filters', { signal })
}

export function getSummary(signal) {
  return request('/insights/summary', { signal })
}

export function getCountryInsights(signal) {
  return request('/insights/by-country', { signal })
}

export function getGroupedInsights(group, country, signal) {
  const params = new URLSearchParams()
  if (country) params.set('country', country)
  return request(`/insights/by-${group}${params.size ? `?${params}` : ''}`, { signal })
}

export function getDistribution(country, signal) {
  const params = new URLSearchParams()
  if (country) params.set('country', country)
  return request(`/insights/distribution${params.size ? `?${params}` : ''}`, { signal })
}

export function createEmployee(employee) {
  return request('/employees', { method: 'POST', body: JSON.stringify(employee) })
}

export function updateEmployee(id, employee) {
  return request(`/employees/${id}`, { method: 'PUT', body: JSON.stringify(employee) })
}

export function deleteEmployee(id) {
  return request(`/employees/${id}`, { method: 'DELETE' })
}
