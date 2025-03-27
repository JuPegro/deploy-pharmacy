// // Servicio para el análisis de tendencias
// // Este servicio consume los endpoints existentes y analiza los datos

// class ServicioAnalisisTendencias {
//   constructor() {
//     this.endpoints = {
//       inventario: '/api/inventarios',
//       ventas: '/api/ventas',
//       farmacias: '/api/farmacias',
//       medicamentos: '/api/medicamentos'
//     };
//     this.periodoAnalisis = 90; // días por defecto
//   }

//   // Obtener datos de los endpoints existentes
//   async obtenerDatos() {
//     try {
//       // Usar un manejador de errores más específico para cada llamada
//       const fetchData = async (endpoint) => {
//         const response = await fetch(endpoint);
//         if (!response.ok) {
//           throw new Error(`Error en la petición a ${endpoint}: ${response.status} ${response.statusText}`);
//         }
//         return response.json();
//       };
      
//       // Datos de prueba en caso de que los endpoints no estén disponibles
//       const datosPrueba = {
//         inventario: [
//           { id: 1, medicamento_id: "med1", cantidad: 50, farmacia_id: "f1" },
//           { id: 2, medicamento_id: "med2", cantidad: 30, farmacia_id: "f1" },
//           { id: 3, medicamento_id: "med3", cantidad: 100, farmacia_id: "f1" },
//           { id: 4, medicamento_id: "med1", cantidad: 20, farmacia_id: "f2" }
//         ],
//         ventas: [
//           { id: 1, medicamento_id: "med1", cantidad: 5, precio_total: 500, fecha: "2025-03-20", farmacia_id: "f1", cliente_id: "c1" },
//           { id: 2, medicamento_id: "med2", cantidad: 2, precio_total: 200, fecha: "2025-03-20", farmacia_id: "f1", cliente_id: "c1" },
//           { id: 3, medicamento_id: "med1", cantidad: 3, precio_total: 300, fecha: "2025-03-21", farmacia_id: "f1", cliente_id: "c2" },
//           { id: 4, medicamento_id: "med3", cantidad: 1, precio_total: 100, fecha: "2025-03-22", farmacia_id: "f2", cliente_id: "c3" }
//         ],
//         farmacias: [
//           { id: "f1", nombre: "Farmacia Central" },
//           { id: "f2", nombre: "Farmacia Norte" }
//         ],
//         medicamentos: [
//           { id: "med1", nombre: "Paracetamol 500mg" },
//           { id: "med2", nombre: "Ibuprofeno 400mg" },
//           { id: "med3", nombre: "Amoxicilina 500mg" }
//         ]
//       };
      
//       try {
//         // Intentar obtener datos reales
//         const [inventario, ventas, farmacias, medicamentos] = await Promise.all([
//           fetchData(this.endpoints.inventario),
//           fetchData(this.endpoints.ventas),
//           fetchData(this.endpoints.farmacias),
//           fetchData(this.endpoints.medicamentos)
//         ]);
        
//         return { inventario, ventas, farmacias, medicamentos };
//       } catch (error) {
//         // Si falla, usar datos de prueba
//         console.warn('No se pudieron cargar datos de los endpoints, usando datos de prueba:', error);
//         return datosPrueba;
//       }
//     } catch (error) {
//       console.error('Error crítico al obtener datos:', error);
//       throw error;
//     }
//   }

//   // Analizar productos con mayor rotación
//   analizarProductosPopulares(ventas, medicamentos) {
//     // Agrupar ventas por medicamento
//     const ventasPorProducto = ventas.reduce((acc, venta) => {
//       const idMed = venta.medicamento_id;
//       if (!acc[idMed]) {
//         acc[idMed] = {
//           cantidad: 0,
//           ingresos: 0,
//           nombre: medicamentos.find(m => m.id === idMed)?.nombre || 'Desconocido'
//         };
//       }
//       acc[idMed].cantidad += venta.cantidad;
//       acc[idMed].ingresos += venta.precio_total;
//       return acc;
//     }, {});

//     // Convertir a array y ordenar por cantidad vendida
//     return Object.entries(ventasPorProducto)
//       .map(([id, datos]) => ({
//         id,
//         ...datos,
//         rendimiento: datos.ingresos / datos.cantidad
//       }))
//       .sort((a, b) => b.cantidad - a.cantidad);
//   }

//   // Analizar tendencias de ventas por período (diario, semanal, mensual)
//   analizarTendenciasTemporales(ventas) {
//     // Agrupar ventas por fecha
//     const ventasPorFecha = ventas.reduce((acc, venta) => {
//       const fecha = new Date(venta.fecha).toISOString().split('T')[0];
//       if (!acc[fecha]) {
//         acc[fecha] = {
//           ingresos: 0,
//           cantidad: 0,
//           transacciones: 0
//         };
//       }
//       acc[fecha].ingresos += venta.precio_total;
//       acc[fecha].cantidad += venta.cantidad;
//       acc[fecha].transacciones += 1;
//       return acc;
//     }, {});

