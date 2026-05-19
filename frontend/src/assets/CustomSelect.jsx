import { useState, useRef, useLayoutEffect, useEffect } from "react";
import { createPortal } from "react-dom";
import "./custom-select.css";

export default function CustomSelect({
  value,
  onChange,
  options = [],
  placeholder = "Selecionar...",
  accentColor = "#A2FF01",
  className = "",
  style = {},
}) {
  const [open, setOpen] = useState(false);
  const [panelPos, setPanelPos] = useState({ top: 0, left: 0, width: 0 });
  const triggerRef = useRef(null);
  const panelRef   = useRef(null);

  const selected = options.find(o => String(o.value) === String(value));

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (
        triggerRef.current && !triggerRef.current.contains(e.target) &&
        panelRef.current   && !panelRef.current.contains(e.target)
      ) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const panelMaxHeight = Math.min(options.length * 38 + 8, 240);
    const spaceBelow = window.innerHeight - rect.bottom - 8;
    const top = spaceBelow >= panelMaxHeight
      ? rect.bottom + 4
      : Math.max(8, rect.top - panelMaxHeight - 4);
    setPanelPos({ top, left: rect.left, width: Math.max(rect.width, 160) });
  }, [open, options.length]);

  const handleSelect = (optValue) => {
    onChange(optValue);
    setOpen(false);
  };

  const openStyle = open
    ? { borderColor: `${accentColor}88`, boxShadow: `0 0 0 2px ${accentColor}22`, outline: "none" }
    : {};

  const panel = open && (
    <div
      ref={panelRef}
      className="cs-panel"
      style={{ top: panelPos.top, left: panelPos.left, width: panelPos.width }}
    >
      {options.map(opt => (
        <button
          key={opt.value}
          type="button"
          className={`cs-option${String(opt.value) === String(value) ? " cs-option--selected" : ""}`}
          style={String(opt.value) === String(value) ? { color: accentColor, background: `${accentColor}12` } : {}}
          onClick={() => handleSelect(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={`cs-trigger${className ? ` ${className}` : ""}`}
        style={{ ...style, ...openStyle }}
        onClick={() => setOpen(o => !o)}
      >
        <span className={`cs-trigger__val${!selected ? " cs-trigger__val--placeholder" : ""}`}>
          {selected ? selected.label : placeholder}
        </span>
        <span className={`cs-trigger__caret${open ? " cs-trigger__caret--open" : ""}`}>▾</span>
      </button>

      {createPortal(panel, document.body)}
    </>
  );
}
