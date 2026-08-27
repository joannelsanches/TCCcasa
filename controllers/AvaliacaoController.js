import Avaliacao from '../models/Avaliacao.js';
import Candidatura from '../models/Candidatura.js';
import Termo from '../models/TermoCompromisso.js';
import { estudanteLogado, empresaLogada } from '../utils/perfis.js';
import { mensagem, voltarComErro } from '../utils/mensagens.js';

export default class AvaliacaoController {
  static async listar(req, res) {
    let candidaturas = []; let avaliacoes; let view;
    if (req.session.usuario.tipo === 'ESTUDANTE') {
      const estudante = await estudanteLogado(req); view = 'estudante/avaliacoes';
      candidaturas = await Candidatura.find({ estudante: estudante._id, status: 'SELECIONADO' }).populate({ path: 'vaga', populate: 'empresa' });
      avaliacoes = await Avaliacao.find({ estudante: estudante._id }).populate('empresa vaga');
    } else if (req.session.usuario.tipo === 'EMPRESA') {
      const empresa = await empresaLogada(req); view = 'empresa/avaliacoes';
      candidaturas = await Candidatura.find({ vaga: { $in: await (await import('../models/Vaga.js')).default.find({ empresa: empresa._id }).distinct('_id') }, status: 'SELECIONADO' }).populate({ path: 'estudante', populate: 'usuario' }).populate('vaga');
      avaliacoes = await Avaliacao.find({ empresa: empresa._id }).populate({ path: 'estudante', populate: 'usuario' }).populate('vaga');
    } else { view = 'admin/avaliacoes'; avaliacoes = await Avaliacao.find().populate({ path: 'estudante', populate: 'usuario' }).populate('empresa vaga autor').sort('-data'); }
    res.render(view, { candidaturas, avaliacoes });
  }

  static async criar(req, res) {
    try {
      const candidatura = await Candidatura.findOne({ _id: req.body.candidatura, status: 'SELECIONADO' }).populate('vaga estudante');
      if (!candidatura) return voltarComErro(req, res, 'Candidatura não selecionada.', '/avaliacoes');
      if (!(await Termo.exists({ candidatura: candidatura._id, status: 'APROVADO' }))) return voltarComErro(req, res, 'A avaliação fica disponível após a aprovação do termo.', '/avaliacoes');
      let tipo;
      if (req.session.usuario.tipo === 'ESTUDANTE') {
        const estudante = await estudanteLogado(req); if (String(estudante._id) !== String(candidatura.estudante._id)) return res.status(403).render('erro/403');
        tipo = 'AVALIACAO_ESTUDANTE';
      } else {
        const empresa = await empresaLogada(req); if (String(empresa._id) !== String(candidatura.vaga.empresa)) return res.status(403).render('erro/403');
        tipo = 'AVALIACAO_EMPRESA';
      }
      await Avaliacao.create({ estudante: candidatura.estudante._id, empresa: candidatura.vaga.empresa, vaga: candidatura.vaga._id, autor: req.session.usuario.id, tipo, nota: req.body.nota, comentario: req.body.comentario });
      mensagem(req, 'sucesso', 'Avaliação registrada.'); res.redirect('/avaliacoes');
    } catch (erro) { voltarComErro(req, res, erro.code === 11000 ? 'Esta avaliação já foi registrada.' : 'Não foi possível registrar a avaliação.', '/avaliacoes'); }
  }
}
