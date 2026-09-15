import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'

function Navbar() {
  const linkStyle = ({ isActive }: { isActive: boolean }) => ({
    color: isActive ? '#2574A9' : '#333',
    fontWeight: isActive ? 'bold' as const : 'normal' as const,
    textDecoration: 'none',
    padding: '8px 16px',
  });

  const { user, logout } = useAuth()

  return (
    <div>
       <nav style={{
            display: 'flex',
            gap: '8px',
            padding: '16px',
            backgroundColor: '#f4f6f9',
            borderBottom: '2px solid #ddd',
            }}>
            <NavLink to="/" style={linkStyle}>Home</NavLink>
            <NavLink to="/claims" style={linkStyle}>Claims</NavLink>
            <NavLink to="/policies" style={linkStyle}>Policies</NavLink>

            {user.name}
            {user.role}
            <button onClick={logout}>Logout</button> 
        </nav>

        
    </div>
    
  );
}

export default Navbar;