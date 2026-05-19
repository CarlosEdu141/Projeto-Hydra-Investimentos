import { useState, useEffect, useRef, useLayoutEffect } from "react";
import "./date-picker.css";

const MESES = [
  "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
  "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro",
];
const SEMANA = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];

function parseDate(val) {
  if (!val) return null;
  const [y, m, d] = val.split("-").map(Number);
  return { y, m: m - 1, d };
}
function toStr(y, m, d) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export default function DatePicker({ value, onChange, accentColor = "#A2FF01", className = "", style = {} }) {
  const sel        = parseDate(value);
  const now        = new Date();
  const [open,     setOpen]     = useState(false);
  const [mesView,  setMesView]  = useState(sel?.m ?? now.getMonth());
  const [anoView,  setAnoView]  = useState(sel?.y ?? now.getFullYear());
  const [panelPos, setPanelPos] = useState({ top: 0, left: 0, width: 260 });
  const triggerRef = useRef(null);
  const panelRef   = useRef(null);

  // Sincroniza mês/ano da view quando o valor externo muda
  useEffect(() => {
    if (sel) { setMesView(sel.m); setAnoView(sel.y); }
  }, [value]);

  // Fecha ao clicar fora
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

  // Posiciona o painel com position: fixed (funciona dentro de modais com overflow)
  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;
    const rect        = triggerRef.current.getBoundingClientRect();
    const panelHeight = 310;
    const spaceAbaixo = window.innerHeight - rect.bottom - 8;
    const top = spaceAbaixo >= panelHeight
      ? rect.bottom + 4
      : Math.max(8, rect.top - panelHeight - 4);
    setPanelPos({ top, left: rect.left, width: Math.max(rect.width, 260) });
  }, [open]);

  const handleOpen = () => {
    if (sel) { setMesView(sel.m); setAnoView(sel.y); }
    else     { setMesView(now.getMonth()); setAnoView(now.getFullYear()); }
    setOpen(o => !o);
  };

  const prevMes = () => {
    if (mesView === 0) { setMesView(11); setAnoView(a => a - 1); }
    else setMesView(m => m - 1);
  };
  const nextMes = () => {
    if (mesView === 11) { setMesView(0); setAnoView(a => a + 1); }
    else setMesView(m => m + 1);
  };

  const diasNoMes  = new Date(anoView, mesView + 1, 0).getDate();
  const offsetDias = new Date(anoView, mesView, 1).getDay();

  const cells = [];
  for (let i = 0; i < offsetDias; i++) cells.push(null);
  for (let d = 1; d <= diasNoMes; d++) cells.push(d);

  const isSelected = (d) => sel && d === sel.d && mesView === sel.m && anoView === sel.y;
  const isHoje     = (d) => d === now.getDate() && mesView === now.getMonth() && anoView === now.getFullYear();

  const handleDia = (d) => {
    onChange(toStr(anoView, mesView, d));
    setOpen(false);
  };
  const handleHoje = () => {
    const t = new Date();
    onChange(toStr(t.getFullYear(), t.getMonth(), t.getDate()));
    setOpen(false);
  };

  const displayValue = sel
    ? `${String(sel.d).padStart(2, "0")}/${String(sel.m + 1).padStart(2, "0")}/${sel.y}`
    : "Selecione a data";

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={`dp-trigger ${className}`}
        style={{ borderColor: `${accentColor}44`, ...style }}
        onClick={handleOpen}
      >
        <span className="dp-trigger__icon">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8"  y1="2" x2="8"  y2="6"/>
            <line x1="3"  y1="10" x2="21" y2="10"/>
          </svg>
        </span>
        <span className={`dp-trigger__val${!sel ? " dp-trigger__val--placeholder" : ""}`}>
          {displayValue}
        </span>
        <span className="dp-trigger__caret">▾</span>
      </button>

      {open && (
        <div
          ref={panelRef}
          className="dp-panel"
          style={{ top: panelPos.top, left: panelPos.left, width: panelPos.width }}
        >
          <div className="dp-nav-row">
            <button type="button" className="dp-nav-btn" onClick={prevMes}>‹</button>
            <span className="dp-mes-ano">{MESES[mesView]} {anoView}</span>
            <button type="button" className="dp-nav-btn" onClick={nextMes}>›</button>
          </div>

          <div className="dp-semana">
            {SEMANA.map(s => <span key={s} className="dp-semana__dia">{s}</span>)}
          </div>

          <div className="dp-grid">
            {cells.map((d, i) => (
              <button
                key={i}
                type="button"
                className={[
                  "dp-cell",
                  !d              ? "dp-cell--vazio"    : "",
                  d && isHoje(d) && !isSelected(d) ? "dp-cell--hoje" : "",
                  d && isSelected(d) ? "dp-cell--selected" : "",
                ].join(" ")}
                disabled={!d}
                style={d && isSelected(d) ? { background: accentColor, color: "#000", borderColor: accentColor } : {}}
                onClick={() => d && handleDia(d)}
              >
                {d || ""}
              </button>
            ))}
          </div>

          <button type="button" className="dp-hoje-btn" style={{ color: accentColor, borderColor: `${accentColor}44` }} onClick={handleHoje}>
            Hoje
          </button>
        </div>
      )}
    </>
  );
}
