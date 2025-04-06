import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const Inventarios = () => {
  // Estados del componente
  const [inventarios, setInventarios] = useState([]);
  const [farmacias, setFarmacias] = useState([]);
  const [medicamentos, setMedicamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showAjusteModal, setShowAjusteModal] = useState(false);
  const [inventarioSeleccionado, setInventarioSeleccionado] = useState(null);
  const [accionPendiente, setAccionPendiente] = useState(false);

  // Estado para nuevo inventario
  const [nuevoInventario, setNuevoInventario] = useState({
    farmaciaId: '',
    medicamentoId: '',
    stock: '',
    stockMinimo: '10',
    precio: '',
    vencimiento: ''
  });

  // Estado para ajuste de stock
  const [ajusteStock, setAjusteStock] = useState({
    cantidad: '',
    tipoMovimiento: 'INGRESO'
  });

  // Estado de paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [totalInventarios, setTotalInventarios] = useState(0);
  const [limitePorPagina, setLimitePorPagina] = useState(10);

  // Estado de filtros
  const [filtros, setFiltros] = useState({
    farmaciaId: '',
    medicamentoId: '',
    bajoStock: false
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

  // Obtener ID de farmacia activa del usuario actual
  const obtenerFarmaciaActiva = () => {
    const usuarioJSON = localStorage.getItem('usuario');
    if (usuarioJSON) {
      const usuario = JSON.parse(usuarioJSON);
      return usuario.farmaciaActivaId || '';
    }
    return '';
  };

  // Función para obtener datos
  const fetchDatos = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No se encontró token de autenticación');
      }

      // Preparar headers comunes
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // Construir query params para filtros de inventario
      const queryParams = new URLSearchParams();
      queryParams.append('pagina', paginaActual);
      queryParams.append('limite', limitePorPagina);
      
      // Si el usuario no es admin, forzar el uso de su farmacia activa
      const farmaciaActiva = obtenerFarmaciaActiva();
      if (!esAdmin() && farmaciaActiva) {
        queryParams.append('farmaciaId', farmaciaActiva);
      } else if (filtros.farmaciaId) {
        queryParams.append('farmaciaId', filtros.farmaciaId);
      }

      if (filtros.medicamentoId) queryParams.append('medicamentoId', filtros.medicamentoId);
      if (filtros.bajoStock) queryParams.append('bajoStock', 'true');

      // Solicitudes en paralelo
      const [
        inventariosResponse, 
        farmaciasResponse, 
        medicamentosResponse
      ] = await Promise.all([
        axios.get(`/api/inventarios?${queryParams}`, { headers }),
        axios.get('/api/farmacias', { headers }),
        axios.get('/api/medicamentos', { headers })
      ]);

      // Procesar respuesta de inventarios
      if (inventariosResponse.data?.data?.inventarios) {
        setInventarios(inventariosResponse.data.data.inventarios);
        
        // Actualizar datos de paginación
        const paginacion = inventariosResponse.data.data.paginacion;
        if (paginacion) {
          setTotalPaginas(paginacion.totalPaginas || 1);
          setTotalInventarios(paginacion.totalInventarios || 0);
          setLimitePorPagina(paginacion.limitePorPagina || 10);
        }
      } else {
        setInventarios([]);
        setTotalPaginas(1);
      }

      // Procesar farmacias y medicamentos
      setFarmacias(farmaciasResponse.data?.data?.farmacias || []);
      setMedicamentos(medicamentosResponse.data?.data?.medicamentos || []);

      setLoading(false);
    } catch (err) {
      console.error('Error al obtener datos:', err);
      setError(err.response?.data?.message || err.message || 'Error desconocido al cargar datos');
      setLoading(false);
    }
  };

  // Efecto para cargar datos al inicio y cuando cambian los filtros o la paginación
  useEffect(() => {
    fetchDatos();
  }, [paginaActual, filtros]);

  // Efecto para establecer la farmacia activa al cargar
  useEffect(() => {
    const farmaciaActiva = obtenerFarmaciaActiva();
    if (farmaciaActiva && !esAdmin()) {
      setFiltros(prev => ({
        ...prev,
        farmaciaId: farmaciaActiva
      }));
    }
  }, []);

  // Manejar cambios en el formulario de filtros
  const handleFiltroChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setFiltros(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
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
    const farmaciaActiva = obtenerFarmaciaActiva();
    
    setFiltros({
      farmaciaId: !esAdmin() && farmaciaActiva ? farmaciaActiva : '',
      medicamentoId: '',
      bajoStock: false
    });
    
    setPaginaActual(1);
  };

  // Manejar cambios en el formulario de nuevo inventario
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    setNuevoInventario(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Manejar cambios en el formulario de ajuste de stock
  const handleAjusteChange = (e) => {
    const { name, value } = e.target;
    
    setAjusteStock(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Enviar nuevo inventario
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setAccionPendiente(true);
      const token = localStorage.getItem('token');
      
      const datosInventario = {
        farmaciaId: nuevoInventario.farmaciaId,
        medicamentoId: nuevoInventario.medicamentoId,
        stock: parseInt(nuevoInventario.stock),
        stockMinimo: parseInt(nuevoInventario.stockMinimo),
        precio: parseFloat(nuevoInventario.precio),
        vencimiento: new Date(nuevoInventario.vencimiento).toISOString()
      };

      await axios.post('/api/inventarios', datosInventario, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // Notificación de éxito
      toast.success('Inventario creado exitosamente');

      // Resetear formulario y cerrar modal
      setNuevoInventario({
        farmaciaId: '',
        medicamentoId: '',
        stock: '',
        stockMinimo: '10',
        precio: '',
        vencimiento: ''
      });
      setIsModalOpen(false);
      
      // Actualizar lista
      fetchDatos();
    } catch (err) {
      console.error('Error al crear inventario:', err);
      toast.error(err.response?.data?.message || err.message || 'Error al crear inventario');
    } finally {
      setAccionPendiente(false);
    }
  };

  // Abrir modal de ajuste de stock
  const abrirModalAjuste = (inventario) => {
    setInventarioSeleccionado(inventario);
    setAjusteStock({
      cantidad: '',
      tipoMovimiento: 'INGRESO'
    });
    setShowAjusteModal(true);
  };

  // Realizar ajuste de stock
  const realizarAjusteStock = async (e) => {
    e.preventDefault();
    
    if (!inventarioSeleccionado) {
      toast.error('No hay inventario seleccionado');
      return;
    }
    
    const cantidad = parseInt(ajusteStock.cantidad);
    if (isNaN(cantidad) || cantidad <= 0) {
      toast.error('La cantidad debe ser un número mayor a cero');
      return;
    }
    
    // Validar que el stock sea suficiente para una salida
    if (ajusteStock.tipoMovimiento === 'SALIDA' && cantidad > inventarioSeleccionado.stock) {
      toast.error('No hay suficiente stock disponible para esta salida');
      return;
    }
    
    try {
      setAccionPendiente(true);
      const token = localStorage.getItem('token');
      
      await axios.patch(`/api/inventarios/${inventarioSeleccionado.id}/stock`, {
        cantidad,
        tipoMovimiento: ajusteStock.tipoMovimiento
      }, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Notificación de éxito
      toast.success(`Stock ${ajusteStock.tipoMovimiento === 'INGRESO' ? 'incrementado' : 'reducido'} exitosamente`);
      
      // Cerrar modal y actualizar datos
      setShowAjusteModal(false);
      fetchDatos();
    } catch (err) {
      console.error('Error al ajustar stock:', err);
      toast.error(err.response?.data?.message || err.message || 'Error al ajustar stock');
    } finally {
      setAccionPendiente(false);
    }
  };

  // Formatear precio
  const formatearPrecio = (precio) => {
    if (typeof precio === 'number') {
      return precio.toFixed(2);
    } else if (typeof precio === 'string' && !isNaN(parseFloat(precio))) {
      return parseFloat(precio).toFixed(2);
    }
    return 'N/A';
  };

  // Cambiar página
  const cambiarPagina = (numeroPagina) => setPaginaActual(numeroPagina);

  // Estado de carga
  if (loading && !inventarios.length) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
        <p className="text-gray-600 text-xl">Cargando inventarios...</p>
      </div>
    );
  }

  // Estado de error
  if (error && !inventarios.length) {
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
          <h1 className="text-3xl font-bold text-gray-900">Inventario</h1>
          {esAdmin() && (
            <button 
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center space-x-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              <span>Agregar Inventario</span>
            </button>
          )}
        </div>

        {/* Filtros */}
        <div className="bg-white shadow-md rounded-lg p-4 mb-6">
          <form onSubmit={aplicarFiltros} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {esAdmin() && (
              <div>
                <label htmlFor="farmaciaId" className="block text-sm font-medium text-gray-700 mb-1">
                  Farmacia
                </label>
                <select
                  id="farmaciaId"
                  name="farmaciaId"
                  value={filtros.farmaciaId}
                  onChange={handleFiltroChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                >
                  <option value="">Todas las farmacias</option>
                  {farmacias.map(farmacia => (
                    <option key={farmacia.id} value={farmacia.id}>
                      {farmacia.nombre}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            <div>
              <label htmlFor="medicamentoId" className="block text-sm font-medium text-gray-700 mb-1">
                Medicamento
              </label>
              <select
                id="medicamentoId"
                name="medicamentoId"
                value={filtros.medicamentoId}
                onChange={handleFiltroChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              >
                <option value="">Todos los medicamentos</option>
                {medicamentos.map(medicamento => (
                  <option key={medicamento.id} value={medicamento.id}>
                    {medicamento.nombre}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="bajoStock"
                name="bajoStock"
                checked={filtros.bajoStock}
                onChange={handleFiltroChange}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="bajoStock" className="ml-2 block text-sm text-gray-900">
                Mostrar solo bajo stock
              </label>
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
            Mostrando {inventarios.length} de {totalInventarios} inventarios.
          </p>
        </div>

        {/* Tabla de Inventarios */}
        {inventarios.length > 0 ? (
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Farmacia
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Medicamento
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stock
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stock Mínimo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Precio
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vencimiento
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {inventarios.map((inventario) => (
                    <tr key={inventario.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {inventario.farmacia?.nombre || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {inventario.medicamento?.nombre || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 py-1 rounded-full ${
                          inventario.stock <= inventario.stockMinimo 
                            ? 'bg-red-100 text-red-800' 
                            : inventario.stock <= inventario.stockMinimo * 1.5
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-green-100 text-green-800'
                        }`}>
                          {inventario.stock}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {inventario.stockMinimo}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${formatearPrecio(inventario.precio)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {inventario.vencimiento 
                          ? new Date(inventario.vencimiento).toLocaleDateString() 
                          : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <button
                          onClick={() => abrirModalAjuste(inventario)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          Ajustar Stock
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
            <p className="text-gray-500">No hay inventarios disponibles con los filtros actuales</p>
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

        {/* Modal para agregar inventario */}
        {isModalOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
            onClick={() => setIsModalOpen(false)}
          >
            <div 
              className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 m-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">Agregar Nuevo Inventario</h2>
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
                      Precio
                    </label>
                    <input
                      type="number"
                      id="precio"
                      name="precio"
                      min="0"
                      step="0.01"
                      required
                      value={nuevoInventario.precio}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
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
                    {accionPendiente ? 'Guardando...' : 'Guardar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal para ajuste de stock */}
        {showAjusteModal && inventarioSeleccionado && (
          <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
          onClick={() => setShowAjusteModal(false)}
        >
          <div 
            className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 m-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Ajustar Stock</h2>
              <button 
                onClick={() => setShowAjusteModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600">Medicamento: <span className="font-medium text-gray-800">{inventarioSeleccionado.medicamento?.nombre}</span></p>
              <p className="text-sm text-gray-600">Stock actual: <span className="font-medium text-gray-800">{inventarioSeleccionado.stock}</span></p>
              <p className="text-sm text-gray-600">Farmacia: <span className="font-medium text-gray-800">{inventarioSeleccionado.farmacia?.nombre}</span></p>
            </div>

            <form onSubmit={realizarAjusteStock} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
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
                    value={ajusteStock.cantidad}
                    onChange={handleAjusteChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                  />
                </div>
                <div>
                  <label htmlFor="tipoMovimiento" className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Movimiento
                  </label>
                  <select
                    id="tipoMovimiento"
                    name="tipoMovimiento"
                    required
                    value={ajusteStock.tipoMovimiento}
                    onChange={handleAjusteChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                  >
                    <option value="INGRESO">Ingreso (Aumentar)</option>
                    <option value="SALIDA">Salida (Disminuir)</option>
                    <option value="AJUSTE">Ajuste (Establecer)</option>
                  </select>
                </div>
              </div>

              {ajusteStock.tipoMovimiento === 'SALIDA' && parseInt(ajusteStock.cantidad || 0) > inventarioSeleccionado.stock && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-yellow-700">
                        La cantidad especificada excede el stock disponible.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Botones de Acción */}
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAjusteModal(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition"
                  disabled={accionPendiente}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition"
                  disabled={accionPendiente || (ajusteStock.tipoMovimiento === 'SALIDA' && parseInt(ajusteStock.cantidad || 0) > inventarioSeleccionado.stock)}
                >
                  {accionPendiente ? 'Procesando...' : 'Confirmar Ajuste'}
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