import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./perfil.css";

const BANKS = [
  { id: "nubank",   name: "Nubank",          abbr: "N",  color: "#820AD1" },
  { id: "itau",     name: "Itaú",            abbr: "I",  color: "#EC7000" },
  { id: "bradesco", name: "Bradesco",        abbr: "B",  color: "#CC092F" },
  { id: "caixa",    name: "Caixa Econômica", abbr: "C",  color: "#006BB8" },
  { id: "bb",       name: "Banco do Brasil", abbr: "BB", color: "#F9D100" },
];

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
          <span
            className="bank-item__status"
            style={{ color: connected ? bank.color : "#555" }}
          >
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
  const nome   = sessionStorage.getItem("nome")  || "Usuário";
  const email  = sessionStorage.getItem("email") || "—";
  const inicial = nome.charAt(0).toUpperCase();

  const [bancos, setBancos] = useState({
    nubank: false, itau: false, bradesco: false, caixa: false, bb: false,
  });

  const toggleBanco = (id) => setBancos((prev) => ({ ...prev, [id]: !prev[id] }));

  const handleLogout = () => {
    sessionStorage.clear();
    navigate("/", { replace: true });
  };

  const conectados = Object.values(bancos).filter(Boolean).length;

  return (
    <div className="perfil-page">

      {/* ── Cabeçalho ── */}
      <div className="perfil-header">
        <div className="perfil-avatar">
          <span className="perfil-avatar__inicial">{inicial}</span>
        </div>
        <div className="perfil-header__info">
          <span className="perfil-header__nome">{nome}</span>
          <span className="perfil-header__email">{email}</span>
        </div>
      </div>

      {/* ── Grid desktop: coluna esquerda + direita ── */}
      <div className="perfil-grid">

        {/* Coluna esquerda — Vinculação Bancária */}
        <div className="perfil-col">
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

        {/* Coluna direita — demais seções */}
        <div className="perfil-col">

          {/* Conta */}
          <div className="perfil-section">
            <span className="perfil-section__title">Conta</span>
            <div className="perfil-card">
              <MenuItem icon="◉" label="Alterar nome" />
              <div className="perfil-divider" />
              <MenuItem icon="◎" label="Alterar e-mail" />
              <div className="perfil-divider" />
              <MenuItem icon="⬡" label="Alterar senha" />
            </div>
          </div>

          {/* Preferências */}
          <div className="perfil-section">
            <span className="perfil-section__title">Preferências</span>
            <div className="perfil-card">
              <MenuItem icon="◈" label="Moeda padrão" />
              <div className="perfil-divider" />
              <MenuItem icon="↺" label="Mês de referência" />
            </div>
          </div>

          {/* Dados */}
          <div className="perfil-section">
            <span className="perfil-section__title">Dados</span>
            <div className="perfil-card">
              <MenuItem icon="↑" label="Exportar histórico (CSV)" />
              <div className="perfil-divider" />
              <MenuItem icon="✕" label="Limpar todos os dados" danger />
            </div>
          </div>

          {/* Sobre */}
          <div className="perfil-section">
            <span className="perfil-section__title">Sobre</span>
            <div className="perfil-card">
              <MenuItem icon="◈" label="Versão do app" />
              <div className="perfil-divider" />
              <MenuItem icon="◉" label="Créditos" />
            </div>
          </div>

          {/* Logout */}
          <button className="perfil-logout" onClick={handleLogout}>
            Sair da conta
          </button>

        </div>
      </div>

    </div>
  );
}
