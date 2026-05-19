const express    = require('express');
const router     = express.Router();
const controller = require('../controllers/cartao.controller');
const autenticar = require('../middlewares/Auth.middleware');

router.use(autenticar);

router.get('/',       controller.listar);
router.post('/',      controller.criar);
router.put('/:id',    controller.atualizar);
router.delete('/:id', controller.remover);

module.exports = router;
