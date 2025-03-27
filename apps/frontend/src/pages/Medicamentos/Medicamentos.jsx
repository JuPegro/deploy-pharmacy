import React, { useState, useEffect } from 'react';

const Medicamentos = () => {
  // State management
  const [medicamentos, setMedicamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Pagination state
  const [paginaActual, setPaginaActual] = useState(1);
  const [medicamentosPorPagina] = useState(10);

  // Form state for new medication
  const [nuevoMedicamento, setNuevoMedicamento] = useState({
    nombre: '',
    categoria: '',
    descripcion: '',
    principioActivo: '',
    presentacion: '',
    requiereReceta: false
  });

  // Fetch medications
  const fetchMedicamentos = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No se encontró token de autenticación');
      }

      const response = await fetch('/api/medicamentos', {
        method: 'GET',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Error al obtener medicamentos');
      }

      const data = await response.json();
      setMedicamentos(data.data.medicamentos);
      setLoading(false);
    } catch (err) {
      console.error('Error al obtener medicamentos:', err);
      setError(err.message || 'Error al cargar medicamentos');
      setLoading(false);
    }
  };

  // Initialize data fetch
  useEffect(() => {
    fetchMedicamentos();
  }, []);

  // Pagination logic
  const indexUltimoMedicamento = paginaActual * medicamentosPorPagina;
  const indexPrimerMedicamento = indexUltimoMedicamento - medicamentosPorPagina;
  const medicamentosActuales = medicamentos.slice(
    indexPrimerMedicamento, 
    indexUltimoMedicamento
  );

  // Cambiar página
  const cambiarPagina = (numeroPagina) => setPaginaActual(numeroPagina);

  // Calcular número total de páginas
  const numeroPaginas = Math.ceil(medicamentos.length / medicamentosPorPagina);

  // Generar números de página
  const generarNumerosPagina = () => {
    const paginas = [];
    for (let i = 1; i <= numeroPaginas; i++) {
      paginas.push(i);
    }
    return paginas;
  };

  // Handle input changes in form
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNuevoMedicamento(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Submit new medication
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/medicamentos', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(nuevoMedicamento)
      });

      if (!response.ok) {
        throw new Error('Error al crear medicamento');
      }

      // Reset form and close modal
      setNuevoMedicamento({
        nombre: '',
        categoria: '',
        descripcion: '',
        principioActivo: '',
        presentacion: '',
        requiereReceta: false
      });
      setIsModalOpen(false);
      
      // Refresh list
      fetchMedicamentos();
    } catch (err) {
      console.error('Error al crear medicamento:', err);
      setError(err.message || 'Error al crear medicamento');
    }
  };

  // Render loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-600 text-xl">Cargando medicamentos...</p>
      </div>
    );
  }

  // Render error state
  if (error) {
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
        {/* Header */}
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

        {/* Medications Table */}
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {[
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
              {medicamentosActuales.map((medicamento) => (
                <tr key={medicamento.id} className="hover:bg-gray-50 transition">
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

        {/* Pagination */}
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

        {/* Resto del código del modal (sin cambios) */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
            {/* Contenido del modal (igual que antes) */}
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 m-4">
              {/* ... (modal content remains the same) ... */}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Medicamentos;