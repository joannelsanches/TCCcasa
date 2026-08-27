import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcryptjs';
import { conectarBanco } from '../config/conexao.js';
import mongoose from '../config/conexao.js';
import Usuario from '../models/Usuario.js';

const pastaAtual = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({
  path: path.join(pastaAtual, '..', '.env')
});

try {
  const {
    ADMIN_NOME,
    ADMIN_EMAIL,
    ADMIN_SENHA,
    ADMIN_FUNCAO = 'ADMINISTRADOR'
  } = process.env;

  if (
    !ADMIN_NOME ||
    !ADMIN_EMAIL ||
    !ADMIN_SENHA ||
    ADMIN_SENHA === 'senha123' ||
    ADMIN_SENHA.length < 8
  ) {
    throw new Error(
      'Configure ADMIN_NOME, ADMIN_EMAIL e uma ADMIN_SENHA segura no .env.'
    );
  }

  await conectarBanco();

  const existente = await Usuario.findOne({
    email: ADMIN_EMAIL.toLowerCase()
  });

  if (existente) {
    console.log(`Administrador já existe: ${existente.email}`);
  } else {
    const admin = await Usuario.create({
      nome: ADMIN_NOME,
      email: ADMIN_EMAIL,
      senhaHash: await bcrypt.hash(ADMIN_SENHA, 12),
      tipo: 'ADMIN',
      funcaoAdministrativa: ADMIN_FUNCAO
    });

    console.log(`Administrador criado: ${admin.email}`);
  }
} catch (erro) {
  console.error(erro.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}