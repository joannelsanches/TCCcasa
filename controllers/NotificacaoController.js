import Notificacao from '../models/Notificacao.js';
import Usuario from '../models/Usuario.js';
import Estudante from '../models/Estudante.js';
import Curso from '../models/Curso.js';
import { mensagem, voltarComErro } from '../utils/mensagens.js';

export default class NotificacaoController {
  static async listar(req, res) {
    const notificacoes = await Notificacao.find({ destinatario: req.session.usuario.id }).sort('-data');
    res.render('estudante/notificacoes', { notificacoes });
  }
  static async ler(req, res) {
    const notificacao = await Notificacao.findOneAndUpdate({ _id: req.params.id, destinatario: req.session.usuario.id }, { lida: true });
    const link = notificacao?.link;
    res.redirect(link?.startsWith('/') && !link.startsWith('//') ? link : '/notificacoes');
  }
  static async formularioAdmin(req, res) {
    res.render('admin/notificacoes', { cursos: await Curso.find({ ativo: true }).sort('nome') });
  }
  static async enviar(req, res) {
    try {
      let destinatarios;
      if (req.body.publico === 'CURSO' && !req.body.curso) return voltarComErro(req, res, 'Selecione o curso destinatário.', '/admin/notificacoes');
      if (req.body.publico === 'CURSO') destinatarios = await Estudante.find({ curso: req.body.curso }).distinct('usuario');
      else if (['ESTUDANTE', 'EMPRESA', 'ADMIN'].includes(req.body.publico)) destinatarios = await Usuario.find({ tipo: req.body.publico, ativo: true }).distinct('_id');
      else destinatarios = await Usuario.find({ ativo: true }).distinct('_id');
      const link = req.body.link?.startsWith('/') && !req.body.link.startsWith('//') ? req.body.link : '/notificacoes';
      if (destinatarios.length) await Notificacao.insertMany(destinatarios.map((id) => ({ destinatario: id, titulo: req.body.titulo, mensagem: req.body.mensagem, link })));
      mensagem(req, 'sucesso', `Notificação enviada para ${destinatarios.length} usuário(s).`); res.redirect('/admin/notificacoes');
    } catch (erro) { voltarComErro(req, res, 'Não foi possível enviar as notificações.', '/admin/notificacoes'); }
  }
}
