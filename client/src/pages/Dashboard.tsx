import { useEffect, useState } from 'react'
import api from '../services/api'
import type { DashboardStats } from '../types/types'
import { Link } from 'react-router-dom'


function Dashboard() {
  const [data, setData] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const { data } = await api.get('/dashboard')
        setData(data)
      } catch (err) {
        console.error(err)
        setError('Failed to load dashboard data')
      } finally {
        setLoading(false)
      }
    }

    fetchDashboard()
  }, [])

  if (loading) return <p>Loading dashboard...</p>
  if (error) return <p>{error}</p>

  const defaultClaimsByStatus = {
    underReview: 0,
    approved: 0,
    submitted: 0,
    denied: 0,
    closed: 0,
  }

  const claimsByStatusCounts = Array.isArray(data?.claimsByStatus)
    ? data.claimsByStatus.reduce(
        (acc, item) => {
          const status = item.status.toLowerCase().replace(/[^a-z0-9]/g, '')

          if (status === 'underreview') acc.underReview += item.count
          if (status === 'approved') acc.approved += item.count
          if (status === 'submitted') acc.submitted += item.count
          if (status === 'denied') acc.denied += item.count
          if (status === 'closed') acc.closed += item.count

          return acc
        },
        { ...defaultClaimsByStatus },
      )
    : { ...defaultClaimsByStatus, ...(data?.claimsByStatus ?? {}) }

  const claimsByStatus = [
    {
      status: 'Under Review',
      statusKey: 'under-review',
      count: claimsByStatusCounts.underReview,
    },
    {
      status: 'Approved',
      statusKey: 'approved',
      count: claimsByStatusCounts.approved,
    },
    {
      status: 'Submitted',
      statusKey: 'submitted',
      count: claimsByStatusCounts.submitted,
    },
    {
      status: 'Denied',
      statusKey: 'denied',
      count: claimsByStatusCounts.denied,
    },
    {
      status: 'Closed',
      statusKey: 'closed',
      count: claimsByStatusCounts.closed,
    },
  ]
  const recentClaims = data?.recentClaims ?? []
  const totalClaims = data?.totalClaims ?? 0

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)

    return (
    <div className="dashboard-page">
      <h1 className="dashboard-title">Dashboard</h1>
      {/* Top 4 boxes on top of screen */}
      <div className="dashboard-stats">
        <div className="section-panel section-panel--padded dashboard-stat-card">Total Claims: <strong className="dashboard-stat-value">{data?.totalClaims ?? 0}</strong></div>
        <div className="section-panel section-panel--padded dashboard-stat-card">Total Policies: <strong className="dashboard-stat-value">{data?.totalPolicies ?? 0}</strong></div>
        <div className="section-panel section-panel--padded dashboard-stat-card">Total Users: <strong className="dashboard-stat-value">{data?.totalUsers ?? 0}</strong></div>
        <div className="section-panel section-panel--padded dashboard-stat-card">Total Claim Amount: <strong className="dashboard-stat-value">{formatCurrency(data?.totalClaimAmount ?? 0)}</strong></div> 
      </div>

      <div className="dashboard-main-grid">
        {/* Claims by Status section */}
        <div className="section-panel section-panel--padded dashboard-panel">
        <h2>Claims by Status</h2>

        {claimsByStatus.map((item) => {
          const barWidth = totalClaims > 0 ? `${(item.count / totalClaims) * 100}%` : '0%'

          return (
            <div key={item.status} className="dashboard-status-row">
              <div className={`status-pill dashboard-status-pill dashboard-status--${item.statusKey}`}>{item.status}</div>

              <div className={`dashboard-status-track dashboard-status-track--${item.statusKey}`}>
                <div
                  className={`dashboard-status-fill dashboard-status-fill--${item.statusKey}`}
                  style={{ width: barWidth }}
                />
              </div>

              <div className="dashboard-status-count">{item.count}</div>
            </div>
          )
        })}  
        </div>
        {/* Recent Claims section*/}
        <div className="section-panel section-panel--padded dashboard-panel">
            <h2>Recent Claims</h2>
            <table className="app-table dashboard-table">
              <thead>
                <tr>
                  <th>Claim #</th>
                  <th>Policy</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentClaims.length > 0 ? (
                  recentClaims.map((claim) => (
                    <tr key={claim._id}>
                      <td><Link className="claim-link" to={`/claims/${claim._id}`}>{claim.claimNumber}</Link></td>
                      <td>{claim.policy?.policyNumber ?? '—'}</td>
                      <td>{formatCurrency(claim.amount ?? 0)}</td>
                      <td>{claim.status}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4}>No recent claims found.</td>
                  </tr>
                )}
              </tbody>
            </table>
        </div>
      </div>
    </div>
  )
}

export default Dashboard