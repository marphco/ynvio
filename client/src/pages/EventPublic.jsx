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

  const orderedBlocks = [...(event.blocks || [])].sort(
    (a, b) => (a.order ?? 0) - (b.order ?? 0)
  );

  const API_BASE = "http://localhost:4000";
  const resolveImageUrl = (u) =>
    u?.startsWith("/uploads/") ? `${API_BASE}${u}` : u;

  // ✅ FUNZIONE SOLO PER RENDERIZZARE RSVP (NO DUPLICAZIONE)
  const renderRsvpBlock = (key) => (
    <section key={key} style={{ marginTop: "2rem" }}>
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
  );

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

      {orderedBlocks.length > 0 ? (
        orderedBlocks.map((block) => {
          // ✅ BLOCCO TESTO
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

          // ✅ BLOCCO MAPPA (con preview iframe)
          if (block.type === "map") {
            const title = block.props?.title || "";
            const address = block.props?.address || "";
            const mapUrl = block.props?.mapUrl || "";

            // fallback link Google Maps da indirizzo
            const fallbackUrl = address
              ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  address
                )}`
              : "";

            const finalUrl = mapUrl || fallbackUrl;

            // URL per iframe embed (usa sempre l'indirizzo, che è la cosa più stabile)
            const embedUrl = address
              ? `https://www.google.com/maps?q=${encodeURIComponent(
                  address
                )}&output=embed`
              : "";

            return (
              <section
                key={block.id}
                style={{
                  margin: "1.5rem 0",
                  padding: "1rem",
                  border: "1px solid #333",
                  borderRadius: "10px",
                  background: "#161616",
                  color: "#fff",
                }}
              >
                <h2 style={{ marginBottom: "0.5rem" }}>{title}</h2>

                {address && (
                  <p style={{ marginBottom: "0.75rem", opacity: 0.9 }}>
                    📍 {address}
                  </p>
                )}

                {/* Preview mappa */}
                {embedUrl ? (
                  <div
                    style={{
                      width: "100%",
                      height: "220px",
                      borderRadius: "8px",
                      overflow: "hidden",
                      border: "1px solid #2a2a2a",
                      marginBottom: "0.75rem",
                    }}
                  >
                    <iframe
                      title={`map-${block.id}`}
                      src={embedUrl}
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                  </div>
                ) : (
                  <p style={{ opacity: 0.7 }}>Indirizzo non disponibile.</p>
                )}

                {/* Bottone */}
                {finalUrl && (
                  <a
                    href={finalUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: "inline-block",
                      padding: "0.6rem 0.9rem",
                      borderRadius: "6px",
                      background: "#000",
                      color: "#fff",
                      textDecoration: "none",
                      fontSize: "0.95rem",
                    }}
                  >
                    Apri su Google Maps
                  </a>
                )}
              </section>
            );
          }

          // ✅ BLOCCO RSVP
          if (block.type === "rsvp") {
            return renderRsvpBlock(block.id || block._id);
          }

          // ✅ BLOCCO GALLERY
          if (block.type === "gallery") {
            const images = (block.props?.images || []).map(resolveImageUrl);

            return (
              <section
                key={block.id}
                style={{
                  margin: "1.5rem 0",
                  padding: "1rem",
                  border: "1px solid #333",
                  borderRadius: "10px",
                  background: "#161616",
                  color: "#fff",
                }}
              >
                <h2 style={{ marginBottom: "0.75rem" }}>Gallery</h2>

                {images.length === 0 ? (
                  <p style={{ opacity: 0.7 }}>Nessuna immagine disponibile.</p>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      gap: "0.6rem",
                      overflowX: "auto",
                      paddingBottom: "0.25rem",
                      scrollSnapType: "x mandatory",
                    }}
                  >
                    {images.map((url, i) => (
                      <div
                        key={`${block.id}-pub-img-${i}`}
                        style={{
                          minWidth: "170px",
                          height: "120px",
                          borderRadius: "8px",
                          overflow: "hidden",
                          border: "1px solid #2a2a2a",
                          background: "#0f0f0f",
                          scrollSnapAlign: "start",
                          flexShrink: 0,
                        }}
                      >
                        <img
                          src={url}
                          alt={`gallery-${i}`}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                          loading="lazy"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </section>
            );
          }

          return null;
        })
      ) : (
        <p>Nessun contenuto ancora.</p>
      )}
    </div>
  );
}
