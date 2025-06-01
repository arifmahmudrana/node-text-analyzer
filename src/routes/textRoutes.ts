import { Router } from 'express';
import { validateRequest } from '../middlewares/validation';
import { createTextSchema } from '../validations/textValidation';
import { createText, getTextById } from '../controllers/textController';

const router = Router();

// Create a new text
router.post('/', validateRequest(createTextSchema), createText);

// Get text by ID (only returns texts where done: true)
router.get('/:id', getTextById);

export default router;
