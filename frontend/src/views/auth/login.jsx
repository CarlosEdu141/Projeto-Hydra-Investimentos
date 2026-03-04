import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./login.css";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [erro, setErro] = useState(null);
  const [status, setStatus] = useState("default"); 
  // default | success | error

  const handleLogin = async (e) => {
    e.preventDefault();
    setErro(null);
    setStatus("default");

    try {
      const response = await fetch("http://localhost:3333/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        setStatus("error");
        throw new Error("Credenciais inválidas");
      }

      const data = await response.json();

      console.log("Login sucesso:", data);

      setStatus("success");

      // opcional: limpar campos
      // setEmail("");
      // setPassword("");

    } catch (err) {
      setErro("Email ou senha inválidos");
      setStatus("error");
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2 className="logo-text">Arquiteto Financeiro</h2>

        <form onSubmit={handleLogin}>
          <input
            type="email"
            className="login-input"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            className="login-input"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {erro && <div className="login-error">{erro}</div>}

          <div className="login-actions">
            <button
              type="button"
              className="register-button"
            >
              Criar uma conta
            </button>

            <button
              type="submit"
              className={`login-button ${
                status === "success"
                  ? "login-success"
                  : status === "error"
                  ? "login-failed"
                  : ""
              }`}
            >
              LOGIN
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}