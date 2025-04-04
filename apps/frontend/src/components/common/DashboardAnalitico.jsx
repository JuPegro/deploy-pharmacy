// src/components/common/DashboardAnalitico.js
import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell 
} from 'recharts';

// Servicios de análisis
class MockServicioAnalisis {
  async analizarTodo() {
    // Retornar datos ficticios para probar la visualización
    return {
      metricasGenerales: {
        totalMedicamentosUnicos: 5,
        totalUnidadesInventario: 425,
        totalTransacciones: 7,
        totalUnidadesVendidas: 20,
        totalIngresos: 2150,
        valorInventario: 42500,
        ingresos30Dias: 2150,
        ingresos30a60: 1800,
        crecimientoPorcentaje: 19.44
      },
      productosPopulares: [
        {id: 'med1', nombre: 'Paracetamol 500mg', cantidad: 12, ingresos: 1200},
        {id: 'med2', nombre: 'Ibuprofeno 400mg', cantidad: 5, ingresos: 500},
        {id: 'med3', nombre: 'Amoxicilina 500mg', cantidad: 1, ingresos: 100},
        {id: 'med4', nombre: 'Loratadina 10mg', cantidad: 2, ingresos: 350}
      ],
      tendenciasTemporales: Array(90).fill().map((_, i) => {
        const fecha = new Date();
        fecha.setDate(fecha.getDate() - 90 + i);
        return {
          fecha: fecha.toISOString().split('T')[0],
          ingresos: 5000 + Math.random() * 2000,
          cantidad: 50 + Math.random() * 20,
          transacciones: 10 + Math.random() * 5,
          cambioPorcentual: Math.random() * 10 - 5
        };
      }),
      oportunidadesReposicion: [
        {id: 'med1', nombre: 'Paracetamol 500mg', stockActual: 70, promedioVentasDiarias: 4, diasEstimadosStock: 18, requiereReposicion: false},
        {id: 'med2', nombre: 'Ibuprofeno 400mg', stockActual: 30, promedioVentasDiarias: 3, diasEstimadosStock: 10, requiereReposicion: true},
        {id: 'med4', nombre: 'Loratadina 10mg', stockActual: 15, promedioVentasDiarias: 2, diasEstimadosStock: 8, requiereReposicion: true},
      ],
      excesosInventario: [
        {id: 'med3', nombre: 'Amoxicilina 500mg', cantidad: 100, rotacion: 0.01},
        {id: 'med5', nombre: 'Omeprazol 20mg', cantidad: 150, rotacion: 0},
      ],
      sugerenciasPromociones: [
        {par: 'med1-med2', frecuencia: 2, producto1: {id: 'med1', nombre: 'Paracetamol 500mg'}, producto2: {id: 'med2', nombre: 'Ibuprofeno 400mg'}},
        {par: 'med1-med4', frecuencia: 1, producto1: {id: 'med1', nombre: 'Paracetamol 500mg'}, producto2: {id: 'med4', nombre: 'Loratadina 10mg'}},
      ]
    };
  }
}

// Utilidades de formato
function formatoDinero(valor) {
  return new Intl.NumberFormat('es-DO', {
    style: 'currency',
    currency: 'DOP',
    minimumFractionDigits: 0
  }).format(valor);
}

function formatoNumero(valor) {
  return new Intl.NumberFormat('es-DO').format(valor);
}

// Componentes de iconos
const IconoProductos = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
  </svg>
);

const IconoVentas = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-500" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
  </svg>
);

const IconoGanancias = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-500" viewBox="0 0 20 20" fill="currentColor">
    <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
    <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
  </svg>
);

const IconoInventario = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
    <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
  </svg>
);

