import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DatePicker from "../../assets/DatePicker";
import CustomSelect from "../../assets/CustomSelect";
import "./perfil.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:3333";
const getToken    = () => sessionStorage.getItem("token");
const authHeaders = () => ({
  "Content-Type": "application/json",
  "Authorization": `Bearer ${getToken()}`,
});

const BANKS = [
  { id: "nubank",   name: "Nubank",          abbr: "N",  color: "#820AD1" },
  { id: "itau",     name: "Itaú",            abbr: "I",  color: "#EC7000" },
  { id: "bradesco", name: "Bradesco",        abbr: "B",  color: "#CC092F" },
  { id: "caixa",    name: "Caixa Econômica", abbr: "C",  color: "#006BB8" },
  { id: "bb",       name: "Banco do Brasil", abbr: "BB", color: "#F9D100" },
];

const EMPTY_CARTAO = {
  nome:             "",
  tipo:             "CREDITO",
  limite:           "",
  data_fechamento:  "",
  data_vencimento:  "",
};

// ── Modal base reutilizável ───────────────────────────────────────────────────
function ModalConta({ titulo, onClose, onSubmit, submitLabel = "Salvar", submitDisabled, saving, erro, sucesso, children }) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div className="perfil-modal-overlay" onClick={onClose}>
      <div className="perfil-modal-box" onClick={e => e.stopPropagation()}>
        <div className="perfil-modal-header">
          <h2 className="perfil-modal-title">{titulo}</h2>
          <button className="perfil-modal-close" onClick={onClose}>✕</button>
        </div>
        {children}
        {erro   && <div className="perfil-modal-erro">{erro}</div>}
        {sucesso && <div className="perfil-modal-sucesso">{sucesso}</div>}
        <div className="perfil-modal-actions">
          <button className="perfil-modal-btn-cancel" onClick={onClose}>Cancelar</button>
          <button className="perfil-modal-btn-save" onClick={onSubmit} disabled={saving || !!sucesso || submitDisabled}>
            {saving ? "Salvando..." : submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Requisitos de senha forte ─────────────────────────────────────────────────
const REGRAS_SENHA = [
  { chave: "tamanho",  label: "9 a 15 caracteres",                    test: s => s.length >= 9 && s.length <= 15 },
  { chave: "maiusc",   label: "Letras maiúsculas e minúsculas",       test: s => /[a-z]/.test(s) && /[A-Z]/.test(s) },
  { chave: "numEsp",   label: "Número ou caractere especial",         test: s => /[0-9]/.test(s) || /[^A-Za-z0-9]/.test(s) },
];
const senhaAtendeRegras = (s) => REGRAS_SENHA.every(r => r.test(s));

function RequisitosSenha({ senha }) {
  return (
    <div className="perfil-senha-requisitos">
      <span className="perfil-senha-requisitos__title">Sua nova senha deve ter:</span>
      <ul className="perfil-senha-requisitos__lista">
        {REGRAS_SENHA.map(r => {
          const ok = r.test(senha);
          return (
            <li key={r.chave} className={ok ? "ok" : ""}>
              <span className="perfil-senha-requisitos__check">{ok ? "✓" : "○"}</span>
              {r.label}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ── Modal alterar nome ────────────────────────────────────────────────────────
function ModalAlterarNome({ nomeAtual, onClose, onSaved }) {
  const [nome,   setNome]   = useState(nomeAtual);
  const [saving, setSaving] = useState(false);
  const [erro,   setErro]   = useState(null);
  const [sucesso,setSucesso]= useState(null);

  const handleSubmit = async () => {
    if (!nome.trim()) { setErro("Informe um nome."); return; }
    setSaving(true); setErro(null);
    try {
      const r = await fetch(`${API}/usuarios/me/nome`, {
        method: "PATCH", headers: authHeaders(),
        body: JSON.stringify({ nome }),
      });
      if (!r.ok) {
        const data = await r.json().catch(() => ({}));
        setErro(data.erro || `Erro ${r.status} ao salvar.`); return;
      }
      const data = await r.json();
      sessionStorage.setItem("nome", data.nome);
      onSaved(data.nome);
    } catch { setErro("Servidor inacessível. Verifique se o backend está rodando."); }
    finally { setSaving(false); }
  };

  return (
    <ModalConta titulo="Alterar nome" onClose={onClose} onSubmit={handleSubmit}
      saving={saving} erro={erro} sucesso={sucesso}>
      <div className="perfil-modal-field">
        <label className="perfil-modal-label">Novo nome</label>
        <input className="perfil-modal-input" type="text" value={nome}
          onChange={e => { setNome(e.target.value); setErro(null); }}
          placeholder="Seu nome completo" autoFocus />
      </div>
    </ModalConta>
  );
}

// ── Modal alterar e-mail ──────────────────────────────────────────────────────
function ModalAlterarEmail({ emailAtual, onClose, onSaved }) {
  const [email,  setEmail]  = useState(emailAtual);
  const [saving, setSaving] = useState(false);
  const [erro,   setErro]   = useState(null);
  const [sucesso,setSucesso]= useState(null);

  const handleSubmit = async () => {
    if (!email.trim() || !email.includes("@")) { setErro("Informe um e-mail válido."); return; }
    setSaving(true); setErro(null);
    try {
      const r = await fetch(`${API}/usuarios/me/email`, {
        method: "PATCH", headers: authHeaders(),
        body: JSON.stringify({ email }),
      });
      if (!r.ok) {
        const data = await r.json().catch(() => ({}));
        setErro(data.erro || `Erro ${r.status} ao salvar.`); return;
      }
      const data = await r.json();
      sessionStorage.setItem("email", data.email);
      onSaved(data.email);
    } catch { setErro("Servidor inacessível. Verifique se o backend está rodando."); }
    finally { setSaving(false); }
  };

  return (
    <ModalConta titulo="Alterar e-mail" onClose={onClose} onSubmit={handleSubmit}
      saving={saving} erro={erro} sucesso={sucesso}>
      <div className="perfil-modal-field">
        <label className="perfil-modal-label">Novo e-mail</label>
        <input className="perfil-modal-input" type="email" value={email}
          onChange={e => { setEmail(e.target.value); setErro(null); }}
          placeholder="seu@email.com" autoFocus />
      </div>
    </ModalConta>
  );
}

// ── Modal alterar senha (2 etapas: confirma atual → define nova) ─────────────
function ModalAlterarSenha({ onClose }) {
  const [etapa,      setEtapa]      = useState(1);
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha,  setNovaSenha]  = useState("");
  const [confirmar,  setConfirmar]  = useState("");
  const [saving,     setSaving]     = useState(false);
  const [erro,       setErro]       = useState(null);
  const [sucesso,    setSucesso]    = useState(null);

  const handleVerificar = async () => {
    if (!senhaAtual) { setErro("Informe a senha atual."); return; }
    setSaving(true); setErro(null);
    try {
      const r = await fetch(`${API}/usuarios/verificar-senha`, {
        method: "POST", headers: authHeaders(),
        body: JSON.stringify({ password: senhaAtual }),
      });
      if (!r.ok) {
        const data = await r.json().catch(() => ({}));
        setErro(data.erro || "Senha atual incorreta."); return;
      }
      setEtapa(2);
    } catch { setErro("Servidor inacessível. Verifique se o backend está rodando."); }
    finally { setSaving(false); }
  };

  const handleSalvar = async () => {
    if (!senhaAtendeRegras(novaSenha)) { setErro("A nova senha não atende aos requisitos abaixo."); return; }
    if (novaSenha !== confirmar) { setErro("As senhas não coincidem."); return; }
    setSaving(true); setErro(null);
    try {
      const r = await fetch(`${API}/usuarios/me/senha`, {
        method: "PATCH", headers: authHeaders(),
        body: JSON.stringify({ senhaAtual, novaSenha }),
      });
      if (!r.ok) {
        const data = await r.json().catch(() => ({}));
        setErro(data.erro || `Erro ${r.status} ao salvar.`); return;
      }
      setSucesso("Senha alterada com sucesso!");
    } catch { setErro("Servidor inacessível. Verifique se o backend está rodando."); }
    finally { setSaving(false); }
  };

  if (etapa === 1) {
    return (
      <ModalConta titulo="Confirme sua senha atual" onClose={onClose} onSubmit={handleVerificar}
        submitLabel="Continuar" saving={saving} erro={erro} sucesso={sucesso}>
        <div className="perfil-modal-field">
          <label className="perfil-modal-label">Senha atual</label>
          <input className="perfil-modal-input" type="password" value={senhaAtual}
            onChange={e => { setSenhaAtual(e.target.value); setErro(null); }}
            onKeyDown={e => e.key === "Enter" && handleVerificar()}
            placeholder="••••••••" autoFocus />
        </div>
      </ModalConta>
    );
  }

  return (
    <ModalConta titulo="Criar nova senha" onClose={onClose} onSubmit={handleSalvar}
      submitLabel="Salvar" submitDisabled={!senhaAtendeRegras(novaSenha) || novaSenha !== confirmar}
      saving={saving} erro={erro} sucesso={sucesso}>
      <button type="button" className="perfil-modal-voltar"
        onClick={() => { setEtapa(1); setErro(null); }}>
        ‹ Voltar
      </button>
      <div className="perfil-modal-field">
        <label className="perfil-modal-label">Nova senha</label>
        <input className="perfil-modal-input" type="password" value={novaSenha}
          onChange={e => { setNovaSenha(e.target.value); setErro(null); }}
          placeholder="Crie uma senha forte" autoFocus />
      </div>
      <RequisitosSenha senha={novaSenha} />
      <div className="perfil-modal-field">
        <label className="perfil-modal-label">Confirmar nova senha</label>
        <input className="perfil-modal-input" type="password" value={confirmar}
          onChange={e => { setConfirmar(e.target.value); setErro(null); }}
          placeholder="Repita a nova senha" />
      </div>
    </ModalConta>
  );
}

function MenuItem({ icon, label, danger, onClick }) {
  return (
    <button
      className={`perfil-item${danger ? " perfil-item--danger" : ""}`}
      onClick={onClick}
    >
      <span className="perfil-item__icon">{icon}</span>
      <span className="perfil-item__label">{label}</span>
      <span className="perfil-item__arrow">›</span>
    </button>
  );
}

function BankItem({ bank, connected, onToggle }) {
  return (
    <div className={`bank-item${connected ? " bank-item--on" : ""}`}>
      <div className="bank-item__left">
        <div
          className="bank-item__logo"
          style={{
            background: `${bank.color}18`,
            border: `1px solid ${bank.color}44`,
            color: bank.color,
            boxShadow: connected ? `0 0 10px ${bank.color}55` : "none",
          }}
        >
          {bank.abbr}
        </div>
        <div className="bank-item__info">
          <span className="bank-item__name">{bank.name}</span>
          <span className="bank-item__status" style={{ color: connected ? bank.color : "#555" }}>
            {connected ? "Conectado" : "Não vinculado"}
          </span>
        </div>
      </div>
      <button
        className={`bank-item__btn${connected ? " bank-item__btn--on" : ""}`}
        style={
          connected
            ? { color: "#ff4d4d", borderColor: "#ff4d4d44", background: "#ff4d4d10" }
            : { color: bank.color, borderColor: `${bank.color}44`, background: `${bank.color}10` }
        }
        onClick={() => onToggle(bank.id)}
      >
        {connected ? "Desvincular" : "Vincular"}
      </button>
    </div>
  );
}

export default function Perfil() {
  const navigate = useNavigate();
  const [nomePerfil,  setNomePerfil]  = useState(sessionStorage.getItem("nome")  || "Usuário");
  const [emailPerfil, setEmailPerfil] = useState(sessionStorage.getItem("email") || "—");
  const inicial = nomePerfil.charAt(0).toUpperCase();

  const [modalNome,  setModalNome]  = useState(false);
  const [modalEmail, setModalEmail] = useState(false);
  const [modalSenha, setModalSenha] = useState(false);

  const [bancos, setBancos] = useState({
    nubank: false, itau: false, bradesco: false, caixa: false, bb: false,
  });

  const [cartoes,       setCartoes]       = useState([]);
  const [formCartao,    setFormCartao]    = useState(EMPTY_CARTAO);
  const [adicionando,   setAdicionando]   = useState(false);
  const [salvandoCart,  setSalvandoCart]  = useState(false);
  const [erroCartao,    setErroCartao]    = useState(null);

  const toggleBanco = (id) => setBancos((prev) => ({ ...prev, [id]: !prev[id] }));

  const handleLogout = () => {
    sessionStorage.clear();
    navigate("/", { replace: true });
  };

  const conectados = Object.values(bancos).filter(Boolean).length;

  // ── Cartões ──────────────────────────────────────────────────────────────
  const carregarCartoes = async () => {
    try {
      const r = await fetch(`${API}/cartoes`, { headers: authHeaders() });
      if (r.ok) setCartoes(await r.json());
    } catch { }
  };

  useEffect(() => {
    if (!getToken()) { navigate("/", { replace: true }); return; }
    carregarCartoes();
  }, []);

  const handleCartaoField = (field, val) => setFormCartao(f => ({ ...f, [field]: val }));

  const salvarCartao = async () => {
    const { nome: nomeC, tipo, data_fechamento, data_vencimento } = formCartao;
    if (!nomeC.trim())       { setErroCartao("Informe o nome do cartão."); return; }
    if (!data_fechamento)    { setErroCartao("Informe a data de fechamento."); return; }
    if (!data_vencimento)    { setErroCartao("Informe a data de vencimento."); return; }

    setSalvandoCart(true); setErroCartao(null);
    try {
      const r = await fetch(`${API}/cartoes`, {
        method:  "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          nome:             nomeC.trim(),
          tipo,
          limite:           formCartao.limite ? parseFloat(formCartao.limite) : null,
          data_fechamento,
          data_vencimento,
        }),
      });
      if (!r.ok) throw new Error("erro");
      await carregarCartoes();
      setFormCartao(EMPTY_CARTAO);
      setAdicionando(false);
    } catch { setErroCartao("Erro ao salvar cartão. Tente novamente."); }
    finally  { setSalvandoCart(false); }
  };

  const removerCartao = async (id) => {
    try {
      await fetch(`${API}/cartoes/${id}`, { method: "DELETE", headers: authHeaders() });
      setCartoes(c => c.filter(x => x.id_cartao !== id));
    } catch { }
  };

  return (
    <div className="perfil-page">

      {modalNome && (
        <ModalAlterarNome
          nomeAtual={nomePerfil}
          onClose={() => setModalNome(false)}
          onSaved={n => { setNomePerfil(n); setModalNome(false); }}
        />
      )}
      {modalEmail && (
        <ModalAlterarEmail
          emailAtual={emailPerfil}
          onClose={() => setModalEmail(false)}
          onSaved={e => { setEmailPerfil(e); setModalEmail(false); }}
        />
      )}
      {modalSenha && (
        <ModalAlterarSenha onClose={() => setModalSenha(false)} />
      )}

      {/* Cabeçalho */}
      <div className="perfil-header">
        <div className="perfil-avatar">
          <span className="perfil-avatar__inicial">{inicial}</span>
        </div>
        <div className="perfil-header__info">
          <span className="perfil-header__nome">{nomePerfil}</span>
          <span className="perfil-header__email">{emailPerfil}</span>
        </div>
      </div>

      <div className="perfil-grid">

        {/* Coluna esquerda */}
        <div className="perfil-col">

          {/* Meus Cartões */}
          <div className="perfil-section">
            <div className="perfil-section__header">
              <span className="perfil-section__title">Meus Cartões</span>
              {cartoes.length > 0 && (
                <span className="perfil-section__badge">{cartoes.length} cartão{cartoes.length !== 1 ? "s" : ""}</span>
              )}
            </div>
            <p className="perfil-section__desc">
              Cadastre seus cartões de crédito para habilitar o parcelamento nos lançamentos.
            </p>

            <div className="perfil-card">
              {cartoes.length === 0 && !adicionando && (
                <div className="cartao-vazio">Nenhum cartão cadastrado ainda.</div>
              )}

              {cartoes.map((c, i) => (
                <div key={c.id_cartao}>
                  <div className="cartao-item">
                    <div className="cartao-item__info">
                      <span className="cartao-item__nome">{c.nome}</span>
                      <span className="cartao-item__detalhe">
                        {c.tipo === "CREDITO" ? "Crédito" : "Déb./Créd."}
                        {" · "}Fecha {new Date(c.data_fechamento).toLocaleDateString("pt-BR")}
                        {" · "}Vence {new Date(c.data_vencimento).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                    <button className="cartao-item__remover" onClick={() => removerCartao(c.id_cartao)}>
                      ✕
                    </button>
                  </div>
                  {(i < cartoes.length - 1 || adicionando) && <div className="perfil-divider" />}
                </div>
              ))}

              {/* Formulário inline */}
              {adicionando && (
                <div className="cartao-form">
                  <div className="cartao-form__row">
                    <div className="cartao-form__field">
                      <label className="cartao-form__label">Nome do Cartão</label>
                      <input className="cartao-form__input" type="text" placeholder="Ex: Nubank"
                        value={formCartao.nome} onChange={(e) => handleCartaoField("nome", e.target.value)} />
                    </div>
                    <div className="cartao-form__field">
                      <label className="cartao-form__label">Tipo</label>
                      <CustomSelect
                        value={formCartao.tipo}
                        onChange={v => handleCartaoField("tipo", v)}
                        options={[
                          { value: "CREDITO",        label: "Crédito" },
                          { value: "DEBITO_CREDITO", label: "Débito / Crédito" },
                        ]}
                        className="cartao-form__input"
                      />
                    </div>
                  </div>
                  <div className="cartao-form__row">
                    <div className="cartao-form__field">
                      <label className="cartao-form__label">Data de Fechamento</label>
                      <DatePicker
                        value={formCartao.data_fechamento}
                        onChange={v => handleCartaoField("data_fechamento", v)}
                      />
                    </div>
                    <div className="cartao-form__field">
                      <label className="cartao-form__label">Data de Vencimento</label>
                      <DatePicker
                        value={formCartao.data_vencimento}
                        onChange={v => handleCartaoField("data_vencimento", v)}
                      />
                    </div>
                  </div>
                  <div className="cartao-form__row">
                    <div className="cartao-form__field">
                      <label className="cartao-form__label">Limite (opcional)</label>
                      <input className="cartao-form__input" type="number" placeholder="R$ 0,00"
                        min="0"
                        value={formCartao.limite} onChange={(e) => handleCartaoField("limite", e.target.value)} />
                    </div>
                  </div>

                  {erroCartao && <p className="cartao-form__erro">{erroCartao}</p>}

                  <div className="cartao-form__actions">
                    <button className="cartao-form__btn-cancel"
                      onClick={() => { setAdicionando(false); setFormCartao(EMPTY_CARTAO); setErroCartao(null); }}>
                      Cancelar
                    </button>
                    <button className="cartao-form__btn-save" onClick={salvarCartao} disabled={salvandoCart}>
                      {salvandoCart ? "Salvando..." : "Salvar Cartão"}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {!adicionando && (
              <button className="btn-add-cartao" onClick={() => setAdicionando(true)}>
                + Adicionar cartão
              </button>
            )}
          </div>

          {/* Vinculação Bancária */}
          <div className="perfil-section">
            <div className="perfil-section__header">
              <span className="perfil-section__title">Vinculação Bancária</span>
              {conectados > 0 && (
                <span className="perfil-section__badge">
                  {conectados} vinculado{conectados !== 1 ? "s" : ""}
                </span>
              )}
            </div>
            <p className="perfil-section__desc">
              Gerencie a conexão da aplicação com suas contas bancárias.
            </p>
            <div className="perfil-card">
              {BANKS.map((bank, i) => (
                <div key={bank.id}>
                  <BankItem bank={bank} connected={bancos[bank.id]} onToggle={toggleBanco} />
                  {i < BANKS.length - 1 && <div className="perfil-divider" />}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Coluna direita */}
        <div className="perfil-col">

          <div className="perfil-section">
            <span className="perfil-section__title">Conta</span>
            <div className="perfil-card">
              <MenuItem icon="◉" label="Alterar nome"   onClick={() => setModalNome(true)} />
              <div className="perfil-divider" />
              <MenuItem icon="◎" label="Alterar e-mail" onClick={() => setModalEmail(true)} />
              <div className="perfil-divider" />
              <MenuItem icon="⬡" label="Alterar senha"  onClick={() => setModalSenha(true)} />
            </div>
          </div>

          <div className="perfil-section">
            <span className="perfil-section__title">Preferências</span>
            <div className="perfil-card">
              <MenuItem icon="◈" label="Moeda padrão" />
              <div className="perfil-divider" />
              <MenuItem icon="↺" label="Mês de referência" />
            </div>
          </div>

          <div className="perfil-section">
            <span className="perfil-section__title">Dados</span>
            <div className="perfil-card">
              <MenuItem icon="↑" label="Exportar histórico (CSV)" />
              <div className="perfil-divider" />
              <MenuItem icon="✕" label="Limpar todos os dados" danger />
            </div>
          </div>

          <div className="perfil-section">
            <span className="perfil-section__title">Sobre</span>
            <div className="perfil-card">
              <MenuItem icon="◈" label="Versão do app" />
              <div className="perfil-divider" />
              <MenuItem icon="◉" label="Créditos" />
            </div>
          </div>

          <button className="perfil-logout" onClick={handleLogout}>
            Sair da conta
          </button>

        </div>
      </div>

    </div>
  );
}
