import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'

function Navbar() {
  const linkClassName = ({ isActive }: { isActive: boolean }) =>
    `nav-link${isActive ? ' nav-link--active' : ''}`

  const { user, logout } = useAuth()

  return (
    <div>
       <nav className="navbar">
            <div className="navbar__links">
              <NavLink to="/dashboard" className={linkClassName}>Dashboard</NavLink>
              <NavLink to="/claims" className={linkClassName}>Claims</NavLink>
              <NavLink to="/policies" className={linkClassName}>Policies</NavLink>
            </div>

            <div className="navbar__meta">
              {user && (
                <>
                  <span className="navbar__user">{user.name}</span>
                  <span className={`status-pill role-status--${user.role} navbar__user`}>{user.role}</span>
                </>
              )}
              <button onClick={logout} className="app-button navbar__logout">Logout</button>
            </div>
        </nav>

        
    </div>
    
  );
}

export default Navbar;