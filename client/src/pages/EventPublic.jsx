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
        📅{" "}
        {new Date(event.date).toLocaleDateString("it-IT", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        })}
      </p>
    )}
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
  </div>
);

}
