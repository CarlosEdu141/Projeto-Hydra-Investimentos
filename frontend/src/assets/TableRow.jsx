import React from "react";

const formatBRL = (value) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(value || 0);

export default function TableRow({ data, onDelete }) {

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        marginBottom: 10
      }}
    >

      <span>{data.descricao}</span>

      <span>{formatBRL(data.valor)}</span>

      <button onClick={onDelete}>
        X
      </button>

    </div>
  );

}