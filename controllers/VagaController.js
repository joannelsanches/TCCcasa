import Vaga from '../models/Vaga.js';
import Empresa from '../models/Empresa.js';
import Curso from '../models/Curso.js';
import Campus from '../models/Campus.js';
import AreaAtuacao from '../models/AreaAtuacao.js';
import Convenio from '../models/Convenio.js';
import Estudante from '../models/Estudante.js';
import Notificacao from '../models/Notificacao.js';
import { empresaLogada } from '../utils/perfis.js';
import { escaparRegex } from '../utils/validacoes.js';
import { mensagem, voltarComErro } from '../utils/mensagens.js';

async function opcoes() {
  return Promise.all([Curso.find({ ativo: true }).populate('campus').sort('nome'), Campus.find({ ativo: true }).sort('nome'), AreaAtuacao.find({ ativo: true }).sort('nome')]);
}

export default class VagaController {
  static async listar(req, res) {
    const filtro = { status: 'ABERTA', prazo: { $gte: new Date() } };
    const { q, curso, campus, area, localizacao } = req.query;
    if (curso) filtro.cursosCompativeis = curso;
    if (campus) filtro.campus = campus;
    if (area) filtro.areaAtuacao = area;
    if (localizacao) filtro.localizacao = { $regex: escaparRegex(localizacao), $options: 'i' };
    if (q) {
      const regex = { $regex: escaparRegex(q), $options: 'i' };
      const empresas = await Empresa.find({ $or: [{ nomeFantasia: regex }, { razaoSocial: regex }] }).distinct('_id');
      filtro.$or = [{ titulo: regex }, { descricao: regex }, { requisitos: regex }, { empresa: { $in: empresas } }];
    }
    const [vagas, cursos, campi, areas] = await Promise.all([
      Vaga.find(filtro).populate('empresa areaAtuacao campus cursosCompativeis').sort('-dataPublicacao'), ...await opcoes()
    ]);
    res.render('vagas/lista', { vagas, cursos, campi, areas, filtros: req.query });
  }

  static async detalhes(req, res) {
    const vaga = await Vaga.findById(req.params.id).populate('empresa areaAtuacao campus cursosCompativeis');
    if (!vaga) return res.status(404).render('erro/404');
    if (vaga.status !== 'ABERTA') {
      let permitido = req.session.usuario?.tipo === 'ADMIN';
      if (req.session.usuario?.tipo === 'EMPRESA') {
        const empresa = await empresaLogada(req);
        permitido = String(vaga.empresa?._id) === String(empresa?._id);
      }
      if (!permitido) return res.status(404).render('erro/404');
    }
    res.render('vagas/detalhes', { vaga });
  }

  static async minhas(req, res) {
    const empresa = await empresaLogada(req);
    const vagas = await Vaga.find({ empresa: empresa._id }).populate('areaAtuacao campus').sort('-createdAt');
    res.render('empresa/vagas', { vagas });
  }

  static async formulario(req, res) {
    const [cursos, campi, areas] = await opcoes();
    let vaga = null;
    if (req.params.id) {
      const empresa = await empresaLogada(req);
      vaga = await Vaga.findOne({ _id: req.params.id, empresa: empresa._id });
      if (!vaga) return res.status(403).render('erro/403');
    }
    res.render('empresa/vaga-form', { vaga, cursos, campi, areas });
  }

  static dados(body) {
    return { titulo: body.titulo, descricao: body.descricao, areaAtuacao: body.areaAtuacao, requisitos: body.requisitos, bolsa: body.bolsa, cargaHoraria: body.cargaHoraria, localizacao: body.localizacao, cursosCompativeis: Array.isArray(body.cursosCompativeis) ? body.cursosCompativeis : [body.cursosCompativeis].filter(Boolean), campus: body.campus, prazo: body.prazo };
  }

  static dadosValidos(dados) {
    return dados.titulo && dados.descricao && dados.areaAtuacao && dados.requisitos && dados.localizacao && dados.campus
      && dados.cursosCompativeis.length > 0 && Number(dados.cargaHoraria) >= 1 && Number(dados.cargaHoraria) <= 40
      && Number(dados.bolsa) >= 0 && new Date(dados.prazo) >= new Date(new Date().setHours(0, 0, 0, 0));
  }

