import mongoose from '../config/conexao.js';

const schema = new mongoose.Schema({
    candidatura: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Candidatura',
      required: true,
      unique: true
    },
    estudante: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Estudante',
      required: true
    },
    empresa: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Empresa',
      required: true
    },
    planoAtividades: {
      type: String,
      required: true,
      trim: true
    },
    documentos: [
      {
        nome: String,

        nomeOriginal: String,

        caminho: String,

        validado: {
          type: Boolean,
          default: false
        }
      }
    ],
    dataSolicitacao: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: [
        'PENDENTE',
        'APROVADO',
        'REPROVADO'
      ],
      default: 'PENDENTE'
    },
    justificativa: {
      type: String,
      trim: true
    },
    dataAprovacao: Date
  },
  {
    timestamps: true
  }
);

export default mongoose.model('TermoCompromisso', schema);