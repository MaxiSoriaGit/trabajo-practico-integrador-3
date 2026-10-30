import { Router } from 'express';
import {
  crearCategory,
  listarCategories,
  obtenerCategory,
  actualizarCategory,
  eliminarCategory,
} from '../controllers/category.controller.js';
import { validarCampos } from '../middlewares/validarCampos.js';
import { validarId } from '../middlewares/validarId.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { adminMiddleware } from '../middlewares/admin.middleware.js';
import {
  validarCrearCategory,
  validarActualizarCategory,
} from '../middlewares/category.validator.js';

const router = Router();

router.post(
  '/',
  authMiddleware,
  adminMiddleware,
  validarCrearCategory,
  validarCampos,
  crearCategory,
);
router.get('/', authMiddleware, listarCategories);
router.get('/:id', authMiddleware, validarId, validarCampos, obtenerCategory);
router.put(
  '/:id',
  authMiddleware,
  adminMiddleware,
  validarId,
  validarActualizarCategory,
  validarCampos,
  actualizarCategory,
);
router.delete(
  '/:id',
  authMiddleware,
  adminMiddleware,
  validarId,
  validarCampos,
  eliminarCategory,
);

export default router;
