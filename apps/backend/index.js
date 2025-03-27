// src/index.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path'); // Añadido para manejar rutas de archivos

// Importar rutas
const authRoutes = require('./routes/auth.routes');
const usuarioRoutes = require('./routes/usuario.routes');
const farmaciaRoutes = require('./routes/farmacia.routes');
const medicamentoRoutes = require('./routes/medicamento.routes');
const ventaRoutes = require('./routes/venta.routes');
const devolucionRoutes = require('./routes/devolucion.routes');
const movimientoInventarioRoutes = require('./routes/movimientoInventario.routes');
const reservaRoutes = require('./routes/reserva.routes');
const prediccionRoutes = require('./routes/prediccion.routes');
const inventarioRoutes = require('./routes/inventario.routes');
// const analiticasRoutes = require('./routes/analiticas.routes');

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
app.use('/api/predicciones', authMiddleware.proteger, prediccionRoutes);
app.use('/api/inventarios', authMiddleware.proteger, inventarioRoutes);

// Ruta de análisis y dashboards
app.use('/api/analisis', authMiddleware.proteger, require('./routes/analisis.routes'));

// Ruta raíz de la API
app.get('/api', (req, res) => {
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

// Servir archivos estáticos del frontend desde 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Todas las rutas no API se redirigen al index.html del frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Middleware de manejo de errores (debe estar después de todas las rutas)
app.use(errorMiddleware);

// Iniciar servidor
app.listen(port, () => {
  console.log(`API de farmacia escuchando en http://localhost:${port}`);
  console.log(`Frontend servido desde ${path.join(__dirname, 'public')}`);
  console.log(`Módulo de predicciones activo en http://localhost:${port}/api/predicciones`);
});