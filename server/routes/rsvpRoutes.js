import express from "express";
import Rsvp from "../models/Rsvp.js";

const router = express.Router();

// POST /api/rsvps -> crea una nuova RSVP
router.post("/", async (req, res) => {
  try {
    const { eventSlug, name, email, guestsCount, message, status } = req.body;

    if (!eventSlug || !name) {
      return res
        .status(400)
        .json({ message: "eventSlug e name sono obbligatori" });
    }

    const rsvp = await Rsvp.create({
      eventSlug,
      name,
      email,
      guestsCount,
      message,
      status: status || "yes",
    });

    res.status(201).json(rsvp);
  } catch (error) {
    console.error("Errore creazione RSVP:", error.message);
    res.status(500).json({ message: "Errore del server" });
  }
});

// PUT update RSVP
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, guestsCount, status, message } = req.body;

    const updated = await Rsvp.findByIdAndUpdate(
      id,
      {
        ...(name !== undefined ? { name } : {}),
        ...(guestsCount !== undefined ? { guestsCount } : {}),
        ...(status !== undefined ? { status } : {}),
        ...(message !== undefined ? { message } : {}),
      },
      { new: true }
    );

    if (!updated) return res.status(404).json({ error: "RSVP non trovata" });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Errore update RSVP" });
  }
});

// DELETE RSVP
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Rsvp.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ error: "RSVP non trovata" });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Errore delete RSVP" });
  }
});

export default router;
