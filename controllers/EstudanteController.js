import { existsSync, unlinkSync } from 'fs';
import { isAbsolute, relative, resolve } from 'path';
import Estudante from '../models/Estudante.js';
import Vaga from '../models/Vaga.js';
import Candidatura from '../models/Candidatura.js';
import Termo from '../models/TermoCompromisso.js';
import Curso from '../models/Curso.js';
import Campus from '../models/Campus.js';
import { estudanteLogado } from '../utils/perfis.js';
import { mensagem, voltarComErro } from '../utils/mensagens.js';

export default class EstudanteController {
  static async painel(req, res) {
    const estudante = await Estudante.findOne({ usuario: req.session.usuario.id }).populate('curso campus');
    if (!estudante) return res.status(404).render('erro/404');
    const [candidaturas, termos, vagas] = await Promise.all([
      Candidatura.countDocuments({ estudante: estudante._id }),
      Termo.countDocuments({ estudante: estudante._id, status: 'PENDENTE' }),
      Vaga.find({ status: 'ABERTA', prazo: { $gte: new Date() }, cursosCompativeis: estudante.curso._id }).populate('empresa areaAtuacao').sort('-dataPublicacao').limit(4)
    ]);
    res.render('estudante/painel', { estudante, candidaturas, termos, vagas });
  }

  static async perfil(req, res) {
    const [estudante, cursos, campi] = await Promise.all([
      Estudante.findOne({ usuario: req.session.usuario.id }).populate('usuario curso campus'),
      Curso.find({ ativo: true }).sort('nome'), Campus.find({ ativo: true }).sort('nome')
    ]);
    res.render('estudante/perfil', { estudante, cursos, campi });
  }

  static async atualizarPerfil(req, res) {
    try {
      await Estudante.findOneAndUpdate({ usuario: req.session.usuario.id }, {
        curso: req.body.curso, campus: req.body.campus, semestre: req.body.semestre,
        turno: req.body.turno, disponibilidade: req.body.disponibilidade,
        competencias: String(req.body.competencias || '').split(',').map((i) => i.trim()).filter(Boolean)
      }, { runValidators: true });
      mensagem(req, 'sucesso', 'Perfil acadêmico atualizado.');
      res.redirect('/estudante/perfil');
    } catch (erro) { voltarComErro(req, res, 'Não foi possível atualizar o perfil.', '/estudante/perfil'); }
  }

  static async enviarCurriculo(req, res) {
    if (!req.file) return voltarComErro(req, res, 'Selecione um currículo em PDF.', '/estudante/perfil');
    const estudante = await estudanteLogado(req);
    const base = resolve(process.cwd(), 'uploads', 'curriculos');
    if (estudante.curriculo?.caminho) {
      const anterior = resolve(estudante.curriculo.caminho); const caminhoRelativo = relative(base, anterior);
      if (!caminhoRelativo.startsWith('..') && !isAbsolute(caminhoRelativo) && existsSync(anterior)) unlinkSync(anterior);
    }
    estudante.curriculo = { caminho: req.file.path, nomeOriginal: req.file.originalname, dataEnvio: new Date() };
    await estudante.save();
    mensagem(req, 'sucesso', 'Currículo atualizado com segurança.');
    res.redirect('/estudante/perfil');
  }

  static async curriculoProtegido(req, res) {
    const estudante = await Estudante.findById(req.params.id);
    if (!estudante?.curriculo?.caminho) return res.status(404).render('erro/404');
    let permitido = req.session.usuario.tipo === 'ADMIN' || String(estudante.usuario) === req.session.usuario.id;
    if (!permitido && req.session.usuario.tipo === 'EMPRESA') {
      const empresa = await (await import('../models/Empresa.js')).default.findOne({ usuario: req.session.usuario.id });
      permitido = Boolean(await Candidatura.exists({ estudante: estudante._id, vaga: { $in: await Vaga.find({ empresa: empresa._id }).distinct('_id') } }));
    }
    if (!permitido) return res.status(403).render('erro/403');
    const base = resolve(process.cwd(), 'uploads', 'curriculos');
    const arquivo = resolve(estudante.curriculo.caminho);
    const caminhoRelativo = relative(base, arquivo);
    if (caminhoRelativo.startsWith('..') || isAbsolute(caminhoRelativo)) return res.status(403).render('erro/403');
    res.download(arquivo, estudante.curriculo.nomeOriginal);
  }

  static async candidaturas(req, res) {
    const estudante = await estudanteLogado(req);
    const candidaturas = await Candidatura.find({ estudante: estudante._id }).populate({ path: 'vaga', populate: [{ path: 'empresa' }, { path: 'areaAtuacao' }] }).sort('-dataCandidatura');
    res.render('estudante/candidaturas', { candidaturas });
  }

  static async historico(req, res) {
    const estudante = await Estudante.findOne({ usuario: req.session.usuario.id }).populate('historicoEstagios.vaga historicoEstagios.empresa');
    res.render('estudante/historico', { historico: estudante.historicoEstagios });
  }
}
