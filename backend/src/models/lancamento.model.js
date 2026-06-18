const db = require('../config/database');

function toIntOrNull(val) {
  if (val === null || val === undefined || val === '') return null;
  const n = Number(val);
  return Number.isInteger(n) && n > 0 ? n : null;
}

function derivarNatureza(tipo) {
  return tipo === 'SAIDA_VARIAVEL' ? 'VARIAVEL' : 'FIXA';
}

// Entrada sempre PAGO; crédito = PENDENTE; qualquer outro caso (sem meio ou pagamento imediato) = PAGO
function derivarStatus(tipo, meio_pagamento) {
  if (tipo === 'ENTRADA') return 'PAGO';
  if (meio_pagamento === 'CREDITO') return 'PENDENTE';
  return 'PAGO';
}

const SQL_INSERT = `
  INSERT INTO lancamento
    (id_user, id_categoria, id_conta, descricao, valor, tipo, natureza,
     meio_pagamento, recorrente, status, data_competencia,
     id_cartao, grupo_parcelas, parcela_atual, total_parcelas)
  VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
  RETURNING *
`;

function buildParams(dados) {
  return [
    dados.id_user,
    toIntOrNull(dados.id_categoria),
    toIntOrNull(dados.id_conta),
    dados.descricao                    || null,
    dados.valor,
    dados.tipo,
    derivarNatureza(dados.tipo),
    dados.meio_pagamento               || null,
    dados.recorrente                   || false,
    derivarStatus(dados.tipo, dados.meio_pagamento),
    dados.data_lancamento              || new Date().toISOString().split('T')[0],
    toIntOrNull(dados.id_cartao),
    dados.grupo_parcelas               || null,
    dados.parcela_atual                || null,
    dados.total_parcelas               || null,
  ];
}

async function criarLancamento(dados) {
  return db.query(SQL_INSERT, buildParams(dados));
}

// Insere múltiplas parcelas em uma única transação
async function criarLote(lista) {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const inseridos = [];
    for (const dados of lista) {
      const { rows } = await client.query(SQL_INSERT, buildParams(dados));
      inseridos.push(rows[0]);
    }
    await client.query('COMMIT');
    return { rows: inseridos };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
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
      c.nome AS categoria_nome,
      cart.nome AS cartao_nome
    FROM lancamento l
    LEFT JOIN categoria c    ON c.id_categoria = l.id_categoria
    LEFT JOIN cartao    cart ON cart.id_cartao  = l.id_cartao
    ${where}
    ORDER BY l.data_competencia DESC, l.id_lancamento DESC
  `;

  return db.query(sql, params);
}

async function atualizarLancamento(id_lancamento, id_user, dados) {
  const statusFinal = dados.tipo === 'ENTRADA' ? 'PAGO' : (dados.status || 'PENDENTE');

  return db.query(
    `UPDATE lancamento
     SET descricao       = $1,
         valor           = $2,
         id_categoria    = $3,
         data_competencia = $4,
         status          = $5
     WHERE id_lancamento = $6 AND id_user = $7
     RETURNING *`,
    [
      dados.descricao    || null,
      dados.valor,
      dados.id_categoria || null,
      dados.data_lancamento,
      statusFinal,
      id_lancamento,
      id_user,
    ]
  );
}

async function deletarLancamento(id_lancamento, id_user) {
  const sql = `
    DELETE FROM lancamento
    WHERE id_lancamento = $1 AND id_user = $2
    RETURNING *
  `;
  return db.query(sql, [id_lancamento, id_user]);
}

// Deleta a parcela atual + todas com parcela_atual maior no mesmo grupo
async function deletarSubsequentes(id_lancamento, id_user) {
  return db.query(`
    WITH alvo AS (
      SELECT grupo_parcelas, parcela_atual
      FROM lancamento
      WHERE id_lancamento = $1 AND id_user = $2
    )
    DELETE FROM lancamento
    WHERE id_user = $2
      AND grupo_parcelas IS NOT NULL
      AND grupo_parcelas = (SELECT grupo_parcelas FROM alvo)
      AND parcela_atual >= (SELECT parcela_atual FROM alvo)
    RETURNING *
  `, [id_lancamento, id_user]);
}

// Atualiza valor/categoria/descrição/status de todas as parcelas do mesmo grupo
async function atualizarGrupo(id_lancamento, id_user, dados) {
  const statusFinal = dados.tipo === 'ENTRADA' ? 'PAGO' : (dados.status || 'PENDENTE');
  return db.query(`
    WITH alvo AS (
      SELECT grupo_parcelas FROM lancamento WHERE id_lancamento = $1 AND id_user = $2
    )
    UPDATE lancamento
    SET descricao    = $3,
        valor        = $4,
        id_categoria = $5,
        status       = $6
    WHERE id_user        = $2
      AND grupo_parcelas IS NOT NULL
      AND grupo_parcelas = (SELECT grupo_parcelas FROM alvo)
    RETURNING *
  `, [id_lancamento, id_user, dados.descricao || null, dados.valor, dados.id_categoria || null, statusFinal]);
}

module.exports = { criarLancamento, criarLote, listarLancamentos, atualizarLancamento, deletarLancamento, deletarSubsequentes, atualizarGrupo };
