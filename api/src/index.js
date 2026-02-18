import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { buildRouter } from './routes/build.js';
import { licenseRouter } from './routes/license.js';
import { adminRouter } from './routes/admin.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Root - friendly response
app.get('/', (req, res) => {
  res.json({
    service: 'WP AI Site Builder API',
    status: 'running',
    endpoints: { health: '/health', build: 'POST /api/build', license: 'POST /api/license/validate' },
  });
});

// Health check for Render
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'wp-ai-builder' });
});

app.use('/api/license', licenseRouter);
app.use('/api/build', buildRouter);
app.use('/api/admin', adminRouter);

// Admin panel UI
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'admin.html'));
});

app.listen(PORT, () => {
  console.log(`WP AI Builder API running on port ${PORT}`);
});
