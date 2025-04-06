// utils/permisosHelper.js
const AppError = require('./errorHandler');

/**
 * Middleware para verificar permisos de acceso a una farmacia
 * @param {Object} req - Request de Express
 * @param {String} farmaciaId - ID de la farmacia a la que se intenta acceder
 * @returns {Boolean} - true si tiene acceso, lanza error si no
 */
exports.verificarAccesoAFarmacia = async (req, farmaciaId) => {
  // Si no hay usuario en el request, no hay acceso
  if (!req.usuario) {
    throw new AppError('No autorizado', 401);
  }
  
  // Los administradores siempre tienen acceso
  if (req.usuario.rol === 'ADMIN') {
    return true;
  }
  
  // Para usuario de farmacia, verificar que tenga acceso a esta farmacia
  if (req.usuario.rol === 'FARMACIA') {
    // Si es la farmacia activa, permitir
    if (req.usuario.farmaciaActivaId === farmaciaId) {
      return true;
    }
    
    // Verificar si está en su lista de farmacias asignadas
    const tieneAcceso = req.usuario.farmacias && 
                        req.usuario.farmacias.some(f => f.id === farmaciaId);
    
    if (!tieneAcceso) {
      throw new AppError('No tienes acceso a esta farmacia', 403);
    }
    
    return true;
  }
  
  // Tipo de usuario no reconocido
  throw new AppError('Rol de usuario no válido', 403);
};

/**
 * Middleware para verificar permisos de acceso a un inventario
 * @param {Object} req - Request de Express
 * @param {String} inventarioId - ID del inventario a verificar
 * @param {Object} prisma - Cliente Prisma
 * @returns {Boolean} - true si tiene acceso, lanza error si no
 */
exports.verificarAccesoAInventario = async (req, inventarioId, prisma) => {
  // Si no hay usuario en el request, no hay acceso
  if (!req.usuario) {
    throw new AppError('No autorizado', 401);
  }
  
  // Los administradores siempre tienen acceso
  if (req.usuario.rol === 'ADMIN') {
    return true;
  }
  
  // Para usuario de farmacia, verificar que el inventario pertenezca a su farmacia activa
  if (req.usuario.rol === 'FARMACIA') {
    if (!req.usuario.farmaciaActivaId) {
      throw new AppError('No tienes una farmacia activa asignada', 400);
    }
    
    // Obtener el inventario para verificar la farmacia
    const inventario = await prisma.inventario.findUnique({
      where: { id: inventarioId }
    });
    
    if (!inventario) {
      throw new AppError('Inventario no encontrado', 404);
    }
    
    if (inventario.farmaciaId !== req.usuario.farmaciaActivaId) {
      throw new AppError('No tienes acceso a este inventario', 403);
    }
    
    return true;
  }
  
  // Tipo de usuario no reconocido
  throw new AppError('Rol de usuario no válido', 403);
};

/**
 * Obtener la farmacia ID a usar según el rol del usuario y los parámetros
 * @param {Object} req - Request de Express
 * @param {String} paramFarmaciaId - ID de farmacia que viene como parámetro (opcional)
 * @returns {String} - ID de farmacia a utilizar
 */
exports.obtenerFarmaciaId = (req, paramFarmaciaId = null) => {
  // Si es admin y se proporciona un ID específico, usar ese
  if (req.usuario.rol === 'ADMIN' && paramFarmaciaId) {
    return paramFarmaciaId;
  }
  
  // Si es usuario de farmacia, usar su farmacia activa
  if (req.usuario.rol === 'FARMACIA') {
    if (!req.usuario.farmaciaActivaId) {
      throw new AppError('No tienes una farmacia activa asignada', 400);
    }
    return req.usuario.farmaciaActivaId;
  }
  
  // Si es admin y no hay ID específico, error
  if (!paramFarmaciaId) {
    throw new AppError('Se requiere especificar una farmacia', 400);
  }
  
  return paramFarmaciaId;
};