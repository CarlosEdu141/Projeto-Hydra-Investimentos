import { useState, useEffect, useMemo } from "react";
import "./home.css";

// ── Config ───────────────────────────────────────────────────────────────────
const API = "http://localhost:3333";

const TIPO = {
  ENTRADA:        "ENTRADA",
  SAIDA_FIXA:     "SAIDA_FIXA",
  SAIDA_VARIAVEL: "SAIDA_VARIAVEL",
};

const COR = {
  [TIPO.ENTRADA]:        "#A2FF01",
  [TIPO.SAIDA_FIXA]:     "#ff4d4d",
  [TIPO.SAIDA_VARIAVEL]: "#ff9900",
  SALDO_POS:   "#A2FF01",
  SALDO_NEG:   "#ff4d4d",
  SALDO_LIVRE: "#00a6c0",
  TOTAL_SAIDAS: "#ffffff",
};

// Classe CSS do formulário por tipo — garante cor correta nos inputs
const FORM_CLASS = {
  [TIPO.ENTRADA]:        "form--entrada",
  [TIPO.SAIDA_FIXA]:     "form--fixa",
  [TIPO.SAIDA_VARIAVEL]: "form--variavel",
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const formatBRL = (v) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

const generateId = () => Math.random().toString(36).slice(2);

const CAT_PADRAO = {
  [TIPO.ENTRADA]:        ["Salário", "Freelance", "Dividendos", "Aluguel recebido", "Rendimento", "Outro"],
  [TIPO.SAIDA_FIXA]:     ["Luz", "Água", "Internet", "Aluguel", "Supermercado", "Matrícula", "Plano de saúde", "Combustível", "Outro"],
  [TIPO.SAIDA_VARIAVEL]: ["Lazer", "Restaurante", "Roupas", "Viagem", "Farmácia", "Beleza", "Delivery", "Assinatura", "Presente", "Outro"],
};

const LABEL_TIPO = {
  [TIPO.ENTRADA]:        "entrada",
  [TIPO.SAIDA_FIXA]:     "saída fixa",
  [TIPO.SAIDA_VARIAVEL]: "saída variável",
};

const EMPTY_FORM = () => ({
  descricao: "", valor: "", id_categoria: "", id_conta: "",
  data_lancamento: new Date().toISOString().split("T")[0],
  status: "ATIVO",
});

// ── API ───────────────────────────────────────────────────────────────────────
const fetchLancamentos = async () => {
  const r = await fetch(`${API}/lancamentos`);
  if (!r.ok) throw new Error();
  return r.json();
};
const fetchCategorias = async () => {
  const r = await fetch(`${API}/categorias`);
  if (!r.ok) throw new Error();
  return r.json();
};
const postLancamento = async (dados) => {
  const r = await fetch(`${API}/lancamentos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dados),
  });
  if (!r.ok) throw new Error();
  return r.json();
};

// ── KpiCard ───────────────────────────────────────────────────────────────────
function KpiCard({ label, value, color, icon, sub, isNegative }) {
  const displayColor = isNegative ? COR.SALDO_NEG : color;
  return (
    <div
      className="kpi-card"
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = `${displayColor}99`;
        e.currentTarget.style.boxShadow   = `0 0 18px ${displayColor}33`;
        e.currentTarget.style.transform   = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "#2a2a2a";
        e.currentTarget.style.boxShadow   = "none";
        e.currentTarget.style.transform   = "translateY(0)";
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
  const total = entradas + saidasFixas + saidasVariaveis;
  const saldo = entradas - saidasFixas - saidasVariaveis;

  if (total === 0) return <div className="donut-empty">Adicione dados</div>;

  // SVG 210×210 | raio 78 | espessura 28 → buraco interno ≈ 100px diâmetro
  const cx = 105, cy = 105, r = 78;
  const circ = 2 * Math.PI * r;
  const dE = (entradas        / total) * circ;
  const dF = (saidasFixas     / total) * circ;
  const dV = (saidasVariaveis / total) * circ;

  // Fonte escala com magnitude — garante caber no buraco de ~100px
  const abs = Math.abs(saldo);
  const fs  = abs >= 10_000_000 ? 7
            : abs >= 1_000_000  ? 8
            : abs >= 100_000    ? 9
            : abs >= 10_000     ? 10
            : 12;

  return (
    <div className="donut-body">
      <div className="donut-wrapper">
        <svg width="210" height="210" viewBox="0 0 210 210">
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#1a1a1a" strokeWidth="28" />
          <circle cx={cx} cy={cy} r={r} fill="none" stroke={COR[TIPO.ENTRADA]} strokeWidth="28"
            strokeDasharray={`${dE} ${circ - dE}`} strokeDashoffset="0" strokeLinecap="butt"
            transform={`rotate(-90 ${cx} ${cy})`} style={{ transition: "stroke-dasharray 0.6s ease" }} />
          <circle cx={cx} cy={cy} r={r} fill="none" stroke={COR[TIPO.SAIDA_FIXA]} strokeWidth="28"
            strokeDasharray={`${dF} ${circ - dF}`} strokeDashoffset={-dE} strokeLinecap="butt"
            transform={`rotate(-90 ${cx} ${cy})`} style={{ transition: "stroke-dasharray 0.6s ease" }} />
          <circle cx={cx} cy={cy} r={r} fill="none" stroke={COR[TIPO.SAIDA_VARIAVEL]} strokeWidth="28"
            strokeDasharray={`${dV} ${circ - dV}`} strokeDashoffset={-(dE + dF)} strokeLinecap="butt"
            transform={`rotate(-90 ${cx} ${cy})`} style={{ transition: "stroke-dasharray 0.6s ease" }} />
        </svg>

        <div className="donut-center">
          <span className="donut-center__label">SALDO</span>
          <span
            className={`donut-center__value${saldo < 0 ? " negative" : ""}`}
            style={{ fontSize: `${fs}px`, color: saldo >= 0 ? COR.SALDO_POS : COR.SALDO_NEG }}
          >
            {formatBRL(saldo)}
          </span>
        </div>
      </div>

      <div className="donut-legend">
        {[
          ["Entradas",  COR[TIPO.ENTRADA],        entradas],
          ["Fixas",     COR[TIPO.SAIDA_FIXA],     saidasFixas],
          ["Variáveis", COR[TIPO.SAIDA_VARIAVEL], saidasVariaveis],
        ].map(([name, color, val]) => (
          <div key={name} className="donut-legend__item">
            <div className="donut-legend__name">
              <div className="donut-legend__dot" style={{ background: color }} />
              {name}
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
      <td className="table-row__cat">{item.categoria_nome || item.id_categoria || "—"}</td>
      <td className="table-row__desc">{item.descricao || "—"}</td>
      <td className="table-row__value" style={{ color }}>{prefix}{formatBRL(item.valor)}</td>
      <td className="table-row__actions">
        <button className="btn-delete" onClick={() => onDelete(item.id_lancamento || item._localId)}>✕</button>
      </td>
    </tr>
  );
}

// ── AddRow ────────────────────────────────────────────────────────────────────
// Usa FORM_CLASS[tipo] no <tr> — o CSS define cores por classe, sem CSS vars
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
      id_user: 1,
      id_categoria: form.id_categoria || catOptions[0]?.value || null,
      id_conta: form.id_conta || null,
      descricao: form.descricao,
      valor: parsed,
      data_lancamento: form.data_lancamento,
      tipo,
      status: "ATIVO",
    });
    setForm(EMPTY_FORM());
    setAdding(false);
  };

  if (!adding) {
    return (
      <tr className="add-row-trigger">
        <td colSpan={4}>
          <button
            className="btn-add-trigger"
            style={{ border: `1px dashed ${accent}44`, color: accent }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = `${accent}11`;
              e.currentTarget.style.boxShadow  = `0 0 10px ${accent}22`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "none";
              e.currentTarget.style.boxShadow  = "none";
            }}
            onClick={() => setAdding(true)}
          >
            + Adicionar {LABEL_TIPO[tipo]}
          </button>
        </td>
      </tr>
    );
  }

  // Botão confirmar: fundo semitransparente da cor do tipo
  const btnConfirmStyle = {
    background: `${accent}25`,
    border: `1px solid ${accent}99`,
    color: accent,
  };

  return (
    // FORM_CLASS[tipo] = "form--entrada" | "form--fixa" | "form--variavel"
    <tr className={`add-row-form ${FORM_CLASS[tipo]}`}>
      <td>
        <select value={form.id_categoria} onChange={(e) => handle("id_categoria", e.target.value)}>
          {catOptions.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </td>
      <td>
        <input
          value={form.descricao}
          onChange={(e) => handle("descricao", e.target.value)}
          placeholder="Descrição..."
        />
      </td>
      <td>
        <input
          type="number"
          value={form.valor}
          onChange={(e) => handle("valor", e.target.value)}
          placeholder="0,00"
        />
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
function TableCard({ title, subtitle, total, tipo, loading, children }) {
  const color = COR[tipo];
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
            <tbody>{children}</tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ── Home ──────────────────────────────────────────────────────────────────────
export default function Home() {
  const [lancamentos, setLancamentos] = useState([]);
  const [categorias,  setCategorias]  = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState(false);
  const [apiError,    setApiError]    = useState(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setApiError(null);
      try {
        const [lancs, cats] = await Promise.all([fetchLancamentos(), fetchCategorias()]);
        setLancamentos(lancs);
        setCategorias(cats);
      } catch {
        setApiError("Não foi possível conectar com o servidor. Verifique se o backend está rodando em http://localhost:3333");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const entradas        = useMemo(() => lancamentos.filter((l) => l.tipo === TIPO.ENTRADA),        [lancamentos]);
  const saidasFixas     = useMemo(() => lancamentos.filter((l) => l.tipo === TIPO.SAIDA_FIXA),     [lancamentos]);
  const saidasVariaveis = useMemo(() => lancamentos.filter((l) => l.tipo === TIPO.SAIDA_VARIAVEL), [lancamentos]);

  const totalEntradas  = useMemo(() => entradas.reduce((s, i)        => s + Number(i.valor), 0), [entradas]);
  const totalFixas     = useMemo(() => saidasFixas.reduce((s, i)     => s + Number(i.valor), 0), [saidasFixas]);
  const totalVariaveis = useMemo(() => saidasVariaveis.reduce((s, i) => s + Number(i.valor), 0), [saidasVariaveis]);
  const totalSaidas    = totalFixas + totalVariaveis;
  const saldo          = totalEntradas - totalSaidas;
  const pctSaude       = totalEntradas > 0 ? Math.round((saldo / totalEntradas) * 100) : 0;

  const topSaidas = useMemo(() => {
    const bycat = {};
    [...saidasFixas, ...saidasVariaveis].forEach((s) => {
      const nome = s.categoria_nome || String(s.id_categoria) || "Outros";
      bycat[nome] = { val: (bycat[nome]?.val || 0) + Number(s.valor), tipo: s.tipo };
    });
    return Object.entries(bycat).sort((a, b) => b[1].val - a[1].val).slice(0, 5);
  }, [saidasFixas, saidasVariaveis]);
  const maxTop = topSaidas[0]?.[1].val || 1;

  const handleAdd = async (payload) => {
    setSaving(true);
    setApiError(null);
    try {
      const novo = await postLancamento(payload);
      setLancamentos((prev) => [...prev, novo]);
    } catch {
      setLancamentos((prev) => [...prev, { ...payload, _localId: generateId(), id_lancamento: null }]);
      setApiError("Lançamento salvo localmente (sem conexão com servidor).");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id) =>
    setLancamentos((prev) => prev.filter((l) => (l.id_lancamento || l._localId) !== id));

  return (
    <div className="home-page">

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

        <div className="widget-card widget-card--donut">
          <div className="widget-card__label">COMPOSIÇÃO</div>
          <DonutChart entradas={totalEntradas} saidasFixas={totalFixas} saidasVariaveis={totalVariaveis} />
        </div>

        <div className="widget-card">
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

        <div className="widget-card">
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

      {/* ── Alertas ── */}
      <div className="alerts">
        {saldo < 0 && (
          <div className="alert alert--danger">
            <span className="alert__icon">⚠️</span>
            <span className="alert__text">
              Atenção: suas saídas ({formatBRL(totalSaidas)}) superam as entradas ({formatBRL(totalEntradas)}) em <strong>{formatBRL(Math.abs(saldo))}</strong>.
            </span>
          </div>
        )}
        {totalVariaveis > totalFixas && totalEntradas > 0 && (
          <div className="alert alert--warning">
            <span className="alert__icon">📊</span>
            <span className="alert__text">
              Saídas variáveis ({formatBRL(totalVariaveis)}) maiores que as fixas ({formatBRL(totalFixas)}). Atenção aos gastos eventuais.
            </span>
          </div>
        )}
        {saldo >= 0 && pctSaude < 20 && totalEntradas > 0 && (
          <div className="alert alert--info">
            <span className="alert__icon">💡</span>
            <span className="alert__text">
              Saldo livre baixo ({pctSaude}% da renda). Considere revisar suas despesas.
            </span>
          </div>
        )}
      </div>

    </div>
  );
}
