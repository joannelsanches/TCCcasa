import mongoose from '../config/conexao.js';

const schema = new mongoose.Schema({
    empresa: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Empresa',
      required: true
    },
    titulo: {
      type: String,
      required: true,
      trim: true
    },
    descricao: {
      type: String,
      required: true,
      trim: true
    },
    areaAtuacao: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AreaAtuacao',
      required: true
    },
    requisitos: {
      type: String,
      required: true,
      trim: true
    },
    bolsa: {
      type: Number,
      min: 0,
      required: true
    },
    cargaHoraria: {
      type: Number,
      min: 1,
      max: 40,
      required: true
    },
    localizacao: {
      type: String,
      required: true,
      trim: true
    },
    planoAtividasdes: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PlanoAtividades',
      required: true
      
    },
    cursosCompativeis: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Curso',
        required: true
      }
    ],
    campus: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Campus',
      required: true
    },
    prazo: {
      type: Date,
      required: true
    },
    dataPublicacao: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: [
        'PENDENTE_VALIDACAO',
        'ABERTA',
        'FECHADA',
        'REPROVADA',
        'CANCELADA'
      ],
      default: 'PENDENTE_VALIDACAO'
    },
    justificativaValidacao: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model('Vaga', schema);