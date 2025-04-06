import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Dashboard = () => {
  const [farmaciaId, setFarmaciaId] = useState('');
  const [medicamentosPopulares, setMedicamentosPopulares] = useState([]);
  const [ventasPorCategoria, setVentasPorCategoria] = useState([]);
  const [evolucionVentas, setEvolucionVentas] = useState([]);
  const [recomendaciones, setRecomendaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [ultimasActividades, setUltimasActividades] = useState([]);
  const [resumenDatos, setResumenDatos] = useState({
    totalVentas: 0,
    totalProductos: 0,
    totalDevoluciones: 0
  });

  useEffect(() => {
    // Obtener usuario desde localStorage
    let user;
    try {
      const userString = localStorage.getItem('user'); // Cambio de 'usuario' a 'user' para coincidir con tu app
      user = JSON.parse(userString || '{}');
    } catch (error) {
      console.error("Error parsing user data:", error);
      user = {};
    }

    // Si el usuario es administrador, cargar datos para todas las farmacias
    // Si es usuario de farmacia, cargar datos de su farmacia activa
    const rol = String(user.rol || '').trim().toUpperCase();
    
    if (rol === 'ADMIN') {
      // Para admin, intentamos obtener todas las farmacias y mostrar una general o la primera
      obtenerFarmaciasYCargarDatos();
    } else if (rol === 'FARMACIA' && user.farmaciaActivaId) {
      // Para usuario de farmacia, usamos su farmacia activa
      setFarmaciaId(user.farmaciaActivaId);
      cargarDatosFarmacia(user.farmaciaActivaId);
    } else {
      // Si no hay farmacia identificable, mostrar error
      setError("No se pudo identificar una farmacia para mostrar datos.");
      setLoading(false);
    }
  }, []);

  const obtenerFarmaciasYCargarDatos = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/farmacias', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Error al obtener farmacias');
      }

      const data = await response.json();
      
      if (data.status === 'success' && data.data && data.data.farmacias && data.data.farmacias.length > 0) {
        // Usar la primera farmacia para cargar datos
        const primeraFarmacia = data.data.farmacias[0];
        setFarmaciaId(primeraFarmacia.id);
        cargarDatosFarmacia(primeraFarmacia.id);
      } else {
        setError("No se encontraron farmacias registradas.");
        setLoading(false);
      }
    } catch (error) {
      console.error("Error al obtener farmacias:", error);
      setError("Error al cargar farmacias. " + error.message);
      setLoading(false);
    }
  };

  const cargarDatosFarmacia = async (id) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No se encontró token de autenticación');
      }

      // Obtener dashboard general
      const responseDashboard = await fetch(`/api/analisis/dashboard/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!responseDashboard.ok) {
        const errorText = await responseDashboard.text();
        console.error('Error en respuesta dashboard:', errorText);
        throw new Error(`Error al obtener datos del dashboard: ${responseDashboard.status}`);
      }

      const dashboardData = await responseDashboard.json();
      
      if (dashboardData.status !== 'success') {
        throw new Error('Error en formato de respuesta del servidor');
      }

      // Obtener medicamentos populares
      const responseMedicamentos = await fetch(`/api/analisis/medicamentos-populares/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // Obtener categorías
      const responseCategorias = await fetch(`/api/analisis/ventas-por-categoria/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // Obtener evolución de ventas
      const responseEvolucion = await fetch(`/api/analisis/evolucion-ventas/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // Obtener recomendaciones
      const responseRecomendaciones = await fetch(`/api/predicciones/recomendaciones-reabastecimiento/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // Obtener últimos movimientos
      const responseMovimientos = await fetch(`/api/movimientos?farmaciaId=${id}&limite=5`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // Procesar todas las respuestas
      if (responseMedicamentos.ok) {
        const medicamentosData = await responseMedicamentos.json();
        if (medicamentosData.status === 'success') {
          setMedicamentosPopulares(medicamentosData.data || []);
        }
      }

      if (responseCategorias.ok) {
        const categoriasData = await responseCategorias.json();
        if (categoriasData.status === 'success') {
          setVentasPorCategoria(categoriasData.data || []);
        }
      }

      if (responseEvolucion.ok) {
        const evolucionData = await responseEvolucion.json();
        if (evolucionData.status === 'success') {
          setEvolucionVentas(evolucionData.data || []);
        }
      }

      if (responseRecomendaciones.ok) {
        const recomendacionesData = await responseRecomendaciones.json();
        if (recomendacionesData.status === 'success') {
          setRecomendaciones(recomendacionesData.data?.recomendaciones || []);
        }
      }

      if (responseMovimientos.ok) {
        const movimientosData = await responseMovimientos.json();
        if (movimientosData.status === 'success' && movimientosData.data) {
          // Transformar movimientos a formato para mostrar actividad reciente
          const actividades = (movimientosData.data.movimientos || []).map(mov => ({
            id: mov.id,
            tipo: mov.tipo,
            descripcion: `${mov.tipo === 'INGRESO' ? 'Ingreso' : mov.tipo === 'SALIDA' ? 'Venta' : 'Ajuste'} de ${mov.cantidad} unidades`,
            medicamento: mov.inventario?.medicamento?.nombre || 'Medicamento',
            fecha: new Date(mov.fecha),
            usuario: mov.registradoPor?.nombre || 'Sistema'
          }));
          
          setUltimasActividades(actividades);
        }
      }

      // Establecer datos del resumen
      if (dashboardData.data) {
        setResumenDatos({
          totalVentas: dashboardData.data.metricas?.totalVentas || 0,
          totalProductos: dashboardData.data.metricas?.totalProductosVendidos || 0,
          totalDevoluciones: dashboardData.data.metricas?.totalDevoluciones || 0
        });
      }

      setLoading(false);
    } catch (err) {
      console.error("Error al cargar datos del dashboard:", err);
      setError("No se pudieron cargar los datos. Intente nuevamente más tarde.");
      setLoading(false);
    }
  };

  // Filtrar recomendaciones urgentes (para mostrar alertas)
  const recomendacionesUrgentes = recomendaciones.filter(
    rec => rec.porcentajeStock < 30
  );

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-semibold text-gray-800 mb-6">Panel de Control</h1>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-600">Cargando datos del dashboard...</span>
        </div>
      ) : error ? (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
          <p className="font-medium">Error</p>
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
          >
            Reintentar
          </button>
        </div>
      ) : (
        <>
          {/* Resumen de Estadísticas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-gray-500 text-sm font-medium mb-2">Medicamentos</h3>
              <div className="text-2xl font-bold text-gray-800">{medicamentosPopulares.length || 0}</div>
              <p className="text-sm text-gray-600">Top vendidos este mes</p>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-gray-500 text-sm font-medium mb-2">Ventas</h3>
              <div className="text-2xl font-bold text-gray-800">
                {resumenDatos.totalVentas}
              </div>
              <p className="text-sm text-gray-600">Total registradas</p>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-gray-500 text-sm font-medium mb-2">Alertas</h3>
              <div className="text-2xl font-bold text-yellow-500">{recomendacionesUrgentes.length || 0}</div>
              <p className="text-sm text-gray-600">Productos con stock crítico</p>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-gray-500 text-sm font-medium mb-2">Categorías</h3>
              <div className="text-2xl font-bold text-gray-800">{ventasPorCategoria.length || 0}</div>
              <p className="text-sm text-gray-600">Con ventas registradas</p>
            </div>
          </div>
          
          {/* Gráfico de evolución de ventas */}
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Evolución de Ventas</h2>
            {evolucionVentas && evolucionVentas.length > 0 ? (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={evolucionVentas}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="nombreMes" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="cantidad" stroke="#3B82F6" activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-72 flex items-center justify-center">
                <p className="text-gray-500">No hay datos de ventas suficientes para mostrar la evolución.</p>
              </div>
            )}
          </div>
          
          {/* Accesos Rápidos */}
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Accesos Rápidos</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <a 
                href="/ventas" 
                className="flex items-center p-4 bg-blue-50 rounded-lg shadow-sm hover:bg-blue-100 transition-colors"
              >
                <div className="rounded-full bg-blue-500 p-3 mr-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium text-gray-800">Registrar Venta</h3>
                  <p className="text-sm text-gray-600">Crear una nueva transacción de venta</p>
                </div>
              </a>
              
              <a 
                href="/inventario/movimientos" 
                className="flex items-center p-4 bg-green-50 rounded-lg shadow-sm hover:bg-green-100 transition-colors"
              >
                <div className="rounded-full bg-green-500 p-3 mr-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium text-gray-800">Ajustar Inventario</h3>
                  <p className="text-sm text-gray-600">Administrar stock y movimientos</p>
                </div>
              </a>
              
              <a 
                href="/devoluciones" 
                className="flex items-center p-4 bg-purple-50 rounded-lg shadow-sm hover:bg-purple-100 transition-colors"
              >
                <div className="rounded-full bg-purple-500 p-3 mr-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium text-gray-800">Procesar Devolución</h3>
                  <p className="text-sm text-gray-600">Gestionar devoluciones de productos</p>
                </div>
              </a>
            </div>
          </div>
          
          {/* Estado y Alertas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Alertas de Inventario</h2>
              
              {recomendacionesUrgentes.length > 0 ? (
                <div className="space-y-3">
                  {recomendacionesUrgentes.slice(0, 5).map(rec => (
                    <div key={rec.medicamentoId} className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                      <span className="text-sm text-gray-600">
                        <strong>{rec.nombre}</strong> - Stock: {rec.stockActual} ({rec.porcentajeStock}%)
                      </span>
                    </div>
                  ))}
                  
                  {recomendacionesUrgentes.length > 5 && (
                    <a href="/predicciones/recomendaciones" className="text-sm text-blue-500 hover:underline">
                      Ver todas las alertas ({recomendacionesUrgentes.length})
                    </a>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-600">No hay alertas de stock crítico actualmente.</p>
              )}
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Actividad Reciente</h2>
              
              {ultimasActividades.length > 0 ? (
                <div className="space-y-3">
                  {ultimasActividades.map(actividad => (
                    <div key={actividad.id} className="flex items-start">
                      <div className={`flex-shrink-0 rounded-full p-2 mr-3 ${
                        actividad.tipo === 'INGRESO' ? 'bg-green-100' : 
                        actividad.tipo === 'SALIDA' ? 'bg-blue-100' : 'bg-yellow-100'
                      }`}>
                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${
                          actividad.tipo === 'INGRESO' ? 'text-green-500' : 
                          actividad.tipo === 'SALIDA' ? 'text-blue-500' : 'text-yellow-500'
                        }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          {actividad.tipo === 'INGRESO' ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                          ) : actividad.tipo === 'SALIDA' ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                          ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          )}
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{actividad.descripcion}</p>
                        <p className="text-xs text-gray-600">{actividad.medicamento}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(actividad.fecha).toLocaleString()} - Por: {actividad.usuario}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-600">No hay actividades recientes registradas.</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;