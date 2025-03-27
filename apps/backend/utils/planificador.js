// src/utils/planificador.js
const cron = require('node-cron');
const { prisma } = require('../config');
const prediccionService = require('../services/prediccion.service');

/**
 * Inicia los trabajos programados para cálculos automáticos
 */
exports.iniciarPlanificador = () => {
  // Calcular predicciones diariamente a las 2 AM
  cron.schedule('0 2 * * *', async () => {
    console.log('Ejecutando cálculo automático de predicciones...');
    
    try {
      // Obtener todos los medicamentos
      const medicamentos = await prisma.medicamento.findMany();
      
      // Calcular predicciones para cada medicamento
      for (const medicamento of medicamentos) {
        await prediccionService.calcularYGuardarPredicciones(medicamento.id);
      }
      
      console.log('Cálculo de predicciones completado con éxito.');
    } catch (error) {
      console.error('Error en cálculo automático de predicciones:', error);
    }
  });
  
  // Generar recomendaciones de reabastecimiento semanalmente (lunes a las 7 AM)
  cron.schedule('0 7 * * 1', async () => {
    console.log('Generando recomendaciones de reabastecimiento...');
    
    try {
      // Obtener todas las farmacias
      const farmacias = await prisma.farmacia.findMany();
      
      // Generar recomendaciones para cada farmacia
      for (const farmacia of farmacias) {
        await prediccionService.generarRecomendacionesReabastecimiento(farmacia.id);
      }
      
      console.log('Recomendaciones de reabastecimiento generadas con éxito.');
    } catch (error) {
      console.error('Error en generación de recomendaciones:', error);
    }
  });
  
  console.log('Planificador de tareas para predicciones iniciado correctamente.');
};