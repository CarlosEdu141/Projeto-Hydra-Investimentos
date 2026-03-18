import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from "recharts";
import "./historico.css";

const API      = "http://localhost:3333";
const getToken = () => sessionStorage.getItem("token");
const authHeaders = () => ({
  "Content-Type": "application/json",
  "Authorization": `Bearer ${getToken()}`,
});

const formatBRL = (v) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

const formatBRLShort = (v) => {
  if (v >= 1000) return `R$${(v / 1000).toFixed(1)}k`;
  return `R$${v}`;
};

const formatData = (d) =>
  d ? new Date(d).toLocaleDateString("pt-BR") : "—";

const NOMES_MES = ["Jan","Fev","Mar","Abr","Mai","Jun",
                   "Jul","Ago","Set","Out","Nov","Dez"];

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

const CAT_PADRAO = {
  ENTRADA:        ["Salário","Freelance","Dividendos","Aluguel recebido","Rendimento","Outros (entrada)"],
  SAIDA_FIXA:     ["Luz","Água","Internet","Aluguel","Supermercado","Matrícula","Plano de saúde","Combustível","Outros (fixo)"],
  SAIDA_VARIAVEL: ["Lazer","Restaurante","Roupas","Viagem","Farmácia","Beleza","Delivery","Assinatura","Presente","Outros (variável)"],
};

const EMPTY_MODAL = () => ({
  tipo:            "ENTRADA",
  id_categoria:    "",
  descricao:       "",
  valor:           "",
  data_lancamento: new Date().toISOString().split("T")[0],
});

// ── Tooltip customizado do gráfico ────────────────────────────────────────────
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const saldo = (payload.find(p => p.dataKey === "entradas")?.value || 0)
              - (payload.find(p => p.dataKey === "fixas")?.value || 0)
              - (payload.find(p => p.dataKey === "variaveis")?.value || 0);
  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip__mes">{label}</p>
      {payload.map((p) => (
        <div key={p.dataKey} className="chart-tooltip__row">
          <span className="chart-tooltip__dot" style={{ background: p.fill }} />
          <span className="chart-tooltip__label">{p.name}</span>
          <span className="chart-tooltip__val" style={{ color: p.fill }}>{formatBRL(p.value)}</span>
        </div>
      ))}
      <div className="chart-tooltip__divider" />
      <div className="chart-tooltip__row">
        <span className="chart-tooltip__label">Saldo</span>
        <span className="chart-tooltip__val" style={{ color: saldo >= 0 ? "#A2FF01" : "#ff4d4d" }}>
          {formatBRL(saldo)}
        </span>
      </div>
    </div>
  );
}

