import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Corregir ícono de marcador en leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const Farmacias = () => {
  // Estado principal
  const [farmacias, setFarmacias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [farmaciaSeleccionada, setFarmaciaSeleccionada] = useState(null);
  const [showDetalleModal, setShowDetalleModal] = useState(false);
  const [accionPendiente, setAccionPendiente] = useState(false);
  
  // Estados de paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [totalFarmacias, setTotalFarmacias] = useState(0);
  const [limitePorPagina, setLimitePorPagina] = useState(10);

  // Estado para filtros
  const [filtros, setFiltros] = useState({
    busqueda: '',
    ordenarPor: 'nombre',
    ordenDireccion: 'asc'
  });

  // Formulario para nueva farmacia
  const [nuevaFarmacia, setNuevaFarmacia] = useState({
    nombre: '',
    direccion: '',
    latitud: '',
    longitud: ''
  });

  // Verificar si el usuario es admin
  const esAdmin = () => {
    const usuarioJSON = localStorage.getItem('usuario');
    if (usuarioJSON) {
      const usuario = JSON.parse(usuarioJSON);
      return usuario && usuario.rol === 'ADMIN';
    }
    return false;
  };

  // Obtener farmacias
  const fetchFarmacias = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No se encontró token de autenticación');
      }

      // Construir query params para filtros y paginación
      const queryParams = new URLSearchParams();
      queryParams.append('pagina', paginaActual);
      queryParams.append('limite', limitePorPagina);
      
      if (filtros.busqueda) queryParams.append('busqueda', filtros.busqueda);
      if (filtros.ordenarPor) queryParams.append('ordenarPor', filtros.ordenarPor);
      if (filtros.ordenDireccion) queryParams.append('ordenDireccion', filtros.ordenDireccion);

      const response = await axios.get(`/api/farmacias?${queryParams}`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data?.data?.farmacias) {
        setFarmacias(response.data.data.farmacias);
        
        // Actualizar datos de paginación
        const paginacion = response.data.data.paginacion;
        if (paginacion) {
          setTotalPaginas(paginacion.totalPaginas || 1);
          setTotalFarmacias(paginacion.totalFarmacias || 0);
          setLimitePorPagina(paginacion.limitePorPagina || 10);
        }
      } else {
        setFarmacias([]);
        setTotalPaginas(1);
      }

      setLoading(false);
    } catch (err) {
      console.error('Error al obtener farmacias:', err);
      setError(err.response?.data?.message || err.message || 'Error al cargar farmacias');
      setLoading(false);
    }
  };

  // Obtener detalle de farmacia
  const obtenerDetalleFarmacia = async (id) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.get(`/api/farmacias/${id}`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      setFarmaciaSeleccionada(response.data.data.farmacia);
      setShowDetalleModal(true);
      setLoading(false);
    } catch (err) {
      console.error('Error al obtener detalle de farmacia:', err);
      toast.error(err.response?.data?.message || 'Error al obtener detalle de farmacia');
      setLoading(false);
    }
  };

  // Cargar datos iniciales
  useEffect(() => {
    fetchFarmacias();
  }, [paginaActual, filtros]);

  // Manejar cambios en el formulario
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNuevaFarmacia(prev => ({
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
    fetchFarmacias();
  };

  // Limpiar filtros
  const limpiarFiltros = () => {
    setFiltros({
      busqueda: '',
      ordenarPor: 'nombre',
      ordenDireccion: 'asc'
    });
    setPaginaActual(1);
  };

  // Crear nueva farmacia
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validar datos
    if (!nuevaFarmacia.nombre || !nuevaFarmacia.direccion) {
      toast.error('Por favor complete nombre y dirección');
      return;
    }
    
    try {
      setAccionPendiente(true);
      const token = localStorage.getItem('token');

      // Asegurar que latitud y longitud sean números
      const datosEnvio = {
        ...nuevaFarmacia,
        latitud: parseFloat(nuevaFarmacia.latitud) || 0,
        longitud: parseFloat(nuevaFarmacia.longitud) || 0
      };

      await axios.post('/api/farmacias', datosEnvio, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // Notificación de éxito
      toast.success('Farmacia creada exitosamente');

      // Resetear formulario y cerrar modal
      setNuevaFarmacia({
        nombre: '',
        direccion: '',
        latitud: '',
        longitud: ''
      });
      setIsModalOpen(false);
      
      // Actualizar lista
      fetchFarmacias();
    } catch (err) {
      console.error('Error al crear farmacia:', err);
      toast.error(err.response?.data?.message || err.message || 'Error al crear farmacia');
    } finally {
      setAccionPendiente(false);
    }
  };

  // Actualizar farmacia
  const handleActualizar = async (e) => {
    e.preventDefault();
    
    if (!farmaciaSeleccionada || !farmaciaSeleccionada.id) {
      toast.error('Error: No hay farmacia seleccionada');
      return;
    }

    try {
      setAccionPendiente(true);
      const token = localStorage.getItem('token');

      // Asegurar que latitud y longitud sean números
      const datosEnvio = {
        nombre: farmaciaSeleccionada.nombre,
        direccion: farmaciaSeleccionada.direccion,
        latitud: parseFloat(farmaciaSeleccionada.latitud) || 0,
        longitud: parseFloat(farmaciaSeleccionada.longitud) || 0
      };

      await axios.put(`/api/farmacias/${farmaciaSeleccionada.id}`, datosEnvio, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // Notificación de éxito
      toast.success('Farmacia actualizada exitosamente');
      
      // Cerrar modal y actualizar lista
      setShowDetalleModal(false);
      fetchFarmacias();
    } catch (err) {
      console.error('Error al actualizar farmacia:', err);
      toast.error(err.response?.data?.message || err.message || 'Error al actualizar farmacia');
    } finally {
      setAccionPendiente(false);
    }
  };

  // Eliminar farmacia
  const handleEliminar = async () => {
    if (!farmaciaSeleccionada || !farmaciaSeleccionada.id) {
      toast.error('Error: No hay farmacia seleccionada');
      return;
    }

    if (!window.confirm('¿Está seguro que desea eliminar esta farmacia? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      setAccionPendiente(true);
      const token = localStorage.getItem('token');

      await axios.delete(`/api/farmacias/${farmaciaSeleccionada.id}`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // Notificación de éxito
      toast.success('Farmacia eliminada exitosamente');
      
      // Cerrar modal y actualizar lista
      setShowDetalleModal(false);
      fetchFarmacias();
    } catch (err) {
      console.error('Error al eliminar farmacia:', err);
      toast.error(err.response?.data?.message || err.message || 'Error al eliminar farmacia. Puede tener inventarios, ventas o usuarios asociados.');
    } finally {
      setAccionPendiente(false);
    }
  };

  // Cambiar página
  const cambiarPagina = (numeroPagina) => setPaginaActual(numeroPagina);

  // Estado de carga
  if (loading && !farmacias.length) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
        <p className="text-gray-600 text-xl">Cargando farmacias...</p>
      </div>
    );
  }

  // Estado de error
  if (error && !farmacias.length) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-red-50 border border-red-500 text-red-700 px-4 py-3 rounded-lg max-w-md w-full">
          <p className="text-center">{error}</p>
          <button 
            onClick={fetchFarmacias} 
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
          <h1 className="text-3xl font-bold text-gray-900">Catálogo de Farmacias</h1>
          {esAdmin() && (
            <button 
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center space-x-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              <span>Agregar Farmacia</span>
            </button>
          )}
        </div>

        {/* Filtros */}
        <div className="bg-white shadow-md rounded-lg p-4 mb-6">
          <form onSubmit={aplicarFiltros} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label htmlFor="busqueda" className="block text-sm font-medium text-gray-700 mb-1">
                Buscar
              </label>
              <input
                type="text"
                id="busqueda"
                name="busqueda"
                value={filtros.busqueda}
                onChange={handleFiltroChange}
                placeholder="Nombre o dirección..."
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              />
            </div>
            
            <div>
              <label htmlFor="ordenarPor" className="block text-sm font-medium text-gray-700 mb-1">
                Ordenar por
              </label>
              <select
                id="ordenarPor"
                name="ordenarPor"
                value={filtros.ordenarPor}
                onChange={handleFiltroChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              >
                <option value="nombre">Nombre</option>
                <option value="direccion">Dirección</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="ordenDireccion" className="block text-sm font-medium text-gray-700 mb-1">
                Dirección
              </label>
              <select
                id="ordenDireccion"
                name="ordenDireccion"
                value={filtros.ordenDireccion}
                onChange={handleFiltroChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              >
                <option value="asc">Ascendente</option>
                <option value="desc">Descendente</option>
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
            Mostrando {farmacias.length} de {totalFarmacias} farmacias.
          </p>
        </div>

        {/* Tabla de Farmacias */}
        {farmacias.length > 0 ? (
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nombre
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Dirección
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Latitud
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Longitud
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Usuarios Asociados
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Inventarios
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {farmacias.map((farmacia) => (
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
                        {farmacia._count?.usuarios || farmacia.usuarios?.length || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {farmacia._count?.inventarios || farmacia.inventarios?.length || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <button
                          onClick={() => obtenerDetalleFarmacia(farmacia.id)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          Ver detalles
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-white shadow-md rounded-lg p-6 text-center">
            <p className="text-gray-500">No hay farmacias registradas con los filtros actuales</p>
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

        {/* Modal para nueva farmacia */}
        {isModalOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
            onClick={() => setIsModalOpen(false)}
          >
            <div 
              className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 m-4 relative"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Botón de cierre */}
              <button 
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900">Agregar Nueva Farmacia</h2>
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
                      value={nuevaFarmacia[name]}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                    />
                  </div>
                ))}

                {/* Botones de Acción */}
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition"
                    disabled={accionPendiente}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition"
                    disabled={accionPendiente}
                  >
                    {accionPendiente ? 'Guardando...' : 'Guardar Farmacia'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal de detalle de farmacia */}
        {showDetalleModal && farmaciaSeleccionada && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
            onClick={() => setShowDetalleModal(false)}
          >
            <div 
              className="bg-white rounded-lg shadow-xl max-w-3xl w-full p-6 m-4 relative"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Botón de cierre */}
              <button 
                onClick={() => setShowDetalleModal(false)}
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900">Detalle de Farmacia</h2>
                <p className="text-sm text-gray-500">ID: {farmaciaSeleccionada.id}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  {esAdmin() ? (
                    <form className="space-y-4">
                      {[
                        { name: 'nombre', label: 'Nombre', type: 'text', required: true },
                        { name: 'direccion', label: 'Dirección', type: 'text', required: true },
                        { name: 'latitud', label: 'Latitud', type: 'number', required: true, step: 'any' },
                        { name: 'longitud', label: 'Longitud', type: 'number', required: true, step: 'any' }
                      ].map(({ name, label, type, required = false, step }) => (
                        <div key={name}>
                          <label htmlFor={`edit-${name}`} className="block text-sm font-medium text-gray-700 mb-1">
                            {label}
                          </label>
                          <input
                            type={type}
                            id={`edit-${name}`}
                            required={required}
                            step={step}
                            value={farmaciaSeleccionada[name] || ''}
                            onChange={(e) => setFarmaciaSeleccionada({
                              ...farmaciaSeleccionada,
                              [name]: e.target.value
                            })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                          />
                        </div>
                      ))}

                      {/* Estadísticas */}
                      <div>
                        <p className="text-sm font-medium text-gray-700">Usuarios asociados: {farmaciaSeleccionada._count?.usuarios || farmaciaSeleccionada.usuarios?.length || 0}</p>
                        <p className="text-sm font-medium text-gray-700">Inventarios: {farmaciaSeleccionada._count?.inventarios || farmaciaSeleccionada.inventarios?.length || 0}</p>
                        <p className="text-sm font-medium text-gray-700">Ventas: {farmaciaSeleccionada._count?.ventas || farmaciaSeleccionada.ventas?.length || 0}</p>
                      </div>

                      {/* Botones de acción (solo admin) */}
                      <div className="flex justify-end space-x-3 mt-6">
                        <button
                          type="button"
                          onClick={handleActualizar}
                          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition"
                          disabled={accionPendiente}
                        >
                          {accionPendiente ? 'Guardando...' : 'Guardar Cambios'}
                        </button>
                        <button
                          type="button"
                          onClick={handleEliminar}
                          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition"
                          disabled={accionPendiente}
                        >
                          Eliminar
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-medium text-gray-700">Nombre:</h3>
                        <p className="text-base">{farmaciaSeleccionada.nombre}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-700">Dirección:</h3>
                        <p className="text-base">{farmaciaSeleccionada.direccion}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-700">Latitud:</h3>
                        <p className="text-base">{farmaciaSeleccionada.latitud}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-700">Longitud:</h3>
                        <p className="text-base">{farmaciaSeleccionada.longitud}</p>
                      </div>
                      
                      {/* Estadísticas */}
                      <div>
                        <h3 className="text-sm font-medium text-gray-700">Usuarios asociados:</h3>
                        <p className="text-base">{farmaciaSeleccionada._count?.usuarios || farmaciaSeleccionada.usuarios?.length || 0}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-700">Inventarios:</h3>
                        <p className="text-base">{farmaciaSeleccionada._count?.inventarios || farmaciaSeleccionada.inventarios?.length || 0}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-700">Ventas:</h3>
                        <p className="text-base">{farmaciaSeleccionada._count?.ventas || farmaciaSeleccionada.ventas?.length || 0}</p>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Mapa */}
                <div className="h-80 rounded-lg overflow-hidden">
                  {farmaciaSeleccionada.latitud && farmaciaSeleccionada.longitud ? (
                    <MapContainer 
                      center={[farmaciaSeleccionada.latitud, farmaciaSeleccionada.longitud]} 
                      zoom={15} 
                      style={{ height: '100%', width: '100%' }}
                    >
                      <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      />
                      <Marker position={[farmaciaSeleccionada.latitud, farmaciaSeleccionada.longitud]}>
                        <Popup>
                          <strong>{farmaciaSeleccionada.nombre}</strong><br />
                          {farmaciaSeleccionada.direccion}
                        </Popup>
                      </Marker>
                    </MapContainer>
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-gray-100">
                      <p className="text-gray-500">No hay coordenadas disponibles para mostrar mapa</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Inventario y usuarios de la farmacia */}
              {farmaciaSeleccionada.inventarios && farmaciaSeleccionada.inventarios.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Inventario</h3>
                  <div className="bg-gray-50 rounded-lg p-4 max-h-60 overflow-y-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead>
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Medicamento</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Precio</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Vencimiento</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {farmaciaSeleccionada.inventarios.slice(0, 5).map((inventario) => (
                          <tr key={inventario.id} className="hover:bg-gray-100">
                            <td className="px-4 py-2 whitespace-nowrap text-sm font-medium">
                              {inventario.medicamento?.nombre || 'N/A'}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                              {inventario.stock}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                              ${parseFloat(inventario.precio).toFixed(2)}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                              {new Date(inventario.vencimiento).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {farmaciaSeleccionada.inventarios.length > 5 && (
                      <div className="text-center mt-2">
                        <p className="text-sm text-gray-500">
                          Mostrando 5 de {farmaciaSeleccionada.inventarios.length} inventarios
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {farmaciaSeleccionada.usuarios && farmaciaSeleccionada.usuarios.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Usuarios Asociados</h3>
                  <div className="bg-gray-50 rounded-lg p-4 max-h-40 overflow-y-auto">
                    <div className="flex flex-wrap gap-2">
                      {farmaciaSeleccionada.usuarios.map((usuario) => (
                        <span 
                          key={usuario.id} 
                          className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm"
                        >
                          {usuario.nombre}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Farmacias;