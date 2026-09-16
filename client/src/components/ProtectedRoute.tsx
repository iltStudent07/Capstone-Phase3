import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'

function ProtectedRoute() {
  const { token, loading, user } = useAuth()
  const location = useLocation()

  console.log('ProtectedRoute render', {
    pathname: location.pathname,
    token,
    user,
    loading,
  })

  if (loading) return <p>Loading...</p>

  if (!token) {
    return <Navigate to="/login" replace />
  }
  
  return (
    <>
      <Navbar />
      <Outlet />
    </>
  )
}

export default ProtectedRoute