const express = require("express");
const cors = require("cors"); // 👈 importa aqui

const categoriaRoutes = require('./routes/categoria.routes');
const usuarioRoutes = require('./routes/usuario.routes');
const pessoaRoutes = require('./routes/pessoa.routes');
const contaRoutes = require('./routes/conta.routes');

const app = express();

app.use(cors()); // 👈 ativa aqui
app.use(express.json());

app.use('/categorias', categoriaRoutes);
app.use('/pessoas', pessoaRoutes);
app.use('/usuarios', usuarioRoutes);
app.use('/contas', contaRoutes);

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

module.exports = app;