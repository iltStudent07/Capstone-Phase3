import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
        <div>
            <h1>Register</h1>
             <form
                onSubmit={async e=>{e.preventDefault()
                    try {
                        await register(name, email, password, role)
                        nav('/login')
                    } catch {
                        setError("There was an error registering User")
                    }
                }}>
                <input type='name' value={name} onChange={e=>setName(e.target.value)} placeholder="Name"/>

                <input type='email' value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email"/>

                <input type='password' value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password"/>

                <select value={role} onChange={e=>setRole(e.target.value)}>
                    <option value="adjuster">Adjuster</option>
                    <option value="admin">Admin</option>
                </select>

                <button>Login</button>
            </form>

            {error&&<p className="error">{error}</p>}
        </div>
    )
}

export default Register