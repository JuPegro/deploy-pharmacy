import React, { useState, useEffect } from 'react';

const Devoluciones = () => {
  // Estados principales
  const [devoluciones, setDevoluciones] = useState([]);
  const [inventarios, setInventarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalError, setModalError] = useState(null);

  // Estado para nueva devolución
  const [nuevaDevolucion, setNuevaDevolucion] = useState({
    inventarioId: '',
    cantidad: '',
    motivo: ''
  });

  // Estados de paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [totalDevoluciones, setTotalDevoluciones] = useState(0);
  const [limitePorPagina, setLimitePorPagina] = useState(10);

  // Estado de filtros
  const [filtros, setFiltros] = useState({
    fechaInicio: '',
    fechaFin: '',
    estado: ''
  });

  // Motivos de devolución predefinidos
  const motivosDevoluciones = [
    'Producto dañado',
    'Fecha de vencimiento próxima',
    'Error en pedido',
    'Sobrestock',
    'Producto no solicitado',
    'Cambio de medicamento',
    'Deterioro del empaque'
  ];

  // Estados de devolución
  const estadosDevoluciones = [
    { valor: '', texto: 'Todos' },
    { valor: 'PENDIENTE', texto: 'Pendiente' },
    { valor: 'APROBADA', texto: 'Aprobada' },
    { valor: 'RECHAZADA', texto: 'Rechazada' }
  ];

  // Recuperar datos
  const fetchDatos = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No se encontró token de autenticación');
      }

      // Construir query params para filtros
      const queryParams = new URLSearchParams();
      queryParams.append('pagina', paginaActual);
      queryParams.append('limite', limitePorPagina);
      
      if (filtros.fechaInicio) queryParams.append('fechaInicio', filtros.fechaInicio);
      if (filtros.fechaFin) queryParams.append('fechaFin', filtros.fechaFin);
      if (filtros.estado) queryParams.append('estado', filtros.estado);

      // Función para manejar fetch con mejor error handling
      const fetchConManejo = async (url) => {
        const respuesta = await fetch(url, {
          method: 'GET',
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!respuesta.ok) {
          const texto = await respuesta.text();
          console.error('Respuesta del servidor:', texto);
          
          try {
            const errorJson = JSON.parse(texto);
            throw new Error(errorJson.message || 'Error desconocido');
          } catch {
            throw new Error(`Error HTTP ${respuesta.status}: ${texto}`);
          }
        }

        return respuesta.json();
      };

      // Solicitudes en paralelo
      const [
        devolucionesResponse, 
        inventariosResponse
      ] = await Promise.all([
        fetchConManejo(`/api/devoluciones?${queryParams}`),
        fetchConManejo('/api/inventarios')
      ]);

      // Verificar estructura de la respuesta para devoluciones
      if (devolucionesResponse?.data?.devoluciones) {
        setDevoluciones(devolucionesResponse.data.devoluciones);
        
        // Actualizar datos de paginación
        const paginacion = devolucionesResponse.data.paginacion;
        if (paginacion) {
          setTotalPaginas(paginacion.totalPaginas || 1);
          setTotalDevoluciones(paginacion.totalDevoluciones || 0);
          setLimitePorPagina(paginacion.limitePorPagina || 10);
        }
      } else {
        setDevoluciones([]);
        setTotalPaginas(1);
      }

      // Verificar estructura de la respuesta para inventarios
      if (inventariosResponse?.data?.inventarios) {
        setInventarios(inventariosResponse.data.inventarios);
      } else {
        setInventarios([]);
      }

      setLoading(false);
    } catch (err) {
      console.error('Error al obtener datos:', err);
      setError(err.message || 'Error desconocido al cargar datos');
      setLoading(false);
    }
  };

  // Cargar datos al inicio y cuando cambian los filtros o la paginación
  useEffect(() => {
    fetchDatos();
  }, [paginaActual, filtros]);

  // Manejar cambios en el formulario de nueva devolución
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Limpiar errores de modal
    setModalError(null);
    
    setNuevaDevolucion(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Manejar cambios en filtros
  const handleFiltroChange = (e) => {
    const { name, value } = e.target;
    
    setFiltros(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Resetear a la primera página al cambiar filtros
    setPaginaActual(1);
  };

  // Aplicar filtros
  const aplicarFiltros = (e) => {
    e.preventDefault();
    fetchDatos();
  };

  // Limpiar filtros
  const limpiarFiltros = () => {
    setFiltros({
      fechaInicio: '',
      fechaFin: '',
      estado: ''
    });
    setPaginaActual(1);
  };

  // Enviar nueva devolución
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validar que todos los campos estén completos
    if (!nuevaDevolucion.inventarioId) {
      setModalError('Debe seleccionar un medicamento');
      return;
    }

    // Validar stock disponible antes de enviar
    const inventarioSeleccionado = inventarios.find(inv => inv.id === nuevaDevolucion.inventarioId);
    
    if (!inventarioSeleccionado) {
      setModalError('Medicamento no encontrado');
      return;
    }
    
    const cantidadDevolucion = parseInt(nuevaDevolucion.cantidad);
    
    if (!cantidadDevolucion || cantidadDevolucion <= 0) {
      setModalError('La cantidad de devolución debe ser mayor a cero');
      return;
    }

    if (!nuevaDevolucion.motivo) {
      setModalError('Debe seleccionar un motivo de devolución');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      // Preparar datos de la devolución
      const datosDevolucion = {
        inventarioId: nuevaDevolucion.inventarioId,
        farmaciaId: inventarioSeleccionado.farmaciaId,
        cantidad: cantidadDevolucion,
        motivo: nuevaDevolucion.motivo
      };

      console.log('Datos de devolución a enviar:', datosDevolucion);

      const response = await fetch('/api/devoluciones', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(datosDevolucion)
      });

      // Logging de respuesta completa
      const responseBody = await response.text();
      console.log('Respuesta del servidor:', response.status, responseBody);

      if (!response.ok) {
        try {
          const errorData = JSON.parse(responseBody);
          throw new Error(errorData.message || 'Error al crear devolución');
        } catch {
          throw new Error(`Error HTTP ${response.status}: ${responseBody}`);
        }
      }

      // Resetear formulario y cerrar modal
      setNuevaDevolucion({
        inventarioId: '',
        cantidad: '',
        motivo: ''
      });
      setIsModalOpen(false);
      
      // Actualizar lista
      fetchDatos();
    } catch (err) {
      console.error('Error completo al crear devolución:', err);
      setModalError(err.message || 'Error al crear devolución');
    }
  };

  // Formatear el estado con color
  const formatearEstado = (estado) => {
    switch(estado) {
      case 'PENDIENTE':
        return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">Pendiente</span>;
      case 'APROBADA':
        return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Aprobada</span>;
      case 'RECHAZADA':
        return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">Rechazada</span>;
      default:
        return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">{estado}</span>;
    }
  };

  // Cerrar modal
  const cerrarModal = () => {
    setIsModalOpen(false);
    setModalError(null);
    setNuevaDevolucion({
      inventarioId: '',
      cantidad: '',
      motivo: ''
    });
  };

  // Cambiar página
  const cambiarPagina = (numeroPagina) => setPaginaActual(numeroPagina);

  // Estado de carga
  if (loading && !devoluciones.length) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
        <p className="text-gray-600 text-xl">Cargando devoluciones...</p>
      </div>
    );
  }

  // Estado de error
  if (error && !devoluciones.length) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-red-50 border border-red-500 text-red-700 px-4 py-3 rounded-lg max-w-md w-full">
          <p className="text-center">{error}</p>
          <button 
            onClick={fetchDatos} 
            className="mt-4 w-full px-4 py-2 bg-red-500 text-white rounded-md"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="container mx-auto max-w-7xl">
        {/* Encabezado */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Devoluciones</h1>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center space-x-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            <span>Nueva Devolución</span>
          </button>
        </div>

        {/* Filtros */}
        <div className="bg-white shadow-md rounded-lg p-4 mb-6">
          <form onSubmit={aplicarFiltros} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label htmlFor="fechaInicio" className="block text-sm font-medium text-gray-700 mb-1">
                Fecha Inicio
              </label>
              <input
                type="date"
                id="fechaInicio"
                name="fechaInicio"
                value={filtros.fechaInicio}
                onChange={handleFiltroChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              />
            </div>
            
            <div>
              <label htmlFor="fechaFin" className="block text-sm font-medium text-gray-700 mb-1">
                Fecha Fin
              </label>
              <input
                type="date"
                id="fechaFin"
                name="fechaFin"
                value={filtros.fechaFin}
                onChange={handleFiltroChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              />
            </div>
            
            <div>
              <label htmlFor="estado" className="block text-sm font-medium text-gray-700 mb-1">
                Estado
              </label>
              <select
                id="estado"
                name="estado"
                value={filtros.estado}
                onChange={handleFiltroChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              >
                {estadosDevoluciones.map(estado => (
                  <option key={estado.valor} value={estado.valor}>
                    {estado.texto}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex items-end space-x-2">
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition"
              >
                Filtrar
              </button>
              <button
                type="button"
                onClick={limpiarFiltros}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition"
              >
                Limpiar
              </button>
            </div>
          </form>
        </div>

        {/* Resumen */}
        <div className="mb-6">
          <p className="text-gray-600">
            Mostrando {devoluciones.length} de {totalDevoluciones} devoluciones.
          </p>
        </div>

        {/* Tabla de Devoluciones */}
        {devoluciones.length > 0 ? (
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {[
                      'Fecha', 
                      'Farmacia', 
                      'Medicamento', 
                      'Cantidad', 
                      'Motivo',
                      'Estado'
                    ].map((header) => (
                      <th 
                        key={header}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {devoluciones.map((devolucion) => (
                    <tr key={devolucion.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(devolucion.fecha).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {devolucion.farmacia?.nombre || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {devolucion.inventario?.medicamento?.nombre || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {devolucion.cantidad}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {devolucion.motivo}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatearEstado(devolucion.estado)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-white shadow-md rounded-lg p-6 text-center">
            <p className="text-gray-500">No hay devoluciones registradas con los filtros actuales</p>
          </div>
        )}

        {/* Paginación */}
        {totalPaginas > 1 && (
          <div className="flex justify-center mt-4 space-x-2">
            <button
              onClick={() => cambiarPagina(paginaActual - 1)}
              disabled={paginaActual === 1}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Anterior
            </button>

            {Array.from({ length: totalPaginas }, (_, i) => i + 1).map(numero => (
              <button
                key={numero}
                onClick={() => cambiarPagina(numero)}
                className={`px-4 py-2 rounded-md ${
                  paginaActual === numero 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                {numero}
              </button>
            ))}

            <button
              onClick={() => cambiarPagina(paginaActual + 1)}
              disabled={paginaActual === totalPaginas}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Siguiente
            </button>
          </div>
        )}

        {/* Modal para nueva devolución */}
        {isModalOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
            onClick={cerrarModal}
          >
            <div 
              className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 m-4 relative"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Botón de cierre */}
              <button 
                onClick={cerrarModal}
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900">Crear Nueva Devolución</h2>
              </div>

              {/* Mostrar mensaje de error si existe */}
              {modalError && (
                <div className="bg-red-50 border border-red-500 text-red-700 px-4 py-3 rounded-lg mb-4">
                  <p>{modalError}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Selector de Inventario */}
                <div>
                  <label htmlFor="inventarioId" className="block text-sm font-medium text-gray-700 mb-1">
                    Medicamento
                  </label>
                  <select
                    id="inventarioId"
                    name="inventarioId"
                    required
                    value={nuevaDevolucion.inventarioId}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                  >
                    <option value="">Seleccione un medicamento</option>
                    {inventarios.map(inventario => (
                      <option 
                        key={inventario.id} 
                        value={inventario.id}
                        disabled={inventario.stock <= 0}
                      >
                        {inventario.medicamento?.nombre} - {inventario.farmacia?.nombre} 
                        {` (Stock: ${inventario.stock})`}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Cantidad */}
                <div>
                  <label htmlFor="cantidad" className="block text-sm font-medium text-gray-700 mb-1">
                    Cantidad a Devolver
                  </label>
                  <input
                    type="number"
                    id="cantidad"
                    name="cantidad"
                    min="1"
                    required
                    value={nuevaDevolucion.cantidad}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                  />
                </div>

                {/* Motivo de Devolución */}
                <div>
                  <label htmlFor="motivo" className="block text-sm font-medium text-gray-700 mb-1">
                    Motivo de Devolución
                  </label>
                  <select
                    id="motivo"
                    name="motivo"
                    required
                    value={nuevaDevolucion.motivo}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                  >
                    <option value="">Seleccione un motivo</option>
                    {motivosDevoluciones.map(motivo => (
                      <option key={motivo} value={motivo}>
                        {motivo}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Botones de Acción */}
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={cerrarModal}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition"
                  >
                    Guardar Devolución
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Devoluciones;