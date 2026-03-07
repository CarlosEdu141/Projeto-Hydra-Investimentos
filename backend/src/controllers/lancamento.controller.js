const LancamentoModel = require('../models/lancamento.model');

async function criar(req, res) {
  try {
    const dados = req.body;

    if (!dados.id_user || !dados.valor || !dados.tipo) {
      return res.status(400).json({ erro: 'Dados obrigatórios ausentes (id_user, valor, tipo)' });
    }

    // Garante que o tipo seja um dos valores aceitos
    const tiposValidos = ['ENTRADA', 'SAIDA_FIXA', 'SAIDA_VARIAVEL'];
    if (!tiposValidos.includes(dados.tipo)) {
      return res.status(400).json({ erro: `Tipo inválido. Use: ${tiposValidos.join(', ')}` });
    }

    const { rows } = await LancamentoModel.criarLancamento(dados);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Erro ao criar lançamento:', err);
    res.status(500).json({ erro: 'Erro interno ao criar lançamento' });
  }
}

async function listar(req, res) {
  try {
    const { tipo, id_user } = req.query;
    const { rows } = await LancamentoModel.listarLancamentos({ tipo, id_user });
    res.json(rows);
  } catch (err) {
    console.error('Erro ao listar lançamentos:', err);
    res.status(500).json({ erro: 'Erro interno ao listar lançamentos' });
  }
}

module.exports = { criar, listar };
