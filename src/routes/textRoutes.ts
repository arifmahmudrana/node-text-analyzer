import { Router } from 'express';
import { createText, getTextById, listTexts } from '../controllers/textController';
import { createPaginationMiddleware } from '../middlewares/pagination';

const router = Router();

// Pagination middleware configuration for listTexts
const listTextsPaginationMiddleware = createPaginationMiddleware({
  allowedOrderByFields: ['createdAt', 'updatedAt'],
  defaultLimit: 10,
  maxLimit: 100,
  defaultOrder: 'desc',
  defaultOrderBy: ['createdAt']
});

// Routes
router.post('/', createText); // Create a new text
router.get('/:id', getTextById); // Get text by ID (only returns texts where done: true)
router.get('/', listTextsPaginationMiddleware, listTexts);

export default router;
