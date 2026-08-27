import mongoose from '../config/conexao.js';

const schema = new mongoose.Schema({
    estudante: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Estudante',
      required: true
    },
    vaga: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vaga',
      required: true
    },
    dataCandidatura: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: [
        'EM_ANALISE',
        'SELECIONADO',
        'NAO_SELECIONADO',
        'CANCELADO'
      ],
      default: 'EM_ANALISE'
    },
    observacaoEmpresa: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

schema.index(
  { estudante: 1, vaga: 1 },
  { unique: true }
);

export default mongoose.model('Candidatura', schema);