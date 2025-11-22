import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

export default function EventRsvps() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [rsvps, setRsvps] = useState([]);
  const [eventTitle, setEventTitle] = useState("");
  const [loading, setLoading] = useState(true);

  const [manualName, setManualName] = useState("");
  const [manualGuests, setManualGuests] = useState(1);
  const [manualStatus, setManualStatus] = useState("yes");
  const [manualSending, setManualSending] = useState(false);
  const [manualError, setManualError] = useState("");

  const [filterStatus, setFilterStatus] = useState("all"); // all | yes | maybe | no

  useEffect(() => {
    async function fetchAll() {
      try {
        // evento per titolo
        const evRes = await fetch(`http://localhost:4000/api/events/${slug}`);
        if (evRes.ok) {
          const evData = await evRes.json();
          setEventTitle(evData.title || slug);
        } else {
          setEventTitle(slug);
        }

        // rsvps
        const rRes = await fetch(
          `http://localhost:4000/api/events/${slug}/rsvps`
        );
        if (rRes.ok) {
          const rData = await rRes.json();
          setRsvps(Array.isArray(rData) ? rData : []);
        } else {
          setRsvps([]);
        }
      } catch (err) {
        console.error(err);
        setRsvps([]);
        setEventTitle(slug);
      } finally {
        setLoading(false);
      }
    }

    fetchAll();
  }, [slug]);

  // conteggi per status (risposte + ospiti)
  const counts = useMemo(() => {
    const base = {
      yesResponses: 0,
      maybeResponses: 0,
      noResponses: 0,
      yesGuests: 0,
      maybeGuests: 0,
      noGuests: 0,
    };

    for (const r of rsvps) {
      const guests = Number(r.guestsCount) || 1;

      if (r.status === "yes") {
        base.yesResponses += 1;
        base.yesGuests += guests;
      } else if (r.status === "maybe") {
        base.maybeResponses += 1;
        base.maybeGuests += guests;
      } else if (r.status === "no") {
        base.noResponses += 1;
        base.noGuests += guests;
      }
    }
    return base;
  }, [rsvps]);

  // filtro lista
  const filteredRsvps = useMemo(() => {
    if (filterStatus === "all") return rsvps;
    return rsvps.filter((r) => r.status === filterStatus);
  }, [rsvps, filterStatus]);

  const handleManualAdd = async (e) => {
    e.preventDefault();
    setManualError("");
    setManualSending(true);

    try {
      const res = await fetch("http://localhost:4000/api/rsvps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventSlug: slug,
          name: manualName,
          guestsCount: Number(manualGuests) || 1,
          status: manualStatus,
        }),
      });

      if (!res.ok) throw new Error("Errore aggiunta manuale");

      const created = await res.json();
      setRsvps((prev) => [created, ...prev]);

      setManualName("");
      setManualGuests(1);
      setManualStatus("yes");
    } catch (err) {
      console.error(err);
      setManualError("Non siamo riusciti ad aggiungere l'ospite. Riprova.");
    } finally {
      setManualSending(false);
    }
  };

  // ✅ ORA il return condizionale è dopo tutti gli hook
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
        onClick={() => navigate("/")}
        style={{ marginBottom: "1rem" }}
      >
        ← Torna alla dashboard
      </button>

      <h1 style={{ marginBottom: "0.5rem" }}>RSVP: {eventTitle}</h1>

      <p style={{ opacity: 0.85, marginBottom: "1rem" }}>
        ✅ Conferme: {counts.yesResponses} — 👥 Ospiti: {counts.yesGuests}
        <br />
        🤔 Forse: {counts.maybeResponses} — 👥 Ospiti: {counts.maybeGuests}
        <br />
        ❌ No: {counts.noResponses} — 👥 Ospiti: {counts.noGuests}
      </p>

      {/* Filtri */}
      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          marginBottom: "1.5rem",
          flexWrap: "wrap",
        }}
      >
        <button
          onClick={() => setFilterStatus("all")}
          style={{
            opacity: filterStatus === "all" ? 1 : 0.6,
            border: filterStatus === "all" ? "1px solid #fff" : "1px solid #333",
          }}
        >
          Tutti
        </button>

        <button
          onClick={() => setFilterStatus("yes")}
          style={{
            opacity: filterStatus === "yes" ? 1 : 0.6,
            border:
              filterStatus === "yes" ? "1px solid #4caf50" : "1px solid #333",
            color: filterStatus === "yes" ? "#4caf50" : undefined,
          }}
        >
          ✅ Partecipa
        </button>

        <button
          onClick={() => setFilterStatus("maybe")}
          style={{
            opacity: filterStatus === "maybe" ? 1 : 0.6,
            border:
              filterStatus === "maybe"
                ? "1px solid #ffb74d"
                : "1px solid #333",
            color: filterStatus === "maybe" ? "#ffb74d" : undefined,
          }}
        >
          🤔 Forse
        </button>

        <button
          onClick={() => setFilterStatus("no")}
          style={{
            opacity: filterStatus === "no" ? 1 : 0.6,
            border:
              filterStatus === "no" ? "1px solid #ff4d4d" : "1px solid #333",
            color: filterStatus === "no" ? "#ff4d4d" : undefined,
          }}
        >
          ❌ No
        </button>
      </div>

      {/* Aggiunta RSVP manuale */}
      <div
        style={{
          border: "1px solid #333",
          borderRadius: "10px",
          padding: "1rem",
          background: "#161616",
          maxWidth: "600px",
          marginBottom: "1.5rem",
        }}
      >
        <h3 style={{ marginTop: 0 }}>➕ Aggiungi ospite manualmente</h3>

        <form
          onSubmit={handleManualAdd}
          style={{ display: "grid", gap: "0.5rem" }}
        >
          <input
            type="text"
            required
            placeholder="Nome ospite"
            value={manualName}
            onChange={(e) => setManualName(e.target.value)}
            style={{ padding: "0.5rem" }}
          />

          <input
            type="number"
            min="1"
            placeholder="Numero ospiti (incluso lui/lei)"
            value={manualGuests}
            onChange={(e) => setManualGuests(e.target.value)}
            style={{ padding: "0.5rem" }}
          />

          <select
            value={manualStatus}
            onChange={(e) => setManualStatus(e.target.value)}
            style={{ padding: "0.5rem" }}
          >
            <option value="yes">✅ Partecipa</option>
            <option value="maybe">🤔 Forse</option>
            <option value="no">❌ Non può</option>
          </select>

          <button type="submit" disabled={manualSending}>
            {manualSending ? "Aggiungo..." : "Aggiungi ospite"}
          </button>

          {manualError && (
            <p style={{ color: "salmon", margin: 0 }}>{manualError}</p>
          )}
        </form>
      </div>

      {/* Lista */}
      {filteredRsvps.length === 0 ? (
        <p>Nessuna RSVP in questa categoria.</p>
      ) : (
        <div style={{ display: "grid", gap: "0.75rem", maxWidth: "600px" }}>
          {filteredRsvps.map((r) => (
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
              <span style={{ opacity: 0.8 }}>({r.guestsCount} ospiti)</span>

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
