// src/components/Reserva/ReservaDetails.jsx
import React, { useState } from 'react';
import useReservas, { ESTADO_RESERVA } from '../../hooks/useReservas';

/**
 * Detalles de Reserva
 */
export const ReservaDetails = ({ reserva, onClose, onUpdateStatus }) => {
  if (!reserva) return null;
  
  const { updateReservaStatus } = useReservas();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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

  const handleStatusChange = async (newStatus) => {
    setLoading(true);
    setError(null);
    try {
      await updateReservaStatus(reserva.id, newStatus);
      if (onUpdateStatus) {
        onUpdateStatus();
      }
      onClose();
    } catch (err) {
      setError(`Error al cambiar estado: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Detalles de Reserva</h2>
        <button 
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
      
      <div className="grid gap-4 mb-6">
        <div>
          <strong className="text-gray-700">Cliente:</strong> {reserva.nombreCliente || 'N/A'}
        </div>
        {reserva.contacto && (
          <div>
            <strong className="text-gray-700">Contacto:</strong> {reserva.contacto}
          </div>
        )}
        <div>
          <strong className="text-gray-700">Fecha de creación:</strong> {new Date(reserva.fecha).toLocaleString()}
        </div>
        {reserva.fechaRetiro && (
          <div>
            <strong className="text-gray-700">Fecha de retiro:</strong> {new Date(reserva.fechaRetiro).toLocaleDateString()}
          </div>
        )}
        <div>
          <strong className="text-gray-700">Medicamento:</strong> {reserva.medicamento?.nombre || 'N/A'}
        </div>
        <div>
          <strong className="text-gray-700">Cantidad:</strong> {reserva.cantidad || 1}
        </div>
        <div>
          <strong className="text-gray-700">Farmacia:</strong> {reserva.farmacia?.nombre || 'N/A'}
        </div>
        <div>
          <strong className="text-gray-700">Estado:</strong> 
          <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${getStatusColor(reserva.estado)}`}>
            {reserva.estado}
          </span>
        </div>
      </div>
      
      {reserva.estado === ESTADO_RESERVA.PENDIENTE && (
        <div className="flex space-x-2 mt-4">
          <button
            onClick={() => handleStatusChange(ESTADO_RESERVA.CONFIRMADA)}
            disabled={loading}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:bg-green-300"
          >
            {loading ? 'Procesando...' : 'Confirmar Reserva'}
          </button>
          <button
            onClick={() => handleStatusChange(ESTADO_RESERVA.CANCELADA)}
            disabled={loading}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 disabled:bg-red-300"
          >
            {loading ? 'Procesando...' : 'Cancelar Reserva'}
          </button>
        </div>
      )}
    </div>
  );
};