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
        <div>
            <h1>Sign In</h1>
            <form
                onSubmit={async e=>{e.preventDefault()
                    try {
                        await login(email, password)
                        nav('/')
                    } catch {
                        setError("Email or Password is incorrect")
                    }
                }}>
                <input type='email' value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email"/>

                <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password"/>

                <button>Login</button>
            </form>

            {error&&<p className="error">{error}</p>}

            <p>Need to register? <Link to='/register'>Click Here!</Link></p>
        </div>
    )
}

export default Login