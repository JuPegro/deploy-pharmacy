// apps/frontend/components/admin/GestionFarmacias.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Users, Package, BarChart4, MapPin, Plus, Edit, Trash } from 'lucide-react';

const GestionFarmacias = () => {
  const [farmacias, setFarmacias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [farmaciaSeleccionada, setFarmaciaSeleccionada] = useState(null);
  const navigate = useNavigate();
  
  // Formulario para nueva farmacia
  const [formData, setFormData] = useState({
    nombre: '',
    direccion: '',
    latitud: '',
    longitud: ''
  });
  
  useEffect(() => {
    cargarFarmacias();
  }, []);
  
  const cargarFarmacias = async () => {
    try {
      setCargando(true);
      setError(null);
      
      const response = await fetch('/api/farmacias', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (!response.ok) {
        throw new Error('Error al cargar farmacias');
      }
      
      const data = await response.json();
      setFarmacias(data.data?.farmacias || []);
    } catch (err) {
      console.error('Error:', err);
      setError(err.message || 'Error al cargar farmacias');
    } finally {
      setCargando(false);
    }
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const method = farmaciaSeleccionada ? 'PUT' : 'POST';
      const url = farmaciaSeleccionada 
        ? `/api/farmacias/${farmaciaSeleccionada.id}` 
        : '/api/farmacias';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          ...formData,
          latitud: parseFloat(formData.latitud),
          longitud: parseFloat(formData.longitud)
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al guardar farmacia');
      }
      
      // Reiniciar formulario y recargar farmacias
      setFormData({
        nombre: '',
        direccion: '',
        latitud: '',
        longitud: ''
      });
      setFarmaciaSeleccionada(null);
      setMostrarFormulario(false);
      await cargarFarmacias();
    } catch (err) {
      console.error('Error:', err);
      alert(err.message || 'Error al guardar farmacia');
    }
  };
  
  const editarFarmacia = (farmacia) => {
    setFarmaciaSeleccionada(farmacia);
    setFormData({
      nombre: farmacia.nombre,
      direccion: farmacia.direccion,
      latitud: farmacia.latitud.toString(),
      longitud: farmacia.longitud.toString()
    });
    setMostrarFormulario(true);
  };
  
  const eliminarFarmacia = async (id) => {
    if (!confirm('¿Está seguro de eliminar esta farmacia? Esta acción no se puede deshacer.')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/farmacias/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al eliminar farmacia');
      }
      
      await cargarFarmacias();
    } catch (err) {
      console.error('Error:', err);
      alert(err.message || 'Error al eliminar farmacia');
    }
  };
  
  const verDetalle = (id) => {
    navigate(`/admin/farmacias/${id}`);
  };
  
  if (cargando && !mostrarFormulario) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  if (error && !mostrarFormulario) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        <div className="flex items-center">
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span>{error}</span>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Gestión de Farmacias</h1>
        <button
          onClick={() => {
            setFarmaciaSeleccionada(null);
            setFormData({
              nombre: '',
              direccion: '',
              latitud: '',
              longitud: ''
            });
            setMostrarFormulario(!mostrarFormulario);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center"
        >
          {mostrarFormulario ? 'Cancelar' : (
            <>
              <Plus className="w-5 h-5 mr-1" />
              Nueva Farmacia
            </>
          )}
        </button>
      </div>
      
      {mostrarFormulario && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-medium mb-4">
            {farmaciaSeleccionada ? 'Editar Farmacia' : 'Nueva Farmacia'}
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                <input
                  type="text"
                  name="direccion"
                  value={formData.direccion}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Latitud</label>
                <input
                  type="number"
                  step="0.000001"
                  name="latitud"
                  value={formData.latitud}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Longitud</label>
                <input
                  type="number"
                  step="0.000001"
                  name="longitud"
                  value={formData.longitud}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setMostrarFormulario(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 mr-2"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {farmaciaSeleccionada ? 'Actualizar' : 'Crear'}
              </button>
            </div>
          </form>
        </div>
      )}
      
      {!mostrarFormulario && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {farmacias.length === 0 ? (
            <div className="col-span-full bg-gray-50 p-6 text-center rounded-lg">
              <p className="text-gray-500">No hay farmacias registradas</p>
            </div>
          ) : (
            farmacias.map(farmacia => (
              <div 
                key={farmacia.id} 
                className="bg-white rounded-lg shadow overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="bg-blue-50 p-4 border-b border-blue-100">
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg font-semibold text-blue-800">{farmacia.nombre}</h3>
                    <div className="flex space-x-1">
                      <button 
                        onClick={() => editarFarmacia(farmacia)}
                        className="p-1 text-gray-500 hover:text-blue-500 rounded"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => eliminarFarmacia(farmacia.id)}
                        className="p-1 text-gray-500 hover:text-red-500 rounded"
                      >
                        <Trash className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 flex items-center mt-1">
                    <MapPin className="w-4 h-4 mr-1" />
                    {farmacia.direccion}
                  </p>
                </div>
                
                <div className="p-4">
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-gray-50 p-3 rounded">
                      <div className="flex items-center text-gray-500 text-sm mb-1">
                        <Package className="w-4 h-4 mr-1" />
                        <span>Inventario</span>
                      </div>
                      <div className="text-lg font-semibold">
                        {farmacia._count?.inventarios || 0}
                      </div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <div className="flex items-center text-gray-500 text-sm mb-1">
                        <Users className="w-4 h-4 mr-1" />
                        <span>Usuarios</span>
                      </div>
                      <div className="text-lg font-semibold">
                        {farmacia._count?.usuarios || 0}
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => verDetalle(farmacia.id)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded flex justify-center items-center"
                  >
                    <BarChart4 className="w-4 h-4 mr-1" />
                    Ver Detalle
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default GestionFarmacias;