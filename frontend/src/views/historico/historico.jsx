import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import DatePicker from "../../assets/DatePicker";
import CustomSelect from "../../assets/CustomSelect";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import ModalLancamento from "../../assets/ModalLancamento";
import "./historico.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:3333";
const getToken    = () => sessionStorage.getItem("token");
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

const LABEL_PAGAMENTO = {
  DINHEIRO: "Dinheiro",
  PIX:      "PIX",
  DEBITO:   "Débito",
  CREDITO:  "Crédito",
};

const PIE_COLORS = [
  "#A2FF01", "#00d4ff", "#b44dff", "#ff6b9d",
  "#ffd700", "#4dffb4", "#ff6b35", "#00b4d8", "#ff4dff", "#7ec8e3",
];

const CAT_PADRAO = {
  ENTRADA:        ["Salário","Freelance","Dividendos","Aluguel recebido","Rendimento","Outros (entrada)"],
  SAIDA_FIXA:     ["Luz","Água","Internet","Aluguel","Supermercado","Matrícula","Plano de saúde","Combustível","Outros (fixo)"],
  SAIDA_VARIAVEL: ["Lazer","Restaurante","Roupas","Viagem","Farmácia","Beleza","Delivery","Assinatura","Presente","Outros (variável)"],
};

// ── Tooltip pizza ────────────────────────────────────────────────────────────
function CustomTooltipPizza({ active, payload, total }) {
  if (!active || !payload?.length) return null;
  const { name, value, payload: { fill } } = payload[0];
  const pct = total > 0 ? ((value / total) * 100).toFixed(1) : "0";
  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip__mes">{name}</p>
      <div className="chart-tooltip__row">
        <span className="chart-tooltip__dot" style={{ background: fill }} />
        <span className="chart-tooltip__val" style={{ color: fill }}>{formatBRL(value)}</span>
        <span className="chart-tooltip__label" style={{ marginLeft: 6 }}>{pct}%</span>
      </div>
    </div>
  );
}

