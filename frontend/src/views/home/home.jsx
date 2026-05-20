import { useState, useEffect, useMemo, Children } from "react";
import { useNavigate } from "react-router-dom";
import ModalLancamento from "../../assets/ModalLancamento";
import CustomSelect from "../../assets/CustomSelect";
import "./home.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:3333";
const TIPO = {
  ENTRADA:        "ENTRADA",
  SAIDA_FIXA:     "SAIDA_FIXA",
  SAIDA_VARIAVEL: "SAIDA_VARIAVEL",
};
const COR = {
  [TIPO.ENTRADA]:        "#A2FF01",
  [TIPO.SAIDA_FIXA]:     "#ff4d4d",
  [TIPO.SAIDA_VARIAVEL]: "#ff9900",
  SALDO_POS:    "#A2FF01",
  SALDO_NEG:    "#ff4d4d",
  SALDO_LIVRE:  "#00a6c0",
  TOTAL_SAIDAS: "#ffffff",
};
const FORM_CLASS = {
  [TIPO.ENTRADA]:        "form--entrada",
  [TIPO.SAIDA_FIXA]:     "form--fixa",
  [TIPO.SAIDA_VARIAVEL]: "form--variavel",
};
const formatBRL = (v) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);
const generateId = () => Math.random().toString(36).slice(2);
const getToken = () => sessionStorage.getItem("token");
const authHeaders = () => ({
  "Content-Type": "application/json",
  "Authorization": `Bearer ${getToken()}`,
});
const CAT_PADRAO = {
  [TIPO.ENTRADA]:        ["Salário","Freelance","Dividendos","Aluguel recebido","Rendimento","Outros (entrada)"],
  [TIPO.SAIDA_FIXA]:     ["Luz","Água","Internet","Aluguel","Supermercado","Matrícula","Plano de saúde","Combustível","Outros (fixo)"],
  [TIPO.SAIDA_VARIAVEL]: ["Lazer","Restaurante","Roupas","Viagem","Farmácia","Beleza","Delivery","Assinatura","Presente","Outros (variável)"],
};
const LABEL_TIPO = {
  [TIPO.ENTRADA]:        "entrada",
  [TIPO.SAIDA_FIXA]:     "saída fixa",
  [TIPO.SAIDA_VARIAVEL]: "saída variável",
};
const EMPTY_FORM = () => ({
  descricao: "", valor: "", id_categoria: "", id_conta: "",
  data_lancamento: new Date().toISOString().split("T")[0],
  status: "PENDENTE",
});

const fetchLancamentos = async () => {
  const r = await fetch(`${API}/lancamentos`, { headers: authHeaders() });
  if (r.status === 401) throw new Error("unauthorized");
  if (!r.ok) throw new Error("fetch_error");
  return r.json();
};
const fetchCategorias = async () => {
  const r = await fetch(`${API}/categorias`, { headers: authHeaders() });
  if (!r.ok) throw new Error("fetch_error");
  return r.json();
};
const postLancamento = async (dados) => {
  const r = await fetch(`${API}/lancamentos`, {
    method: "POST", headers: authHeaders(), body: JSON.stringify(dados),
  });
  if (r.status === 401) throw new Error("unauthorized");
  if (!r.ok) throw new Error("post_error");
  return r.json();
};
const deleteLancamento = async (id) => {
  const r = await fetch(`${API}/lancamentos/${id}`, {
    method: "DELETE", headers: authHeaders(),
  });
  if (r.status === 401) throw new Error("unauthorized");
  if (!r.ok) throw new Error("delete_error");
  return r.json();
};

// ── NotificationBell ─────────────────────────────────────────────────────────
const COR_NOTIF   = { danger: "#ff4d4d", warning: "#ff9900", info: "#00a6c0" };
const LABEL_NOTIF = { danger: "Crítico",  warning: "Atenção",  info: "Info"   };

