const CategoriaModel = require('../models/categoria.model');

async function criar(req, res) {
  const { nome, tipo, id_user } = req.body;

  if (!nome || !tipo || !id_user) {
    return res.status(400).json({ erro: 'Dados obrigatórios' });
  }

  const { rows } = await CategoriaModel.criar({ nome, tipo, id_user });
  res.status(201).json(rows[0]);
}

async function listar(req, res) {
  const { rows } = await CategoriaModel.listar();
  res.json(rows);
}

async function atualizar(req, res) {
  const { id } = req.params;
  const { nome, tipo } = req.body;

  await CategoriaModel.atualizar(id, { nome, tipo });
  res.json({ mensagem: 'Atualizado com sucesso' });
}

async function remover(req, res) {
  const { id } = req.params;
  await CategoriaModel.remover(id);
  res.json({ mensagem: 'Removido com sucesso' });
}

module.exports = {
  criar,
  listar,
  atualizar,
  remover
};
