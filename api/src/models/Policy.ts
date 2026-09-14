import mongoose from  'mongoose'

const policySchema = new mongoose.Schema(
    {
        policyNumber: {
            type: String,
            required: true,
            unique: true,
            uppercase: true,
        },
        holderName: {
            type: String,
            required: true,
        },
        type: {
            type: String,
            enum: ["auto", "home", "life"],
        },
        premium: {
            type: Number,
            min: 0,
        },
        status: {
            type: String,
            enum: ["active", "expired", "cancelled"],
        },
        effectiveDate: {
            type: String,
        },
        expriationDate: {
            type: String,
        },
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    { timestamps: true },
)

export default mongoose.model("Policy", policySchema)