import { createApp } from '../src/app.js';
import { connectDatabase } from '../src/lib/prisma.js';
import type { IncomingMessage, ServerResponse } from 'http';

let isDbConnected = false;
const app = createApp();

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (!isDbConnected) {
    await connectDatabase();
    isDbConnected = true;
  }

  // Restore the original requested URL if Vercel rewrote it to /api
  const originalUrl = (req.headers['x-forwarded-url'] || req.headers['x-original-url']) as string | undefined;
  if (originalUrl) {
    req.url = originalUrl;
  }

  return app(req as any, res as any);
}
