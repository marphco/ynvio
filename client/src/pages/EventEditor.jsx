import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

export default function EventEditor() {
  const { slug } = useParams();
  const [event, setEvent] = useState(null);
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const hasRsvpBlock = (blocksArray) =>
    blocksArray.some((b) => b.type === "rsvp");

  useEffect(() => {
    let cancelled = false;

    async function fetchEvent() {
      try {
        const res = await fetch(`http://localhost:4000/api/events/${slug}`);
        if (!res.ok) {
          throw new Error("Evento non trovato");
        }
        const data = await res.json();

        if (!cancelled) {
          // 🔧 NORMALIZZIAMO I BLOCCHI: assicuriamoci che ogni blocco abbia un id
          // eslint-disable-next-line no-unused-vars
          const normalizedBlocks = (data.blocks || []).map((block, index) => ({
            ...block,
            id: block.id || block._id || crypto.randomUUID(),
          }));

          setEvent(data);
          setBlocks(normalizedBlocks);
        }
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setEvent(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchEvent();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  const addTextBlock = () => {
    setBlocks((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        type: "text",
        order: prev.length,
        props: {
          heading: "",
          body: "",
        },
      },
    ]);
  };

  const addRsvpBlock = () => {
    if (hasRsvpBlock(blocks)) {
      alert("Hai già un blocco RSVP.");
      return;
    }

    setBlocks((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        type: "rsvp",
        order: prev.length,
        props: {},
      },
    ]);
  };

  const removeRsvpBlock = () => {
    setBlocks((prev) => prev.filter((b) => b.type !== "rsvp"));
  };

  const updateBlockProp = (id, field, value) => {
    setBlocks((prev) =>
      prev.map((block) =>
        block.id === id
          ? { ...block, props: { ...block.props, [field]: value } }
          : block
      )
    );
  };

  const deleteBlock = (id) => {
    setBlocks((prev) => prev.filter((block) => block.id !== id));
  };

  const handleSave = async () => {
    if (!event) return;
    setSaving(true);
    try {
      const res = await fetch(`http://localhost:4000/api/events/${slug}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: event.title,
          date: event.date,
          templateId: event.templateId,
          status: event.status,
          blocks,
        }),
      });

      if (!res.ok) {
        throw new Error("Errore salvataggio evento");
      }

      const updated = await res.json();
      setEvent(updated);
      setBlocks(updated.blocks || []);
    } catch (err) {
      console.error(err);
      alert("Errore durante il salvataggio");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p>Caricamento editor...</p>;
  if (!event) return <p>Evento non trovato.</p>;

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>Editor: {event.title}</h1>

      <button
        onClick={addTextBlock}
        style={{ margin: "1rem 0", marginRight: "0.5rem" }}
      >
        + Aggiungi blocco testo
      </button>

      <button
        onClick={addRsvpBlock}
        disabled={hasRsvpBlock(blocks)}
        style={{
          margin: "1rem 0",
          opacity: hasRsvpBlock(blocks) ? 0.5 : 1,
          cursor: hasRsvpBlock(blocks) ? "not-allowed" : "pointer",
        }}
      >
        + Aggiungi blocco RSVP
      </button>

      {blocks.length === 0 && <p>Nessun blocco ancora. Aggiungine uno.</p>}

      {blocks.map((block, index) =>
        block.type === "text" ? (
          <div
            key={block.id || block._id || index}
            style={{
              border: "1px solid #444",
              borderRadius: "8px",
              padding: "1rem",
              marginBottom: "1rem",
            }}
          >
            <button
              onClick={() => deleteBlock(block.id)}
              style={{ marginBottom: "0.5rem" }}
            >
              Elimina blocco
            </button>

            <input
              type="text"
              value={block.props.heading || ""}
              onChange={(e) =>
                updateBlockProp(block.id, "heading", e.target.value)
              }
              placeholder="Titolo del blocco"
              style={{
                width: "100%",
                marginBottom: "0.5rem",
                padding: "0.5rem",
              }}
            />

            <textarea
              value={block.props.body || ""}
              onChange={(e) =>
                updateBlockProp(block.id, "body", e.target.value)
              }
              placeholder="Descrizione / testo del blocco"
              rows={3}
              style={{ width: "100%", padding: "0.5rem" }}
            />
          </div>
        ) : null
      )}

      {hasRsvpBlock(blocks) && (
        <div
          style={{
            border: "1px dashed #666",
            borderRadius: "8px",
            padding: "1rem",
            marginBottom: "1rem",
            background: "#111",
          }}
        >
          <strong>RSVP attivo per questo evento</strong>
          <p style={{ marginTop: "0.5rem" }}>
            La form di conferma presenza sarà visibile nella pagina pubblica.
          </p>
          <button onClick={removeRsvpBlock} style={{ marginTop: "0.5rem" }}>
            Rimuovi blocco RSVP
          </button>
        </div>
      )}

      <button onClick={handleSave} disabled={saving}>
        {saving ? "Salvataggio..." : "Salva evento"}
      </button>
    </div>
  );
}
