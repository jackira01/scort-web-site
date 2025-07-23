import { Router } from 'express';
import * as controller from './attribute-group.controller';

const router = Router();

router.post('/', controller.create);
router.get('/', controller.list);
router.get('/:key', controller.getByKey);
router.patch('/variant', controller.patchVariant);

export default router;
