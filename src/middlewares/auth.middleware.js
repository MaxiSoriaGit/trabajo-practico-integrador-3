import User from '../models/user.model.js';
import { verificarToken } from '../helpers/jwt.helper.js';

export const authMiddleware = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res
        .status(401)
        .json({ ok: false, mensaje: 'No autenticado: falta el token' });
    }

    const decoded = verificarToken(token);
    const user = await User.findOne({ _id: decoded.id, deletedAt: null });
    if (!user) {
      return res
        .status(401)
        .json({ ok: false, mensaje: 'El usuario ya no existe' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res
      .status(401)
      .json({ ok: false, mensaje: 'Token inválido o vencido' });
  }
};
