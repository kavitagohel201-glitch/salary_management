import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import EmployeeDialog from './components/EmployeeDialog'
const InsightsCharts = lazy(() => import('./features/insights/InsightsCharts'))
import {
  createEmployee,
  deleteEmployee,
  getCountryInsights,
  getDistribution,
  getEmployees,
  getFilters,
  getGroupedInsights,
  getSummary,
  updateEmployee,
} from './api'
import { formatCurrency } from './utils/currency'
import './App.css'

const PAGE_SIZE = 25
const EMPTY_FILTERS = { countries: [], supportedCountries: [], departments: [], jobTitles: [] }
const SORTABLE_FIELDS = ['fullName', 'salary', 'hireDate', 'country', 'department', 'jobTitle', 'email', 'createdAt']

function getSupportedCountries(filters) {
  if (Array.isArray(filters.supportedCountries)) return filters.supportedCountries
  return (filters.countries || []).map((country) => ({ country, currency: '' }))
}

function formatDate(value) {
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' })
    .format(new Date(`${value.slice(0, 10)}T00:00:00`))
}

function Icon({ name, size = 18 }) {
  const paths = {
    people: <><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="10" cy="7" r="4" /><path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>,
    globe: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" /></>,
    layers: <><path d="m12 3 9 5-9 5-9-5 9-5Z" /><path d="m3 12 9 5 9-5M3 16l9 5 9-5" /></>,
    chart: <><path d="M3 3v18h18M18 17V9M13 17V5M8 17v-3" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    chevron: <path d="m9 18 6-6-6-6" />,
    edit: <><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z" /></>,
    trash: <><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v5M14 11v5" /></>,
    close: <><path d="m18 6-12 12M6 6l12 12" /></>,
    sort: <><path d="m8 7 4-4 4 4M12 3v18M16 17l-4 4-4-4" /></>,
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name]}
    </svg>
  )
}

function SummaryCard({ title, value, note, icon, tone }) {
  return (
    <article className="summary-card">
      <div className={`summary-icon ${tone}`}><Icon name={icon} size={19} /></div>
      <p className="summary-title">{title}</p>
      <div className="summary-value">{value}</div>
      <p className="summary-note">{note}</p>
    </article>
  )
}

function EmployeeSearchBox({ initialValue, onSearch }) {
  const [value, setValue] = useState(initialValue)

  useEffect(() => {
    if (value === initialValue) return undefined
    const timeout = window.setTimeout(() => onSearch(value), 250)
    return () => window.clearTimeout(timeout)
  }, [initialValue, onSearch, value])

  return (
    <label className="search-box">
      <Icon name="search" />
      <input
        type="search"
        aria-label="Search employees"
        placeholder="Search by name or email..."
        value={value}
        onChange={(event) => setValue(event.target.value)}
      />
      {value && <button type="button" aria-label="Clear search" onClick={() => setValue('')}>
        <Icon name="close" size={15} />
      </button>}
    </label>
  )
}

