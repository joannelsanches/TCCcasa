import mongoose from '../config/conexao.js';

const schema = new mongoose.Schema(
  {
    nome: {
      type: String,
      required: true,
      trim: true
    },

    nivel: {
      type: String,
      enum: [
        'TÉCNICO',
        'SUPERIOR',
        'PÓS-GRADUAÇÃO'
      ],
      required: true
    },

    campus: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Campus',
      required: true
    },

    areasRelacionadas: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AreaAtuacao'
      }
    ],

    ativo: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

schema.index(
  { nome: 1, campus: 1 },
  { unique: true }
);

export default mongoose.model('Curso', schema);