import mongoose from '../config/conexao.js';

const schema = new mongoose.Schema(
  {
    empresa: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Empresa',
      required: true
    },

    numero: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },

    dataInicial: {
      type: Date,
      required: true
    },

    dataFinal: {
      type: Date,
      required: true
    },

    status: {
      type: String,
      enum: ['PENDENTE', 'ATIVO', 'INATIVO', 'VENCIDO'],
      default: 'PENDENTE'
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model('Convenio', schema);