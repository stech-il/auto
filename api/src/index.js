import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { buildRouter } from './routes/build.js';
import { licenseRouter } from './routes/license.js';

dotenv.config();

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

app.listen(PORT, () => {
  console.log(`WP AI Builder API running on port ${PORT}`);
});
