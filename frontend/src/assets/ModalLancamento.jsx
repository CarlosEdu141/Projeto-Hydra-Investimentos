import { useState, useEffect, useMemo } from "react";
import DatePicker from "./DatePicker";
import CustomSelect from "./CustomSelect";
import "./modal-lancamento.css";

const API        = import.meta.env.VITE_API_URL || "http://localhost:3333";
const getToken   = () => sessionStorage.getItem("token");
const authHeaders = () => ({
  "Content-Type": "application/json",
  "Authorization": `Bearer ${getToken()}`,
});

const formatBRL = (v) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

const TAXA_JUROS_PADRAO = 2.99;

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
const CAT_PADRAO = {
  ENTRADA:        ["Salário","Freelance","Dividendos","Aluguel recebido","Rendimento","Outros (entrada)"],
  SAIDA_FIXA:     ["Luz","Água","Internet","Aluguel","Supermercado","Matrícula","Plano de saúde","Combustível","Outros (fixo)"],
  SAIDA_VARIAVEL: ["Lazer","Restaurante","Roupas","Viagem","Farmácia","Beleza","Delivery","Assinatura","Presente","Outros (variável)"],
};

const EMPTY_FORM = () => ({
  tipo:            "SAIDA_VARIAVEL",
  id_categoria:    "",
  descricao:       "",
  valor:           "",
  data_lancamento: new Date().toISOString().split("T")[0],
  meio_pagamento:  "",
  id_cartao:       "",
});

function calcularPMT(valor, taxaMensal, parcelas) {
  if (taxaMensal === 0) return Math.round((valor / parcelas) * 100) / 100;
  const i = taxaMensal / 100;
  return Math.round(valor * (i * Math.pow(1 + i, parcelas)) / (Math.pow(1 + i, parcelas) - 1) * 100) / 100;
}

