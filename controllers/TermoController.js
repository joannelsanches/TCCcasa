import { isAbsolute, relative, resolve } from 'path';
import Termo from '../models/TermoCompromisso.js';
import Candidatura from '../models/Candidatura.js';
import Estudante from '../models/Estudante.js';
import Empresa from '../models/Empresa.js';
import Notificacao from '../models/Notificacao.js';
import { estudanteLogado, empresaLogada } from '../utils/perfis.js';
import { mensagem, voltarComErro } from '../utils/mensagens.js';

export default class TermoController {
  static async listar(req, res) {
    let filtro = {};
    let view = 'admin/termos';
    if (req.session.usuario.tipo === 'ESTUDANTE') { const estudante = await estudanteLogado(req); filtro.estudante = estudante._id; view = 'estudante/termos'; }
    if (req.session.usuario.tipo === 'EMPRESA') { const empresa = await empresaLogada(req); filtro.empresa = empresa._id; view = 'empresa/termos'; }
    const termos = await Termo.find(filtro).populate({ path: 'candidatura', populate: 'vaga' }).populate({ path: 'estudante', populate: 'usuario' }).populate('empresa').sort('-dataSolicitacao');
    let selecionadas = [];
    if (req.session.usuario.tipo === 'ESTUDANTE') {
      const estudante = await estudanteLogado(req);
      selecionadas = await Candidatura.find({ estudante: estudante._id, status: 'SELECIONADO', _id: { $nin: termos.map((t) => t.candidatura._id) } }).populate('vaga');
    }
    res.render(view, { termos, selecionadas });
  }

  static async solicitar(req, res) {
    try {
      const estudante = await estudanteLogado(req);
      const candidatura = await Candidatura.findOne({ _id: req.body.candidatura, estudante: estudante._id, status: 'SELECIONADO' }).populate('vaga');
      if (!candidatura) return voltarComErro(req, res, 'A candidatura precisa estar selecionada.', '/termos');
      await Termo.create({ candidatura: candidatura._id, estudante: estudante._id, empresa: candidatura.vaga.empresa, planoAtividades: req.body.planoAtividades });
      mensagem(req, 'sucesso', 'Termo solicitado para análise.'); res.redirect('/termos');
    } catch (erro) { voltarComErro(req, res, erro.code === 11000 ? 'Já existe um termo para esta candidatura.' : 'Não foi possível solicitar o termo.', '/termos'); }
  }

  static async enviarDocumento(req, res) {
    const estudante = await estudanteLogado(req);
    const termo = await Termo.findOne({ _id: req.params.id, estudante: estudante._id });
    if (!termo || !req.file) return voltarComErro(req, res, 'Termo ou PDF inválido.', '/termos');
    termo.documentos.push({ nome: req.body.nomeDocumento || 'Documento obrigatório', nomeOriginal: req.file.originalname, caminho: req.file.path });
    termo.status = 'PENDENTE'; await termo.save();
    mensagem(req, 'sucesso', 'Documento enviado.'); res.redirect('/termos');
  }

  static async documento(req, res) {
    const termo = await Termo.findOne({ 'documentos._id': req.params.documentoId }).populate('estudante empresa');
    if (!termo) return res.status(404).render('erro/404');
    let permitido = req.session.usuario.tipo === 'ADMIN';
    if (req.session.usuario.tipo === 'ESTUDANTE') permitido = String(termo.estudante.usuario) === req.session.usuario.id;
    if (req.session.usuario.tipo === 'EMPRESA') permitido = String(termo.empresa.usuario) === req.session.usuario.id;
    if (!permitido) return res.status(403).render('erro/403');
    const documento = termo.documentos.id(req.params.documentoId);
    const base = resolve(process.cwd(), 'uploads', 'documentos'); const arquivo = resolve(documento.caminho);
    const caminhoRelativo = relative(base, arquivo);
    if (caminhoRelativo.startsWith('..') || isAbsolute(caminhoRelativo)) return res.status(403).render('erro/403');
    res.download(arquivo, documento.nomeOriginal);
  }

  static async analisar(req, res) {
    const status = req.body.decisao === 'aprovar' ? 'APROVADO' : 'REPROVADO';
    if (status === 'REPROVADO' && !req.body.justificativa) return voltarComErro(req, res, 'Informe a justificativa.', '/termos');
    if (status === 'APROVADO' && !(await Termo.exists({ _id: req.params.id, 'documentos.0': { $exists: true } }))) return voltarComErro(req, res, 'Envie ao menos um documento antes de aprovar o termo.', '/termos');
    const termo = await Termo.findByIdAndUpdate(req.params.id, { status, justificativa: req.body.justificativa || '', dataAprovacao: status === 'APROVADO' ? new Date() : null, 'documentos.$[].validado': status === 'APROVADO' }, { new: true }).populate('estudante candidatura');
    if (!termo) return res.status(404).render('erro/404');
    if (status === 'APROVADO') {
      const existe = termo.estudante.historicoEstagios.some((h) => String(h.vaga) === String(termo.candidatura.vaga));
      if (!existe) { termo.estudante.historicoEstagios.push({ vaga: termo.candidatura.vaga, empresa: termo.empresa, dataInicio: new Date() }); await termo.estudante.save(); }
    }
    await Notificacao.create({ destinatario: termo.estudante.usuario, titulo: 'Termo de compromisso analisado', mensagem: `Seu termo foi ${status === 'APROVADO' ? 'aprovado' : 'reprovado'}.`, link: '/termos' });
    mensagem(req, 'sucesso', 'Análise do termo registrada.'); res.redirect('/termos');
  }
}
