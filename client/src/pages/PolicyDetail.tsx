import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api'
import type { Policy } from '../types/types'

function PolicyDetail() {
    const { id } = useParams<{id: string}>()
    const nav = useNavigate()
    const [policy, setPolicy] = useState<Policy | null>(null)
    const [loading, setLoading] = useState<boolean>(true)
    const [status, setStatus] = useState<string>('')
    const [updating, setUpdating] = useState<boolean>(false)

    useEffect(() => {
        const fetchPolicy = async () => {
            try {
                const response = await api.get(`/policies/${id}`)
                setPolicy(response.data)
                setStatus(response.data.status)
                setLoading(false)
            } catch {
                setLoading(false)
            }
        }
        fetchPolicy()
    }, [id])

    const handleStatusUpdate = async () => {
        if (!policy) return
        setUpdating(true)
        try {
            const response = await api.put(`/policies/${id}`, { status })
            setPolicy(response.data)
            setStatus(response.data.status)
        } catch (error) {
            console.error('Failed to update status', error)
        } finally {
            setUpdating(false)
        }
    }


    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this policy? This action cannot be undone.')) {
            return
        }
        try {
            await api.delete(`/policies/${id}`)
            nav('/policies')
        } catch (error) {
            console.error('Failed to delete policy', error)
        }
    }

    if (loading) return <p>Loading...</p>
    if (!policy) return <p>Policy not found. <button onClick={() => nav('/policies')}>Back to Policy</button></p>

    const ownerName = typeof policy.owner === 'string'
        ? policy.owner
        : policy.owner?.name || 'Unassigned'

    return (
        <div className="claim-detail-container">
            <button onClick={() => nav('/policies')} className="back-button app-button">← Back to Policies</button>

            {/* Policy Information */}
            <div className="claim-info">
                <h1>{policy.policyNumber}</h1>
                <div className="info-grid">
                    <div><strong>Type:</strong> {policy.type}</div>
                    <div><strong>Premium:</strong> ${policy.premium}</div>
                    <div><strong>Status:</strong> {policy.status}</div>
                    <div><strong>Assigned To:</strong> {ownerName}</div>
                    <div><strong>Date Effective:</strong>  {policy.effectiveDate}</div>
                    <div><strong>Experation Date:</strong> {policy.expriationDate}</div>
                    
                </div>
            </div>

            {/* Status Update */}
            <div className="status-update">
                <h2>Update Status</h2>
                <div className="control-group">
                    <select value={status} onChange={(e) =>     setStatus(e.target.value)}>
                        <option value="active">Active</option>
                        <option value="expired">Expired</option>
                        <option value="cancelled">Cancelled</option>
  
                    </select>
                    <button onClick={handleStatusUpdate} disabled={updating} className="app-button">
                        {updating ? 'Updating...' : 'Update Status'}
                    </button>
                </div>
            </div>

            {/* Delete Button */}
            <div className="actions">
                <button onClick={handleDelete} className="app-button delete-button">
                    Delete Policy
                </button>
            </div>
        </div>
    )
}

export default PolicyDetail