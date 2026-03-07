import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./login.css";

export default function Auth() {

  const navigate = useNavigate();

  const [mode, setMode] = useState("login");

  const [form, setForm] = useState({
    nome: "",
    cpf: "",
    nascimento: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  const [loginStatus, setLoginStatus] = useState("idle");
  // idle | success | error

  const API = "http://localhost:3333/usuarios";

  // formata CPF
  const formatCPF = (value) => {
    value = value.replace(/\D/g, "");
    value = value.replace(/(\d{3})(\d)/, "$1.$2");
    value = value.replace(/(\d{3})(\d)/, "$1.$2");
    value = value.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    return value;
  };

  const handleChange = (e) => {

    const { name, value } = e.target;

    if (name === "cpf") {
      setForm({
        ...form,
        cpf: formatCPF(value)
      });
      return;
    }

    setForm({
      ...form,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {

    e.preventDefault();

    // LOGIN
    if (mode === "login") {

      try {

        const response = await fetch(`${API}/login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            email: form.email,
            password: form.password
          })
        });

        const data = await response.json();

        if (!response.ok) {
          setLoginStatus("error");
          alert(data.mensagem || "Erro no login");

          setTimeout(() => setLoginStatus("idle"), 2000);
          return;
        }

        setLoginStatus("success");

        console.log("Usuário logado:", data.usuario);

        setTimeout(() => {
          
          navigate("/home");

        }, 1000);

      } catch (erro) {

        console.error(erro);
        setLoginStatus("error");
        alert("Erro ao conectar com servidor");

        setTimeout(() => setLoginStatus("idle"), 2000);

      }

      return;
    }

    // VALIDAÇÃO CADASTRO
    if (form.password !== form.confirmPassword) {
      alert("Senhas não coincidem");
      return;
    }

    // CADASTRO
    try {

      const body = {
        nome: form.nome,
        cpf: form.cpf.replace(/\D/g, ""),
        email: form.email,
        data_nascimento: form.nascimento,
        password: form.password
      };

      console.log("Enviando dados:", body);

      const response = await fetch(API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      console.log("Resposta servidor:", data);

      if (!response.ok) {
        alert(data.mensagem || "Erro ao cadastrar");
        return;
      }

      alert("Usuário cadastrado com sucesso!");

      setForm({
        nome: "",
        cpf: "",
        nascimento: "",
        email: "",
        password: "",
        confirmPassword: ""
      });

      setMode("login");

    } catch (erro) {

      console.error("Erro completo:", erro);

      alert("Erro ao conectar com o servidor");

    }

  };

  return (

    <div className="login-container">

      <div className="login-card">

        <div className="auth-tabs">

          <button
            type="button"
            className={mode === "login" ? "active" : ""}
            onClick={() => setMode("login")}
          >
            Login
          </button>

          <button
            type="button"
            className={mode === "register" ? "active" : ""}
            onClick={() => setMode("register")}
          >
            Cadastro
          </button>

        </div>

        <form onSubmit={handleSubmit} key={mode} className="form-container">

          <div className="form-fields">

            {mode === "register" && (
              <>
                <input
                  type="text"
                  name="nome"
                  placeholder="Nome completo"
                  value={form.nome}
                  onChange={handleChange}
                  required
                />

                <input
                  type="text"
                  name="cpf"
                  placeholder="CPF"
                  value={form.cpf}
                  onChange={handleChange}
                  maxLength={14}
                  required
                />

                <input
                  type="date"
                  name="nascimento"
                  value={form.nascimento}
                  onChange={handleChange}
                  required
                />
              </>
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

            <button
              type="submit"
              className={`submit-button 
                ${loginStatus === "success" ? "login-success" : ""}
                ${loginStatus === "error" ? "login-error" : ""}
              `}
            >
              {mode === "login" ? "Entrar" : "Cadastrar"}
            </button>

          </div>

        </form>

      </div>

    </div>

  );

}