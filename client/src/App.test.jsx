import { act, fireEvent, render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import * as api from './api'

vi.mock('./api', () => ({
  createEmployee: vi.fn(),
  deleteEmployee: vi.fn(),
  getCountryInsights: vi.fn(),
  getDistribution: vi.fn(),
  getEmployees: vi.fn(),
  getFilters: vi.fn(),
  getGroupedInsights: vi.fn(),
  getSummary: vi.fn(),
  updateEmployee: vi.fn(),
}))

function renderEmployees() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })
  const result = render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/employees']}>
        <App />
      </MemoryRouter>
    </QueryClientProvider>,
  )
  return { ...result, queryClient }
}

describe('Employees page', () => {
  beforeEach(() => {
    api.getEmployees.mockResolvedValue({
      data: [{
        id: 'employee-1',
        fullName: 'Taylor Morgan',
        email: 'taylor@example.com',
        jobTitle: 'Analyst',
        department: 'Finance',
        country: 'India',
        currency: 'INR',
        salary: '1234.56',
        hireDate: '2024-02-29T00:00:00.000Z',
      }],
      pagination: { page: 1, pageSize: 25, total: 1, totalPages: 1 },
    })
    api.getFilters.mockResolvedValue({
      countries: ['India'],
      supportedCountries: [{ country: 'India', currency: 'INR' }],
      departments: ['Finance'],
      jobTitles: ['Analyst'],
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders employees and calls the API with the debounced search term', async () => {
    const { queryClient, unmount } = renderEmployees()

    expect(await screen.findByText('Taylor Morgan')).toBeInTheDocument()
    vi.useFakeTimers()
    const search = screen.getByRole('searchbox', { name: 'Search employees' })
    fireEvent.change(search, { target: { value: 'Taylor' } })
    await act(async () => {
      vi.advanceTimersByTime(300)
    })

    expect(api.getEmployees).toHaveBeenCalledWith(
      expect.stringContaining('search=Taylor'),
      expect.any(AbortSignal),
    )

    unmount()
    queryClient.clear()
  })
})
