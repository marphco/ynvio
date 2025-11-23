import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE } from "../config/api";

export default function Dashboard() {
  const navigate = useNavigate();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedSlug, setCopiedSlug] = useState(null);
  const [confirmDeleteSlug, setConfirmDeleteSlug] = useState(null);
  const [rsvpSummaryBySlug, setRsvpSummaryBySlug] = useState({});

  const deleteEvent = async (slug) => {
    try {
      const res = await fetch(`${API_BASE}/api/events/${slug}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Errore eliminazione");

      setEvents((prev) => prev.filter((e) => e.slug !== slug));
      setConfirmDeleteSlug(null);

      // opzionale: pulisco anche i summary in UI
      setRsvpSummaryBySlug((prev) => {
        const copy = { ...prev };
        delete copy[slug];
        return copy;
      });
    } catch (err) {
      console.error(err);
      alert("Non siamo riusciti a eliminare l'evento. Riprova.");
    }
  };

  const buildEventUrl = (slug) => {
    const base = window.location.origin;
    return `${base}/e/${slug}`;
  };

  const copyLink = async (slug) => {
    const url = buildEventUrl(slug);
    try {
      await navigator.clipboard.writeText(url);
      setCopiedSlug(slug);
      setTimeout(() => setCopiedSlug(null), 2000);
    } catch {
      prompt("Copia il link:", url);
    }
  };

  const nativeShare = async (slug, title) => {
    const url = buildEventUrl(slug);
    const text = `Sei invitato a "${title}"!`;

    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
      } catch {
        // utente annulla → niente
      }
    } else {
      copyLink(slug);
    }
  };

  useEffect(() => {
    let cancelled = false;

    async function fetchEvents() {
      try {
        const res = await fetch(`${API_BASE}/api/events`);
        if (!res.ok) throw new Error("Errore fetch eventi");

        const data = await res.json();
        const safeEvents = Array.isArray(data) ? data : [];

        if (!cancelled) {
          setEvents(safeEvents);
        }

        // se non ci sono eventi, stoppo qui
        if (!safeEvents.length) {
          if (!cancelled) setRsvpSummaryBySlug({});
          return;
        }

        // prendo in parallelo i summary
        const summaries = await Promise.all(
          safeEvents.map(async (ev) => {
            try {
              const sRes = await fetch(
                `${API_BASE}/api/events/${ev.slug}/rsvps/summary`
              );
              if (!sRes.ok) return [ev.slug, null];
              const sData = await sRes.json();
              return [ev.slug, sData];
            } catch {
              return [ev.slug, null];
            }
          })
        );

        if (!cancelled) {
          setRsvpSummaryBySlug(Object.fromEntries(summaries));
        }
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setEvents([]);
          setRsvpSummaryBySlug({});
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchEvents();

    return () => {
      cancelled = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [API_BASE]);

  if (loading) return <p style={{ padding: "2rem" }}>Caricamento...</p>;

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "2rem",
        fontFamily: "sans-serif",
        background: "#111",
        color: "#f5f5f5",
      }}
    >
      <h1 style={{ marginBottom: "1rem" }}>I tuoi eventi</h1>

      <button
        onClick={() => navigate("/new")}
        style={{
          marginBottom: "1.5rem",
          padding: "0.75rem 1rem",
          background: "#000",
          color: "#fff",
          border: "none",
          cursor: "pointer",
        }}
      >
        + Crea nuovo evento
      </button>

      {events.length === 0 ? (
        <p>Nessun evento ancora. Creane uno!</p>
      ) : (
        <div style={{ display: "grid", gap: "0.75rem", maxWidth: "600px" }}>
          {events.map((ev) => {
            const sum = rsvpSummaryBySlug[ev.slug];

            return (
              <div
                key={ev._id}
                style={{
                  border: "1px solid #333",
                  borderRadius: "10px",
                  padding: "1rem",
                  background: "#161616",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "0.75rem",
                  }}
                >
                  <h2 style={{ margin: 0 }}>{ev.title}</h2>

                  <span
                    style={{
                      fontSize: "0.75rem",
                      padding: "0.25rem 0.5rem",
                      borderRadius: "999px",
                      border: "1px solid",
                      borderColor: ev.plan === "premium" ? "#f5c542" : "#666",
                      color: ev.plan === "premium" ? "#f5c542" : "#bbb",
                      background:
                        ev.plan === "premium"
                          ? "rgba(245,197,66,0.08)"
                          : "#111",
                      whiteSpace: "nowrap",
                      fontWeight: 600,
                      letterSpacing: "0.3px",
                    }}
                  >
                    {ev.plan === "premium" ? "⭐ Premium" : "Free"}
                  </span>
                </div>

                <p style={{ opacity: 0.8, marginTop: "0.25rem" }}>
                  {ev.dateTBD
                    ? "📅 Data da definire"
                    : ev.date
                    ? `📅 ${new Date(ev.date).toLocaleDateString("it-IT")}`
                    : ""}
                </p>

                {sum && sum.totalResponses > 0 && (
                  <p
                    style={{
                      marginTop: "0.5rem",
                      fontSize: "0.9rem",
                      opacity: 0.9,
                    }}
                  >
                    ✅ {sum.yesResponses} · 🤔 {sum.maybeResponses} · ❌{" "}
                    {sum.noResponses}
                    <span style={{ opacity: 0.7 }}>
                      {" "}
                      — 👥 {sum.totalGuests} ospiti
                    </span>
                  </p>
                )}

                <div
                  style={{
                    display: "flex",
                    gap: "0.5rem",
                    marginTop: "0.75rem",
                    flexWrap: "wrap",
                  }}
                >
                  <button onClick={() => navigate(`/edit/${ev.slug}`)}>
                    Apri editor
                  </button>
                  <button onClick={() => navigate(`/e/${ev.slug}`)}>
                    Apri pagina
                  </button>

                  <button
                    onClick={() => copyLink(ev.slug)}
                    style={{
                      transition: "all 0.2s ease",
                      background:
                        copiedSlug === ev.slug ? "#1a1a1a" : undefined,
                      border:
                        copiedSlug === ev.slug
                          ? "1px solid #4caf50"
                          : undefined,
                      color: copiedSlug === ev.slug ? "#4caf50" : undefined,
                    }}
                  >
                    {copiedSlug === ev.slug ? "Copiato ✅" : "Copia link"}
                  </button>

                  <button onClick={() => nativeShare(ev.slug, ev.title)}>
                    Condividi
                  </button>

                  <button onClick={() => navigate(`/rsvps/${ev.slug}`)}>
                    Vedi RSVP
                  </button>

                  <button
                    onClick={() => {
                      if (confirmDeleteSlug === ev.slug) {
                        deleteEvent(ev.slug);
                        return;
                      }

                      setConfirmDeleteSlug(ev.slug);
                      setTimeout(() => {
                        setConfirmDeleteSlug((current) =>
                          current === ev.slug ? null : current
                        );
                      }, 3000);
                    }}
                    style={{
                      transition: "all 0.2s ease",
                      background:
                        confirmDeleteSlug === ev.slug ? "#2a0000" : undefined,
                      border:
                        confirmDeleteSlug === ev.slug
                          ? "1px solid #ff4d4d"
                          : undefined,
                      color:
                        confirmDeleteSlug === ev.slug ? "#ff4d4d" : undefined,
                    }}
                  >
                    {confirmDeleteSlug === ev.slug
                      ? "Conferma elimina"
                      : "Elimina"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
