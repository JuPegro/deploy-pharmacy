// src/pages/Inventory/InventoryMovementsService.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Este componente está mal estructurado - debería ser un componente funcional, no una clase utilizada como componente
// Vamos a convertirlo en un componente React funcional adecuado

const InventoryMovementsPage = () => {
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMovements();
  }, []);

  const fetchMovements = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/movimientos');
      if (response.data && response.data.status === 'success') {
        // Asegurar que estamos obteniendo un array de movimientos
        const movementsData = Array.isArray(response.data.data) 
          ? response.data.data 
          : response.data.data?.movimientos || [];
        
        setMovements(movementsData);
      } else {
        throw new Error('Respuesta inválida del servidor');
      }
    } catch (err) {
      console.error('Error al cargar movimientos de inventario:', err);
      setError(err.message || 'Error al cargar movimientos de inventario');
    } finally {
      setLoading(false);
    }
  };

  const createMovement = async (movementData) => {
    setLoading(true);
    try {
      const response = await axios.post('/api/movimientos', movementData);
      if (response.data && response.data.status === 'success') {
        // Recargar la lista de movimientos
        fetchMovements();
        return response.data.data;
      } else {
        throw new Error('Respuesta inválida del servidor');
      }
    } catch (err) {
      console.error('Error al crear movimiento:', err);
      setError(err.message || 'Error al crear movimiento');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Movimientos de Inventario</h1>
      
      {loading && <div className="text-center py-4">Cargando movimientos...</div>}
      
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      <div className="bg-white shadow rounded-lg p-6">
        {/* Aquí puedes agregar un formulario para crear movimientos */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-4">Registrar Nuevo Movimiento</h2>
          {/* Formulario para agregar movimientos */}
        </div>
        
        {/* Tabla de movimientos */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Historial de Movimientos</h2>
          <table className="w-full">
            <thead>
              <tr className="bg-gray-100 border-b">
                <th className="p-3 text-left">Fecha</th>
                <th className="p-3 text-left">Tipo</th>
                <th className="p-3 text-left">Medicamento</th>
                <th className="p-3 text-left">Cantidad</th>
                <th className="p-3 text-left">Farmacia</th>
                <th className="p-3 text-left">Motivo</th>
              </tr>
            </thead>
            <tbody>
              {movements.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-4 text-center text-gray-500">
                    No hay movimientos de inventario registrados
                  </td>
                </tr>
              ) : (
                movements.map((movement) => (
                  <tr key={movement.id} className="border-b hover:bg-gray-50">
                    <td className="p-3">{new Date(movement.fecha).toLocaleDateString()}</td>
                    <td className="p-3">{movement.tipo}</td>
                    <td className="p-3">{movement.medicamento?.nombre || 'N/A'}</td>
                    <td className="p-3">{movement.cantidad}</td>
                    <td className="p-3">{movement.farmacia?.nombre || 'N/A'}</td>
                    <td className="p-3">{movement.motivo || 'N/A'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default InventoryMovementsPage;