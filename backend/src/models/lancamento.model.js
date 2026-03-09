const db = require('../config/database');

// Converte para inteiro ou retorna null
function toIntOrNull(val) {
  if (val === null || val === undefined || val === '') return null;
  const n = Number(val);
  return Number.isInteger(n) && n > 0 ? n : null;
}

// Deriva natureza automaticamente pelo tipo do lançamento
// ENTRADA e SAIDA_FIXA → FIXA | SAIDA_VARIAVEL → VARIAVEL
function derivarNatureza(tipo) {
  return tipo === 'SAIDA_VARIAVEL' ? 'VARIAVEL' : 'FIXA';
}

async function criarLancamento(dados) {
  const sql = `
    INSERT INTO lancamento
      (id_user, id_categoria, id_conta, descricao, valor, tipo, natureza,
       meio_pagamento, recorrente, status, data_competencia)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING *
  `;

  return db.query(sql, [
    dados.id_user,
    toIntOrNull(dados.id_categoria),
    toIntOrNull(dados.id_conta),
    dados.descricao                    || null,
    dados.valor,
    dados.tipo,
    derivarNatureza(dados.tipo),
    dados.meio_pagamento               || null,
    dados.recorrente                   || false,
    'PENDENTE',
    dados.data_lancamento              || new Date().toISOString().split('T')[0],
  ]);
}

async function listarLancamentos({ tipo, id_user } = {}) {
  const conditions = [];
  const params     = [];

  if (id_user) {
    params.push(id_user);
    conditions.push(`l.id_user = $${params.length}`);
  }

  if (tipo) {
    params.push(tipo);
    conditions.push(`l.tipo = $${params.length}`);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const sql = `
    SELECT
      l.*,
      c.nome AS categoria_nome
    FROM lancamento l
    LEFT JOIN categoria c ON c.id_categoria = l.id_categoria
    ${where}
    ORDER BY l.data_competencia DESC, l.id_lancamento DESC
  `;

  return db.query(sql, params);
}

async function deletarLancamento(id_lancamento, id_user) {
  const sql = `
    DELETE FROM lancamento
    WHERE id_lancamento = $1 AND id_user = $2
    RETURNING *
  `;
  return db.query(sql, [id_lancamento, id_user]);
}

module.exports = { criarLancamento, listarLancamentos, deletarLancamento };