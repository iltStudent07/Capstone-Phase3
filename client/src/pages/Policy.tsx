import { useCallback, useEffect, useState } from 'react'
import api from '../services/api'
import type { Policy as PolicyType } from '../types/types'

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

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            active: '#34d399',
            expired: '#f87171',
            cancelled: '#9ca3af',
        }

        return colors[status] || '#6b7280'
    }

    return (
        <div style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1>Policies</h1>
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
                    {showForm ? 'Cancel' : 'New Policy'}
                </button>
            </div>

            {showForm && (
                <div style={{ marginBottom: '2rem', padding: '1.5rem', backgroundColor: '#f9fafb', borderRadius: '0.5rem', border: '1px solid #e5e7eb' }}>
                    <h2>Create New Policy</h2>
                    <form onSubmit={handleSubmitPolicy}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                                    Holder Name <span style={{ color: 'red' }}>*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.holderName}
                                    onChange={(e) => handleFormChange('holderName', e.target.value)}
                                    placeholder="Policy holder"
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
                                    Generated Policy Number
                                </label>
                                <div
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '0.375rem',
                                        fontSize: '1rem',
                                        boxSizing: 'border-box',
                                        backgroundColor: '#f3f4f6',
                                        color: '#374151',
                                    }}
                                >
                                    {generatedPolicyPreview}
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                                    Type
                                </label>
                                <select
                                    value={formData.type}
                                    onChange={(e) => handleFormChange('type', e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '0.375rem',
                                        fontSize: '1rem',
                                    }}
                                >
                                    <option value="auto">Auto</option>
                                    <option value="home">Home</option>
                                    <option value="life">Life</option>
                                </select>
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                                    Premium
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={formData.premium}
                                    onChange={(e) => handleFormChange('premium', e.target.value)}
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
                                    Status
                                </label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => handleFormChange('status', e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '0.375rem',
                                        fontSize: '1rem',
                                    }}
                                >
                                    <option value="active">Active</option>
                                    <option value="expired">Expired</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                                    Effective Date
                                </label>
                                <input
                                    type="date"
                                    value={formData.effectiveDate}
                                    onChange={(e) => handleFormChange('effectiveDate', e.target.value)}
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
                                    Expiration Date
                                </label>
                                <input
                                    type="date"
                                    value={formData.expriationDate}
                                    onChange={(e) => handleFormChange('expriationDate', e.target.value)}
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
                            {formLoading ? 'Creating...' : 'Create Policy'}
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
                        placeholder="Search by policy number or holder..."
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
                        Type Filter
                    </label>
                    <select
                        value={filters.type}
                        onChange={(e) => handleFilterChange('type', e.target.value)}
                        style={{
                            width: '100%',
                            padding: '0.75rem',
                            border: '1px solid #d1d5db',
                            borderRadius: '0.375rem',
                            fontSize: '1rem',
                        }}
                    >
                        <option value="">All Types</option>
                        <option value="auto">Auto</option>
                        <option value="home">Home</option>
                        <option value="life">Life</option>
                    </select>
                </div>
            </div>

            {error && <p style={{ color: '#dc2626', marginBottom: '1rem' }}>{error}</p>}

            {loading ? (
                <p>Loading policies...</p>
            ) : (
                <>
                    <div style={{ overflowX: 'auto', marginBottom: '2rem' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ backgroundColor: '#f3f4f6', borderBottom: '2px solid #d1d5db' }}>
                                    <th style={{ textAlign: 'left', padding: '1rem', fontWeight: '600' }}>Policy Number</th>
                                    <th style={{ textAlign: 'left', padding: '1rem', fontWeight: '600' }}>Holder</th>
                                    <th style={{ textAlign: 'left', padding: '1rem', fontWeight: '600' }}>Type</th>
                                    <th style={{ textAlign: 'left', padding: '1rem', fontWeight: '600' }}>Premium</th>
                                    <th style={{ textAlign: 'left', padding: '1rem', fontWeight: '600' }}>Status</th>
                                    <th style={{ textAlign: 'left', padding: '1rem', fontWeight: '600' }}>Effective Date</th>
                                    <th style={{ textAlign: 'left', padding: '1rem', fontWeight: '600' }}>Expiration Date</th>
                                    <th style={{ textAlign: 'left', padding: '1rem', fontWeight: '600' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {policies.length > 0 ? (
                                    policies.map((policy) => (
                                        <tr key={policy._id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                            <td style={{ padding: '1rem' }}>{policy.policyNumber}</td>
                                            <td style={{ padding: '1rem' }}>{policy.holderName}</td>
                                            <td style={{ padding: '1rem', textTransform: 'capitalize' }}>{policy.type || '—'}</td>
                                            <td style={{ padding: '1rem' }}>{formatCurrency(policy.premium)}</td>
                                            <td style={{ padding: '1rem' }}>
                                                <span
                                                    style={{
                                                        display: 'inline-block',
                                                        padding: '0.375rem 0.75rem',
                                                        backgroundColor: `${getStatusColor(policy.status)}20`,
                                                        color: getStatusColor(policy.status),
                                                        borderRadius: '0.375rem',
                                                        fontSize: '0.875rem',
                                                        fontWeight: '500',
                                                    }}
                                                >
                                                    {policy.status || '—'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '1rem' }}>{formatDate(policy.effectiveDate)}</td>
                                            <td style={{ padding: '1rem' }}>{formatDate(policy.expriationDate)}</td>
                                            <td style={{ padding: '1rem' }}>
                                                <button
                                                    onClick={() => void handleDelete(policy._id)}
                                                    style={{
                                                        padding: '0.5rem 0.875rem',
                                                        backgroundColor: '#ef4444',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '0.375rem',
                                                        cursor: 'pointer',
                                                        fontSize: '0.875rem',
                                                    }}
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={8} style={{ padding: '1rem', textAlign: 'center', color: '#6b7280' }}>
                                            No policies found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ color: '#6b7280' }}>
                            Showing {policies.length > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0} to{' '}
                            {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} policies
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                                onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                                disabled={pagination.page === 1}
                                style={{
                                    padding: '0.5rem 1rem',
                                    backgroundColor: '#e5e7eb',
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
                                    Page {pagination.page} of {pagination.totalPages || 1}
                                </span>
                            </div>

                            <button
                                onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                                disabled={pagination.page >= pagination.totalPages}
                                style={{
                                    padding: '0.5rem 1rem',
                                    backgroundColor: '#e5e7eb',
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

export default Policy