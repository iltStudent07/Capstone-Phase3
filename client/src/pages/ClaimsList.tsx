import { useEffect, useState } from 'react'
import api from '../services/api'
import type { Claim, Policy } from '../types/types'
import { Link } from 'react-router-dom'

interface PaginationData {
  page: number
  limit: number
  total: number
  totalPages: number
}

function ClaimsList() {
  const [claims, setClaims] = useState<Claim[]>([])
  const [policies, setPolicies] = useState<Policy[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  })

  const [filters, setFilters] = useState({
    status: '',
    search: '',
  })

  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    policy: '',
    description: '',
    incidentDate: '',
    amount: '',
  })
  const [formError, setFormError] = useState<string | null>(null)
  const [formLoading, setFormLoading] = useState(false)

  // Fetch policies for the form dropdown
  useEffect(() => {
    const fetchPolicies = async () => {
      try {
        const { data } = await api.get('/policies?limit=100')
        setPolicies(data.data || [])
      } catch (err) {
        console.error('Failed to fetch policies:', err)
      }
    }

    fetchPolicies()
  }, [])

  // Fetch claims when filters change
  useEffect(() => {
    void (async () => {
      setLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams({
          page: '1',
          limit: '10',
          ...(filters.status && { status: filters.status }),
          ...(filters.search && { search: filters.search }),
        })

        const response = await api.get(`/claims?${params}`)
        console.log('Claims response:', response.data)
        
        // Handle case where response.data is the claims array directly
        const claimsData = Array.isArray(response.data) 
          ? response.data 
          : (response.data?.data || [])
        
        const paginationData = response.data?.pagination || {
          page: 1,
          limit: 10,
          total: Array.isArray(response.data) ? response.data.length : 0,
          totalPages: 1,
        }
        
        console.log('Processed claims:', claimsData)
        console.log('Pagination:', paginationData)
        
        setClaims(claimsData)
        setPagination(paginationData)
      } catch (err) {
        setError('Failed to load claims')
        console.error('Error loading claims:', err)
      } finally {
        setLoading(false)
      }
    })()
  }, [filters])

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const handleFormChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmitClaim = async (e: React.SubmitEvent) => {
    e.preventDefault()
    setFormError(null)
    setFormLoading(true)

    try {
      if (!formData.policy || !formData.description || !formData.incidentDate) {
        setFormError('Policy, description, and incident date are required')
        setFormLoading(false)
        return
      }

      const payload = {
        policy: formData.policy,
        description: formData.description,
        incidentDate: formData.incidentDate,
        ...(formData.amount && { amount: parseFloat(formData.amount) }),
      }

      await api.post('/claims', payload)

      setFormData({
        policy: '',
        description: '',
        incidentDate: '',
        amount: '',
      })
      setShowForm(false)
      
      // Refetch claims
      setLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams({
          page: '1',
          limit: '10',
          ...(filters.status && { status: filters.status }),
          ...(filters.search && { search: filters.search }),
        })

        const response = await api.get(`/claims?${params}`)
        const claimsData = Array.isArray(response.data) 
          ? response.data 
          : (response.data?.data || [])
        const paginationData = response.data?.pagination || {
          page: 1,
          limit: 10,
          total: Array.isArray(response.data) ? response.data.length : 0,
          totalPages: 1,
        }
        setClaims(claimsData)
        setPagination(paginationData)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    } catch (err) {
      setFormError('Failed to create claim')
      console.error(err)
    } finally {
      setFormLoading(false)
    }
  }

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US')
    } catch {
      return dateStr
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'submitted': '#fbbf24',
      'under-review': '#60a5fa',
      'approved': '#34d399',
      'denied': '#f87171',
      'closed': '#9ca3af',
    }
    return colors[status] || '#6b7280'
  }

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Claims</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            fontSize: '1rem',
          }}
        >
          {showForm ? 'Cancel' : 'New Claim'}
        </button>
      </div>

      {showForm && (
        <div style={{ marginBottom: '2rem', padding: '1.5rem', backgroundColor: '#f9fafb', borderRadius: '0.5rem', border: '1px solid #e5e7eb' }}>
          <h2>Create New Claim</h2>
          <form onSubmit={handleSubmitClaim}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Policy <span style={{ color: 'red' }}>*</span>
                </label>
                <select
                  value={formData.policy}
                  onChange={(e) => handleFormChange('policy', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    fontSize: '1rem',
                  }}
                >
                  <option value="">Select a policy</option>
                  {policies.map((policy) => (
                    <option key={policy._id} value={policy._id}>
                      {policy.policyNumber} - {policy.holderName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Amount
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={(e) => handleFormChange('amount', e.target.value)}
                  placeholder="0.00"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    fontSize: '1rem',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Incident Date <span style={{ color: 'red' }}>*</span>
                </label>
                <input
                  type="date"
                  value={formData.incidentDate}
                  onChange={(e) => handleFormChange('incidentDate', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    fontSize: '1rem',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Description <span style={{ color: 'red' }}>*</span>
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => handleFormChange('description', e.target.value)}
                  placeholder="Brief description of the claim"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    fontSize: '1rem',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            {formError && (
              <p style={{ color: '#dc2626', marginBottom: '1rem' }}>{formError}</p>
            )}

            <button
              type="submit"
              disabled={formLoading}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: formLoading ? '#9ca3af' : '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '0.375rem',
                cursor: formLoading ? 'not-allowed' : 'pointer',
                fontSize: '1rem',
              }}
            >
              {formLoading ? 'Creating...' : 'Create Claim'}
            </button>
          </form>
        </div>
      )}

      <div style={{ marginBottom: '2rem', display: 'flex', gap: '1rem' }}>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
            Search
          </label>
          <input
            type="text"
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            placeholder="Search by claim number or description..."
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #d1d5db',
              borderRadius: '0.375rem',
              fontSize: '1rem',
            }}
          />
        </div>

        <div style={{ minWidth: '200px' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
            Status Filter
          </label>
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #d1d5db',
              borderRadius: '0.375rem',
              fontSize: '1rem',
            }}
          >
            <option value="">All Statuses</option>
            <option value="submitted">Submitted</option>
            <option value="under-review">Under Review</option>
            <option value="approved">Approved</option>
            <option value="denied">Denied</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>

      {error && <p style={{ color: '#dc2626', marginBottom: '1rem' }}>{error}</p>}

      {loading ? (
        <p>Loading claims...</p>
      ) : (
        <>
          <div style={{ overflowX: 'auto', marginBottom: '2rem' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f3f4f6', borderBottom: '2px solid #d1d5db' }}>
                  <th style={{ textAlign: 'left', padding: '1rem', fontWeight: '600' }}>Claim #</th>
                  <th style={{ textAlign: 'left', padding: '1rem', fontWeight: '600' }}>Policy</th>
                  <th style={{ textAlign: 'left', padding: '1rem', fontWeight: '600' }}>Description</th>
                  <th style={{ textAlign: 'left', padding: '1rem', fontWeight: '600' }}>Amount</th>
                  <th style={{ textAlign: 'left', padding: '1rem', fontWeight: '600' }}>Status</th>
                  <th style={{ textAlign: 'left', padding: '1rem', fontWeight: '600' }}>Incident Date</th>
                </tr>
              </thead>
              <tbody>
                {claims.length > 0 ? (
                  claims.map((claim) => (
                    <tr key={claim._id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={{ padding: '1rem' }}><Link to={`/claims/${claim._id}`}>{claim.claimNumber}</Link></td>
                      <td style={{ padding: '1rem' }}>
                        {typeof claim.policy === 'string'
                          ? claim.policy
                          : ((claim.policy as Record<string, unknown>)?.policyNumber as string) || '—'}
                      </td>
                      <td style={{ padding: '1rem' }}>{claim.description}</td>
                      <td style={{ padding: '1rem' }}>{formatCurrency(claim.amount)}</td>
                      <td style={{ padding: '1rem' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '0.375rem 0.75rem',
                            backgroundColor: `${getStatusColor(claim.status)}20`,
                            color: getStatusColor(claim.status),
                            borderRadius: '0.375rem',
                            fontSize: '0.875rem',
                            fontWeight: '500',
                          }}
                        >
                          {claim.status}
                        </span>
                      </td>
                      <td style={{ padding: '1rem' }}>{formatDate(claim.incidentDate)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} style={{ padding: '1rem', textAlign: 'center', color: '#6b7280' }}>
                      No claims found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ color: '#6b7280' }}>
              Showing {claims.length > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} claims
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={async () => {
                  const newPage = pagination.page - 1
                  setLoading(true)
                  try {
                    const params = new URLSearchParams({
                      page: String(newPage),
                      limit: '10',
                      ...(filters.status && { status: filters.status }),
                      ...(filters.search && { search: filters.search }),
                    })
                    const response = await api.get(`/claims?${params}`)
                    const claimsData = Array.isArray(response.data) 
                      ? response.data 
                      : (response.data?.data || [])
                    const paginationData = response.data?.pagination || {
                      page: 1,
                      limit: 10,
                      total: Array.isArray(response.data) ? response.data.length : 0,
                      totalPages: 1,
                    }
                    setClaims(claimsData)
                    setPagination(paginationData)
                  } catch (err) {
                    setError('Failed to load claims')
                    console.error(err)
                  } finally {
                    setLoading(false)
                  }
                }}
                disabled={pagination.page === 1}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: pagination.page === 1 ? '#e5e7eb' : '#e5e7eb',
                  color: pagination.page === 1 ? '#9ca3af' : '#374151',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  cursor: pagination.page === 1 ? 'not-allowed' : 'pointer',
                  fontSize: '0.875rem',
                }}
              >
                Previous
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0 1rem' }}>
                <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                  Page {pagination.page} of {pagination.totalPages}
                </span>
              </div>

              <button
                onClick={async () => {
                  const newPage = pagination.page + 1
                  setLoading(true)
                  try {
                    const params = new URLSearchParams({
                      page: String(newPage),
                      limit: '10',
                      ...(filters.status && { status: filters.status }),
                      ...(filters.search && { search: filters.search }),
                    })
                    const response = await api.get(`/claims?${params}`)
                    const claimsData = Array.isArray(response.data) 
                      ? response.data 
                      : (response.data?.data || [])
                    const paginationData = response.data?.pagination || {
                      page: 1,
                      limit: 10,
                      total: Array.isArray(response.data) ? response.data.length : 0,
                      totalPages: 1,
                    }
                    setClaims(claimsData)
                    setPagination(paginationData)
                  } catch (err) {
                    setError('Failed to load claims')
                    console.error(err)
                  } finally {
                    setLoading(false)
                  }
                }}
                disabled={pagination.page >= pagination.totalPages}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: pagination.page >= pagination.totalPages ? '#e5e7eb' : '#e5e7eb',
                  color: pagination.page >= pagination.totalPages ? '#9ca3af' : '#374151',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  cursor: pagination.page >= pagination.totalPages ? 'not-allowed' : 'pointer',
                  fontSize: '0.875rem',
                }}
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default ClaimsList