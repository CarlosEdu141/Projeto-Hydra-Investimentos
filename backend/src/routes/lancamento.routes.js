const express    = require('express');
const router     = express.Router();
const controller = require('../controllers/lancamento.controller');
const autenticar = require('../middlewares/Auth.middleware');

// Todas as rotas exigem token válido
router.use(autenticar);

router.get('/',       controller.listar);
router.post('/',      controller.criar);
router.delete('/:id', controller.deletar);

module.exports = router;