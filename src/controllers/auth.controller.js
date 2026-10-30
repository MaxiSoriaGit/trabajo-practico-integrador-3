import { matchedData } from 'express-validator';
import User from '../models/user.model.js';
import { hashPassword, comparePassword } from '../helpers/bcrypt.helper.js';
import { generarToken } from '../helpers/jwt.helper.js';

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
};

export const registrar = async (req, res) => {
  try {
    const { password, ...resto } = matchedData(req);
    const user = await User.create({
      ...resto,
      password: await hashPassword(password),
    });
    res
      .status(201)
      .json({
        ok: true,
        mensaje: 'Usuario registrado correctamente',
        data: user,
      });
  } catch (error) {
    res.status(500).json({
      ok: false,
      mensaje: 'Error al registrar el usuario',
      error: error.message,
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = matchedData(req);
    const user = await User.findOne({ email, deletedAt: null }).select(
      '+password',
    );

    if (!user || !(await comparePassword(password, user.password))) {
      return res
        .status(401)
        .json({ ok: false, mensaje: 'Credenciales inválidas' });
    }

    const token = generarToken({ id: user._id, role: user.role });
    res.cookie('token', token, {
      ...cookieOptions,
      maxAge: 24 * 60 * 60 * 1000, // 24h, igual que JWT_EXPIRES_IN
    });
    res.status(200).json({ ok: true, mensaje: 'Login exitoso', data: user });
  } catch (error) {
    res.status(500).json({
      ok: false,
      mensaje: 'Error al iniciar sesión',
      error: error.message,
    });
  }
};

export const obtenerPerfil = async (req, res) => {
  try {
    res.status(200).json({ ok: true, data: req.user });
  } catch (error) {
    res.status(500).json({
      ok: false,
      mensaje: 'Error al obtener el perfil',
      error: error.message,
    });
  }
};

export const actualizarPerfil = async (req, res) => {
  try {
    const { profile } = matchedData(req);

    const cambios = {};
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
      { _id: req.user._id, deletedAt: null },
      { $set: cambios },
      { returnDocument: 'after', runValidators: true },
    );
    res.status(200).json({
      ok: true,
      mensaje: 'Perfil actualizado correctamente',
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      mensaje: 'Error al actualizar el perfil',
      error: error.message,
    });
  }
};

export const logout = async (req, res) => {
  try {
    res.clearCookie('token', cookieOptions);
    res.status(200).json({ ok: true, mensaje: 'Sesión cerrada correctamente' });
  } catch (error) {
    res.status(500).json({
      ok: false,
      mensaje: 'Error al cerrar sesión',
      error: error.message,
    });
  }
};
