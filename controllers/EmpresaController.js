import Empresa from '../models/Empresa.js';
import Vaga from '../models/Vaga.js';
import Candidatura from '../models/Candidatura.js';
import Convenio from '../models/Convenio.js';
import { empresaLogada } from '../utils/perfis.js';
import { mensagem, voltarComErro } from '../utils/mensagens.js';

export default class EmpresaController {
  static async painel(req, res) {
    const empresa = await Empresa.findOne({ usuario: req.session.usuario.id }).populate('usuario');
    const [vagasAbertas, candidaturas, convenio] = await Promise.all([
      Vaga.countDocuments({ empresa: empresa._id, status: 'ABERTA' }),
      Candidatura.countDocuments({ vaga: { $in: await Vaga.find({ empresa: empresa._id }).distinct('_id') } }),
      Convenio.findOne({ empresa: empresa._id }).sort('-dataFinal')
    ]);
    res.render('empresa/painel', { empresa, vagasAbertas, candidaturas, convenio });
  }

  static async perfil(req, res) { res.render('empresa/perfil', { empresa: await Empresa.findOne({ usuario: req.session.usuario.id }).populate('usuario') }); }

  static async atualizarPerfil(req, res) {
    try {
      await Empresa.findOneAndUpdate({ usuario: req.session.usuario.id }, {
        nomeFantasia: req.body.nomeFantasia, endereco: req.body.endereco, telefone: req.body.telefone,
        emailContato: req.body.emailContato, responsavel: { nome: req.body.responsavelNome, cargo: req.body.responsavelCargo }, descricao: req.body.descricao
      }, { runValidators: true });
      mensagem(req, 'sucesso', 'Perfil da empresa atualizado.'); res.redirect('/empresa/perfil');
    } catch (erro) { voltarComErro(req, res, 'Não foi possível atualizar o perfil.', '/empresa/perfil'); }
  }

  static async candidatos(req, res) {
    const empresa = await empresaLogada(req);
    const vaga = await Vaga.findOne({ _id: req.params.vagaId, empresa: empresa._id });
    if (!vaga) return res.status(403).render('erro/403');
    const candidaturas = await Candidatura.find({ vaga: vaga._id }).populate({ path: 'estudante', populate: ['usuario', 'curso', 'campus'] }).sort('-dataCandidatura');
    res.render('empresa/candidatos', { vaga, candidaturas });
  }

  static async candidato(req, res) {
    const empresa = await empresaLogada(req);
    const candidatura = await Candidatura.findById(req.params.id).populate({ path: 'estudante', populate: ['usuario', 'curso', 'campus'] }).populate('vaga');
    if (!candidatura || String(candidatura.vaga.empresa) !== String(empresa._id)) return res.status(403).render('erro/403');
    res.render('empresa/candidato', { candidatura });
  }
}
