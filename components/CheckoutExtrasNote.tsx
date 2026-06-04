"use client";

import { useState } from "react";

type ExtraService = {
  Code?: string;
  Name?: string;
  Price?: number | string;
  Amount?: number | string;
};

interface Props {
  extraServices: ExtraService[];
}

const EXTRA_NOTE_HEADER = "Izbrane dodatne storitve:";

function formatCurrency(value: unknown) {
  const parsed = typeof value === "number" ? value : Number(value);
  const safeValue = Number.isFinite(parsed) ? parsed : 0;

  return safeValue.toLocaleString("sl-SI", { style: "currency", currency: "EUR" });
}

function composeNote(baseNote: string, selectedLabels: string[]) {
  const note = baseNote.trimEnd();
  const extraBlock = selectedLabels.length
    ? [EXTRA_NOTE_HEADER, ...selectedLabels.map(label => `- ${label}`)].join("\n")
    : "";

  if (!note) return extraBlock;
  if (!extraBlock) return note;
  return `${note}\n\n${extraBlock}`;
}

function stripExtraBlock(text: string) {
  const marker = `\n\n${EXTRA_NOTE_HEADER}\n`;
  const altMarker = `${EXTRA_NOTE_HEADER}\n`;
  const markerIndex = text.lastIndexOf(marker);

  if (markerIndex >= 0) {
    return text.slice(0, markerIndex).trimEnd();
  }

  const altMarkerIndex = text.lastIndexOf(altMarker);
  if (altMarkerIndex >= 0) {
    return text.slice(0, altMarkerIndex).trimEnd();
  }

  return text;
}

export default function CheckoutExtrasNote({ extraServices }: Props) {
  const services = extraServices.map((extra, index) => {
    const id = extra.Code ? String(extra.Code) : `${extra.Name || "extra"}-${index}`;

    return {
      id,
      label: extra.Name || "Dodatna storitev",
      price: extra.Price ?? extra.Amount ?? 0,
    };
  });

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [noteText, setNoteText] = useState("");

  function handleToggle(serviceId: string) {
    const nextSelectedIds = selectedIds.includes(serviceId)
      ? selectedIds.filter(id => id !== serviceId)
      : [...selectedIds, serviceId];

    const baseNote = stripExtraBlock(noteText);
    const selectedLabels = services
      .filter(service => nextSelectedIds.includes(service.id))
      .map(service => service.label);

    setSelectedIds(nextSelectedIds);
    setNoteText(composeNote(baseNote, selectedLabels));
  }

  function handleNoteChange(value: string) {
    setNoteText(value);
  }

  return (
    <>
      {services.length > 0 && (
        <div className="choice-stack" style={{ marginBottom: 16 }}>
          {services.map(service => (
            <label className="check-terms choice-card" key={service.id}>
              <input
                type="checkbox"
                checked={selectedIds.includes(service.id)}
                onChange={() => handleToggle(service.id)}
              />
              <span>
                <strong>{service.label}</strong>
                <br />
                <span style={{ color: "var(--muted)" }}>
                  {formatCurrency(service.price)}
                </span>
              </span>
            </label>
          ))}
        </div>
      )}

      <div className="form-field">
        <label>Sporočilo organizatorju</label>
        <textarea
          name="note"
          rows={5}
          value={noteText}
          onChange={e => handleNoteChange(e.target.value)}
          placeholder="Npr. želena ura leta, sedenje skupaj, posebne opombe ..."
        />
      </div>
    </>
  );
}
