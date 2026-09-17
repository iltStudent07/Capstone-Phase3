import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function Register() {

    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [role, setRole] = useState('adjuster')
    const [error, setError] = useState('')
    const nav = useNavigate()
    const { register } = useAuth()

    return (
        <div className="auth-page">
            <div className="section-panel section-panel--padded auth-card">
            <h1>Register</h1>
             <form
                className="auth-form"
                onSubmit={async e=>{e.preventDefault()
                    try {
                        await register(name, email, password, role)
                        nav('/login')
                    } catch {
                        setError("There was an error registering User")
                    }
                }}>
                <input className="form-control" type='name' value={name} onChange={e=>setName(e.target.value)} placeholder="Name"/>

                <input className="form-control" type='email' value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email"/>

                <input className="form-control" type='password' value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password"/>

                <select className="form-control" value={role} onChange={e=>setRole(e.target.value)}>
                    <option value="adjuster">Adjuster</option>
                    <option value="admin">Admin</option>
                </select>

                <button className="app-button auth-submit">Register</button>
                <p className="auth-link">Already have an account? <Link to='/Login'>Click Here!</Link></p>
            </form>

            {error&&<p className="form-error">{error}</p>}
            </div>
        </div>
    )
}

export default Register