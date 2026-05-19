const db = require('../config/database');

function criar(dados) {
  return db.query(
    `INSERT INTO cartao (id_user, nome, tipo, limite, data_fechamento, data_vencimento)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [
      dados.id_user,
      dados.nome,
      dados.tipo,
      dados.limite || null,
      dados.data_fechamento,
      dados.data_vencimento,
    ]
  );
}

function listarPorUser(id_user) {
  return db.query(
    `SELECT * FROM cartao WHERE id_user = $1 ORDER BY id_cartao`,
    [id_user]
  );
}

function buscarPorId(id_cartao, id_user) {
  return db.query(
    `SELECT * FROM cartao WHERE id_cartao = $1 AND id_user = $2`,
    [id_cartao, id_user]
  );
}

function atualizar(id_cartao, id_user, dados) {
  return db.query(
    `UPDATE cartao
     SET nome=$1, tipo=$2, limite=$3, data_fechamento=$4, data_vencimento=$5
     WHERE id_cartao=$6 AND id_user=$7
     RETURNING *`,
    [dados.nome, dados.tipo, dados.limite || null,
     dados.data_fechamento, dados.data_vencimento, id_cartao, id_user]
  );
}

function remover(id_cartao, id_user) {
  return db.query(
    `DELETE FROM cartao WHERE id_cartao = $1 AND id_user = $2 RETURNING *`,
    [id_cartao, id_user]
  );
}

module.exports = { criar, listarPorUser, buscarPorId, remover };
