import jwt from 'jsonwebtoken';

export const generarToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

export const verificarToken = (token) =>
  jwt.verify(token, process.env.JWT_SECRET);
