// src/features/reservas/components/ReservasList.jsx
import React, { useState, useEffect } from 'react';
import useReservas, { ESTADO_RESERVA } from '../../hooks/useReservas';

/**
 * Lista de Reservas
 */
export const ReservasList = () => {
  const { reservas, loading, error, setSelectedReserva, refreshReservas, updateReservaStatus } = useReservas();
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [processingId, setProcessingId] = useState(null);

  // Efecto para recargar datos periódicamente
  useEffect(() => {
    refreshReservas();
    
    // Establecer un intervalo para actualizar la lista cada minuto
    const interval = setInterval(() => {
      refreshReservas();
      setLastUpdate(new Date());
    }, 60000);
    
    return () => clearInterval(interval);
  }, [refreshReservas]);

  // Función para forzar una actualización manual
  const handleRefresh = () => {
    refreshReservas();
    setLastUpdate(new Date());
  };

  // Función para manejar cambio de estado
  const handleStatusChange = async (id, newStatus) => {
    setProcessingId(id);
    try {
      await updateReservaStatus(id, newStatus);
      refreshReservas();
    } catch (error) {
      alert(`Error al cambiar estado: ${error.message}`);
    } finally {
      setProcessingId(null);
    }
  };

  if (loading && !processingId) return <div className="p-4 text-center">Cargando reservas...</div>;
  if (error) return (
    <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded mb-4">
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
  );
  
  // Asegurar que reservas sea un array
  const reservasArray = Array.isArray(reservas) ? reservas : [];

  // Función para obtener color según estado
  const getStatusColor = (estado) => {
    switch (estado) {
      case ESTADO_RESERVA.PENDIENTE:
        return 'bg-yellow-100 text-yellow-800';
      case ESTADO_RESERVA.CONFIRMADA:
        return 'bg-green-100 text-green-800';
      case ESTADO_RESERVA.CANCELADA:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="flex justify-between items-center p-4 border-b">
        <h3 className="text-lg font-semibold">Reservas de Medicamentos</h3>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">
            Última actualización: {lastUpdate.toLocaleTimeString()}
          </span>
          <button 
            onClick={handleRefresh}
            className="p-2 text-blue-600 hover:text-blue-800"
            title="Actualizar lista"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>
      
      <table className="w-full">
        <thead>
          <tr className="bg-gray-100 border-b">
            <th className="p-3 text-left">Cliente</th>
            <th className="p-3 text-left">Fecha</th>
            <th className="p-3 text-left">Medicamento</th>
            <th className="p-3 text-left">Cantidad</th>
            <th className="p-3 text-left">Farmacia</th>
            <th className="p-3 text-left">Estado</th>
            <th className="p-3 text-left">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {reservasArray.length === 0 ? (
            <tr>
              <td colSpan="7" className="p-4 text-center text-gray-500">
                No hay reservas registradas
              </td>
            </tr>
          ) : (
            reservasArray.map((reserva) => (
              <tr key={reserva.id} className="border-b hover:bg-gray-50">
                <td className="p-3">{reserva.nombreCliente || 'Cliente'}</td>
                <td className="p-3">{new Date(reserva.fecha).toLocaleDateString()}</td>
                <td className="p-3">{reserva.medicamento?.nombre || 'N/A'}</td>
                <td className="p-3">{reserva.cantidad || 1}</td>
                <td className="p-3">{reserva.farmacia?.nombre || 'N/A'}</td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(reserva.estado)}`}>
                    {reserva.estado}
                  </span>
                </td>
                <td className="p-3">
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => setSelectedReserva(reserva)}
                      className="text-blue-500 hover:text-blue-700"
                    >
                      Detalles
                    </button>
                    
                    {reserva.estado === ESTADO_RESERVA.PENDIENTE && (
                      <>
                        <button 
                          onClick={() => handleStatusChange(reserva.id, ESTADO_RESERVA.CONFIRMADA)}
                          className="text-green-500 hover:text-green-700"
                          disabled={processingId === reserva.id}
                        >
                          Confirmar
                        </button>
                        <button 
                          onClick={() => handleStatusChange(reserva.id, ESTADO_RESERVA.CANCELADA)}
                          className="text-red-500 hover:text-red-700"
                          disabled={processingId === reserva.id}
                        >
                          Cancelar
                        </button>
                      </>
                    )}
                    
                    {processingId === reserva.id && (
                      <span className="text-gray-500 italic">Procesando...</span>
                    )}
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};