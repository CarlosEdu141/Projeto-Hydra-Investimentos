const pessoaModel = require('../models/pessoa.model');

async function criar(req, res) {
  try {
    const resultado = await pessoaModel.criar(req.body);
    res.status(201).json(resultado.rows[0]);
  } catch (erro) {
    res.status(500).json({ erro: erro.message });
  }
}

async function listar(req, res) {
  try {
    const resultado = await pessoaModel.listar();
    res.json(resultado.rows);
  } catch (erro) {
    res.status(500).json({ erro: erro.message });
  }
}

async function buscarPorId(req, res) {
  try {
    const { id } = req.params;
    const resultado = await pessoaModel.buscarPorId(id);

    if (resultado.rows.length === 0) {
      return res.status(404).json({ mensagem: "Pessoa não encontrada" });
    }

    res.json(resultado.rows[0]);
  } catch (erro) {
    res.status(500).json({ erro: erro.message });
  }
}

async function atualizar(req, res) {
  try {
    const { id } = req.params;
    const resultado = await pessoaModel.atualizar(id, req.body);

    if (resultado.rowCount === 0) {
      return res.status(404).json({ mensagem: "Pessoa não encontrada" });
    }

    res.json(resultado.rows[0]);
  } catch (erro) {
    res.status(500).json({ erro: erro.message });
  }
}

async function remover(req, res) {
  try {
    const { id } = req.params;
    const resultado = await pessoaModel.remover(id);

    if (resultado.rowCount === 0) {
      return res.status(404).json({ mensagem: "Pessoa não encontrada" });
    }

    res.json({ mensagem: "Pessoa removida com sucesso" });
  } catch (erro) {
    res.status(500).json({ erro: erro.message });
  }
}

module.exports = {
  criar,
  listar,
  buscarPorId,
  atualizar,
  remover
};