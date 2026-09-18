import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom/vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { vi } from 'vitest'
import { AuthProvider } from '../context/AuthContext'
import Login from '../pages/Login'
import Register from '../pages/Register'

const postMock = vi.hoisted(() => vi.fn())

vi.mock('../services/api', () => ({
    default: {
        post: postMock,
    },
}))

function renderLogin(initialPath = '/') {
    return render(
        <MemoryRouter initialEntries={[initialPath]}>
            <AuthProvider>
                <Routes>
                    <Route path="/" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/dashboard" element={<h1>Dashboard</h1>} />
                </Routes>
            </AuthProvider>
        </MemoryRouter>,
    )
}


describe('Login Page', () => {
    beforeEach(() => {
        postMock.mockReset()
        localStorage.clear()
    })

    it('renders the email and password fields', () => {
        renderLogin()

        expect(screen.getByPlaceholderText('Email')).toBeInTheDocument()
        expect(screen.getByPlaceholderText('Password')).toBeInTheDocument()
    })

    it('sends the payload from the form when the Login button is clicked', async () => {
        postMock.mockResolvedValueOnce({
            data: {
                token: 'test-token',
                user: {
                    _id: '1',
                    name: 'Test User',
                    email: 'test@example.com',
                    role: 'adjuster',
                },
            },
        })

        const user = userEvent.setup()
        renderLogin()

        await user.type(screen.getByPlaceholderText('Email'), 'test@example.com')
        await user.type(screen.getByPlaceholderText('Password'), 'password123')
        await user.click(screen.getByRole('button', { name: 'Login' }))

        await waitFor(() => {
            expect(postMock).toHaveBeenCalledWith('/auth/login', {
                email: 'test@example.com',
                password: 'password123',
            })
        })
    })

    it('recieves a bearer token after a user logs in', async () => {
        postMock.mockResolvedValueOnce({
            data: {
                token: 'bearer-token-123',
                user: {
                    _id: '1',
                    name: 'Test User',
                    email: 'test@example.com',
                    role: 'adjuster',
                },
            },
        })

        const user = userEvent.setup()
        renderLogin()

        await user.type(screen.getByPlaceholderText('Email'), 'test@example.com')
        await user.type(screen.getByPlaceholderText('Password'), 'password123')
        await user.click(screen.getByRole('button', { name: 'Login' }))

        await waitFor(() => {
            expect(localStorage.getItem('token')).toBe('bearer-token-123')
        })
    })

    it('redirects to the Register page when Click Here! is clicked', async () => {
        const user = userEvent.setup()
        renderLogin()

        await user.click(screen.getByRole('link', { name: 'Click Here!' }))

        expect(screen.getByRole('heading', { name: 'Register' })).toBeInTheDocument()
    })

})