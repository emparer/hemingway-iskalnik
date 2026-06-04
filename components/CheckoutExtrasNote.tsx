"use client";

import { useEffect, useState } from "react";

type ExtraService = {
  Code?: string;
  Name?: string;
  Price?: number | string;
  Amount?: number | string;
};

interface Props {
  extraServices: ExtraService[];
  initialSelectedValues?: string[];
  showCheckboxes?: boolean;
  showTextarea?: boolean;
  onSelectionChange?: (selectedValues: string[], selectedLabels: string[]) => void;
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

export default function CheckoutExtrasNote({
  extraServices,
  initialSelectedValues = [],
  showCheckboxes = true,
  showTextarea = true,
  onSelectionChange,
}: Props) {
  const services = extraServices.map((extra, index) => {
    return {
      label: extra.Name || "Dodatna storitev",
      price: extra.Price ?? extra.Amount ?? 0,
    };
  });

  const [selectedLabels, setSelectedLabels] = useState<string[]>(initialSelectedValues);
  const [noteText, setNoteText] = useState(() => {
    const initialLabels = services
      .filter(service => initialSelectedValues.includes(service.label))
      .map(service => service.label);

    return composeNote("", initialLabels);
  });

  useEffect(() => {
    if (!onSelectionChange) return;

    onSelectionChange(selectedLabels, selectedLabels);
  }, [onSelectionChange, selectedLabels, services]);

  function handleToggle(serviceLabel: string) {
    const nextSelectedLabels = selectedLabels.includes(serviceLabel)
      ? selectedLabels.filter(label => label !== serviceLabel)
      : [...selectedLabels, serviceLabel];

    const baseNote = stripExtraBlock(noteText);
    const nextLabels = services
      .filter(service => nextSelectedLabels.includes(service.label))
      .map(service => service.label);

    setSelectedLabels(nextSelectedLabels);
    setNoteText(composeNote(baseNote, nextLabels));
  }

  function handleNoteChange(value: string) {
    setNoteText(value);
  }

  return (
    <>
      {showCheckboxes && services.length > 0 && (
        <div className="choice-stack" style={{ marginBottom: 16 }}>
          {services.map(service => (
            <label className="check-terms choice-card" key={service.label}>
              <input
                name="extraServices"
                type="checkbox"
                value={service.label}
                checked={selectedLabels.includes(service.label)}
                onChange={() => handleToggle(service.label)}
              />
              <span className="extra-service-line">
                <strong>{service.label}</strong>
                <span>{formatCurrency(service.price)}</span>
              </span>
            </label>
          ))}
        </div>
      )}

      {showTextarea && (
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
      )}
    </>
  );
}