  static async criar(req, res) {
    try {
      const empresa = await empresaLogada(req);
      const convenio = await Convenio.exists({ empresa: empresa._id, status: 'ATIVO', dataFinal: { $gte: new Date() } });
      if (!convenio) return voltarComErro(req, res, 'É necessário possuir convênio ativo para publicar uma vaga.', '/empresa/vagas');
      const dados = VagaController.dados(req.body);
      if (!VagaController.dadosValidos(dados)) return voltarComErro(req, res, 'Confira campos, cursos e prazo da vaga.', '/empresa/vagas/nova');
      await Vaga.create({ ...dados, empresa: empresa._id, status: 'PENDENTE_VALIDACAO' });
      mensagem(req, 'sucesso', 'Vaga enviada para validação do IFSul.'); res.redirect('/empresa/vagas');
    } catch (erro) { voltarComErro(req, res, 'Confira os campos da vaga.', '/empresa/vagas/nova'); }
  }

  static async editar(req, res) {
    try {
      const empresa = await empresaLogada(req);
      const dados = VagaController.dados(req.body);
      if (!VagaController.dadosValidos(dados)) return voltarComErro(req, res, 'Confira campos, cursos e prazo da vaga.', `/empresa/vagas/${req.params.id}/editar`);
      const vaga = await Vaga.findOneAndUpdate({ _id: req.params.id, empresa: empresa._id }, { ...dados, status: 'PENDENTE_VALIDACAO', justificativaValidacao: '' }, { new: true, runValidators: true });
      if (!vaga) return res.status(403).render('erro/403');
      mensagem(req, 'sucesso', 'Vaga atualizada e reenviada para validação.'); res.redirect('/empresa/vagas');
    } catch (erro) { voltarComErro(req, res, 'Não foi possível atualizar a vaga.', '/empresa/vagas'); }
  }

  static async alterarSituacao(req, res) {
    const empresa = await empresaLogada(req);
    const status = req.body.acao === 'fechar' ? 'FECHADA' : 'CANCELADA';
    const vaga = await Vaga.findOneAndUpdate({ _id: req.params.id, empresa: empresa._id }, { status });
    if (!vaga) return res.status(403).render('erro/403');
    mensagem(req, 'sucesso', status === 'FECHADA' ? 'Vaga fechada.' : 'Vaga removida dos anúncios.'); res.redirect('/empresa/vagas');
  }

  static async pendentes(req, res) {
    const vagas = await Vaga.find({ status: { $in: ['PENDENTE_VALIDACAO', 'REPROVADA'] } }).populate('empresa areaAtuacao campus cursosCompativeis').sort('createdAt');
    res.render('admin/vagas', { vagas });
  }

  static async validar(req, res) {
    const status = req.body.decisao === 'aprovar' ? 'ABERTA' : 'REPROVADA';
    if (status === 'REPROVADA' && !req.body.justificativa) return voltarComErro(req, res, 'Informe a justificativa da reprovação.', '/admin/vagas');
    const vaga = await Vaga.findByIdAndUpdate(req.params.id, { status, justificativaValidacao: req.body.justificativa || '' }, { new: true }).populate('empresa');
    if (!vaga) return res.status(404).render('erro/404');
    if (status === 'ABERTA' && vaga.prazo < new Date()) {
      vaga.status = 'PENDENTE_VALIDACAO'; await vaga.save();
      return voltarComErro(req, res, 'A vaga está com o prazo encerrado e não pode ser aprovada.', '/admin/vagas');
    }
    const destinatarios = status === 'ABERTA'
      ? await Estudante.find({ curso: { $in: vaga.cursosCompativeis } }).distinct('usuario')
      : [vaga.empresa.usuario];
    if (destinatarios.length) await Notificacao.insertMany(destinatarios.map((id) => ({ destinatario: id, titulo: status === 'ABERTA' ? 'Nova vaga compatível' : 'Vaga reprovada', mensagem: status === 'ABERTA' ? `A vaga “${vaga.titulo}” combina com seu curso.` : `A vaga “${vaga.titulo}” precisa de ajustes.`, link: status === 'ABERTA' ? `/vagas/${vaga._id}` : '/empresa/vagas' })));
    mensagem(req, 'sucesso', `Vaga ${status === 'ABERTA' ? 'aprovada' : 'reprovada'}.`); res.redirect('/admin/vagas');
  }
}
