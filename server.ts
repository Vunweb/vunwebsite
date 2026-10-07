import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { handleApiRequest } from './server/apiRouter';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));

// Rotas da API
app.all('/api/*', async (req, res) => {
  const result = await handleApiRequest(req.url, req.method, req.body, req.headers);
  res.status(result.status).json(result.data);
});

// Arquivos estáticos em produção
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor Vunweb Lead Finder rodando na porta ${PORT}`);
});
