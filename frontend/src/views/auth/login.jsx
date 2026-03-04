import React, { useState } from "react";
import "./login.css";

export default function Auth() {
  const [mode, setMode] = useState("login"); // login | register
  const [form, setForm] = useState({
    nome: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (mode === "login") {
      console.log("Fazendo login:", form.email, form.password);
      // chamada para /login
    } else {
      if (form.password !== form.confirmPassword) {
        alert("Senhas não coincidem");
        return;
      }

      console.log("Cadastrando:", form);
      // chamada para /usuarios
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">

        {/* TABS */}
        <div className="auth-tabs">
          <button
            className={mode === "login" ? "active" : ""}
            onClick={() => setMode("login")}
          >
            Login
          </button>

          <button
            className={mode === "register" ? "active" : ""}
            onClick={() => setMode("register")}
          >
            Cadastro
          </button>
        </div>

        <form onSubmit={handleSubmit}>

          {mode === "register" && (
            <input
              type="text"
              name="nome"
              placeholder="Nome completo"
              value={form.nome}
              onChange={handleChange}
              required
            />
          )}

          <input
            type="email"
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            required
          />

          <input
            type="password"
            name="password"
            placeholder="Senha"
            value={form.password}
            onChange={handleChange}
            required
          />

          {mode === "register" && (
            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirmar senha"
              value={form.confirmPassword}
              onChange={handleChange}
              required
            />
          )}

          <button type="submit" className="submit-button">
            {mode === "login" ? "Entrar" : "Cadastrar"}
          </button>

        </form>

      </div>
    </div>
  );
}