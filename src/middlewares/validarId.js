import { body } from 'express-validator';
import Category from '../models/category.model.js';
import { param } from 'express-validator';

export const validarCrearCategory = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('El nombre es obligatorio')
    .isString()
    .withMessage('El nombre debe ser texto')
    .isLength({ min: 2, max: 30 })
    .withMessage('El nombre debe tener entre 2 y 30 caracteres')
    .bail()
    .custom(async (name) => {
      const existe = await Category.exists({ name });
      if (existe) throw new Error('Ya existe una categoría con ese nombre');
    }),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('La descripción no puede superar los 200 caracteres'),
];

export const validarActualizarCategory = [
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('El nombre no puede estar vacío')
    .isLength({ min: 2, max: 30 })
    .withMessage('El nombre debe tener entre 2 y 30 caracteres')
    .bail()
    .custom(async (name, { req }) => {
      const existe = await Category.exists({
        name,
        _id: { $ne: req.params.id }, // ignora a la propia categoría
      });
      if (existe) throw new Error('Ya existe una categoría con ese nombre');
    }),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('La descripción no puede superar los 200 caracteres'),
];

export const validarId = [
  param('id').isMongoId().withMessage('El ID no es un ObjectId válido'),
];
