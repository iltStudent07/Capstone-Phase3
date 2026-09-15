import { createContext, useContext, useEffect, useState } from 'react'
import api from '../services/api'
import type { User, AuthContextValue } from '../types/types.ts'


// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const storedToken = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')

    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (storedToken) setToken(storedToken)
    if (storedUser) setUser(JSON.parse(storedUser))

    setLoading(false)
  }, []);

  const persistAuth = (newToken: string, newUser: User) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser))
    setToken(newToken);
    setUser(newUser);
  };

  const login = async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password });
    persistAuth(data.token, data.user)
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    role: string,
  ) => {
    const { data } = await api.post('/auth/register', {
      name,
      email,
      password,
      role,
    });
    persistAuth(data.token, data.user);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within a AuthProvider')
  }

  return context
}