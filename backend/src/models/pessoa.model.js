const db = require('../config/database');

// Criar pessoa
function criar(dados) {
  return db.query(
    `INSERT INTO pessoa (nome, cpf, email, data_nascimento)
     VALUES ($1,$2,$3,$4)
     RETURNING *`,
    [dados.nome, dados.cpf, dados.email, dados.data_nascimento]
  );
}

// Listar
function listar() {
  return db.query(
    `SELECT * FROM pessoa ORDER BY id_pessoa`
  );
}

// Buscar por ID
function buscarPorId(id) {
  return db.query(
    `SELECT * FROM pessoa WHERE id_pessoa = $1`,
    [id]
  );
}

// Atualizar
function atualizar(id, dados) {
  return db.query(
    `UPDATE pessoa
     SET nome = $1,
         cpf = $2,
         email = $3,
         data_nascimento = $4
     WHERE id_pessoa = $5
     RETURNING *`,
    [dados.nome, dados.cpf, dados.email, dados.data_nascimento, id]
  );
}

// Remover
function remover(id) {
  return db.query(
    `DELETE FROM pessoa WHERE id_pessoa = $1`,
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