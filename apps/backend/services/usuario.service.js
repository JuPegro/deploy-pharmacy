// src/services/usuario.service.js
const { prisma } = require('../config');
const AppError = require('../utils/errorHandler');

exports.crearUsuario = async (usuarioData) => {
  // Aquí iría la lógica para encriptar la contraseña
  return await prisma.usuario.create({
    data: usuarioData
  });
};

exports.obtenerUsuarios = async () => {
  return await prisma.usuario.findMany({
    include: {
      farmacias: true
    }
  });
};

exports.obtenerUsuario = async (id) => {
  return await prisma.usuario.findUnique({
    where: { id },
    include: {
      farmacias: true
    }
  });
};

exports.actualizarUsuario = async (id, usuarioData) => {
  const usuario = await prisma.usuario.findUnique({
    where: { id }
  });

  if (!usuario) {
    throw new AppError('No se encontró el usuario', 404);
  }

  return await prisma.usuario.update({
    where: { id },
    data: usuarioData
  });
};

exports.eliminarUsuario = async (id) => {
  const usuario = await prisma.usuario.findUnique({
    where: { id }
  });

  if (!usuario) {
    throw new AppError('No se encontró el usuario', 404);
  }

  return await prisma.usuario.delete({
    where: { id }
  });
};