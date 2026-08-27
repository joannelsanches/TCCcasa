# Relatório de entrega — StartIF

## Resumo

O projeto de hotel foi substituído por uma base funcional do StartIF, mantendo Node.js, Express, EJS, CSS, MongoDB/Mongoose e JavaScript. Foram implementados os perfis Estudante, Empresa e Administrador, com sessões, autorização, vagas, candidaturas, arquivos PDF protegidos, convênios, termos, avaliações, notificações e relatórios.

## Arquivos criados

- raiz e configuração: `.env.example`, `app.js`, `config/upload.js`;
- middlewares e utilitários: `middlewares/autenticacao.js`, `utils/mensagens.js`, `utils/perfis.js`, `utils/validacoes.js`;
- controllers: `AdminController.js`, `AvaliacaoController.js`, `ConvenioController.js`, `EstudanteController.js`, `NotificacaoController.js`, `PublicController.js`, `TermoController.js`;
- models: `AreaAtuacao.js`, `Avaliacao.js`, `Campus.js`, `Convenio.js`, `Curso.js`, `Estudante.js`, `Notificacao.js`, `TermoCompromisso.js`;
- rotas: `AdminRoutes.js`, `AvaliacaoRoutes.js`, `ConvenioRoutes.js`, `EstudanteRoutes.js`, `NotificacaoRoutes.js`, `TermoRoutes.js`, `routes/index.js`;
- scripts: `scripts/criar-admin.js`, `scripts/dados-demo.js`;
- interface: `public/js/app.js` e 37 views nas pastas `views/admin`, `views/auth`, `views/empresa`, `views/erro`, `views/estudante`, `views/partials`, `views/public` e `views/vagas`;
- testes: `test/estrutura.test.js`, `test/validacoes.test.js`, `test/views.test.js`.

## Arquivos alterados

- `.gitignore`, `README.md`, `package.json`, `package-lock.json`;
- `index.js`, `api/index.js`, `config/conexao.js`;
- `controllers/AuthController.js`, `controllers/CandidaturaController.js`, `controllers/EmpresaController.js`, `controllers/VagaController.js`;
- `models/Usuario.js`, `models/Empresa.js`, `models/Vaga.js`, `models/Candidatura.js`;
- `routes/AuthRoutes.js`, `routes/EmpresaRoutes.js`, `routes/VagaRoutes.js`, `routes/CandidaturaRoutes.js`;
- `public/css/style.css`.

## Arquivos removidos

- controllers antigos: `AlunoController.js`, `Lista.js`, `controller.js`;
- models antigos ou incorretos: `Admin.js`, `PerfilAcademico,js`;
- rotas antigas: `Adm.js`, `AlunoRoutes.js`, `ListaRoutes.js`, `route.js`;
- imagem antiga: `public/img/img.png`;
- páginas antigas: `views/admin.ejs`, `views/index.ejs`, `views/index2.ejs`, `views/lista.ejs`, `views/reserva.ejs`, `views/cabecalho.ejs`, `views/cabecalho2.ejs`, `views/rodape.ejs`;
- todas as páginas das pastas antigas `views/cliente`, `views/contrato`, `views/quarto`, `views/servico` e `views/tipquarto`.

## Verificações executadas

- [x] 8 testes automatizados aprovados;
- [x] todos os arquivos JavaScript passaram por verificação de sintaxe;
- [x] todos os imports locais apontam para arquivos existentes;
- [x] as 37 views EJS compilam;
- [x] seis páginas públicas responderam HTTP 200 no teste de fumaça;
- [x] não restaram referências funcionais ou visíveis ao sistema de hotel;
- [x] não há URI, usuário ou senha do MongoDB no código;
- [x] currículo e documentos não são servidos pela pasta pública;
- [ ] os fluxos persistentes devem ser percorridos com um MongoDB configurado, seguindo o roteiro do `README.md`.

## Administrador de teste

O comando `npm run criar-admin` cria o administrador usando `ADMIN_NOME`, `ADMIN_EMAIL`, `ADMIN_SENHA` e `ADMIN_FUNCAO` do `.env`. O exemplo de e-mail é `admin@startif.local`; nenhuma senha é fixada ou publicada no repositório.
