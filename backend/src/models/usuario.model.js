const db = require('../config/database');

// Criar usuário
function criar(dados) {
  return db.query(
    `INSERT INTO usuario (id_pessoa, password)
     VALUES ($1,$2)
     RETURNING *`,
    [dados.id_pessoa, dados.password]
  );
}

// Listar
function listar() {
  return db.query(`
    SELECT
      U.id_user,
      U.id_pessoa,
      U.dt_criacao,
      P.nome,
      P.cpf,
      P.email,
      P.data_nascimento
    FROM USUARIO U
    JOIN PESSOA P ON P.id_pessoa = U.id_pessoa
    ORDER BY U.id_user
  `);
}

// Buscar por ID
function buscarPorId(id) {
  return db.query(`
    SELECT 
      u.id_user,
      u.id_pessoa,
      u.dt_criacao,
      p.nome,
      p.cpf,
      p.email,
      p.data_nascimento
    FROM usuario u
    JOIN pessoa p ON p.id_pessoa = u.id_pessoa
    WHERE u.id_user = $1
    `, [id]);
}

// Atualizar senha
function atualizar(id, dados) {
  return db.query(
    `UPDATE usuario
     SET password = $1
     WHERE id_user = $2
     RETURNING *`,
    [dados.password, id]
  );
}

function atualizarNome(id_user, nome) {
  return db.query(
    `UPDATE pessoa SET nome = $1
     WHERE id_pessoa = (SELECT id_pessoa FROM usuario WHERE id_user = $2)
     RETURNING nome`,
    [nome, id_user]
  );
}

function atualizarEmail(id_user, email) {
  return db.query(
    `UPDATE pessoa SET email = $1
     WHERE id_pessoa = (SELECT id_pessoa FROM usuario WHERE id_user = $2)
     RETURNING email`,
    [email, id_user]
  );
}

function atualizarSenha(id_user, senhaHash) {
  return db.query(
    `UPDATE usuario SET password = $1 WHERE id_user = $2 RETURNING id_user`,
    [senhaHash, id_user]
  );
}

// Remover
function remover(id) {
  return db.query(
    `DELETE FROM usuario
     WHERE id_user = $1`,
    [id]
  );
}

module.exports = {
  criar,
  listar,
  buscarPorId,
  atualizar,
  atualizarNome,
  atualizarEmail,
  atualizarSenha,
  remover
};