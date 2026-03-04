const express = require('express');
const router = express.Router();
const controller = require('../controllers/categoria.controller');

// CREATE
router.post('/', controller.criar);

// READ
router.get('/', controller.listar);

// UPDATE
router.put('/:id', controller.atualizar);

// DELETE
router.delete('/:id', controller.remover);

module.exports = router;