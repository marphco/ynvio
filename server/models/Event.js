import mongoose from "mongoose";

const BlockSchema = new mongoose.Schema(
  {
    type: { type: String, required: true }, // es: "hero", "text", "image", "map", "rsvp"
    order: { type: Number, required: true },
    props: { type: mongoose.Schema.Types.Mixed, default: {} }, // contenuto del blocco
  },
  { _id: false }
);

const EventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },        // es: "Matrimonio Luca & Sara"
    slug: { type: String, required: true, unique: true }, // es: "luca-sara-2025"
    date: { type: Date },                           // opzionale per ora
    templateId: { type: String, default: "basic-free" },
    status: { type: String, enum: ["draft", "published"], default: "draft" },
    blocks: { type: [BlockSchema], default: [] },   // i blocchi della pagina
  },
  { timestamps: true }
);

const Event = mongoose.model("Event", EventSchema);

export default Event;
