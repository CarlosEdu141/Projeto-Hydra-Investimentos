const db = require('../config/database');

function criar(dados) {
  return db.query(
    `INSERT INTO categoria (nome, tipo, id_user)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [dados.nome, dados.tipo, dados.id_user]
  );
}

// Aceita filtro opcional por tipo e/ou id_user
function listar({ tipo, id_user } = {}) {
  const conditions = [];
  const params     = [];

  if (tipo) {
    params.push(tipo);
    conditions.push(`tipo = $${params.length}`);
  }

  if (id_user) {
    params.push(id_user);
    conditions.push(`id_user = $${params.length}`);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  return db.query(
    `SELECT * FROM categoria ${where} ORDER BY nome ASC`,
    params
  );
}

function atualizar(id, dados) {
  return db.query(
    `UPDATE categoria
     SET nome = $1, tipo = $2
     WHERE id_categoria = $3`,
    [dados.nome, dados.tipo, id]
  );
}

function remover(id) {
  return db.query(
    `DELETE FROM categoria WHERE id_categoria = $1`,
    [id]
  );
}

module.exports = { criar, listar, atualizar, remover };