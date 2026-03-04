import React, { useEffect, useState } from "react";

export default function CategoriasIndex() {

  const [dados, setDados] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:3333/categorias")
      .then(res => res.json())
      .then(data => {
        setDados(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Erro ao buscar categorias:", err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="container mt-5">
      <div className="card shadow">
        <div className="card-header bg-primary text-white">
          <h4 className="mb-0">Categorias</h4>
        </div>

        <div className="card-body">

          {loading && <p>Carregando...</p>}

          {!loading && (
            <table className="table table-striped table-hover align-middle">
              <thead className="table-dark">
                <tr>
                  <th>ID</th>
                  <th>Nome</th>
                  <th>Tipo</th>
                  <th>ações</th>
                </tr>
              </thead>

              <tbody>
                {dados.map((item) => (
                  <tr key={item.id_categoria}>
                    <td>{item.id_categoria}</td>
                    <td>{item.nome}</td>
                    <td>
                      <span className={`badge ${
                        item.tipo === "receita"
                          ? "bg-success"
                          : "bg-danger"
                      }`}>
                        {item.tipo}
                      </span>
                    </td>
<td className="text-center">
  <button className="btn btn-sm btn-light border me-2">
    <i className="bi bi-pencil-fill text-primary"></i>
  </button>

  <button className="btn btn-sm btn-light border">
    <i className="bi bi-trash-fill text-danger"></i>
  </button>
</td>                  </tr>
                ))}
              </tbody>
            </table>
          )}

        </div>
      </div>
    </div>
  );
}