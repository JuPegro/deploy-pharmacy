import React, { useState, useEffect } from 'react';

const Ventas = () => {
  // Estados principales
  const [ventas, setVentas] = useState([]);
  const [inventarios, setInventarios] = useState([]);
  const [farmacias, setFarmacias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalError, setModalError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Estado para nueva venta
  const [nuevaVenta, setNuevaVenta] = useState({
    inventarioId: '',
    farmaciaId: '',
    cantidad: '',
    precioUnitario: ''
  });

  // Estados de paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const [ventasPorPagina] = useState(10);

  // Recuperar datos
  const fetchDatos = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No se encontró token de autenticación');
      }

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
        ventasResponse,
        inventariosResponse,
        farmaciasResponse
      ] = await Promise.all([
        fetchConManejo('/api/ventas'),
        fetchConManejo('/api/inventarios'),
        fetchConManejo('/api/farmacias')
      ]);

      // Extraer datos con validación
      const extraerDatos = (datos, clavesPosibles) => {
        for (let clave of clavesPosibles) {
          const valor = clave.split('.').reduce((obj, key) => obj && obj[key], datos);
          if (Array.isArray(valor)) return valor;
        }
        return [];
      };

      setVentas(extraerDatos(ventasResponse, ['data.ventas', 'ventas', 'data']) || []);

      // Obtener inventarios con sus detalles de farmacia y medicamento
      const inventariosConDetalles = extraerDatos(inventariosResponse, ['data.inventarios', 'inventarios', 'data']) || [];
      setInventarios(inventariosConDetalles);

      setFarmacias(extraerDatos(farmaciasResponse, ['data.farmacias', 'farmacias', 'data']) || []);

      setLoading(false);
    } catch (err) {
      console.error('Error al obtener datos:', err);
      setError(err.message || 'Error desconocido al cargar datos');
      setLoading(false);
    }
  };

  // Cargar datos al inicio
  useEffect(() => {
    fetchDatos();
  }, []);

  // Manejar cambios en el formulario de nueva venta
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // Limpiar errores de modal
    setModalError(null);

    // Lógica especial para inventario
    if (name === 'inventarioId') {
      // Encontrar el inventario seleccionado
      const inventarioSeleccionado = inventarios.find(inv => inv.id === value);

      // Actualizar precio unitario y farmacia si se encuentra
      setNuevaVenta(prev => ({
        ...prev,
        [name]: value,
        precioUnitario: inventarioSeleccionado?.precio || '',
        farmaciaId: inventarioSeleccionado?.farmaciaId || ''
      }));
    } else {
      setNuevaVenta(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Enviar nueva venta
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validar stock disponible antes de enviar
    const inventarioSeleccionado = inventarios.find(inv => inv.id === nuevaVenta.inventarioId);
    const cantidadSolicitada = parseInt(nuevaVenta.cantidad);

    if (!inventarioSeleccionado) {
      setModalError('Debe seleccionar un medicamento');
      return;
    }

    if (cantidadSolicitada > inventarioSeleccionado.stock) {
      setModalError(`Stock insuficiente. Disponible: ${inventarioSeleccionado.stock}`);
      return;
    }

    try {
      const token = localStorage.getItem('token');

      // Preparar datos de la venta
      const datosVenta = {
        inventarioId: nuevaVenta.inventarioId,
        farmaciaId: inventarioSeleccionado.farmaciaId, // Usar farmaciaId del inventario
        cantidad: cantidadSolicitada,
        precioUnitario: parseFloat(nuevaVenta.precioUnitario)
      };

      console.log('Datos de venta a enviar:', datosVenta);

      const response = await fetch('/api/ventas', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(datosVenta)
      });

      // Logging de respuesta completa
      const responseBody = await response.text();
      console.log('Respuesta del servidor:', response.status, responseBody);

      if (!response.ok) {
        try {
          const errorData = JSON.parse(responseBody);
          throw new Error(errorData.message || 'Error al crear venta');
        } catch {
          throw new Error(`Error HTTP ${response.status}: ${responseBody}`);
        }
      }

      // Resetear formulario y cerrar modal
      setNuevaVenta({
        inventarioId: '',
        farmaciaId: '',
        cantidad: '',
        precioUnitario: ''
      });
      setIsModalOpen(false);

      // Actualizar lista
      fetchDatos();
    } catch (err) {
      console.error('Error completo al crear venta:', err);
      setModalError(err.message || 'Error al crear venta');
    }
  };

  // Cerrar modal
  const cerrarModal = () => {
    setIsModalOpen(false);
    setModalError(null);
    setNuevaVenta({
      inventarioId: '',
      farmaciaId: '',
      cantidad: '',
      precioUnitario: ''
    });
  };

  // Lógica de paginación
  const indexUltimaVenta = paginaActual * ventasPorPagina;
  const indexPrimeraVenta = indexUltimaVenta - ventasPorPagina;
  const ventasActuales = ventas.slice(indexPrimeraVenta, indexUltimaVenta);

  // Calcular número de páginas
  const numeroPaginas = Math.ceil(ventas.length / ventasPorPagina);

  // Cambiar página
  const cambiarPagina = (numeroPagina) => setPaginaActual(numeroPagina);

  // Estado de carga
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
        <p className="text-gray-600 text-xl">Cargando ventas...</p>
      </div>
    );
  }

  // Estado de error
  if (error) {
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
          <h1 className="text-3xl font-bold text-gray-900">Ventas</h1>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center space-x-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            <span>Nueva Venta</span>
          </button>
        </div>

        {/* Tabla de Ventas */}
        {ventasActuales.length > 0 ? (
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {[
                    'Fecha',
                    'Farmacia',
                    'Medicamento',
                    'Cantidad',
                    'Precio Unitario',
                    'Total'
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
                {ventasActuales.map((venta) => (
                  <tr key={venta.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(venta.fecha).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {venta.farmacia?.nombre || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {venta.inventario?.medicamento?.nombre || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {venta.cantidad}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ${typeof venta.precioUnitario === 'number'
                        ? venta.precioUnitario.toFixed(2)
                        : (parseFloat(venta.precioUnitario)?.toFixed(2) || 'N/A')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                      ${(
                        venta.cantidad *
                        (typeof venta.precioUnitario === 'number'
                          ? venta.precioUnitario
                          : parseFloat(venta.precioUnitario) || 0)
                      ).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-white shadow-md rounded-lg p-6 text-center">
            <p className="text-gray-500">No hay ventas registradas</p>
          </div>
        )}

        {/* Paginación */}
        {numeroPaginas > 1 && (
          <div className="flex justify-center mt-4 space-x-2">
            <button
              onClick={() => cambiarPagina(paginaActual - 1)}
              disabled={paginaActual === 1}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Anterior
            </button>

            {Array.from({ length: numeroPaginas }, (_, i) => i + 1).map(numero => (
              <button
                key={numero}
                onClick={() => cambiarPagina(numero)}
                className={`px-4 py-2 rounded-md ${paginaActual === numero
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-200 text-gray-700'
                  }`}
              >
                {numero}
              </button>
            ))}

            <button
              onClick={() => cambiarPagina(paginaActual + 1)}
              disabled={paginaActual === numeroPaginas}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Siguiente
            </button>
          </div>
        )}

        {/* Modal para nueva venta */}
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
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 2424" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900">Crear Nueva Venta</h2>
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
                    value={nuevaVenta.inventarioId}
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
                    Cantidad
                  </label>
                  <input
                    type="number"
                    id="cantidad"
                    name="cantidad"
                    min="1"
                    required
                    value={nuevaVenta.cantidad}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                  />
                </div>

                {/* Precio Unitario */}
                <div>
                  <label htmlFor="precioUnitario" className="block text-sm font-medium text-gray-700 mb-1">
                    Precio Unitario
                  </label>
                  <input
                    type="number"
                    id="precioUnitario"
                    name="precioUnitario"
                    min="0"
                    step="0.01"
                    readOnly
                    value={nuevaVenta.precioUnitario}
                    className="mt-1 block w-full rounded-md border-gray-300 bg-gray-100 cursor-not-allowed"
                  />
                </div>

                {/* Total de Venta */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Total
                  </label>
                  <div className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 p-2 text-right font-semibold">
                    ${(
                      parseFloat(nuevaVenta.cantidad || 0) *
                      parseFloat(nuevaVenta.precioUnitario || 0)
                    ).toFixed(2)}
                  </div>
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
                    Guardar Venta
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

export default Ventas;