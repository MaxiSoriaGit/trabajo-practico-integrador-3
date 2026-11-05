import { matchedData } from 'express-validator';
import Event from '../models/event.model.js';

const populateEvent = (consulta) =>
  consulta
    .populate('organizer', 'username email')
    .populate('categories', 'name');

export const crearEvent = async (req, res) => {
  try {
    const datos = matchedData(req);
    const event = await Event.create({ ...datos, organizer: req.user._id });
    const completo = await populateEvent(Event.findById(event._id));
    res.status(201).json({
      ok: true,
      mensaje: 'Evento creado correctamente',
      data: completo,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      mensaje: 'Error al crear el evento',
      error: error.message,
    });
  }
};

export const listarEvents = async (req, res) => {
  try {
    const events = await populateEvent(Event.find());
    res.status(200).json({ ok: true, data: events });
  } catch (error) {
    res.status(500).json({
      ok: false,
      mensaje: 'Error al listar los eventos',
      error: error.message,
    });
  }
};

export const listarMisEvents = async (req, res) => {
  try {
    const events = await populateEvent(Event.find({ organizer: req.user._id }));
    res.status(200).json({ ok: true, data: events });
  } catch (error) {
    res.status(500).json({
      ok: false,
      mensaje: 'Error al listar tus eventos',
      error: error.message,
    });
  }
};

export const obtenerEvent = async (req, res) => {
  try {
    const { id } = matchedData(req);
    const event = await populateEvent(Event.findById(id));
    if (!event) {
      return res
        .status(404)
        .json({ ok: false, mensaje: 'Evento no encontrado' });
    }
    res.status(200).json({ ok: true, data: event });
  } catch (error) {
    res.status(500).json({
      ok: false,
      mensaje: 'Error al obtener el evento',
      error: error.message,
    });
  }
};

export const actualizarEvent = async (req, res) => {
  try {
    const { id, location, ...resto } = matchedData(req);

    // La location se actualiza campo por campo para no pisar los demás
    const cambios = { ...resto };
    for (const [campo, valor] of Object.entries(location ?? {})) {
      if (valor !== undefined) cambios[`location.${campo}`] = valor;
    }
    if (Object.keys(cambios).length === 0) {
      return res.status(400).json({
        ok: false,
        mensaje: 'No enviaste ningún dato para actualizar',
      });
    }

    const event = await populateEvent(
      Event.findByIdAndUpdate(
        id,
        { $set: cambios },
        { returnDocument: 'after', runValidators: true },
      ),
    );
    if (!event) {
      return res
        .status(404)
        .json({ ok: false, mensaje: 'Evento no encontrado' });
    }
    res.status(200).json({
      ok: true,
      mensaje: 'Evento actualizado correctamente',
      data: event,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      mensaje: 'Error al actualizar el evento',
      error: error.message,
    });
  }
};

export const eliminarEvent = async (req, res) => {
  try {
    const { id } = matchedData(req);
    const event = await Event.findByIdAndDelete(id); // eliminación física
    if (!event) {
      return res
        .status(404)
        .json({ ok: false, mensaje: 'Evento no encontrado' });
    }
    res
      .status(200)
      .json({ ok: true, mensaje: 'Evento eliminado correctamente' });
  } catch (error) {
    res.status(500).json({
      ok: false,
      mensaje: 'Error al eliminar el evento',
      error: error.message,
    });
  }
};