// ── Gráfico comparativo ───────────────────────────────────────────────────────
function GraficoComparativo({ lancamentos }) {
  const [periodo, setPeriodo] = useState(6);

  const dados = useMemo(() => {
    const hoje = new Date();
    const meses = [];

    for (let i = periodo - 1; i >= 0; i--) {
      const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
      const mes = d.getMonth();
      const ano = d.getFullYear();

      const doMes = lancamentos.filter((l) => {
        const ld = new Date(l.data_competencia || l.dt_criacao);
        return ld.getMonth() === mes && ld.getFullYear() === ano;
      });

      const entradas  = doMes.filter(l => l.tipo === "ENTRADA")       .reduce((s, l) => s + Number(l.valor), 0);
      const fixas     = doMes.filter(l => l.tipo === "SAIDA_FIXA")    .reduce((s, l) => s + Number(l.valor), 0);
      const variaveis = doMes.filter(l => l.tipo === "SAIDA_VARIAVEL").reduce((s, l) => s + Number(l.valor), 0);

      meses.push({
        mes:       `${NOMES_MES[mes]}/${String(ano).slice(2)}`,
        entradas,
        fixas,
        variaveis,
        saldo: entradas - fixas - variaveis,
      });
    }
    return meses;
  }, [lancamentos, periodo]);

  const temDados = dados.some(d => d.entradas > 0 || d.fixas > 0 || d.variaveis > 0);

  return (
    <div className="grafico-card">
      <div className="grafico-card__header">
        <div>
          <span className="grafico-card__title">Comparativo Mensal</span>
          <span className="grafico-card__subtitle">Entradas, saídas e saldo por mês</span>
        </div>
        <div className="periodo-tabs">
          {[3, 6, 12].map((p) => (
            <button
              key={p}
              className={`periodo-tab${periodo === p ? " periodo-tab--active" : ""}`}
              onClick={() => setPeriodo(p)}
            >
              {p}M
            </button>
          ))}
        </div>
      </div>

      {!temDados ? (
        <div className="grafico-empty">Sem dados suficientes para o período</div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={dados} margin={{ top: 8, right: 16, left: 0, bottom: 0 }} barCategoryGap="28%">
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" vertical={false} />
            <XAxis
              dataKey="mes"
              tick={{ fill: "#555", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={formatBRLShort}
              tick={{ fill: "#555", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              width={56}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "#ffffff08" }} />
            <Legend
              wrapperStyle={{ fontSize: 11, color: "#666", paddingTop: 12 }}
              formatter={(val) => val === "entradas" ? "Entradas" : val === "fixas" ? "Saídas Fixas" : "Saídas Variáveis"}
            />
            <Bar dataKey="entradas"  name="entradas"  fill="#A2FF01" radius={[4,4,0,0]} maxBarSize={32} />
            <Bar dataKey="fixas"     name="fixas"     fill="#ff4d4d" radius={[4,4,0,0]} maxBarSize={32} />
            <Bar dataKey="variaveis" name="variaveis" fill="#ff9900" radius={[4,4,0,0]} maxBarSize={32} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

// ── Modal de Lançamento Retroativo ────────────────────────────────────────────
function ModalLancamento({ onClose, onSaved, categorias }) {
  const [form,   setForm]   = useState(EMPTY_MODAL());
  const [saving, setSaving] = useState(false);
  const [erro,   setErro]   = useState(null);

  const cor = COR_TIPO[form.tipo];

  const catOptions = useMemo(() => {
    const fromApi = categorias.filter((c) => c.tipo === form.tipo);
    return fromApi.length > 0
      ? fromApi.map((c) => ({ label: c.nome, value: c.id_categoria }))
      : CAT_PADRAO[form.tipo].map((n) => ({ label: n, value: n }));
  }, [categorias, form.tipo]);

  const handle    = (field, val) => setForm((f) => ({ ...f, [field]: val }));
  const handleTipo = (tipo) => setForm((f) => ({ ...f, tipo, id_categoria: "" }));

  const handleSubmit = async () => {
    if (!form.valor || isNaN(parseFloat(form.valor))) { setErro("Informe um valor válido."); return; }
    if (!form.data_lancamento)                         { setErro("Informe a data."); return; }
    setSaving(true); setErro(null);
    try {
      const r = await fetch(`${API}/lancamentos`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          tipo:            form.tipo,
          id_categoria:    form.id_categoria || catOptions[0]?.value || null,
          descricao:       form.descricao,
          valor:           parseFloat(form.valor),
          data_lancamento: form.data_lancamento,
          status:          "PENDENTE",
        }),
      });
      if (!r.ok) throw new Error("erro");
      await onSaved();
      onClose();
    } catch { setErro("Erro ao salvar. Tente novamente."); }
    finally  { setSaving(false); }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-header">
          <div>
            <h2 className="modal-title">Novo Lançamento</h2>
            <p className="modal-subtitle">Retroativo ou atual</p>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-tipo-tabs">
          {["ENTRADA","SAIDA_FIXA","SAIDA_VARIAVEL"].map((t) => (
            <button
              key={t}
              className={`modal-tipo-tab${form.tipo === t ? " modal-tipo-tab--active" : ""}`}
              style={form.tipo === t ? { color: COR_TIPO[t], borderColor: COR_TIPO[t], background: `${COR_TIPO[t]}12` } : {}}
              onClick={() => handleTipo(t)}
            >
              {LABEL_TIPO[t]}
            </button>
          ))}
        </div>

        <div className="modal-fields">
          <div className="modal-field">
            <label className="modal-label">Data</label>
            <input className="modal-input" type="date" value={form.data_lancamento}
              onChange={(e) => handle("data_lancamento", e.target.value)}
              style={{ borderColor: `${cor}44` }} />
          </div>
          <div className="modal-field-group modal-field-group--2">
            <div className="modal-field">
              <label className="modal-label">Categoria</label>
              <select className="modal-input" value={form.id_categoria}
                onChange={(e) => handle("id_categoria", e.target.value)}
                style={{ borderColor: `${cor}44` }}>
                {catOptions.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div className="modal-field">
              <label className="modal-label">Valor (R$)</label>
              <input className="modal-input modal-input--valor" type="number" placeholder="0,00"
                value={form.valor} onChange={(e) => handle("valor", e.target.value)}
                style={{ borderColor: `${cor}44`, color: cor }} />
            </div>
          </div>
          <div className="modal-field">
            <label className="modal-label">Descrição (opcional)</label>
            <input className="modal-input" type="text" placeholder="Ex: Conta de luz de janeiro..."
              value={form.descricao} onChange={(e) => handle("descricao", e.target.value)}
              style={{ borderColor: `${cor}44` }} />
          </div>
        </div>

        {erro && <div className="modal-erro">{erro}</div>}

        <div className="modal-actions">
          <button className="modal-btn-cancel" onClick={onClose}>Cancelar</button>
          <button className="modal-btn-save"
            style={{ background: `${cor}22`, border: `1px solid ${cor}88`, color: cor }}
            onClick={handleSubmit} disabled={saving}>
            {saving ? "Salvando..." : "Salvar Lançamento"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Historico ─────────────────────────────────────────────────────────────────
export default function Historico() {
  const navigate = useNavigate();
  const [lancamentos, setLancamentos] = useState([]);
  const [categorias,  setCategorias]  = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [filtroTipo,  setFiltroTipo]  = useState("TODOS");
  const [busca,       setBusca]       = useState("");
  const [modalAberto, setModalAberto] = useState(false);
  const [ordemData,   setOrdemData]   = useState("desc"); // "asc" | "desc"

  // Filtro de período
  const hoje = new Date();
  const [mesFiltro, setMesFiltro] = useState("TODOS");
  const [anoFiltro, setAnoFiltro] = useState(String(hoje.getFullYear()));

  const NOMES_MES_FILTRO = [
    { value: "TODOS", label: "Todos os meses" },
    { value: "0",  label: "Janeiro"   }, { value: "1",  label: "Fevereiro"  },
    { value: "2",  label: "Março"     }, { value: "3",  label: "Abril"      },
    { value: "4",  label: "Maio"      }, { value: "5",  label: "Junho"      },
    { value: "6",  label: "Julho"     }, { value: "7",  label: "Agosto"     },
    { value: "8",  label: "Setembro"  }, { value: "9",  label: "Outubro"    },
    { value: "10", label: "Novembro"  }, { value: "11", label: "Dezembro"   },
  ];

  const anosDisponiveis = useMemo(() => {
    const anos = new Set(lancamentos.map(l => {
      const d = new Date(l.data_competencia || l.dt_criacao);
      return String(d.getFullYear());
    }));
    return ["TODOS", ...Array.from(anos).sort((a, b) => b - a)];
  }, [lancamentos]);

  // Escuta o FAB da navbar para abrir o modal
  useEffect(() => {
    const handler = () => setModalAberto(true);
    window.addEventListener("openLancamentoModal", handler);
    return () => window.removeEventListener("openLancamentoModal", handler);
  }, []);

  const carregar = async () => {
    setLoading(true);
    try {
      const [rL, rC] = await Promise.all([
        fetch(`${API}/lancamentos`, { headers: authHeaders() }),
        fetch(`${API}/categorias`,  { headers: authHeaders() }),
      ]);
      if (rL.status === 401) { sessionStorage.clear(); navigate("/", { replace: true }); return; }
      setLancamentos(await rL.json());
      setCategorias(await rC.json());
    } catch { }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (!getToken()) { navigate("/", { replace: true }); return; }
    carregar();
  }, []);

  const filtrados = useMemo(() => {
    return lancamentos
      .filter((l) => {
        const matchTipo  = filtroTipo === "TODOS" || l.tipo === filtroTipo;
        const matchBusca = busca === "" ||
          (l.categoria_nome || "").toLowerCase().includes(busca.toLowerCase()) ||
          (l.descricao      || "").toLowerCase().includes(busca.toLowerCase());
        const d = new Date(l.data_competencia || l.dt_criacao);
        const matchMes = mesFiltro === "TODOS" || d.getMonth() === Number(mesFiltro);
        const matchAno = anoFiltro === "TODOS" || d.getFullYear() === Number(anoFiltro);
        return matchTipo && matchBusca && matchMes && matchAno;
      })
      .sort((a, b) => {
        const dA = new Date(a.data_competencia || a.dt_criacao);
        const dB = new Date(b.data_competencia || b.dt_criacao);
        return ordemData === "desc" ? dB - dA : dA - dB;
      });
  }, [lancamentos, filtroTipo, busca, mesFiltro, anoFiltro, ordemData]);

  return (
    <div className="historico-page">

      {modalAberto && (
        <ModalLancamento categorias={categorias}
          onClose={() => setModalAberto(false)} onSaved={carregar} />
      )}

      <div className="historico-header">
        <div>
          <h1 className="historico-title">Histórico</h1>
          <p className="historico-subtitle">Todos os seus lançamentos</p>
        </div>
        <div className="historico-header-right">
          <span className="historico-count">{filtrados.length} registro{filtrados.length !== 1 ? "s" : ""}</span>
          <button className="btn-novo-lancamento d-none d-md-block" onClick={() => setModalAberto(true)}>
            + Novo Lançamento
          </button>
        </div>
      </div>

      {/* ── Gráfico Comparativo — só desktop ── */}
      <div className="d-none d-md-block">
        <GraficoComparativo lancamentos={lancamentos} />
      </div>

      {/* ── Filtros ── */}
      <div className="historico-filters">
        <div className="filter-tabs">
          {["TODOS", "ENTRADA", "SAIDA_FIXA", "SAIDA_VARIAVEL"].map((t) => (
            <button key={t}
              className={`filter-tab${filtroTipo === t ? " filter-tab--active" : ""}`}
              style={filtroTipo === t && t !== "TODOS" ? { color: COR_TIPO[t], borderColor: COR_TIPO[t], background: `${COR_TIPO[t]}12` } : {}}
              onClick={() => setFiltroTipo(t)}>
              {t === "TODOS" ? "Todos" : LABEL_TIPO[t]}
            </button>
          ))}
        </div>
        <div className="filter-right">
          <select className="filter-select" value={mesFiltro} onChange={(e) => setMesFiltro(e.target.value)}>
            {NOMES_MES_FILTRO.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
          <select className="filter-select" value={anoFiltro} onChange={(e) => setAnoFiltro(e.target.value)}>
            {anosDisponiveis.map(a => <option key={a} value={a}>{a === "TODOS" ? "Todos os anos" : a}</option>)}
          </select>
          <input className="filter-search" placeholder="Buscar por categoria..."
            value={busca} onChange={(e) => setBusca(e.target.value)} />
        </div>
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
                <th className="th-sortable" onClick={() => setOrdemData(o => o === "desc" ? "asc" : "desc")}>
                  Data <span className="sort-icon">{ordemData === "desc" ? "↓" : "↑"}</span>
                </th>
                {/* Desktop: colunas separadas */}
                <th className="d-none d-md-table-cell">Tipo</th>
                <th className="d-none d-md-table-cell">Categoria</th>
                <th className="d-none d-md-table-cell">Status</th>
                {/* Mobile: coluna combinada */}
                <th className="d-table-cell d-md-none">Tipo / Cat.</th>
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
                    {/* Desktop */}
                    <td className="d-none d-md-table-cell">
                      <span className="tipo-badge" style={{ color: cor, background: `${cor}15`, border: `1px solid ${cor}33` }}>
                        {LABEL_TIPO[l.tipo] || l.tipo}
                      </span>
                    </td>
                    <td className="col-cat d-none d-md-table-cell">{l.categoria_nome || "—"}</td>
                    <td className="d-none d-md-table-cell">
                      <span className={`status-badge status-badge--${(l.status || "").toLowerCase()}`}>
                        {l.status || "—"}
                      </span>
                    </td>
                    {/* Mobile: tipo + categoria empilhados */}
                    <td className="d-table-cell d-md-none">
                      <span className="tipo-badge" style={{ color: cor, background: `${cor}15`, border: `1px solid ${cor}33`, display: "block", marginBottom: "3px" }}>
                        {LABEL_TIPO[l.tipo] || l.tipo}
                      </span>
                      <span style={{ fontSize: "10px", color: "#777" }}>{l.categoria_nome || "—"}</span>
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