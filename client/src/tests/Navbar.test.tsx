import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom/vitest'
import { MemoryRouter, Outlet, Route, Routes } from 'react-router-dom'
import { vi } from 'vitest'
import { AuthProvider } from '../context/AuthContext'
import Navbar from '../components/Navbar'

function ProtectedLayout() {
	return (
		<>
			<Navbar />
			<Outlet />
		</>
	)
}

function renderNavbarApp(initialPath = '/dashboard') {
	return render(
		<MemoryRouter initialEntries={[initialPath]}>
			<AuthProvider>
				<Routes>
					<Route element={<ProtectedLayout />}>
						<Route path="/dashboard" element={<h1>Dashboard</h1>} />
						<Route path="/claims" element={<h1>Claims</h1>} />
						<Route path="/policies" element={<h1>Policies</h1>} />
					</Route>
					<Route path="/login" element={<h1>Login</h1>} />
					<Route path="/register" element={<h1>Register</h1>} />
				</Routes>
			</AuthProvider>
		</MemoryRouter>,
	)
}

describe('Navbar', () => {
	beforeEach(() => {
		vi.spyOn(console, 'log').mockImplementation(() => {})
		localStorage.clear()
		localStorage.setItem('token', 'test-token')
		localStorage.setItem(
			'user',
			JSON.stringify({
				_id: '1',
				name: 'Jane Adjuster',
				email: 'jane@example.com',
				role: 'adjuster',
			}),
		)
	})

	afterEach(() => {
		vi.restoreAllMocks()
		localStorage.clear()
	})

	it('renders the navigation links', () => {
		renderNavbarApp()

		expect(screen.getByRole('link', { name: 'Dashboard' })).toBeInTheDocument()
		expect(screen.getByRole('link', { name: 'Claims' })).toBeInTheDocument()
		expect(screen.getByRole('link', { name: 'Policies' })).toBeInTheDocument()
	})

	it('renders the app name and logo', () => {
		renderNavbarApp()

		expect(screen.getByText(/policy claims tracker/i)).toBeInTheDocument()
	})

	it('renders a user and their role', () => {
		renderNavbarApp()

		expect(screen.getByText('Jane Adjuster')).toBeInTheDocument()
		expect(screen.getByText('adjuster')).toBeInTheDocument()
	})

	it('takes the user to the correct page when a navigation link is clicked', async () => {
		const user = userEvent.setup()
		renderNavbarApp('/dashboard')

		await user.click(screen.getByRole('link', { name: 'Claims' }))

		expect(screen.getByRole('heading', { name: 'Claims' })).toBeInTheDocument()
	})

	it('logout button logs the user out and redirects them to the Login page', async () => {
		const user = userEvent.setup()
		renderNavbarApp('/dashboard')

		await user.click(screen.getByRole('button', { name: 'Logout' }))

		expect(localStorage.getItem('token')).toBeNull()
		expect(localStorage.getItem('user')).toBeNull()
		expect(screen.getByRole('heading', { name: 'Login' })).toBeInTheDocument()
	})
})
