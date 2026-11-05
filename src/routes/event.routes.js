import { Router } from 'express';
import {
  crearEvent,
  listarEvents,
  listarMisEvents,
  obtenerEvent,
  actualizarEvent,
  eliminarEvent,
} from '../controllers/event.controller.js';
import { validarCampos } from '../middlewares/validarCampos.js';
import { validarId } from '../middlewares/validarId.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { ownerOrAdminMiddleware } from '../middlewares/ownerOrAdmin.middleware.js';
import {
  validarCrearEvent,
  validarActualizarEvent,
} from '../middlewares/event.validator.js';

const router = Router();

router.use(authMiddleware); // todas las rutas de eventos requieren login

router.post('/', validarCrearEvent, validarCampos, crearEvent);
router.get('/', listarEvents);
router.get('/my', listarMisEvents); // SIEMPRE antes de "/:id"
router.get('/:id', validarId, validarCampos, obtenerEvent);
router.put(
  '/:id',
  validarId,
  validarCampos,
  ownerOrAdminMiddleware,
  validarActualizarEvent,
  validarCampos,
  actualizarEvent,
);
router.delete(
  '/:id',
  validarId,
  validarCampos,
  ownerOrAdminMiddleware,
  eliminarEvent,
);

export default router;
