import express from 'express'
import request from 'supertest'
import { Types } from 'mongoose'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const signMock = vi.fn()
const verifyMock = vi.fn()
const userFindOneMock = vi.fn()
const userCreateMock = vi.fn()
const userFindByIdMock = vi.fn()
const claimCreateMock = vi.fn()

vi.mock('jsonwebtoken', () => ({
	default: {
		sign: signMock,
		verify: verifyMock,
	},
}))

vi.mock('../models/User.js', () => ({
	default: {
		findOne: userFindOneMock,
		create: userCreateMock,
		findById: userFindByIdMock,
	},
}))

vi.mock('../models/Claim.js', () => ({
	default: {
		create: claimCreateMock,
	},
}))

const { default: authRoutes } = await import('../routes/authRoutes.js')
const { default: claimRoutes } = await import('../routes/claimRoutes.js')

function createTestApp() {
	const app = express()
	app.use(express.json())
	app.use('/api/auth', authRoutes)
	app.use('/api/claims', claimRoutes)
	return app
}

describe('API routes', () => {
	beforeEach(() => {
		process.env.JWT_SECRET = 'test-secret'
		signMock.mockReset()
		verifyMock.mockReset()
		userFindOneMock.mockReset()
		userCreateMock.mockReset()
		userFindByIdMock.mockReset()
		claimCreateMock.mockReset()
		vi.spyOn(console, 'log').mockImplementation(() => {})
		vi.spyOn(console, 'error').mockImplementation(() => {})
	})

	afterEach(() => {
		vi.restoreAllMocks()
	})

	it('register returns a token', async () => {
		userFindOneMock.mockResolvedValueOnce(null)
		userCreateMock.mockResolvedValueOnce({
			_id: '507f1f77bcf86cd799439011',
			name: 'Test User',
			email: 'test@example.com',
			role: 'adjuster',
		})
		signMock.mockReturnValueOnce('signed-jwt-token')

		const response = await request(createTestApp()).post('/api/auth/register').send({
			name: 'Test User',
			email: 'test@example.com',
			password: 'password123',
		})

		expect(response.status).toBe(201)
		expect(response.body.token).toBe('signed-jwt-token')
		expect(response.body.user).toMatchObject({
			name: 'Test User',
			email: 'test@example.com',
			role: 'adjuster',
		})
	})

	it('login with a wrong password returns 401', async () => {
		userFindOneMock.mockReturnValueOnce({
			select: vi.fn().mockResolvedValue({
				_id: '507f1f77bcf86cd799439011',
				name: 'Test User',
				email: 'test@example.com',
				role: 'adjuster',
				comparePassword: vi.fn().mockResolvedValue(false),
			}),
		})

		const response = await request(createTestApp()).post('/api/auth/login').send({
			email: 'test@example.com',
			password: 'wrong-password',
		})

		expect(response.status).toBe(401)
		expect(response.body).toEqual({ error: 'Invalid email or password' })
	})

	it('create a claim returns 201', async () => {
		const userId = new Types.ObjectId().toString()
		const policyId = new Types.ObjectId().toString()

		verifyMock.mockReturnValueOnce({ userId })
		userFindByIdMock.mockResolvedValueOnce({
			_id: userId,
			name: 'Adjuster User',
			email: 'adjuster@example.com',
			role: 'adjuster',
		})
		claimCreateMock.mockImplementationOnce(async (payload) => ({
			_id: '507f1f77bcf86cd799439099',
			claimNumber: 'CLM-1001',
			status: 'submitted',
			...payload,
		}))

		const response = await request(createTestApp())
			.post('/api/claims')
			.set('Authorization', 'Bearer valid-token')
			.send({
				policy: policyId,
				description: 'Wind damage to roof',
				incidentDate: '2026-09-17',
				amount: 2500,
			})

		expect(response.status).toBe(201)
		expect(response.body).toMatchObject({
			claimNumber: 'CLM-1001',
			policy: policyId,
			description: 'Wind damage to roof',
			incidentDate: '2026-09-17',
			amount: 2500,
			assignedTo: userId,
		})
	})

	it('get claims without auth returns 401', async () => {
		const response = await request(createTestApp()).get('/api/claims')

		expect(response.status).toBe(401)
		expect(response.body).toEqual({ error: 'Authentication required' })
	})

	it('create claim with missing fields returns 400', async () => {
		const userId = new Types.ObjectId().toString()

		verifyMock.mockReturnValueOnce({ userId })
		userFindByIdMock.mockResolvedValueOnce({
			_id: userId,
			name: 'Adjuster User',
			email: 'adjuster@example.com',
			role: 'adjuster',
		})

		const response = await request(createTestApp())
			.post('/api/claims')
			.set('Authorization', 'Bearer valid-token')
			.send({
				description: 'Missing required fields',
			})

		expect(response.status).toBe(400)
		expect(response.body.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ msg: 'policy is required' }),
				expect.objectContaining({ msg: 'incidentDate is required' }),
			]),
		)
	})
})
