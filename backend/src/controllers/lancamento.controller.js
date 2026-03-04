const LancamentoModel = require('../models/lancamento.model');

async function criar(req, res) {
  const dados = req.body;

  if (!dados.id_user || !dados.valor || !dados.tipo) {
    return res.status(400).json({ erro: 'Dados obrigatórios ausentes' });
  }

  const { rows } = await LancamentoModel.criarLancamento(dados);
  res.status(201).json(rows[0]);
}

module.exports = { criar };