//     // Convertir a array para facilitar análisis y visualización
//     const tendenciasDiarias = Object.entries(ventasPorFecha)
//       .map(([fecha, datos]) => ({ fecha, ...datos }))
//       .sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
    
//     // Calcular cambio porcentual
//     const tendenciasConCambio = tendenciasDiarias.map((dia, index, array) => {
//       if (index === 0) {
//         return { ...dia, cambioPorcentual: 0 };
//       }
//       const diaAnterior = array[index - 1];
//       const cambioPorcentual = ((dia.ingresos - diaAnterior.ingresos) / diaAnterior.ingresos) * 100;
//       return { ...dia, cambioPorcentual };
//     });
    
//     return tendenciasConCambio;
//   }

//   // Detectar productos con bajo inventario que son populares (oportunidades)
//   detectarOportunidades(inventario, ventas, medicamentos) {
//     const productosPopulares = this.analizarProductosPopulares(ventas, medicamentos).slice(0, 20);
    
//     const oportunidades = productosPopulares.map(producto => {
//       const stockActual = inventario
//         .filter(item => item.medicamento_id === producto.id)
//         .reduce((total, item) => total + item.cantidad, 0);
      
//       // Calcular días estimados de stock basado en ventas recientes
//       const ventasRecientes = ventas
//         .filter(v => v.medicamento_id === producto.id)
//         .slice(0, 30);  // últimos 30 registros
      
//       const promedioVentasDiarias = ventasRecientes.reduce((sum, v) => sum + v.cantidad, 0) / 30;
//       const diasEstimadosStock = promedioVentasDiarias > 0 ? Math.round(stockActual / promedioVentasDiarias) : 999;
      
//       return {
//         id: producto.id,
//         nombre: producto.nombre,
//         stockActual,
//         promedioVentasDiarias,
//         diasEstimadosStock,
//         requiereReposicion: diasEstimadosStock < 14, // umbral de 2 semanas
//         rendimiento: producto.rendimiento
//       };
//     });
    
//     return oportunidades.sort((a, b) => a.diasEstimadosStock - b.diasEstimadosStock);
//   }

//   // Detectar productos con exceso de inventario y baja rotación
//   detectarExcesosInventario(inventario, ventas, medicamentos) {
//     // Obtener todos los productos en inventario
//     const productosEnInventario = inventario.reduce((acc, item) => {
//       const idMed = item.medicamento_id;
//       if (!acc[idMed]) {
//         acc[idMed] = {
//           id: idMed,
//           nombre: medicamentos.find(m => m.id === idMed)?.nombre || 'Desconocido',
//           cantidad: 0
//         };
//       }
//       acc[idMed].cantidad += item.cantidad;
//       return acc;
//     }, {});
    
//     // Calcular rotación para cada producto
//     Object.values(productosEnInventario).forEach(producto => {
//       const ventasProducto = ventas.filter(v => v.medicamento_id === producto.id);
//       const cantidadVendida = ventasProducto.reduce((sum, v) => sum + v.cantidad, 0);
//       producto.rotacion = cantidadVendida / producto.cantidad || 0;
      
//       // Si rotación es baja y stock es alto, es un candidato para promoción o ajuste
//       producto.excesivo = producto.rotacion < 0.1 && producto.cantidad > 50;
//     });
    
//     return Object.values(productosEnInventario)
//       .filter(p => p.excesivo)
//       .sort((a, b) => a.rotacion - b.rotacion);
//   }

//   // Sugerir promociones basadas en patrones de compra
//   sugerirPromociones(ventas, medicamentos) {
//     // Encontrar productos que suelen comprarse juntos
//     const transacciones = {};
//     ventas.forEach(venta => {
//       const transaccionId = `${venta.farmacia_id}-${venta.fecha}-${venta.cliente_id}`;
//       if (!transacciones[transaccionId]) {
//         transacciones[transaccionId] = [];
//       }
//       transacciones[transaccionId].push(venta.medicamento_id);
//     });
    
//     // Análisis básico de afinidad (productos que se compran juntos)
//     const coocurrencias = {};
//     Object.values(transacciones).forEach(productos => {
//       // Solo analizar transacciones con múltiples productos
//       if (productos.length > 1) {
//         for (let i = 0; i < productos.length; i++) {
//           for (let j = i + 1; j < productos.length; j++) {
//             const par = [productos[i], productos[j]].sort().join('-');
//             coocurrencias[par] = (coocurrencias[par] || 0) + 1;
//           }
//         }
//       }
//     });
    
