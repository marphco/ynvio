import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import eventRoutes from "./routes/eventRoutes.js";
import rsvpRoutes from "./routes/rsvpRoutes.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "YNVIO API is running" });
});

// 👇 registra le API degli eventi
app.use("/api/events", eventRoutes);
app.use("/api/rsvps", rsvpRoutes);

const PORT = process.env.PORT || 4000;

const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
};

startServer();
