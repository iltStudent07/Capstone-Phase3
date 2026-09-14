import mongoose from "mongoose";

// Creates a counter for the claimNumber field in Claim.ts
const counterSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  seq: {
    type: Number,
    required: true,
    default: 0,
  },
});

export default mongoose.model("Counter", counterSchema);