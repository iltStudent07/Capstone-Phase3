import { AuthProvider } from './context/AuthContext'
import { Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import NotFound from './pages/NotFound'
import ProtectedRoute from './components/ProtectedRoute'
import Dashboard from './pages/Dashboard'
import ClaimsList from './pages/ClaimsList'
import ClaimsDetail from './pages/ClaimsDetail'
import './App.css'

function App() {


  return (
    <>
      <AuthProvider>
        <main>
          <Routes>
            <Route element={<ProtectedRoute />}>
              <Route path='/dashboard' element={<Dashboard />} />
              <Route path='/claims' element={<ClaimsList />} />
              <Route path='/claims/:id' element={<ClaimsDetail />} />
            </Route>
            <Route path='/login' element={<Login />} />
            <Route path='register' element={<Register />} />
            <Route path='*' element={<NotFound />} />
          </Routes>
        </main>
      </AuthProvider>
    </>
  )
}

export default App
