import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

export default function EventPublic() {
  const { slug } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) return <p>Caricamento...</p>;
  if (!event) return <p>Evento non trovato.</p>;

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>{event.title}</h1>
      {event.date && (
        <p>
          📅 {new Date(event.date).toLocaleDateString("it-IT", {
            day: "2-digit",
            month: "long",
            year: "numeric",
          })}
        </p>
      )}
      <hr />

      <p>Qui verranno visualizzati i blocchi dell'evento.</p>
    </div>
  );
}
