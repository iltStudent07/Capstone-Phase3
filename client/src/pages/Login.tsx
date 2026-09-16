import { Link } from 'react-router-dom'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const nav = useNavigate()
    const { login } = useAuth()

    return (
        <div className="auth-page">
            <div className="section-panel section-panel--padded auth-card">
            <h1>Sign In</h1>
            <form
                className="auth-form"
                onSubmit={async e=>{e.preventDefault()
                    try {
                        await login(email, password)
                        nav('/dashboard')
                    } catch {
                        setError("Email or Password is incorrect")
                    }
                }}>
                <input className="form-control" type='email' value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email"/>

                <input className="form-control" type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password"/>

                <button className="app-button auth-submit">Login</button>
            </form>

            {error&&<p className="form-error">{error}</p>}

            <p className="auth-link">Need to register? <Link to='/register'>Click Here!</Link></p>
            </div>
        </div>
    )
}

export default Login