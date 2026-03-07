const db = require('../config/database');

async function criarLancamento(dados) {
  const sql = `
    INSERT INTO lancamento
      (id_user, id_categoria, id_conta, descricao, valor, data_lancamento, tipo, status)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *
  `;
  return db.query(sql, [
    dados.id_user,
    dados.id_categoria,
    dados.id_conta,
    dados.descricao,
    dados.valor,
    dados.data_lancamento,
    dados.tipo,
    dados.status || 'ATIVO',
  ]);
}

// Listar com JOIN na categoria para retornar o nome junto
async function listarLancamentos({ tipo, id_user } = {}) {
  const conditions = [];
  const params     = [];

  if (tipo) {
    params.push(tipo);
    conditions.push(`l.tipo = $${params.length}`);
  }

  if (id_user) {
    params.push(id_user);
    conditions.push(`l.id_user = $${params.length}`);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const sql = `
    SELECT
      l.*,
      c.nome AS categoria_nome
    FROM lancamento l
    LEFT JOIN categoria c ON c.id_categoria = l.id_categoria
    ${where}
    ORDER BY l.data_lancamento DESC, l.id_lancamento DESC
  `;

  return db.query(sql, params);
}

module.exports = { criarLancamento, listarLancamentos };