function App() {
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const queryClient = useQueryClient()
  const isEmployeesPage = location.pathname === '/employees'
  const filters = useMemo(() => ({
    search: searchParams.get('search') || '',
    country: searchParams.get('country') || '',
    department: searchParams.get('department') || '',
    jobTitle: searchParams.get('jobTitle') || '',
  }), [searchParams])
  const page = Math.max(1, Number.parseInt(searchParams.get('page') || '1', 10) || 1)
  const sort = useMemo(() => ({
    sortBy: SORTABLE_FIELDS.includes(searchParams.get('sortBy')) ? searchParams.get('sortBy') : 'fullName',
    sortOrder: searchParams.get('sortOrder') === 'desc' ? 'desc' : 'asc',
  }), [searchParams])
  const [insightCountry, setInsightCountry] = useState(null)
  const [insightTab, setInsightTab] = useState('department')
  const [dialogEmployee, setDialogEmployee] = useState(undefined)
  const [employeeToDelete, setEmployeeToDelete] = useState(null)
  const [snackbar, setSnackbar] = useState('')

  const employeeParams = useMemo(() => {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(PAGE_SIZE),
      sortBy: sort.sortBy,
      sortOrder: sort.sortOrder,
    })
    for (const [key, value] of Object.entries(filters)) {
      if (value) params.set(key, value)
    }
    return params.toString()
  }, [filters, page, sort])

  const employeesQuery = useQuery({
    queryKey: ['employees', employeeParams],
    queryFn: ({ signal }) => getEmployees(employeeParams, signal),
    placeholderData: keepPreviousData,
  })
  const filtersQuery = useQuery({
    queryKey: ['filters'],
    queryFn: ({ signal }) => getFilters(signal),
    staleTime: 5 * 60 * 1000,
  })
  const filterOptions = filtersQuery.data || EMPTY_FILTERS
  const activeInsightCountry = insightCountry === null ? filterOptions.countries[0] || '' : insightCountry
  const summaryQuery = useQuery({
    queryKey: ['insights', 'summary'],
    queryFn: ({ signal }) => getSummary(signal),
    enabled: !isEmployeesPage,
  })
  const countryInsightsQuery = useQuery({
    queryKey: ['insights', 'by-country'],
    queryFn: ({ signal }) => getCountryInsights(signal),
    enabled: !isEmployeesPage,
  })
  const groupInsightsQuery = useQuery({
    queryKey: ['insights', insightTab, activeInsightCountry],
    queryFn: ({ signal }) => getGroupedInsights(insightTab, activeInsightCountry, signal),
    enabled: !isEmployeesPage,
  })
  const distributionQuery = useQuery({
    queryKey: ['insights', 'distribution', activeInsightCountry],
    queryFn: ({ signal }) => getDistribution(activeInsightCountry, signal),
    enabled: !isEmployeesPage,
  })

  const saveMutation = useMutation({
    mutationFn: async (employee) => {
      if (dialogEmployee) return updateEmployee(dialogEmployee.id, employee)
      return createEmployee(employee)
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['employees'] }),
        queryClient.invalidateQueries({ queryKey: ['insights'] }),
        queryClient.invalidateQueries({ queryKey: ['filters'] }),
      ])
      setSnackbar(dialogEmployee ? 'Employee updated.' : 'Employee added.')
    },
  })
  const deleteMutation = useMutation({
    mutationFn: (employee) => deleteEmployee(employee.id),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['employees'] }),
        queryClient.invalidateQueries({ queryKey: ['insights'] }),
        queryClient.invalidateQueries({ queryKey: ['filters'] }),
      ])
      setEmployeeToDelete(null)
      setSnackbar('Employee deleted.')
    },
  })

  const employees = employeesQuery.data || { data: [], pagination: { total: 0, totalPages: 0 } }
  const summary = summaryQuery.data
  const countryInsights = countryInsightsQuery.data || []
  const groupInsights = groupInsightsQuery.data || []
  const distribution = distributionQuery.data || []
  const maxBandCount = Math.max(1, ...distribution.map((item) => item.headcount))
  const chartGroups = groupInsights.map((item) => ({
    name: item.group_name,
    country: item.country,
    currency: item.currency,
    average: item.avg_salary,
    median: item.median_salary,
  }))
  const distributionChart = distribution.map((item) => ({
    name: `${item.band} ${item.currency}${activeInsightCountry ? '' : ` · ${item.country}`}`,
    country: item.country,
    currency: item.currency,
    headcount: item.headcount,
    midpoint: (item.lowerBound + item.upperBound) / 2,
  }))
  const pageInfo = employees.pagination
  const pageCount = Math.max(1, pageInfo.totalPages || 1)
  const supportedCountries = getSupportedCountries(filterOptions)
  const dataError = employeesQuery.error || filtersQuery.error || summaryQuery.error
    || countryInsightsQuery.error || groupInsightsQuery.error || distributionQuery.error
  const tableLoading = employeesQuery.isLoading || (employeesQuery.isFetching && !employeesQuery.data)

  const updateSearch = useCallback((value) => {
    const nextParams = new URLSearchParams(searchParams)
    if (value.trim()) nextParams.set('search', value.trim())
    else nextParams.delete('search')
    nextParams.delete('page')
    setSearchParams(nextParams, { replace: true })
  }, [searchParams, setSearchParams])

  function updateFilter(key, value) {
    const nextParams = new URLSearchParams(searchParams)
    if (value) nextParams.set(key, value)
    else nextParams.delete(key)
    nextParams.delete('page')
    setSearchParams(nextParams, { replace: true })
  }

  function toggleSort(field) {
    const nextParams = new URLSearchParams(searchParams)
    const nextSortOrder = sort.sortBy === field && sort.sortOrder === 'asc' ? 'desc' : 'asc'
    nextParams.set('sortBy', field)
    nextParams.set('sortOrder', nextSortOrder)
    nextParams.delete('page')
    setSearchParams(nextParams, { replace: true })
  }

  async function saveEmployee(employee) {
    await saveMutation.mutateAsync(employee)
  }

  async function removeEmployee() {
    try {
      await deleteMutation.mutateAsync(employeeToDelete)
    } catch (error) {
      setSnackbar(error.message || 'Unable to delete employee.')
    }
  }

  const filterCount = [filters.country, filters.department, filters.jobTitle].filter(Boolean).length

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link className="brand" to="/insights" aria-label="ACME People home">
          <span className="brand-mark">a<span>.</span></span>
          <span className="brand-name">acme<span>people</span></span>
        </Link>
        <div className="workspace-label">WORKSPACE</div>
        <nav aria-label="Main navigation">
          <Link className={`nav-item${!isEmployeesPage ? ' active' : ''}`} to="/insights"><Icon name="chart" />Insights</Link>
          <Link className={`nav-item${isEmployeesPage ? ' active' : ''}`} to="/employees"><Icon name="people" />Employees<span className="nav-count">{summary?.headcount?.toLocaleString() || '—'}</span></Link>
        </nav>
        <div className="sidebar-bottom">
          <div className="avatar">HR</div>
          <div><strong>HR Manager view</strong><span>People & culture</span></div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumb">Workspace <span>/</span> <strong>{isEmployeesPage ? 'Employees' : 'Insights'}</strong></div>
          <div className="topbar-right"><span className="privacy-badge">Salary data</span><div className="top-avatar">HR</div></div>
        </header>

        <div className="page-content">
          <section className="page-heading">
            <div>
              <p className="eyebrow">{isEmployeesPage ? 'PEOPLE DIRECTORY' : 'PEOPLE ANALYTICS'}</p>
              <h1>{isEmployeesPage ? 'Employees' : 'Salary insights'}</h1>
              <p className="page-subtitle">{isEmployeesPage ? 'Search, filter and manage employee records.' : 'A clear picture of how your organization pays people.'}</p>
            </div>
            {isEmployeesPage && <button className="button button-primary add-button" type="button" disabled={!supportedCountries.length} onClick={() => setDialogEmployee(null)}>
              <Icon name="plus" /> Add employee
            </button>}
          </section>

          {dataError && <div className="error-banner" role="alert">
            <span>{dataError.message}</span>
            <button type="button" onClick={() => {
              employeesQuery.refetch()
              filtersQuery.refetch()
              summaryQuery.refetch()
              countryInsightsQuery.refetch()
              groupInsightsQuery.refetch()
              distributionQuery.refetch()
            }}>Retry</button>
          </div>}

          {!isEmployeesPage && <section className="summary-grid" aria-label="Organization summary">
            <SummaryCard title="Total headcount" value={summary?.headcount?.toLocaleString() ?? '—'} note="Across the organization" icon="people" tone="purple" />
            <SummaryCard title="Countries" value={summary?.countriesCount ?? '—'} note="Locations represented" icon="globe" tone="blue" />
            <SummaryCard title="Departments" value={summary?.departmentsCount ?? '—'} note="Teams across ACME" icon="layers" tone="orange" />
          </section>}

          {!isEmployeesPage && <section className="insights-layout" aria-label="Salary insights">
            <article className="panel country-panel">
              <div className="panel-heading">
                <div><p className="eyebrow">COMPENSATION</p><h2>By country</h2></div>
                <span className="heading-icon"><Icon name="globe" /></span>
              </div>
              <div className="table-scroll">
                <table className="insights-table">
                  <thead><tr><th>Country</th><th>Currency</th><th>People</th><th>Minimum</th><th>Maximum</th><th>Average</th><th>Median</th></tr></thead>
                  <tbody>
                    {countryInsights.map((item) => (
                      <tr key={item.country}>
                        <td><span className="country-dot" />{item.country}</td>
                        <td>{item.currency}</td>
                        <td>{item.headcount.toLocaleString()}</td>
                        <td>{formatCurrency(item.min_salary, item.currency)}</td>
                        <td>{formatCurrency(item.max_salary, item.currency)}</td>
                        <td className="strong-cell">{formatCurrency(item.avg_salary, item.currency)}</td>
                        <td>{formatCurrency(item.median_salary, item.currency)}</td>
                      </tr>
                    ))}
                    {countryInsightsQuery.isLoading && <tr><td colSpan="7" className="empty-inline">Loading country insights…</td></tr>}
                    {!countryInsightsQuery.isLoading && !countryInsights.length && <tr><td colSpan="7" className="empty-inline">No salary data yet.</td></tr>}
                  </tbody>
                </table>
              </div>
              <p className="panel-footnote">Averages, medians, and ranges are calculated within each country and currency.</p>
            </article>

            <article className="panel distribution-panel">
              <div className="panel-heading">
                <div><p className="eyebrow">SALARY MIX</p><h2>Salary distribution</h2></div>
                <label className="compact-select-label">
                  <span className="sr-only">Distribution country</span>
                  <select value={activeInsightCountry} onChange={(event) => setInsightCountry(event.target.value)}>
                    <option value="">All countries</option>
                    {filterOptions.countries.map((country) => <option key={country}>{country}</option>)}
                  </select>
                </label>
              </div>
              <div className="band-list">
                {distribution.map((item) => (
                  <div className="band-row" key={`${item.country}-${item.band}`}>
                    <div className="band-title"><span>{item.band} {item.currency}</span>{!activeInsightCountry && <small>{item.country}</small>}</div>
                    <div className="band-track"><span style={{ width: `${Math.max(3, item.headcount / maxBandCount * 100)}%` }} /></div>
                    <strong>{item.headcount.toLocaleString()}</strong>
                  </div>
                ))}
                {distributionQuery.isLoading && <p className="empty-inline">Loading salary bands…</p>}
                {!distributionQuery.isLoading && !distribution.length && <p className="empty-inline">Salary bands will appear when employees are added.</p>}
              </div>
              <p className="panel-footnote">Five equal-width salary bands are calculated separately for each country.</p>
            </article>
          </section>}

          {!isEmployeesPage && <section className="panel group-panel" aria-label="Salary insights by group">
            <div className="panel-heading group-heading">
              <div><p className="eyebrow">DEEP DIVE</p><h2>Salary by team & role</h2></div>
              <label className="compact-select-label">
                <span className="sr-only">Limit insights to country</span>
                <select value={activeInsightCountry} onChange={(event) => setInsightCountry(event.target.value)}>
                  <option value="">All countries</option>
                  {filterOptions.countries.map((country) => <option key={country}>{country}</option>)}
                </select>
              </label>
            </div>
            <div className="tab-bar" role="tablist" aria-label="Insight grouping">
              <button role="tab" aria-selected={insightTab === 'department'} className={insightTab === 'department' ? 'selected' : ''} onClick={() => setInsightTab('department')}>By department</button>
              <button role="tab" aria-selected={insightTab === 'job-title'} className={insightTab === 'job-title' ? 'selected' : ''} onClick={() => setInsightTab('job-title')}>By job title</button>
            </div>
            <div className="table-scroll">
              <table className="group-table">
                <thead><tr><th>{insightTab === 'department' ? 'Department' : 'Job title'}</th><th>Country</th><th>Headcount</th><th>Minimum</th><th>Maximum</th><th>Average</th><th>Median</th></tr></thead>
                <tbody>
                  {groupInsights.map((item) => (
                    <tr key={`${item.country}-${item.group_name}`}>
                      <td className="strong-cell">{item.group_name}</td><td>{item.country}</td>
                      <td>{item.headcount.toLocaleString()}</td>
                      <td>{formatCurrency(item.min_salary, item.currency)}</td>
                      <td>{formatCurrency(item.max_salary, item.currency)}</td>
                      <td>{formatCurrency(item.avg_salary, item.currency)}</td>
                      <td>{formatCurrency(item.median_salary, item.currency)}</td>
                    </tr>
                  ))}
                  {groupInsightsQuery.isLoading && <tr><td colSpan="7" className="empty-inline">Loading group insights…</td></tr>}
                  {!groupInsightsQuery.isLoading && !groupInsights.length && <tr><td colSpan="7" className="empty-inline">No matching insight data.</td></tr>}
                </tbody>
              </table>
            </div>
          </section>}

          {!isEmployeesPage && <Suspense fallback={<p className="chart-state">Loading charts…</p>}>
            <InsightsCharts
              chartGroups={chartGroups}
              distributionChart={distributionChart}
              groupLoading={groupInsightsQuery.isLoading}
              distributionLoading={distributionQuery.isLoading}
              insightTab={insightTab}
              insightCountry={activeInsightCountry}
            />
          </Suspense>}

          {isEmployeesPage && <section className="panel employees-panel" id="employees">
            <div className="panel-heading employees-heading">
              <div><p className="eyebrow">DIRECTORY</p><h2>Employees <span className="employee-total">{pageInfo.total?.toLocaleString() ?? 0}</span></h2></div>
              <button className="button button-outline add-button-small" type="button" disabled={!supportedCountries.length} onClick={() => setDialogEmployee(null)}><Icon name="plus" /> Add employee</button>
            </div>
            <div className="toolbar">
              <EmployeeSearchBox key={location.key} initialValue={filters.search} onSearch={updateSearch} />
              <span className="filter-label">{filterCount ? `${filterCount} filter${filterCount === 1 ? '' : 's'} active` : 'Filter by'}</span>
              <label><span className="sr-only">Filter by country</span><select value={filters.country} onChange={(event) => updateFilter('country', event.target.value)}><option value="">All countries</option>{filterOptions.countries.map((item) => <option key={item}>{item}</option>)}</select></label>
              <label><span className="sr-only">Filter by department</span><select value={filters.department} onChange={(event) => updateFilter('department', event.target.value)}><option value="">All departments</option>{filterOptions.departments.map((item) => <option key={item}>{item}</option>)}</select></label>
              <label><span className="sr-only">Filter by job title</span><select value={filters.jobTitle} onChange={(event) => updateFilter('jobTitle', event.target.value)}><option value="">All job titles</option>{filterOptions.jobTitles.map((item) => <option key={item}>{item}</option>)}</select></label>
              {filterCount > 0 && <button className="clear-filters" type="button" onClick={() => {
                const nextParams = new URLSearchParams(searchParams)
                nextParams.delete('country')
                nextParams.delete('department')
                nextParams.delete('jobTitle')
                nextParams.delete('page')
                setSearchParams(nextParams, { replace: true })
              }}>Clear</button>}
            </div>
            <div className="table-scroll employee-scroll">
              <table className="employee-table">
                <thead><tr>
                  <th><button onClick={() => toggleSort('fullName')}>Employee <Icon name="sort" size={13} /></button></th>
                  <th><button onClick={() => toggleSort('jobTitle')}>Role & department <Icon name="sort" size={13} /></button></th>
                  <th><button onClick={() => toggleSort('country')}>Country <Icon name="sort" size={13} /></button></th>
                  <th><button onClick={() => toggleSort('salary')}>Annual salary <Icon name="sort" size={13} /></button></th>
                  <th><button onClick={() => toggleSort('hireDate')}>Hire date <Icon name="sort" size={13} /></button></th>
                  <th><span className="sr-only">Actions</span></th>
                </tr></thead>
                <tbody>
                  {employees.data.map((employee, index) => (
                    <tr key={employee.id}>
                      <td><div className="person-cell"><span className={`person-avatar avatar-${index % 6}`}>{employee.fullName.split(/\s+/).map((part) => part[0]).slice(0, 2).join('').toUpperCase()}</span><span><strong>{employee.fullName}</strong><small>{employee.email}</small></span></div></td>
                      <td><strong className="role-title">{employee.jobTitle}</strong><small className="secondary-cell">{employee.department}</small></td>
                      <td><span className="country-cell"><span className="country-dot" />{employee.country}</span></td>
                      <td className="salary-cell">{formatCurrency(employee.salary, employee.currency)}</td>
                      <td>{formatDate(employee.hireDate)}</td>
                      <td><div className="row-actions">
                        <button type="button" aria-label={`Edit ${employee.fullName}`} title="Edit employee" onClick={() => setDialogEmployee(employee)}><Icon name="edit" size={16} /></button>
                        <button type="button" aria-label={`Delete ${employee.fullName}`} title="Delete employee" onClick={() => setEmployeeToDelete(employee)}><Icon name="trash" size={16} /></button>
                      </div></td>
                    </tr>
                  ))}
                  {!tableLoading && !employees.data.length && <tr><td colSpan="6" className="empty-state"><span className="empty-icon"><Icon name="people" size={23} /></span><strong>No employees found</strong><span>Try changing your search or filters.</span></td></tr>}
                  {tableLoading && <tr><td colSpan="6" className="loading-state">Loading employee records…</td></tr>}
                </tbody>
              </table>
            </div>
            <footer className="pagination">
              <span>Showing <strong>{pageInfo.total ? ((page - 1) * PAGE_SIZE) + 1 : 0}–{Math.min(page * PAGE_SIZE, pageInfo.total || 0)}</strong> of <strong>{pageInfo.total?.toLocaleString() ?? 0}</strong> employees</span>
              <div>
                <button type="button" className="page-button" disabled={page <= 1 || employeesQuery.isFetching} onClick={() => {
                  const nextParams = new URLSearchParams(searchParams)
                  if (page === 2) nextParams.delete('page')
                  else nextParams.set('page', String(page - 1))
                  setSearchParams(nextParams, { replace: true })
                }} aria-label="Previous page">‹</button>
                <span>Page <strong>{page}</strong> of <strong>{pageCount}</strong></span>
                <button type="button" className="page-button" disabled={page >= pageCount || employeesQuery.isFetching} onClick={() => {
                  const nextParams = new URLSearchParams(searchParams)
                  nextParams.set('page', String(page + 1))
                  setSearchParams(nextParams, { replace: true })
                }} aria-label="Next page">›</button>
              </div>
            </footer>
          </section>}
          <footer className="page-footer"><span>ACME People · Salary insights</span><span>Salary metrics are reported in each country’s local currency.</span></footer>
        </div>
      </main>
      {dialogEmployee !== undefined && (
        <EmployeeDialog
          employee={dialogEmployee}
          filters={filterOptions}
          onClose={() => setDialogEmployee(undefined)}
          onSave={saveEmployee}
        />
      )}
      {employeeToDelete && <div className="dialog-backdrop" role="presentation">
        <section className="confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="delete-title">
          <h2 id="delete-title">Delete employee?</h2>
          <p>Delete {employeeToDelete.fullName}’s employee record? This cannot be undone.</p>
          <div className="dialog-actions">
            <button className="button button-muted" type="button" onClick={() => setEmployeeToDelete(null)}>Cancel</button>
            <button className="button button-danger" type="button" disabled={deleteMutation.isPending} onClick={removeEmployee}>
              {deleteMutation.isPending ? 'Deleting…' : 'Delete employee'}
            </button>
          </div>
        </section>
      </div>}
      {snackbar && <div className="snackbar" role="status">
        <span>{snackbar}</span>
        <button type="button" aria-label="Dismiss notification" onClick={() => setSnackbar('')}>×</button>
      </div>}
    </div>
  )
}

export default App
