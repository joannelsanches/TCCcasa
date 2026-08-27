import express from 'express';
import CandidaturaController from '../controllers/CandidaturaController.js';
import { autenticado, autorizar } from '../middlewares/autenticacao.js';
const router = express.Router();
router.post('/candidaturas/:vagaId', autenticado, autorizar('ESTUDANTE'), CandidaturaController.candidatar);
router.post('/empresa/candidaturas/:id/status', autenticado, autorizar('EMPRESA'), CandidaturaController.atualizar);
export default router;
