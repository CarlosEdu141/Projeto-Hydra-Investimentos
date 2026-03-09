const CategoriaModel = require('../models/categoria.model');

async function criar(req, res) {
  try {
    const { nome, tipo, id_user } = req.body;

    if (!nome || !tipo || !id_user) {
      return res.status(400).json({ erro: 'Dados obrigatórios: nome, tipo, id_user' });
    }

    const { rows } = await CategoriaModel.criar({ nome, tipo, id_user });
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Erro ao criar categoria:', err);
    res.status(500).json({ erro: 'Erro interno ao criar categoria' });
  }
}

async function listar(req, res) {
  try {
    const { tipo, id_user } = req.query;
    const { rows } = await CategoriaModel.listar({ tipo, id_user });
    res.json(rows);
  } catch (err) {
    console.error('Erro ao listar categorias:', err);
    res.status(500).json({ erro: 'Erro interno ao listar categorias' });
  }
}

async function atualizar(req, res) {
  try {
    const { id } = req.params;
    const { nome, tipo } = req.body;
    await CategoriaModel.atualizar(id, { nome, tipo });
    res.json({ mensagem: 'Atualizado com sucesso' });
  } catch (err) {
    console.error('Erro ao atualizar categoria:', err);
    res.status(500).json({ erro: 'Erro interno ao atualizar categoria' });
  }
}

async function remover(req, res) {
  try {
    const { id } = req.params;
    await CategoriaModel.remover(id);
    res.json({ mensagem: 'Removido com sucesso' });
  } catch (err) {
    console.error('Erro ao remover categoria:', err);
    res.status(500).json({ erro: 'Erro interno ao remover categoria' });
  }
}

module.exports = { criar, listar, atualizar, remover };