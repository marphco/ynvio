import express from "express";
import multer from "multer";
import path from "path";

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, name);
  },
});

const upload = multer({ storage });

// accetta più immagini
router.post("/", upload.array("images", 20), (req, res) => {
  const files = req.files || [];

  const baseUrl = `${req.protocol}://${req.get("host")}`; 
  // es: http://localhost:4000

  const urls = files.map((f) => `${baseUrl}/uploads/${f.filename}`);

  res.json({ urls });
});

export default router;
