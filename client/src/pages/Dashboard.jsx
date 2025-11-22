import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedSlug, setCopiedSlug] = useState(null);
  const [confirmDeleteSlug, setConfirmDeleteSlug] = useState(null);

  const deleteEvent = async (slug) => {
    try {
      const res = await fetch(`http://localhost:4000/api/events/${slug}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Errore eliminazione");

      // rimuovi subito dalla lista in UI
      setEvents((prev) => prev.filter((e) => e.slug !== slug));
      setConfirmDeleteSlug(null);
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

      // dopo 2s torna normale
      setTimeout(() => setCopiedSlug(null), 2000);
    } catch {
      // fallback se clipboard non va
      prompt("Copia il link:", url);
    }
  };

  const nativeShare = async (slug, title) => {
    const url = buildEventUrl(slug);
    const text = `Sei invitato a "${title}"!`;

    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        // eslint-disable-next-line no-unused-vars
      } catch (e) {
        // se l’utente annulla, non facciamo nulla
      }
    } else {
      // fallback: copia link
      copyLink(slug);
    }
  };

  useEffect(() => {
    async function fetchEvents() {
      try {
        const res = await fetch("http://localhost:4000/api/events");
        const data = await res.json();
        setEvents(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchEvents();
  }, []);

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
          {events.map((ev) => (
            <div
              key={ev._id}
              style={{
                border: "1px solid #333",
                borderRadius: "10px",
                padding: "1rem",
                background: "#161616",
              }}
            >
              <h2 style={{ margin: 0 }}>{ev.title}</h2>
              <p style={{ opacity: 0.8, marginTop: "0.25rem" }}>
                {ev.dateTBD
                  ? "📅 Data da definire"
                  : ev.date
                  ? `📅 ${new Date(ev.date).toLocaleDateString("it-IT")}`
                  : ""}
              </p>

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
                    background: copiedSlug === ev.slug ? "#1a1a1a" : undefined,
                    border:
                      copiedSlug === ev.slug ? "1px solid #4caf50" : undefined,
                    color: copiedSlug === ev.slug ? "#4caf50" : undefined,
                  }}
                >
                  {copiedSlug === ev.slug ? "Copiato ✅" : "Copia link"}
                </button>

                <button onClick={() => nativeShare(ev.slug, ev.title)}>
                  Condividi
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
          ))}
        </div>
      )}
    </div>
  );
}
