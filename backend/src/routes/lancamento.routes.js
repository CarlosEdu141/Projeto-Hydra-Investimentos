const express    = require('express');
const router     = express.Router();
const controller = require('../controllers/lancamento.controller');

router.get('/',      controller.listar);
router.post('/',     controller.criar);
router.delete('/:id', controller.deletar);

module.exports = router;