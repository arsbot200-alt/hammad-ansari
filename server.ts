import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import apiApp from './api/index';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const UPLOADS_DIR = path.resolve(__dirname, 'uploads');

async function startServer() {
  const app = express();

  // Mount API router (No mock/demo seed data, 100% real-time user uploads)
  app.use(apiApp);

  // Dev vs Prod Vite Integration
  const isProduction = process.env.NODE_ENV === 'production';
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[DumpPix Engine] Server running on http://0.0.0.0:${PORT}`);
    console.log(`[DumpPix Engine] Uploads directory: ${UPLOADS_DIR}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