//     // Convertir a array y obtener los pares más comunes
//     const paresComunes = Object.entries(coocurrencias)
//       .map(([par, frecuencia]) => {
//         const [id1, id2] = par.split('-');
//         return {
//           par,
//           frecuencia,
//           producto1: {
//             id: id1,
//             nombre: medicamentos.find(m => m.id === id1)?.nombre || 'Desconocido'
//           },
//           producto2: {
//             id: id2,
//             nombre: medicamentos.find(m => m.id === id2)?.nombre || 'Desconocido'
//           }
//         };
//       })
//       .sort((a, b) => b.frecuencia - a.frecuencia)
//       .slice(0, 10);
    
//     return paresComunes;
//   }

//   // Análisis completo
//   async analizarTodo() {
//     const datos = await this.obtenerDatos();
    
//     return {
//       productosPopulares: this.analizarProductosPopulares(datos.ventas, datos.medicamentos).slice(0, 10),
//       tendenciasTemporales: this.analizarTendenciasTemporales(datos.ventas),
//       oportunidadesReposicion: this.detectarOportunidades(datos.inventario, datos.ventas, datos.medicamentos),
//       excesosInventario: this.detectarExcesosInventario(datos.inventario, datos.ventas, datos.medicamentos),
//       sugerenciasPromociones: this.sugerirPromociones(datos.ventas, datos.medicamentos)
//     };
//   }
// }

// // Componente React para el dashboard
// import React, { useState, useEffect } from 'react';
// import { 
//   LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
//   BarChart, Bar, PieChart, Pie, Cell 
// } from 'recharts';

// // Mock service para pruebas locales si es necesario
// class MockServicioAnalisis {
//   async analizarTodo() {
//     // Retornar datos ficticios para probar la visualización
//     return {
//       productosPopulares: [
//         {id: 'med1', nombre: 'Paracetamol 500mg', cantidad: 120, ingresos: 12000},
//         {id: 'med2', nombre: 'Ibuprofeno 400mg', cantidad: 90, ingresos: 9000},
//         {id: 'med3', nombre: 'Amoxicilina 500mg', cantidad: 60, ingresos: 18000},
//       ],
//       tendenciasTemporales: Array(90).fill().map((_, i) => {
//         const fecha = new Date();
//         fecha.setDate(fecha.getDate() - 90 + i);
//         return {
//           fecha: fecha.toISOString().split('T')[0],
//           ingresos: 5000 + Math.random() * 2000,
//           cantidad: 50 + Math.random() * 20,
//           transacciones: 10 + Math.random() * 5,
//           cambioPorcentual: Math.random() * 10 - 5
//         };
//       }),
//       oportunidadesReposicion: [
//         {id: 'med1', nombre: 'Paracetamol 500mg', stockActual: 10, promedioVentasDiarias: 2, diasEstimadosStock: 5, requiereReposicion: true},
//         {id: 'med2', nombre: 'Ibuprofeno 400mg', stockActual: 5, promedioVentasDiarias: 1, diasEstimadosStock: 5, requiereReposicion: true},
//       ],
//       excesosInventario: [
//         {id: 'med4', nombre: 'Loratadina 10mg', cantidad: 200, rotacion: 0.05},
//         {id: 'med5', nombre: 'Omeprazol 20mg', cantidad: 150, rotacion: 0.08},
//       ],
//       sugerenciasPromociones: [
//         {par: 'med1-med2', frecuencia: 15, producto1: {id: 'med1', nombre: 'Paracetamol 500mg'}, producto2: {id: 'med2', nombre: 'Ibuprofeno 400mg'}},
//         {par: 'med1-med3', frecuencia: 10, producto1: {id: 'med1', nombre: 'Paracetamol 500mg'}, producto2: {id: 'med3', nombre: 'Amoxicilina 500mg'}},
//       ]
//     };
//   }
// }

// // Colores para gráficos
// const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

// const Dashboard = () => {
//   const [datos, setDatos] = useState(null);
//   const [cargando, setCargando] = useState(true);
//   const [error, setError] = useState(null);
//   const [periodoAnalisis, setPeriodoAnalisis] = useState(90); // días
  
//   // Usa el servicio real o el mock dependiendo de si estamos en modo desarrollo o producción
//   const servicioAnalisis = process.env.NODE_ENV === 'development' 
//     ? new MockServicioAnalisis() 
//     : new ServicioAnalisisTendencias();
  
//   useEffect(() => {
//     const cargarDatos = async () => {
//       try {
//         setCargando(true);
//         setError(null); // Resetear error antes de intentar cargar
        
//         // Agregar un pequeño retraso para asegurar que el componente esté montado
//         await new Promise(resolve => setTimeout(resolve, 500));
        
//         const resultados = await servicioAnalisis.analizarTodo();
//         // Verificar que los datos sean válidos
//         if (!resultados || 
//             !resultados.productosPopulares || 
//             !resultados.tendenciasTemporales) {
//           throw new Error('Los datos retornados no tienen el formato esperado');
//         }
        
