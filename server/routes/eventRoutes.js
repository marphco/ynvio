import express from "express";
import Event from "../models/Event.js";
import Rsvp from "../models/Rsvp.js";
import { getRsvpsSummary } from "../controllers/rsvpSummaryController.js";

const router = express.Router();

// funzione helper per creare slug da una stringa
const slugify = (str) => {
  return str
    .toString()
    .normalize("NFD") // rimuove accenti
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-") // tutto ciò che non è a-z0-9 diventa -
    .replace(/^-+|-+$/g, ""); // rimuove trattini iniziali/finali
};

// POST /api/events  -> crea un nuovo evento
router.post("/", async (req, res) => {
  try {
    const { title, date, dateTBD, templateId, blocks } = req.body;
    const { plan } = req.body;

    if (!title) {
      return res.status(400).json({ message: "title è obbligatorio" });
    }

    // baseSlug generato dal titolo (+ data se presente)
    let baseSlug = slugify(title);
    if (!baseSlug) {
      baseSlug = "evento";
    }

    if (date && !dateTBD) {
      const d = new Date(date);
      if (!Number.isNaN(d.getTime())) {
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        baseSlug = `${baseSlug}-${yyyy}${mm}${dd}`;
      }
    }

    // trova uno slug libero: /slug, /slug-2, /slug-3, ecc.
    let slug = baseSlug;
    let counter = 1;

    // finché esiste un evento con questo slug, incrementiamo il numero
    while (await Event.exists({ slug })) {
      counter += 1;
      slug = `${baseSlug}-${counter}`;
    }

    const event = await Event.create({
      title,
      slug,
      date: dateTBD ? null : date,
      dateTBD: !!dateTBD,
      templateId: templateId || "basic-free",
      status: "draft",
      blocks: blocks || [],
      plan: plan || "free",
    });

    res.status(201).json(event);
  } catch (error) {
    console.error("Errore creazione evento:", error.message);
    res.status(500).json({ message: "Errore del server" });
  }
});

// GET /api/events -> lista tutti gli eventi (per ora senza auth)
router.get("/", async (req, res) => {
  try {
    const events = await Event.find().sort({ createdAt: -1 });
    res.json(events);
  } catch (error) {
    console.error("Errore lista eventi:", error.message);
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

// GET /api/events/:slug/rsvps -> lista RSVP di un evento
router.get("/:slug/rsvps", async (req, res) => {
  try {
    const { slug } = req.params;
    const rsvps = await Rsvp.find({ eventSlug: slug }).sort({ createdAt: -1 });
    res.json(rsvps);
  } catch (err) {
    console.error("Errore recupero rsvps:", err.message);
    res.status(500).json({ message: "Errore del server" });
  }
});

// PUT /api/events/:slug -> aggiorna un evento (es. blocchi)
router.put("/:slug", async (req, res) => {
  try {
    const { slug } = req.params;
    const { title, date, dateTBD, templateId, status, blocks, plan } = req.body;

    // 1) evento esistente
    const existing = await Event.findOne({ slug });
    if (!existing) {
      return res.status(404).json({ message: "Evento non trovato" });
    }

    // 2) plan "target": se dal client arriva plan, uso quello.
    //    altrimenti tengo quello già in DB.
    const targetPlan = (plan ?? existing.plan ?? "free").toLowerCase();
    const isPremium = targetPlan === "premium";

    // 3) se NON premium, elimino dal payload tutti i blocchi gallery
    let safeBlocks = Array.isArray(blocks) ? blocks : [];
    if (!isPremium) {
      safeBlocks = safeBlocks.filter((b) => b.type !== "gallery");
    }

    // 4) preparo update
    const update = {
      ...(title !== undefined && { title }),
      ...(templateId !== undefined && { templateId }),
      ...(status !== undefined && { status }),
      ...(blocks !== undefined && { blocks: safeBlocks }),
      ...(plan !== undefined && { plan: targetPlan }), // ✅ SALVA PLAN
    };

    // gestione data / TBD
    if (dateTBD === true) {
      update.dateTBD = true;
      update.date = null;
    } else if (dateTBD === false) {
      update.dateTBD = false;
      update.date = date || null;
    } else if (date) {
      update.dateTBD = false;
      update.date = date;
    }

    const event = await Event.findOneAndUpdate({ slug }, update, { new: true });

    res.json(event);
  } catch (error) {
    console.error("Errore aggiornamento evento:", error.message);
    res.status(500).json({ message: "Errore del server" });
  }
});

// DELETE /api/events/:slug -> elimina un evento
router.delete("/:slug", async (req, res) => {
  try {
    const { slug } = req.params;

    const deleted = await Event.findOneAndDelete({ slug });

    if (!deleted) {
      return res.status(404).json({ message: "Evento non trovato" });
    }

    res.json({ message: "Evento eliminato" });
  } catch (error) {
    console.error("Errore eliminazione evento:", error.message);
    res.status(500).json({ message: "Errore del server" });
  }
});

// RSVPs SUMMARY
router.get("/:slug/rsvps/summary", getRsvpsSummary);

export default router;
