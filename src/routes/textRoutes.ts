import { Router } from 'express';
import { validateRequest } from '../middlewares/validation';
import { createTextSchema } from '../validations/textValidation';
import { createText } from '../controllers/textController';

const router = Router();

// Create a new text
router.post('/', validateRequest(createTextSchema), createText);

export default router;
