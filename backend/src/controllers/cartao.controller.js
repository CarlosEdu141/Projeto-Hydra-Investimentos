const CartaoModel = require('../models/cartao.model');

async function criar(req, res) {
  try {
    const dados = { ...req.body, id_user: req.user.id_user };

    if (!dados.nome || !dados.tipo || !dados.data_fechamento || !dados.data_vencimento) {
      return res.status(400).json({ erro: 'Campos obrigatórios: nome, tipo, data_fechamento, data_vencimento' });
    }

    if (!['CREDITO', 'DEBITO_CREDITO'].includes(dados.tipo)) {
      return res.status(400).json({ erro: 'Tipo inválido. Use: CREDITO ou DEBITO_CREDITO' });
    }

    const { rows } = await CartaoModel.criar(dados);
    res.status(201).json(rows[0]);

  } catch (err) {
    console.error('Erro ao criar cartão:', err);
    res.status(500).json({ erro: 'Erro interno ao criar cartão' });
  }
}

async function listar(req, res) {
  try {
    const { rows } = await CartaoModel.listarPorUser(req.user.id_user);
    res.json(rows);
  } catch (err) {
    console.error('Erro ao listar cartões:', err);
    res.status(500).json({ erro: 'Erro interno ao listar cartões' });
  }
}

async function remover(req, res) {
  try {
    const { id } = req.params;
    const { rows } = await CartaoModel.remover(id, req.user.id_user);
    if (!rows.length) return res.status(404).json({ erro: 'Cartão não encontrado' });
    res.json({ mensagem: 'Cartão removido', cartao: rows[0] });
  } catch (err) {
    console.error('Erro ao remover cartão:', err);
    res.status(500).json({ erro: 'Erro interno ao remover cartão' });
  }
}

async function atualizar(req, res) {
  try {
    const { id }   = req.params;
    const id_user  = req.user.id_user;
    const dados    = req.body;

    if (!dados.nome || !dados.tipo || !dados.data_fechamento || !dados.data_vencimento) {
      return res.status(400).json({ erro: 'Campos obrigatórios: nome, tipo, data_fechamento, data_vencimento' });
    }

    const { rows } = await CartaoModel.atualizar(id, id_user, dados);
    if (!rows.length) return res.status(404).json({ erro: 'Cartão não encontrado' });
    res.json(rows[0]);
  } catch (err) {
    console.error('Erro ao atualizar cartão:', err);
    res.status(500).json({ erro: 'Erro interno ao atualizar cartão' });
  }
}

module.exports = { criar, listar, atualizar, remover };
