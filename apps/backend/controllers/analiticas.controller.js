// src/controllers/analiticas.controller.js
const analyticaService = require('../services/analiticas.service');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Controlador para obtener sugerencias de inventario basadas en analítica
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.obtenerSugerenciasInventario = async (req, res) => {
  try {
    // Obtener sugerencias de inventario desde el servicio
    const sugerencias = await analyticaService.generarSugerenciasInventario();

    // Si no se generaron sugerencias, puede ser por un error interno
    if (!sugerencias || sugerencias.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No se pudieron generar sugerencias de inventario'
      });
    }

    return res.json({
      success: true,
      data: {
        sugerencias,
        fechaAnalisis: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error al obtener sugerencias de inventario:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al generar sugerencias de inventario',
      error: error.message
    });
  }
};

/**
 * Controlador para obtener análisis predictivo para una farmacia específica
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.obtenerAnalisisPredictivo = async (req, res) => {
  try {
    const { farmaciaId } = req.params;
    
    // Validar que se proporcione un ID de farmacia
    if (!farmaciaId) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere un ID de farmacia válido'
      });
    }

    // Obtener datos históricos de ventas para la farmacia
    const ventasHistoricas = await prisma.venta.findMany({
      where: { farmaciaId: parseInt(farmaciaId) },
      orderBy: { fecha: 'asc' },
      include: {
        detalles: {
          include: {
            medicamento: true
          }
        }
      }
    });

    // Agrupar ventas por mes para análisis de tendencias
    const ventasPorMes = ventasHistoricas.reduce((acc, venta) => {
      const fecha = new Date(venta.fecha);
      const mesKey = `${fecha.getFullYear()}-${(fecha.getMonth() + 1).toString().padStart(2, '0')}`;
      
      if (!acc[mesKey]) {
        acc[mesKey] = {
          mes: this.obtenerNombreMes(fecha.getMonth()),
          ventas: 0
        };
      }
      
      acc[mesKey].ventas += venta.total;
      return acc;
    }, {});

    // Convertir a array para la respuesta
    const tendenciaVentas = Object.values(ventasPorMes);

    // Realizar predicción para los próximos 3 meses
    const ultimosMeses = tendenciaVentas.slice(-6); // Usar últimos 6 meses para predicción
    const prediccionProximosMeses = this.predecirProximosMeses(ultimosMeses, 3);

    // Analizar medicamentos más vendidos y su tendencia
    const medicamentosVendidos = this.analizarMedicamentosVendidos(ventasHistoricas);

    return res.json({
      success: true,
      data: {
        farmaciaId,
        tendenciaVentas,
        prediccionProximosMeses,
        medicamentosDestacados: medicamentosVendidos.slice(0, 5), // Top 5
        fechaAnalisis: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error al obtener análisis predictivo:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al generar análisis predictivo',
      error: error.message
    });
  }
};

/**
 * Controlador para obtener ventas por sucursal
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getVentasPorSucursal = async (req, res) => {
  try {
    const { farmaciaId } = req.params;
    
    // Obtener sucursales de la farmacia
    const sucursales = await prisma.sucursal.findMany({
      where: { farmaciaId: parseInt(farmaciaId) }
    });
    
    // Obtener totales de ventas para cada sucursal
    const ventasPorSucursal = await Promise.all(sucursales.map(async (sucursal) => {
      const ventasTotales = await prisma.venta.aggregate({
        where: { sucursalId: sucursal.id },
        _sum: { total: true }
      });
      
      return {
        id: sucursal.id.toString(),
        nombre: sucursal.nombre,
        totalVentas: ventasTotales._sum.total || 0
      };
    }));
    
    return res.json({
      success: true,
      data: ventasPorSucursal
    });
  } catch (error) {
    console.error('Error al obtener ventas por sucursal:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener ventas por sucursal',
      error: error.message
    });
  }
};

/**
 * Controlador para obtener medicamentos más vendidos
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getMedicamentosMasVendidos = async (req, res) => {
  try {
    const { farmaciaId } = req.params;
    
    // Consultar los medicamentos más vendidos
    const medicamentosMasVendidos = await prisma.$queryRaw`
      SELECT 
        m.id, 
        m.nombre, 
        SUM(dv.cantidad) as cantidadVendida
      FROM 
        "DetalleVenta" dv
      JOIN 
        "Medicamento" m ON dv."medicamentoId" = m.id
      JOIN 
        "Venta" v ON dv."ventaId" = v.id
      JOIN 
        "Sucursal" s ON v."sucursalId" = s.id
      WHERE 
        s."farmaciaId" = ${parseInt(farmaciaId)}
      GROUP BY 
        m.id, m.nombre
      ORDER BY 
        cantidadVendida DESC
      LIMIT 5
    `;
    
    return res.json({
      success: true,
      data: medicamentosMasVendidos
    });
  } catch (error) {
    console.error('Error al obtener medicamentos más vendidos:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener medicamentos más vendidos',
      error: error.message
    });
  }
};

// Métodos auxiliares para el análisis predictivo
obtenerNombreMes = (mes) => {
  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  return meses[mes];
};

predecirProximosMeses = (datosMeses, cantidadMeses) => {
  // Extraer valores de ventas para calcular tendencia
  const ventas = datosMeses.map(mes => mes.ventas);
  
  // Calcular tendencia lineal simple
  let suma = 0;
  let sumaCuadrados = 0;
  let sumaY = 0;
  let sumaXY = 0;
  
  for (let i = 0; i < ventas.length; i++) {
    suma += i;
    sumaCuadrados += i * i;
    sumaY += ventas[i];
    sumaXY += i * ventas[i];
  }
  
  const n = ventas.length;
  const pendiente = (n * sumaXY - suma * sumaY) / (n * sumaCuadrados - suma * suma);
  const interseccion = (sumaY - pendiente * suma) / n;
  
  // Generar predicciones
  const ultimoMesIndice = ventas.length - 1;
  const proximosMeses = [];
  
  for (let i = 1; i <= cantidadMeses; i++) {
    const indice = ultimoMesIndice + i;
    const valorPredicho = pendiente * indice + interseccion;
    const intervaloConfianza = Math.round(valorPredicho * 0.1); // 10% para intervalo de confianza
    
    const fechaActual = new Date();
    fechaActual.setMonth(fechaActual.getMonth() + i);
    
    proximosMeses.push({
      mes: this.obtenerNombreMes(fechaActual.getMonth()),
      ventasEstimadas: Math.round(valorPredicho),
      intervaloConfianza: `±${intervaloConfianza}`
    });
  }
  
  return proximosMeses;
};

analizarMedicamentosVendidos = (ventasHistoricas) => {
  // Agrupar por medicamento
  const ventasPorMedicamento = {};
  
  ventasHistoricas.forEach(venta => {
    venta.detalles.forEach(detalle => {
      const { medicamentoId, medicamento, cantidad } = detalle;
      
      if (!ventasPorMedicamento[medicamentoId]) {
        ventasPorMedicamento[medicamentoId] = {
          id: medicamentoId,
          nombre: medicamento.nombre,
          cantidadVendida: 0,
          ventasPorMes: {}
        };
      }
      
      ventasPorMedicamento[medicamentoId].cantidadVendida += cantidad;
      
      // Agrupar por mes
      const fecha = new Date(venta.fecha);
      const mesKey = `${fecha.getFullYear()}-${(fecha.getMonth() + 1).toString().padStart(2, '0')}`;
      
      if (!ventasPorMedicamento[medicamentoId].ventasPorMes[mesKey]) {
        ventasPorMedicamento[medicamentoId].ventasPorMes[mesKey] = 0;
      }
      
      ventasPorMedicamento[medicamentoId].ventasPorMes[mesKey] += cantidad;
    });
  });
  
  // Convertir a array para análisis
  const medicamentos = Object.values(ventasPorMedicamento);
  
  // Calcular tendencia para cada medicamento
  medicamentos.forEach(med => {
    const ventasMensuales = Object.values(med.ventasPorMes);
    
    if (ventasMensuales.length >= 3) {
      const ultimosMeses = ventasMensuales.slice(-3);
      const primerMes = ultimosMeses[0];
      const ultimoMes = ultimosMeses[ultimosMeses.length - 1];
      
      const cambio = ultimoMes - primerMes;
      const porcentajeCambio = primerMes ? (cambio / primerMes) * 100 : 0;
      
      if (porcentajeCambio > 10) {
        med.tendencia = 'Creciente';
        med.prediccion = `+${Math.round(porcentajeCambio)}% próximo trimestre`;
      } else if (porcentajeCambio < -10) {
        med.tendencia = 'Decreciente';
        med.prediccion = `${Math.round(porcentajeCambio)}% próximo trimestre`;
      } else {
        med.tendencia = 'Estable';
        med.prediccion = `${Math.round(porcentajeCambio)}% próximo trimestre`;
      }
    } else {
      med.tendencia = 'Datos insuficientes';
      med.prediccion = 'No disponible';
    }
    
    // Limpiar datos temporales
    delete med.ventasPorMes;
  });
  
  // Ordenar por cantidad vendida
  return medicamentos.sort((a, b) => b.cantidadVendida - a.cantidadVendida);
};