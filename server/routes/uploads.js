import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";

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

// 5) route con middleware multer "pulito"
router.post("/", (req, res) => {
  console.log("UPLOAD CT:", req.headers["content-type"]);

  upload.array("images", 20)(req, res, (err) => {
    if (err) {
      console.error("UPLOAD ERROR:", err);
      return res.status(400).json({
        error: err.message || "Errore durante l'upload.",
        code: err.code,
      });
    }

    console.log("FILES:", (req.files || []).length); // 👈 quanti ne arrivano davvero
    const files = req.files || [];
    const urls = files.map((f) => `/uploads/${f.filename}`);
    return res.json({ urls });
  });
});

export default router;