// ── Gráfico Pizza / Rosca ─────────────────────────────────────────────────────
function GraficoPizza({ lancamentos, tipo, mesFiltro, anoFiltro, onTipoChange, onVoltar }) {
  const cor    = tipo === "SAIDA_FIXA" ? "#ff4d4d" : "#ff9900";
  const titulo = tipo === "SAIDA_FIXA" ? "Top Gastos Fixos" : "Top Gastos Variáveis";
  const hoje   = new Date();

  const dados = useMemo(() => {
    const mes = mesFiltro === "TODOS" ? hoje.getMonth()    : Number(mesFiltro);
    const ano = anoFiltro === "TODOS" ? hoje.getFullYear() : Number(anoFiltro);

    const grouped = {};
    lancamentos
      .filter(l => {
        if (l.tipo !== tipo) return false;
        const d = new Date(l.data_competencia || l.dt_criacao);
        return d.getMonth() === mes && d.getFullYear() === ano;
      })
      .forEach(l => {
        const cat = l.categoria_nome || "Outros";
        grouped[cat] = (grouped[cat] || 0) + Number(l.valor);
      });

    return Object.entries(grouped)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [lancamentos, tipo, mesFiltro, anoFiltro]);

  const total = dados.reduce((s, d) => s + d.value, 0);

  const mesLabel = mesFiltro === "TODOS"
    ? `${NOMES_MES[hoje.getMonth()]}/${hoje.getFullYear()}`
    : `${NOMES_MES[Number(mesFiltro)]}${anoFiltro !== "TODOS" ? `/${anoFiltro}` : ""}`;

  return (
    <div className="grafico-card">
      <div className="grafico-card__header">
        <div>
          <span className="grafico-card__title" style={{ color: cor }}>{titulo}</span>
          <span className="grafico-card__subtitle">
            {dados.length} categoria{dados.length !== 1 ? "s" : ""} · {mesLabel}
          </span>
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <button
            className={`periodo-tab${tipo === "SAIDA_VARIAVEL" ? " periodo-tab--active" : ""}`}
            style={tipo === "SAIDA_VARIAVEL" ? { borderColor: "#ff990066", color: "#ff9900", background: "#ff990012" } : {}}
            onClick={() => onTipoChange("SAIDA_VARIAVEL")}
          >Variáveis</button>
          <button
            className={`periodo-tab${tipo === "SAIDA_FIXA" ? " periodo-tab--active" : ""}`}
            style={tipo === "SAIDA_FIXA" ? { borderColor: "#ff4d4d66", color: "#ff4d4d", background: "#ff4d4d12" } : {}}
            onClick={() => onTipoChange("SAIDA_FIXA")}
          >Fixos</button>
          <button className="periodo-tab" onClick={onVoltar}>← Comparativo</button>
        </div>
      </div>

      {dados.length === 0 ? (
        <div className="grafico-empty">Sem gastos registrados para o período selecionado</div>
      ) : (
        <div className="pizza-layout">
          <ResponsiveContainer width={280} height={260}>
            <PieChart>
              <Pie data={dados} cx="50%" cy="50%"
                innerRadius={72} outerRadius={112} paddingAngle={2} dataKey="value"
                stroke="none"
                activeShape={(_props) => <g />}>
                {dados.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltipPizza total={total} />} />
            </PieChart>
          </ResponsiveContainer>

          <div className="pizza-legend">
            {dados.map((item, i) => {
              const color = PIE_COLORS[i % PIE_COLORS.length];
              const pct   = total > 0 ? ((item.value / total) * 100).toFixed(1) : "0";
              return (
                <div key={item.name} className="pizza-legend__row">
                  <span className="pizza-legend__dot" style={{ background: color }} />
                  <span className="pizza-legend__name">{item.name}</span>
                  <span className="pizza-legend__val" style={{ color }}>{formatBRL(item.value)}</span>
                  <span className="pizza-legend__pct">{pct}%</span>
                </div>
              );
            })}
            <div className="pizza-legend__total">
              <span>Total</span>
              <span style={{ color: cor }}>{formatBRL(total)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

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
function GraficoComparativo({ lancamentos, onOutrosGraficos }) {
  const [periodo,   setPeriodo]  = useState(6);
  const [popupOpen, setPopupOpen] = useState(false);
  const btnRef   = useRef(null);
  const panelRef = useRef(null);

  useEffect(() => {
    if (!popupOpen) return;
    const handler = e => {
      if (!btnRef.current?.contains(e.target) && !panelRef.current?.contains(e.target))
        setPopupOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [popupOpen]);

  const selectGrafico = (tipo) => { setPopupOpen(false); onOutrosGraficos(tipo); };

  const dados = useMemo(() => {
    const hoje = new Date();
    const meses = [];

    for (let i = periodo - 1; i >= 0; i--) {
      const d   = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
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
        mes: `${NOMES_MES[mes]}/${String(ano).slice(2)}`,
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
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
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
          <div style={{ position: "relative" }}>
            <button
              ref={btnRef}
              className={`periodo-tab${popupOpen ? " periodo-tab--active" : ""}`}
              onClick={() => setPopupOpen(o => !o)}
            >Outros ▾</button>
            {popupOpen && (
              <div ref={panelRef} className="popup-graficos">
                <p className="popup-graficos__title">Trocar gráfico</p>
                <button className="popup-graficos__item" onClick={() => selectGrafico("SAIDA_VARIAVEL")}>
                  <span style={{ color: "#ff9900", fontSize: 20, lineHeight: 1 }}>◔</span>
                  <div>
                    <strong>Top Gastos Variáveis</strong>
                    <span>Distribuição por categoria</span>
                  </div>
                </button>
                <button className="popup-graficos__item" onClick={() => selectGrafico("SAIDA_FIXA")}>
                  <span style={{ color: "#ff4d4d", fontSize: 20, lineHeight: 1 }}>◔</span>
                  <div>
                    <strong>Top Gastos Fixos</strong>
                    <span>Distribuição por categoria</span>
                  </div>
                </button>
              </div>
            )}
          </div>
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

// ── Modal de Edição ───────────────────────────────────────────────────────────
function ModalEditar({ lancamento, categorias, onClose, onSaved }) {
  const cor         = COR_TIPO[lancamento.tipo] || "#888";
  const ehParcelado = lancamento.total_parcelas > 1 && lancamento.grupo_parcelas;

  const catOptions = useMemo(() => {
    const fromApi = categorias.filter(c => c.tipo === lancamento.tipo);
    return fromApi.length > 0
      ? fromApi.map(c => ({ label: c.nome, value: c.id_categoria }))
      : CAT_PADRAO[lancamento.tipo]?.map(n => ({ label: n, value: n })) || [];
  }, [categorias, lancamento.tipo]);

  const [form,          setForm]          = useState({
    descricao:       lancamento.descricao       || "",
    valor:           lancamento.valor           || "",
    id_categoria:    lancamento.id_categoria    || "",
    data_lancamento: (lancamento.data_competencia || "").split("T")[0],
    status:          lancamento.status          || "PENDENTE",
  });
  const [saving,        setSaving]        = useState(false);
  const [erro,          setErro]          = useState(null);
  const [mostraConfirm, setMostraConfirm] = useState(false);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const handle = (field, val) => setForm(f => ({ ...f, [field]: val }));

  const iniciarSalvar = () => {
    if (!form.valor || isNaN(parseFloat(form.valor))) { setErro("Informe um valor válido."); return; }
    if (ehParcelado) { setMostraConfirm(true); return; }
    salvar(false);
  };

  const salvar = async (grupo) => {
    setSaving(true); setErro(null); setMostraConfirm(false);
    const url = grupo
      ? `${API}/lancamentos/${lancamento.id_lancamento}?grupo=true`
      : `${API}/lancamentos/${lancamento.id_lancamento}`;
    try {
      const r = await fetch(url, {
        method: "PUT", headers: authHeaders(),
        body: JSON.stringify({ ...form, valor: parseFloat(form.valor), tipo: lancamento.tipo }),
      });
      if (!r.ok) throw new Error("erro");
      await onSaved();
      onClose();
    } catch { setErro("Erro ao salvar. Tente novamente."); }
    finally  { setSaving(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-header">
          <div>
            <h2 className="modal-title">Editar Lançamento</h2>
            <p className="modal-subtitle">
              <span className="tipo-badge" style={{ color: cor, background: `${cor}15`, border: `1px solid ${cor}33` }}>
                {LABEL_TIPO[lancamento.tipo] || lancamento.tipo}
              </span>
            </p>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-fields">
          <div className={`modal-field-group${lancamento.tipo !== "ENTRADA" ? " modal-field-group--2" : ""}`}>
            <div className="modal-field">
              <label className="modal-label">Data</label>
              <DatePicker
                value={form.data_lancamento}
                onChange={v => handle("data_lancamento", v)}
                accentColor={cor}
              />
            </div>
            {lancamento.tipo !== "ENTRADA" && (
              <div className="modal-field">
                <label className="modal-label">Status</label>
                <CustomSelect
                  value={form.status}
                  onChange={v => handle("status", v)}
                  options={[{ value: "PAGO", label: "PAGO" }, { value: "PENDENTE", label: "PENDENTE" }]}
                  accentColor={cor}
                  style={{ borderColor: `${cor}44` }}
                />
              </div>
            )}
          </div>
          <div className="modal-field-group modal-field-group--2">
            <div className="modal-field">
              <label className="modal-label">Categoria</label>
              <CustomSelect
                value={form.id_categoria}
                onChange={v => handle("id_categoria", v)}
                options={catOptions}
                placeholder="Selecionar..."
                accentColor={cor}
                style={{ borderColor: `${cor}44` }}
              />
            </div>
            <div className="modal-field">
              <label className="modal-label">Valor (R$)</label>
              <input className="modal-input modal-input--valor" type="number"
                value={form.valor} onChange={e => handle("valor", e.target.value)}
                style={{ borderColor: `${cor}44`, color: cor }} />
            </div>
          </div>
          <div className="modal-field">
            <label className="modal-label">Descrição</label>
            <input className="modal-input" type="text"
              value={form.descricao} onChange={e => handle("descricao", e.target.value)}
              style={{ borderColor: `${cor}44` }} />
          </div>
        </div>

        {!mostraConfirm && erro && <div className="modal-erro">{erro}</div>}

        {mostraConfirm ? (
          <div className="modal-confirm-grupo">
            <p className="modal-confirm-grupo__msg">
              Esta é a parcela <strong>{lancamento.parcela_atual}/{lancamento.total_parcelas}</strong>.
              Deseja aplicar as alterações às demais parcelas do grupo?
            </p>
            <div className="modal-actions">
              <button className="modal-btn-cancel" onClick={() => setMostraConfirm(false)}>Voltar</button>
              <button className="modal-btn-cancel" onClick={() => salvar(false)} disabled={saving}>
                Só esta
              </button>
              <button className="modal-btn-save"
                style={{ background: `${cor}22`, border: `1px solid ${cor}88`, color: cor }}
                onClick={() => salvar(true)} disabled={saving}>
                {saving ? "Salvando..." : "Todas as parcelas"}
              </button>
            </div>
          </div>
        ) : (
          <div className="modal-actions">
            <button className="modal-btn-cancel" onClick={onClose}>Cancelar</button>
            <button className="modal-btn-save"
              style={{ background: `${cor}22`, border: `1px solid ${cor}88`, color: cor }}
              onClick={iniciarSalvar} disabled={saving}>
              {saving ? "Salvando..." : "Salvar Alterações"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Historico ─────────────────────────────────────────────────────────────────
export default function Historico() {
  const navigate = useNavigate();
  const [lancamentos, setLancamentos] = useState([]);
  const [categorias,  setCategorias]  = useState([]);
  const [cartoes,     setCartoes]     = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [filtroTipo,  setFiltroTipo]  = useState("TODOS");
  const [busca,       setBusca]       = useState("");
  const [modalAberto,        setModalAberto]        = useState(false);
  const [lancamentoEditando, setLancamentoEditando] = useState(null);
  const [ordemData,          setOrdemData]          = useState("desc");
  const [graficoAtivo,       setGraficoAtivo]       = useState("comparativo");
  const [deletandoLanc,      setDeletandoLanc]      = useState(null);
  const [selectedIds,        setSelectedIds]        = useState(new Set());
  const [bulkDeleteConfirm,  setBulkDeleteConfirm]  = useState(false);
  const checkAllRef = useRef(null);

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

  useEffect(() => {
    const handler = () => setModalAberto(true);
    window.addEventListener("openLancamentoModal", handler);
    return () => window.removeEventListener("openLancamentoModal", handler);
  }, []);

  const deletarLancamento = async (id, subsequentes = false) => {
    try {
      const url = subsequentes
        ? `${API}/lancamentos/${id}?subsequentes=true`
        : `${API}/lancamentos/${id}`;
      const r = await fetch(url, { method: "DELETE", headers: authHeaders() });
      if (!r.ok) throw new Error("erro");
      await carregar();
    } catch { }
    finally { setDeletandoLanc(null); }
  };

  const carregar = async () => {
    setLoading(true);
    try {
      const [rL, rC, rCart] = await Promise.all([
        fetch(`${API}/lancamentos`, { headers: authHeaders() }),
        fetch(`${API}/categorias`,  { headers: authHeaders() }),
        fetch(`${API}/cartoes`,     { headers: authHeaders() }),
      ]);
      if (rL.status === 401) { sessionStorage.clear(); navigate("/", { replace: true }); return; }
      setLancamentos(await rL.json());
      setCategorias(await rC.json());
      setCartoes(rCart.ok ? await rCart.json() : []);
    } catch { }
    finally { setLoading(false); setSelectedIds(new Set()); }
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

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelectedIds(
      selectedIds.size === filtrados.length
        ? new Set()
        : new Set(filtrados.map(l => l.id_lancamento))
    );
  };

  const bulkDelete = async () => {
    try {
      await Promise.all(
        [...selectedIds].map(id =>
          fetch(`${API}/lancamentos/${id}`, { method: "DELETE", headers: authHeaders() })
        )
      );
      setBulkDeleteConfirm(false);
      await carregar();
    } catch { }
  };

  useEffect(() => {
    if (!checkAllRef.current) return;
    const all  = filtrados.length > 0 && selectedIds.size === filtrados.length;
    const some = selectedIds.size > 0 && selectedIds.size < filtrados.length;
    checkAllRef.current.checked       = all;
    checkAllRef.current.indeterminate = some;
  }, [selectedIds, filtrados]);

  // ── Gerar PDF ──────────────────────────────────────────────────────────────
  const gerarPDF = () => {
    const doc         = new jsPDF();
    const nomeUsuario = sessionStorage.getItem("nome") || "Usuário";
    const agora       = new Date().toLocaleDateString("pt-BR");

    doc.setFillColor(26, 26, 26);
    doc.rect(0, 0, 210, 40, "F");
    doc.setTextColor(162, 255, 1);
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("HYDRA Finanças", 14, 18);
    doc.setFontSize(10);
    doc.setTextColor(180, 180, 180);
    doc.setFont("helvetica", "normal");
    doc.text("Extrato de Lançamentos", 14, 27);
    doc.text(`Gerado em ${agora} por ${nomeUsuario}`, 14, 34);

    const mesTxt  = mesFiltro  === "TODOS" ? "Todos os meses" : NOMES_MES_FILTRO.find(m => m.value === mesFiltro)?.label || mesFiltro;
    const anoTxt  = anoFiltro  === "TODOS" ? "Todos os anos"  : anoFiltro;
    const tipoTxt = filtroTipo === "TODOS" ? "Todos os tipos" : LABEL_TIPO[filtroTipo] || filtroTipo;
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(9);
    doc.text(`Período: ${mesTxt} / ${anoTxt}  |  Tipo: ${tipoTxt}  |  ${filtrados.length} registro(s)`, 14, 46);

    const totalEntradas  = filtrados.filter(l => l.tipo === "ENTRADA")       .reduce((s, l) => s + Number(l.valor), 0);
    const totalFixas     = filtrados.filter(l => l.tipo === "SAIDA_FIXA")    .reduce((s, l) => s + Number(l.valor), 0);
    const totalVariaveis = filtrados.filter(l => l.tipo === "SAIDA_VARIAVEL").reduce((s, l) => s + Number(l.valor), 0);
    const totalSaidas    = totalFixas + totalVariaveis;
    const saldo          = totalEntradas - totalSaidas;

    const cards = [
      { label: "Entradas",       valor: totalEntradas,  cor: [162, 255, 1]   },
      { label: "Saídas Fixas",   valor: totalFixas,     cor: [255, 77, 77]   },
      { label: "Saídas Variáv.", valor: totalVariaveis, cor: [255, 153, 0]   },
      { label: "Saldo",          valor: saldo,          cor: saldo >= 0 ? [162, 255, 1] : [255, 77, 77] },
    ];
    const cardW = 43, cardH = 18, startX = 14, startY = 52, gap = 4;
    cards.forEach((card, i) => {
      const x = startX + i * (cardW + gap);
      doc.setFillColor(38, 38, 38);
      doc.roundedRect(x, startY, cardW, cardH, 2, 2, "F");
      doc.setTextColor(...card.cor);
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.text(card.label, x + 4, startY + 6);
      doc.setFontSize(9);
      doc.text(formatBRL(card.valor), x + 4, startY + 13);
    });

    doc.setDrawColor(42, 42, 42);
    doc.line(14, 76, 196, 76);

    autoTable(doc, {
      startY: 80,
      head: [["Data", "Tipo", "Categoria", "Descrição", "Status", "Valor"]],
      body: filtrados.map(l => [
        formatData(l.data_competencia),
        LABEL_TIPO[l.tipo] || l.tipo,
        l.categoria_nome || "—",
        [l.descricao, l.total_parcelas > 1 ? `(${l.parcela_atual}/${l.total_parcelas}x)` : ""].filter(Boolean).join(" ") || "—",
        l.status || "—",
        `${l.tipo === "ENTRADA" ? "+" : "-"}${formatBRL(l.valor)}`,
      ]),
      styles: {
        font: "helvetica", fontSize: 8,
        textColor: [200, 200, 200], fillColor: [38, 38, 38],
        lineColor: [42, 42, 42],   lineWidth: 0.1,
      },
      headStyles: { fillColor: [26, 26, 26], textColor: [100, 100, 100], fontStyle: "bold", fontSize: 7 },
      alternateRowStyles: { fillColor: [30, 30, 30] },
      columnStyles: {
        0: { cellWidth: 22 }, 1: { cellWidth: 26 }, 2: { cellWidth: 30 },
        3: { cellWidth: 48 }, 4: { cellWidth: 22 }, 5: { cellWidth: 30, halign: "right" },
      },
      didDrawCell: (data) => {
        if (data.section === "body" && data.column.index === 5) {
          const tipo = filtrados[data.row.index]?.tipo;
          const cor  = tipo === "ENTRADA" ? [162, 255, 1] : tipo === "SAIDA_FIXA" ? [255, 77, 77] : [255, 153, 0];
          data.doc.setTextColor(...cor);
        }
      },
    });

    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(80, 80, 80);
      doc.text(`HYDRA Finanças — Extrato gerado em ${agora}`, 14, 290);
      doc.text(`Página ${i} de ${totalPages}`, 185, 290, { align: "right" });
    }

    const mesArq = mesFiltro === "TODOS" ? "todos" : (NOMES_MES_FILTRO.find(m => m.value === mesFiltro)?.label || mesFiltro);
    const anoArq = anoFiltro === "TODOS" ? "todos" : anoFiltro;
    doc.save(`extrato_hydra_${mesArq}_${anoArq}.pdf`);
  };

  return (
    <div className="historico-page">

      {modalAberto && (
        <ModalLancamento
          categorias={categorias}
          cartoes={cartoes}
          onClose={() => setModalAberto(false)}
          onSaved={carregar}
        />
      )}

      {lancamentoEditando && (
        <ModalEditar
          lancamento={lancamentoEditando}
          categorias={categorias}
          onClose={() => setLancamentoEditando(null)}
          onSaved={carregar}
        />
      )}

      {deletandoLanc && (
        <div className="modal-overlay" onClick={() => setDeletandoLanc(null)}>
          <div className="modal-box" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Excluir lançamento?</h2>
              <button className="modal-close" onClick={() => setDeletandoLanc(null)}>✕</button>
            </div>

            {deletandoLanc.grupo_parcelas ? (
              <>
                <p style={{ fontSize: 13, color: "#aaa", margin: 0 }}>
                  Esta é a parcela{" "}
                  <strong style={{ color: "#fff" }}>
                    {deletandoLanc.parcela_atual}/{deletandoLanc.total_parcelas}
                  </strong>
                  . Ao excluir esta e as subsequentes, elas serão removidas permanentemente.
                </p>
                <div className="modal-actions" style={{ marginTop: 8 }}>
                  <button className="modal-btn-cancel" onClick={() => setDeletandoLanc(null)}>Cancelar</button>
                  <button className="modal-btn-save"
                    style={{ background: "#ff4d4d22", border: "1px solid #ff4d4d88", color: "#ff4d4d" }}
                    onClick={() => deletarLancamento(deletandoLanc.id_lancamento, false)}>
                    Só esta
                  </button>
                  <button className="modal-btn-save"
                    style={{ background: "#ff4d4d22", border: "1px solid #ff4d4d88", color: "#ff4d4d" }}
                    onClick={() => deletarLancamento(deletandoLanc.id_lancamento, true)}>
                    Esta e as seguintes
                  </button>
                </div>
              </>
            ) : (
              <>
                <p style={{ fontSize: 13, color: "#aaa", margin: 0 }}>
                  Esta ação não pode ser desfeita.
                </p>
                <div className="modal-actions" style={{ marginTop: 8 }}>
                  <button className="modal-btn-cancel" onClick={() => setDeletandoLanc(null)}>Cancelar</button>
                  <button className="modal-btn-save"
                    style={{ background: "#ff4d4d22", border: "1px solid #ff4d4d88", color: "#ff4d4d" }}
                    onClick={() => deletarLancamento(deletandoLanc.id_lancamento)}>
                    Excluir
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {bulkDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setBulkDeleteConfirm(false)}>
          <div className="modal-box" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                Excluir {selectedIds.size} lançamento{selectedIds.size !== 1 ? "s" : ""}?
              </h2>
              <button className="modal-close" onClick={() => setBulkDeleteConfirm(false)}>✕</button>
            </div>
            <p style={{ fontSize: 13, color: "#aaa", margin: 0 }}>
              Esta ação não pode ser desfeita.
            </p>
            <div className="modal-actions" style={{ marginTop: 8 }}>
              <button className="modal-btn-cancel" onClick={() => setBulkDeleteConfirm(false)}>Cancelar</button>
              <button className="modal-btn-save"
                style={{ background: "#ff4d4d22", border: "1px solid #ff4d4d88", color: "#ff4d4d" }}
                onClick={bulkDelete}>
                Excluir tudo
              </button>
            </div>
          </div>
        </div>
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
          <button className="btn-exportar-pdf d-none d-md-flex" onClick={gerarPDF} title="Exportar extrato em PDF">
            ↓ PDF
          </button>
        </div>
      </div>

      {/* Gráfico — só desktop */}
      <div className="d-none d-md-block">
        {graficoAtivo === "comparativo" ? (
          <GraficoComparativo
            lancamentos={lancamentos}
            onOutrosGraficos={(tipo) => setGraficoAtivo(tipo)}
          />
        ) : (
          <GraficoPizza
            lancamentos={lancamentos}
            tipo={graficoAtivo}
            mesFiltro={mesFiltro}
            anoFiltro={anoFiltro}
            onTipoChange={(tipo) => setGraficoAtivo(tipo)}
            onVoltar={() => setGraficoAtivo("comparativo")}
          />
        )}
      </div>

      {/* Filtros */}
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
          <CustomSelect
            value={mesFiltro}
            onChange={setMesFiltro}
            options={NOMES_MES_FILTRO}
            className="filter-select"
          />
          <CustomSelect
            value={anoFiltro}
            onChange={setAnoFiltro}
            options={anosDisponiveis.map(a => ({ value: a, label: a === "TODOS" ? "Todos os anos" : a }))}
            className="filter-select"
          />
          <input className="filter-search" placeholder="Buscar por categoria..."
            value={busca} onChange={(e) => setBusca(e.target.value)} />
        </div>
      </div>

      {/* Barra de seleção em massa */}
      {selectedIds.size > 0 && (
        <div className="sel-bar">
          <span className="sel-bar__count">
            {selectedIds.size} selecionado{selectedIds.size !== 1 ? "s" : ""}
          </span>
          <div className="sel-bar__actions">
            <button className="sel-bar__cancel" onClick={() => setSelectedIds(new Set())}>
              Cancelar
            </button>
            <button className="sel-bar__delete" onClick={() => setBulkDeleteConfirm(true)}>
              Excluir {selectedIds.size}
            </button>
          </div>
        </div>
      )}

      {/* Tabela */}
      <div className="historico-table-wrap">
        {loading ? (
          <div className="historico-loading">Carregando...</div>
        ) : filtrados.length === 0 ? (
          <div className="historico-empty">Nenhum lançamento encontrado</div>
        ) : (
          <table className="historico-table">
            <thead>
              <tr>
                <th className="col-check">
                  <input
                    ref={checkAllRef}
                    type="checkbox"
                    className="row-check"
                    onChange={toggleSelectAll}
                  />
                </th>
                <th className="th-sortable" onClick={() => setOrdemData(o => o === "desc" ? "asc" : "desc")}>
                  Data <span className="sort-icon">{ordemData === "desc" ? "↓" : "↑"}</span>
                </th>
                <th className="d-none d-md-table-cell">Tipo</th>
                <th className="d-none d-md-table-cell">Categoria</th>
                <th className="d-none d-md-table-cell">Status</th>
                <th className="d-table-cell d-md-none">Tipo / Cat.</th>
                <th className="align-right">Valor</th>
                <th className="col-acoes d-none d-md-table-cell"></th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((l) => {
                const cor    = COR_TIPO[l.tipo] || "#888";
                const prefix = l.tipo === "ENTRADA" ? "+" : "-";
                const ehParcelado = l.total_parcelas > 1;
                const isSelected  = selectedIds.has(l.id_lancamento);

                return (
                  <tr key={l.id_lancamento}
                    className={`historico-row${isSelected ? " historico-row--selected" : ""}`}>
                    <td className="col-check">
                      <input
                        type="checkbox"
                        className="row-check"
                        checked={isSelected}
                        onChange={() => toggleSelect(l.id_lancamento)}
                      />
                    </td>
                    <td className="col-data">{formatData(l.data_competencia)}</td>

                    {/* Desktop */}
                    <td className="d-none d-md-table-cell">
                      <span className="tipo-badge" style={{ color: cor, background: `${cor}15`, border: `1px solid ${cor}33` }}>
                        {LABEL_TIPO[l.tipo] || l.tipo}
                      </span>
                      {l.meio_pagamento && (
                        <span className="pagamento-badge">
                          {LABEL_PAGAMENTO[l.meio_pagamento] || l.meio_pagamento}
                        </span>
                      )}
                    </td>
                    <td className="col-cat d-none d-md-table-cell">
                      <span>{l.categoria_nome || "—"}</span>
                      {ehParcelado && (
                        <span className="parcela-badge">{l.parcela_atual}/{l.total_parcelas}x</span>
                      )}
                      {l.cartao_nome && (
                        <span className="cartao-badge">◉ {l.cartao_nome}</span>
                      )}
                    </td>
                    <td className="d-none d-md-table-cell">
                      <span className={`status-badge status-badge--${(l.status || "pendente").toLowerCase()}`}>
                        {l.status || "PENDENTE"}
                      </span>
                    </td>

                    {/* Mobile */}
                    <td className="d-table-cell d-md-none">
                      <span className="tipo-badge" style={{ color: cor, background: `${cor}15`, border: `1px solid ${cor}33`, display: "block", marginBottom: "3px" }}>
                        {LABEL_TIPO[l.tipo] || l.tipo}
                        {ehParcelado && <span style={{ marginLeft: 4, opacity: 0.8 }}>{l.parcela_atual}/{l.total_parcelas}x</span>}
                      </span>
                      <span style={{ fontSize: "10px", color: "#777" }}>{l.categoria_nome || "—"}</span>
                    </td>

                    <td className="col-valor align-right" style={{ color: cor }}>
                      {prefix}{formatBRL(l.valor)}
                    </td>
                    <td className="col-acoes d-none d-md-table-cell">
                      <div className="row-acoes">
                        <button className="btn-acao btn-acao--edit" title="Editar"
                          onClick={() => setLancamentoEditando(l)}>✎</button>
                        <button className="btn-acao btn-acao--delete" title="Excluir"
                          onClick={() => setDeletandoLanc(l)}>✕</button>
                      </div>
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