// Componente principal
const DashboardAnalitico = ({ modo = 'farmacia' }) => {
  // Quitamos la dependencia de useAuth y usamos valores simulados
  const user = {
    farmaciaActivaId: 'f1',
    farmaciaActiva: { 
      id: 'f1', 
      nombre: 'Farmacia Central' 
    },
    farmacias: [
      { id: 'f1', nombre: 'Farmacia Central' },
      { id: 'f2', nombre: 'Farmacia Norte' }
    ]
  };

  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [periodoAnalisis, setPeriodoAnalisis] = useState(90); // días
  const [farmaciaSeleccionada, setFarmaciaSeleccionada] = useState(user.farmaciaActivaId);
  
  // Seleccionar la farmacia correcta según el modo
  useEffect(() => {
    if (modo === 'farmacia' && user?.farmaciaActivaId) {
      setFarmaciaSeleccionada(user.farmaciaActivaId);
    }
  }, [modo, user]);

  // Cargar datos cuando se selecciona una farmacia
  useEffect(() => {
    if (!farmaciaSeleccionada) return;
    
    const cargarDatos = async () => {
      try {
        setCargando(true);
        setError(null);
        
        // Usamos siempre el servicio mock para desarrollo
        const servicioAnalisis = new MockServicioAnalisis();
        
        const resultados = await servicioAnalisis.analizarTodo();
        
        if (!resultados || 
            !resultados.productosPopulares || 
            !resultados.tendenciasTemporales || 
            !resultados.metricasGenerales) {
          throw new Error('Los datos retornados no tienen el formato esperado');
        }
        
        setDatos(resultados);
      } catch (err) {
        console.error('Error al cargar datos de análisis:', err);
        setError(`Error al cargar los datos de análisis: ${err.message}`);
      } finally {
        setCargando(false);
      }
    };
    
    cargarDatos();
  }, [farmaciaSeleccionada, periodoAnalisis]);
  
  // Cambiar farmacia (solo para admin)
  const cambiarFarmacia = (id) => {
    setFarmaciaSeleccionada(id);
  };
  
  if (!farmaciaSeleccionada && modo === 'admin') {
    return (
      <div className="bg-blue-50 p-6 rounded-lg text-center">
        <p className="text-blue-700 mb-4">Seleccione una farmacia para ver el análisis</p>
        {/* Aquí podría ir un selector de farmacias */}
      </div>
    );
  }
  
  if (!farmaciaSeleccionada && modo === 'farmacia') {
    return (
      <div className="bg-yellow-50 p-6 rounded-lg text-center">
        <p className="text-yellow-700 mb-4">No tiene una farmacia activa seleccionada</p>
        <p className="text-sm text-yellow-600">Por favor seleccione una farmacia desde el selector en la barra superior</p>
      </div>
    );
  }
  
  if (cargando) return (
    <div className="flex flex-col items-center justify-center h-64">
      <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-gray-600">Cargando análisis de tendencias...</p>
    </div>
  );
  
  if (error) return (
    <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
      <div className="flex">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3">
          <h3 className="text-sm leading-5 font-medium text-red-800">Error de carga</h3>
          <p className="text-sm leading-5 text-red-700 mt-1">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-3 px-4 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            Intentar nuevamente
          </button>
        </div>
      </div>
    </div>
  );
  
  if (!datos) return (
    <div className="bg-blue-50 p-4 rounded text-center">
      <p className="text-blue-700">No hay datos disponibles para analizar</p>
    </div>
  );
  
  const { metricasGenerales } = datos;
  const farmacia = user?.farmacias?.find(f => f.id === farmaciaSeleccionada) || 
                  user?.farmaciaActiva || 
                  { nombre: 'Farmacia seleccionada' };
  
  return (
    <div className="bg-gray-50 p-6 rounded-lg shadow">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          Análisis de {farmacia.nombre}
        </h2>
        
        <div className="flex space-x-2">
          <label className="flex items-center">
            <span className="mr-2 text-gray-700">Periodo:</span>
            <select 
              value={periodoAnalisis} 
              onChange={(e) => setPeriodoAnalisis(Number(e.target.value))}
              className="border border-gray-300 rounded px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={30}>Último mes</option>
              <option value={90}>Últimos 3 meses</option>
              <option value={180}>Últimos 6 meses</option>
              <option value={365}>Último año</option>
            </select>
          </label>

          </div>
      </div>
      
      {/* Panel de Métricas Generales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
          <div className="flex items-center">
            <div className="flex-shrink-0 mr-3">
              <IconoProductos />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Total de Medicamentos</p>
              <div className="flex items-baseline">
                <p className="text-2xl font-semibold text-gray-800">
                  {formatoNumero(metricasGenerales.totalMedicamentosUnicos)}
                </p>
                <p className="ml-2 text-sm text-gray-600">
                  SKUs / {formatoNumero(metricasGenerales.totalUnidadesInventario)} unidades
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
          <div className="flex items-center">
          <div className="flex-shrink-0 mr-3">
              <IconoVentas />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Total de Ventas</p>
              <div className="flex items-baseline">
                <p className="text-2xl font-semibold text-gray-800">
                  {formatoNumero(metricasGenerales.totalTransacciones)}
                </p>
                <p className="ml-2 text-sm text-gray-600">
                  transacciones / {formatoNumero(metricasGenerales.totalUnidadesVendidas)} unidades
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-purple-500">
          <div className="flex items-center">
            <div className="flex-shrink-0 mr-3">
              <IconoGanancias />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Total de Ingresos</p>
              <div className="flex items-baseline">
                <p className="text-2xl font-semibold text-gray-800">
                  {formatoDinero(metricasGenerales.totalIngresos)}
                </p>
                <p className="ml-2 text-sm text-gray-600">
                  {metricasGenerales.crecimientoPorcentaje > 0 ? 
                    <span className="text-green-600">+{metricasGenerales.crecimientoPorcentaje.toFixed(1)}% </span> : 
                    <span className="text-red-600">{metricasGenerales.crecimientoPorcentaje.toFixed(1)}% </span>
                  }
                  vs prev.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-yellow-500">
          <div className="flex items-center">
            <div className="flex-shrink-0 mr-3">
              <IconoInventario />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Valor de Inventario</p>
              <div className="flex items-baseline">
                <p className="text-2xl font-semibold text-gray-800">
                  {formatoDinero(metricasGenerales.valorInventario)}
                </p>
                <p className="ml-2 text-sm text-gray-600">
                  en {formatoNumero(metricasGenerales.totalUnidadesInventario)} unidades
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Gráfico de Tendencia de Ventas */}
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Tendencia de Ventas</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={datos.tendenciasTemporales.slice(-periodoAnalisis)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="fecha" tick={{fontSize: 12}} />
                <YAxis yAxisId="left" tick={{fontSize: 12}} />
                <Tooltip formatter={(value) => [formatoDinero(value), 'Ingresos']} />
                <Legend />
                <Line 
                  yAxisId="left" 
                  type="monotone" 
                  dataKey="ingresos" 
                  stroke="#3B82F6" 
                  name="Ingresos"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Top Productos por Ventas */}
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Top Productos por Ventas</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={datos.productosPopulares.slice(0, 5)} 
                layout="vertical"
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tick={{fontSize: 12}} />
                <YAxis 
                  type="category" 
                  dataKey="nombre" 
                  width={150}
                  tick={{fontSize: 12}}
                />
                <Tooltip formatter={(value, name) => [
                  name === 'cantidad' ? `${value} unidades` : formatoDinero(value),
                  name === 'cantidad' ? 'Unidades vendidas' : 'Ingresos'
                ]} />
                <Legend />
                <Bar dataKey="cantidad" fill="#3B82F6" name="Unidades" />
                <Bar dataKey="ingresos" fill="#10B981" name="Ingresos" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Alertas de Reposición */}
        <div className="bg-white rounded-lg shadow">
          <div className="bg-red-100 px-4 py-2 rounded-t-lg border-b border-red-200">
            <h3 className="text-lg font-semibold text-red-800">Alertas de Reposición</h3>
          </div>
          <div className="p-4">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Vta. diaria</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Días rest.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {datos.oportunidadesReposicion
                    .filter(item => item.requiereReposicion)
                    .slice(0, 5)
                    .map(item => (
                      <tr key={item.id} className={item.diasEstimadosStock < 7 ? 'bg-red-50' : 'bg-yellow-50'}>
                        <td className="px-3 py-2 text-sm text-gray-900">{item.nombre}</td>
                        <td className="px-3 py-2 text-sm text-gray-900 text-right">{formatoNumero(item.stockActual)}</td>
                        <td className="px-3 py-2 text-sm text-gray-900 text-right">{item.promedioVentasDiarias.toFixed(1)}</td>
                        <td className="px-3 py-2 text-sm font-medium text-right">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            item.diasEstimadosStock < 7 
                              ? 'bg-red-200 text-red-800' 
                              : 'bg-yellow-200 text-yellow-800'
                          }`}>
                            {item.diasEstimadosStock} días
                          </span>
                        </td>
                      </tr>
                    ))}
                  {datos.oportunidadesReposicion.filter(item => item.requiereReposicion).length === 0 && (
                    <tr>
                      <td colSpan="4" className="px-3 py-4 text-sm text-center text-gray-500">
                        No hay alertas de reposición activas
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="mt-3">
              <a href="/inventario/recomendaciones" className="text-sm text-blue-600 hover:text-blue-800">
                Ver todas las recomendaciones →
              </a>
            </div>
          </div>
        </div>
        
        {/* Exceso de Inventario */}
        <div className="bg-white rounded-lg shadow">
          <div className="bg-blue-100 px-4 py-2 rounded-t-lg border-b border-blue-200">
            <h3 className="text-lg font-semibold text-blue-800">Exceso de Inventario</h3>
          </div>
          <div className="p-4">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Rotación</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {datos.excesosInventario.slice(0, 5).map(item => (
                    <tr key={item.id}>
                      <td className="px-3 py-2 text-sm text-gray-900">{item.nombre}</td>
                      <td className="px-3 py-2 text-sm text-gray-900 text-right">{formatoNumero(item.cantidad)}</td>
                      <td className="px-3 py-2 text-sm text-gray-900 text-right">
                        <span className="px-2 py-1 rounded-full text-xs bg-blue-200 text-blue-800">
                          {(item.rotacion * 100).toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                  {datos.excesosInventario.length === 0 && (
                    <tr>
                      <td colSpan="3" className="px-3 py-4 text-sm text-center text-gray-500">
                        No hay productos con exceso de inventario
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        
        {/* Sugerencias de Promociones */}
        <div className="bg-white rounded-lg shadow">
          <div className="bg-green-100 px-4 py-2 rounded-t-lg border-b border-green-200">
            <h3 className="text-lg font-semibold text-green-800">Sugerencias de Promociones</h3>
          </div>
          <div className="p-4">
            {datos.sugerenciasPromociones.slice(0, 3).map((sugerencia, index) => (
              <div key={sugerencia.par} className="mb-3 p-3 border-l-4 border-green-500 bg-green-50 rounded">
                <div className="font-medium text-green-800">Promoción #{index + 1}</div>
                <div className="text-sm font-medium my-1">
                  {sugerencia.producto1.nombre} + {sugerencia.producto2.nombre}
                </div>
                <div className="text-xs text-gray-600">
                  Se compran juntos <span className="font-semibold">{sugerencia.frecuencia}</span> veces.
                  Considere crear un paquete promocional.
                </div>
              </div>
            ))}
            {datos.sugerenciasPromociones.length === 0 && (
              <div className="py-4 text-sm text-center text-gray-500">
                No hay sugerencias de promociones disponibles
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardAnalitico;