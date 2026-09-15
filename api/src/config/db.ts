import mongoose from 'mongoose'

async function connectDB() {
    try {
        const mongodbUri = process.env.MONGODB_URI
        if (!mongodbUri) {
            throw new Error('MONGODB_URI is not defined')
        }
        const conn = await mongoose.connect(mongodbUri)
        console.log(`MongoDB connected: ${conn.connection.host}`)
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err)
        console.error(`Database error: ${errorMessage}`)
        process.exit(1)
    }
}

export default connectDB