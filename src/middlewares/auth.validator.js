import { body } from 'express-validator';
import User from '../models/user.model.js';

const soloLetras = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]+$/;

const nombreRules = (ruta, etiqueta, obligatorio) => {
  const campo = obligatorio ? body(ruta) : body(ruta).optional();
  return campo
    .trim()
    .notEmpty()
    .withMessage(`${etiqueta} es obligatorio`)
    .isLength({ min: 2, max: 50 })
    .withMessage(`${etiqueta} debe tener entre 2 y 50 caracteres`)
    .matches(soloLetras)
    .withMessage(`${etiqueta} solo puede contener letras`);
};

const profileOpcionales = [
  body('profile.birthDate')
    .optional({ values: 'falsy' })
    .isISO8601()
    .withMessage('la fecha de nacimiento no es valida')
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
    .withMessage('El telefono debe tener solo numeros(entre 8 y 15 digitos'),
];

// "role" NO se valida acá a propósito: matchedData lo descarta,
// así nadie puede registrarse como admin
export const validarRegister = [
  body('username')
    .trim()
    .notEmpty()
    .withMessage('el username es obligatorio')
    .isLength({ min: 3, max: 20 })
    .withMessage('El username debe tener entre 3 y 20 caracteres')
    .isAlphanumeric()
    .withMessage('El username solo puede tener letras y numeros')
    .bail()
    .custom(async (username) => {
      const existe = await User.exists({ username });
      if (existe) throw new Error('Ese username ya esta en uso');
    }),
  body('email')
    .trim()
    .toLowerCase()
    .notEmpty()
    .withMessage('el email es obligatorio')
    .isEmail()
    .withMessage('El email no es valido')
    .bail()
    .custom(async (email) => {
      const existe = await User.exists({ email });
      if (existe) throw new Error('Ya existe un usuario con ese email');
    }),
  body('password')
    .notEmpty()
    .withMessage('La contraseña es obligatoria')
    .isStrongPassword({
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 0,
    })
    .withMessage(
      'La contraseña debe tener minimo 8 caracteres, una mayuscula , una minuscula y un numero',
    ),
  nombreRules('profile.firstName', 'El nombre', true),
  nombreRules('profile.lastName', 'El apellido', true),
  ...profileOpcionales,
];

export const validarLogin = [
  body('email')
    .trim()
    .toLowerCase()
    .notEmpty()
    .withMessage('El email es obligatorio')
    .isEmail()
    .withMessage('El email no es valido'),
  body('password').notEmpty().withMessage('La contraseña es obligatoria'),
];

export const validarActualizarPerfil = [
  nombreRules('profile.firstName', 'El nombre', false),
  nombreRules('profile.lastName', 'El apellido', false),
  ...profileOpcionales,
];
