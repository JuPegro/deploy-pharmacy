// apps/frontend/components/common/FarmaciaSelector.js
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { ChevronDown, Building2 } from 'lucide-react';

const FarmaciaSelector = () => {
  const { user, actualizarUsuario } = useAuth();
  const [mostrarOpciones, setMostrarOpciones] = useState(false);
  const [cargando, setCargando] = useState(false);
  const selectorRef = useRef(null);
  
  // Cerrar el menú al hacer clic fuera de él
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectorRef.current && !selectorRef.current.contains(event.target)) {
        setMostrarOpciones(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  const seleccionarFarmacia = async (farmaciaId) => {
    try {
      setCargando(true);
      
      const response = await fetch('/api/auth/seleccionar-farmacia', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ farmaciaId })
      });
      
      if (!response.ok) {
        throw new Error('Error al seleccionar farmacia');
      }
      
      const data = await response.json();
      
      // Actualizar el estado del usuario en el contexto
      if (actualizarUsuario) {
        actualizarUsuario({
          ...user,
          farmaciaActivaId: farmaciaId,
          farmaciaActiva: user.farmacias.find(f => f.id === farmaciaId)
        });
      }
      
      setMostrarOpciones(false);
    } catch (error) {
      console.error('Error:', error);
      alert('No se pudo seleccionar la farmacia');
    } finally {
      setCargando(false);
    }
  };
  
  // Si no es usuario de farmacia o no tiene farmacias asignadas
  if (user?.rol !== 'FARMACIA' || !user?.farmacias || user.farmacias.length === 0) {
    return null;
  }
  
  const farmaciaActiva = user.farmaciaActiva || user.farmacias.find(f => f.id === user.farmaciaActivaId);
  
  return (
    <div className="relative" ref={selectorRef}>
      <button
        className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        onClick={() => setMostrarOpciones(!mostrarOpciones)}
        disabled={cargando}
      >
        <Building2 className="w-5 h-5 mr-2 text-indigo-500" />
        <span className="mr-2">
          {farmaciaActiva ? farmaciaActiva.nombre : 'Seleccionar farmacia'}
        </span>
        {cargando ? (
          <svg className="w-4 h-4 ml-1 animate-spin" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        ) : (
          <ChevronDown className={`w-4 h-4 ml-1 transition-transform duration-200 ${mostrarOpciones ? 'transform rotate-180' : ''}`} />
        )}
      </button>
      
      {mostrarOpciones && (
        <div className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="py-1">
            {user.farmacias.map(farmacia => (
              <button
                key={farmacia.id}
                className={`block w-full text-left px-4 py-2 text-sm ${
                  farmacia.id === user.farmaciaActivaId 
                    ? 'bg-gray-100 text-gray-900 font-medium' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                onClick={() => seleccionarFarmacia(farmacia.id)}
              >
                {farmacia.nombre}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FarmaciaSelector;