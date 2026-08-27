import Candidatura from '../models/Candidatura.js';
import Vaga from '../models/Vaga.js';
import Notificacao from '../models/Notificacao.js';
import { estudanteLogado, empresaLogada } from '../utils/perfis.js';
import { mensagem, voltarComErro } from '../utils/mensagens.js';

export default class CandidaturaController {
  static async candidatar(req, res) {
    try {
      const estudante = await estudanteLogado(req);
      const vaga = await Vaga.findOne({ _id: req.params.vagaId, status: 'ABERTA', prazo: { $gte: new Date() }, cursosCompativeis: estudante.curso });
      if (!vaga) return voltarComErro(req, res, 'Esta vaga não está disponível para o seu curso.', `/vagas/${req.params.vagaId}`);
      if (!estudante.curriculo?.caminho) return voltarComErro(req, res, 'Envie seu currículo antes de se candidatar.', '/estudante/perfil');
      await Candidatura.create({ estudante: estudante._id, vaga: vaga._id });
      mensagem(req, 'sucesso', 'Candidatura enviada.'); res.redirect('/estudante/candidaturas');
    } catch (erro) {
      voltarComErro(req, res, erro.code === 11000 ? 'Você já se candidatou a esta vaga.' : 'Não foi possível enviar a candidatura.', `/vagas/${req.params.vagaId}`);
    }
  }

  static async atualizar(req, res) {
    const empresa = await empresaLogada(req);
    const candidatura = await Candidatura.findById(req.params.id).populate('vaga estudante');
    if (!candidatura || String(candidatura.vaga.empresa) !== String(empresa._id)) return res.status(403).render('erro/403');
    const permitidos = ['EM_ANALISE', 'SELECIONADO', 'NAO_SELECIONADO'];
    if (!permitidos.includes(req.body.status)) return voltarComErro(req, res, 'Status inválido.', `/empresa/candidatos/${candidatura.vaga._id}`);
    candidatura.status = req.body.status; candidatura.observacaoEmpresa = req.body.observacaoEmpresa; await candidatura.save();
    await Notificacao.create({ destinatario: candidatura.estudante.usuario, titulo: 'Candidatura atualizada', mensagem: `O status da candidatura para “${candidatura.vaga.titulo}” foi atualizado.`, link: '/estudante/candidaturas' });
    mensagem(req, 'sucesso', 'Status da candidatura atualizado.'); res.redirect(`/empresa/candidatos/${candidatura.vaga._id}`);
  }
}
