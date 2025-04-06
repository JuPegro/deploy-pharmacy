// src/middleware/auth.middleware.js - CORREGIDO
const jwt = require('jsonwebtoken');
const { prisma } = require('../config');
const AppError = require('../utils/errorHandler');

exports.proteger = async (req, res, next) => {
  try {
    // 1) Verificar si hay token
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(
        new AppError('No ha iniciado sesión. Por favor inicie sesión para obtener acceso.', 401)
      );
    }

    // 2) Verificar token
    const secret = process.env.JWT_SECRET || 'default_secret_key_for_development';
    const decoded = jwt.verify(token, secret);

    // 3) Verificar si el usuario todavía existe y cargar sus datos completos
    const usuarioActual = await prisma.usuario.findUnique({
      where: { id: decoded.id },
      include: {
        farmacias: true, // CORREGIDO: cargar relación farmacias
        farmaciaActiva: true
      }
    });

    if (!usuarioActual) {
      return next(
        new AppError('El usuario de este token ya no existe.', 401)
      );
    }

    // 4) Comprobar si el usuario cambió la contraseña después de que se emitió el token
    if (usuarioActual.passwordChangedAt) {
      const changedTimestamp = parseInt(
        usuarioActual.passwordChangedAt.getTime() / 1000,
        10
      );

      if (decoded.iat < changedTimestamp) {
        return next(
          new AppError('Usuario cambió recientemente su contraseña. Por favor inicie sesión nuevamente.', 401)
        );
      }
    }

    // Proporcionar acceso a la ruta protegida
    req.usuario = usuarioActual;
    next();
  } catch (error) {
    next(error);
  }
};

exports.restringirA = (...roles) => {
  return (req, res, next) => {
    // roles es un array: ['ADMIN', 'FARMACIA']
    if (!roles.includes(req.usuario.rol)) {
      return next(
        new AppError('No tiene permiso para realizar esta acción', 403)
      );
    }

    next();
  };
};