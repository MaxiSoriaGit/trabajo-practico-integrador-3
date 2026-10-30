import { Router } from 'express';
import {
  listarUsers,
  obtenerUser,
  actualizarUser,
  eliminarUser,
} from '../controllers/user.controller.js';
import { validarCampos } from '../middlewares/validarCampos.js';
import { validarId } from '../middlewares/validarId.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { adminMiddleware } from '../middlewares/admin.middleware.js';
import { validarActualizarUser } from '../middlewares/user.validator.js';

const router = Router();

router.use(authMiddleware, adminMiddleware); // todo este router es solo admin

router.get('/', listarUsers);
router.get('/:id', validarId, validarCampos, obtenerUser);
router.put(
  '/:id',
  validarId,
  validarActualizarUser,
  validarCampos,
  actualizarUser,
);
router.delete('/:id', validarId, validarCampos, eliminarUser);

export default router;
