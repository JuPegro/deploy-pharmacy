// apps/frontend/components/admin/DevolucionesPendientes.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { 
  Check, X, AlertCircle, Filter, RefreshCw, Search, 
  ChevronLeft, ChevronRight, Calendar, Building2
} from 'lucide-react';

const DevolucionesPendientes = () => {
  const [devoluciones, setDevoluciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [paginaActual, setPaginaActual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [filtros, setFiltros] = useState({
    farmaciaId: '',
    fechaInicio: '',
    fechaFin: '',
    estado: 'PENDIENTE'
  });
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [farmacias, setFarmacias] = useState([]);
  
  useEffect(() => {
    cargarDevoluciones();
    cargarFarmacias();
  }, [paginaActual, filtros]);
  
  const cargarDevoluciones = async () => {
    try {
      setCargando(true);
      setError(null);
      
      // Construir URL con parámetros
      let url = `/api/devoluciones?pagina=${paginaActual}&limite=10`;
      
      if (filtros.farmaciaId) url += `&farmaciaId=${filtros.farmaciaId}`;
      if (filtros.fechaInicio) url += `&fechaInicio=${filtros.fechaInicio}`;
      if (filtros.fechaFin) url += `&fechaFin=${filtros.fechaFin}`;
      if (filtros.estado) url += `&estado=${filtros.estado}`;
      
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (!response.ok) {
        throw new Error('Error al cargar devoluciones');
      }
      
      const data = await response.json();
      
      setDevoluciones(data.data?.devoluciones || []);
      setTotalPaginas(data.data?.paginacion?.totalPaginas || 1);
    } catch (err) {
      console.error('Error:', err);
      setError(err.message || 'Error al cargar devoluciones');
    } finally {
      setCargando(false);
    }
  };
  
  const cargarFarmacias = async () => {
    try {
      const response = await fetch('/api/farmacias', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (!response.ok) {
        throw new Error('Error al cargar farmacias');
      }
      
      const data = await response.json();
      setFarmacias(data.data?.farmacias || []);
    } catch (err) {
      console.error('Error al cargar farmacias:', err);
    }
  };
  
  const aprobarDevolucion = async (id) => {
    try {
      setCargando(true);
      
      const response = await fetch(`/api/devoluciones/${id}/aprobar`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al aprobar devolución');
      }
      
      // Recargar devoluciones
      await cargarDevoluciones();
    } catch (err) {
      console.error('Error:', err);
      alert(err.message || 'Error al aprobar devolución');
      setCargando(false);
    }
  };
  
  const rechazarDevolucion = async (id) => {
    try {
      setCargando(true);
      
      const response = await fetch(`/api/devoluciones/${id}/rechazar`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al rechazar devolución');
      }
      
      // Recargar devoluciones
      await cargarDevoluciones();
    } catch (err) {
      console.error('Error:', err);
      alert(err.message || 'Error al rechazar devolución');
      setCargando(false);
    }
  };
  
  const cambiarPagina = (pagina) => {
    if (pagina < 1 || pagina > totalPaginas) return;
    setPaginaActual(pagina);
  };
  
  const handleFiltroChange = (e) => {
    const { name, value } = e.target;
    setFiltros(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const aplicarFiltros = () => {
    setPaginaActual(1); // Resetear a página 1 cuando se aplica un filtro
  };
  
  const limpiarFiltros = () => {
    setFiltros({
      farmaciaId: '',
      fechaInicio: '',
      fechaFin: '',
      estado: 'PENDIENTE'
    });
    setPaginaActual(1);
  };
  
  const formatoFecha = (fechaString) => {
    const fecha = new Date(fechaString);
    return fecha.toLocaleDateString('es-DO', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  if (cargando && devoluciones.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  if (error && devoluciones.length === 0) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        <div className="flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          <span>{error}</span>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Devoluciones Pendientes</h1>
        <div className="flex space-x-2">
          <button
            onClick={() => setMostrarFiltros(!mostrarFiltros)}
            className="bg-white border border-gray-300 rounded-md p-2 text-gray-600 hover:bg-gray-50"
            title="Filtrar"
          >
            <Filter className="w-5 h-5" />
          </button>
          <button
            onClick={cargarDevoluciones}
            className="bg-white border border-gray-300 rounded-md p-2 text-gray-600 hover:bg-gray-50"
            disabled={cargando}
            title="Actualizar"
          >
            <RefreshCw className={`w-5 h-5 ${cargando ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>
      
      {mostrarFiltros && (
        <div className="bg-white shadow rounded-lg p-4 mb-6">
          <h2 className="text-lg font-medium mb-3">Filtros</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Farmacia</label>
              <select
                name="farmaciaId"
                value={filtros.farmaciaId}
                onChange={handleFiltroChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todas</option>
                {farmacias.map(farmacia => (
                  <option key={farmacia.id} value={farmacia.id}>
                    {farmacia.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Inicio</label>
              <input
                type="date"
                name="fechaInicio"
                value={filtros.fechaInicio}
                onChange={handleFiltroChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Fin</label>
              <input
                type="date"
                name="fechaFin"
                value={filtros.fechaFin}
                onChange={handleFiltroChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
              <select
                name="estado"
                value={filtros.estado}
                onChange={handleFiltroChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="PENDIENTE">Pendiente</option>
                <option value="APROBADA">Aprobada</option>
                <option value="RECHAZADA">Rechazada</option>
                <option value="">Todos</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end mt-4 gap-2">
            <button
              onClick={limpiarFiltros}
              className="px-4 py-2 text-sm border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Limpiar
            </button>
            <button
              onClick={aplicarFiltros}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Aplicar
            </button>
          </div>
        </div>
      )}
      
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {devoluciones.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">No se encontraron devoluciones con los filtros aplicados</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Código
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Farmacia
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Medicamento
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cantidad
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Motivo
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {devoluciones.map((devolucion) => (
                    <tr key={devolucion.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {devolucion.id.slice(0, 8)}...
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <Building2 className="w-4 h-4 mr-1 text-gray-400" />
                          {devolucion.farmacia.nombre}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {devolucion.inventario.medicamento.nombre}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {devolucion.cantidad}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {devolucion.motivo}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1 text-gray-400" />
                          {formatoFecha(devolucion.fecha)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          devolucion.estado === 'PENDIENTE' 
                            ? 'bg-yellow-100 text-yellow-800' 
                            : devolucion.estado === 'APROBADA'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                        }`}>
                          {devolucion.estado === 'PENDIENTE' 
                            ? 'Pendiente' 
                            : devolucion.estado === 'APROBADA'
                              ? 'Aprobada'
                              : 'Rechazada'
                          }
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {devolucion.estado === 'PENDIENTE' && (
                          <div className="flex space-x-2 justify-end">
                            <button
                              onClick={() => aprobarDevolucion(devolucion.id)}
                              className="text-green-600 hover:text-green-900"
                              title="Aprobar"
                            >
                              <Check className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => rechazarDevolucion(devolucion.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Rechazar"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Paginación */}
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => cambiarPagina(paginaActual - 1)}
                  disabled={paginaActual === 1}
                  className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                    paginaActual === 1 
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Anterior
                </button>
                <button
                  onClick={() => cambiarPagina(paginaActual + 1)}
                  disabled={paginaActual === totalPaginas}
                  className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                    paginaActual === totalPaginas 
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Siguiente
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Mostrando <span className="font-medium">{devoluciones.length}</span> resultados
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => cambiarPagina(paginaActual - 1)}
                      disabled={paginaActual === 1}
                      className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                        paginaActual === 1 
                          ? 'text-gray-300 cursor-not-allowed' 
                          : 'text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      <span className="sr-only">Anterior</span>
                      <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                    </button>
                    
                    {/* Números de página */}
                    {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((pagina) => (
                      <button
                        key={pagina}
                        onClick={() => cambiarPagina(pagina)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          pagina === paginaActual
                            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {pagina}
                      </button>
                    ))}
                    
                    <button
                      onClick={() => cambiarPagina(paginaActual + 1)}
                      disabled={paginaActual === totalPaginas}
                      className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                        paginaActual === totalPaginas 
                          ? 'text-gray-300 cursor-not-allowed' 
                          : 'text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      <span className="sr-only">Siguiente</span>
                      <ChevronRight className="h-5 w-5" aria-hidden="true" />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DevolucionesPendientes;