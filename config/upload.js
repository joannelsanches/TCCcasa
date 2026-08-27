import multer from 'multer';
import { mkdirSync } from 'fs';
import { extname, join } from 'path';
import { randomUUID } from 'crypto';

function criarUpload(pasta) {
  const destino = join(process.cwd(), 'uploads', pasta);
  mkdirSync(destino, { recursive: true });
  return multer({
    storage: multer.diskStorage({
      destination: destino,
      filename: (req, arquivo, cb) => cb(null, `${randomUUID()}${extname(arquivo.originalname).toLowerCase()}`)
    }),
    limits: { fileSize: Number(process.env.LIMITE_PDF_MB || 5) * 1024 * 1024 },
    fileFilter: (req, arquivo, cb) => {
      const pdf = arquivo.mimetype === 'application/pdf' && extname(arquivo.originalname).toLowerCase() === '.pdf';
      cb(pdf ? null : new Error('Envie somente arquivos PDF.'), pdf);
    }
  });
}

export const uploadCurriculo = criarUpload('curriculos');
export const uploadDocumento = criarUpload('documentos');
