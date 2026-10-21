import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatCurrency } from '../../utils/currency'

export default function InsightsCharts({
  chartGroups,
  distributionChart,
  groupLoading,
  distributionLoading,
  insightTab,
  insightCountry,
}) {
  return (
    <section className="panel chart-grid" aria-label="Salary charts">
      <article className="panel chart-panel">
        <div className="panel-heading">
          <div><p className="eyebrow">COMPENSATION</p><h2>Average and median by {insightTab === 'department' ? 'department' : 'job title'}</h2></div>
        </div>
        {groupLoading ? <p className="chart-state">Loading salary chart…</p> : !chartGroups.length ? <p className="chart-state">No matching insight data.</p> : (
          <ResponsiveContainer width="100%" height={290}>
            <BarChart data={chartGroups} margin={{ top: 12, right: 12, bottom: 58, left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" angle={-35} textAnchor="end" interval={0} height={75} />
              <YAxis />
              <Tooltip
                formatter={(value, name, item) => [formatCurrency(value, item.payload.currency), name]}
                labelFormatter={(label, payload) => payload?.[0]?.payload?.country ? `${label} · ${payload[0].payload.country}` : label}
              />
              <Legend />
              <Bar dataKey="average" name="Average" fill="#4e8b68" />
              <Bar dataKey="median" name="Median" fill="#8fb79a" />
            </BarChart>
          </ResponsiveContainer>
        )}
        <p className="panel-footnote">{insightCountry ? `Values use ${insightCountry}’s currency.` : 'Amounts remain in local currencies; choose a country to compare groups consistently.'}</p>
      </article>
      <article className="panel chart-panel">
        <div className="panel-heading">
          <div><p className="eyebrow">SALARY MIX</p><h2>Salary distribution</h2></div>
        </div>
        {distributionLoading ? <p className="chart-state">Loading distribution…</p> : !distributionChart.length ? <p className="chart-state">No salary data yet.</p> : (
          <ResponsiveContainer width="100%" height={290}>
            <BarChart data={distributionChart} margin={{ top: 12, right: 12, bottom: 58, left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" angle={-35} textAnchor="end" interval={0} height={75} />
              <YAxis allowDecimals={false} />
              <Tooltip formatter={(value, _name, item) => [`${value.toLocaleString()} employees · ${formatCurrency(item.payload.midpoint, item.payload.currency)}`, 'Headcount']} />
              <Bar dataKey="headcount" name="Employees" fill="#709b7d" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </article>
    </section>
  )
}
