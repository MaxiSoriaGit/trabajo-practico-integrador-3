import { body } from 'express-validator';
import User from '../models/user.model.js';

const soloLetras = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]+$/;

const nombreRules = (ruta, etiqueta) =>
  body(ruta)
    .optional()
    .trim()
    .notEmpty()
    .withMessage(`${etiqueta} no puede estar vacío`)
    .isLength({ min: 2, max: 50 })
    .withMessage(`${etiqueta} debe tener entre 2 y 50 caracteres`)
    .matches(soloLetras)
    .withMessage(`${etiqueta} solo puede contener letras`);

export const validarActualizarUser = [
  body('username')
    .optional()
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage('El username debe tener entre 3 y 20 caracteres')
    .isAlphanumeric()
    .withMessage('El username solo puede tener letras y números')
    .bail()
    .custom(async (username, { req }) => {
      // Sin filtrar por deletedAt: el unique de MongoDB también cuenta a los eliminados
      const existe = await User.exists({
        username,
        _id: { $ne: req.params.id },
      });
      if (existe) throw new Error('Ese username ya está en uso');
    }),
  body('email')
    .optional()
    .trim()
    .toLowerCase()
    .isEmail()
    .withMessage('El email no es válido')
    .bail()
    .custom(async (email, { req }) => {
      const existe = await User.exists({
        email,
        _id: { $ne: req.params.id },
      });
      if (existe) throw new Error('Ya existe un usuario con ese email');
    }),
  body('role')
    .optional()
    .isIn(['user', 'admin'])
    .withMessage("El rol debe ser 'user' o 'admin'"),
  nombreRules('profile.firstName', 'El nombre'),
  nombreRules('profile.lastName', 'El apellido'),
  body('profile.birthDate')
    .optional()
    .isISO8601()
    .withMessage('La fecha de nacimiento no es válida')
    .bail()
    .custom((valor) => {
      if (new Date(valor) > new Date()) {
        throw new Error('La fecha de nacimiento no puede ser futura');
      }
      return true;
    }),
  body('profile.phone')
    .optional()
    .matches(/^\d{8,15}$/)
    .withMessage('El teléfono debe tener solo números (entre 8 y 15 dígitos)'),
];
