import 'dotenv/config';
import { createApp } from './app.js';
import { env } from './config/env.js';
import { connectDatabase, disconnectDatabase } from './lib/prisma.js';

async function main() {
  // Connect to database
  await connectDatabase();

  const app = createApp();

  const server = app.listen(env.PORT, () => {
    console.log(`
🚀 Campaign Amplification API Server
   ├─ Environment: ${env.NODE_ENV}
   ├─ Port:        ${env.PORT}
   ├─ Health:      http://localhost:${env.PORT}/health
   ├─ Ready:       http://localhost:${env.PORT}/ready
   └─ API:         http://localhost:${env.PORT}/api/v1
    `);
  });

  // ─── Graceful Shutdown ──────────────────────────────────────────────────────

  const shutdown = async (signal: string) => {
    console.log(`\n⏳ ${signal} received. Shutting down gracefully...`);

    server.close(async () => {
      await disconnectDatabase();
      console.log('👋 Server shut down');
      process.exit(0);
    });

    // Force shutdown after 10 seconds
    setTimeout(() => {
      console.error('⚠️ Forced shutdown after timeout');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // Handle uncaught exceptions
  process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err.message);
    shutdown('uncaughtException');
  });

  process.on('unhandledRejection', (reason) => {
    console.error('Unhandled Rejection:', reason);
  });
}

main().catch((err) => {
  console.error('❌ Failed to start server:', err);
  process.exit(1);
});