//         console.log('Datos cargados correctamente:', resultados);
//         setDatos(resultados);
//       } catch (err) {
//         console.error('Error detallado:', err);
//         setError(`Error al cargar los datos de análisis: ${err.message}`);
//       } finally {
//         setCargando(false);
//       }
//     };
    
//     cargarDatos();
//   }, [periodoAnalisis]);
  
//   if (cargando) return (
//     <div className="cargando">
//       <div className="spinner"></div>
//       <p>Cargando análisis de tendencias...</p>
//     </div>
//   );
  
//   if (error) return (
//     <div className="error-container">
//       <div className="error-icon">⚠️</div>
//       <div className="error-message">
//         <h3>Error de carga</h3>
//         <p>{error}</p>
//         <button onClick={() => window.location.reload()}>
//           Intentar nuevamente
//         </button>
//       </div>
//     </div>
//   );
  
//   if (!datos) return <div className="sin-datos">No hay datos disponibles para analizar</div>;
  
//   return (
//     <div className="dashboard-tendencias">
//       <h2>Análisis de Tendencias y Recomendaciones</h2>
      
//       <div className="controles">
//         <label>
//           Periodo de análisis: 
//           <select 
//             value={periodoAnalisis} 
//             onChange={(e) => setPeriodoAnalisis(Number(e.target.value))}
//           >
//             <option value={30}>Último mes</option>
//             <option value={90}>Últimos 3 meses</option>
//             <option value={180}>Últimos 6 meses</option>
//             <option value={365}>Último año</option>
//           </select>
//         </label>
//       </div>
      
//       <div className="paneles">
//         {/* Panel 1: Productos más vendidos */}
//         <div className="panel">
//           <h3>Top 10 Productos por Ventas</h3>
//           <ResponsiveContainer width="100%" height={300}>
//             <BarChart data={datos.productosPopulares}>
//               <CartesianGrid strokeDasharray="3 3" />
//               <XAxis dataKey="nombre" tick={false} />
//               <YAxis />
//               <Tooltip formatter={(value, name) => [value, name === 'cantidad' ? 'Unidades vendidas' : 'Ingresos']} />
//               <Legend />
//               <Bar dataKey="cantidad" fill="#0088FE" name="Unidades" />
//               <Bar dataKey="ingresos" fill="#00C49F" name="Ingresos" />
//             </BarChart>
//           </ResponsiveContainer>
//         </div>
        
//         {/* Panel 2: Tendencia de ventas */}
//         <div className="panel">
//           <h3>Tendencia de Ventas</h3>
//           <ResponsiveContainer width="100%" height={300}>
//             <LineChart data={datos.tendenciasTemporales.slice(-periodoAnalisis)}>
//               <CartesianGrid strokeDasharray="3 3" />
//               <XAxis dataKey="fecha" />
//               <YAxis yAxisId="left" />
//               <YAxis yAxisId="right" orientation="right" />
//               <Tooltip />
//               <Legend />
//               <Line yAxisId="left" type="monotone" dataKey="ingresos" stroke="#0088FE" name="Ingresos" />
//               <Line yAxisId="right" type="monotone" dataKey="transacciones" stroke="#00C49F" name="Ventas" />
//             </LineChart>
//           </ResponsiveContainer>
//         </div>
        
//         {/* Panel 3: Alertas de reposición */}
//         <div className="panel alerta">
//           <h3>Alertas de Reposición</h3>
//           <div className="tabla-contenedor">
//             <table className="tabla-datos">
//               <thead>
//                 <tr>
//                   <th>Producto</th>
//                   <th>Stock</th>
//                   <th>Venta diaria</th>
//                   <th>Días rest.</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {datos.oportunidadesReposicion
//                   .filter(item => item.requiereReposicion)
//                   .slice(0, 5)
//                   .map(item => (
//                     <tr key={item.id} className={item.diasEstimadosStock < 7 ? 'alerta-urgente' : 'alerta-normal'}>
//                       <td>{item.nombre}</td>
//                       <td>{item.stockActual}</td>
//                       <td>{item.promedioVentasDiarias.toFixed(1)}</td>
//                       <td>{item.diasEstimadosStock}</td>
//                     </tr>
//                   ))}
//               </tbody>
//             </table>
//           </div>
//         </div>
        
//         {/* Panel 4: Exceso de inventario */}
//         <div className="panel">
//           <h3>Exceso de Inventario</h3>
//           <div className="tabla-contenedor">
//             <table className="tabla-datos">
//               <thead>
//                 <tr>
//                   <th>Producto</th>
//                   <th>Stock</th>
//                   <th>Rotación</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {datos.excesosInventario.slice(0, 5).map(item => (
//                   <tr key={item.id}>
//                     <td>{item.nombre}</td>
//                     <td>{item.cantidad}</td>
//                     <td>{(item.rotacion * 100).toFixed(1)}%</td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         </div>
        
