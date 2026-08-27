import Usuario from '../models/Usuario.js';
import Estudante from '../models/Estudante.js';
import Empresa from '../models/Empresa.js';
import Vaga from '../models/Vaga.js';
import Candidatura from '../models/Candidatura.js';
import Convenio from '../models/Convenio.js';
import Termo from '../models/TermoCompromisso.js';
import Curso from '../models/Curso.js';
import Campus from '../models/Campus.js';
import AreaAtuacao from '../models/AreaAtuacao.js';
import { mensagem, voltarComErro } from '../utils/mensagens.js';

export default class AdminController {
  static async painel(req, res) {
    const [estudantes, empresas, conveniadas, vagasAbertas, vagasPendentes, emEstagio] = await Promise.all([
      Estudante.countDocuments(), Empresa.countDocuments(), Convenio.distinct('empresa', { status: 'ATIVO', dataFinal: { $gte: new Date() } }),
      Vaga.countDocuments({ status: 'ABERTA' }), Vaga.countDocuments({ status: 'PENDENTE_VALIDACAO' }), Termo.countDocuments({ status: 'APROVADO' })
    ]);
    res.render('admin/painel', { metricas: { estudantes, empresas, conveniadas: conveniadas.length, vagasAbertas, vagasPendentes, emEstagio } });
  }

  static async usuarios(req, res) {
    const filtro = req.query.tipo ? { tipo: req.query.tipo } : {};
    const usuarios = await Usuario.find(filtro).sort('-dataCriacao'); res.render('admin/usuarios', { usuarios, tipo: req.query.tipo || '' });
  }
  static async alternarUsuario(req, res) {
    const usuario = await Usuario.findById(req.params.id); if (!usuario) return res.status(404).render('erro/404');
    if (String(usuario._id) === req.session.usuario.id) return voltarComErro(req, res, 'Você não pode desativar sua própria conta.', '/admin/usuarios');
    usuario.ativo = !usuario.ativo; await usuario.save(); mensagem(req, 'sucesso', 'Situação do usuário atualizada.'); res.redirect('/admin/usuarios');
  }

  static async empresas(req, res) {
    const empresas = await Empresa.find().populate('usuario').sort('nomeFantasia');
    const convenios = await Convenio.find({ empresa: { $in: empresas.map((e) => e._id) } }).sort('-dataFinal');
    const ultimoConvenio = Object.fromEntries(convenios.map((c) => [String(c.empresa), c]));
    res.render('admin/empresas', { empresas, ultimoConvenio });
  }
  static async statusEmpresa(req, res) {
    await Empresa.findByIdAndUpdate(req.params.id, { statusCadastro: req.body.status }); mensagem(req, 'sucesso', 'Cadastro da empresa atualizado.'); res.redirect('/admin/empresas');
  }

  static async cadastros(req, res) {
    const [campi, cursos, areas] = await Promise.all([Campus.find().sort('nome'), Curso.find().populate('campus areasRelacionadas').sort('nome'), AreaAtuacao.find().sort('nome')]);
    res.render('admin/cadastros', { campi, cursos, areas });
  }
  static async criarCampus(req, res) { try { await Campus.create({ nome: req.body.nome, cidade: req.body.cidade }); mensagem(req, 'sucesso', 'Campus cadastrado.'); res.redirect('/admin/cadastros'); } catch { voltarComErro(req, res, 'Campus já cadastrado ou inválido.', '/admin/cadastros'); } }
  static async criarArea(req, res) { try { await AreaAtuacao.create({ nome: req.body.nome }); mensagem(req, 'sucesso', 'Área cadastrada.'); res.redirect('/admin/cadastros'); } catch { voltarComErro(req, res, 'Área já cadastrada ou inválida.', '/admin/cadastros'); } }
  static async criarCurso(req, res) {
    try {
      const areas = Array.isArray(req.body.areasRelacionadas) ? req.body.areasRelacionadas : [req.body.areasRelacionadas].filter(Boolean);
      await Curso.create({ nome: req.body.nome, nivel: req.body.nivel, campus: req.body.campus, areasRelacionadas: areas }); mensagem(req, 'sucesso', 'Curso cadastrado.'); res.redirect('/admin/cadastros');
    } catch { voltarComErro(req, res, 'Curso já cadastrado ou inválido.', '/admin/cadastros'); }
  }
  static async alternarCadastro(req, res) {
    const modelos = { campus: Campus, curso: Curso, area: AreaAtuacao }; const Model = modelos[req.params.tipo];
    if (!Model) return res.status(404).render('erro/404');
    const item = await Model.findById(req.params.id); if (!item) return res.status(404).render('erro/404'); item.ativo = !item.ativo; await item.save();
    mensagem(req, 'sucesso', 'Situação atualizada.'); res.redirect('/admin/cadastros');
  }

  static async relatorios(req, res) {
    const filtroVaga = {};
    if (req.query.empresa) filtroVaga.empresa = req.query.empresa;
    const vagas = req.query.empresa ? await Vaga.find(filtroVaga).distinct('_id') : null;
    const filtro = {};
    if (req.query.status) filtro.status = req.query.status;
    if (vagas) filtro.vaga = { $in: vagas };
    if (req.query.inicio || req.query.fim) filtro.dataCandidatura = {};
    if (req.query.inicio) filtro.dataCandidatura.$gte = new Date(req.query.inicio);
    if (req.query.fim) filtro.dataCandidatura.$lte = new Date(`${req.query.fim}T23:59:59`);
    let candidaturas = await Candidatura.find(filtro).populate({ path: 'estudante', populate: ['usuario', 'curso'] }).populate({ path: 'vaga', populate: 'empresa' }).sort('-dataCandidatura');
    if (req.query.curso) candidaturas = candidaturas.filter((c) => String(c.estudante.curso?._id) === req.query.curso);
    if (req.query.formato === 'csv') {
      const limpar = (v) => `"${String(v ?? '').replaceAll('"', '""')}"`;
      const linhas = [['Estudante','Curso','Empresa','Vaga','Status','Data'], ...candidaturas.map((c) => [c.estudante.usuario.nome,c.estudante.curso?.nome,c.vaga.empresa.nomeFantasia,c.vaga.titulo,c.status,new Date(c.dataCandidatura).toLocaleDateString('pt-BR')])];
      res.setHeader('Content-Type', 'text/csv; charset=utf-8'); res.setHeader('Content-Disposition', 'attachment; filename="relatorio-startif.csv"');
      return res.send('\uFEFF' + linhas.map((l) => l.map(limpar).join(';')).join('\n'));
    }
    const [cursos, empresas] = await Promise.all([Curso.find({ ativo: true }).sort('nome'), Empresa.find().sort('nomeFantasia')]);
    res.render('admin/relatorios', { candidaturas, cursos, empresas, filtros: req.query });
  }
}
