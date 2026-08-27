import test from 'node:test';
import assert from 'node:assert/strict';
import ejs from 'ejs';
import fs from 'fs';
import path from 'path';

function arquivos(pasta) {
  return fs.readdirSync(pasta, { withFileTypes: true }).flatMap((item) => item.isDirectory() ? arquivos(path.join(pasta, item.name)) : [path.join(pasta, item.name)]);
}

test('todas as views EJS compilam', () => {
  const views = arquivos('views').filter((arquivo) => arquivo.endsWith('.ejs'));
  views.forEach((arquivo) => assert.doesNotThrow(() => ejs.compile(fs.readFileSync(arquivo, 'utf8'), { filename: path.resolve(arquivo) }), arquivo));
  assert.ok(views.length >= 30);
});

test('não restaram referências do sistema de hotel', () => {
  const ignorados = ['package-lock.json', 'test/views.test.js', 'RELATORIO_ENTREGA.md'];
  const fontes = arquivos('.').filter((arquivo) => !arquivo.includes('node_modules') && !arquivo.includes('.git') && !ignorados.some((item) => arquivo.endsWith(item)));
  const proibido = /\b(hotel|quarto|hóspede|reserva|tipquarto|aluno)\b/i;
  fontes.forEach((arquivo) => {
    const conteudo = fs.readFileSync(arquivo, 'utf8');
    assert.equal(proibido.test(conteudo), false, `Referência antiga em ${arquivo}`);
  });
});