function NotificationBell({ alertas }) {
  const [aberto, setAberto] = useState(false);
  const count = alertas.length;

  if (count === 0) return null;

  const mesRef = new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  return (
    <div className="notif-wrapper">
      <button
        className={`notif-btn${aberto ? " notif-btn--active" : ""}`}
        onClick={() => setAberto(o => !o)}
        aria-label="Notificações"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        <span className="notif-badge">{count}</span>
      </button>

      {aberto && (
        <>
          <div className="notif-overlay" onClick={() => setAberto(false)} />
          <div className="notif-panel">
            <div className="notif-panel__header">
              <span className="notif-panel__title">Alertas do mês</span>
              <span className="notif-panel__count">{count} ativo{count !== 1 ? "s" : ""}</span>
            </div>
            <div className="notif-panel__list">
              {alertas.map((a, i) => (
                <div key={i} className="notif-item">
                  <div className="notif-item__accent" style={{ background: COR_NOTIF[a.tipo] }} />
                  <div className="notif-item__body">
                    <div className="notif-item__row">
                      <span className="notif-item__titulo">{a.titulo}</span>
                      <span
                        className="notif-item__tag"
                        style={{ color: COR_NOTIF[a.tipo], background: `${COR_NOTIF[a.tipo]}15`, border: `1px solid ${COR_NOTIF[a.tipo]}30` }}
                      >
                        {LABEL_NOTIF[a.tipo]}
                      </span>
                    </div>
                    <span className="notif-item__desc">{a.texto}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="notif-panel__footer">
              Baseado nos lançamentos de {mesRef}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── KpiCard ───────────────────────────────────────────────────────────────────
function KpiCard({ label, value, color, icon, sub, isNegative }) {
  const displayColor = isNegative ? COR.SALDO_NEG : color;
  return (
    <div
      className="kpi-card"
      style={{ borderTopColor: `${displayColor}88` }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = `0 8px 28px ${displayColor}22`;
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.35)";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      <div className="kpi-card__label">{label}</div>
      <div className="kpi-card__value" style={{ color: displayColor }}>{value}</div>
      <div className="kpi-card__sub">{sub}</div>
      <div className="kpi-card__icon" style={{ color: displayColor }}>{icon}</div>
    </div>
  );
}

// ── DonutChart ────────────────────────────────────────────────────────────────
function DonutChart({ entradas, saidasFixas, saidasVariaveis }) {
  const totalSaidas = saidasFixas + saidasVariaveis;
  const saldo       = entradas - totalSaidas;

  if (entradas === 0 && totalSaidas === 0)
    return <div className="donut-empty">Adicione dados</div>;

  const cx = 105, cy = 105, r = 78;
  const circ = 2 * Math.PI * r;

  // Cada fatia proporcional às entradas (base = entradas)
  // Se saídas > entradas, limitamos a 100% do anel
  const base = entradas > 0 ? entradas : totalSaidas;

  const arcFixas     = Math.min((saidasFixas     / base), 1) * circ;
  const arcVariaveis = Math.min((saidasVariaveis / base), Math.max(0, 1 - saidasFixas / base)) * circ;
  const arcSaldo     = saldo > 0 ? (saldo / base) * circ : 0;

  // Offsets: fixas começa no topo, variáveis depois, saldo por último
  const offsetFixas     = 0;
  const offsetVariaveis = -(arcFixas);
  const offsetSaldo     = -(arcFixas + arcVariaveis);

  // Cor do arco e texto do saldo: verde quando positivo, vermelho quando negativo.
  // A variação por saúde (laranja/vermelho) fica apenas no box-shadow externo da card.
  const corSaldo = saldo >= 0 ? "#A2FF01" : "#ff4d4d";

  const abs = Math.abs(saldo);
  const fs  = abs >= 10_000_000 ? 7 : abs >= 1_000_000 ? 8 : abs >= 100_000 ? 9 : abs >= 10_000 ? 10 : 12;
  const pctSaude = entradas > 0 ? Math.round((saldo / entradas) * 100) : 0;

  return (
    <div className="donut-body">
      <div className="donut-wrapper">
        <svg width="100%" height="100%" viewBox="0 0 210 210" style={{ display: "block" }}>
          {/* Fundo */}
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#1a1a1a" strokeWidth="28" />

          {/* Saídas Fixas — vermelho */}
          {arcFixas > 0 && (
            <circle cx={cx} cy={cy} r={r} fill="none" stroke="#ff4d4d" strokeWidth="28"
              strokeDasharray={`${arcFixas} ${circ - arcFixas}`}
              strokeDashoffset={offsetFixas}
              strokeLinecap="butt"
              transform={`rotate(-90 ${cx} ${cy})`}
              style={{ transition: "stroke-dasharray 0.6s ease" }} />
          )}

          {/* Saídas Variáveis — laranja */}
          {arcVariaveis > 0 && (
            <circle cx={cx} cy={cy} r={r} fill="none" stroke="#ff9900" strokeWidth="28"
              strokeDasharray={`${arcVariaveis} ${circ - arcVariaveis}`}
              strokeDashoffset={offsetVariaveis}
              strokeLinecap="butt"
              transform={`rotate(-90 ${cx} ${cy})`}
              style={{ transition: "stroke-dasharray 0.6s ease" }} />
          )}

          {/* Saldo restante — sempre verde se positivo, vermelho se negativo */}
          {arcSaldo > 0 && (
            <circle cx={cx} cy={cy} r={r} fill="none" stroke={corSaldo} strokeWidth="28"
              strokeDasharray={`${arcSaldo} ${circ - arcSaldo}`}
              strokeDashoffset={offsetSaldo}
              strokeLinecap="butt"
              transform={`rotate(-90 ${cx} ${cy})`}
              style={{ transition: "stroke-dasharray 0.6s ease" }} />
          )}
        </svg>
        <div className="donut-center">
          <span className="donut-center__label">SALDO</span>
          <span
            className={`donut-center__value${saldo < 0 ? " negative" : ""}`}
            style={{ fontSize: `${fs}px`, color: saldo >= 0 ? corSaldo : COR.SALDO_NEG }}
          >
            {formatBRL(saldo)}
          </span>
        </div>
      </div>
      <div className="donut-legend">
        {[
          ["Fixas",      "#ff4d4d",          saidasFixas,     null],
          ["Variáveis",  "#ff9900",          saidasVariaveis, null],
          ["Saldo",      corSaldo,           saldo,           `${pctSaude}%`],
        ].map(([name, color, val, badge]) => (
          <div key={name} className="donut-legend__item">
            <div className="donut-legend__name">
              <div className="donut-legend__dot" style={{ background: color }} />
              {name}
              {badge && (
                <span style={{ fontSize: "9px", background: `${color}20`, color, border: `1px solid ${color}44`, borderRadius: "4px", padding: "1px 5px", marginLeft: "4px" }}>
                  {badge}
                </span>
              )}
            </div>
            <span className="donut-legend__val" style={{ color }}>{formatBRL(val)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── TableRow ──────────────────────────────────────────────────────────────────
function TableRow({ item, onDelete, tipo }) {
  const color  = COR[tipo];
  const prefix = tipo === TIPO.ENTRADA ? "+" : "-";
  return (
    <tr className="table-row">
      <td className="table-row__cat">{item.categoria_nome || "—"}</td>
      <td className="table-row__desc">{item.descricao || "—"}</td>
      <td className="table-row__value" style={{ color }}>{prefix}{formatBRL(item.valor)}</td>
      <td className="table-row__actions">
        <button className="btn-delete" onClick={() => onDelete(item.id_lancamento || item._localId)}>✕</button>
      </td>
    </tr>
  );
}

// ── AddRow ────────────────────────────────────────────────────────────────────
function AddRow({ tipo, categorias, onAdd, saving }) {
  const [form, setForm]     = useState(EMPTY_FORM());
  const [adding, setAdding] = useState(false);
  const accent = COR[tipo];
  const handle = (field, val) => setForm((f) => ({ ...f, [field]: val }));
  const catOptions = useMemo(() => {
    const fromApi = categorias.filter((c) => c.tipo === tipo);
    return fromApi.length > 0
      ? fromApi.map((c) => ({ label: c.nome, value: c.id_categoria }))
      : CAT_PADRAO[tipo].map((n) => ({ label: n, value: n }));
  }, [categorias, tipo]);
  const submit = async () => {
    const parsed = parseFloat(form.valor);
    if (!form.valor || isNaN(parsed)) return;
    await onAdd({
      id_categoria:    form.id_categoria || catOptions[0]?.value || null,
      id_conta:        form.id_conta     || null,
      descricao:       form.descricao,
      valor:           parsed,
      data_lancamento: form.data_lancamento,
      tipo,
      status:          "PENDENTE",
    });
    setForm(EMPTY_FORM());
    setAdding(false);
  };
  const btnConfirmStyle = {
    background: `${accent}25`, border: `1px solid ${accent}99`, color: accent,
  };
  if (!adding) {
    return (
      <tr className="add-row-trigger">
        <td colSpan={4}>
          <button
            className="btn-add-trigger"
            style={{ border: `1px dashed ${accent}44`, color: accent }}
            onMouseEnter={(e) => { e.currentTarget.style.background = `${accent}11`; e.currentTarget.style.boxShadow = `0 0 10px ${accent}22`; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "none"; e.currentTarget.style.boxShadow = "none"; }}
            onClick={() => setAdding(true)}
          >
            + Adicionar {LABEL_TIPO[tipo]}
          </button>
        </td>
      </tr>
    );
  }
  return (
    <tr className={`add-row-form ${FORM_CLASS[tipo]}`}>
      <td>
        <CustomSelect
          value={form.id_categoria}
          onChange={v => handle("id_categoria", v)}
          options={catOptions}
          placeholder="Categoria..."
          accentColor={accent}
          style={{
            padding:      "6px 8px",
            fontSize:     "12px",
            borderRadius: "6px",
            background:   `${accent}10`,
            border:       `1px solid ${accent}33`,
            color:        accent,
            minHeight:    "unset",
          }}
        />
      </td>
      <td>
        <input value={form.descricao} onChange={(e) => handle("descricao", e.target.value)} placeholder="Descrição..." />
      </td>
      <td>
        <input type="number" value={form.valor} onChange={(e) => handle("valor", e.target.value)} placeholder="0,00" />
      </td>
      <td className="add-row-actions">
        <button className="btn-confirm" style={btnConfirmStyle} onClick={submit} disabled={saving}>
          {saving ? "…" : "✓"}
        </button>
        <button className="btn-cancel" onClick={() => setAdding(false)}>✕</button>
      </td>
    </tr>
  );
}

// ── TableCard ─────────────────────────────────────────────────────────────────
const ROW_LIMIT = 5;

function TableCard({ title, subtitle, total, tipo, loading, children }) {
  const [expanded, setExpanded] = useState(false);
  const color = COR[tipo];

  const allFlat = Children.toArray(children);
  const addRow  = allFlat[allFlat.length - 1];
  const rows    = allFlat.slice(0, -1);
  const hasMore = rows.length > ROW_LIMIT;
  const shown   = !expanded && hasMore ? rows.slice(0, ROW_LIMIT) : rows;
  const hidden  = hasMore ? rows.length - ROW_LIMIT : 0;

  return (
    <div
      className="table-card"
      style={{ borderColor: `${color}33` }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = `${color}77`)}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = `${color}33`)}
    >
      <div className="table-card__header" style={{ borderBottom: `1px solid ${color}22` }}>
        <div>
          <div className="table-card__title" style={{ color }}>{title}</div>
          <div className="table-card__subtitle">{subtitle}</div>
        </div>
        <div className="table-card__total" style={{ color }}>{formatBRL(total)}</div>
      </div>
      <div className="table-card__scroll">
        {loading ? (
          <div className="table-loading">Carregando...</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Categoria</th>
                <th>Descrição</th>
                <th className="align-right">Valor</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {shown}
              {addRow}
            </tbody>
          </table>
        )}
      </div>
      {hasMore && !loading && (
        <button
          className="table-card__more"
          style={{ color: `${color}88`, borderTopColor: `${color}18` }}
          onClick={() => setExpanded(e => !e)}
        >
          {expanded
            ? "↑ Mostrar menos"
            : `↓ Ver mais ${hidden} lançamento${hidden !== 1 ? "s" : ""}`}
        </button>
      )}
    </div>
  );
}

// ── Home ──────────────────────────────────────────────────────────────────────
export default function Home() {
  const navigate = useNavigate();

  const [lancamentos, setLancamentos] = useState([]);
  const [categorias,  setCategorias]  = useState([]);
  const [cartoes,     setCartoes]     = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState(false);
  const [apiError,    setApiError]    = useState(null);
  const [modalAberto, setModalAberto] = useState(false);

  const hoje     = new Date();
  const mesAtual = hoje.getMonth();
  const anoAtual = hoje.getFullYear();

  useEffect(() => {
    if (!getToken()) navigate("/", { replace: true });
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setApiError(null);
      try {
        const [lancs, cats, rCart] = await Promise.all([
          fetchLancamentos(),
          fetchCategorias(),
          fetch(`${API}/cartoes`, { headers: authHeaders() }),
        ]);
        setLancamentos(lancs);
        setCategorias(cats);
        setCartoes(rCart.ok ? await rCart.json() : []);
      } catch (err) {
        if (err.message === "unauthorized") {
          sessionStorage.clear();
          navigate("/", { replace: true });
        } else {
          setApiError("Não foi possível conectar com o servidor.");
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Escuta o FAB da navbar para abrir o modal
  useEffect(() => {
    const handler = () => setModalAberto(true);
    window.addEventListener("openLancamentoModal", handler);
    return () => window.removeEventListener("openLancamentoModal", handler);
  }, []);

  const lancamentosMes = useMemo(() => lancamentos.filter((l) => {
    const d = new Date(l.data_competencia || l.dt_criacao);
    return d.getMonth() === mesAtual && d.getFullYear() === anoAtual;
  }), [lancamentos, mesAtual, anoAtual]);

  const entradas        = useMemo(() => lancamentosMes.filter((l) => l.tipo === TIPO.ENTRADA),        [lancamentosMes]);
  const saidasFixas     = useMemo(() => lancamentosMes.filter((l) => l.tipo === TIPO.SAIDA_FIXA),     [lancamentosMes]);
  const saidasVariaveis = useMemo(() => lancamentosMes.filter((l) => l.tipo === TIPO.SAIDA_VARIAVEL), [lancamentosMes]);

  const totalEntradas  = useMemo(() => entradas.reduce((s, i)        => s + Number(i.valor), 0), [entradas]);
  const totalFixas     = useMemo(() => saidasFixas.reduce((s, i)     => s + Number(i.valor), 0), [saidasFixas]);
  const totalVariaveis = useMemo(() => saidasVariaveis.reduce((s, i) => s + Number(i.valor), 0), [saidasVariaveis]);
  const totalSaidas    = totalFixas + totalVariaveis;
  const saldo          = totalEntradas - totalSaidas;
  const pctSaude       = totalEntradas > 0 ? Math.round((saldo / totalEntradas) * 100) : 0;

  const pctSaldo = totalEntradas > 0 ? saldo / totalEntradas : 0;
  const temDados = lancamentosMes.length > 0;
  const corSaldo = !temDados ? "transparent"
    : saldo < 0 ? "#ff4d4d"
    : pctSaldo > 0.50 ? "#A2FF01"
    : pctSaldo > 0.25 ? "#ff9900"
    : "#ff4d4d";

  const topSaidas = useMemo(() => {
    const bycat = {};
    [...saidasFixas, ...saidasVariaveis].forEach((s) => {
      const nome = s.categoria_nome || "Outros";
      bycat[nome] = { val: (bycat[nome]?.val || 0) + Number(s.valor), tipo: s.tipo };
    });
    return Object.entries(bycat).sort((a, b) => b[1].val - a[1].val).slice(0, 5);
  }, [saidasFixas, saidasVariaveis]);
  const maxTop = topSaidas[0]?.[1].val || 1;

  const alertas = useMemo(() => {
    const list = [];
    if (saldo < 0)
      list.push({ tipo: "danger", titulo: "Saldo negativo", texto: `Saídas (${formatBRL(totalSaidas)}) superam entradas (${formatBRL(totalEntradas)}) em ${formatBRL(Math.abs(saldo))}.` });
    if (totalVariaveis > totalFixas && totalEntradas > 0)
      list.push({ tipo: "warning", titulo: "Variáveis acima das fixas", texto: `${formatBRL(totalVariaveis)} em gastos variáveis vs. ${formatBRL(totalFixas)} em fixos.` });
    if (saldo >= 0 && pctSaude < 20 && totalEntradas > 0)
      list.push({ tipo: "info", titulo: "Saldo livre baixo", texto: `Apenas ${pctSaude}% da renda disponível (${formatBRL(saldo)}). Considere revisar despesas.` });
    return list;
  }, [saldo, totalSaidas, totalEntradas, totalVariaveis, totalFixas, pctSaude]);

  const recarregar = async () => {
    try {
      const [lancs, rCart] = await Promise.all([
        fetchLancamentos(),
        fetch(`${API}/cartoes`, { headers: authHeaders() }),
      ]);
      setLancamentos(lancs);
      setCartoes(rCart.ok ? await rCart.json() : []);
    } catch { }
  };

  const handleAdd = async (payload) => {
    setSaving(true);
    setApiError(null);
    try {
      await postLancamento(payload);
      const atualizados = await fetchLancamentos();
      setLancamentos(atualizados);
    } catch (err) {
      if (err.message === "unauthorized") {
        sessionStorage.clear();
        navigate("/", { replace: true });
      } else {
        setLancamentos((prev) => [...prev, { ...payload, _localId: generateId(), id_lancamento: null }]);
        setApiError("Lançamento salvo localmente (sem conexão com servidor).");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    setLancamentos((prev) => prev.filter((l) => (l.id_lancamento || l._localId) !== id));
    if (typeof id === "number" || (typeof id === "string" && !id.includes("-"))) {
      try {
        await deleteLancamento(id);
      } catch (err) {
        if (err.message === "unauthorized") {
          sessionStorage.clear();
          navigate("/", { replace: true });
        }
      }
    }
  };

  return (
    <div className="home-page">

      <NotificationBell alertas={alertas} />

      {apiError && <div className="api-error-banner"><span>⚠️</span> {apiError}</div>}

      {/* ── KPI Cards ── */}
      <div className="kpi-grid">
        <KpiCard label="ENTRADAS"         value={formatBRL(totalEntradas)}  color={COR[TIPO.ENTRADA]}        icon="↑" sub={`${entradas.length} fonte${entradas.length !== 1 ? "s" : ""}`} />
        <KpiCard label="SAÍDAS FIXAS"     value={formatBRL(totalFixas)}     color={COR[TIPO.SAIDA_FIXA]}     icon="↓" sub={`${saidasFixas.length} item${saidasFixas.length !== 1 ? "s" : ""}`} />
        <KpiCard label="SAÍDAS VARIÁVEIS" value={formatBRL(totalVariaveis)} color={COR[TIPO.SAIDA_VARIAVEL]} icon="≈" sub={`${saidasVariaveis.length} item${saidasVariaveis.length !== 1 ? "s" : ""}`} />
        <KpiCard label="TOTAL SAÍDAS"     value={formatBRL(totalSaidas)}    color={COR.TOTAL_SAIDAS}         icon="∑" sub={`${saidasFixas.length + saidasVariaveis.length} itens`} />
        <KpiCard label="SALDO LIVRE"      value={formatBRL(saldo)}          color={COR.SALDO_LIVRE}          icon="◈" sub={`${pctSaude}% da renda`} isNegative={saldo < 0} />
      </div>

      {/* ── Middle Row ── */}
      <div className="middle-grid">
        <div className="widget-card widget-card--donut"
          style={{
            boxShadow:   temDados ? `0 0 24px ${corSaldo}88` : "none",
            borderColor: temDados ? `${corSaldo}99` : "#2a2a2a",
          }}>
          <div className="widget-card__label">COMPOSIÇÃO</div>
          <DonutChart entradas={totalEntradas} saidasFixas={totalFixas} saidasVariaveis={totalVariaveis} />
        </div>

        <div className="widget-card widget-card--side">
          <div className="widget-card__label">TOP CATEGORIAS — SAÍDAS</div>
          {topSaidas.length === 0 ? (
            <p className="top-cat__empty">Nenhuma saída cadastrada</p>
          ) : (
            <div className="top-cat__list">
              {topSaidas.map(([cat, info]) => {
                const barColor = COR[info.tipo] || "#888";
                return (
                  <div key={cat}>
                    <div className="top-cat__item-header">
                      <div className="top-cat__item-left">
                        <div className="top-cat__dot" style={{ background: barColor }} />
                        <span className="top-cat__name">{cat}</span>
                        <span className="top-cat__badge" style={{ color: barColor, background: `${barColor}18` }}>
                          {info.tipo === TIPO.SAIDA_FIXA ? "FIXA" : "VAR"}
                        </span>
                      </div>
                      <span className="top-cat__value" style={{ color: barColor }}>{formatBRL(info.val)}</span>
                    </div>
                    <div className="top-cat__bar-bg">
                      <div className="top-cat__bar-fill" style={{ width: `${(info.val / maxTop) * 100}%`, background: barColor }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="widget-card widget-card--side">
          <div className="widget-card__label">FIXAS vs VARIÁVEIS</div>
          <div className="fv-list">
            {[
              { label: "Saídas Fixas",     val: totalFixas,     tipo: TIPO.SAIDA_FIXA,     count: saidasFixas.length },
              { label: "Saídas Variáveis", val: totalVariaveis, tipo: TIPO.SAIDA_VARIAVEL, count: saidasVariaveis.length },
            ].map((item) => {
              const color = COR[item.tipo];
              return (
                <div key={item.label}>
                  <div className="fv-item__header">
                    <span className="fv-item__title">{item.label}</span>
                    <div className="fv-item__values">
                      <span className="fv-item__amount" style={{ color }}>{formatBRL(item.val)}</span>
                      <span className="fv-item__pct">{totalSaidas > 0 ? Math.round((item.val / totalSaidas) * 100) : 0}%</span>
                    </div>
                  </div>
                  <div className="fv-item__bar-bg">
                    <div className="fv-item__bar-fill" style={{ width: `${totalSaidas > 0 ? (item.val / totalSaidas) * 100 : 0}%`, background: color }} />
                  </div>
                  <div className="fv-item__count">{item.count} item{item.count !== 1 ? "s" : ""} cadastrado{item.count !== 1 ? "s" : ""}</div>
                </div>
              );
            })}
            <div className="fv-totals">
              <div className="fv-totals__row">
                <span className="fv-totals__label">Total saídas</span>
                <span className="fv-totals__value" style={{ color: COR.TOTAL_SAIDAS }}>{formatBRL(totalSaidas)}</span>
              </div>
              <div className="fv-totals__row">
                <span className="fv-totals__label">Saldo livre</span>
                <span className="fv-totals__value" style={{ color: saldo >= 0 ? COR.SALDO_LIVRE : COR.SALDO_NEG }}>{formatBRL(saldo)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tabelas ── */}
      <div className="tables-grid">
        <TableCard title="Entradas" subtitle="FONTES DE RENDA" total={totalEntradas} tipo={TIPO.ENTRADA} loading={loading}>
          {entradas.map((item) => <TableRow key={item.id_lancamento || item._localId} item={item} tipo={TIPO.ENTRADA} onDelete={handleDelete} />)}
          <AddRow tipo={TIPO.ENTRADA} categorias={categorias} onAdd={handleAdd} saving={saving} />
        </TableCard>
        <TableCard title="Saídas Fixas" subtitle="DESPESAS RECORRENTES" total={totalFixas} tipo={TIPO.SAIDA_FIXA} loading={loading}>
          {saidasFixas.map((item) => <TableRow key={item.id_lancamento || item._localId} item={item} tipo={TIPO.SAIDA_FIXA} onDelete={handleDelete} />)}
          <AddRow tipo={TIPO.SAIDA_FIXA} categorias={categorias} onAdd={handleAdd} saving={saving} />
        </TableCard>
        <TableCard title="Saídas Variáveis" subtitle="DESPESAS EVENTUAIS" total={totalVariaveis} tipo={TIPO.SAIDA_VARIAVEL} loading={loading}>
          {saidasVariaveis.map((item) => <TableRow key={item.id_lancamento || item._localId} item={item} tipo={TIPO.SAIDA_VARIAVEL} onDelete={handleDelete} />)}
          <AddRow tipo={TIPO.SAIDA_VARIAVEL} categorias={categorias} onAdd={handleAdd} saving={saving} />
        </TableCard>
      </div>

      {modalAberto && (
        <ModalLancamento
          categorias={categorias}
          cartoes={cartoes}
          onClose={() => setModalAberto(false)}
          onSaved={recarregar}
        />
      )}

    </div>
  );
}