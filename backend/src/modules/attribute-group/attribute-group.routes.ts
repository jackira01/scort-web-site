import { Router } from 'express';
import * as controller from './attribute-group.controller';

const router = Router();

router.post('/', controller.create);
router.get('/', controller.list);
router.get('/:key', controller.getByKey);
router.patch('/variant', controller.patchVariant);
router.delete('/:id', controller.deleteGroup);
router.post('/:id/variants', controller.addVariant);
router.delete('/:id/variants', controller.removeVariant);
router.patch('/:id', controller.updateGroup);

export default router;
