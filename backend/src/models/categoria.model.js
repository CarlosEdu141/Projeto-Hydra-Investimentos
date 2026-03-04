const db = require('../config/database');

function criar(dados) {
  return db.query(
    `INSERT INTO categoria (nome, tipo, id_user)
     VALUES ($1,$2,$3)
     RETURNING *`,
    [dados.nome, dados.tipo, dados.id_user]
  );
}

function listar() {
  return db.query(`SELECT * FROM categoria`);
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

module.exports = {
  criar,
  listar,
  atualizar,
  remover
};
