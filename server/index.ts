import 'dotenv/config';
import express from 'express';
import rateLimit from 'express-rate-limit';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { generate, inputSchema } from './generator';

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '24kb' }));

app.get('/api/health', (_req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.json({ ok: true, mode: process.env.OPENAI_API_KEY?.trim() ? 'live' : 'demo' });
});

const generationLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: 'draft-7', legacyHeaders: false, message: { error: 'Too many requests. Please try again later.' } });

app.post('/api/generate', generationLimiter, async (req, res) => {
  const validation = inputSchema.safeParse(req.body);
  if (!validation.success) {
    res.status(400).json({ error: validation.error.issues[0]?.message || 'Invalid input.' });
    return;
  }
  try {
    const result = await generate(validation.data);
    res.setHeader('Cache-Control', 'no-store');
    res.json(result);
  } catch (error) {
    // Never expose credentials, raw upstream error messages, or user post text in errors.
    console.error('Generation failed:', error instanceof Error ? error.name : 'Unknown error');
    res.status(502).json({ error: 'Could not generate comments right now. Check your API configuration and try again.' });
  }
});

if (process.env.NODE_ENV === 'production') {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  app.use(express.static(path.join(root, 'dist')));
  app.get('*', (_req, res) => res.sendFile(path.join(root, 'dist', 'index.html')));
}

const port = Number(process.env.PORT) || 8787;
app.listen(port, '0.0.0.0', () => {
  console.log(`Threadcraft API listening on http://localhost:${port} (${process.env.OPENAI_API_KEY?.trim() ? 'live' : 'demo'} mode)`);
});
