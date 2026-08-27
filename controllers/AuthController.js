import bcrypt from 'bcryptjs';
import Usuario from '../models/Usuario.js';
import Estudante from '../models/Estudante.js';
import Empresa from '../models/Empresa.js';
import Curso from '../models/Curso.js';
import Campus from '../models/Campus.js';
import { emailInstitucionalValido, somenteNumeros, validarCNPJ, validarCPF } from '../utils/validacoes.js';
import { mensagem, voltarComErro } from '../utils/mensagens.js';

export default class AuthController {
  static loginForm(req, res) { res.render('auth/login'); }
  static escolhaCadastro(req, res) { res.render('auth/escolha-cadastro'); }

  static async cadastroEstudanteForm(req, res) {
    const [cursos, campi] = await Promise.all([Curso.find({ ativo: true }).sort('nome'), Campus.find({ ativo: true }).sort('nome')]);
    res.render('auth/cadastro-estudante', { cursos, campi });
  }

  static async cadastroEmpresaForm(req, res) { res.render('auth/cadastro-empresa'); }

  static async cadastrarEstudante(req, res) {
    let usuario;
    try {
      const { nome, email, senha, confirmarSenha, cpf, matricula, curso, campus } = req.body;
      if (!nome || !email || !senha || !cpf || !matricula || !curso || !campus) return voltarComErro(req, res, 'Preencha todos os campos obrigatórios.', '/cadastro/estudante');
      if (senha.length < 8) return voltarComErro(req, res, 'A senha deve ter pelo menos 8 caracteres.', '/cadastro/estudante');
      if (senha !== confirmarSenha) return voltarComErro(req, res, 'As senhas não coincidem.', '/cadastro/estudante');
      if (!emailInstitucionalValido(email)) return voltarComErro(req, res, 'Use um e-mail institucional permitido.', '/cadastro/estudante');
      if (!validarCPF(cpf)) return voltarComErro(req, res, 'CPF inválido.', '/cadastro/estudante');
      usuario = await Usuario.create({ nome, email, senhaHash: await bcrypt.hash(senha, 12), tipo: 'ESTUDANTE' });
      await Estudante.create({ usuario: usuario._id, cpf: somenteNumeros(cpf), matricula, curso, campus });
      mensagem(req, 'sucesso', 'Cadastro realizado. Agora você pode entrar.');
      return res.redirect('/login');
    } catch (erro) {
      if (usuario) await Usuario.findByIdAndDelete(usuario._id);
      const texto = erro.code === 11000 ? 'E-mail, CPF ou matrícula já cadastrado.' : 'Não foi possível realizar o cadastro.';
      return voltarComErro(req, res, texto, '/cadastro/estudante');
    }
  }

  static async cadastrarEmpresa(req, res) {
    let usuario;
    try {
      const { nome, email, senha, confirmarSenha, cnpj, razaoSocial, nomeFantasia, endereco, telefone, emailContato, responsavelNome, responsavelCargo } = req.body;
      if (!nome || !email || !senha || !cnpj || !razaoSocial || !nomeFantasia || !endereco || !telefone || !responsavelNome || !responsavelCargo) return voltarComErro(req, res, 'Preencha todos os campos obrigatórios.', '/cadastro/empresa');
      if (senha.length < 8 || senha !== confirmarSenha) return voltarComErro(req, res, 'Confira a senha e a confirmação (mínimo de 8 caracteres).', '/cadastro/empresa');
      if (!validarCNPJ(cnpj)) return voltarComErro(req, res, 'CNPJ inválido.', '/cadastro/empresa');
      usuario = await Usuario.create({ nome, email, senhaHash: await bcrypt.hash(senha, 12), tipo: 'EMPRESA' });
      await Empresa.create({ usuario: usuario._id, cnpj: somenteNumeros(cnpj), razaoSocial, nomeFantasia, endereco, telefone, emailContato: emailContato || email, responsavel: { nome: responsavelNome, cargo: responsavelCargo }, descricao: req.body.descricao });
      mensagem(req, 'sucesso', 'Empresa cadastrada. O convênio será analisado pelo IFSul.');
      return res.redirect('/login');
    } catch (erro) {
      if (usuario) await Usuario.findByIdAndDelete(usuario._id);
      const texto = erro.code === 11000 ? 'E-mail ou CNPJ já cadastrado.' : 'Não foi possível cadastrar a empresa.';
      return voltarComErro(req, res, texto, '/cadastro/empresa');
    }
  }

  static async entrar(req, res) {
    try {
      const email = String(req.body.email || '').trim().toLowerCase();
      const usuario = await Usuario.findOne({ email }).select('+senhaHash');
      if (!usuario || !(await bcrypt.compare(req.body.senha || '', usuario.senhaHash))) return voltarComErro(req, res, 'E-mail ou senha inválidos.', '/login');
      if (!usuario.ativo) return voltarComErro(req, res, 'Esta conta está inativa. Procure o setor de estágios.', '/login');
      req.session.usuario = { id: String(usuario._id), nome: usuario.nome, tipo: usuario.tipo, funcaoAdministrativa: usuario.funcaoAdministrativa };
      const destinos = { ESTUDANTE: '/estudante', EMPRESA: '/empresa', ADMIN: '/admin' };
      return res.redirect(destinos[usuario.tipo]);
    } catch (erro) { return voltarComErro(req, res, 'Não foi possível entrar.', '/login'); }
  }

  static sair(req, res) { req.session.destroy(() => res.redirect('/')); }
}
