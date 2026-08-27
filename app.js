import express from 'express';
import session from 'express-session';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import routes from './routes/index.js';

const app = express();
const __dirname = dirname(fileURLToPath(import.meta.url));

app.set('view engine', 'ejs');
app.set('views', join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(join(__dirname, 'public')));
app.use(session({
  secret: process.env.SESSION_SECRET || 'somente-desenvolvimento-troque-no-env',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 1000 * 60 * 60 * 8 }
}));

app.use((req, res, next) => {
  res.locals.usuarioLogado = req.session.usuario || null;
  res.locals.mensagem = req.session.mensagem || null;
  res.locals.formatarData = (data) => data ? new Date(data).toLocaleDateString('pt-BR') : '—';
  res.locals.formatarMoeda = (valor) => Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  delete req.session.mensagem;
  next();
});

app.use(routes);
app.use((req, res) => res.status(404).render('erro/404'));
app.use((erro, req, res, next) => {
  console.error(erro);
  const texto = erro.code === 'LIMIT_FILE_SIZE' ? 'O PDF ultrapassa o limite permitido.' : (erro.message || 'Erro interno.');
  return res.status(500).render('erro/500', { erro: texto });
});

export default app;
