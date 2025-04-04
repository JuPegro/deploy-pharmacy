// apps/frontend/components/admin/DetalleFarmacia.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, Users, DollarSign, BarChart4, Calendar, FileText } from 'lucide-react';
import DashboardAnalitico from '../common/DashboardAnalitico';

const DetalleFarmacia = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [farmacia, setFarmacia] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [pestañaActiva, setPestañaActiva] = useState('dashboard');
  
  useEffect(() => {
    cargarDatosFarmacia();
  }, [id]);
  
  const cargarDatosFarmacia = async () => {
    try {
      setCargando(true);
      setError(null);
      
      const response = await fetch(`/api/farmacias/${id}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (!response.ok) {
        throw new Error('Error al cargar datos de la farmacia');
      }
      
      const data = await response.json();
      setFarmacia(data.data?.farmacia || null);
    } catch (err) {
      console.error('Error:', err);
      setError(err.message || 'Error al cargar datos de la farmacia');
    } finally {
      setCargando(false);
    }
  };
  
  if (cargando) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  if (error) {
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
  
  if (!farmacia) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded">
        <div className="flex items-center">
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span>No se encontró la farmacia</span>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center mb-6">
        <button 
          onClick={() => navigate('/admin/farmacias')}
          className="mr-4 p-2 rounded-full hover:bg-gray-100"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{farmacia.nombre}</h1>
          <p className="text-gray-600">{farmacia.direccion}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4 flex items-center">
          <div className="rounded-full bg-blue-100 p-3 mr-4">
            <Package className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Inventario</p>
            <p className="text-xl font-semibold">{farmacia._count?.inventarios || 0} productos</p>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4 flex items-center">
          <div className="rounded-full bg-green-100 p-3 mr-4">
            <Users className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Usuarios</p>
            <p className="text-xl font-semibold">{farmacia._count?.usuarios || 0} asignados</p>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4 flex items-center">
          <div className="rounded-full bg-purple-100 p-3 mr-4">
            <DollarSign className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Ventas</p>
            <p className="text-xl font-semibold">{farmacia._count?.ventas || 0} registros</p>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4 flex items-center">
          <div className="rounded-full bg-yellow-100 p-3 mr-4">
            <Calendar className="w-6 h-6 text-yellow-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Última actividad</p>
            <p className="text-xl font-semibold">
              {farmacia.updatedAt 
                ? new Date(farmacia.updatedAt).toLocaleDateString() 
                : 'Sin datos'}
            </p>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              className={`py-4 px-6 font-medium text-sm border-b-2 ${
                pestañaActiva === 'dashboard'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setPestañaActiva('dashboard')}
            >
              <div className="flex items-center">
                <BarChart4 className="w-5 h-5 mr-2" />
                Dashboard
              </div>
            </button>
            <button
              className={`py-4 px-6 font-medium text-sm border-b-2 ${
                pestañaActiva === 'inventario'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setPestañaActiva('inventario')}
            >
              <div className="flex items-center">
                <Package className="w-5 h-5 mr-2" />
                Inventario
              </div>
            </button>
            <button
              className={`py-4 px-6 font-medium text-sm border-b-2 ${
                pestañaActiva === 'devoluciones'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setPestañaActiva('devoluciones')}
            >
              <div className="flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Devoluciones
              </div>
            </button>
          </nav>
        </div>
        
        <div className="p-6">
          {pestañaActiva === 'dashboard' && (
            <DashboardAnalitico modo="admin" farmaciaId={farmacia.id} />
          )}
          
          {pestañaActiva === 'inventario' && (
            <div className="text-center py-6">
              <p className="text-gray-500">
                Componente de inventario de farmacia para administrador
              </p>
              <p className="text-sm text-gray-400 mt-2">
                (Este componente mostraría una tabla con el inventario de la farmacia)
              </p>
            </div>
          )}
          
          {pestañaActiva === 'devoluciones' && (
            <div className="text-center py-6">
              <p className="text-gray-500">
                Componente de devoluciones de farmacia para administrador
              </p>
              <p className="text-sm text-gray-400 mt-2">
                (Aquí se mostrarían las devoluciones pendientes y su historial)
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DetalleFarmacia;