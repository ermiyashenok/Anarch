import express from 'express';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env as early as possible
dotenv.config();

const app = express();
app.use(express.json());

// Start server after loading handlers so env vars are available to them
async function startServer() {
  try {
    console.log('Loading handlers...');
    // Import serverless handlers dynamically so dotenv has already run
    const { default: authHandler } = await import('./api/auth');
    console.log('✓ Auth handler loaded');
    const { default: watchlistHandler } = await import('./api/watchlist');
    console.log('✓ Watchlist handler loaded');
    const { default: historyHandler } = await import('./api/history');
    console.log('✓ History handler loaded');
    const { default: usersHandler } = await import('./api/users');
    console.log('✓ Users handler loaded');

    // Helper to adapt express req/res to Vercel's signature
    function adaptHandler(handler: any) {
      return async (req: express.Request, res: express.Response) => {
        try {
          const vercelReq = req as any;
          vercelReq.query = req.query;
          const vercelRes = res as any;

          console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
          await handler(vercelReq, vercelRes);
        } catch (err: any) {
          console.error('Error in API handler:', err);
          if (!res.headersSent) {
            res.status(500).json({ error: err.message || 'Internal server error' });
          }
        }
      };
    }

    // Setup endpoints
    app.all('/api/auth', adaptHandler(authHandler));
    app.all('/api/watchlist', adaptHandler(watchlistHandler));
    app.all('/api/history', adaptHandler(historyHandler));
    app.all('/api/users', adaptHandler(usersHandler));

    const PORT = 3001;
    const server = app.listen(PORT, () => {
      console.log(`\n🚀 Backend dev API server running at http://localhost:${PORT}\n`);
    });

    // Catch unhandled errors
    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    });

    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error);
      process.exit(1);
    });
  } catch (error) {
    console.error('Error during startup:', error);
    process.exit(1);
  }
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
