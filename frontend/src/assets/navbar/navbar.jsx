import { NavLink, useNavigate } from "react-router-dom";
import "./navbar.css";

export default function Navbar() {
  const navigate     = useNavigate();
  const nome         = sessionStorage.getItem("nome") || "Usuário";
  const primeiroNome = nome.split(" ")[0];

  const handleLogout = () => {
    sessionStorage.clear();
    navigate("/", { replace: true });
  };

  const links = [
    { to: "/home",          label: "Home",          icon: "⬡" },
    { to: "/historico",     label: "Histórico",     icon: "↺" },
    { to: "/investimentos", label: "Investimentos", icon: "◈" },
  ];

  return (
    <nav className="navbar">
      {/* ── Logo ── */}
      <div className="navbar__brand">
        <span className="navbar__brand-icon">₿</span>
        <span className="navbar__brand-name">
          Arquiteto<strong>Financeiro</strong>
        </span>
      </div>

      {/* ── Links ── */}
      <div className="navbar__links">
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            className={({ isActive }) =>
              `navbar__link${isActive ? " navbar__link--active" : ""}`
            }
          >
            <span className="navbar__link-icon">{l.icon}</span>
            {l.label}
          </NavLink>
        ))}
      </div>

      {/* ── Usuário + Sair ── */}
      <div className="navbar__user">
        <span className="navbar__user-name">
          Olá, <strong>{primeiroNome}</strong>
        </span>
        <button
          className="navbar__logout"
          onClick={handleLogout}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#ff4d4d"; e.currentTarget.style.color = "#ff4d4d"; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#444"; e.currentTarget.style.color = "#888"; }}
        >
          Sair
        </button>
      </div>
    </nav>
  );
}