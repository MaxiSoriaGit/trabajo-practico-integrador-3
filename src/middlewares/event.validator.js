import { body } from 'express-validator';
import Event from '../models/event.model.js';
import Category from '../models/category.model.js';

const ESTADOS = ['scheduled', 'cancelled', 'finished'];
const esObjectId = (valor) =>
  typeof valor === 'string' && /^[0-9a-fA-F]{24}$/.test(valor);

const reglasCategories = () =>
  body('categories')
    .optional()
    .isArray()
    .withMessage('Las categorías deben enviarse en un array')
    .bail()
    .custom((categories) => {
      if (!categories.every(esObjectId))
        throw new Error(
          'Todos los IDs de categorías deben ser ObjectId válidos',
        );
      if (new Set(categories).size !== categories.length)
        throw new Error('Hay categorías repetidas en el array');
      return true;
    })
    .bail()
    .custom(async (categories) => {
      const cantidad = await Category.countDocuments({
        _id: { $in: categories },
      });
      if (cantidad !== categories.length)
        throw new Error('Alguna de las categorías no existe');
    });

export const validarCrearEvent = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('El título es obligatorio')
    .isLength({ min: 3, max: 150 })
    .withMessage('El título debe tener entre 3 y 150 caracteres')
    .bail()
    .custom(async (title) => {
      const existe = await Event.exists({ title });
      if (existe) throw new Error('Ya existe un evento con ese título');
    }),
  body('description')
    .trim()
    .notEmpty()
    .withMessage('La descripción es obligatoria')
    .isLength({ min: 20 })
    .withMessage('La descripción debe tener al menos 20 caracteres'),
  body('startDate')
    .notEmpty()
    .withMessage('La fecha de inicio es obligatoria')
    .isISO8601()
    .withMessage('La fecha de inicio no es válida'),
  body('endDate')
    .notEmpty()
    .withMessage('La fecha de fin es obligatoria')
    .isISO8601()
    .withMessage('La fecha de fin no es válida')
    .bail()
    .custom((endDate, { req }) => {
      if (
        req.body.startDate &&
        new Date(endDate) <= new Date(req.body.startDate)
      ) {
        throw new Error('La fecha de fin debe ser posterior a la de inicio');
      }
      return true;
    }),
  body('capacity')
    .notEmpty()
    .withMessage('La capacidad es obligatoria')
    .isInt({ min: 1 })
    .withMessage('La capacidad debe ser un entero mayor o igual a 1')
    .toInt(),
  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('El precio debe ser un número mayor o igual a 0')
    .toFloat(),
  body('status')
    .optional()
    .isIn(ESTADOS)
    .withMessage(`El estado debe ser uno de: ${ESTADOS.join(', ')}`),
  body('location.venue')
    .trim()
    .notEmpty()
    .withMessage('El lugar (venue) es obligatorio')
    .isLength({ min: 3, max: 100 })
    .withMessage('El venue debe tener entre 3 y 100 caracteres'),
  body('location.address')
    .trim()
    .notEmpty()
    .withMessage('La dirección es obligatoria')
    .isLength({ min: 5, max: 150 })
    .withMessage('La dirección debe tener entre 5 y 150 caracteres'),
  body('location.city')
    .trim()
    .notEmpty()
    .withMessage('La ciudad es obligatoria')
    .isLength({ min: 2, max: 50 })
    .withMessage('La ciudad debe tener entre 2 y 50 caracteres'),
  reglasCategories(),
];

// Se usa DESPUÉS de ownerOrAdminMiddleware, que deja el evento en req.event
export const validarActualizarEvent = [
  body('title')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('El título no puede estar vacío')
    .isLength({ min: 3, max: 150 })
    .withMessage('El título debe tener entre 3 y 150 caracteres')
    .bail()
    .custom(async (title, { req }) => {
      const existe = await Event.exists({
        title,
        _id: { $ne: req.params.id },
      });
      if (existe) throw new Error('Ya existe un evento con ese título');
    }),
  body('description')
    .optional()
    .trim()
    .isLength({ min: 20 })
    .withMessage('La descripción debe tener al menos 20 caracteres'),
  body('startDate')
    .optional()
    .isISO8601()
    .withMessage('La fecha de inicio no es válida')
    .bail()
    .custom((startDate, { req }) => {
      if (req.body.endDate) return true; // se compara en el validador de endDate
      if (new Date(startDate) >= new Date(req.event.endDate)) {
        throw new Error('La fecha de inicio debe ser anterior a la de fin');
      }
      return true;
    }),
  body('endDate')
    .optional()
    .isISO8601()
    .withMessage('La fecha de fin no es válida')
    .bail()
    .custom((endDate, { req }) => {
      const inicio = req.body.startDate ?? req.event.startDate;
      if (new Date(endDate) <= new Date(inicio)) {
        throw new Error('La fecha de fin debe ser posterior a la de inicio');
      }
      return true;
    }),
  body('capacity')
    .optional()
    .isInt({ min: 1 })
    .withMessage('La capacidad debe ser un entero mayor o igual a 1')
    .toInt(),
  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('El precio debe ser un número mayor o igual a 0')
    .toFloat(),
  body('status')
    .optional()
    .isIn(ESTADOS)
    .withMessage(`El estado debe ser uno de: ${ESTADOS.join(', ')}`),
  body('location.venue')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('El venue no puede estar vacío')
    .isLength({ min: 3, max: 100 })
    .withMessage('El venue debe tener entre 3 y 100 caracteres'),
  body('location.address')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('La dirección no puede estar vacía')
    .isLength({ min: 5, max: 150 })
    .withMessage('La dirección debe tener entre 5 y 150 caracteres'),
  body('location.city')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('La ciudad no puede estar vacía')
    .isLength({ min: 2, max: 50 })
    .withMessage('La ciudad debe tener entre 2 y 50 caracteres'),
  reglasCategories(),
];
