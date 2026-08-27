import 'dotenv/config';
import { conectarBanco } from '../config/conexao.js';
import mongoose from '../config/conexao.js';
import Campus from '../models/Campus.js';
import AreaAtuacao from '../models/AreaAtuacao.js';
import Curso from '../models/Curso.js';

try {
  await conectarBanco();
  const campus = await Campus.findOneAndUpdate(
    {
      nome: 'IFSul Campus Bagé',
      cidade: 'Bagé'
    },
    {
      ativo: true
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true
    }
  );

  const nomesAreas = [
    'Tecnologia da Informação',
    'Administração',
    'Meio Ambiente',
    'Agropecuária'
  ];

  const areas = [];

  for (const nome of nomesAreas) {
    areas.push(
      await AreaAtuacao.findOneAndUpdate(
        {
          nome
        },
        {
          ativo: true
        },
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true
        }
      )
    );
  }

  const cursos = [
    {
      nome: 'Técnico em Informática',
      nivel: 'TÉCNICO',
      areasRelacionadas: [areas[0]._id]
    },

    {
      nome: 'Técnico em Agropecuária',
      nivel: 'TÉCNICO',
      areasRelacionadas: [
        areas[3]._id,
        areas[2]._id
      ]
    },

    {
      nome: 'Técnico em Meio Ambiente',
      nivel: 'TÉCNICO',
      areasRelacionadas: [areas[2]._id]
    }
  ];

  for (const curso of cursos) {
    await Curso.findOneAndUpdate(
      {
        nome: curso.nome,
        campus: campus._id
      },
      {
        ...curso,
        campus: campus._id,
        ativo: true
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true
      }
    );
  }

  console.log(
    'Campus, áreas e cursos de demonstração criados. Nenhum dado pessoal foi incluído.'
  );
} catch (erro) {
  console.error(erro.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}