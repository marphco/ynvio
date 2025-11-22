import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

export default function EventPublic() {
  const { slug } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rsvpName, setRsvpName] = useState("");
  const [rsvpGuests, setRsvpGuests] = useState(1);
  const [rsvpMessage, setRsvpMessage] = useState("");
  const [rsvpStatus, setRsvpStatus] = useState("yes");
  const [rsvpSending, setRsvpSending] = useState(false);
  const [rsvpDone, setRsvpDone] = useState(false);
  const [rsvpError, setRsvpError] = useState("");

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await fetch(`http://localhost:4000/api/events/${slug}`);
        if (!res.ok) {
          throw new Error("Evento non trovato");
        }
        const data = await res.json();
        setEvent(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [slug]);

  const handleRsvpSubmit = async (e) => {
    e.preventDefault();
    setRsvpError("");
    setRsvpDone(false);
    setRsvpSending(true);

    try {
      const res = await fetch("http://localhost:4000/api/rsvps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventSlug: slug,
          name: rsvpName,
          guestsCount: Number(rsvpGuests) || 1,
          message: rsvpMessage,
          status: rsvpStatus,
        }),
      });

      if (!res.ok) {
        throw new Error("Errore nell'invio RSVP");
      }

      setRsvpDone(true);
      setRsvpName("");
      setRsvpGuests(1);
      setRsvpMessage("");
      setRsvpStatus("yes");
    } catch (err) {
      console.error(err);
      setRsvpError("Non siamo riusciti a registrare la tua risposta. Riprova.");
    } finally {
      setRsvpSending(false);
    }
  };

  if (loading) return <p>Caricamento...</p>;
  if (!event) return <p>Evento non trovato.</p>;

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>{event.title}</h1>
      {event.dateTBD ? (
        <p style={{ opacity: 0.8 }}>📅 Data da definire</p>
      ) : event.date ? (
        <p>
          📅{" "}
          {new Date(event.date).toLocaleDateString("it-IT", {
            day: "2-digit",
            month: "long",
            year: "numeric",
          })}
        </p>
      ) : null}
      <hr />

      {event.blocks && event.blocks.length > 0 ? (
        event.blocks.map((block) => {
          if (block.type === "text") {
            return (
              <section key={block.id} style={{ margin: "1.5rem 0" }}>
                {block.props.heading && (
                  <h2 style={{ marginBottom: "0.5rem" }}>
                    {block.props.heading}
                  </h2>
                )}
                {block.props.body && <p>{block.props.body}</p>}
              </section>
            );
          }
          // altri tipi li gestiremo dopo
          return null;
        })
      ) : (
        <p>Nessun contenuto ancora.</p>
      )}

      {event.blocks?.some((b) => b.type === "rsvp") && (
        <section style={{ marginTop: "2rem" }}>
          <h2>Conferma la tua presenza</h2>
          <form
            onSubmit={handleRsvpSubmit}
            style={{
              maxWidth: "400px",
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
            }}
          >
            <input
              type="text"
              required
              placeholder="Il tuo nome"
              value={rsvpName}
              onChange={(e) => setRsvpName(e.target.value)}
              style={{ padding: "0.5rem" }}
            />
            <input
              type="number"
              min="1"
              placeholder="Numero di partecipanti"
              value={rsvpGuests}
              onChange={(e) => setRsvpGuests(e.target.value)}
              style={{ padding: "0.5rem" }}
            />
            <select
              value={rsvpStatus}
              onChange={(e) => setRsvpStatus(e.target.value)}
              style={{ padding: "0.5rem" }}
            >
              <option value="yes">Parteciperò</option>
              <option value="maybe">Forse</option>
              <option value="no">Non posso</option>
            </select>
            <textarea
              placeholder="Messaggio opzionale"
              rows={3}
              value={rsvpMessage}
              onChange={(e) => setRsvpMessage(e.target.value)}
              style={{ padding: "0.5rem" }}
            />

            <button type="submit" disabled={rsvpSending}>
              {rsvpSending ? "Invio in corso..." : "Invia risposta"}
            </button>

            {rsvpDone && (
              <p style={{ color: "lightgreen" }}>
                Grazie, abbiamo registrato la tua risposta ✅
              </p>
            )}
            {rsvpError && <p style={{ color: "salmon" }}>{rsvpError}</p>}
          </form>
        </section>
      )}
    </div>
  );
}
