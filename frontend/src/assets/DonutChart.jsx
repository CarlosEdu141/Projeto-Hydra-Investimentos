import React from "react";

export default function DonutChart({ entradas, saidasFixas, saidasVariaveis }) {

  const total = entradas + saidasFixas + saidasVariaveis;

  if (total === 0) {
    return <div>Nenhum dado ainda</div>;
  }

  const entradasPct = (entradas / total) * 100;
  const fixasPct = (saidasFixas / total) * 100;
  const variaveisPct = (saidasVariaveis / total) * 100;

  return (
    <div
      style={{
        width: 220,
        height: 220,
        borderRadius: "50%",
        background: `conic-gradient(
          #22c55e 0% ${entradasPct}%,
          #ef4444 ${entradasPct}% ${entradasPct + fixasPct}%,
          #f97316 ${entradasPct + fixasPct}% 100%
        )`
      }}
    />
  );
}