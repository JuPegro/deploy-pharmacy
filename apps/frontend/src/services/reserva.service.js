// Fixed version of reserva.service.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Service functions for reserva management
const reservaService = {
  // Create a new reservation with PENDIENTE status by default
  async createReserva(data) {
    // Extract only the fields that exist in the Prisma schema
    const { medicamentoId, farmaciaId } = data;
    
    // Create the reservation with only the fields in your schema
    return await prisma.reserva.create({
      data: { 
        medicamentoId, 
        farmaciaId,
        estado: "PENDIENTE" 
      }
    });
  },
  
  // Get all reservations
  async getAllReservas() {
    return await prisma.reserva.findMany({
      include: {
        medicamento: true,
        farmacia: true
      }
    });
  },
  
  // Get reservation by ID
  async getReservaById(id) {
    return await prisma.reserva.findUnique({
      where: { id },
      include: {
        medicamento: true,
        farmacia: true
      }
    });
  },
  
  // Update reservation status
  async updateReservaStatus(id, estado) {
    return await prisma.reserva.update({
      where: { id },
      data: { estado }
    });
  }
};

module.exports = reservaService;