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
  return app(req as any, res as any);
}
