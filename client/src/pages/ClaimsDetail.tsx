import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api'
import type { Claim, Note } from '../types/types'

function ClaimDetail() {
    const { id } = useParams<{id: string}>()
    const nav = useNavigate()
    const [claim, setClaim] = useState<Claim | null>(null)
    const [loading, setLoading] = useState<boolean>(true)
    const [status, setStatus] = useState<string>('')
    const [newNote, setNewNote] = useState<string>('')
    const [updating, setUpdating] = useState<boolean>(false)

    useEffect(() => {
        const fetchClaim = async () => {
            try {
                const response = await api.get(`/claims/${id}`)
                setClaim(response.data)
                setStatus(response.data.status)
                setLoading(false)
            } catch {
                setLoading(false)
            }
        }
        fetchClaim()
    }, [id])

    const getPolicyLabel = (policy: Claim['policy']) => {
        if (typeof policy === 'string') return policy
        return policy?.policyNumber || policy?.holderName || '—'
    }

    const getNoteAuthorName = (createdBy: Note['createdBy']) => {
        if (!createdBy) return 'Unknown User'
        return typeof createdBy === 'string' ? createdBy : createdBy.name
    }

    const handleStatusUpdate = async () => {
        if (!claim) return
        setUpdating(true)
        try {
            const response = await api.put(`/claims/${id}`, { status })
            setClaim(response.data)
            setStatus(response.data.status)
        } catch (error) {
            console.error('Failed to update status', error)
        } finally {
            setUpdating(false)
        }
    }

    const handleAddNote = async () => {
        if (!newNote.trim() || !claim) return
        try {
            const response = await api.post(`/claims/${id}/notes`, { text: newNote })
            setClaim(response.data)
            setNewNote('')
        } catch (error: unknown) {
            const apiError = error as { message: string; response?: { status: number; data: unknown } }
            console.error('Failed to add note:', {
                message: apiError.message,
                status: apiError.response?.status,
                data: apiError.response?.data
            })
        }
    }

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this claim? This action cannot be undone.')) {
            return
        }
        try {
            await api.delete(`/claims/${id}`)
            nav('/claims')
        } catch (error) {
            console.error('Failed to delete claim', error)
        }
    }

    if (loading) return <p>Loading...</p>
    if (!claim) return <p>Claim not found. <button onClick={() => nav('/claims')}>Back to Claims</button></p>

    return (
        <div className="claim-detail-container">
            <button onClick={() => nav('/claims')} className="back-button app-button">← Back to Claims</button>

            {/* Claim Information */}
            <div className="claim-info">
                <h1>{claim.claimNumber}</h1>
                <div className="info-grid">
                    <div><strong>Policy:</strong> {getPolicyLabel(claim.policy)}</div>
                    <div><strong>Incident Date:</strong> {new Date(claim.incidentDate).toLocaleDateString()}</div>
                    <div><strong>Amount:</strong> ${claim.amount}</div>
                    <div><strong>Status:</strong> {claim.status}</div>
                </div>
            </div>

            {/* Status Update */}
            <div className="status-update">
                <h2>Update Status</h2>
                <div className="control-group">
                    <select value={status} onChange={(e) =>     setStatus(e.target.value)}>
                        <option value="submitted">Submitted</option>
                        <option value="under-review">Under Review</option>
                        <option value="approved">Approved</option>
                        <option value="denied">Denied</option>
                        <option value="closed">Closed</option>
                    </select>
                    <button onClick={handleStatusUpdate} disabled={updating} className="app-button">
                        {updating ? 'Updating...' : 'Update Status'}
                    </button>
                </div>
            </div>

            {/* Description */}
            <div className="description-section">
                <h2>Description</h2>
                <p>{claim.description}</p>
            </div>

            {/* Notes Section */}
            <div className="notes-section">
                <h2>Notes</h2>
                <div className="notes-list">
                    {claim.notes && claim.notes.length > 0 ? (
                        claim.notes.map((note: Note) => (
                            <div key={`${note.createdAt}-${note.text}`} className="note-item">
                                <div className="note-header">
                                    <strong>{getNoteAuthorName(note.createdBy)}</strong>
                                    <span className="note-timestamp">
                                        {new Date(note.createdAt).toLocaleString()}
                                    </span>
                                </div>
                                <p>{note.text}</p>
                            </div>
                        ))
                    ) : (
                        <p>No notes yet.</p>
                    )}
                </div>

                {/* Add Note */}
                <div className="add-note">
                    <textarea
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        placeholder="Add a new note..."
                        rows={3}
                    />
                    <button onClick={handleAddNote} disabled={!newNote.trim()} className="app-button">
                        Add Note
                    </button>
                </div>
            </div>

            {/* Delete Button */}
            <div className="actions">
                <button onClick={handleDelete} className="app-button delete-button">
                    Delete Claim
                </button>
            </div>
        </div>
    )
}

export default ClaimDetail