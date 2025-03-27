// src/services/reserva.service.js
const { prisma } = require('../config');
const AppError = require('../utils/errorHandler');

exports.crearReserva = async (reservaData) => {
  // Verificar si el medicamento existe
  const medicamento = await prisma.medicamento.findUnique({
    where: { id: reservaData.medicamentoId }
  });

  if (!medicamento) {
    throw new AppError('No se encontró el medicamento', 404);
  }

  // Crear la reserva con estado PENDIENTE por defecto
  return await prisma.reserva.create({
    data: {
      ...reservaData,
      estado: reservaData.estado || 'PENDIENTE'
    }
  });
};

exports.obtenerReservas = async () => {
  return await prisma.reserva.findMany({
    include: {
      medicamento: true,
      farmacia: true
    }
  });
};

exports.obtenerReserva = async (id) => {
  return await prisma.reserva.findUnique({
    where: { id },
    include: {
      medicamento: true,
      farmacia: true
    }
  });
};

exports.actualizarEstadoReserva = async (id, estado) => {
  const reserva = await prisma.reserva.findUnique({
    where: { id }
  });

  if (!reserva) {
    throw new AppError('No se encontró la reserva', 404);
  }

  // Validar que el estado sea válido
  if (!['PENDIENTE', 'CONFIRMADA', 'CANCELADA'].includes(estado)) {
    throw new AppError('Estado de reserva no válido', 400);
  }

  return await prisma.reserva.update({
    where: { id },
    data: { estado }
  });
};