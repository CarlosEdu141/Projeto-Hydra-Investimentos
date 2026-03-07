import React from "react";

export default function TableCard({ title, children }) {

  return (
    <div
      style={{
        background: "#1e293b",
        padding: 20,
        borderRadius: 8
      }}
    >
      <h3 style={{ marginBottom: 20 }}>{title}</h3>

      {children}

    </div>
  );

}