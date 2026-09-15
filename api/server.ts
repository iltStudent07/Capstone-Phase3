import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import authRoutes from './src/routes/authRoutes.js' 
import claimRoutes from './src/routes/claimRoutes.js'
import policyRoutes from './src/routes/policyRoutes.js'
import dashboardRoute from './src/routes/dashboard.js'
import connectDB from './src/config/db.js'
import handleApiErrors from './src/middleware/handleApiErrors.js'

const app = express()

app.use(cors())
app.use(express.json())

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/claims', claimRoutes)
app.use('/api/policies', policyRoutes)

//Dashboard Route
app.use('/api/dashboard', dashboardRoute)

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: "ok" })
});

// Centrailized Error Handling
app.use(handleApiErrors)

const PORT = process.env.PORT || 4000

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`)
  })
})