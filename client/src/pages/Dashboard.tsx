import { useEffect, useState } from 'react'
import api from '../services/api'
import type { DashboardStats } from '../types/types'


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
      count: claimsByStatusCounts.underReview,
    },
    {
      status: 'Approved',
      count: claimsByStatusCounts.approved,
    },
    {
      status: 'Submitted',
      count: claimsByStatusCounts.submitted,
    },
    {
      status: 'Denied',
      count: claimsByStatusCounts.denied,
    },
    {
      status: 'Closed',
      count: claimsByStatusCounts.closed,
    },
  ]
  const recentClaims = data?.recentClaims ?? []

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)

  return (
    <div>
      <h1>Dashboard</h1>
      <div style={{ display: 'flex', justifyContent: 'space-evenly'}}>
        <div style={{ padding: '25px', border: '1px solid black'}}>Total Claims: {data?.totalClaims ?? 0}</div>
        <div style={{ padding: '25px', border: '1px solid black'}}>Total Policies: {data?.totalPolicies ?? 0}</div>
        <div style={{ padding: '25px', border: '1px solid black'}}>Total Users: <strong>{data?.totalUsers ?? 0}</strong></div>
        <div style={{ padding: '25px', border: '1px solid black'}}>Total Claim Amount: <strong>{formatCurrency(data?.totalClaimAmount ?? 0)}</strong></div> 
      </div>

      <div>
        <div style={{ marginTop: '2rem', maxWidth: '700px', border: '1px solid black'}}>
        <h2>Claims by Status</h2>

        {claimsByStatus.map((item) => {
          const maxCount = Math.max(...claimsByStatus.map((s) => s.count), 1)
          const barWidth = `${(item.count / maxCount) * 100 }%`

          return (
            <div
              key={item.status}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '10px',
              }}
            >
              <div style={{ width: '120px', textAlign: 'left' }}>{item.status}</div>

              <div
                style={{
                  flex: 1,
                  height: '10px',
                  backgroundColor: '#e5e7eb',
                  borderRadius: '999px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: barWidth,
                    height: '100%',
                    backgroundColor: '#3b82f6',
                    borderRadius: '999px',
                  }}
                />
              </div>

              <div style={{ width: '30px', textAlign: 'right' }}>{item.count}</div>
            </div>
          )
        })}  
        </div>
        <div style={{ padding: '25px', border: '1px solid black', marginTop: '2rem'}}>
            <h2>Recent Claims</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '0.75rem', borderBottom: '1px solid #d1d5db' }}>Claim #</th>
                  <th style={{ textAlign: 'left', padding: '0.75rem', borderBottom: '1px solid #d1d5db' }}>Policy</th>
                  <th style={{ textAlign: 'left', padding: '0.75rem', borderBottom: '1px solid #d1d5db' }}>Amount</th>
                  <th style={{ textAlign: 'left', padding: '0.75rem', borderBottom: '1px solid #d1d5db' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentClaims.length > 0 ? (
                  recentClaims.map((claim) => (
                    <tr key={claim._id}>
                      <td style={{ padding: '0.75rem', borderBottom: '1px solid #e5e7eb' }}>{claim.claimNumber}</td>
                      <td style={{ padding: '0.75rem', borderBottom: '1px solid #e5e7eb' }}>{claim.policy?.policyNumber ?? '—'}</td>
                      <td style={{ padding: '0.75rem', borderBottom: '1px solid #e5e7eb' }}>{formatCurrency(claim.amount ?? 0)}</td>
                      <td style={{ padding: '0.75rem', borderBottom: '1px solid #e5e7eb' }}>{claim.status}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} style={{ padding: '0.75rem' }}>No recent claims found.</td>
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