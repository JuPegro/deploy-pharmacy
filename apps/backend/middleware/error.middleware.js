// apps/backend/src/middleware/error.middleware.js
const AppError = require('../utils/errorHandler');

module.exports = (err, req, res, next) => {
  // Log error en desarrollo
  console.error(err);

  // Si es nuestro error personalizado
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message
    });
  }

  // Manejar errores de Prisma
  if (err.code && err.code.startsWith('P')) {
    return res.status(400).json({
      status: 'error',
      message: 'Error en la base de datos',
      detail: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }

  // Manejar errores de JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      status: 'error',
      message: 'Token inválido. Por favor inicie sesión nuevamente.'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      status: 'error',
      message: 'Su sesión ha expirado. Por favor inicie sesión nuevamente.'
    });
  }

  // Manejar errores de validación
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      status: 'error',
      message: 'Error de validación de datos',
      errors: err.errors
    });
  }

  // Error por defecto para producción
  const statusCode = err.statusCode || 500;
  return res.status(statusCode).json({
    status: 'error',
    message: process.env.NODE_ENV === 'production' 
      ? 'Algo salió mal' 
      : err.message || 'Error interno del servidor',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};