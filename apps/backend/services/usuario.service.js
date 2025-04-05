// apps/backend/services/usuario.service.js
const { prisma } = require('../config');
const AppError = require('../utils/errorHandler');
const bcrypt = require('bcrypt');

exports.crearUsuario = async (usuarioData, creadorId) => {
  // Verificar si el email ya está registrado
  const usuarioExistente = await prisma.usuario.findUnique({
    where: { email: usuarioData.email }
  });

  if (usuarioExistente) {
    throw new AppError('Este email ya está registrado', 400);
  }

  // Validar si se intenta crear un usuario FARMACIA sin asignar farmacia
  if (usuarioData.rol === 'FARMACIA' && !usuarioData.farmaciaId) {
    throw new AppError('Debe asignar una farmacia al usuario de tipo FARMACIA', 400);
  }

  // Encriptar la contraseña
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(usuarioData.password, salt);

  // Preparar datos base del usuario
  const userData = {
    nombre: usuarioData.nombre,
    email: usuarioData.email,
    password: hashedPassword,
    rol: usuarioData.rol
  };

  // Si es usuario FARMACIA, asignar la farmacia
  if (usuarioData.rol === 'FARMACIA' && usuarioData.farmaciaId) {
    // Verificar si la farmacia existe
    const farmacia = await prisma.farmacia.findUnique({
      where: { id: usuarioData.farmaciaId }
    });

    if (!farmacia) {
      throw new AppError('La farmacia especificada no existe', 404);
    }

    // Crear usuario con relación a farmacia
    const usuario = await prisma.usuario.create({
      data: {
        ...userData,
        farmacias: {
          connect: [{ id: usuarioData.farmaciaId }]
        },
        farmaciaActiva: {
          connect: { id: usuarioData.farmaciaId }
        }
      },
      include: {
        farmacias: true,
        farmaciaActiva: true
      }
    });

    // Eliminar la contraseña de la respuesta
    const { password, ...usuarioSinPassword } = usuario;
    return usuarioSinPassword;
  } else {
    // Crear usuario normal (ADMIN)
    const usuario = await prisma.usuario.create({
      data: userData
    });

    // Eliminar la contraseña de la respuesta
    const { password, ...usuarioSinPassword } = usuario;
    return usuarioSinPassword;
  }
};

exports.obtenerUsuarios = async (filtros = {}) => {
  const { rol } = filtros;
  
  const where = {};
  
  if (rol) {
    where.rol = rol;
  }
  
  return await prisma.usuario.findMany({
    where,
    include: {
      farmacias: true,
      farmaciaActiva: true
    },
    orderBy: {
      nombre: 'asc'
    }
  });
};

exports.obtenerUsuario = async (id) => {
  const usuario = await prisma.usuario.findUnique({
    where: { id },
    include: {
      farmacias: true,
      farmaciaActiva: true
    }
  });

  if (!usuario) {
    throw new AppError('No se encontró el usuario', 404);
  }

  // Eliminar la contraseña de la respuesta
  const { password, ...usuarioSinPassword } = usuario;
  return usuarioSinPassword;
};

exports.actualizarUsuario = async (id, usuarioData) => {
  const usuario = await prisma.usuario.findUnique({
    where: { id },
    include: {
      farmacias: true
    }
  });

  if (!usuario) {
    throw new AppError('No se encontró el usuario', 404);
  }

  // Preparar datos para actualización
  const dataToUpdate = {};
  
  if (usuarioData.nombre) dataToUpdate.nombre = usuarioData.nombre;
  if (usuarioData.email) dataToUpdate.email = usuarioData.email;
  
  // Si hay nueva contraseña, encriptarla
  if (usuarioData.password) {
    const salt = await bcrypt.genSalt(10);
    dataToUpdate.password = await bcrypt.hash(usuarioData.password, salt);
  }
  
  // Cambio de rol (solo si es necesario)
  if (usuarioData.rol && usuarioData.rol !== usuario.rol) {
    dataToUpdate.rol = usuarioData.rol;
  }
  
  // Actualizaciones de relaciones con farmacias
  const updateData = {
    data: dataToUpdate
  };
  
  // Si se proporciona una nueva farmacia y el usuario es FARMACIA
  if (usuarioData.rol === 'FARMACIA' && usuarioData.farmaciaId) {
    // Verificar que la farmacia existe
    const farmacia = await prisma.farmacia.findUnique({
      where: { id: usuarioData.farmaciaId }
    });
    
    if (!farmacia) {
      throw new AppError('La farmacia especificada no existe', 404);
    }
    
    // Actualizar la relación con la farmacia y la farmacia activa
    updateData.data.farmacias = {
      set: [], // Eliminar relaciones existentes
      connect: [{ id: usuarioData.farmaciaId }] // Conectar con la nueva farmacia
    };
    
    updateData.data.farmaciaActiva = {
      connect: { id: usuarioData.farmaciaId }
    };
  }
  
  // Incluir relaciones en la respuesta
  updateData.include = {
    farmacias: true,
    farmaciaActiva: true
  };
  
  const usuarioActualizado = await prisma.usuario.update({
    where: { id },
    ...updateData
  });
  
  // Eliminar la contraseña de la respuesta
  const { password, ...usuarioSinPassword } = usuarioActualizado;
  return usuarioSinPassword;
};

exports.eliminarUsuario = async (id) => {
  const usuario = await prisma.usuario.findUnique({
    where: { id }
  });

  if (!usuario) {
    throw new AppError('No se encontró el usuario', 404);
  }

  // Verificar si el usuario tiene relaciones que impidan eliminarlo
  const ventasCount = await prisma.venta.count({
    where: { usuarioId: id }
  });

  if (ventasCount > 0) {
    throw new AppError('No se puede eliminar un usuario con ventas asociadas', 400);
  }

  return await prisma.usuario.delete({
    where: { id }
  });
};

// Función para asignar farmacia a un usuario
exports.asignarFarmaciaAUsuario = async (usuarioId, farmaciaId) => {
  // Verificar que el usuario existe y es de tipo FARMACIA
  const usuario = await prisma.usuario.findUnique({
    where: { id: usuarioId }
  });

  if (!usuario) {
    throw new AppError('No se encontró el usuario', 404);
  }

  if (usuario.rol !== 'FARMACIA') {
    throw new AppError('Solo se puede asignar farmacia a usuarios de tipo FARMACIA', 400);
  }

  // Verificar que la farmacia existe
  const farmacia = await prisma.farmacia.findUnique({
    where: { id: farmaciaId }
  });

  if (!farmacia) {
    throw new AppError('No se encontró la farmacia', 404);
  }

  // Asignar farmacia y establecerla como activa
  const usuarioActualizado = await prisma.usuario.update({
    where: { id: usuarioId },
    data: {
      farmacias: {
        connect: { id: farmaciaId }
      },
      farmaciaActiva: {
        connect: { id: farmaciaId }
      }
    },
    include: {
      farmacias: true,
      farmaciaActiva: true
    }
  });

  // Eliminar la contraseña de la respuesta
  const { password, ...usuarioSinPassword } = usuarioActualizado;
  return usuarioSinPassword;
};