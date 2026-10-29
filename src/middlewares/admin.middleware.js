export const adminMiddleware = (req, res, next) => {
  if (!req.user.role !== 'admin') {
    return res.status(403).json({
      ok: false,
      mensaje: 'Acceso denegado: se requiere el rol del admin',
    });
  }
  next();
};
