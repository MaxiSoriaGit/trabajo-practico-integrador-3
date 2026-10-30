import { matchedData } from 'express-validator';
import Category from '../models/category.model.js';
import Event from '../models/event.model.js';

export const crearCategory = async (req, res) => {
  try {
    const datos = matchedData(req);
    const category = await Category.create(datos);
    res.status(201).json({
      ok: true,
      mensaje: 'Categoría creada correctamente',
      data: category,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      mensaje: 'Error al crear la categoría',
      error: error.message,
    });
  }
};

export const listarCategories = async (req, res) => {
  try {
    const categories = await Category.find();
    res.status(200).json({ ok: true, data: categories });
  } catch (error) {
    res.status(500).json({
      ok: false,
      mensaje: 'Error al listar las categorías',
      error: error.message,
    });
  }
};

export const obtenerCategory = async (req, res) => {
  try {
    const { id } = matchedData(req);
    const category = await Category.findById(id).populate({
      path: 'events',
      select: 'title startDate status',
    });
    if (!category) {
      return res
        .status(404)
        .json({ ok: false, mensaje: 'Categoría no encontrada' });
    }
    res.status(200).json({ ok: true, data: category });
  } catch (error) {
    res.status(500).json({
      ok: false,
      mensaje: 'Error al obtener la categoría',
      error: error.message,
    });
  }
};

export const actualizarCategory = async (req, res) => {
  try {
    const { id, ...datos } = matchedData(req);
    const category = await Category.findByIdAndUpdate(id, datos, {
      returnDocument: 'after',
      runValidators: true,
    });
    if (!category) {
      return res
        .status(404)
        .json({ ok: false, mensaje: 'Categoría no encontrada' });
    }
    res.status(200).json({
      ok: true,
      mensaje: 'Categoría actualizada correctamente',
      data: category,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      mensaje: 'Error al actualizar la categoría',
      error: error.message,
    });
  }
};

export const eliminarCategory = async (req, res) => {
  try {
    const { id } = matchedData(req);
    const category = await Category.findByIdAndDelete(id);
    if (!category) {
      return res
        .status(404)
        .json({ ok: false, mensaje: 'Categoría no encontrada' });
    }

    // Cascada: quita la categoría de todos los eventos que la tenían
    await Event.updateMany({ categories: id }, { $pull: { categories: id } });

    res
      .status(200)
      .json({ ok: true, mensaje: 'Categoría eliminada correctamente' });
  } catch (error) {
    res.status(500).json({
      ok: false,
      mensaje: 'Error al eliminar la categoría',
      error: error.message,
    });
  }
};
