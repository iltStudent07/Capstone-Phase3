import mongoose from 'mongoose'
import Counter from './Counter.js'

const policyPrefixByType = {
    auto: 'AUTO',
    home: 'HOME',
    life: 'LIFE',
} as const

const getPolicyPrefix = (policyType: string) => (
    policyPrefixByType[policyType as keyof typeof policyPrefixByType]
)

const ensurePolicyNumber = async (doc: mongoose.Document & {
    isNew: boolean
    policyNumber?: string | null
    get: (path: string) => unknown
    invalidate: (path: string, err: string) => void
    constructor: unknown
}) => {
    if (!doc.isNew || doc.policyNumber) return

    const policyType = String(doc.get('type') || '').toLowerCase()
    const prefix = getPolicyPrefix(policyType)

    if (!prefix) {
        doc.invalidate('type', 'type must be one of: auto, home, life')
        return
    }

    const year = new Date().getFullYear()
    const counterName = `policyNumber:${prefix}:${year}`
    const PolicyModel = doc.constructor as mongoose.Model<{ policyNumber?: string }>

    const existingCounter = await Counter.findOne({ name: counterName })

    if (!existingCounter) {
        const latestPolicy = await PolicyModel.findOne({
            policyNumber: new RegExp(`^${prefix}-${year}-\\d{3}$`),
        })
            .sort({ policyNumber: -1 })
            .select('policyNumber')
            .lean()

        const lastSequence = latestPolicy?.policyNumber
            ? Number(latestPolicy.policyNumber.split('-').pop()) || 0
            : 0

        await Counter.findOneAndUpdate(
            { name: counterName },
            {
                $setOnInsert: {
                    name: counterName,
                    seq: lastSequence,
                },
            },
            { new: true, upsert: true },
        )
    }

    const counter = await Counter.findOneAndUpdate(
        { name: counterName },
        { $inc: { seq: 1 } },
        { new: true },
    )

    if (!counter) {
        throw new Error('Failed to generate policy number')
    }

    doc.policyNumber = `${prefix}-${year}-${String(counter.seq).padStart(3, '0')}`
}

const policySchema = new mongoose.Schema(
    {
        policyNumber: {
            type: String,
            unique: true,
            uppercase: true,
        },
        holderName: {
            type: String,
            required: true,
        },
        type: {
            type: String,
            enum: ['auto', 'home', 'life'],
            required: true,
        },
        premium: {
            type: Number,
            min: 0,
        },
        status: {
            type: String,
            enum: ['active', 'expired', 'cancelled'],
        },
        effectiveDate: {
            type: String,
        },
        expriationDate: {
            type: String,
        },
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
    },
    { timestamps: true },
)

policySchema.pre('validate', async function () {
    await ensurePolicyNumber(this)
})

policySchema.pre('save', async function () {
    await ensurePolicyNumber(this)
})

export default mongoose.model('Policy', policySchema)