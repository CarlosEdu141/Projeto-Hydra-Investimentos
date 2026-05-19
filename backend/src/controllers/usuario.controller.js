const usuarioModel = require('../models/usuario.model');
const db = require('../config/database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'financas_secret_key';
const JWT_EXPIRES = '8h';

// Criar
async function criar(req, res) {
  try {
    const { nome, cpf, email, data_nascimento, password } = req.body;

    if (!nome || !cpf || !email || !data_nascimento || !password) {
      return res.status(400).json({ mensagem: "Todos os campos são obrigatórios" });
    }

    const cpfExiste = await db.query(
      "SELECT id_pessoa FROM pessoa WHERE cpf = $1", [cpf]
    );

    if (cpfExiste.rows.length > 0) {
      return res.status(400).json({ mensagem: "CPF já cadastrado" });
    }

    const pessoa = await db.query(
      `INSERT INTO pessoa (nome, cpf, email, data_nascimento)
       VALUES ($1,$2,$3,$4) RETURNING id_pessoa`,
      [nome, cpf, email, data_nascimento]
    );

    const id_pessoa = pessoa.rows[0].id_pessoa;
    const senhaHash = await bcrypt.hash(password, 10);

    const usuario = await usuarioModel.criar({ id_pessoa, password: senhaHash });

    res.status(201).json({
      mensagem: "Usuário criado com sucesso",
      usuario: usuario.rows[0]
    });

  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: erro.message });
  }
}

// Listar
async function listar(req, res) {
  try {
    const resultado = await usuarioModel.listar();
    res.json(resultado.rows);
  } catch (erro) {
    res.status(500).json({ erro: erro.message });
  }
}

// Buscar por ID
async function buscarPorId(req, res) {
  try {
    const { id } = req.params;
    const resultado = await usuarioModel.buscarPorId(id);

    if (resultado.rows.length === 0) {
      return res.status(404).json({ mensagem: "Usuário não encontrado" });
    }

    res.json(resultado.rows[0]);
  } catch (erro) {
    res.status(500).json({ erro: erro.message });
  }
}

// Atualizar senha
async function atualizar(req, res) {
  try {
    const { id } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ mensagem: "Password é obrigatório" });
    }

    const resultado = await usuarioModel.atualizar(id, req.body);

    if (resultado.rowCount === 0) {
      return res.status(404).json({ mensagem: "Usuário não encontrado" });
    }

    res.json(resultado.rows[0]);
  } catch (erro) {
    res.status(500).json({ erro: erro.message });
  }
}

// Remover
async function remover(req, res) {
  try {
    const { id } = req.params;
    const resultado = await usuarioModel.remover(id);

    if (resultado.rowCount === 0) {
      return res.status(404).json({ mensagem: "Usuário não encontrado" });
    }

    res.json({ mensagem: "Usuário removido com sucesso" });
  } catch (erro) {
    res.status(500).json({ erro: erro.message });
  }
}

// Login — gera JWT com id_user, nome e email
async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ mensagem: "Email e senha são obrigatórios" });
    }

    const resultado = await db.query(`
      SELECT
        u.id_user,
        u.password,
        p.nome,
        p.email
      FROM usuario u
      JOIN pessoa p ON p.id_pessoa = u.id_pessoa
      WHERE p.email = $1
    `, [email]);

    if (resultado.rows.length === 0) {
      return res.status(401).json({ mensagem: "Usuário não encontrado" });
    }

    const usuario = resultado.rows[0];
    const senhaCorreta = await bcrypt.compare(password, usuario.password);

    if (!senhaCorreta) {
      return res.status(401).json({ mensagem: "Senha incorreta" });
    }

    // Gera o token com os dados do usuário
    const token = jwt.sign(
      {
        id_user: usuario.id_user,
        nome:    usuario.nome,
        email:   usuario.email,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES }
    );

    res.json({
      mensagem: "Login realizado com sucesso",
      token,
      usuario: {
        id:    usuario.id_user,
        nome:  usuario.nome,
        email: usuario.email,
      }
    });

  } catch (erro) {
    res.status(500).json({ erro: erro.message });
  }
}

async function verificarSenha(req, res) {
  try {
    const id_user     = req.user.id_user;
    const { password } = req.body;
    if (!password) return res.status(400).json({ erro: 'Senha obrigatória' });

    const { rows } = await db.query('SELECT password FROM usuario WHERE id_user = $1', [id_user]);
    if (!rows.length) return res.status(404).json({ erro: 'Usuário não encontrado' });

    const correta = await bcrypt.compare(password, rows[0].password);
    if (!correta) return res.status(401).json({ erro: 'Senha incorreta' });

    res.json({ valido: true });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
}

module.exports = { criar, listar, buscarPorId, atualizar, remover, login, verificarSenha };