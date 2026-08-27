import express from 'express';
import NotificacaoController from '../controllers/NotificacaoController.js';
import { autenticado, autorizar } from '../middlewares/autenticacao.js';
const router = express.Router();
router.get('/notificacoes', autenticado, NotificacaoController.listar);
router.get('/notificacoes/:id/ler', autenticado, NotificacaoController.ler);
router.get('/admin/notificacoes', autenticado, autorizar('ADMIN'), NotificacaoController.formularioAdmin);
router.post('/admin/notificacoes', autenticado, autorizar('ADMIN'), NotificacaoController.enviar);
export default router;
