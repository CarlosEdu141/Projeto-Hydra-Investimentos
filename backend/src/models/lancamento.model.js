const db = require('../config/database');

async function criarLancamento(dados) {
  const sql = `
    INSERT INTO lancamento
    (id_user, id_categoria, id_conta, descricao, valor, data_lancamento, tipo, status)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
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
    dados.status
  ]);
}

module.exports = { criarLancamento };
