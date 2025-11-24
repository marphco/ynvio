import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { API_BASE, resolveImageUrl } from "../config/api";

export default function EventEditor() {
  const { slug } = useParams();
  const [event, setEvent] = useState(null);
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [draggingId, setDraggingId] = useState(null);
  const [uploadError, setUploadError] = useState("");
  const [isDirty, setIsDirty] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [saveError, setSaveError] = useState("");

  const DRAFT_KEY = `ynvio:draft:${slug}`;

  const [draftRestored, setDraftRestored] = useState(false);

  const normalizeBlocks = (arr = []) => {
    return arr
      .map((block, index) => ({
        ...block,
        id: block.id || block._id || crypto.randomUUID(),
        order: block.order ?? index,
      }))
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .map((b, i) => ({ ...b, order: i }));
  };

  const hasRsvpBlock = (blocksArray) =>
    blocksArray.some((b) => b.type === "rsvp");

  const loadDraft = () => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || !Array.isArray(parsed.blocks)) return null;
      return parsed;
    } catch {
      return null;
    }
  };

  const saveDraft = (blocksToSave) => {
    try {
      localStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({
          blocks: blocksToSave,
          savedAt: Date.now(),
        })
      );
    } catch {
      // se LS è pieno o errore, ignoriamo per MVP
    }
  };

  const clearDraft = () => {
    try {
      localStorage.removeItem(DRAFT_KEY);
      // eslint-disable-next-line no-empty
    } catch {}
  };

  useEffect(() => {
    let cancelled = false;

    async function fetchEvent() {
      try {
        const res = await fetch(`${API_BASE}/api/events/${slug}`);
        if (!res.ok) {
          throw new Error("Evento non trovato");
        }
        const data = await res.json();

        if (!cancelled) {
          const cleanOrderedBlocks = normalizeBlocks(data.blocks || []);

          setEvent(data);

          const draft = loadDraft();
          const hasDraft = draft && draft.blocks.length > 0;

          if (hasDraft) {
            const restored = normalizeBlocks(draft.blocks);
            setBlocks(restored);
          } else {
            setBlocks(cleanOrderedBlocks);
          }

          setDraftRestored(true);
          setIsDirty(hasDraft);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  useEffect(() => {
    if (!draftRestored) return; // non salvare prima del restore iniziale
    if (!isDirty) return; // ✅ salva draft solo se ci sono modifiche non salvate
    saveDraft(blocks);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blocks, draftRestored, isDirty]);

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
    setIsDirty(true);
  };

  useEffect(() => {
    if (!draftRestored) return;
    if (!isDirty) return; // se non c’è nulla da salvare
    if (autoSaving) return; // evita loop mentre salva

    const t = setTimeout(() => {
      saveToServer(blocks);
    }, 1200); // 1.2s di “pausa”

    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blocks, isDirty, autoSaving, draftRestored]);

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
    setIsDirty(true);
  };

  const removeRsvpBlock = () => {
    setBlocks((prev) => prev.filter((b) => b.type !== "rsvp"));
  };

  const addGalleryBlock = () => {
    // doppia sicurezza: anche se il button è disabled
    if (!canUsePremium) {
      alert("La Gallery è disponibile solo per Premium.");
      return;
    }

    setBlocks((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        type: "gallery",
        order: prev.length,
        props: {
          images: [],
        },
      },
    ]);
    setIsDirty(true);
  };

  const removeGalleryImage = (blockId, indexToRemove) => {
    setBlocks((prev) =>
      prev.map((b) =>
        b.id === blockId
          ? {
              ...b,
              props: {
                ...b.props,
                images: (b.props.images || []).filter(
                  (_, i) => i !== indexToRemove
                ),
              },
            }
          : b
      )
    );
  };

  const addMapBlock = () => {
    setBlocks((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        type: "map",
        order: prev.length,
        props: {
          title: "",
          address: "",
          mapUrl: "", // link google maps opzionale
        },
      },
    ]);
    setIsDirty(true);
  };

  const updateBlockProp = (id, field, value) => {
    setBlocks((prev) =>
      prev.map((block) =>
        block.id === id
          ? { ...block, props: { ...block.props, [field]: value } }
          : block
      )
    );
    setIsDirty(true);
  };

  // sposta un blocco su/giù mantenendo coerenza
  const moveBlock = (id, direction) => {
    setBlocks((prev) => {
      const ordered = [...prev].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      const index = ordered.findIndex((b) => b.id === id);
      if (index === -1) return prev;

      const newIndex = direction === "up" ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= ordered.length) return prev;

      const next = [...ordered];
      const [removed] = next.splice(index, 1);
      next.splice(newIndex, 0, removed);

      return next.map((b, i) => ({ ...b, order: i }));
    });
    setIsDirty(true);
  };

  const onDragStart = (e, id) => {
    setDraggingId(id);
  };

  const onDragOver = (e, overId) => {
    e.preventDefault();
    if (!draggingId || draggingId === overId) return;

    setBlocks((prev) => {
      const ordered = [...prev].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      const from = ordered.findIndex((b) => b.id === draggingId);
      const to = ordered.findIndex((b) => b.id === overId);
      if (from === -1 || to === -1) return prev;
      if (from === to) return prev;

      const next = [...ordered];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);

      // 👇 qui il reorder è reale → dirty true
      setIsDirty(true);

      return next.map((b, i) => ({ ...b, order: i }));
    });
  };

  const onDragEnd = () => setDraggingId(null);

  // quando elimini, reimposta order
  const deleteBlock = (id) => {
    setBlocks((prev) =>
      prev.filter((b) => b.id !== id).map((b, i) => ({ ...b, order: i }))
    );
    setIsDirty(true);
  };

  const handleSave = async () => {
    await saveToServer(blocks);
  };

  const saveToServer = async (blocksToSave) => {
    if (!event) return;

    setAutoSaving(true);
    setSaveError("");

    const cleanBlocks = [...blocksToSave]
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .map((b, i) => ({ ...b, order: i }));

    try {
      const res = await fetch(`${API_BASE}/api/events/${slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: event.title,
          date: event.date,
          dateTBD: event.dateTBD,
          templateId: event.templateId,
          status: event.status,
          blocks: cleanBlocks,
        }),
      });

      if (!res.ok) throw new Error("Errore salvataggio evento");

      const updated = await res.json();

      setEvent(updated);
      setBlocks(normalizeBlocks(updated.blocks || []));
      setIsDirty(false);
      setLastSavedAt(Date.now());
      clearDraft(); // baby step 1
    } catch (err) {
      console.error(err);
      setSaveError("Impossibile salvare ora. Riprova tra poco.");
    } finally {
      setAutoSaving(false);
    }
  };

  if (loading) return <p>Caricamento editor...</p>;
  if (!event) return <p>Evento non trovato.</p>;

  const plan = (event?.plan || "").toLowerCase();
  const isPremium = plan === "premium";

  const canUsePremium = isPremium;

  const blockLabel = (type) => {
    if (type === "text") return "Blocco testo";
    if (type === "map") return "Mappa";
    if (type === "gallery") return "Gallery";
    if (type === "rsvp") return "RSVP";
    return "Blocco";
  };

  const BlockHeader = ({
    type,
    onDelete,
    onUp,
    onDown,
    disableUp,
    disableDown,
  }) => (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: "0.75rem",
      }}
    >
      <span style={{ fontSize: "0.8rem", opacity: 0.7 }}>
        {blockLabel(type)}
      </span>

      <div style={{ display: "flex", gap: "0.4rem" }}>
        <button
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onUp();
          }}
          onDragStart={(e) => e.preventDefault()}
          disabled={disableUp}
          style={{ fontSize: "0.8rem", opacity: disableUp ? 0.3 : 0.8 }}
          title="Sposta su"
        >
          ↑
        </button>
        <button
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onDown();
          }}
          onDragStart={(e) => e.preventDefault()}
          disabled={disableDown}
          style={{ fontSize: "0.8rem", opacity: disableDown ? 0.3 : 0.8 }}
          title="Sposta giù"
        >
          ↓
        </button>

        <button
          onClick={onDelete}
          style={{
            fontSize: "0.8rem",
            opacity: 0.8,
            background: "transparent",
            border: "1px solid #333",
            padding: "0.25rem 0.5rem",
            cursor: "pointer",
          }}
          title="Elimina blocco"
        >
          ✕ Elimina
        </button>
      </div>
    </div>
  );

  const orderedBlocks = [...blocks].sort(
    (a, b) => (a.order ?? 0) - (b.order ?? 0)
  );

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>Editor: {event.title}</h1>

      <div
        style={{
          marginTop: "0.75rem",
          marginBottom: "1rem",
          padding: "0.6rem 0.8rem",
          borderRadius: "8px",
          background: "#0d0d0d",
          border: "1px solid #222",
          display: "flex",
          alignItems: "center",
          gap: "0.6rem",
          fontSize: "0.9rem",
        }}
      >
        {autoSaving ? (
          <span style={{ color: "#ffb74d" }}>Salvataggio…</span>
        ) : isDirty ? (
          <span style={{ color: "salmon" }}>Non salvato</span>
        ) : (
          <span style={{ color: "lightgreen" }}>Salvato ✅</span>
        )}

        {lastSavedAt && !isDirty && !autoSaving && (
          <span style={{ opacity: 0.6 }}>
            ({new Date(lastSavedAt).toLocaleTimeString("it-IT")})
          </span>
        )}

        {saveError && (
          <span style={{ color: "salmon", marginLeft: "auto" }}>
            {saveError}
          </span>
        )}
      </div>

      <label style={{ display: "block", margin: "1rem 0" }}>
        Data evento
        <input
          type="date"
          disabled={event.dateTBD}
          value={event.date ? event.date.slice(0, 10) : ""}
          onChange={(e) =>
            setEvent((prev) => ({
              ...prev,
              date: e.target.value
                ? new Date(e.target.value).toISOString()
                : null,
              dateTBD: false,
            }))
          }
          style={{ width: "100%", padding: "0.5rem", marginTop: "0.25rem" }}
        />
      </label>

      <label style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
        <input
          type="checkbox"
          checked={event.dateTBD}
          onChange={(e) =>
            setEvent((prev) => ({
              ...prev,
              dateTBD: e.target.checked,
              date: e.target.checked ? null : prev.date,
            }))
          }
        />
        Data da definire
      </label>

      {/* ===== ADD-ON FREE ===== */}
      <div style={{ marginTop: "1.25rem", marginBottom: "0.75rem" }}>
        <p
          style={{ fontSize: "0.85rem", opacity: 0.7, marginBottom: "0.5rem" }}
        >
          Add-on gratuiti
        </p>

        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <button onClick={addTextBlock}>+ Blocco testo</button>

          <button
            onClick={addRsvpBlock}
            disabled={hasRsvpBlock(blocks)}
            style={{
              opacity: hasRsvpBlock(blocks) ? 0.5 : 1,
              cursor: hasRsvpBlock(blocks) ? "not-allowed" : "pointer",
            }}
          >
            + RSVP
          </button>

          <button onClick={addMapBlock}>+ Mappa</button>
        </div>
      </div>

      {/* ===== ADD-ON PREMIUM ===== */}
      <div style={{ marginTop: "0.75rem", marginBottom: "1rem" }}>
        <p
          style={{ fontSize: "0.85rem", opacity: 0.7, marginBottom: "0.5rem" }}
        >
          Add-on Premium
        </p>

        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <button
            disabled={!canUsePremium}
            onClick={addGalleryBlock}
            style={{
              opacity: canUsePremium ? 1 : 0.5,
              cursor: canUsePremium ? "pointer" : "not-allowed",
            }}
            title={!canUsePremium ? "Disponibile solo con Premium" : ""}
          >
            + Gallery {canUsePremium ? "" : "🔒 Premium (7€)"}
          </button>

          {/* qui in futuro aggiungi altri premium:
        <button disabled={!isPremium} onClick={addTableauBlock}>
          + Tableau 🔒 Premium (12€)
        </button>
    */}
        </div>
      </div>

      {blocks.length === 0 && <p>Nessun blocco ancora. Aggiungine uno.</p>}

      {orderedBlocks.map((block, index) => {
        const lastIndex = orderedBlocks.length - 1;

        if (block.type === "text") {
          return (
            <div
              key={block.id}
              draggable
              onDragStartCapture={(e) => {
                if (e.target.closest("input, textarea, select, button, a")) {
                  e.preventDefault();
                  e.stopPropagation();
                }
              }}
              onDragStart={(e) => onDragStart(e, block.id)}
              onDragOver={(e) => onDragOver(e, block.id)}
              onDragEnd={onDragEnd}
              style={{
                border: "1px solid #444",
                borderRadius: "8px",
                padding: "1rem",
                marginBottom: "1rem",
                cursor: draggingId === block.id ? "grabbing" : "grab",
                userSelect: "none",
              }}
            >
              <BlockHeader
                type="text"
                onDelete={() => deleteBlock(block.id)}
                onUp={() => moveBlock(block.id, "up")}
                onDown={() => moveBlock(block.id, "down")}
                disableUp={index === 0}
                disableDown={index === lastIndex}
              />

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
          );
        }

        if (block.type === "map") {
          return (
            <div
              key={block.id}
              draggable
              onDragStartCapture={(e) => {
                if (e.target.closest("input, textarea, select, button, a")) {
                  e.preventDefault();
                  e.stopPropagation();
                }
              }}
              onDragStart={(e) => onDragStart(e, block.id)}
              onDragOver={(e) => onDragOver(e, block.id)}
              onDragEnd={onDragEnd}
              style={{
                border: "1px solid #444",
                borderRadius: "8px",
                padding: "1rem",
                marginBottom: "1rem",
                cursor: draggingId === block.id ? "grabbing" : "grab",
                userSelect: "none",
              }}
            >
              <BlockHeader
                type="map"
                onDelete={() => deleteBlock(block.id)}
                onUp={() => moveBlock(block.id, "up")}
                onDown={() => moveBlock(block.id, "down")}
                disableUp={index === 0}
                disableDown={index === lastIndex}
              />

              <input
                type="text"
                value={block.props.title || ""}
                onChange={(e) =>
                  updateBlockProp(block.id, "title", e.target.value)
                }
                placeholder="Titolo sezione (es. Come arrivare)"
                style={{
                  width: "100%",
                  marginBottom: "0.5rem",
                  padding: "0.5rem",
                }}
              />

              <input
                type="text"
                value={block.props.address || ""}
                onChange={(e) =>
                  updateBlockProp(block.id, "address", e.target.value)
                }
                placeholder="Indirizzo (es. Via Roma 10, Napoli)"
                style={{
                  width: "100%",
                  marginBottom: "0.5rem",
                  padding: "0.5rem",
                }}
              />

              <input
                type="text"
                value={block.props.mapUrl || ""}
                onChange={(e) =>
                  updateBlockProp(block.id, "mapUrl", e.target.value)
                }
                placeholder="Link Google Maps (opzionale)"
                style={{
                  width: "100%",
                  padding: "0.5rem",
                }}
              />

              <small
                style={{
                  opacity: 0.6,
                  display: "block",
                  marginTop: "0.5rem",
                }}
              >
                Se non metti il link, useremo la ricerca dell’indirizzo.
              </small>
            </div>
          );
        }

        if (block.type === "rsvp") {
          return (
            <div
              key={block.id}
              draggable
              onDragStartCapture={(e) => {
                if (e.target.closest("input, textarea, select, button, a")) {
                  e.preventDefault();
                  e.stopPropagation();
                }
              }}
              onDragStart={(e) => onDragStart(e, block.id)}
              onDragOver={(e) => onDragOver(e, block.id)}
              onDragEnd={onDragEnd}
              style={{
                border: "1px dashed #666",
                borderRadius: "8px",
                padding: "1rem",
                marginBottom: "1rem",
                background: "#111",
                cursor: draggingId === block.id ? "grabbing" : "grab",
                userSelect: "none",
              }}
            >
              <BlockHeader
                type="rsvp"
                onDelete={() => deleteBlock(block.id)}
                onUp={() => moveBlock(block.id, "up")}
                onDown={() => moveBlock(block.id, "down")}
                disableUp={index === 0}
                disableDown={index === lastIndex}
              />

              <strong>RSVP attivo per questo evento</strong>
              <p style={{ marginTop: "0.5rem" }}>
                Il modulo di conferma presenza sarà visibile nella pagina
                pubblica.
              </p>

              <button onClick={removeRsvpBlock} style={{ marginTop: "0.5rem" }}>
                Rimuovi blocco RSVP
              </button>
            </div>
          );
        }

        if (block.type === "gallery") {
          const images = block.props?.images || [];

          return (
            <div
              key={block.id}
              draggable
              onDragStartCapture={(e) => {
                if (
                  e.target.closest("input, textarea, select, button, a, label")
                ) {
                  e.preventDefault();
                  e.stopPropagation();
                }
              }}
              onDragStart={(e) => onDragStart(e, block.id)}
              onDragOver={(e) => onDragOver(e, block.id)}
              onDragEnd={onDragEnd}
              style={{
                border: "1px solid #444",
                borderRadius: "8px",
                padding: "1rem",
                marginBottom: "1rem",
                background: "#141414",
                cursor: draggingId === block.id ? "grabbing" : "grab",
                userSelect: "none",
              }}
            >
              <BlockHeader
                type="gallery"
                onDelete={() => deleteBlock(block.id)}
                onUp={() => moveBlock(block.id, "up")}
                onDown={() => moveBlock(block.id, "down")}
                disableUp={index === 0}
                disableDown={index === lastIndex}
              />

              {/* Upload immagini (custom) */}
              <div style={{ marginBottom: "0.75rem" }}>
                <label
                  style={{
                    display: "inline-block",
                    padding: "0.5rem 0.8rem",
                    background: "#000",
                    color: "#fff",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "0.9rem",
                  }}
                >
                  Carica foto
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    style={{ display: "none" }}
                    onChange={async (e) => {
                      const files = Array.from(e.target.files || []);
                      if (!files.length) return;

                      setUploadError(""); // reset prima di ogni upload

                      try {
                        const formData = new FormData();
                        files.forEach((file) =>
                          formData.append("images", file)
                        );

                        const res = await fetch(`${API_BASE}/api/uploads?slug=${slug}`, {
                          method: "POST",
                          body: formData,
                        });

                        if (!res.ok) {
                          const errData = await res.json().catch(() => ({}));

                          // 👇 messaggi MVP
                          if (errData.code === "LIMIT_FILE_SIZE") {
                            throw new Error(
                              "Ogni immagine deve pesare massimo 15MB."
                            );
                          }
                          if (errData.code === "LIMIT_FILE_COUNT") {
                            throw new Error(
                              "Puoi caricare massimo 20 immagini alla volta."
                            );
                          }

                          throw new Error(errData.error || "Upload fallito.");
                        }

                        const data = await res.json();
                        const urls = data.urls || [];

                        setBlocks((prev) =>
                          prev.map((b) =>
                            b.id === block.id
                              ? {
                                  ...b,
                                  props: {
                                    ...b.props,
                                    images: [
                                      ...(b.props.images || []),
                                      ...urls,
                                    ],
                                  },
                                }
                              : b
                          )
                        );
                      } catch (err) {
                        console.error(err);
                        setUploadError(
                          err.message || "Errore upload immagini."
                        );
                      } finally {
                        e.target.value = "";
                      }
                    }}
                  />
                </label>

                <small
                  style={{
                    opacity: 0.6,
                    display: "block",
                    marginTop: "0.35rem",
                  }}
                >
                  Puoi selezionare più foto insieme.
                </small>
                {uploadError && (
                  <p
                    style={{
                      color: "salmon",
                      marginTop: "0.5rem",
                      fontSize: "0.9rem",
                    }}
                  >
                    {uploadError}
                  </p>
                )}
              </div>

              {/* Preview thumbnails */}
              {images.length === 0 ? (
                <p style={{ opacity: 0.7 }}>Nessuna immagine ancora.</p>
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
                      key={`${block.id}-img-${i}`}
                      style={{
                        position: "relative",
                        minWidth: "140px",
                        height: "110px",
                        borderRadius: "8px",
                        overflow: "hidden",
                        border: "1px solid #2a2a2a",
                        background: "#0f0f0f",
                        scrollSnapAlign: "start",
                        flexShrink: 0,
                      }}
                    >
                      <img
                        src={resolveImageUrl(url)}
                        alt={`gallery-${i}`}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                        loading="lazy"
                      />
                      <button
                        onClick={() => removeGalleryImage(block.id, i)}
                        style={{
                          position: "absolute",
                          top: 6,
                          right: 6,
                          background: "rgba(0,0,0,0.7)",
                          color: "#fff",
                          border: "none",
                          borderRadius: "4px",
                          padding: "2px 6px",
                          cursor: "pointer",
                          fontSize: "0.8rem",
                        }}
                        title="Rimuovi immagine"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        }

        return null;
      })}

      <button onClick={handleSave} disabled={autoSaving}>
        {autoSaving ? "Salvataggio..." : "Salva ora"}
      </button>
    </div>
  );
}
