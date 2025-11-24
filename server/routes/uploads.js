import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import Event from "../models/Event.js"; // ✅ aggiungi questo

const router = express.Router();

// 1) cartella uploads assoluta
const UPLOAD_DIR = path.join(process.cwd(), "uploads");
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// 2) storage su disco con destination ASSOLUTA
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, name);
  },
});

// 3) filtro immagini
const fileFilter = (req, file, cb) => {
  const isImage = file.mimetype && file.mimetype.startsWith("image/");
  if (!isImage) return cb(new Error("Puoi caricare solo immagini."), false);
  cb(null, true);
};

// 4) limiti MVP
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 15 * 1024 * 1024,
    files: 20,
  },
});

// ✅ 5) MIDDLEWARE PREMIUM: QUI VA IL TUO CODICE
const requirePremiumForGalleryUpload = async (req, res, next) => {
  try {
    const { slug } = req.query;
    if (!slug) return res.status(400).json({ error: "Missing slug" });

    const ev = await Event.findOne({ slug });
    if (!ev) return res.status(404).json({ error: "Evento non trovato" });

    const isPremium = (ev.plan || "free").toLowerCase() === "premium";
    if (!isPremium) {
      return res.status(403).json({ error: "Gallery solo Premium" });
    }

    next(); // ok, lascia andare multer
  } catch (err) {
    next(err);
  }
};

// ✅ 6) ROUTE PULITA: middleware -> multer -> handler
router.post(
  "/",
  requirePremiumForGalleryUpload,
  upload.array("images", 20),
  (req, res) => {
    const files = req.files || [];
    const urls = files.map((f) => `/uploads/${f.filename}`);
    return res.json({ urls });
  }
);

export default router;
