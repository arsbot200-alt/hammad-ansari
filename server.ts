import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import apiApp from './api/index';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const UPLOADS_DIR = path.resolve(__dirname, 'uploads');

async function startServer() {
  const app = express();

  // Mount API router
  app.use(apiApp);

  const distPath = path.resolve(__dirname, 'dist');
  const hasDist = fs.existsSync(path.resolve(distPath, 'index.html'));

  if (hasDist) {
    console.log('[Gallery Engine] Serving production build from dist/');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  } else {
    console.log('[Gallery Engine] dist/ not found, mounting live Vite middleware server...');
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Gallery Engine] Server running on http://0.0.0.0:${PORT}`);
    console.log(`[Gallery Engine] Uploads directory: ${UPLOADS_DIR}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
