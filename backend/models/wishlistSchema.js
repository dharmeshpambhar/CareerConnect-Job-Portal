import mongoose from "mongoose";

const wishlistSchema = new mongoose.Schema({
  // ── References (for Mongoose .populate()) ──────────────────────────────────
  user: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: true,
  },
  job: {
    type: mongoose.Schema.ObjectId,
    ref: "Job",
    required: true,
  },

  // ── Human-readable snapshot (visible directly in MongoDB Atlas) ────────────
  userDetails: {
    name:  { type: String, default: "" },
    email: { type: String, default: "" },
  },
  jobDetails: {
    title:       { type: String, default: "" },
    category:    { type: String, default: "" },
    city:        { type: String, default: "" },
    country:     { type: String, default: "" },
    location:    { type: String, default: "" },
    companyName: { type: String, default: "" },
    salary: {
      fixed:   { type: Number, default: null },
      from:    { type: Number, default: null },
      to:      { type: Number, default: null },
    },
  },

  addedAt: {
    type: Date,
    default: Date.now,
  },
});

// Ensure a user cannot save the same job twice
wishlistSchema.index({ user: 1, job: 1 }, { unique: true });

export const Wishlist = mongoose.model("Wishlist", wishlistSchema);
