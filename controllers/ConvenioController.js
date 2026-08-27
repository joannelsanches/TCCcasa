import Convenio from '../models/Convenio.js';
import Empresa from '../models/Empresa.js';
import { mensagem, voltarComErro } from '../utils/mensagens.js';

export default class ConvenioController {
  static async listar(req, res) {
    const [convenios, empresas] = await Promise.all([Convenio.find().populate('empresa').sort('-createdAt'), Empresa.find().sort('nomeFantasia')]);
    res.render('admin/convenios', { convenios, empresas });
  }
  static async salvar(req, res) {
    try {
      if (new Date(req.body.dataFinal) <= new Date(req.body.dataInicial)) return voltarComErro(req, res, 'A data final deve ser posterior à data inicial.', '/admin/convenios');
      await Convenio.create({ empresa: req.body.empresa, numero: req.body.numero, dataInicial: req.body.dataInicial, dataFinal: req.body.dataFinal, status: req.body.status });
      if (req.body.status === 'ATIVO') await Empresa.findByIdAndUpdate(req.body.empresa, { statusCadastro: 'APROVADO' });
      mensagem(req, 'sucesso', 'Convênio registrado.'); res.redirect('/admin/convenios');
    } catch (erro) { voltarComErro(req, res, 'Não foi possível registrar o convênio.', '/admin/convenios'); }
  }
  static async status(req, res) {
    const convenio = await Convenio.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
    if (convenio?.status === 'ATIVO') await Empresa.findByIdAndUpdate(convenio.empresa, { statusCadastro: 'APROVADO' });
    mensagem(req, 'sucesso', 'Situação do convênio atualizada.'); res.redirect('/admin/convenios');
  }
}
