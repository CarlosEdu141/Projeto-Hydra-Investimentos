const express = require('express');
const router = express.Router();
const contaController = require('../controllers/conta.controller');

router.post('/', contaController.criar);
router.get('/', contaController.listar);
router.get('/:id', contaController.buscarPorId);
router.put('/:id', contaController.atualizar);
router.delete('/:id', contaController.remover);

module.exports = router;