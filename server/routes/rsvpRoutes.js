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

export default router;
