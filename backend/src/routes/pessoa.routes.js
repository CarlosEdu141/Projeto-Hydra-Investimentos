const express = require('express');
const router = express.Router();
const pessoaController = require('../controllers/pessoa.controller');

router.post('/', pessoaController.criar);
router.get('/', pessoaController.listar);
router.get('/:id', pessoaController.buscarPorId);
router.put('/:id', pessoaController.atualizar);
router.delete('/:id', pessoaController.remover);

module.exports = router;