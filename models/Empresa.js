import mongoose from '../config/conexao.js';

const schema = new mongoose.Schema({
    usuario: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario',
      required: true,
      unique: true
    },

    cnpj: {
      type: String,
      required: true,
      unique: true
    },

    razaoSocial: {
      type: String,
      required: true,
      trim: true
    },

    nomeFantasia: {
      type: String,
      required: true,
      trim: true
    },

    endereco: {
      type: String,
      required: true,
      trim: true
    },

    telefone: {
      type: String,
      required: true,
      trim: true
    },

    emailContato: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },

    responsavel: {
      nome: {
        type: String,
        required: true
      },

      cargo: {
        type: String,
        required: true
      }
    },

    descricao: {
      type: String,
      trim: true
    },

    statusCadastro: {
      type: String,
      enum: [
        'PENDENTE',
        'APROVADO',
        'REPROVADO'
      ],
      default: 'PENDENTE'
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model('Empresa', schema);