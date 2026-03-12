import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./historico.css";

const API      = "http://localhost:3333";
const getToken = () => sessionStorage.getItem("token");
const authHeaders = () => ({
  "Content-Type": "application/json",
  "Authorization": `Bearer ${getToken()}`,
});

const formatBRL = (v) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

const formatData = (d) =>
  d ? new Date(d).toLocaleDateString("pt-BR") : "—";

const COR_TIPO = {
  ENTRADA:        "#A2FF01",
  SAIDA_FIXA:     "#ff4d4d",
  SAIDA_VARIAVEL: "#ff9900",
};

const LABEL_TIPO = {
  ENTRADA:        "Entrada",
  SAIDA_FIXA:     "Saída Fixa",
  SAIDA_VARIAVEL: "Saída Variável",
};

export default function Historico() {
  const navigate = useNavigate();
  const [lancamentos, setLancamentos] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [filtroTipo,  setFiltroTipo]  = useState("TODOS");
  const [busca,       setBusca]       = useState("");

  useEffect(() => {
    if (!getToken()) { navigate("/", { replace: true }); return; }

    (async () => {
      setLoading(true);
      try {
        const r = await fetch(`${API}/lancamentos`, { headers: authHeaders() });
        if (r.status === 401) { sessionStorage.clear(); navigate("/", { replace: true }); return; }
        const data = await r.json();
        setLancamentos(data);
      } catch {
        // silencioso — sem dados
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtrados = lancamentos.filter((l) => {
    const matchTipo  = filtroTipo === "TODOS" || l.tipo === filtroTipo;
    const matchBusca = busca === "" ||
      (l.categoria_nome || "").toLowerCase().includes(busca.toLowerCase()) ||
      (l.descricao      || "").toLowerCase().includes(busca.toLowerCase());
    return matchTipo && matchBusca;
  });

  return (
    <div className="historico-page">
      <div className="historico-header">
        <div>
          <h1 className="historico-title">Histórico</h1>
          <p className="historico-subtitle">Todos os seus lançamentos</p>
        </div>
        <span className="historico-count">{filtrados.length} registro{filtrados.length !== 1 ? "s" : ""}</span>
      </div>

      {/* ── Filtros ── */}
      <div className="historico-filters">
        <div className="filter-tabs">
          {["TODOS", "ENTRADA", "SAIDA_FIXA", "SAIDA_VARIAVEL"].map((t) => (
            <button
              key={t}
              className={`filter-tab${filtroTipo === t ? " filter-tab--active" : ""}`}
              style={filtroTipo === t && t !== "TODOS" ? { color: COR_TIPO[t], borderColor: COR_TIPO[t], background: `${COR_TIPO[t]}12` } : {}}
              onClick={() => setFiltroTipo(t)}
            >
              {t === "TODOS" ? "Todos" : LABEL_TIPO[t]}
            </button>
          ))}
        </div>
        <input
          className="filter-search"
          placeholder="Buscar por categoria ou descrição..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
      </div>

      {/* ── Tabela ── */}
      <div className="historico-table-wrap">
        {loading ? (
          <div className="historico-loading">Carregando...</div>
        ) : filtrados.length === 0 ? (
          <div className="historico-empty">Nenhum lançamento encontrado</div>
        ) : (
          <table className="historico-table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Tipo</th>
                <th>Categoria</th>
                <th>Descrição</th>
                <th>Status</th>
                <th className="align-right">Valor</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((l) => {
                const cor    = COR_TIPO[l.tipo] || "#888";
                const prefix = l.tipo === "ENTRADA" ? "+" : "-";
                return (
                  <tr key={l.id_lancamento} className="historico-row">
                    <td className="col-data">{formatData(l.data_competencia)}</td>
                    <td>
                      <span className="tipo-badge" style={{ color: cor, background: `${cor}15`, border: `1px solid ${cor}33` }}>
                        {LABEL_TIPO[l.tipo] || l.tipo}
                      </span>
                    </td>
                    <td className="col-cat">{l.categoria_nome || "—"}</td>
                    <td className="col-desc">{l.descricao || "—"}</td>
                    <td>
                      <span className={`status-badge status-badge--${(l.status || "").toLowerCase()}`}>
                        {l.status || "—"}
                      </span>
                    </td>
                    <td className="col-valor align-right" style={{ color: cor }}>
                      {prefix}{formatBRL(l.valor)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}