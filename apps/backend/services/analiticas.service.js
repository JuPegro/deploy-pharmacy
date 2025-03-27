const tf = require('@tensorflow/tfjs-node');
const { PrismaClient } = require('@prisma/client');
const cron = require('node-cron');
const axios = require('axios');
const math = require('mathjs');

const prisma = new PrismaClient();

class AnalyticaService {
  constructor() {
    this.modeloPrediccion = null;
    this.inicializarModelo();
  }

  async inicializarModelo() {
    try {
      // Cargar o crear un modelo de red neuronal simple
      this.modeloPrediccion = tf.sequential();
      
      // Capa de entrada
      this.modeloPrediccion.add(tf.layers.dense({
        inputShape: [5], // 5 características de entrada
        units: 10,
        activation: 'relu'
      }));
      
      // Capa oculta
      this.modeloPrediccion.add(tf.layers.dense({
        units: 5,
        activation: 'relu'
      }));
      
      // Capa de salida
      this.modeloPrediccion.add(tf.layers.dense({
        units: 1,
        activation: 'linear'
      }));

      // Compilar modelo
      this.modeloPrediccion.compile({
        optimizer: 'adam',
        loss: 'meanSquaredError'
      });

      console.log('Modelo de predicción inicializado');
    } catch (error) {
      console.error('Error al inicializar modelo de IA:', error);
    }
  }

  async entrenarModelo(datos) {
    try {
      // Preparar datos de entrenamiento
      const features = datos.map(item => [
        item.stock,
        item.ventas,
        item.precio,
        new Date(item.fechaUltimaVenta).getTime(),
        item.diasDesdeUltimaVenta
      ]);

      const labels = datos.map(item => item.demandaProyectada);

      const tensorFeatures = tf.tensor2d(features);
      const tensorLabels = tf.tensor1d(labels);

      // Entrenar modelo
      await this.modeloPrediccion.fit(tensorFeatures, tensorLabels, {
        epochs: 50,
        batchSize: 32
      });

      console.log('Modelo entrenado exitosamente');
    } catch (error) {
      console.error('Error al entrenar modelo:', error);
    }
  }

  async generarSugerenciasInventario() {
    try {
      // Obtener inventarios con sus ventas históricas
      const inventarios = await prisma.inventario.findMany({
        include: {
          medicamento: true,
          ventas: {
            orderBy: { fecha: 'desc' },
            take: 30 // Considerar últimas 30 ventas
          }
        }
      });

      const sugerencias = [];

      for (const inventario of inventarios) {
        // Calcular métricas
        const ventasUltimos30Dias = inventario.ventas.length;
        const promedioVentasDiarias = ventasUltimos30Dias / 30;
        const diasDesdeUltimaVenta = Math.floor(
          (new Date() - new Date(inventario.ventas[0]?.fecha || new Date())) / (1000 * 60 * 60 * 24)
        );

        // Predicción de demanda
        const caracteristicas = tf.tensor2d([[
          inventario.stock,
          ventasUltimos30Dias,
          inventario.precio,
          new Date(inventario.ventas[0]?.fecha || new Date()).getTime(),
          diasDesdeUltimaVenta
        ]]);

        const prediccionDemanda = this.modeloPrediccion.predict(caracteristicas).dataSync()[0];

        // Generar sugerencia de reabastecimiento
        const sugerencia = {
          medicamentoId: inventario.medicamentoId,
          nombre: inventario.medicamento.nombre,
          stockActual: inventario.stock,
          ventasDiarias: promedioVentasDiarias,
          demandaProyectada: Math.round(prediccionDemanda),
          diasSinVenta: diasDesdeUltimaVenta,
          recomendacion: this.generarRecomendacion(
            inventario.stock, 
            promedioVentasDiarias, 
            prediccionDemanda
          )
        };

        sugerencias.push(sugerencia);
      }

      // Guardar sugerencias en base de datos
      await this.guardarSugerenciasInventario(sugerencias);

      return sugerencias;
    } catch (error) {
      console.error('Error al generar sugerencias:', error);
      return [];
    }
  }

  generarRecomendacion(stock, ventasDiarias, demandaProyectada) {
    const diasCobertura = stock / ventasDiarias;
    
    if (diasCobertura < 7) {
      return 'URGENTE: Reabastecer inmediatamente';
    } else if (diasCobertura < 15) {
      return 'Considerar reabastecimiento pronto';
    } else if (stock > demandaProyectada * 2) {
      return 'Sobrestock: Reducir pedidos';
    } else {
      return 'Stock adecuado';
    }
  }

  async guardarSugerenciasInventario(sugerencias) {
    try {
      // Eliminar sugerencias anteriores
      await prisma.sugerenciaInventario.deleteMany();

      // Crear nuevas sugerencias
      await prisma.sugerenciaInventario.createMany({
        data: sugerencias.map(s => ({
          medicamentoId: s.medicamentoId,
          stockActual: s.stockActual,
          ventasDiarias: s.ventasDiarias,
          demandaProyectada: s.demandaProyectada,
          diasSinVenta: s.diasSinVenta,
          recomendacion: s.recomendacion
        }))
      });

      console.log('Sugerencias de inventario guardadas');
    } catch (error) {
      console.error('Error al guardar sugerencias:', error);
    }
  }

  iniciarCronJob() {
    // Ejecutar cada hora
    cron.schedule('0 * * * *', async () => {
      console.log('Generando sugerencias de inventario...');
      await this.generarSugerenciasInventario();
    });
  }
}

module.exports = new AnalyticaService();