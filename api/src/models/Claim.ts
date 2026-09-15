import mongoose from "mongoose";
import Counter from "./Counter.js";
import Note from "./Note.js"

const claimSchema = new mongoose.Schema(
  {
    claimNumber: {
        type: String,
        unique: true,
        index: true,
    },
    policy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Policy",
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    incidentDate: {
        type: String,
        required: true,
    },
    amount: {
        type: Number,
        min: 0,
    },
    status: {
        type: String,
        enum: ["submitted", "under-review", "approved", "denied", "closed"],
        default: "submitted"
    },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    notes: {
        type: [Note],
        default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Generates a number based off of what number the counter is on and sets it in the claimNumber field (eg. CLM-1001, CLM-1002)
claimSchema.pre("save", async function () {
  if (!this.isNew || this.claimNumber) return;

  const counter = await Counter.findOneAndUpdate(
    { name: "claimNumber" },
    {
      $inc: { seq: 1 },
      $setOnInsert: { name: "claimNumber" },
    },
    { returnDocument: "after", upsert: true }
  );

  this.claimNumber = `CLM-${String(counter.seq).padStart(4, "0")}`;
});

export default mongoose.model("Claim", claimSchema);