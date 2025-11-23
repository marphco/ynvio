import Rsvp from "../models/Rsvp.js";

// GET /api/events/:slug/rsvps/summary
export const getRsvpsSummary = async (req, res, next) => {
  try {
    const { slug } = req.params;

    // prendo solo status e guestsCount di quel solo evento
    const rsvps = await Rsvp.find({ eventSlug: slug }).select(
      "status guestsCount"
    );

    const summary = {
      yesResponses: 0,
      maybeResponses: 0,
      noResponses: 0,
      yesGuests: 0,
      maybeGuests: 0,
      noGuests: 0,
      totalResponses: 0,
      totalGuests: 0,
    };

    for (const r of rsvps) {
      const guests = Number(r.guestsCount) || 1;

      if (r.status === "yes") {
        summary.yesResponses += 1;
        summary.yesGuests += guests;
      } else if (r.status === "maybe") {
        summary.maybeResponses += 1;
        summary.maybeGuests += guests;
      } else if (r.status === "no") {
        summary.noResponses += 1;
        summary.noGuests += guests;
      }
    }

    summary.totalResponses =
      summary.yesResponses + summary.maybeResponses + summary.noResponses;

    summary.totalGuests =
      summary.yesGuests + summary.maybeGuests + summary.noGuests;

    return res.json(summary);
  } catch (err) {
    next(err);
  }
};
