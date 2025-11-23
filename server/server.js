import path from "path";
import fs from "fs";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import eventRoutes from "./routes/eventRoutes.js";
import rsvpRoutes from "./routes/rsvpRoutes.js";
import uploadsRouter from "./routes/uploads.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
app.use("/api/uploads", uploadsRouter);

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

app.use((err, req, res, next) => {
  console.error("GLOBAL ERROR:", err);
  res.status(err.status || 500).json({
    error: err.message || "Errore server",
  });
});

startServer();
