import mongoose from '../config/conexao.js';

const schema = new mongoose.Schema({
    destinatario: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario',
      required: true
    },
    titulo: {
      type: String,
      required: true,
      trim: true
    },
    mensagem: {
      type: String,
      required: true,
      trim: true
    },
    lida: {
      type: Boolean,
      default: false
    },
    data: {
      type: Date,
      default: Date.now
    },
    link: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model('Notificacao', schema);