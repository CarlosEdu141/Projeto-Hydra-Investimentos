import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useRef, useEffect } from "react";
import "./navbar.css";

export default function Navbar() {
  const navigate     = useNavigate();
  const location     = useLocation();
  const nome         = sessionStorage.getItem("nome") || "Usuário";
  const navRef       = useRef(null);
  const indicatorRef = useRef(null);
  const primeiroNome = nome.split(" ")[0];
  const inicial      = nome.charAt(0).toUpperCase();

  const handleLogout = () => {
    sessionStorage.clear();
    navigate("/", { replace: true });
  };

  // Dispara evento global — Home e Histórico escutam e abrem seus modais
  const handleFab = () => {
    window.dispatchEvent(new CustomEvent("openLancamentoModal"));
  };

  useEffect(() => {
    const nav = navRef.current;
    const indicator = indicatorRef.current;
    if (!nav || !indicator) return;

    const activeItem = nav.querySelector(".bottom-nav__item--active");
    if (activeItem) {
      const navRect  = nav.getBoundingClientRect();
      const itemRect = activeItem.getBoundingClientRect();
      indicator.style.left    = `${itemRect.left - navRect.left}px`;
      indicator.style.width   = `${itemRect.width}px`;
      indicator.style.opacity = "1";
    } else {
      indicator.style.opacity = "0";
    }
  }, [location.pathname]);

  const links = [
    { to: "/home",          label: "Home",          icon: "⬡" },
    { to: "/historico",     label: "Histórico",     icon: "↺" },
    { to: "/investimentos", label: "Investimentos", icon: "◈" },
  ];

  return (
    <>
      {/* ── Navbar desktop ── */}
      <nav className="navbar">
        <div className="navbar__brand">
          <img src="/img/LogoHydra.png" alt="Hydra" className="navbar__brand-logo" />
          <span className="navbar__brand-name">
            <strong>HYDRA</strong> Finanças
          </span>
        </div>

        <div className="navbar__links d-none d-md-flex">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to}
              className={({ isActive }) =>
                `navbar__link${isActive ? " navbar__link--active" : ""}`
              }
            >
              <span className="navbar__link-icon">{l.icon}</span>
              {l.label}
            </NavLink>
          ))}
        </div>

        <div className="navbar__user d-none d-md-flex">
          <NavLink
            to="/perfil"
            className={({ isActive }) =>
              `navbar__user-link${isActive ? " navbar__user-link--active" : ""}`
            }
          >
            <div className="navbar__avatar">{inicial}</div>
            <span className="navbar__user-name">
              Olá, <strong>{primeiroNome}</strong>
            </span>
          </NavLink>
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

      {/* ── Bottom nav mobile ── */}
      <nav className="bottom-nav d-flex d-md-none" ref={navRef}>
        <div className="bottom-nav__indicator" ref={indicatorRef} />
        {/* Link Home */}
        <NavLink to="/home"
          className={({ isActive }) =>
            `bottom-nav__item${isActive ? " bottom-nav__item--active" : ""}`
          }
        >
          <span className="bottom-nav__icon">⬡</span>
          <span className="bottom-nav__label">Home</span>
        </NavLink>

        {/* Link Histórico */}
        <NavLink to="/historico"
          className={({ isActive }) =>
            `bottom-nav__item${isActive ? " bottom-nav__item--active" : ""}`
          }
        >
          <span className="bottom-nav__icon">↺</span>
          <span className="bottom-nav__label">Histórico</span>
        </NavLink>

        {/* FAB centralizado */}
        <div className="bottom-nav__fab-wrap">
          <button className="bottom-nav__fab" onClick={handleFab} aria-label="Novo lançamento">
            +
          </button>
        </div>

        {/* Link Investimentos */}
        <NavLink to="/investimentos"
          className={({ isActive }) =>
            `bottom-nav__item${isActive ? " bottom-nav__item--active" : ""}`
          }
        >
          <span className="bottom-nav__icon">◈</span>
          <span className="bottom-nav__label">Investimentos</span>
        </NavLink>

        {/* Link Perfil */}
        <NavLink to="/perfil"
          className={({ isActive }) =>
            `bottom-nav__item${isActive ? " bottom-nav__item--active" : ""}`
          }
        >
          <span className="bottom-nav__icon">◉</span>
          <span className="bottom-nav__label">Perfil</span>
        </NavLink>
      </nav>
    </>
  );
}