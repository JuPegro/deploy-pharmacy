// apps/backend/services/prediccion.service.js
const { prisma } = require('../config');
const AppError = require('../utils/errorHandler');
const SimpleStatistics = require('simple-statistics');

exports.predecirDemanda = async (medicamentoId, diasFuturos = 30) => {
  // Obtener datos históricos de ventas
  const inventarios = await prisma.inventario.findMany({
    where: { medicamentoId },
    include: { ventas: true }
  });

  // Consolidar todas las ventas
  const ventasHistoricas = [];
  inventarios.forEach(inv => {
    ventasHistoricas.push(...inv.ventas);
  });

  // Si no hay datos suficientes, devolver un error
  if (ventasHistoricas.length < 5) {
    throw new AppError('No hay suficientes datos históricos para hacer predicciones', 400);
  }

  // Agrupar ventas por día
  const ventasPorDia = agruparVentasPorDia(ventasHistoricas);
  
  // Calcular tendencia lineal (simple pero rápido)
  const datos = Object.entries(ventasPorDia).map(([fecha, cantidad]) => [
    new Date(fecha).getTime(),
    cantidad
  ]);
  
  // Usar regresión lineal para predecir
  const regression = SimpleStatistics.linearRegression(datos);
  
  // Generar predicciones
  const hoy = new Date();
  const predicciones = [];
  
  for (let i = 1; i <= diasFuturos; i++) {
    const fecha = new Date(hoy);
    fecha.setDate(hoy.getDate() + i);
    
    const timestamp = fecha.getTime();
    const cantidadPredecida = Math.max(0, Math.round(
      SimpleStatistics.linearRegressionLine(regression)(timestamp)
    ));
    
    predicciones.push({
      fecha: fecha.toISOString().split('T')[0],
      cantidadPredecida
    });
  }
  
  return predicciones;
};

// Función auxiliar para agrupar ventas por día
function agruparVentasPorDia(ventas) {
  const ventasPorDia = {};
  
  ventas.forEach(venta => {
    const fecha = venta.fecha.toISOString().split('T')[0];
    ventasPorDia[fecha] = (ventasPorDia[fecha] || 0) + venta.cantidad;
  });
  
  return ventasPorDia;
}

exports.obtenerTendenciaVentas = async (farmaciaId) => {
  // Verificar que la farmacia existe
  const farmacia = await prisma.farmacia.findUnique({
    where: { id: farmaciaId }
  });

  if (!farmacia) {
    throw new AppError('Farmacia no encontrada', 404);
  }

  // Obtener todas las ventas de la farmacia
  const ventas = await prisma.venta.findMany({
    where: {
      farmaciaId
    },
    orderBy: {
      fecha: 'asc'
    }
  });

  // Agrupar por día
  const ventasPorDia = agruparVentasPorDia(ventas);
  
  // Convertir a formato para gráficos
  return Object.entries(ventasPorDia).map(([fecha, cantidad]) => ({
    fecha,
    cantidad
  })).sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
};

exports.calcularNivelOptimoInventario = async (medicamentoId) => {
  const predicciones = await this.predecirDemanda(medicamentoId, 30);
  
  // Sumar la demanda predicha para el próximo mes
  const demandaMensual = predicciones.reduce((sum, pred) => sum + pred.cantidadPredecida, 0);
  
  // Calcular nivel óptimo (demanda mensual + 20% buffer)
  const nivelOptimo = Math.ceil(demandaMensual * 1.2);
  
  return {
    medicamentoId,
    demandaMensual,
    nivelOptimo,
    predicciones
  };
};

