const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuario.controller');
const autenticar = require('../middlewares/Auth.middleware');

router.post('/', usuarioController.criar);
router.post('/login', usuarioController.login);
router.post('/verificar-senha', autenticar, usuarioController.verificarSenha);

router.patch('/me/nome',  autenticar, usuarioController.alterarNome);
router.patch('/me/email', autenticar, usuarioController.alterarEmail);
router.patch('/me/senha', autenticar, usuarioController.alterarSenha);

router.get('/', usuarioController.listar);
router.get('/:id', usuarioController.buscarPorId);
router.put('/:id', usuarioController.atualizar);
router.delete('/:id', usuarioController.remover);

module.exports = router;