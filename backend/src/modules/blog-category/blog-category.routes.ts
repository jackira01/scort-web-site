import { Router } from 'express';
import { BlogCategoryController } from './blog-category.controller';
import { authenticate, authorize } from '../../middlewares/auth.middleware';

const router = Router();

// Public routes
router.get('/', BlogCategoryController.getAll);
router.get('/:id', BlogCategoryController.getOne);

// Protected routes (Admin only)
router.post('/', authenticate, authorize(['admin']), BlogCategoryController.create);
router.put('/:id', authenticate, authorize(['admin']), BlogCategoryController.update);
router.delete('/:id', authenticate, authorize(['admin']), BlogCategoryController.delete);

export default router;