//         {/* Panel 5: Sugerencias de promociones */}
//         <div className="panel sugerencias">
//           <h3>Sugerencias de Promociones</h3>
//           <div className="promociones-lista">
//             {datos.sugerenciasPromociones.slice(0, 3).map((sugerencia, index) => (
//               <div key={sugerencia.par} className="promocion-item">
//                 <div className="promocion-titulo">Promoción #{index + 1}</div>
//                 <div className="promocion-productos">
//                   <span>{sugerencia.producto1.nombre}</span>
//                   <span> + </span>
//                   <span>{sugerencia.producto2.nombre}</span>
//                 </div>
//                 <div className="promocion-descripcion">
//                   Estos productos se compran juntos {sugerencia.frecuencia} veces.
//                   Considere crear un paquete promocional.
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>
//       </div>
      
//       <style jsx>{`
//         .cargando {
//           display: flex;
//           flex-direction: column;
//           align-items: center;
//           justify-content: center;
//           height: 300px;
//           text-align: center;
//         }
        
//         .spinner {
//           border: 4px solid rgba(0, 0, 0, 0.1);
//           width: 36px;
//           height: 36px;
//           border-radius: 50%;
//           border-left-color: #0088FE;
//           animation: spin 1s linear infinite;
//           margin-bottom: 10px;
//         }
        
//         @keyframes spin {
//           0% { transform: rotate(0deg); }
//           100% { transform: rotate(360deg); }
//         }
        
//         .error-container {
//           display: flex;
//           padding: 20px;
//           background-color: #ffebee;
//           border-radius: 8px;
//           margin-bottom: 20px;
//         }
        
//         .error-icon {
//           font-size: 24px;
//           margin-right: 20px;
//         }
        
//         .error-message h3 {
//           margin-top: 0;
//           color: #d32f2f;
//         }
        
//         .error-message button {
//           background-color: #d32f2f;
//           color: white;
//           border: none;
//           padding: 8px 16px;
//           border-radius: 4px;
//           cursor: pointer;
//           margin-top: 10px;
//         }
        
//         .sin-datos {
//           padding: 20px;
//           background-color: #e3f2fd;
//           border-radius: 8px;
//           text-align: center;
//         }
        
//         .dashboard-tendencias {
//           padding: 1rem;
//           background-color: #f5f5f5;
//           border-radius: 8px;
//         }
        
//         .paneles {
//           display: grid;
//           grid-template-columns: repeat(auto-fill, minmax(450px, 1fr));
//           gap: 1rem;
//         }
        
//         .panel {
//           background: white;
//           border-radius: 8px;
//           box-shadow: 0 2px 4px rgba(0,0,0,0.1);
//           padding: 1rem;
//           min-height: 350px;
//         }
        
//         .alerta-urgente {
//           background-color: #ffebee;
//         }
        
//         .alerta-normal {
//           background-color: #fff8e1;
//         }
        
//         .tabla-datos {
//           width: 100%;
//           border-collapse: collapse;
//         }
        
//         .tabla-datos th, .tabla-datos td {
//           padding: 8px;
//           text-align: left;
//           border-bottom: 1px solid #ddd;
//         }
        
//         .promocion-item {
//           margin-bottom: 1rem;
//           padding: 0.5rem;
//           border-left: 4px solid #0088FE;
//           background-color: #f0f8ff;
//         }
        
//         .promocion-titulo {
//           font-weight: bold;
//           margin-bottom: 0.5rem;
//         }
        
//         .promocion-productos {
//           font-size: 1.1rem;
//           margin-bottom: 0.5rem;
//         }
        
//         .promocion-descripcion {
//           font-size: 0.9rem;
//           color: #555;
//         }
//       `}</style>
//     </div>
//   );
// };

// export default Dashboard;


// Servicio para el análisis de tendencias
// Este servicio consume los endpoints existentes y analiza los datos

class ServicioAnalisisTendencias {
  constructor() {
    this.endpoints = {
      inventario: '/api/inventario',
      ventas: '/api/ventas',
      farmacias: '/api/farmacias',
      medicamentos: '/api/medicamentos'
    };
    this.periodoAnalisis = 90; // días por defecto
  }

