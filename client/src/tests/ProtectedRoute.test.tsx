import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { vi } from 'vitest'
import { AuthProvider } from '../context/AuthContext'
import ProtectedRoute from '../components/ProtectedRoute'

function renderProtectedApp(initialPath = '/dashboard') {
	return render(
		<MemoryRouter initialEntries={[initialPath]}>
			<AuthProvider>
				<Routes>
					<Route element={<ProtectedRoute />}>
						<Route path="/dashboard" element={<h1>Dashboard</h1>} />
					</Route>
					<Route path="/login" element={<h1>Login</h1>} />
				</Routes>
			</AuthProvider>
		</MemoryRouter>,
	)
}

describe('ProtectedRoute', () => {
	beforeEach(() => {
		vi.spyOn(console, 'log').mockImplementation(() => {})
		localStorage.clear()
	})

	afterEach(() => {
		vi.restoreAllMocks()
		localStorage.clear()
	})

	it('redirects unauthenticated users from protected routes to the Login page', () => {
		renderProtectedApp('/dashboard')

		expect(screen.getByRole('heading', { name: 'Login' })).toBeInTheDocument()
		expect(screen.queryByRole('heading', { name: 'Dashboard' })).not.toBeInTheDocument()
	})
})
