const { randomUUID } = require('crypto');
const LancamentoModel = require('../models/lancamento.model');
const CartaoModel     = require('../models/cartao.model');

const TAXA_JUROS_PADRAO = 2.99; // % a.m. — Tabela Price

// Tabela Price: PMT = PV * i / (1 - (1+i)^-n)
function calcularPMT(valor, taxaMensal, parcelas) {
  if (taxaMensal === 0) return Math.round((valor / parcelas) * 100) / 100;
  const i   = taxaMensal / 100;
  const pmt = valor * (i * Math.pow(1 + i, parcelas)) / (Math.pow(1 + i, parcelas) - 1);
  return Math.round(pmt * 100) / 100;
}

async function criar(req, res) {
  try {
    const dados    = { ...req.body };
    dados.id_user  = req.user.id_user;

    if (!dados.valor || !dados.tipo) {
      return res.status(400).json({ erro: 'Dados obrigatórios ausentes (valor, tipo)' });
    }

    const tiposValidos = ['ENTRADA', 'SAIDA_FIXA', 'SAIDA_VARIAVEL'];
    if (!tiposValidos.includes(dados.tipo)) {
      return res.status(400).json({ erro: `Tipo inválido. Use: ${tiposValidos.join(', ')}` });
    }

    const totalParcelas = parseInt(dados.total_parcelas) || 1;
    const ehParcelado   = totalParcelas > 1 && dados.meio_pagamento === 'CREDITO' && dados.id_cartao;

    if (!ehParcelado) {
      const { rows } = await LancamentoModel.criarLancamento(dados);
      return res.status(201).json(rows[0]);
    }

    const { rows: cartaoRows } = await CartaoModel.buscarPorId(dados.id_cartao, dados.id_user);
    if (!cartaoRows.length) {
      return res.status(400).json({ erro: 'Cartão não encontrado' });
    }

    const taxaMensal = dados.tem_juros ? TAXA_JUROS_PADRAO : 0;
    const pmt        = calcularPMT(parseFloat(dados.valor), taxaMensal, totalParcelas);
    const grupoId    = randomUUID();

    // Determina o mês inicial com base no fechamento da fatura
    // Se hoje já passou do dia de fechamento → fatura fechada → começa no próximo mês
    const rawFechamento  = cartaoRows[0].data_fechamento;
    const diaFechamento  = new Date(
      typeof rawFechamento === 'string' ? rawFechamento + 'T12:00:00' : rawFechamento
    ).getDate();
    const hoje = new Date();
    let mesInicio = hoje.getMonth();
    let anoInicio = hoje.getFullYear();
    if (hoje.getDate() > diaFechamento) {
      mesInicio++;
      if (mesInicio > 11) { mesInicio = 0; anoInicio++; }
    }

    const lista = [];
    for (let i = 0; i < totalParcelas; i++) {
      const d = new Date(anoInicio, mesInicio + i, 1);
      lista.push({
        ...dados,
        valor:           pmt,
        data_lancamento: d.toISOString().split('T')[0],
        grupo_parcelas:  grupoId,
        parcela_atual:   i + 1,
        total_parcelas:  totalParcelas,
      });
    }

    const { rows } = await LancamentoModel.criarLote(lista);
    res.status(201).json(rows);
  } catch (err) {
    console.error('Erro ao criar lançamento:', err);
    res.status(500).json({ erro: 'Erro interno ao criar lançamento' });
  }
}

async function listar(req, res) {
  try {
    const id_user  = req.user.id_user;
    const { tipo } = req.query;

    const { rows } = await LancamentoModel.listarLancamentos({ tipo, id_user });
    res.json(rows);
  } catch (err) {
    console.error('Erro ao listar lançamentos:', err);
    res.status(500).json({ erro: 'Erro interno ao listar lançamentos' });
  }
}

async function deletar(req, res) {
  try {
    const { id }           = req.params;
    const id_user          = req.user.id_user;
    const { subsequentes } = req.query;

    if (subsequentes === 'true') {
      const { rows } = await LancamentoModel.deletarSubsequentes(id, id_user);
      if (!rows.length) return res.status(404).json({ erro: 'Lançamento não encontrado' });
      return res.json({ mensagem: `${rows.length} parcela(s) removida(s)`, lancamentos: rows });
    }

    const { rows } = await LancamentoModel.deletarLancamento(id, id_user);
    if (rows.length === 0) return res.status(404).json({ erro: 'Lançamento não encontrado' });
    res.json({ mensagem: 'Lançamento removido com sucesso', lancamento: rows[0] });
  } catch (err) {
    console.error('Erro ao deletar lançamento:', err);
    res.status(500).json({ erro: 'Erro interno ao deletar lançamento' });
  }
}

async function atualizar(req, res) {
  try {
    const { id }    = req.params;
    const id_user   = req.user.id_user;
    const { grupo } = req.query;

    if (grupo === 'true') {
      const { rows } = await LancamentoModel.atualizarGrupo(id, id_user, req.body);
      if (!rows.length) return res.status(404).json({ erro: 'Lançamento não encontrado' });
      return res.json(rows);
    }

    const { rows } = await LancamentoModel.atualizarLancamento(id, id_user, req.body);
    if (!rows.length) return res.status(404).json({ erro: 'Lançamento não encontrado' });
    res.json(rows[0]);
  } catch (err) {
    console.error('Erro ao atualizar lançamento:', err);
    res.status(500).json({ erro: 'Erro interno ao atualizar lançamento' });
  }
}

module.exports = { criar, listar, atualizar, deletar };
