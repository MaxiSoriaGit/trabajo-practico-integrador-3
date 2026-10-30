import { matchedData } from 'express-validator';
import User from '../models/user.model.js';
import Event from '../models/event.model.js';

export const listarUsers = async (req, res) => {
  try {
    const users = await User.find({ deletedAt: null }).populate('events');
    res.status(200).json({ ok: true, data: users });
  } catch (error) {
    res.status(500).json({
      ok: false,
      mensaje: 'Error al listar los usuarios',
      error: error.message,
    });
  }
};

export const obtenerUser = async (req, res) => {
  try {
    const { id } = matchedData(req);
    const user = await User.findOne({ _id: id, deletedAt: null }).populate(
      'events',
    );
    if (!user) {
      return res
        .status(404)
        .json({ ok: false, mensaje: 'Usuario no encontrado' });
    }
    res.status(200).json({ ok: true, data: user });
  } catch (error) {
    res.status(500).json({
      ok: false,
      mensaje: 'Error al obtener el usuario',
      error: error.message,
    });
  }
};

export const actualizarUser = async (req, res) => {
  try {
    const { id, profile, ...resto } = matchedData(req);

    // El profile se actualiza campo por campo para no pisar los demás
    const cambios = { ...resto };
    for (const [campo, valor] of Object.entries(profile ?? {})) {
      if (valor !== undefined) cambios[`profile.${campo}`] = valor;
    }
    if (Object.keys(cambios).length === 0) {
      return res
        .status(400)
        .json({
          ok: false,
          mensaje: 'No enviaste ningún dato para actualizar',
        });
    }

    const user = await User.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { $set: cambios },
      { returnDocument: 'after', runValidators: true },
    );
    if (!user) {
      return res
        .status(404)
        .json({ ok: false, mensaje: 'Usuario no encontrado' });
    }
    res.status(200).json({
      ok: true,
      mensaje: 'Usuario actualizado correctamente',
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      mensaje: 'Error al actualizar el usuario',
      error: error.message,
    });
  }
};

export const eliminarUser = async (req, res) => {
  try {
    const { id } = matchedData(req);
    const user = await User.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { deletedAt: new Date() }, // eliminación lógica
      { returnDocument: 'after' },
    );
    if (!user) {
      return res
        .status(404)
        .json({ ok: false, mensaje: 'Usuario no encontrado' });
    }

    // Cascada: eliminación física de todos los eventos que organizó
    await Event.deleteMany({ organizer: id });

    res.status(200).json({
      ok: true,
      mensaje: 'Usuario eliminado correctamente junto con sus eventos',
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      mensaje: 'Error al eliminar el usuario',
      error: error.message,
    });
  }
};
