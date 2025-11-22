import mongoose from "mongoose";

const BlockSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },              // 👈 AGGIUNTO
    type: { type: String, required: true },            // es: "text", "image", "map", "rsvp"
    order: { type: Number, required: true },
    props: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { _id: false }
);

const EventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    date: { type: Date },
    templateId: { type: String, default: "basic-free" },
    status: { type: String, enum: ["draft", "published"], default: "draft" },
    blocks: { type: [BlockSchema], default: [] },
  },
  { timestamps: true }
);

const Event = mongoose.model("Event", EventSchema);

export default Event;
