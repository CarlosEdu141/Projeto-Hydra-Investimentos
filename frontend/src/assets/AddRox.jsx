import React, { useState } from "react";

export default function AddRow({ categorias, onAdd, empty }) {

  const [form, setForm] = useState(empty);

  const handleChange = (e) => {

    const { name, value } = e.target;

    setForm({
      ...form,
      [name]: value
    });

  };

  const handleAdd = () => {

    if (!form.descricao || !form.valor) return;

    onAdd({
      ...form,
      valor: Number(form.valor)
    });

    setForm(empty);

  };

  return (

    <div
      style={{
        display: "flex",
        gap: 5,
        marginTop: 10
      }}
    >

      <input
        name="descricao"
        placeholder="Descrição"
        value={form.descricao}
        onChange={handleChange}
      />

      <select
        name="categoria"
        value={form.categoria}
        onChange={handleChange}
      >
        {categorias.map((c) => (
          <option key={c}>{c}</option>
        ))}
      </select>

      <input
        name="valor"
        type="number"
        placeholder="Valor"
        value={form.valor}
        onChange={handleChange}
      />

      <button onClick={handleAdd}>
        +
      </button>

    </div>

  );

}