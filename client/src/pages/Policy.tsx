import { useCallback, useEffect, useState } from 'react'
import api from '../services/api'
import type { Policy as PolicyType } from '../types/types'
import { Link } from 'react-router-dom'

interface PaginationData {
    page: number
    limit: number
    total: number
    totalPages: number
}

function Policy() {
    const [policies, setPolicies] = useState<PolicyType[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [pagination, setPagination] = useState<PaginationData>({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
    })

    const [filters, setFilters] = useState({
        type: '',
        search: '',
    })

    const [showForm, setShowForm] = useState(false)
    const [formData, setFormData] = useState({
        holderName: '',
        type: 'auto',
        premium: '',
        status: 'active',
        effectiveDate: '',
        expriationDate: '',
    })
    const [formError, setFormError] = useState<string | null>(null)
    const [formLoading, setFormLoading] = useState(false)
    const generatedPolicyPreview = `${formData.type.toUpperCase()}-${new Date().getFullYear()}-###`

    const fetchPolicies = useCallback(async (page: number) => {
        setLoading(true)
        setError(null)

        try {
            const params = new URLSearchParams({
                page: String(page),
                limit: '10',
                ...(filters.type && { type: filters.type }),
                ...(filters.search && { search: filters.search }),
            })

            const response = await api.get(`/policies?${params}`)
            const policiesData = Array.isArray(response.data)
                ? response.data
                : (response.data?.data || [])
            const paginationData = response.data?.pagination || {
                page,
                limit: 10,
                total: Array.isArray(response.data) ? response.data.length : 0,
                totalPages: 1,
            }

            setPolicies(policiesData)
            setPagination(paginationData)
        } catch (err) {
            setError('Failed to load policies')
            console.error('Error loading policies:', err)
        } finally {
            setLoading(false)
        }
    }, [filters.search, filters.type])

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            void fetchPolicies(pagination.page)
        }, 0)

        return () => window.clearTimeout(timeoutId)
    }, [fetchPolicies, pagination.page])

    const handleFilterChange = (key: 'type' | 'search', value: string) => {
        setFilters((prev) => ({ ...prev, [key]: value }))
        setPagination((prev) => ({ ...prev, page: 1 }))
    }

    const handleFormChange = (key: keyof typeof formData, value: string) => {
        setFormData((prev) => ({ ...prev, [key]: value }))
    }

    const handleSubmitPolicy = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setFormError(null)
        setFormLoading(true)

        try {
            if (!formData.holderName || !formData.type) {
                setFormError('Holder name and policy type are required')
                setFormLoading(false)
                return
            }

            const payload = {
                holderName: formData.holderName,
                type: formData.type,
                ...(formData.premium && { premium: parseFloat(formData.premium) }),
                status: formData.status,
                ...(formData.effectiveDate && { effectiveDate: formData.effectiveDate }),
                ...(formData.expriationDate && { expriationDate: formData.expriationDate }),
            }

            await api.post('/policies', payload)

            setFormData({
                holderName: '',
                type: 'auto',
                premium: '',
                status: 'active',
                effectiveDate: '',
                expriationDate: '',
            })
            setShowForm(false)

            if (pagination.page === 1) {
                await fetchPolicies(1)
            } else {
                setPagination((prev) => ({ ...prev, page: 1 }))
            }
        } catch (err: unknown) {
            const apiError = err as {
                response?: {
                    data?: {
                        message?: string
                        errors?: Array<{ msg?: string }>
                    }
                }
            }

            const validationMessage = apiError.response?.data?.errors?.[0]?.msg
            setFormError(validationMessage || apiError.response?.data?.message || 'Failed to create policy')
            console.error('Error creating policy:', err)
        } finally {
            setFormLoading(false)
        }
    }

    const handleDelete = async (policyId: string) => {
        if (!window.confirm('Are you sure you want to delete this policy?')) {
            return
        }

        try {
            await api.delete(`/policies/${policyId}`)

            const nextPage = policies.length === 1 && pagination.page > 1
                ? pagination.page - 1
                : pagination.page

            if (nextPage === pagination.page) {
                await fetchPolicies(nextPage)
            } else {
                setPagination((prev) => ({ ...prev, page: nextPage }))
            }
        } catch (err) {
            setError('Failed to delete policy')
            console.error('Error deleting policy:', err)
        }
    }

    const formatCurrency = (amount?: number) => {
        if (typeof amount !== 'number' || Number.isNaN(amount)) {
            return '—'
        }

        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount)
    }

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '—'

        try {
            return new Date(dateStr).toLocaleDateString('en-US')
        } catch {
            return dateStr
        }
    }

    return (
        <div className="policy-page">
            <div className="page-header">
                <h1 className="page-header__title">Policies</h1>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="app-button page-header__action"
                >
                    {showForm ? 'Cancel' : 'New Policy'}
                </button>
            </div>

            {showForm && (
                <div className="section-panel section-panel--padded form-card">
                    <h2>Create New Policy</h2>
                    <form onSubmit={handleSubmitPolicy}>
                        <div className="form-grid form-grid--two">
                            <div>
                                <label className="form-label">
                                    Holder Name <span className="form-required">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.holderName}
                                    onChange={(e) => handleFormChange('holderName', e.target.value)}
                                    placeholder="Policy holder"
                                    className="form-control"
                                />
                            </div>

                            <div>
                                <label className="form-label">Generated Policy Number</label>
                                <div className="policy-preview">{generatedPolicyPreview}</div>
                            </div>

                            <div>
                                <label className="form-label">Type</label>
                                <select
                                    value={formData.type}
                                    onChange={(e) => handleFormChange('type', e.target.value)}
                                    className="form-control"
                                >
                                    <option value="auto">Auto</option>
                                    <option value="home">Home</option>
                                    <option value="life">Life</option>
                                </select>
                            </div>

                            <div>
                                <label className="form-label">Premium</label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={formData.premium}
                                    onChange={(e) => handleFormChange('premium', e.target.value)}
                                    placeholder="0.00"
                                    className="form-control"
                                />
                            </div>

                            <div>
                                <label className="form-label">Status</label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => handleFormChange('status', e.target.value)}
                                    className="form-control"
                                >
                                    <option value="active">Active</option>
                                    <option value="expired">Expired</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                            </div>

                            <div>
                                <label className="form-label">Effective Date</label>
                                <input
                                    type="date"
                                    value={formData.effectiveDate}
                                    onChange={(e) => handleFormChange('effectiveDate', e.target.value)}
                                    className="form-control"
                                />
                            </div>

                            <div>
                                <label className="form-label">Expiration Date</label>
                                <input
                                    type="date"
                                    value={formData.expriationDate}
                                    onChange={(e) => handleFormChange('expriationDate', e.target.value)}
                                    className="form-control"
                                />
                            </div>
                        </div>

                        {formError && <p className="form-error">{formError}</p>}

                        <button
                            type="submit"
                            disabled={formLoading}
                            className="app-button app-button--primary"
                        >
                            {formLoading ? 'Creating...' : 'Create Policy'}
                        </button>
                    </form>
                </div>
            )}

            <div className="filter-row">
                <div className="filter-group">
                    <label className="form-label">Search</label>
                    <input
                        type="text"
                        value={filters.search}
                        onChange={(e) => handleFilterChange('search', e.target.value)}
                        placeholder="Search by policy number or holder..."
                        className="form-control"
                    />
                </div>

                <div className="filter-group filter-group--narrow">
                    <label className="form-label">Type Filter</label>
                    <select
                        value={filters.type}
                        onChange={(e) => handleFilterChange('type', e.target.value)}
                        className="form-control"
                    >
                        <option value="">All Types</option>
                        <option value="auto">Auto</option>
                        <option value="home">Home</option>
                        <option value="life">Life</option>
                    </select>
                </div>
            </div>

            {error && <p className="form-error">{error}</p>}

            {loading ? (
                <p>Loading policies...</p>
            ) : (
                <>
                    <div className="table-wrap">
                        <table className="app-table claims-table">
                            <thead>
                                <tr>
                                    <th>Policy Number</th>
                                    <th>Holder</th>
                                    <th>Type</th>
                                    <th>Premium</th>
                                    <th>Status</th>
                                    <th>Effective Date</th>
                                    <th>Expiration Date</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {policies.length > 0 ? (
                                    policies.map((policy) => (
                                        <tr key={policy._id}>
                                            <td><Link className="claim-link" to={`/policies/${policy._id}`}>{policy.policyNumber}</Link></td>
                                            <td>{policy.holderName}</td>
                                            <td className="policy-type">{policy.type || '—'}</td>
                                            <td>{formatCurrency(policy.premium)}</td>
                                            <td>
                                                <span className={`status-pill policy-status--${policy.status || ''}`}>
                                                    {policy.status || '—'}
                                                </span>
                                            </td>
                                            <td>{formatDate(policy.effectiveDate)}</td>
                                            <td>{formatDate(policy.expriationDate)}</td>
                                            <td>
                                                <button
                                                    onClick={() => void handleDelete(policy._id)}
                                                    className="app-button policy-button--danger"
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={8} className="pagination-info">
                                            No policies found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="pagination-bar">
                        <div className="pagination-info">
                            Showing {policies.length > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0} to{' '}
                            {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} policies
                        </div>

                        <div className="pagination-controls">
                            <button
                                onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                                disabled={pagination.page === 1}
                                className="app-button pagination-button"
                            >
                                Previous
                            </button>

                            <div className="pagination-controls__page">
                                <span className="pagination-info">
                                    Page {pagination.page} of {pagination.totalPages || 1}
                                </span>
                            </div>

                            <button
                                onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
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

export default Policy