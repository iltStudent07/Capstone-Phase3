import { AuthProvider } from './context/AuthContext'
import { Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import NotFound from './pages/NotFound'
import ProtectedRoute from './components/ProtectedRoute'
import Dashboard from './pages/Dashboard'
import ClaimsList from './pages/ClaimsList'
import './App.css'

function App() {


  return (
    <>
      <AuthProvider>
        <main>
          <Routes>
            <Route path='/' element={<ProtectedRoute />}>
              <Route index element={<Dashboard />} />
              <Route path='/claims' element={<ClaimsList />} />
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
