import React, { useEffect, useState } from "react";

export default function UsuariosIndex() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    fetch("http://localhost:3333/usuarios")
      .then((res) => res.json())
      .then((data) => {
        setUsuarios(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Erro ao buscar usuários:", err);
        setErro("Erro ao carregar usuários");
        setLoading(false);
      });
  }, []);

  return (
    <div className="container mt-5">
      <div className="card shadow">
        <div className="card-header bg-dark text-white d-flex justify-content-between align-items-center">
          <h4 className="mb-0">Usuários</h4>
          <button className="btn btn-success btn-sm">
            <i className="bi bi-plus-lg me-1"></i>
            Novo Usuário
          </button>
        </div>

        <div className="card-body">
          {loading && <p>Carregando...</p>}

          {erro && <div className="alert alert-danger">{erro}</div>}

          {!loading && !erro && (
            <table className="table table-striped table-hover align-middle">
              <thead className="table-dark">
                <tr>
                  <th>ID</th>
                  <th>Nome</th>
                  <th>CPF</th>
                  <th>Email</th>
                  <th>Data Nasc.</th>
                  <th>Criação</th>
                  <th className="text-center">Ações</th>
                </tr>
              </thead>

              <tbody>
                {usuarios.length === 0 && (
                  <tr>
                    <td colSpan="7" className="text-center">
                      Nenhum usuário encontrado
                    </td>
                  </tr>
                )}

                {usuarios.map((usuario) => (
                  <tr key={usuario.id_user}>
                    <td>{usuario.id_user}</td>
                    <td>{usuario.nome}</td>
                    <td>{usuario.cpf}</td>
                    <td>{usuario.email}</td>
                    <td>
                      {usuario.data_nascimento
                        ? new Date(usuario.data_nascimento).toLocaleDateString("pt-BR")
                        : "-"}
                    </td>
                    <td>
                      {usuario.dt_criacao
                        ? new Date(usuario.dt_criacao).toLocaleDateString("pt-BR")
                        : "-"}
                    </td>

                    <td className="text-center">
                      <button className="btn btn-sm btn-light border me-2">
                        <i className="bi bi-pencil-fill text-primary"></i>
                      </button>

                      <button className="btn btn-sm btn-light border">
                        <i className="bi bi-trash-fill text-danger"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}