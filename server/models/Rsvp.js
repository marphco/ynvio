import mongoose from "mongoose";

const RsvpSchema = new mongoose.Schema(
  {
    eventSlug: { type: String, required: true }, // colleghiamo via slug per ora
    name: { type: String, required: true },
    email: { type: String },
    guestsCount: { type: Number, default: 1 },
    message: { type: String },
    status: {
      type: String,
      enum: ["yes", "no", "maybe"],
      default: "yes",
    },
  },
  { timestamps: true }
);

const Rsvp = mongoose.model("Rsvp", RsvpSchema);

export default Rsvp;
