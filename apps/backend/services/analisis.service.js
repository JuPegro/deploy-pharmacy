// src/services/analisis.service.js
const { prisma } = require('../config');
const AppError = require('../utils/errorHandler');

/**
 * Obtiene datos para el dashboard principal de una farmacia
 */
exports.obtenerDashboard = async (farmaciaId) => {
  // Verificar que la farmacia existe
  const farmacia = await prisma.farmacia.findUnique({
    where: { id: farmaciaId }
  });

  if (!farmacia) {
    throw new AppError('No se encontró la farmacia', 404);
  }

  // Obtener fecha actual y fecha hace 30 días
  const hoy = new Date();
  const hace30Dias = new Date(hoy);
  hace30Dias.setDate(hoy.getDate() - 30);

  // Obtener ventas del último mes
  const ventas = await prisma.venta.findMany({
    where: {
      farmaciaId,
      fecha: {
        gte: hace30Dias
      }
    },
    include: {
      medicamento: true
    }
  });

  // Obtener devoluciones del último mes
  const devoluciones = await prisma.devolucion.findMany({
    where: {
      farmaciaId,
      fecha: {
        gte: hace30Dias
      }
    },
    include: {
      medicamento: true
    }
  });

  // Calcular métricas
  const totalVentas = ventas.reduce((sum, venta) => sum + 1, 0);
  const totalProductosVendidos = ventas.reduce((sum, venta) => sum + venta.cantidad, 0);
  const totalDevoluciones = devoluciones.reduce((sum, dev) => sum + 1, 0);
  const totalProductosDevueltos = devoluciones.reduce((sum, dev) => sum + dev.cantidad, 0);

  // Agrupar ventas por día para gráfico de tendencia
  const ventasPorDia = {};
  ventas.forEach(venta => {
    const fecha = venta.fecha.toISOString().split('T')[0];
    ventasPorDia[fecha] = (ventasPorDia[fecha] || 0) + venta.cantidad;
  });

  // Convertir a formato adecuado para gráficos
  const datosTendencia = Object.entries(ventasPorDia).map(([fecha, cantidad]) => ({
    fecha,
    cantidad
  })).sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

  // Medicamentos más vendidos
  const ventasPorMedicamento = {};
  ventas.forEach(venta => {
    const medicamentoId = venta.medicamentoId;
    const medicamentoNombre = venta.medicamento.nombre;
    ventasPorMedicamento[medicamentoId] = ventasPorMedicamento[medicamentoId] || {
      id: medicamentoId,
      nombre: medicamentoNombre,
      cantidad: 0
    };
    ventasPorMedicamento[medicamentoId].cantidad += venta.cantidad;
  });

  // Top 5 medicamentos más vendidos
  const medicamentosPopulares = Object.values(ventasPorMedicamento)
    .sort((a, b) => b.cantidad - a.cantidad)
    .slice(0, 5);

  // Calcular porcentaje de devoluciones
  const porcentajeDevolucion = totalProductosVendidos > 0 
    ? (totalProductosDevueltos / totalProductosVendidos) * 100 
    : 0;

  return {
    metricas: {
      totalVentas,
      totalProductosVendidos,
      totalDevoluciones,
      totalProductosDevueltos,
      porcentajeDevolucion: parseFloat(porcentajeDevolucion.toFixed(2))
    },
    tendencia: datosTendencia,
    medicamentosPopulares
  };
};

/**
 * Obtiene las ventas agrupadas por categoría de medicamento
 */
exports.obtenerVentasPorCategoria = async (farmaciaId) => {
  // Verificar que la farmacia existe
  const farmacia = await prisma.farmacia.findUnique({
    where: { id: farmaciaId }
  });

  if (!farmacia) {
    throw new AppError('No se encontró la farmacia', 404);
  }

  // Obtener todas las ventas con información del medicamento
  const ventas = await prisma.venta.findMany({
    where: {
      farmaciaId
    },
    include: {
      medicamento: true
    }
  });

  // Agrupar por categoría
  const ventasPorCategoria = {};
  ventas.forEach(venta => {
    const categoria = venta.medicamento.categoria;
    ventasPorCategoria[categoria] = ventasPorCategoria[categoria] || 0;
    ventasPorCategoria[categoria] += venta.cantidad;
  });

  // Convertir a formato adecuado para gráficos
  const resultado = Object.entries(ventasPorCategoria).map(([categoria, cantidad]) => ({
    categoria,
    cantidad
  })).sort((a, b) => b.cantidad - a.cantidad);

  return resultado;
};

/**
 * Obtiene los medicamentos más populares (más vendidos)
 */
exports.obtenerMedicamentosPopulares = async (farmaciaId) => {
  // Verificar que la farmacia existe
  const farmacia = await prisma.farmacia.findUnique({
    where: { id: farmaciaId }
  });

  if (!farmacia) {
    throw new AppError('No se encontró la farmacia', 404);
  }

  // Obtener todas las ventas con información del medicamento
  const ventas = await prisma.venta.findMany({
    where: {
      farmaciaId
    },
    include: {
      medicamento: true
    }
  });

  // Agrupar por medicamento
  const ventasPorMedicamento = {};
  ventas.forEach(venta => {
    const medicamentoId = venta.medicamentoId;
    ventasPorMedicamento[medicamentoId] = ventasPorMedicamento[medicamentoId] || {
      id: medicamentoId,
      nombre: venta.medicamento.nombre,
      categoria: venta.medicamento.categoria,
      cantidad: 0
    };
    ventasPorMedicamento[medicamentoId].cantidad += venta.cantidad;
  });

  // Convertir a formato adecuado y ordenar
  const resultado = Object.values(ventasPorMedicamento)
    .sort((a, b) => b.cantidad - a.cantidad)
    .slice(0, 10); // Top 10

  return resultado;
};

/**
 * Obtiene la evolución de ventas a lo largo del tiempo
 */
exports.obtenerEvolucionVentas = async (farmaciaId) => {
  // Verificar que la farmacia existe
  const farmacia = await prisma.farmacia.findUnique({
    where: { id: farmaciaId }
  });

  if (!farmacia) {
    throw new AppError('No se encontró la farmacia', 404);
  }

  // Obtener fecha actual y fecha hace 6 meses
  const hoy = new Date();
  const hace6Meses = new Date(hoy);
  hace6Meses.setMonth(hoy.getMonth() - 6);

  // Obtener ventas de los últimos 6 meses
  const ventas = await prisma.venta.findMany({
    where: {
      farmaciaId,
      fecha: {
        gte: hace6Meses
      }
    }
  });

  // Agrupar por mes
  const ventasPorMes = {};
  ventas.forEach(venta => {
    const fecha = venta.fecha;
    const mes = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
    ventasPorMes[mes] = ventasPorMes[mes] || 0;
    ventasPorMes[mes] += venta.cantidad;
  });

  // Asegurar que todos los meses estén representados
  const resultado = [];
  for (let i = 0; i < 6; i++) {
    const fecha = new Date(hoy);
    fecha.setMonth(hoy.getMonth() - i);
    const mes = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
    const nombreMes = fecha.toLocaleString('default', { month: 'long' });
    
    resultado.unshift({
      mes,
      nombreMes,
      cantidad: ventasPorMes[mes] || 0
    });
  }

  return resultado;
};