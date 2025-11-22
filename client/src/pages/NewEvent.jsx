import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [dateTBD, setDateTBD] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:4000/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          date: dateTBD ? null : new Date(date).toISOString(),
          dateTBD,
          templateId: "basic-free",
          blocks: [],
        }),
      });

      if (!res.ok) {
        throw new Error("Errore creazione evento");
      }

      const event = await res.json();
      // usiamo lo slug generato dal backend
      navigate(`/edit/${event.slug}`);
    } catch (err) {
      console.error(err);
      setError("Non siamo riusciti a creare l'evento. Riprova.");
    } finally {
      setLoading(false);
    }
  };

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
      <h1 style={{ marginBottom: "1rem" }}>Crea un nuovo evento YNVIO</h1>
      <p style={{ marginBottom: "2rem" }}>
        Inserisci titolo e data, ti portiamo subito all&apos;editor della pagina
        invito.
      </p>

      <form
        onSubmit={handleSubmit}
        style={{
          maxWidth: "480px",
          display: "flex",
          flexDirection: "column",
          gap: "0.75rem",
        }}
      >
        <label>
          Titolo evento
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Es. Matrimonio Marco & Sara"
            style={{ width: "100%", padding: "0.5rem", marginTop: "0.25rem" }}
          />
        </label>

        <label>
          Data evento
          <div
            style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}
          >
            <input
              type="date"
              disabled={dateTBD}
              required={!dateTBD}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={{ flex: 1, padding: "0.5rem", marginTop: "0.25rem" }}
            />

            <label
              style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}
            >
              <input
                type="checkbox"
                checked={dateTBD}
                onChange={(e) => {
                  setDateTBD(e.target.checked);
                  if (e.target.checked) setDate(""); // reset data reale
                }}
              />
              Data da definire
            </label>
          </div>
        </label>

        {error && (
          <p style={{ color: "salmon", marginTop: "0.5rem" }}>{error}</p>
        )}

        <button
          type="submit"
          disabled={loading || !title}
          style={{
            marginTop: "1rem",
            padding: "0.75rem",
            background: "#000",
            color: "#fff",
            border: "none",
            cursor: loading ? "wait" : "pointer",
          }}
        >
          {loading ? "Creazione in corso..." : "Crea evento e vai all'editor"}
        </button>
      </form>
    </div>
  );
}