  // Obtener datos de los endpoints existentes
  async obtenerDatos() {
    try {
      // Usar un manejador de errores más específico para cada llamada
      const fetchData = async (endpoint) => {
        const response = await fetch(endpoint);
        if (!response.ok) {
          throw new Error(`Error en la petición a ${endpoint}: ${response.status} ${response.statusText}`);
        }
        return response.json();
      };
      
      // Datos de prueba en caso de que los endpoints no estén disponibles
      const datosPrueba = {
        inventario: [
          { id: 1, medicamento_id: "med1", cantidad: 50, farmacia_id: "f1" },
          { id: 2, medicamento_id: "med2", cantidad: 30, farmacia_id: "f1" },
          { id: 3, medicamento_id: "med3", cantidad: 100, farmacia_id: "f1" },
          { id: 4, medicamento_id: "med1", cantidad: 20, farmacia_id: "f2" },
          { id: 5, medicamento_id: "med4", cantidad: 75, farmacia_id: "f1" },
          { id: 6, medicamento_id: "med5", cantidad: 150, farmacia_id: "f1" }
        ],
        ventas: [
          { id: 1, medicamento_id: "med1", cantidad: 5, precio_total: 500, fecha: "2025-03-20", farmacia_id: "f1", cliente_id: "c1" },
          { id: 2, medicamento_id: "med2", cantidad: 2, precio_total: 200, fecha: "2025-03-20", farmacia_id: "f1", cliente_id: "c1" },
          { id: 3, medicamento_id: "med1", cantidad: 3, precio_total: 300, fecha: "2025-03-21", farmacia_id: "f1", cliente_id: "c2" },
          { id: 4, medicamento_id: "med3", cantidad: 1, precio_total: 100, fecha: "2025-03-22", farmacia_id: "f2", cliente_id: "c3" },
          { id: 5, medicamento_id: "med4", cantidad: 2, precio_total: 350, fecha: "2025-03-23", farmacia_id: "f1", cliente_id: "c4" },
          { id: 6, medicamento_id: "med1", cantidad: 4, precio_total: 400, fecha: "2025-03-24", farmacia_id: "f1", cliente_id: "c5" },
          { id: 7, medicamento_id: "med2", cantidad: 3, precio_total: 300, fecha: "2025-03-24", farmacia_id: "f1", cliente_id: "c5" }
        ],
        farmacias: [
          { id: "f1", nombre: "Farmacia Central" },
          { id: "f2", nombre: "Farmacia Norte" }
        ],
        medicamentos: [
          { id: "med1", nombre: "Paracetamol 500mg", precio_unitario: 100 },
          { id: "med2", nombre: "Ibuprofeno 400mg", precio_unitario: 100 },
          { id: "med3", nombre: "Amoxicilina 500mg", precio_unitario: 100 },
          { id: "med4", nombre: "Loratadina 10mg", precio_unitario: 175 },
          { id: "med5", nombre: "Omeprazol 20mg", precio_unitario: 120 }
        ]
      };
      
      try {
        // Intentar obtener datos reales
        const [inventario, ventas, farmacias, medicamentos] = await Promise.all([
          fetchData(this.endpoints.inventario),
          fetchData(this.endpoints.ventas),
          fetchData(this.endpoints.farmacias),
          fetchData(this.endpoints.medicamentos)
        ]);
        
        return { inventario, ventas, farmacias, medicamentos };
      } catch (error) {
        // Si falla, usar datos de prueba
        console.warn('No se pudieron cargar datos de los endpoints, usando datos de prueba:', error);
        return datosPrueba;
      }
    } catch (error) {
      console.error('Error crítico al obtener datos:', error);
      throw error;
    }
  }

  // Calcular métricas generales
  calcularMetricasGenerales(inventario, ventas, medicamentos) {
    // Total de medicamentos en inventario (SKUs únicos)
    const totalMedicamentosUnicos = new Set(inventario.map(item => item.medicamento_id)).size;
    
    // Total de unidades en inventario
    const totalUnidadesInventario = inventario.reduce((sum, item) => sum + item.cantidad, 0);
    
    // Total de ventas (transacciones)
    const totalTransacciones = new Set(ventas.map(v => `${v.farmacia_id}-${v.fecha}-${v.cliente_id}`)).size;
    
    // Total de unidades vendidas
    const totalUnidadesVendidas = ventas.reduce((sum, v) => sum + v.cantidad, 0);
    
    // Total de ingresos
    const totalIngresos = ventas.reduce((sum, v) => sum + v.precio_total, 0);
    
    // Valor del inventario
    const valorInventario = inventario.reduce((sum, item) => {
      const medicamento = medicamentos.find(m => m.id === item.medicamento_id);
      return sum + (item.cantidad * (medicamento?.precio_unitario || 0));
    }, 0);
    
    // Porcentaje de crecimiento (últimos 30 días vs 30 días anteriores)
    const fechaActual = new Date();
    const hace30Dias = new Date();
    hace30Dias.setDate(hace30Dias.getDate() - 30);
    const hace60Dias = new Date();
    hace60Dias.setDate(hace60Dias.getDate() - 60);
    
    const ventasUltimos30Dias = ventas.filter(v => new Date(v.fecha) >= hace30Dias);
    const ventas30a60Dias = ventas.filter(v => new Date(v.fecha) >= hace60Dias && new Date(v.fecha) < hace30Dias);
    
    const ingresos30Dias = ventasUltimos30Dias.reduce((sum, v) => sum + v.precio_total, 0);
    const ingresos30a60 = ventas30a60Dias.reduce((sum, v) => sum + v.precio_total, 0);
    
    const crecimientoPorcentaje = ingresos30a60 > 0 
      ? ((ingresos30Dias - ingresos30a60) / ingresos30a60) * 100 
      : 0;
    
    return {
      totalMedicamentosUnicos,
      totalUnidadesInventario,
      totalTransacciones,
      totalUnidadesVendidas,
      totalIngresos,
      valorInventario,
      ingresos30Dias,
      ingresos30a60,
      crecimientoPorcentaje
    };
  }

