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

  const claimsByStatus = [
    { status: 'Under Review', count: data?.claimsByStatus?.underReview ?? 0 },
    { status: 'Approved', count: data?.claimsByStatus?.approved ?? 0 },
    { status: 'Submitted', count: data?.claimsByStatus?.submitted ?? 0 },
    { status: 'Denied', count: data?.claimsByStatus?.denied ?? 0 },
    { status: 'Closed', count: data?.claimsByStatus?.closed ?? 0 },
  ]

  return (
    <div>
      <h1>Dashboard</h1>
      <div style={{ display: 'flex', justifyContent: 'space-evenly'}}>
        <div style={{ padding: '25px', border: '1px solid black'}}>Total Claims: {data?.totalClaims ?? 0}</div>
        <div style={{ padding: '25px', border: '1px solid black'}}>Total Policies: {data?.totalPolicies ?? 0}</div>
        <div style={{ padding: '25px', border: '1px solid black'}}>Total Users: <strong>{data?.totalUsers ?? 0}</strong></div>
        <div style={{ padding: '25px', border: '1px solid black'}}>Total Claim Amount: <strong>${data?.totalClaimAmount}</strong></div> 
      </div>

      <div style={{ marginTop: '2rem', maxWidth: '700px' }}>
        <h2>Claims by Status</h2>

        {claimsByStatus.map((item) => {
          const maxCount = Math.max(...claimsByStatus.map((s) => s.count), 1)
          const barWidth = `${(item.count / maxCount) * 100}%`

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
    </div>
  )
}

export default Dashboard