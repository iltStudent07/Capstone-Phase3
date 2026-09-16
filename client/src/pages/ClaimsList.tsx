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

  return (
    <div className="claims-page">
      <div className="page-header">
        <h1 className="page-header__title">Claims</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="app-button page-header__action"
        >
          {showForm ? 'Cancel' : 'New Claim'}
        </button>
      </div>

      {showForm && (
        <div className="section-panel section-panel--padded form-card">
          <h2>Create New Claim</h2>
          <form onSubmit={handleSubmitClaim}>
            <div className="form-grid form-grid--two">
              <div>
                <label className="form-label">
                  Policy <span className="form-required">*</span>
                </label>
                <select
                  value={formData.policy}
                  onChange={(e) => handleFormChange('policy', e.target.value)}
                  className="form-control"
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
                <label className="form-label">
                  Amount
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={(e) => handleFormChange('amount', e.target.value)}
                  placeholder="0.00"
                  className="form-control"
                />
              </div>

              <div>
                <label className="form-label">
                  Incident Date <span className="form-required">*</span>
                </label>
                <input
                  type="date"
                  value={formData.incidentDate}
                  onChange={(e) => handleFormChange('incidentDate', e.target.value)}
                  className="form-control"
                />
              </div>

              <div>
                <label className="form-label">
                  Description <span className="form-required">*</span>
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => handleFormChange('description', e.target.value)}
                  placeholder="Brief description of the claim"
                  className="form-control"
                />
              </div>
            </div>

            {formError && (
              <p className="form-error">{formError}</p>
            )}

            <button
              type="submit"
              disabled={formLoading}
              className={`app-button ${formLoading ? 'button-disabled' : 'app-button--primary'}`}
            >
              {formLoading ? 'Creating...' : 'Create Claim'}
            </button>
          </form>
        </div>
      )}

      <div className="filter-row">
        <div className="filter-group">
          <label className="form-label">
            Search
          </label>
          <input
            type="text"
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            placeholder="Search by claim number or description..."
            className="form-control"
          />
        </div>

        <div className="filter-group filter-group--narrow">
          <label className="form-label">
            Status Filter
          </label>
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="form-control"
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

      {error && <p className="form-error">{error}</p>}

      {loading ? (
        <p>Loading claims...</p>
      ) : (
        <>
          <div className="table-wrap">
            <table className="app-table claims-table">
              <thead>
                <tr>
                  <th>Claim #</th>
                  <th>Policy</th>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Incident Date</th>
                </tr>
              </thead>
              <tbody>
                {claims.length > 0 ? (
                  claims.map((claim) => (
                    <tr key={claim._id}>
                      <td><Link className="claim-link" to={`/claims/${claim._id}`}>{claim.claimNumber}</Link></td>
                      <td>
                        {typeof claim.policy === 'string'
                          ? claim.policy
                          : ((claim.policy as Record<string, unknown>)?.policyNumber as string) || '—'}
                      </td>
                      <td>{claim.description}</td>
                      <td>{formatCurrency(claim.amount)}</td>
                      <td>
                        <span className={`status-pill claims-status-pill claim-status--${claim.status}`}>
                          {claim.status}
                        </span>
                      </td>
                      <td>{formatDate(claim.incidentDate)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="pagination-info">
                      No claims found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="pagination-bar">
            <div className="pagination-info">
              Showing {claims.length > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} claims
            </div>

            <div className="pagination-controls">
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
                className="app-button pagination-button"
              >
                Previous
              </button>

              <div className="pagination-controls__page">
                <span className="pagination-info">
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
                className="app-button pagination-button"
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