exports.obtenerRecomendacionesReabastecimiento = async (farmaciaId) => {
  // Verificar que la farmacia existe
  const farmacia = await prisma.farmacia.findUnique({
    where: { id: farmaciaId }
  });

  if (!farmacia) {
    throw new AppError('Farmacia no encontrada', 404);
  }

  // Obtener todos los inventarios de la farmacia con sus medicamentos
  const inventarios = await prisma.inventario.findMany({
    where: {
      farmaciaId
    },
    include: {
      medicamento: true
    }
  });
  
  const recomendaciones = [];
  
  for (const inventario of inventarios) {
    try {
      // Calcular nivel óptimo
      const { nivelOptimo, demandaMensual } = await this.calcularNivelOptimoInventario(inventario.medicamentoId);
      
      // Verificar si hay una sugerencia editada
      const sugerenciaEditada = await prisma.sugerenciaInventario.findFirst({
        where: {
          medicamentoId: inventario.medicamentoId,
          editadoPorFarmacia: true
        },
        orderBy: {
          id: 'desc'
        }
      });
      
      // Usar el nivel óptimo editado si existe
      const nivelOptimoFinal = sugerenciaEditada ? sugerenciaEditada.demandaProyectada : nivelOptimo;
      
      // Si el stock es menor que el nivel óptimo, recomendar reabastecer
      if (inventario.stock < nivelOptimoFinal) {
        recomendaciones.push({
          medicamentoId: inventario.medicamentoId,
          inventarioId: inventario.id,
          codigo: inventario.medicamento.codigo,
          nombre: inventario.medicamento.nombre,
          stockActual: inventario.stock,
          nivelOptimo: nivelOptimoFinal,
          cantidadRecomendada: nivelOptimoFinal - inventario.stock,
          porcentajeStock: Math.round((inventario.stock / nivelOptimoFinal) * 100),
          demandaMensualEstimada: demandaMensual,
          editadoPorFarmacia: !!sugerenciaEditada
        });
      }
    } catch (error) {
      // Si no hay suficientes datos, continuar con el siguiente medicamento
      console.error(`Error al procesar medicamento ${inventario.medicamentoId}:`, error.message);
    }
  }
  
  // Ordenar por prioridad (menor porcentaje de stock primero)
  return recomendaciones.sort((a, b) => a.porcentajeStock - b.porcentajeStock);
};

exports.editarRecomendacion = async (medicamentoId, nuevaDemanda, usuarioId, farmaciaId = null) => {
  // Verificar que el medicamento existe
  const medicamento = await prisma.medicamento.findUnique({
    where: { id: medicamentoId }
  });

  if (!medicamento) {
    throw new AppError('Medicamento no encontrado', 404);
  }

  // Si es un usuario de farmacia, verificar que tiene acceso al inventario
  if (farmaciaId) {
    const inventario = await prisma.inventario.findFirst({
      where: { 
        medicamentoId,
        farmaciaId
      }
    });

    if (!inventario) {
      throw new AppError('No tiene acceso a este inventario', 403);
    }
  }

  // Obtener recomendación existente
  const recomendacionExistente = await prisma.sugerenciaInventario.findFirst({
    where: { medicamentoId },
    orderBy: { id: 'desc' }
  });

  // Crear nueva sugerencia editada
  const sugerencia = await prisma.sugerenciaInventario.create({
    data: {
      medicamentoId,
      stockActual: recomendacionExistente?.stockActual || 0,
      ventasDiarias: recomendacionExistente?.ventasDiarias || 0,
      demandaProyectada: nuevaDemanda,
      diasSinVenta: recomendacionExistente?.diasSinVenta || 0,
      recomendacion: `Editado por usuario`,
      editadoPorFarmacia: true,
      usuarioEditorId: usuarioId
    }
  });

  return {
    id: sugerencia.id,
    medicamentoId: sugerencia.medicamentoId,
    demandaProyectada: sugerencia.demandaProyectada,
    mensaje: "Recomendación actualizada exitosamente"
  };
};

exports.analizarEstacionalidad = async (categoriaId) => {
  // Implementación simplificada
  return {
    message: "Análisis de estacionalidad no implementado completamente",
    data: {
      tendencias: [
        { mes: "Enero", indice: 0.8 },
        { mes: "Febrero", indice: 0.9 },
        { mes: "Marzo", indice: 1.0 },
        { mes: "Abril", indice: 1.1 },
        { mes: "Mayo", indice: 1.2 },
        { mes: "Junio", indice: 1.1 },
        { mes: "Julio", indice: 1.0 },
        { mes: "Agosto", indice: 0.9 },
        { mes: "Septiembre", indice: 1.0 },
        { mes: "Octubre", indice: 1.1 },
        { mes: "Noviembre", indice: 1.2 },
        { mes: "Diciembre", indice: 1.3 }
      ]
    }
  };
};

exports.analizarCorrelaciones = async () => {
  // Implementación simplificada
  return {
    message: "Análisis de correlaciones no implementado completamente",
    data: {
      correlaciones: [
        { par: "Antibióticos-Antigripales", coeficiente: 0.75 },
        { par: "Antiinflamatorios-Analgésicos", coeficiente: 0.82 },
        { par: "Vitaminas-Suplementos", coeficiente: 0.68 }
      ]
    }
  };
};

