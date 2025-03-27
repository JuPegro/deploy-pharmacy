// src/index.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Importar rutas
const authRoutes = require('./routes/auth.routes');
const usuarioRoutes = require('./routes/usuario.routes');
const farmaciaRoutes = require('./routes/farmacia.routes');
const medicamentoRoutes = require('./routes/medicamento.routes');
const ventaRoutes = require('./routes/venta.routes');
const devolucionRoutes = require('./routes/devolucion.routes');
const movimientoInventarioRoutes = require('./routes/movimientoInventario.routes');
const reservaRoutes = require('./routes/reserva.routes');
const prediccionRoutes = require('./routes/prediccion.routes'); // Nueva ruta de predicciones
const inventarioRoutes = require('./routes/inventario.routes'); // Nueva ruta de predicciones
// const analiticasRoutes = require('./routes/analiticas.routes'); // Nueva ruta de predicciones

// Importar middleware
const authMiddleware = require('./middleware/auth.middleware');
const errorMiddleware = require('./middleware/error.middleware');

// Configuración
dotenv.config();
const app = express();
const port = process.env.PORT || 3001;

// Middleware global
app.use(cors());
app.use(express.json());

// Rutas públicas
app.use('/api/auth', authRoutes);

// Rutas protegidas
app.use('/api/usuarios', authMiddleware.proteger, usuarioRoutes);
app.use('/api/farmacias', authMiddleware.proteger, farmaciaRoutes);
app.use('/api/medicamentos', authMiddleware.proteger, medicamentoRoutes);
app.use('/api/ventas', authMiddleware.proteger, ventaRoutes);
app.use('/api/devoluciones', authMiddleware.proteger, devolucionRoutes);
app.use('/api/movimientos', authMiddleware.proteger, movimientoInventarioRoutes);
app.use('/api/reservas', authMiddleware.proteger, reservaRoutes);
// app.use('/api/analiticas', authMiddleware.proteger, analiticasRoutes);
app.use('/api/predicciones', authMiddleware.proteger, prediccionRoutes); // Nueva ruta de predicciones
app.use('/api/inventarios', authMiddleware.proteger, inventarioRoutes); // Nueva ruta de predicciones

// Ruta de análisis y dashboards
app.use('/api/analisis', authMiddleware.proteger, require('./routes/analisis.routes')); // Análisis general

// Ruta raíz
app.get('/', (req, res) => {
  res.json({ 
    message: 'API de farmacia funcionando correctamente',
    version: '1.1.0',
    features: [
      'Gestión de inventario',
      'Ventas y devoluciones',
      'Predicción automática de demanda',
      'Análisis de datos de ventas',
      'Recomendaciones de stock óptimo'
    ]
  });
});

// Planificador de tareas para cálculos automáticos de predicciones
const { iniciarPlanificador } = require('./utils/planificador');
iniciarPlanificador();

// Middleware de manejo de errores
app.use(errorMiddleware);

// Iniciar servidor
app.listen(port, () => {
  console.log(`API de farmacia escuchando en http://localhost:${port}`);
  console.log(`Módulo de predicciones activo en http://localhost:${port}/api/predicciones`);
});