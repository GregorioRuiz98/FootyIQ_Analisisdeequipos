import {
  ChangeEvent,
  FormEvent,
  MouseEvent,
  useMemo,
  useRef,
  useState,
} from "react";
import { createEvent, deleteEvent, updateEvent } from "../../services/api";
import type { MatchEvent } from "../../types";
import { EVENT_TYPES, useEventingMatch } from "./eventingContext";

type FormState = MatchEvent;

function emptyForm(matchId: string, teamId?: string): FormState {
  return {
    matchId,
    teamId,
    eventType: "PASE",
    minute: 1,
    second: 0,
    x: 50,
    y: 50,
    playerName: "",
  };
}

export function EventingLogPage(): JSX.Element {
  const {
    match,
    events,
    homeTeam,
    awayTeam,
    appendEvent,
    updateEventInState,
    removeEvent,
  } = useEventingMatch();

  const [form, setForm] = useState<FormState>(() =>
    emptyForm(match.id, match.homeTeamId),
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [lastCreatedId, setLastCreatedId] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Filtros
  const [filterType, setFilterType] = useState<string>("");
  const [filterPlayer, setFilterPlayer] = useState<string>("");
  const [filterMinFrom, setFilterMinFrom] = useState<string>("");
  const [filterMinTo, setFilterMinTo] = useState<string>("");

  const allPlayers = useMemo(
    () => [...(homeTeam?.players || []), ...(awayTeam?.players || [])],
    [homeTeam, awayTeam],
  );

  const filtered = useMemo(() => {
    const fromMin = filterMinFrom === "" ? null : Number(filterMinFrom);
    const toMin = filterMinTo === "" ? null : Number(filterMinTo);
    return events.filter((e) => {
      if (filterType && e.eventType !== filterType) return false;
      if (
        filterPlayer &&
        !(e.playerName || "").toLowerCase().includes(filterPlayer.toLowerCase())
      )
        return false;
      if (fromMin !== null && e.minute < fromMin) return false;
      if (toMin !== null && e.minute > toMin) return false;
      return true;
    });
  }, [events, filterType, filterPlayer, filterMinFrom, filterMinTo]);

  const ordered = useMemo(
    () =>
      [...filtered].sort((a, b) => {
        if (a.minute !== b.minute) return b.minute - a.minute;
        return (b.second || 0) - (a.second || 0);
      }),
    [filtered],
  );

  const handlePitchClick = (evt: MouseEvent<HTMLDivElement>): void => {
    const rect = evt.currentTarget.getBoundingClientRect();
    const x = ((evt.clientX - rect.left) / rect.width) * 100;
    const y = ((evt.clientY - rect.top) / rect.height) * 100;
    setForm((prev) => ({
      ...prev,
      x: Number(x.toFixed(1)),
      y: Number(y.toFixed(1)),
    }));
  };

  const startEdit = (ev: MatchEvent): void => {
    setEditingId(ev.id || null);
    setForm({ ...ev, matchId: match.id });
    setError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = (): void => {
    setEditingId(null);
    setForm(emptyForm(match.id, match.homeTeamId));
    setError(null);
  };

  const submit = async (evt: FormEvent): Promise<void> => {
    evt.preventDefault();
    setError(null);
    if (!form.eventType) {
      setError("Selecciona un tipo de evento.");
      return;
    }
    if (!form.playerName.trim()) {
      setError("El nombre del jugador es obligatorio.");
      return;
    }
    if (form.minute < 0 || form.minute > 130) {
      setError("Minuto fuera de rango (0-130).");
      return;
    }
    setSubmitting(true);
    try {
      if (editingId) {
        const saved = await updateEvent(editingId, {
          ...form,
          matchId: match.id,
        });
        updateEventInState(saved);
        cancelEdit();
      } else {
        const created = await createEvent({ ...form, matchId: match.id });
        appendEvent(created);
        if (created.id) setLastCreatedId(created.id);
        setForm((prev) => ({ ...prev, playerName: "", notes: "" }));
      }
    } catch {
      setError(
        editingId
          ? "No se pudo actualizar el evento."
          : "No se pudo guardar el evento.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (eventId: string | undefined): Promise<void> => {
    if (!eventId) return;
    if (!window.confirm("Eliminar este evento?")) return;
    setDeletingId(eventId);
    try {
      await deleteEvent(eventId);
      removeEvent(eventId);
      if (editingId === eventId) cancelEdit();
      if (lastCreatedId === eventId) setLastCreatedId(null);
    } catch {
      setError("No se pudo eliminar el evento.");
    } finally {
      setDeletingId(null);
    }
  };

  const undoLast = async (): Promise<void> => {
    if (!lastCreatedId) return;
    setDeletingId(lastCreatedId);
    try {
      await deleteEvent(lastCreatedId);
      removeEvent(lastCreatedId);
      setLastCreatedId(null);
    } catch {
      setError("No se pudo deshacer.");
    } finally {
      setDeletingId(null);
    }
  };

  const exportJson = (): void => {
    const payload = JSON.stringify(events, null, 2);
    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `eventing-${match.id}-events.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const importJson = async (
    evt: ChangeEvent<HTMLInputElement>,
  ): Promise<void> => {
    const file = evt.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportStatus(null);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (!Array.isArray(parsed)) throw new Error("json no es array");
      let ok = 0;
      let fail = 0;
      for (const raw of parsed) {
        try {
          const { id: _id, ...rest } = raw || {};
          const payload: MatchEvent = {
            ...(rest as MatchEvent),
            matchId: match.id,
          };
          if (!payload.eventType || !payload.playerName) {
            fail += 1;
            continue;
          }
          const created = await createEvent(payload);
          appendEvent(created);
          ok += 1;
        } catch {
          fail += 1;
        }
      }
      setImportStatus(`Importados ${ok}, fallidos ${fail}.`);
    } catch {
      setImportStatus("Archivo JSON invalido.");
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <section className="glass-panel panel">
      <div className="panel-head">
        <h3>{editingId ? "Editar evento" : "Registrar evento"}</h3>
        <span className="subtle">
          {editingId
            ? "Modificando registro existente"
            : "Pulsa el campo para fijar la posicion del evento"}
        </span>
      </div>

      <div
        className="pitch"
        onClick={handlePitchClick}
        role="button"
        tabIndex={0}
      >
        <div className="middle-line" />
        <div className="center-circle" />
        <div
          className="pitch-marker"
          style={{ left: `${form.x}%`, top: `${form.y}%` }}
        />
      </div>

      <form onSubmit={submit} className="event-form">
        <div className="two-inputs">
          <label className="field">
            Tipo
            <select
              value={form.eventType}
              onChange={(e) =>
                setForm((p) => ({ ...p, eventType: e.target.value }))
              }
            >
              {EVENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            Equipo
            <select
              value={form.teamId || ""}
              onChange={(e) =>
                setForm((p) => ({ ...p, teamId: e.target.value || undefined }))
              }
            >
              <option value="">Sin equipo</option>
              {match.homeTeamId ? (
                <option value={match.homeTeamId}>
                  Local - {match.homeTeamName}
                </option>
              ) : null}
              {match.awayTeamId ? (
                <option value={match.awayTeamId}>
                  Visitante - {match.awayTeamName}
                </option>
              ) : null}
            </select>
          </label>
        </div>

        <label className="field">
          Jugador
          <input
            list="eventing-player-suggestions"
            value={form.playerName}
            onChange={(e) =>
              setForm((p) => ({ ...p, playerName: e.target.value }))
            }
            required
          />
        </label>
        <datalist id="eventing-player-suggestions">
          {allPlayers.map((p) => (
            <option key={p.id} value={p.name} />
          ))}
        </datalist>

        <div className="two-inputs">
          <label className="field">
            Min
            <input
              type="number"
              min={0}
              max={130}
              value={form.minute}
              onChange={(e) =>
                setForm((p) => ({ ...p, minute: Number(e.target.value) }))
              }
            />
          </label>
          <label className="field">
            Seg
            <input
              type="number"
              min={0}
              max={59}
              value={form.second}
              onChange={(e) =>
                setForm((p) => ({ ...p, second: Number(e.target.value) }))
              }
            />
          </label>
        </div>

        <label className="field">
          Notas
          <textarea
            value={form.notes || ""}
            onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
          />
        </label>

        {error ? <p className="subtle error">{error}</p> : null}

        <div className="two-inputs">
          <button className="cta" type="submit" disabled={submitting}>
            {submitting
              ? "Guardando..."
              : editingId
                ? "Actualizar evento"
                : "Guardar evento"}
          </button>
          {editingId ? (
            <button type="button" className="icon-btn big" onClick={cancelEdit}>
              Cancelar edicion
            </button>
          ) : null}
        </div>
      </form>

      <div className="panel-head" style={{ marginTop: "1rem" }}>
        <h3>Eventos</h3>
        <span className="subtle">
          {ordered.length} de {events.length} mostrados
        </span>
      </div>

      <div className="filters-row">
        <button
          type="button"
          className="icon-btn"
          disabled={!lastCreatedId || deletingId === lastCreatedId}
          onClick={undoLast}
          title="Deshacer ultimo evento creado"
        >
          {deletingId === lastCreatedId ? "..." : "Deshacer ultimo"}
        </button>
        <button
          type="button"
          className="icon-btn"
          disabled={events.length === 0}
          onClick={exportJson}
        >
          Exportar JSON
        </button>
        <label className="icon-btn" style={{ cursor: "pointer" }}>
          {importing ? "Importando..." : "Importar JSON"}
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            style={{ display: "none" }}
            onChange={importJson}
            disabled={importing}
          />
        </label>
        {importStatus ? <span className="subtle">{importStatus}</span> : null}
      </div>

      <div className="filters-row">
        <label className="field inline">
          Tipo
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="">Todos</option>
            {EVENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <label className="field inline">
          Jugador
          <input
            value={filterPlayer}
            onChange={(e) => setFilterPlayer(e.target.value)}
            placeholder="contiene..."
          />
        </label>
        <label className="field inline">
          Min desde
          <input
            type="number"
            value={filterMinFrom}
            onChange={(e) => setFilterMinFrom(e.target.value)}
            min={0}
            max={130}
            style={{ width: "5rem" }}
          />
        </label>
        <label className="field inline">
          Min hasta
          <input
            type="number"
            value={filterMinTo}
            onChange={(e) => setFilterMinTo(e.target.value)}
            min={0}
            max={130}
            style={{ width: "5rem" }}
          />
        </label>
      </div>

      <div className="event-list">
        {ordered.length === 0 ? (
          <p className="subtle">Sin eventos que coincidan con los filtros.</p>
        ) : (
          ordered.map((e, idx) => (
            <div
              key={e.id || `${e.minute}-${e.second}-${idx}`}
              className={`event-item glass-soft event-item-row ${editingId === e.id ? "editing" : ""}`}
            >
              <div style={{ flex: 1 }}>
                <strong>
                  {e.minute}:{String(e.second).padStart(2, "0")} - {e.eventType}
                </strong>
                <p>{e.playerName}</p>
                <small>
                  x:{e.x} y:{e.y}
                </small>
              </div>
              <button
                type="button"
                className="icon-btn"
                title="Editar"
                disabled={!e.id}
                onClick={() => startEdit(e)}
              >
                Edit
              </button>
              <button
                type="button"
                className="icon-btn danger"
                title="Eliminar"
                disabled={!e.id || deletingId === e.id}
                onClick={() => handleDelete(e.id)}
              >
                {deletingId === e.id ? "..." : "X"}
              </button>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
