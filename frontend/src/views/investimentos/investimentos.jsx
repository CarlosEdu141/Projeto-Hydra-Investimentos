import "./investimentos.css";

export default function Investimentos() {
  return (
    <div className="invest-page">
      <div className="invest-header">
        <h1 className="invest-title">Investimentos</h1>
        <p className="invest-subtitle">Acompanhe sua carteira de investimentos</p>
      </div>

      {/* Em breve */}
      <div className="invest-coming">
        <div className="invest-coming__icon">◈</div>
        <h2 className="invest-coming__title">Em breve</h2>
        <p className="invest-coming__text">
          Esta seção está sendo construída.<br />
          Em breve você poderá registrar e acompanhar seus investimentos aqui.
        </p>
        <div className="invest-coming__tags">
          <span>Renda Fixa</span>
          <span>Renda Variável</span>
          <span>Fundos</span>
          <span>Criptoativos</span>
        </div>
      </div>
    </div>
  );
}