import express from 'express';
import { errorHandler } from './middlewares/errorHandler';

const app = express();

app.use(express.json());

// Global error handler (should be after routes)
app.use(errorHandler);

export default app;