import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { createApp } from './src/server/app.js';
import { connectDatabase } from './src/server/config/database.js';
import { env } from './src/server/config/environment.js';

async function startServer() {
  const PORT = env.PORT || 3000;

  // 1. Initialize MongoDB / Database engine
  await connectDatabase();

  // 2. Build configured Express App with complete REST API routes
  const app = createApp();

  // 3. Vite Middleware for Development / Static SPA serving for Production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // 4. Start HTTP Server
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`====================================================`);
    console.log(`   VERIFAI GH — USER BACKEND API SERVER RUNNING    `);
    console.log(`   Tagline: "Check Before You Share."               `);
    console.log(`   Listening on: http://0.0.0.0:${PORT}            `);
    console.log(`   Health Check: http://0.0.0.0:${PORT}/api/health `);
    console.log(`====================================================`);
  });
}

startServer().catch((err) => {
  console.error('[VERIFAI Server] Fatal startup failure:', err);
  process.exit(1);
});