  // Analizar productos con mayor rotación
  analizarProductosPopulares(ventas, medicamentos) {
    // Agrupar ventas por medicamento
    const ventasPorProducto = ventas.reduce((acc, venta) => {
      const idMed = venta.medicamento_id;
      if (!acc[idMed]) {
        acc[idMed] = {
          cantidad: 0,
          ingresos: 0,
          nombre: medicamentos.find(m => m.id === idMed)?.nombre || 'Desconocido'
        };
      }
      acc[idMed].cantidad += venta.cantidad;
      acc[idMed].ingresos += venta.precio_total;
      return acc;
    }, {});

    // Convertir a array y ordenar por cantidad vendida
    return Object.entries(ventasPorProducto)
      .map(([id, datos]) => ({
        id,
        ...datos,
        rendimiento: datos.ingresos / datos.cantidad
      }))
      .sort((a, b) => b.cantidad - a.cantidad);
  }

  // Analizar tendencias de ventas por período (diario, semanal, mensual)
  analizarTendenciasTemporales(ventas) {
    // Agrupar ventas por fecha
    const ventasPorFecha = ventas.reduce((acc, venta) => {
      const fecha = new Date(venta.fecha).toISOString().split('T')[0];
      if (!acc[fecha]) {
        acc[fecha] = {
          ingresos: 0,
          cantidad: 0,
          transacciones: 0
        };
      }
      acc[fecha].ingresos += venta.precio_total;
      acc[fecha].cantidad += venta.cantidad;
      acc[fecha].transacciones += 1;
      return acc;
    }, {});

    // Convertir a array para facilitar análisis y visualización
    const tendenciasDiarias = Object.entries(ventasPorFecha)
      .map(([fecha, datos]) => ({ fecha, ...datos }))
      .sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
    
    // Calcular cambio porcentual
    const tendenciasConCambio = tendenciasDiarias.map((dia, index, array) => {
      if (index === 0) {
        return { ...dia, cambioPorcentual: 0 };
      }
      const diaAnterior = array[index - 1];
      const cambioPorcentual = ((dia.ingresos - diaAnterior.ingresos) / diaAnterior.ingresos) * 100;
      return { ...dia, cambioPorcentual };
    });
    
    return tendenciasConCambio;
  }

  // Detectar productos con bajo inventario que son populares (oportunidades)
  detectarOportunidades(inventario, ventas, medicamentos) {
    const productosPopulares = this.analizarProductosPopulares(ventas, medicamentos).slice(0, 20);
    
    const oportunidades = productosPopulares.map(producto => {
      const stockActual = inventario
        .filter(item => item.medicamento_id === producto.id)
        .reduce((total, item) => total + item.cantidad, 0);
      
      // Calcular días estimados de stock basado en ventas recientes
      const ventasRecientes = ventas
        .filter(v => v.medicamento_id === producto.id)
        .slice(0, 30);  // últimos 30 registros
      
      const promedioVentasDiarias = ventasRecientes.reduce((sum, v) => sum + v.cantidad, 0) / 30;
      const diasEstimadosStock = promedioVentasDiarias > 0 ? Math.round(stockActual / promedioVentasDiarias) : 999;
      
      return {
        id: producto.id,
        nombre: producto.nombre,
        stockActual,
        promedioVentasDiarias,
        diasEstimadosStock,
        requiereReposicion: diasEstimadosStock < 14, // umbral de 2 semanas
        rendimiento: producto.rendimiento
      };
    });
    
    return oportunidades.sort((a, b) => a.diasEstimadosStock - b.diasEstimadosStock);
  }

  // Detectar productos con exceso de inventario y baja rotación
  detectarExcesosInventario(inventario, ventas, medicamentos) {
    // Obtener todos los productos en inventario
    const productosEnInventario = inventario.reduce((acc, item) => {
      const idMed = item.medicamento_id;
      if (!acc[idMed]) {
        acc[idMed] = {
          id: idMed,
          nombre: medicamentos.find(m => m.id === idMed)?.nombre || 'Desconocido',
          cantidad: 0
        };
      }
      acc[idMed].cantidad += item.cantidad;
      return acc;
    }, {});
    
    // Calcular rotación para cada producto
    Object.values(productosEnInventario).forEach(producto => {
      const ventasProducto = ventas.filter(v => v.medicamento_id === producto.id);
      const cantidadVendida = ventasProducto.reduce((sum, v) => sum + v.cantidad, 0);
      producto.rotacion = cantidadVendida / producto.cantidad || 0;
      
      // Si rotación es baja y stock es alto, es un candidato para promoción o ajuste
      producto.excesivo = producto.rotacion < 0.1 && producto.cantidad > 50;
    });
    
    return Object.values(productosEnInventario)
      .filter(p => p.excesivo)
      .sort((a, b) => a.rotacion - b.rotacion);
  }

