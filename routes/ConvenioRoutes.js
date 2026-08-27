import express from 'express';
import ConvenioController from '../controllers/ConvenioController.js';
import { autenticado, autorizar } from '../middlewares/autenticacao.js';
const router = express.Router();
router.get('/admin/convenios', autenticado, autorizar('ADMIN'), ConvenioController.listar);
router.post('/admin/convenios', autenticado, autorizar('ADMIN'), ConvenioController.salvar);
router.post('/admin/convenios/:id/status', autenticado, autorizar('ADMIN'), ConvenioController.status);
export default router;
