import React, { useState, useEffect } from 'react';

const Medicamentos = () => {
  // Estados principales
  const [medicamentos, setMedicamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalError, setModalError] = useState(null);
  
  // Estados de paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const [limitePorPagina, setLimitePorPagina] = useState(10);
  const [totalMedicamentos, setTotalMedicamentos] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(1);

  // Estado de búsqueda/filtrado
  const [busqueda, setBusqueda] = useState('');
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('');
  const [categorias, setCategorias] = useState([]);

  // Estado para nuevo medicamento
  const [nuevoMedicamento, setNuevoMedicamento] = useState({
    nombre: '',
    categoria: '',
    descripcion: '',
    principioActivo: '',
    presentacion: '',
    requiereReceta: false
  });

  // Categorías predefinidas comunes
  const categoriasPredefinidas = [
    'Analgésico',
    'Antibiótico',
    'Antiinflamatorio',
    'Antihistamínico',
    'Antihipertensivo',
    'Antidiabético',
    'Antiácido',
    'Antidepresivo',
    'Vitamina',
    'Suplemento',
    'Otro'
  ];

  // Función para cargar medicamentos desde el backend
  const fetchMedicamentos = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No se encontró token de autenticación');
      }

      // Construir query params
      const params = new URLSearchParams();
      if (busqueda) params.append('busqueda', busqueda);
      if (categoriaSeleccionada) params.append('categoria', categoriaSeleccionada);
      params.append('pagina', paginaActual);
      params.append('limite', limitePorPagina);
      params.append('ordenarPor', 'nombre');

      const response = await fetch(`/api/medicamentos?${params}`, {
        method: 'GET',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`Error al obtener medicamentos: ${response.status}`);
      }

      const data = await response.json();
      
      // Extraer datos y paginación
      if (data.data && data.data.medicamentos) {
        setMedicamentos(data.data.medicamentos);
        
        // Extraer datos de paginación si están disponibles
        if (data.data.paginacion) {
          setTotalPaginas(data.data.paginacion.totalPaginas || 1);
          setTotalMedicamentos(data.data.paginacion.totalMedicamentos || 0);
          setLimitePorPagina(data.data.paginacion.limitePorPagina || 10);
        }
        
        // Extraer categorías únicas para filtrado
        if (data.data.medicamentos && data.data.medicamentos.length > 0) {
          const uniqueCategorias = [...new Set(data.data.medicamentos.map(med => med.categoria))].filter(Boolean);
          setCategorias(uniqueCategorias);
        }
      } else {
        setMedicamentos([]);
        setTotalPaginas(1);
        setTotalMedicamentos(0);
      }

      setLoading(false);
    } catch (err) {
      console.error('Error al obtener medicamentos:', err);
      setError(err.message || 'Error al cargar medicamentos');
      setLoading(false);
    }
  };

  // Efecto para cargar datos al inicio y cuando cambian los filtros
  useEffect(() => {
    fetchMedicamentos();
  }, [paginaActual, busqueda, categoriaSeleccionada]);

  // Manejar cambios en el formulario de búsqueda
  const handleBusquedaChange = (e) => {
    setBusqueda(e.target.value);
    setPaginaActual(1); // Resetear a primera página al cambiar filtros
  };

  // Manejar cambios en la selección de categoría
  const handleCategoriaChange = (e) => {
    setCategoriaSeleccionada(e.target.value);
    setPaginaActual(1); // Resetear a primera página al cambiar filtros
  };

  // Manejar cambios en el formulario de nuevo medicamento
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setModalError(null); // Limpiar errores previos
    setNuevoMedicamento(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Enviar nuevo medicamento
  const handleSubmit = async (e) => {
    e.preventDefault();
    setModalError(null);

    // Validación básica
    if (!nuevoMedicamento.nombre || !nuevoMedicamento.categoria) {
      setModalError('El nombre y categoría son campos obligatorios');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No se encontró token de autenticación');
      }

      const response = await fetch('/api/medicamentos', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(nuevoMedicamento)
      });

      // Log para depuración
      const responseText = await response.text();
      console.log('Response:', response.status, responseText);

      if (!response.ok) {
        let errorMessage;
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.message || 'Error al crear medicamento';
        } catch {
          errorMessage = `Error ${response.status}: ${responseText}`;
        }
        throw new Error(errorMessage);
      }

      // Resetear formulario y cerrar modal
      setNuevoMedicamento({
        nombre: '',
        categoria: '',
        descripcion: '',
        principioActivo: '',
        presentacion: '',
        requiereReceta: false
      });
      setIsModalOpen(false);
      
      // Refrescar lista
      fetchMedicamentos();
    } catch (err) {
      console.error('Error al crear medicamento:', err);
      setModalError(err.message || 'Error al crear medicamento');
    }
  };

  // Cambiar página
  const cambiarPagina = (numeroPagina) => {
    setPaginaActual(numeroPagina);
  };

  // Estado de carga
  if (loading && !medicamentos.length) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
        <p className="text-gray-600 text-xl ml-3">Cargando medicamentos...</p>
      </div>
    );
  }

  // Estado de error
  if (error && !medicamentos.length) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-red-50 border border-red-500 text-red-700 px-4 py-3 rounded-lg max-w-md w-full">
          <div className="flex justify-between items-center">
            <span className="block sm:inline">{error}</span>
            <button 
              onClick={fetchMedicamentos} 
              className="ml-4 bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600 transition"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="container mx-auto max-w-7xl">
        {/* Encabezado */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Catálogo de Medicamentos</h1>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center space-x-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            <span>Agregar Medicamento</span>
          </button>
        </div>

        {/* Filtros y búsqueda */}
        <div className="bg-white shadow-md rounded-lg p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="busqueda" className="block text-sm font-medium text-gray-700 mb-1">
                Buscar medicamento
              </label>
              <input
                type="text"
                id="busqueda"
                value={busqueda}
                onChange={handleBusquedaChange}
                placeholder="Buscar por nombre..."
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              />
            </div>
            <div>
              <label htmlFor="categoria" className="block text-sm font-medium text-gray-700 mb-1">
                Filtrar por categoría
              </label>
              <select
                id="categoria"
                value={categoriaSeleccionada}
                onChange={handleCategoriaChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              >
                <option value="">Todas las categorías</option>
                {/* Mostrar categorías de la base de datos primero */}
                {categorias.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Información de resultados */}
        <div className="mb-4 text-gray-600">
          Mostrando {medicamentos.length} de {totalMedicamentos} medicamentos
        </div>

        {/* Tabla de Medicamentos */}
        {medicamentos.length > 0 ? (
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {[
                      'Código', 
                      'Nombre', 
                      'Categoría', 
                      'Principio Activo', 
                      'Presentación', 
                      'Requiere Receta'
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
                  {medicamentos.map((medicamento) => (
                    <tr key={medicamento.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {medicamento.codigo || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {medicamento.nombre}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {medicamento.categoria}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {medicamento.principioActivo || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {medicamento.presentacion || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          medicamento.requiereReceta 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {medicamento.requiereReceta ? 'Sí' : 'No'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-white shadow-md rounded-lg p-6 text-center">
            <p className="text-gray-500">No se encontraron medicamentos</p>
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

        {/* Modal para nuevo medicamento */}
        {isModalOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
            onClick={() => setIsModalOpen(false)}
          >
            <div 
              className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 m-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">Agregar Nuevo Medicamento</h2>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {modalError && (
                <div className="mb-4 bg-red-50 border border-red-500 text-red-700 px-4 py-3 rounded-lg">
                  {modalError}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    id="nombre"
                    name="nombre"
                    value={nuevoMedicamento.nombre}
                    onChange={handleInputChange}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                  />
                </div>

                <div>
                  <label htmlFor="categoria" className="block text-sm font-medium text-gray-700 mb-1">
                    Categoría *
                  </label>
                  <select
                    id="categoria"
                    name="categoria"
                    value={nuevoMedicamento.categoria}
                    onChange={handleInputChange}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                  >
                    <option value="">Seleccione una categoría</option>
                    {categoriasPredefinidas.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción
                  </label>
                  <textarea
                    id="descripcion"
                    name="descripcion"
                    rows="2"
                    value={nuevoMedicamento.descripcion}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                  ></textarea>
                </div>

                <div>
                  <label htmlFor="principioActivo" className="block text-sm font-medium text-gray-700 mb-1">
                    Principio Activo
                  </label>
                  <input
                    type="text"
                    id="principioActivo"
                    name="principioActivo"
                    value={nuevoMedicamento.principioActivo}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                  />
                </div>

                <div>
                  <label htmlFor="presentacion" className="block text-sm font-medium text-gray-700 mb-1">
                    Presentación
                  </label>
                  <input
                    type="text"
                    id="presentacion"
                    name="presentacion"
                    value={nuevoMedicamento.presentacion}
                    onChange={handleInputChange}
                    placeholder="Ej: Tabletas, Jarabe, Ampolla..."
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="requiereReceta"
                    name="requiereReceta"
                    checked={nuevoMedicamento.requiereReceta}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="requiereReceta" className="ml-2 block text-sm text-gray-700">
                    Requiere receta médica
                  </label>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                  >
                    Guardar Medicamento
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

export default Medicamentos;