const db = require('../config/database');

// Criar conta
function criar(dados) {
  return db.query(
    `INSERT INTO conta (id_user, local, tipo, saldo_inicial, ativo)
     VALUES ($1,$2,$3,$4,$5)
     RETURNING *`,
    [
      dados.id_user,
      dados.local,
      dados.tipo,
      dados.saldo_inicial,
      dados.ativo
    ]
  );
}

// Listar
function listar() {
  return db.query(
    `SELECT * FROM conta ORDER BY id_conta`
  );
}

// Buscar por ID
function buscarPorId(id) {
  return db.query(
    `SELECT * FROM conta WHERE id_conta = $1`,
    [id]
  );
}

// Atualizar
function atualizar(id, dados) {
  return db.query(
    `UPDATE conta
     SET local = $1,
         tipo = $2,
         saldo_inicial = $3,
         ativo = $4
     WHERE id_conta = $5
     RETURNING *`,
    [
      dados.local,
      dados.tipo,
      dados.saldo_inicial,
      dados.ativo,
      id
    ]
  );
}

// Remover
function remover(id) {
  return db.query(
    `DELETE FROM conta WHERE id_conta = $1`,
    [id]
  );
}

module.exports = {
  criar,
  listar,
  buscarPorId,
  atualizar,
  remover
};