exports.calcularYGuardarPredicciones = async (medicamentoId) => {
  try {
    const { nivelOptimo } = await this.calcularNivelOptimoInventario(medicamentoId);
    
    // Buscar inventarios de este medicamento
    const inventarios = await prisma.inventario.findMany({
      where: { medicamentoId },
      include: { farmacia: true }
    });
    
    // Para cada inventario, guardar una sugerencia
    for (const inventario of inventarios) {
      await prisma.sugerenciaInventario.create({
        data: {
          medicamentoId,
          stockActual: inventario.stock,
          ventasDiarias: nivelOptimo / 30, // Aproximado
          demandaProyectada: nivelOptimo,
          diasSinVenta: 0,
          recomendacion: inventario.stock < nivelOptimo ? 
            'Reabastecer pronto' : 'Stock adecuado',
          editadoPorFarmacia: false
        }
      });
    }
    
    console.log(`Predicción actualizada para medicamento ${medicamentoId}: Nivel óptimo = ${nivelOptimo}`);
    
    return { success: true, medicamentoId, nivelOptimo };
  } catch (error) {
    console.error(`Error al calcular predicciones para medicamento ${medicamentoId}:`, error.message);
    return { success: false, medicamentoId, error: error.message };
  }
};

exports.generarRecomendacionesReabastecimiento = async (farmaciaId) => {
  try {
    const recomendaciones = await this.obtenerRecomendacionesReabastecimiento(farmaciaId);
    
    // Notificar a través de algún sistema si es necesario
    console.log(`Generadas ${recomendaciones.length} recomendaciones de reabastecimiento para farmacia ${farmaciaId}`);
    
    return { success: true, farmaciaId, cantidadRecomendaciones: recomendaciones.length };
  } catch (error) {
    console.error(`Error al generar recomendaciones para farmacia ${farmaciaId}:`, error.message);
    return { success: false, farmaciaId, error: error.message };
  }
};

// Nuevo método para obtener medicamentos más vendidos
exports.obtenerMedicamentosMasVendidos = async (farmaciaId, periodo = 'mes') => {
  // Verificar que la farmacia existe
  const farmacia = await prisma.farmacia.findUnique({
    where: { id: farmaciaId }
  });

  if (!farmacia) {
    throw new AppError('Farmacia no encontrada', 404);
  }

  // Determinar fecha de inicio según el periodo
  const fechaInicio = new Date();
  switch (periodo) {
    case 'semana':
      fechaInicio.setDate(fechaInicio.getDate() - 7);
      break;
    case 'mes':
      fechaInicio.setMonth(fechaInicio.getMonth() - 1);
      break;
    case 'trimestre':
      fechaInicio.setMonth(fechaInicio.getMonth() - 3);
      break;
    default:
      fechaInicio.setMonth(fechaInicio.getMonth() - 1); // Por defecto un mes
  }

  // Obtener ventas del periodo
  const ventas = await prisma.venta.findMany({
    where: {
      farmaciaId,
      fecha: {
        gte: fechaInicio
      }
    },
    include: {
      inventario: {
        include: {
          medicamento: true
        }
      }
    }
  });

  // Agrupar ventas por medicamento
  const ventasPorMedicamento = {};
  ventas.forEach(venta => {
    const medicamento = venta.inventario.medicamento;
    const medicamentoId = medicamento.id;
    
    if (!ventasPorMedicamento[medicamentoId]) {
      ventasPorMedicamento[medicamentoId] = {
        id: medicamentoId,
        codigo: medicamento.codigo,
        nombre: medicamento.nombre,
        categoria: medicamento.categoria,
        cantidadVendida: 0,
        montoTotal: 0
      };
    }
    
    ventasPorMedicamento[medicamentoId].cantidadVendida += venta.cantidad;
    ventasPorMedicamento[medicamentoId].montoTotal += parseFloat(venta.cantidad) * parseFloat(venta.precioUnitario);
  });

  // Convertir a array y ordenar por cantidad vendida
  const resultado = Object.values(ventasPorMedicamento)
    .sort((a, b) => b.cantidadVendida - a.cantidadVendida)
    .slice(0, 10); // Top 10

  return {
    farmaciaId,
    periodo,
    medicamentos: resultado
  };
};