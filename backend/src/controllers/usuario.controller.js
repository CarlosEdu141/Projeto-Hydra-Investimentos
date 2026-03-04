const usuarioModel = require('../models/usuario.model');

// Criar
async function criar(req, res) {
  try {
    const { id_pessoa, password } = req.body;

    if (!id_pessoa || !password) {
      return res.status(400).json({ mensagem: "id_pessoa e password são obrigatórios" });
    }

    const resultado = await usuarioModel.criar(req.body);
    res.status(201).json(resultado.rows[0]);

  } catch (erro) {
    res.status(500).json({ erro: erro.message });
  }
}

// Listar
async function listar(req, res) {
  try {
    const resultado = await usuarioModel.listar();
    res.json(resultado.rows);
  } catch (erro) {
    res.status(500).json({ erro: erro.message });
  }
}

// Buscar por ID
async function buscarPorId(req, res) {
  try {
    const { id } = req.params;
    const resultado = await usuarioModel.buscarPorId(id);

    if (resultado.rows.length === 0) {
      return res.status(404).json({ mensagem: "Usuário não encontrado" });
    }

    res.json(resultado.rows[0]);

  } catch (erro) {
    res.status(500).json({ erro: erro.message });
  }
}

// Atualizar senha
async function atualizar(req, res) {
  try {
    const { id } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ mensagem: "Password é obrigatório" });
    }

    const resultado = await usuarioModel.atualizar(id, req.body);

    if (resultado.rowCount === 0) {
      return res.status(404).json({ mensagem: "Usuário não encontrado" });
    }

    res.json(resultado.rows[0]);

  } catch (erro) {
    res.status(500).json({ erro: erro.message });
  }
}

// Remover
async function remover(req, res) {
  try {
    const { id } = req.params;
    const resultado = await usuarioModel.remover(id);

    if (resultado.rowCount === 0) {
      return res.status(404).json({ mensagem: "Usuário não encontrado" });
    }

    res.json({ mensagem: "Usuário removido com sucesso" });

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