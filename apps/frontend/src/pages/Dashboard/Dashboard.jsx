import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

const Dashboard = () => {

  // Función auxiliar para obtener el nombre del mes
  const obtenerNombreMes = (mes) => {
    const meses = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return meses[mes - 1];
  };

  const [farmaciaId, setFarmaciaId] = useState('');
  const [farmaciaSeleccionada, setFarmaciaSeleccionada] = useState(null);
  const [farmacias, setFarmacias] = useState([]);
  
  // Datos para gráficos y estadísticas
  const [medicamentosPopulares, setMedicamentosPopulares] = useState([]);
  const [ventasPorCategoria, setVentasPorCategoria] = useState([]);
  const [evolucionVentas, setEvolucionVentas] = useState([]);
  const [ventasPorMesAnio, setVentasPorMesAnio] = useState([]);
  const [devolucionesPorMesAnio, setDevolucionesPorMesAnio] = useState([]);
  const [prediccionesVentas, setPrediccionesVentas] = useState([]);
  const [recomendaciones, setRecomendaciones] = useState([]);
  
  // Estados de la interfaz
  const [loading, setLoading] = useState(true);
  const [graficosEnCarga, setGraficosEnCarga] = useState({});
  const [error, setError] = useState(null);
  const [ultimasActividades, setUltimasActividades] = useState([]);
  
  // Resumen general
  const [resumenDatos, setResumenDatos] = useState({
    totalVentas: 0,
    totalProductos: 0,
    totalDevoluciones: 0,
    porcentajeDevolucion: 0
  });

  // Colores para los gráficos
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1', '#a4de6c', '#d0ed57'];

  useEffect(() => {
    // Obtener usuario desde localStorage
    let user;
    try {
      const userString = localStorage.getItem('user');
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
      obtenerFarmacias();
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

  const obtenerFarmacias = async () => {
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
        setFarmacias(data.data.farmacias);
        // Usar la primera farmacia para cargar datos
        const primeraFarmacia = data.data.farmacias[0];
        setFarmaciaSeleccionada(primeraFarmacia);
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

  const cambiarFarmacia = (event) => {
    const id = event.target.value;
    setFarmaciaId(id);
    const farmacia = farmacias.find(f => f.id === id);
    setFarmaciaSeleccionada(farmacia);
    cargarDatosFarmacia(id);
  };

  const cargarDatosEspecificos = async (id, tipoGrafico) => {
    if (!id) return;

    // Indicar que este gráfico está cargando
    setGraficosEnCarga(prev => ({ ...prev, [tipoGrafico]: true }));
    
    const token = localStorage.getItem('token');
    if (!token) {
      setGraficosEnCarga(prev => ({ ...prev, [tipoGrafico]: false }));
      return;
    }
    
    const config = {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
    
    try {
      if (tipoGrafico === 'medicamentos-populares') {
        // Intentar múltiples endpoints para obtener medicamentos populares
        const endpoints = [
          `/api/predicciones/medicamentos-mas-vendidos/${id}`,
          `/api/analisis/medicamentos-populares/${id}`
        ];
        
        let medicamentosData = null;
        
        // Intentar cada endpoint hasta encontrar datos
        for (const endpoint of endpoints) {
          try {
            const response = await fetch(endpoint, config);
            
            if (response.ok) {
              const data = await response.json();
              
              if (data.status === 'success') {
                if (endpoint.includes('predicciones')) {
                  medicamentosData = data.data?.medicamentos || [];
                } else {
                  medicamentosData = data.data || [];
                }
                
                if (medicamentosData.length > 0) break;
              }
            }
          } catch (error) {
            console.error(`Error con endpoint ${endpoint}:`, error);
          }
        }
        
        // Si no encontramos datos, podemos usar datos de demostración
        if (!medicamentosData || medicamentosData.length === 0) {
          medicamentosData = [
            { id: '1', nombre: 'Paracetamol', cantidadVendida: 250, categoria: 'Analgésico' },
            { id: '2', nombre: 'Ibuprofeno', cantidadVendida: 180, categoria: 'Antiinflamatorio' },
            { id: '3', nombre: 'Amoxicilina', cantidadVendida: 120, categoria: 'Antibiótico' },
            { id: '4', nombre: 'Omeprazol', cantidadVendida: 95, categoria: 'Antiácido' },
            { id: '5', nombre: 'Loratadina', cantidadVendida: 75, categoria: 'Antihistamínico' }
          ];
        }
        
        // Normalizar y formatear los datos
        const medicamentosConColor = medicamentosData.map((med, index) => ({
          id: med.id || `med-${index}`,
          nombre: med.nombre || 'Medicamento sin nombre',
          cantidad: med.cantidadVendida || med.cantidad || 0,
          categoria: med.categoria || 'Sin categoría',
          color: COLORS[index % COLORS.length]
        }));
        
        setMedicamentosPopulares(medicamentosConColor);
      } else if (tipoGrafico === 'ventas-devoluciones') {
        // Cargar solo los datos para el gráfico de ventas vs devoluciones
        const [ventasResponse, devolucionesResponse] = await Promise.all([
          fetch(`/api/ventas/por-mes-anio/${id}`, config),
          fetch(`/api/devoluciones/por-mes-anio/${id}`, config)
        ]);
        
        if (ventasResponse.ok) {
          const ventasData = await ventasResponse.json();
          if (ventasData.status === 'success') {
            setVentasPorMesAnio(ventasData.data?.ventasPorMesAnio || []);
          }
        }
        
        if (devolucionesResponse.ok) {
          const devolucionesData = await devolucionesResponse.json();
          if (devolucionesData.status === 'success') {
            setDevolucionesPorMesAnio(devolucionesData.data?.devolucionesPorMesAnio || []);
          }
        }
      } else if (tipoGrafico === 'ventas-por-categoria') {
        // Cargar datos para el gráfico de ventas por categoría
        const response = await fetch(`/api/analisis/ventas-por-categoria/${id}`, config);
        
        if (response.ok) {
          const categoriasData = await response.json();
          if (categoriasData.status === 'success') {
            // Añadir colores para gráfico de pastel
            const categoriasConColor = (categoriasData.data || []).map((cat, index) => ({
              ...cat,
              color: COLORS[index % COLORS.length]
            }));
            setVentasPorCategoria(categoriasConColor);
          }
        }
      } else if (tipoGrafico === 'evolucion-ventas') {
        // Cargar datos para el gráfico de evolución de ventas
        const response = await fetch(`/api/analisis/evolucion-ventas/${id}`, config);
        
        if (response.ok) {
          const evolucionData = await response.json();
          if (evolucionData.status === 'success') {
            setEvolucionVentas(evolucionData.data || []);
          }
        }
      }
    } catch (error) {
      console.error(`Error al cargar datos específicos (${tipoGrafico}):`, error);
    } finally {
      // Indicar que este gráfico terminó de cargar (exitosamente o con error)
      setGraficosEnCarga(prev => ({ ...prev, [tipoGrafico]: false }));
    }
  };

  const cargarDatosFarmacia = async (id) => {
    if (!id) return;
    
    setLoading(true);
    setError(null);
    setGraficosEnCarga({});
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No se encontró token de autenticación');
      }

      // Configuración común para las peticiones
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };
      
      // Función para procesar respuestas y manejar errores
      const procesarRespuesta = async (response, defaultData = []) => {
        if (!response.ok) {
          // Para debug, imprimir errores detallados
          try {
            const errorText = await response.text();
            console.error(`Error en respuesta (${response.status}):`, errorText);
          } catch (e) {
            console.error(`Error al leer respuesta: ${e.message}`);
          }
          return defaultData;
        }
        
        try {
          const data = await response.json();
          return (data.status === 'success' && data.data) ? data.data : defaultData;
        } catch (error) {
          console.error('Error al parsear JSON:', error);
          return defaultData;
        }
      };

      // Usamos Promise.all para realizar todas las peticiones en paralelo
      const [
        dashboardResponse, 
        medicamentosResponse, 
        categoriasResponse, 
        evolucionResponse,
        tendenciaResponse,
        recomendacionesResponse,
        movimientosResponse,
        ventasPorMesResponse,
        devolucionesPorMesResponse,
        medicamentosMasVendidosResponse
      ] = await Promise.all([
        // Dashboard general
        fetch(`/api/analisis/dashboard/${id}`, config).catch(error => {
          console.error('Error al obtener dashboard:', error);
          return { ok: false };
        }),
        
        // Medicamentos populares
        fetch(`/api/analisis/medicamentos-populares/${id}`, config).catch(error => {
          console.error('Error al obtener medicamentos populares:', error);
          return { ok: false };
        }),
        
        // Ventas por categoría
        fetch(`/api/analisis/ventas-por-categoria/${id}`, config).catch(error => {
          console.error('Error al obtener ventas por categoría:', error);
          return { ok: false };
        }),
        
        // Evolución de ventas
        fetch(`/api/analisis/evolucion-ventas/${id}`, config).catch(error => {
          console.error('Error al obtener evolución de ventas:', error);
          return { ok: false };
        }),
        
        // Tendencia de ventas (predicciones)
        fetch(`/api/predicciones/tendencia-ventas/${id}`, config).catch(error => {
          console.error('Error al obtener tendencia de ventas:', error);
          return { ok: false };
        }),
        
        // Recomendaciones de reabastecimiento
        fetch(`/api/predicciones/recomendaciones-reabastecimiento/${id}`, config).catch(error => {
          console.error('Error al obtener recomendaciones:', error);
          return { ok: false };
        }),
        
        // Movimientos recientes
        fetch(`/api/movimientos?farmaciaId=${id}&limite=5`, config).catch(error => {
          console.error('Error al obtener movimientos:', error);
          return { ok: false };
        }),
        
        // Ventas por mes y año
        fetch(`/api/ventas/por-mes-anio/${id}`, config).catch(error => {
          console.error('Error al obtener ventas por mes:', error);
          return { ok: false };
        }),
        
        // Devoluciones por mes y año
        fetch(`/api/devoluciones/por-mes-anio/${id}`, config).catch(error => {
          console.error('Error al obtener devoluciones por mes:', error);
          return { ok: false };
        }),
        
        // Medicamentos más vendidos (analíticas predictivas)
        fetch(`/api/predicciones/medicamentos-mas-vendidos/${id}`, config).catch(error => {
          console.error('Error al obtener medicamentos más vendidos:', error);
          return { ok: false };
        })
      ]);

      // Procesar todas las respuestas
      // Dashboard principal
      const dashboardData = await procesarRespuesta(dashboardResponse, { metricas: {} });
      if (dashboardResponse.ok) {
        setResumenDatos({
          totalVentas: dashboardData.metricas?.totalVentas || 0,
          totalProductos: dashboardData.metricas?.totalProductosVendidos || 0,
          totalDevoluciones: dashboardData.metricas?.totalDevoluciones || 0,
          porcentajeDevolucion: dashboardData.metricas?.porcentajeDevolucion || 0
        });
      }
      
      // Medicamentos populares - AQUÍ ESTÁ LA MEJORA PRINCIPAL
      // Intentamos varias fuentes de datos para medicamentos populares
      let medicamentosPopularesData = [];

      if (medicamentosResponse.ok) {
        const medicamentosData = await procesarRespuesta(medicamentosResponse, []);
        if (medicamentosData && medicamentosData.length > 0) {
          medicamentosPopularesData = medicamentosData;
        }
      }

      // Si no hay datos de la primera fuente, intentamos con datos de analíticas predictivas
      if (medicamentosPopularesData.length === 0 && medicamentosMasVendidosResponse.ok) {
        const medicamentosMasVendidosData = await procesarRespuesta(medicamentosMasVendidosResponse, { medicamentos: [] });
        if (medicamentosMasVendidosData.medicamentos && medicamentosMasVendidosData.medicamentos.length > 0) {
          medicamentosPopularesData = medicamentosMasVendidosData.medicamentos.map(med => ({
            id: med.id,
            nombre: med.nombre,
            cantidad: med.cantidadVendida,
            categoria: med.categoria
          }));
        }
      }

      // Si aún no hay datos, usar datos de demostración
      if (medicamentosPopularesData.length === 0) {
        medicamentosPopularesData = [
          { id: '1', nombre: 'Paracetamol', cantidad: 250, categoria: 'Analgésico' },
          { id: '2', nombre: 'Ibuprofeno', cantidad: 180, categoria: 'Antiinflamatorio' },
          { id: '3', nombre: 'Amoxicilina', cantidad: 120, categoria: 'Antibiótico' },
          { id: '4', nombre: 'Omeprazol', cantidad: 95, categoria: 'Antiácido' },
          { id: '5', nombre: 'Loratadina', cantidad: 75, categoria: 'Antihistamínico' }
        ];
      }

      // Añadir colores para gráfico de pastel
      const medicamentosConColor = medicamentosPopularesData.map((med, index) => ({
        ...med,
        color: COLORS[index % COLORS.length]
      }));
      setMedicamentosPopulares(medicamentosConColor);
      
      // Categorías
      if (categoriasResponse.ok) {
        const categoriasData = await procesarRespuesta(categoriasResponse, []);
        // Añadir colores para gráfico de pastel
        const categoriasConColor = (categoriasData || []).map((cat, index) => ({
          ...cat,
          color: COLORS[index % COLORS.length]
        }));
        setVentasPorCategoria(categoriasConColor);
      }
      
      // Evolución ventas
      if (evolucionResponse.ok) {
        const evolucionData = await procesarRespuesta(evolucionResponse, []);
        setEvolucionVentas(evolucionData || []);
      }
      
      // Tendencia y predicción de ventas
      if (tendenciaResponse.ok) {
        const tendenciaData = await procesarRespuesta(tendenciaResponse, { tendencia: [] });
        setPrediccionesVentas(tendenciaData.tendencia || []);
      }
      
      // Recomendaciones
      if (recomendacionesResponse.ok) {
        const recomendacionesData = await procesarRespuesta(recomendacionesResponse, { recomendaciones: [] });
        setRecomendaciones(recomendacionesData.recomendaciones || []);
      }
      
      // Movimientos recientes
      if (movimientosResponse.ok) {
        const movimientosData = await procesarRespuesta(movimientosResponse, { movimientos: [] });
        // Transformar movimientos a formato para mostrar actividad reciente
        const actividades = (movimientosData.movimientos || []).map(mov => ({
          id: mov.id,
          tipo: mov.tipo,
          descripcion: `${mov.tipo === 'INGRESO' ? 'Ingreso' : mov.tipo === 'SALIDA' ? 'Venta' : 'Ajuste'} de ${mov.cantidad} unidades`,
          medicamento: mov.inventario?.medicamento?.nombre || 'Medicamento',
          fecha: new Date(mov.fecha),
          usuario: mov.registradoPor?.nombre || 'Sistema'
        }));
        
        setUltimasActividades(actividades);
      }
      
      // Ventas por mes y año
      if (ventasPorMesResponse.ok) {
        const ventasPorMesData = await procesarRespuesta(ventasPorMesResponse, { ventasPorMesAnio: [] });
        setVentasPorMesAnio(ventasPorMesData.ventasPorMesAnio || []);
      }
      
      // Devoluciones por mes y año
      if (devolucionesPorMesResponse.ok) {
        const devolucionesPorMesData = await procesarRespuesta(devolucionesPorMesResponse, { devolucionesPorMesAnio: [] });
        setDevolucionesPorMesAnio(devolucionesPorMesData.devolucionesPorMesAnio || []);
      }

      setLoading(false);
    } catch (err) {
      console.error("Error al cargar datos del dashboard:", err);
      setError("No se pudieron cargar los datos. Intente nuevamente más tarde.");
      setLoading(false);
    }
  };

  // Preparar datos para gráfico de ventas vs devoluciones
  const prepararDatosVentasDevoluciones = () => {
    try {
      // Verificar si hay datos suficientes
      if (!ventasPorMesAnio.length && !devolucionesPorMesAnio.length) {
        return []; // Retornar array vacío si no hay datos
      }
      
      // Agrupar por mes-año
      const mesAnioMap = new Map();
      
      // Procesar ventas
      ventasPorMesAnio.forEach(venta => {
        // Verificar que los campos existan y sean válidos
        if (venta && 'anio' in venta && 'mes' in venta) {
          const key = `${venta.anio}-${venta.mes}`;
          if (!mesAnioMap.has(key)) {
            mesAnioMap.set(key, {
              label: `${obtenerNombreMes(Number(venta.mes))} ${venta.anio}`,
              ventas: Number(venta.unidades_vendidas || 0),
              devoluciones: 0
            });
          } else {
            const actual = mesAnioMap.get(key);
            mesAnioMap.set(key, {
              ...actual,
              ventas: actual.ventas + Number(venta.unidades_vendidas || 0)
            });
          }
        }
      });
      
      // Procesar devoluciones
      devolucionesPorMesAnio.forEach(devolucion => {
        // Verificar que los campos existan y sean válidos
        if (devolucion && 'anio' in devolucion && 'mes' in devolucion) {
          const key = `${devolucion.anio}-${devolucion.mes}`;
          if (!mesAnioMap.has(key)) {
            mesAnioMap.set(key, {
              label: `${obtenerNombreMes(Number(devolucion.mes))} ${devolucion.anio}`,
              ventas: 0,
              devoluciones: Number(devolucion.unidades_devueltas || 0)
            });
          } else {
            const actual = mesAnioMap.get(key);
            mesAnioMap.set(key, {
              ...actual,
              devoluciones: actual.devoluciones + Number(devolucion.unidades_devueltas || 0)
            });
          }
        }
      });
      
      // Convertir a array y ordenar por fecha
      return Array.from(mesAnioMap.entries())
        .map(([key, value]) => ({
          ...value,
          key
        }))
        .sort((a, b) => {
          const [yearA, monthA] = a.key.split('-');
          const [yearB, monthB] = b.key.split('-');
          return yearA === yearB ? 
            parseInt(monthA) - parseInt(monthB) : 
            parseInt(yearA) - parseInt(yearB);
        })
        .slice(-6); // Últimos 6 meses
    } catch (error) {
      console.error("Error al preparar datos de ventas y devoluciones:", error);
      return []; // En caso de error, devolver array vacío
    }
  };
  
  // Componente para mostrar un botón de actualización de datos
  const BotonActualizar = ({ onClick, etiqueta = "Actualizar datos", isLoading = false }) => (
    <button
      onClick={onClick}
      disabled={isLoading}
      className={`mt-3 px-4 py-2 ${isLoading ? 'bg-gray-400' : 'bg-blue-500 hover:bg-blue-600'} text-white text-sm rounded transition-colors flex items-center`}
    >
      {isLoading ? (
        <>
          <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
          <span>Cargando...</span>
        </>
      ) : (
        <>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {etiqueta}
        </>
      )}
    </button>
  );
  
  // Filtrar recomendaciones urgentes (para mostrar alertas)
  const recomendacionesUrgentes = recomendaciones.filter(
    rec => rec.porcentajeStock < 30
  );

  // Datos procesados para el gráfico de comparación
  const datosVentasDevoluciones = prepararDatosVentasDevoluciones();


  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Panel de Control</h1>
        
        {/* Selector de farmacia para administradores */}
        {farmacias.length > 0 && (
          <div className="flex items-center">
            <label htmlFor="farmacia-selector" className="mr-2 text-gray-700">Farmacia:</label>
            <select
              id="farmacia-selector"
              value={farmaciaId}
              onChange={cambiarFarmacia}
              className="border rounded-md p-2 bg-white"
            >
              {farmacias.map(farmacia => (
                <option key={farmacia.id} value={farmacia.id}>
                  {farmacia.nombre}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
      
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
              <h3 className="text-gray-500 text-sm font-medium mb-2">Ventas Totales</h3>
              <div className="text-2xl font-bold text-gray-800">{resumenDatos.totalVentas}</div>
              <p className="text-sm text-gray-600">Transacciones registradas</p>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-gray-500 text-sm font-medium mb-2">Productos Vendidos</h3>
              <div className="text-2xl font-bold text-blue-600">{resumenDatos.totalProductos}</div>
              <p className="text-sm text-gray-600">Unidades despachadas</p>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-gray-500 text-sm font-medium mb-2">Devoluciones</h3>
              <div className="text-2xl font-bold text-orange-500">{resumenDatos.totalDevoluciones}</div>
              <p className="text-sm text-gray-600">Total procesadas</p>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-gray-500 text-sm font-medium mb-2">Tasa de Devolución</h3>
              <div className="text-2xl font-bold text-indigo-600">{resumenDatos.porcentajeDevolucion.toFixed(2)}%</div>
              <p className="text-sm text-gray-600">% productos devueltos</p>
            </div>
          </div>
          
          {/* Gráficos principales */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Evolución de Ventas */}
            <div className="bg-white rounded-lg shadow p-6">
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
                        bottom: 25,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="nombreMes" angle={-45} textAnchor="end" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="cantidad" name="Unidades vendidas" stroke="#3B82F6" strokeWidth={2} activeDot={{ r: 8 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-72 flex flex-col items-center justify-center">
                  <p className="text-gray-500">No hay datos de ventas suficientes para mostrar la evolución.</p>
                  <BotonActualizar 
                    onClick={() => cargarDatosEspecificos(farmaciaId, 'evolucion-ventas')} 
                    etiqueta="Intentar cargar datos" 
                    isLoading={graficosEnCarga['evolucion-ventas']}
                  />
                </div>
              )}
            </div>
            
            {/* Ventas vs Devoluciones */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Ventas vs Devoluciones</h2>
              {datosVentasDevoluciones.length > 0 ? (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                      data={datosVentasDevoluciones}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 25,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="label" angle={-45} textAnchor="end" />
                      <YAxis />
                      <Tooltip formatter={(value) => [value, ""]} />
                      <Legend />
                      <Bar dataKey="ventas" name="Ventas" fill="#4ADE80" />
                      <Bar dataKey="devoluciones" name="Devoluciones" fill="#F97316" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-72 flex flex-col items-center justify-center">
                  <p className="text-gray-500">No hay datos suficientes para mostrar la comparación.</p>
                  <BotonActualizar 
                    onClick={() => cargarDatosEspecificos(farmaciaId, 'ventas-devoluciones')} 
                    etiqueta="Intentar cargar datos" 
                    isLoading={graficosEnCarga['ventas-devoluciones']}
                  />
                </div>
              )}
            </div>
            
            {/* Medicamentos Más Vendidos */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Medicamentos Más Vendidos</h2>
              {medicamentosPopulares.length > 0 ? (
                <div className="h-72 flex flex-col md:flex-row">
                  <div className="w-full md:w-1/2">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          dataKey="cantidad"
                          isAnimationActive={true}
                          data={medicamentosPopulares.slice(0, 5)}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label={({name, percent}) => `${Math.round(percent * 100)}%`}
                        >
                          {medicamentosPopulares.slice(0, 5).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value, name, props) => [`${value} unidades`, props.payload.nombre]} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="w-full md:w-1/2 mt-4 md:mt-0">
                    <ul className="space-y-2">
                      {medicamentosPopulares.slice(0, 5).map((med, index) => (
                        <li key={med.id || index} className="flex items-center">
                          <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: med.color || COLORS[index % COLORS.length] }}></div>
                          <div className="flex-1 text-sm">
                            <span className="font-medium">{med.nombre?.length > 20 ? med.nombre.substring(0, 20) + '...' : med.nombre}</span>
                            <div className="flex justify-between">
                              <span className="text-xs text-gray-500">{med.categoria || 'Sin categoría'}</span>
                              <span className="text-xs font-medium">{med.cantidad} uds.</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                              <div 
                                className="h-1.5 rounded-full" 
                                style={{ 
                                  width: `${(med.cantidad / medicamentosPopulares[0].cantidad) * 100}%`,
                                  backgroundColor: med.color || COLORS[index % COLORS.length] 
                                }}
                              ></div>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="h-72 flex flex-col items-center justify-center">
                  <p className="text-gray-500 mb-4">No hay datos de medicamentos vendidos para mostrar.</p>
                  
                  {/* Botón para cargar datos de demostración */}
                  <button 
                    onClick={() => {
                      const datosDemostracion = [
                        { id: '1', nombre: 'Paracetamol', cantidad: 250, categoria: 'Analgésico', color: COLORS[0] },
                        { id: '2', nombre: 'Ibuprofeno', cantidad: 180, categoria: 'Antiinflamatorio', color: COLORS[1] },
                        { id: '3', nombre: 'Amoxicilina', cantidad: 120, categoria: 'Antibiótico', color: COLORS[2] },
                        { id: '4', nombre: 'Omeprazol', cantidad: 95, categoria: 'Antiácido', color: COLORS[3] },
                        { id: '5', nombre: 'Loratadina', cantidad: 75, categoria: 'Antihistamínico', color: COLORS[4] }
                      ];
                      setMedicamentosPopulares(datosDemostracion);
                    }}
                    className="mt-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded transition-colors"
                  >
                    Cargar datos de demostración
                  </button>
                  
                  <BotonActualizar 
                    onClick={() => cargarDatosEspecificos(farmaciaId, 'medicamentos-populares')} 
                    etiqueta="Intentar cargar datos reales" 
                    isLoading={graficosEnCarga['medicamentos-populares']}
                  />
                </div>
              )}
            </div>
            
            {/* Ventas por Categoría */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Ventas por Categoría</h2>
              {ventasPorCategoria.length > 0 ? (
                <div className="h-72 flex flex-col md:flex-row">
                  <div className="w-full md:w-1/2">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          dataKey="cantidad"
                          isAnimationActive={true}
                          data={ventasPorCategoria.slice(0, 5)}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label={({name, percent}) => `${Math.round(percent * 100)}%`}
                        >
                          {ventasPorCategoria.slice(0, 5).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value, name, props) => [`${value} unidades`, props.payload.categoria]} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="w-full md:w-1/2 mt-4 md:mt-0">
                    <ul className="space-y-2">
                      {ventasPorCategoria.slice(0, 5).map((cat, index) => (
                        <li key={index} className="flex items-center">
                          <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: cat.color || COLORS[index % COLORS.length] }}></div>
                          <span className="text-sm">{cat.categoria?.length > 25 ? cat.categoria.substring(0, 25) + '...' : cat.categoria} - {cat.cantidad} uds.</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="h-72 flex flex-col items-center justify-center">
                  <p className="text-gray-500">No hay datos de categorías de ventas para mostrar.</p>
                  <BotonActualizar 
                    onClick={() => cargarDatosEspecificos(farmaciaId, 'ventas-por-categoria')} 
                    etiqueta="Intentar cargar datos" 
                    isLoading={graficosEnCarga['ventas-por-categoria']}
                  />
                </div>
              )}
            </div>
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
                <div className="space-y-4">
                  <div className="overflow-hidden bg-yellow-50 rounded-lg">
                    <div className="px-4 py-2 bg-yellow-100 border-b border-yellow-200">
                      <p className="text-sm font-medium text-yellow-800">
                        Se detectaron {recomendacionesUrgentes.length} medicamentos con stock crítico
                      </p>
                    </div>
                    <div className="p-4 max-h-64 overflow-y-auto">
                      {recomendacionesUrgentes.slice(0, 5).map(rec => (
                        <div key={rec.medicamentoId} className="flex items-center mb-3 last:mb-0">
                          <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-700">{rec.nombre}</p>
                            <div className="flex items-center mt-1">
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-red-500 h-2 rounded-full" 
                                  style={{ width: `${Math.min(rec.porcentajeStock, 100)}%` }}
                                ></div>
                              </div>
                              <span className="ml-2 text-xs text-gray-500">
                                {rec.stockActual}/{rec.nivelOptimo} ({rec.porcentajeStock}%)
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {recomendacionesUrgentes.length > 5 && (
                        <a href="/predicciones/recomendaciones" className="block mt-4 text-sm text-blue-500 hover:underline">
                          Ver todas las alertas ({recomendacionesUrgentes.length})
                        </a>
                      )}
                    </div>
                  </div>
                  
                  <a 
                    href="/inventario" 
                    className="block w-full py-2 px-4 bg-blue-500 hover:bg-blue-600 text-white text-center font-medium rounded-md transition"
                  >
                    Ir a gestión de inventario
                  </a>
                </div>
              ) : (
                <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm leading-5 text-green-700">
                        Todos los medicamentos tienen niveles de stock adecuados.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Actividad Reciente</h2>
              
              {ultimasActividades.length > 0 ? (
                <div className="space-y-4 max-h-80 overflow-y-auto">
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
                <div className="bg-gray-50 p-4 rounded text-center">
                  <p className="text-sm text-gray-600">No hay actividades recientes registradas.</p>
                </div>
              )}
              
              <div className="mt-4 text-right">
                <a href="/movimientos" className="text-sm text-blue-500 hover:underline">
                  Ver historial completo →
                </a>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;