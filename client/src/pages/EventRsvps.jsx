import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

export default function EventRsvps() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [rsvps, setRsvps] = useState([]);
  const [eventTitle, setEventTitle] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAll() {
      try {
        // 1) prendo evento per titolo
        const evRes = await fetch(`http://localhost:4000/api/events/${slug}`);
        if (evRes.ok) {
          const evData = await evRes.json();
          setEventTitle(evData.title || slug);
        } else {
          setEventTitle(slug);
        }

        // 2) prendo rsvps
        const rRes = await fetch(
          `http://localhost:4000/api/events/${slug}/rsvps`
        );
        const rData = await rRes.json();
        setRsvps(Array.isArray(rData) ? rData : []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, [slug]);

  // totale ospiti che hanno detto "yes"
  const totalGuestsYes = useMemo(() => {
    return rsvps
      .filter((r) => r.status === "yes")
      .reduce((sum, r) => sum + (Number(r.guestsCount) || 1), 0);
  }, [rsvps]);

  const totalYesResponses = useMemo(() => {
    return rsvps.filter((r) => r.status === "yes").length;
  }, [rsvps]);

  if (loading) return <p style={{ padding: "2rem" }}>Caricamento RSVP...</p>;

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "2rem",
        background: "#111",
        color: "#fff",
        fontFamily: "sans-serif",
      }}
    >
      <button
        onClick={() => navigate("/")}   // ✅ fix routing MVP
        style={{ marginBottom: "1rem" }}
      >
        ← Torna alla dashboard
      </button>

      <h1 style={{ marginBottom: "0.5rem" }}>RSVP: {eventTitle}</h1>

      <p style={{ opacity: 0.8, marginBottom: "1.5rem" }}>
        ✅ Conferme: {totalYesResponses} — 👥 Ospiti totali: {totalGuestsYes}
      </p>

      {rsvps.length === 0 ? (
        <p>Nessuna RSVP ancora.</p>
      ) : (
        <div style={{ display: "grid", gap: "0.75rem", maxWidth: "600px" }}>
          {rsvps.map((r) => (
            <div
              key={r._id}
              style={{
                border: "1px solid #333",
                borderRadius: "10px",
                padding: "1rem",
                background: "#161616",
              }}
            >
              <strong>{r.name}</strong>{" "}
              <span style={{ opacity: 0.8 }}>
                ({r.guestsCount} ospiti)
              </span>

              <p style={{ margin: "0.5rem 0" }}>
                Status:{" "}
                <strong>
                  {r.status === "yes"
                    ? "✅ Partecipa"
                    : r.status === "maybe"
                    ? "🤔 Forse"
                    : "❌ No"}
                </strong>
              </p>

              {r.message && <p>💬 {r.message}</p>}

              <small style={{ opacity: 0.6 }}>
                {new Date(r.createdAt).toLocaleString("it-IT")}
              </small>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
