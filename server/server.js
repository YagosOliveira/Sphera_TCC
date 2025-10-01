import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import fs from 'fs';
import url from 'url';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

// Config
const PORT = process.env.PORT || 3000;
const STATIC_DIR = process.env.STATIC_DIR
  ? path.resolve(__dirname, process.env.STATIC_DIR)
  : path.resolve(__dirname, '../TCC');

// Middlewares
app.use(morgan('dev'));
app.use(cors());
app.use(express.json());

// Static files (serve seu index.html, app.js, style.css)
app.use('/', express.static(STATIC_DIR));

// Exemplo de API: health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Exemplo de API: receber feedback (salva em data/feedback.json)
const feedbackFile = path.join(__dirname, 'data', 'feedback.json');

function readFeedbacks() {
  try {
    const raw = fs.readFileSync(feedbackFile, 'utf-8');
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

function writeFeedbacks(items) {
  fs.writeFileSync(feedbackFile, JSON.stringify(items, null, 2), 'utf-8');
}

app.get('/api/feedback', (req, res) => {
  res.json(readFeedbacks());
});

app.post('/api/feedback', (req, res) => {
  const { name, message } = req.body || {}
  if (!name || !message) {
    return res.status(400).json({ error: 'Campos name e message são obrigatórios.' });
  }
  const items = readFeedbacks();
  const item = { id: Date.now(), name, message, createdAt: new Date().toISOString() };
  items.push(item);
  writeFeedbacks(items);
  res.status(201).json(item);
});

// Rota fallback para SPA simples (se necessário). Comente se não for preciso.
// app.get('*', (req, res) => {
//   res.sendFile(path.join(STATIC_DIR, 'index.html'));
// });

app.listen(PORT, () => {
  console.log(`🚀 Server rodando em http://localhost:${PORT}`);
  console.log(`📦 Servindo estáticos de: ${STATIC_DIR}`);
});