export default function ModalLancamento({ onClose, onSaved, categorias, cartoes }) {
  const [form,     setForm]     = useState(EMPTY_FORM());
  const [parcelar, setParcelar] = useState(false);
  const [parcelas, setParcelas] = useState(2);
  const [temJuros, setTemJuros] = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [erro,     setErro]     = useState(null);

  // Bloqueia scroll do fundo enquanto modal está aberto
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const cor     = COR_TIPO[form.tipo];
  const ehSaida = form.tipo !== "ENTRADA";

  const pmt = useMemo(() => {
    if (!parcelar || !form.id_cartao || !form.valor || isNaN(parseFloat(form.valor))) return null;
    return calcularPMT(parseFloat(form.valor), temJuros ? TAXA_JUROS_PADRAO : 0, parcelas);
  }, [parcelar, form.id_cartao, form.valor, parcelas, temJuros]);

  const catOptions = useMemo(() => {
    const fromApi = categorias.filter(c => c.tipo === form.tipo);
    return fromApi.length > 0
      ? fromApi.map(c => ({ label: c.nome, value: c.id_categoria }))
      : CAT_PADRAO[form.tipo].map(n => ({ label: n, value: n }));
  }, [categorias, form.tipo]);

  const handle     = (field, val) => setForm(f => ({ ...f, [field]: val }));
  const handleTipo = (tipo)       => setForm(f => ({ ...f, tipo, id_categoria: "", meio_pagamento: "", id_cartao: "" }));

  const handleMeioPagamento = (mp) => {
    handle("meio_pagamento", mp);
    if (mp !== "CREDITO") { handle("id_cartao", ""); setParcelar(false); setTemJuros(false); }
  };

  const handleSubmit = async () => {
    if (!form.valor || isNaN(parseFloat(form.valor))) { setErro("Informe um valor válido."); return; }
    if (!form.data_lancamento)                         { setErro("Informe a data."); return; }
    if (form.meio_pagamento === "CREDITO" && !form.id_cartao) { setErro("Selecione um cartão."); return; }

    setSaving(true); setErro(null);
    try {
      const body = {
        tipo:            form.tipo,
        id_categoria:    form.id_categoria || catOptions[0]?.value || null,
        descricao:       form.descricao,
        valor:           parseFloat(form.valor),
        data_lancamento: form.data_lancamento,
        meio_pagamento:  form.meio_pagamento || null,
        id_cartao:       form.id_cartao      || null,
        total_parcelas:  parcelar && form.meio_pagamento === "CREDITO" ? parcelas : 1,
        tem_juros:       parcelar && temJuros,
      };
      const r = await fetch(`${API}/lancamentos`, {
        method: "POST", headers: authHeaders(), body: JSON.stringify(body),
      });
      if (!r.ok) throw new Error("erro");
      await onSaved();
      onClose();
    } catch { setErro("Erro ao salvar. Tente novamente."); }
    finally  { setSaving(false); }
  };

  return (
    <div className="ml-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="ml-box">

        {/* Header */}
        <div className="ml-header">
          <div>
            <h2 className="ml-title">Novo Lançamento</h2>
            <p className="ml-subtitle">Informe os detalhes abaixo</p>
          </div>
          <button className="ml-close" onClick={onClose}>✕</button>
        </div>

        {/* Tipo */}
        <div className="ml-tipo-tabs">
          {["ENTRADA","SAIDA_FIXA","SAIDA_VARIAVEL"].map(t => (
            <button key={t}
              className={`ml-tipo-tab${form.tipo === t ? " ml-tipo-tab--active" : ""}`}
              style={form.tipo === t ? { color: COR_TIPO[t], borderColor: COR_TIPO[t], background: `${COR_TIPO[t]}12` } : {}}
              onClick={() => handleTipo(t)}>
              {LABEL_TIPO[t]}
            </button>
          ))}
        </div>

        {/* Campos */}
        <div className="ml-fields">
          <div className="ml-field">
            <label className="ml-label">Data</label>
            <DatePicker
              value={form.data_lancamento}
              onChange={v => handle("data_lancamento", v)}
              accentColor={cor}
            />
          </div>

          <div className="ml-field-group ml-field-group--2">
            <div className="ml-field">
              <label className="ml-label">Categoria</label>
              <CustomSelect
                value={form.id_categoria}
                onChange={v => handle("id_categoria", v)}
                options={catOptions}
                placeholder="Selecionar..."
                accentColor={cor}
                style={{ borderColor: `${cor}44` }}
              />
            </div>
            <div className="ml-field">
              <label className="ml-label">Valor (R$)</label>
              <input className="ml-input ml-input--valor" type="number" placeholder="0,00"
                value={form.valor} onChange={e => handle("valor", e.target.value)}
                style={{ borderColor: `${cor}44`, color: cor }} />
            </div>
          </div>

          {/* Forma de pagamento */}
          {ehSaida && (
            <div className="ml-field">
              <label className="ml-label">Forma de Pagamento</label>
              <div className="ml-pagamento-tabs">
                {["DINHEIRO","PIX","DEBITO","CREDITO"].map(mp => (
                  <button key={mp}
                    className={`ml-pagamento-tab${form.meio_pagamento === mp ? " ml-pagamento-tab--active" : ""}`}
                    style={form.meio_pagamento === mp ? { color: cor, borderColor: cor, background: `${cor}12` } : {}}
                    onClick={() => handleMeioPagamento(mp)}>
                    {LABEL_PAGAMENTO[mp]}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Cartão */}
          {ehSaida && form.meio_pagamento === "CREDITO" && (
            <div className="ml-field">
              <label className="ml-label">Cartão</label>
              {cartoes.length === 0 ? (
                <p className="ml-sem-cartao">Nenhum cartão cadastrado. Adicione um em Perfil.</p>
              ) : (
                <CustomSelect
                  value={form.id_cartao}
                  onChange={v => { handle("id_cartao", v); setParcelar(false); }}
                  options={[
                    { value: "", label: "Selecione um cartão" },
                    ...cartoes.map(c => ({
                      value: c.id_cartao,
                      label: `${c.nome} — ${c.tipo === "CREDITO" ? "Crédito" : "Déb./Créd."}`,
                    })),
                  ]}
                  placeholder="Selecione um cartão"
                  accentColor={cor}
                  style={{ borderColor: `${cor}44` }}
                />
              )}
            </div>
          )}

          {/* Parcelamento */}
          {ehSaida && form.meio_pagamento === "CREDITO" && form.id_cartao && (
            <div className="ml-field">
              <div className="ml-parcelar-row">
                <label className="ml-label">Parcelar?</label>
                <button
                  className={`ml-toggle-parcelar${parcelar ? " ml-toggle-parcelar--on" : ""}`}
                  onClick={() => { setParcelar(p => !p); setParcelas(2); setTemJuros(false); }}>
                  {parcelar ? "Sim" : "Não"}
                </button>
              </div>

              {parcelar && (
                <div className="ml-parcelas-wrap">
                  <div className="ml-field-group ml-field-group--2">
                    <div className="ml-field">
                      <label className="ml-label">Nº de Parcelas</label>
                      <input className="ml-input" type="number" min="2" max="36"
                        value={parcelas}
                        onChange={e => setParcelas(Math.max(2, Math.min(36, parseInt(e.target.value) || 2)))}
                        style={{ borderColor: `${cor}44` }} />
                    </div>
                    {pmt !== null && (
                      <div className="ml-field">
                        <label className="ml-label">Valor por Parcela</label>
                        <div className="ml-pmt-preview">
                          <span className="ml-pmt-preview__valor" style={{ color: cor }}>{formatBRL(pmt)}</span>
                          {temJuros && (
                            <span className="ml-pmt-preview__total">total {formatBRL(Math.round(pmt * parcelas * 100) / 100)}</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  <label className="ml-juros-check">
                    <input type="checkbox" checked={temJuros} onChange={e => setTemJuros(e.target.checked)} />
                    <span>Compra com juros <span className="ml-juros-taxa">({TAXA_JUROS_PADRAO}% a.m.)</span></span>
                  </label>
                </div>
              )}
            </div>
          )}

          {/* Descrição */}
          <div className="ml-field">
            <label className="ml-label">Descrição (opcional)</label>
            <input className="ml-input" type="text" placeholder="Ex: Conta de luz de janeiro..."
              value={form.descricao} onChange={e => handle("descricao", e.target.value)}
              style={{ borderColor: `${cor}44` }} />
          </div>
        </div>

        {erro && <div className="ml-erro">{erro}</div>}

        <div className="ml-actions">
          <button className="ml-btn-cancel" onClick={onClose}>Cancelar</button>
          <button className="ml-btn-save"
            style={{ background: `${cor}22`, border: `1px solid ${cor}88`, color: cor }}
            onClick={handleSubmit} disabled={saving}>
            {saving ? "Salvando..." : parcelar ? `Salvar ${parcelas}x` : "Salvar Lançamento"}
          </button>
        </div>
      </div>
    </div>
  );
}
