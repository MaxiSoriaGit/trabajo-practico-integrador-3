import Event from '../models/event.model.js';

export const ownerOrAdminMiddleware = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res
        .status(404)
        .json({ ok: false, mensaje: 'Evento no encontrado' });
    }

    const esOrganizador =
      event.organizer.toString() === req.user._id.toString();
    if (!esOrganizador && req.user.role !== 'admin') {
      return res.status(403).json({
        ok: false,
        mensaje: 'Solo el organizador o un admin puede hacer esto',
      });
    }

    req.event = event;
    next();
  } catch (error) {
    res.status(500).json({
      ok: false,
      mensaje: 'Error al verificar permisos',
      error: error.message,
    });
  }
};
