// src/pages/Reservas/ReservasPage.jsx
import React, { useEffect } from 'react';
import useReservas from '../../hooks/useReservas';
import { ReservasList, CrearReservaModal, ReservaDetails } from '../../components/Reserva/ReservasComponents';

/**
 * Página principal de gestión de reservas
 */
const ReservasPage = () => {
  const { selectedReserva, setSelectedReserva, refreshReservas } = useReservas();

  // Forzar una carga inicial de datos cuando se monta el componente
  useEffect(() => {
    refreshReservas();
  }, [refreshReservas]);
  
  // Función para actualizar cuando se cambia el estado desde el modal
  const handleUpdateAfterStatusChange = () => {
    refreshReservas();
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Gestión de Reservas</h1>
          <p className="text-gray-600 mt-1">Administra reservas de medicamentos para tus clientes</p>
        </div>
        <CrearReservaModal />
      </div>

      <div className="mb-6">
        <ReservasList />
      </div>

      {selectedReserva && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
          <div className="bg-white p-6 rounded-lg w-full max-w-lg">
            <ReservaDetails 
              reserva={selectedReserva} 
              onClose={() => setSelectedReserva(null)} 
              onUpdateStatus={handleUpdateAfterStatusChange}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ReservasPage;