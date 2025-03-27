import React, { useState, useEffect } from 'react';

const Inventarios = () => {
  // Estados del componente
  const [inventarios, setInventarios] = useState([]);
  const [farmacias, setFarmacias] = useState([]);
  const [medicamentos, setMedicamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Estado para nuevo inventario
  const [nuevoInventario, setNuevoInventario] = useState({
    farmaciaId: '',
    medicamentoId: '',
    stock: '',
    stockMinimo: '10',
    precio: '0.00',
    vencimiento: ''
  });

  // Estado de paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const [inventariosPorPagina] = useState(10);

  // Función para obtener datos
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
      const [datosInventarios, datosFarmacias, datosMedicamentos] = await Promise.all([
        fetchConManejo('/api/inventarios'),
        fetchConManejo('/api/farmacias'),
        fetchConManejo('/api/medicamentos')
      ]);

      // Función para extraer datos de manera segura
      const extraerDatos = (datos, clavesPosibles) => {
        for (let clave of clavesPosibles) {
          const valor = clave.split('.').reduce((obj, key) => obj && obj[key], datos);
          if (Array.isArray(valor)) return valor;
        }
        return [];
      };

      // Actualizar estados con extracción segura de datos
      const inventariosExtraidos = extraerDatos(datosInventarios, [
        'data.inventarios', 
        'inventarios', 
        'data'
      ]);

      setInventarios(Array.isArray(inventariosExtraidos) ? inventariosExtraidos : []);
      setFarmacias(extraerDatos(datosFarmacias, ['data.farmacias', 'farmacias', 'data']));
      setMedicamentos(extraerDatos(datosMedicamentos, ['data.medicamentos', 'medicamentos', 'data']));

      setLoading(false);
    } catch (err) {
      console.error('Error al obtener datos:', err);
      setError(err.message || 'Error desconocido al cargar datos');
      setLoading(false);
      
      // Establecer un array vacío para evitar errores
      setInventarios([]);
    }
  };

  // Efecto para cargar datos al inicio
  useEffect(() => {
    fetchDatos();
  }, []);

  // Funciones para manejar el modal
  const abrirModal = () => {
    setIsModalOpen(true);
  };

  const cerrarModal = () => {
    setIsModalOpen(false);
    
    // Resetear el formulario al cerrar
    setNuevoInventario({
      farmaciaId: '',
      medicamentoId: '',
      stock: '',
      stockMinimo: '10',
      precio: '0.00',
      vencimiento: ''
    });
  };

  // Manejar cambios en el formulario
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    const nuevoEstado = {
      ...nuevoInventario,
      [name]: value
    };

    // Si cambia medicamento o stock, recalcular precio
    if (name === 'medicamentoId' || name === 'stock') {
      // Buscar el medicamento seleccionado
      const medicamentoSeleccionado = medicamentos.find(
        med => med.id === (name === 'medicamentoId' ? value : nuevoInventario.medicamentoId)
      );

      // Obtener la cantidad
      const cantidad = name === 'stock' 
        ? parseInt(value) || 0 
        : parseInt(nuevoInventario.stock) || 0;

      // Calcular precio si existe el medicamento
      if (medicamentoSeleccionado) {
        const precioBase = medicamentoSeleccionado.precioUnitario || 0;
        nuevoEstado.precio = (precioBase * cantidad).toFixed(2);
      }
    }

    setNuevoInventario(nuevoEstado);
  };

  // Enviar nuevo inventario
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/inventarios', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...nuevoInventario,
          stock: parseInt(nuevoInventario.stock),
          stockMinimo: parseInt(nuevoInventario.stockMinimo),
          precio: parseFloat(nuevoInventario.precio),
          vencimiento: new Date(nuevoInventario.vencimiento).toISOString()
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al crear inventario');
      }

      // Resetear formulario y cerrar modal
      cerrarModal();
      
      // Actualizar lista
      fetchDatos();
    } catch (err) {
      console.error('Error al crear inventario:', err);
      setError(err.message || 'Error al crear inventario');
    }
  };

  // Lógica de paginación
  const inventariosActuales = Array.isArray(inventarios) 
    ? inventarios.slice(
        (paginaActual - 1) * inventariosPorPagina, 
        paginaActual * inventariosPorPagina
      )
    : [];

  // Calcular número total de páginas
  const numeroPaginas = Array.isArray(inventarios) 
    ? Math.ceil(inventarios.length / inventariosPorPagina) 
    : 0;

  // Cambiar página
  const cambiarPagina = (numeroPagina) => setPaginaActual(numeroPagina);

  // Generar números de página
  const generarNumerosPagina = () => {
    const paginas = [];
    for (let i = 1; i <= numeroPaginas; i++) {
      paginas.push(i);
    }
    return paginas;
  };

  // Estados de carga y error
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
        <p className="text-gray-600 text-xl">Cargando inventarios...</p>
      </div>
    );
  }

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

  // Renderizado principal
  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="container mx-auto max-w-7xl">
        {/* Encabezado */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Inventario</h1>
          <button 
            onClick={abrirModal}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center space-x-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            <span>Agregar Inventario</span>
          </button>
        </div>

        {/* Tabla de Inventarios */}
        {inventariosActuales.length > 0 ? (
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {[
                    'Farmacia', 
                    'Medicamento', 
                    'Stock', 
                    'Stock Mínimo', 
                    'Precio', 
                    'Vencimiento'
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
                {inventariosActuales.map((inventario) => (
                  <tr key={inventario.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {inventario.farmacia?.nombre || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {inventario.medicamento?.nombre || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={`
                        ${inventario.stock <= inventario.stockMinimo 
                          ? 'text-red-600 font-semibold' 
                          : 'text-gray-500'
                        }`}
                      >
                        {inventario.stock}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {inventario.stockMinimo}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
  {typeof inventario.precio === 'number' 
    ? inventario.precio.toFixed(2) 
    : (parseFloat(inventario.precio)?.toFixed(2) || 'N/A')}
</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {inventario.vencimiento 
                        ? new Date(inventario.vencimiento).toLocaleDateString() 
                        : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-white shadow-md rounded-lg p-6 text-center">
            <p className="text-gray-500">No hay inventarios disponibles</p>
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

            {generarNumerosPagina().map(numero => (
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
              disabled={paginaActual === numeroPaginas}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Siguiente
            </button>
          </div>
        )}

        {/* Modal para agregar inventario */}
        {isModalOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
            onClick={cerrarModal}
          >
            <div 
              className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 m-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">Agregar Nuevo Inventario</h2>
                <button 
                  onClick={cerrarModal}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Selector de Farmacia */}
                <div>
                  <label htmlFor="farmaciaId" className="block text-sm font-medium text-gray-700 mb-1">
                    Farmacia
                  </label>
                  <select
                    id="farmaciaId"
                    name="farmaciaId"
                    required
                    value={nuevoInventario.farmaciaId}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                  >
                    <option value="">Seleccione una farmacia</option>
                    {farmacias.map(farmacia => (
                      <option key={farmacia.id} value={farmacia.id}>
                        {farmacia.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Selector de Medicamento */}
                <div>
                  <label htmlFor="medicamentoId" className="block text-sm font-medium text-gray-700 mb-1">
                    Medicamento
                  </label>
                  <select
                    id="medicamentoId"
                    name="medicamentoId"
                    required
                    value={nuevoInventario.medicamentoId}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                  >
                    <option value="">Seleccione un medicamento</option>
                    {medicamentos.map(medicamento => (
                      <option key={medicamento.id} value={medicamento.id}>
                        {medicamento.nombre} - {medicamento.categoria}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Stock y Stock Mínimo */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="stock" className="block text-sm font-medium text-gray-700 mb-1">
                      Stock
                    </label>
                    <input
                      type="number"
                      id="stock"
                      name="stock"
                      min="0"
                      required
                      value={nuevoInventario.stock}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                    />
                  </div>
                  <div>
                    <label htmlFor="stockMinimo" className="block text-sm font-medium text-gray-700 mb-1">
                      Stock Mínimo
                    </label>
                    <input
                      type="number"
                      id="stockMinimo"
                      name="stockMinimo"
                      min="0"
                      required
                      value={nuevoInventario.stockMinimo}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                    />
                  </div>
                </div>

                {/* Precio y Fecha de Vencimiento */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="precio" className="block text-sm font-medium text-gray-700 mb-1">
                      Precio Total
                    </label>
                    <input
                      type="number"
                      id="precio"
                      name="precio"
                      readOnly
                      value={nuevoInventario.precio}
                      className="mt-1 block w-full rounded-md border-gray-300 bg-gray-100 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label htmlFor="vencimiento" className="block text-sm font-medium text-gray-700 mb-1">
                      Fecha de Vencimiento
                    </label>
                    <input
                      type="date"
                      id="vencimiento"
                      name="vencimiento"
                      required
                      value={nuevoInventario.vencimiento}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                    />
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
                    Guardar
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

export default Inventarios;