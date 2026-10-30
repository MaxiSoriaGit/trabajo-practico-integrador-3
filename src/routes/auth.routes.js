import { Router } from 'express';
import {
  registrar,
  login,
  obtenerPerfil,
  actualizarPerfil,
  logout,
} from '../controllers/auth.controller.js';
import { validarCampos } from '../middlewares/validarCampos.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import {
  validarRegister,
  validarLogin,
  validarActualizarPerfil,
} from '../middlewares/auth.validator.js';

const router = Router();

router.post('/register', validarRegister, validarCampos, registrar);
router.post('/login', validarLogin, validarCampos, login);
router.get('/profile', authMiddleware, obtenerPerfil);
router.put(
  '/profile',
  authMiddleware,
  validarActualizarPerfil,
  validarCampos,
  actualizarPerfil,
);
router.post('/logout', authMiddleware, logout);

export default router;