  // Sugerir promociones basadas en patrones de compra
  sugerirPromociones(ventas, medicamentos) {
    // Encontrar productos que suelen comprarse juntos
    const transacciones = {};
    ventas.forEach(venta => {
      const transaccionId = `${venta.farmacia_id}-${venta.fecha}-${venta.cliente_id}`;
      if (!transacciones[transaccionId]) {
        transacciones[transaccionId] = [];
      }
      transacciones[transaccionId].push(venta.medicamento_id);
    });
    
    // Análisis básico de afinidad (productos que se compran juntos)
    const coocurrencias = {};
    Object.values(transacciones).forEach(productos => {
      // Solo analizar transacciones con múltiples productos
      if (productos.length > 1) {
        for (let i = 0; i < productos.length; i++) {
          for (let j = i + 1; j < productos.length; j++) {
            const par = [productos[i], productos[j]].sort().join('-');
            coocurrencias[par] = (coocurrencias[par] || 0) + 1;
          }
        }
      }
    });
    
    // Convertir a array y obtener los pares más comunes
    const paresComunes = Object.entries(coocurrencias)
      .map(([par, frecuencia]) => {
        const [id1, id2] = par.split('-');
        return {
          par,
          frecuencia,
          producto1: {
            id: id1,
            nombre: medicamentos.find(m => m.id === id1)?.nombre || 'Desconocido'
          },
          producto2: {
            id: id2,
            nombre: medicamentos.find(m => m.id === id2)?.nombre || 'Desconocido'
          }
        };
      })
      .sort((a, b) => b.frecuencia - a.frecuencia)
      .slice(0, 10);
    
    return paresComunes;
  }

  // Análisis completo
  async analizarTodo() {
    const datos = await this.obtenerDatos();
    
    return {
      metricasGenerales: this.calcularMetricasGenerales(datos.inventario, datos.ventas, datos.medicamentos),
      productosPopulares: this.analizarProductosPopulares(datos.ventas, datos.medicamentos).slice(0, 10),
      tendenciasTemporales: this.analizarTendenciasTemporales(datos.ventas),
      oportunidadesReposicion: this.detectarOportunidades(datos.inventario, datos.ventas, datos.medicamentos),
      excesosInventario: this.detectarExcesosInventario(datos.inventario, datos.ventas, datos.medicamentos),
      sugerenciasPromociones: this.sugerirPromociones(datos.ventas, datos.medicamentos)
    };
  }
}

// Componente React para el dashboard
import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell 
} from 'recharts';

// Mock service para pruebas locales si es necesario
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

function formatoDinero(valor) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0
  }).format(valor);
}

function formatoNumero(valor) {
  return new Intl.NumberFormat('es-MX').format(valor);
}

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

const Dashboard = () => {
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [periodoAnalisis, setPeriodoAnalisis] = useState(90); // días
  
  // Usa el servicio real o el mock dependiendo de si estamos en modo desarrollo o producción
  const servicioAnalisis = process.env.NODE_ENV === 'development' 
    ? new MockServicioAnalisis() 
    : new ServicioAnalisisTendencias();
  
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setCargando(true);
        setError(null); // Resetear error antes de intentar cargar
        
        // Agregar un pequeño retraso para asegurar que el componente esté montado
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const resultados = await servicioAnalisis.analizarTodo();
        // Verificar que los datos sean válidos
        if (!resultados || 
            !resultados.productosPopulares || 
            !resultados.tendenciasTemporales || 
            !resultados.metricasGenerales) {
          throw new Error('Los datos retornados no tienen el formato esperado');
        }
        
        console.log('Datos cargados correctamente:', resultados);
        setDatos(resultados);
      } catch (err) {
        console.error('Error detallado:', err);
        setError(`Error al cargar los datos de análisis: ${err.message}`);
      } finally {
        setCargando(false);
      }
    };
    
    cargarDatos();
  }, [periodoAnalisis]);
  
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
  
  return (
    <div className="bg-gray-50 p-6 rounded-lg shadow">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Análisis de Tendencias y Recomendaciones</h2>
        
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
                  width={100}
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

export default Dashboard;

// Puedes importar este componente en tu aplicación principal así:
// import DashboardTendencias from './components/DashboardTendencias';
//
// Y luego usarlo:
// <DashboardTendencias />
//
// Para personalizar los endpoints, modifica los valores en el constructor de ServicioAnalisisTendencias.