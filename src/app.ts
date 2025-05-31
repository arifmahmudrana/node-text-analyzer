import express from 'express';
import textRoutes from './routes/textRoutes';
import { errorHandler } from './middlewares/errorHandler';
import { ApiResponse } from './types';

const app = express();

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/texts', textRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  const response: ApiResponse = {
    success: true,
    message: 'API is running successfully',
    data: {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    }
  };
  res.json(response);
});

// Error handling middleware
app.use(errorHandler);

export default app;
