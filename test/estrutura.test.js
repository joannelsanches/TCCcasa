import test from 'node:test';
import assert from 'node:assert/strict';
import app from '../app.js';
import mongoose from '../config/conexao.js';
import '../models/Usuario.js';
import '../models/Estudante.js';
import '../models/Empresa.js';
import '../models/Curso.js';
import '../models/Campus.js';
import '../models/AreaAtuacao.js';
import '../models/Vaga.js';
import '../models/Candidatura.js';
import '../models/TermoCompromisso.js';
import '../models/Convenio.js';
import '../models/Avaliacao.js';

function rotasDaCamada(camada, prefixo = '') {
  if (camada.route) return camada.route.stack.map((item) => `${Object.keys(item.method ? { [item.method]: true } : camada.route.methods).join(',').toUpperCase()} ${prefixo}${camada.route.path}`);
  if (camada.name === 'router' && camada.handle?.stack) return camada.handle.stack.flatMap((item) => rotasDaCamada(item, prefixo));
  return [];
}

test('todos os models centrais estão registrados', () => {
  const esperados = ['Usuario','Estudante','Empresa','Curso','Campus','AreaAtuacao','Vaga','Candidatura','TermoCompromisso','Convenio','Avaliacao','Notificacao'];
  esperados.forEach((nome) => assert.ok(mongoose.modelNames().includes(nome), `Model ausente: ${nome}`));
});

test('aplicação expõe os grupos de rotas principais', () => {
  const texto = app._router.stack.flatMap((camada) => rotasDaCamada(camada)).join('\n');
  ['/login','/cadastro/estudante','/estudante','/empresa','/vagas','/termos','/avaliacoes','/admin','/admin/relatorios'].forEach((rota) => assert.ok(texto.includes(rota), `Rota ausente: ${rota}`));
});

test('senha não é selecionada por padrão e candidatura possui índice único', () => {
  assert.equal(mongoose.model('Usuario').schema.path('senhaHash').options.select, false);
  const indice = mongoose.model('Candidatura').schema.indexes().find(([campos]) => campos.estudante === 1 && campos.vaga === 1);
  assert.equal(indice?.[1]?.unique, true);
});
