import express from "express";
import Event from "../models/Event.js";

const router = express.Router();

// POST /api/events  -> crea un nuovo evento
router.post("/", async (req, res) => {
  try {
    const { title, slug, date, templateId, blocks } = req.body;

    if (!title || !slug) {
      return res.status(400).json({ message: "title e slug sono obbligatori" });
    }

    const existing = await Event.findOne({ slug });
    if (existing) {
      return res.status(409).json({ message: "Slug già usato da un altro evento" });
    }

    const event = await Event.create({
      title,
      slug,
      date,
      templateId: templateId || "basic-free",
      blocks: blocks || [],
    });

    res.status(201).json(event);
  } catch (error) {
    console.error("Errore creazione evento:", error.message);
    res.status(500).json({ message: "Errore del server" });
  }
});

// GET /api/events/:slug  -> recupera un evento pubblico per slug
router.get("/:slug", async (req, res) => {
  try {
    const { slug } = req.params;

    const event = await Event.findOne({ slug });

    if (!event) {
      return res.status(404).json({ message: "Evento non trovato" });
    }

    res.json(event);
  } catch (error) {
    console.error("Errore recupero evento:", error.message);
    res.status(500).json({ message: "Errore del server" });
  }
});

export default router;
