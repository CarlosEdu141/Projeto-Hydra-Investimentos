const contaModel = require('../models/conta.model');

async function criar(req, res) {
  try {
    const resultado = await contaModel.criar(req.body);
    res.status(201).json(resultado.rows[0]);
  } catch (erro) {
    res.status(500).json({ erro: erro.message });
  }
}

async function listar(req, res) {
  try {
    const resultado = await contaModel.listar();
    res.json(resultado.rows);
  } catch (erro) {
    res.status(500).json({ erro: erro.message });
  }
}

async function buscarPorId(req, res) {
  try {
    const { id } = req.params;
    const resultado = await contaModel.buscarPorId(id);

    if (resultado.rows.length === 0) {
      return res.status(404).json({ mensagem: "Conta não encontrada" });
    }

    res.json(resultado.rows[0]);
  } catch (erro) {
    res.status(500).json({ erro: erro.message });
  }
}

async function atualizar(req, res) {
  try {
    const { id } = req.params;
    const resultado = await contaModel.atualizar(id, req.body);

    if (resultado.rowCount === 0) {
      return res.status(404).json({ mensagem: "Conta não encontrada" });
    }

    res.json(resultado.rows[0]);
  } catch (erro) {
    res.status(500).json({ erro: erro.message });
  }
}

async function remover(req, res) {
  try {
    const { id } = req.params;
    const resultado = await contaModel.remover(id);

    if (resultado.rowCount === 0) {
      return res.status(404).json({ mensagem: "Conta não encontrada" });
    }

    res.json({ mensagem: "Conta removida com sucesso" });
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