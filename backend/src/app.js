const express = require("express");
const cors = require("cors");

const categoriaRoutes   = require('./routes/categoria.routes');
const usuarioRoutes     = require('./routes/usuario.routes');
const pessoaRoutes      = require('./routes/pessoa.routes');
const contaRoutes       = require('./routes/conta.routes');
const lancamentoRoutes  = require('./routes/lancamento.routes');

const app = express();

app.use(cors());
app.use(express.json());

/* ROTAS */
app.use('/categorias',  categoriaRoutes);
app.use('/pessoas',     pessoaRoutes);
app.use('/usuarios',    usuarioRoutes);
app.use('/contas',      contaRoutes);
app.use('/lancamentos', lancamentoRoutes);

/* HEALTH CHECK */
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

module.exports = app;