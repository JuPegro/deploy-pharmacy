import React, { useState, useEffect } from 'react';

const Farmacias = () => {
  // State management
  const [farmacias, setFarmacias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Pagination state
  const [paginaActual, setPaginaActual] = useState(1);
  const [farmaciasPorPagina] = useState(10);

  // Form state for new pharmacy
  const [nuevaFarmacia, setNuevaFarmacia] = useState({
    nombre: '',
    direccion: '',
    latitud: '',
    longitud: ''
  });

  // Fetch pharmacies
  const fetchFarmacias = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No se encontró token de autenticación');
      }

      const response = await fetch('/api/farmacias', {
        method: 'GET',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Error al obtener farmacias');
      }

      const data = await response.json();
      setFarmacias(data.data.farmacias);
      setLoading(false);
    } catch (err) {
      console.error('Error al obtener farmacias:', err);
      setError(err.message || 'Error al cargar farmacias');
      setLoading(false);
    }
  };

  // Initialize data fetch
  useEffect(() => {
    fetchFarmacias();
  }, []);

  // Pagination logic
  const indexUltimaFarmacia = paginaActual * farmaciasPorPagina;
  const indexPrimeraFarmacia = indexUltimaFarmacia - farmaciasPorPagina;
  const farmaciasActuales = farmacias.slice(
    indexPrimeraFarmacia, 
    indexUltimaFarmacia
  );

  // Change page
  const cambiarPagina = (numeroPagina) => setPaginaActual(numeroPagina);

  // Calculate total pages
  const numeroPaginas = Math.ceil(farmacias.length / farmaciasPorPagina);

  // Generate page numbers
  const generarNumerosPagina = () => {
    const paginas = [];
    for (let i = 1; i <= numeroPaginas; i++) {
      paginas.push(i);
    }
    return paginas;
  };

  // Handle input changes in form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNuevaFarmacia(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Submit new pharmacy
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/farmacias', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...nuevaFarmacia,
          latitud: parseFloat(nuevaFarmacia.latitud),
          longitud: parseFloat(nuevaFarmacia.longitud)
        })
      });

      if (!response.ok) {
        throw new Error('Error al crear farmacia');
      }

      // Reset form and close modal
      setNuevaFarmacia({
        nombre: '',
        direccion: '',
        latitud: '',
        longitud: ''
      });
      setIsModalOpen(false);
      
      // Refresh list
      fetchFarmacias();
    } catch (err) {
      console.error('Error al crear farmacia:', err);
      setError(err.message || 'Error al crear farmacia');
    }
  };

  // Render loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-600 text-xl">Cargando farmacias...</p>
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
              onClick={fetchFarmacias} 
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
          <h1 className="text-3xl font-bold text-gray-900">Catálogo de Farmacias</h1>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center space-x-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            <span>Agregar Farmacia</span>
          </button>
        </div>

        {/* Pharmacies Table */}
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {[
                  'Nombre', 
                  'Dirección', 
                  'Latitud', 
                  'Longitud', 
                  'Número de Usuarios'
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
              {farmaciasActuales.map((farmacia) => (
                <tr key={farmacia.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {farmacia.nombre}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {farmacia.direccion}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {farmacia.latitud.toFixed(4)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {farmacia.longitud.toFixed(4)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {farmacia.usuarios?.length || 0}
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

        {/* Modal for adding new pharmacy */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 m-4">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">Agregar Nueva Farmacia</h2>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {[
                  { name: 'nombre', label: 'Nombre', type: 'text', required: true },
                  { name: 'direccion', label: 'Dirección', type: 'text', required: true },
                  { name: 'latitud', label: 'Latitud', type: 'number', required: true, step: 'any' },
                  { name: 'longitud', label: 'Longitud', type: 'number', required: true, step: 'any' }
                ].map(({ name, label, type, required = false, step }) => (
                  <div key={name}>
                    <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
                      {label}
                    </label>
                    <input
                      type={type}
                      id={name}
                      name={name}
                      required={required}
                      step={step}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                      value={nuevaFarmacia[name]}
                      onChange={handleInputChange}
                    />
                  </div>
                ))}

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
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

export default Farmacias;