// src/features/devoluciones/components/DevolucionesComponents.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import useDevoluciones from '../../hooks/useDevoluciones';

/**
 * Lista de Devoluciones
 */
export const DevolucionesList = () => {
  const { devoluciones, loading, error, setSelectedDevolucion, refreshDevoluciones } = useDevoluciones();
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Efecto para recargar datos periódicamente
  useEffect(() => {
    refreshDevoluciones();
    
    // Establecer un intervalo para actualizar la lista cada 60 segundos
    const interval = setInterval(() => {
      refreshDevoluciones();
      setLastUpdate(new Date());
    }, 60000);
    
    return () => clearInterval(interval);
  }, [refreshDevoluciones]);

  // Función para forzar una actualización manual
  const handleRefresh = () => {
    refreshDevoluciones();
    setLastUpdate(new Date());
  };

  if (loading) return <div className="p-4 text-center">Cargando devoluciones...</div>;
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
  
  // Asegurar que devoluciones sea un array
  const devolucionesArray = Array.isArray(devoluciones) ? devoluciones : [];

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="flex justify-between items-center p-4 border-b">
        <h3 className="text-lg font-semibold">Historial de Devoluciones</h3>
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
            <th className="p-3 text-left">Fecha</th>
            <th className="p-3 text-left">Medicamento</th>
            <th className="p-3 text-left">Cantidad</th>
            <th className="p-3 text-left">Farmacia</th>
            <th className="p-3 text-left">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {devolucionesArray.length === 0 ? (
            <tr>
              <td colSpan="5" className="p-4 text-center text-gray-500">
                No hay devoluciones registradas
              </td>
            </tr>
          ) : (
            devolucionesArray.map((devolucion) => (
              <tr key={devolucion.id} className="border-b hover:bg-gray-50">
                <td className="p-3">{new Date(devolucion.fecha).toLocaleDateString()}</td>
                <td className="p-3">{devolucion.medicamento?.nombre || 'N/A'}</td>
                <td className="p-3">{devolucion.cantidad}</td>
                <td className="p-3">{devolucion.farmacia?.nombre || 'N/A'}</td>
                <td className="p-3">
                  <button 
                    onClick={() => setSelectedDevolucion(devolucion)}
                    className="text-blue-500 hover:text-blue-700"
                  >
                    Ver Detalles
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

/**
 * Modal para Crear Devolución
 */
export const CrearDevolucionModal = () => {
  const { createDevolucion, refreshDevoluciones } = useDevoluciones();
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    medicamentoId: '',
    farmaciaId: '',
    cantidad: '',
    motivo: ''  // Este campo puede variar según el modelo de prisma
  });
  const [medicamentos, setMedicamentos] = useState([]);
  const [farmacias, setFarmacias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Función para cargar datos al abrir el modal
  const handleOpenModal = () => {
    setIsOpen(true);
    setLoading(true);
    setError('');
    
    // Cargar datos necesarios
    Promise.all([fetchMedicamentos(), fetchFarmacias()])
      .finally(() => setLoading(false));
  };

  // Cargar medicamentos
  const fetchMedicamentos = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/medicamentos', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('Respuesta de medicamentos completa:', response.data);
      
      // Extraer el array de medicamentos
      let medicinesList = [];
      const medicinesData = response.data;
      
      if (medicinesData && Array.isArray(medicinesData)) {
        medicinesList = medicinesData;
      } else if (medicinesData && typeof medicinesData === 'object') {
        if (medicinesData.data && Array.isArray(medicinesData.data)) {
          medicinesList = medicinesData.data;
        } else if (medicinesData.data && typeof medicinesData.data === 'object') {
          const possibleArrays = Object.values(medicinesData.data).filter(val => Array.isArray(val));
          if (possibleArrays.length > 0) {
            medicinesList = possibleArrays[0];
          }
        } else {
          const possibleArrays = Object.values(medicinesData).filter(val => Array.isArray(val));
          if (possibleArrays.length > 0) {
            medicinesList = possibleArrays[0];
          }
        }
      }
      
      console.log('Medicamentos extraídos:', medicinesList);
      setMedicamentos(medicinesList);
    } catch (err) {
      console.error('Error al cargar medicamentos:', err);
      setError('No se pudieron cargar los medicamentos');
      setMedicamentos([]);
    }
  };

  // Cargar farmacias
  const fetchFarmacias = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/farmacias', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('Respuesta de farmacias completa:', response.data);
      
      // Extraer el array de farmacias
      let pharmaciesList = [];
      const pharmaciesData = response.data;
      
      if (pharmaciesData && Array.isArray(pharmaciesData)) {
        pharmaciesList = pharmaciesData;
      } else if (pharmaciesData && typeof pharmaciesData === 'object') {
        if (pharmaciesData.data && Array.isArray(pharmaciesData.data)) {
          pharmaciesList = pharmaciesData.data;
        } else if (pharmaciesData.data && typeof pharmaciesData.data === 'object') {
          const possibleArrays = Object.values(pharmaciesData.data).filter(val => Array.isArray(val));
          if (possibleArrays.length > 0) {
            pharmaciesList = possibleArrays[0];
          }
        } else {
          const possibleArrays = Object.values(pharmaciesData).filter(val => Array.isArray(val));
          if (possibleArrays.length > 0) {
            pharmaciesList = possibleArrays[0];
          }
        }
      }
      
      console.log('Farmacias extraídas:', pharmaciesList);
      setFarmacias(pharmaciesList);
    } catch (err) {
      console.error('Error al cargar farmacias:', err);
      setError('No se pudieron cargar las farmacias');
      setFarmacias([]);
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
    setLoading(true);
    setError('');
    
    try {
      // Validar la cantidad
      const cantidad = parseInt(formData.cantidad, 10);
      if (isNaN(cantidad) || cantidad <= 0) {
        throw new Error('La cantidad debe ser un número positivo');
      }
      
      // Verificar IDs
      if (!formData.medicamentoId) {
        throw new Error('Debe seleccionar un medicamento');
      }
      
      if (!formData.farmaciaId) {
        throw new Error('Debe seleccionar una farmacia');
      }
      
      // Crear el objeto de datos para la devolución
      const devolucionData = {
        medicamentoId: formData.medicamentoId,
        farmaciaId: formData.farmaciaId,
        cantidad,
        motivo: formData.motivo || 'Sin motivo especificado'
      };
      
      console.log('Datos de devolución a enviar:', devolucionData);
      
      // Llamar al servicio para crear la devolución
      await createDevolucion(devolucionData);
      
      // Limpiar formulario y cerrar modal
      setFormData({
        medicamentoId: '',
        farmaciaId: '',
        cantidad: '',
        motivo: ''
      });
      setIsOpen(false);
      
      // Forzar actualización de la lista de devoluciones
      refreshDevoluciones();
      
      // Mostrar mensaje de éxito
      alert('Devolución registrada exitosamente');
    } catch (error) {
      console.error('Error al crear devolución:', error);
      setError(error.message || 'Error al registrar la devolución');
    } finally {
      setLoading(false);
    }
  };

  // Asegurar arrays válidos
  const medicamentosArray = Array.isArray(medicamentos) ? medicamentos : [];
  const farmaciasArray = Array.isArray(farmacias) ? farmacias : [];

  return (
    <div>
      <button 
        onClick={handleOpenModal}
        className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
      >
        Registrar Devolución
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Registrar Devolución</h2>
            
            {loading ? (
              <div className="text-center py-4">Cargando datos...</div>
            ) : error ? (
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
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block mb-2">Medicamento</label>
                  <select
                    name="medicamentoId"
                    value={formData.medicamentoId}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                    required
                  >
                    <option value="">Seleccionar medicamento</option>
                    {medicamentosArray.map(med => (
                      <option key={med.id} value={med.id}>
                        {med.nombre}
                      </option>
                    ))}
                  </select>
                  <div className="text-sm text-gray-500 mt-1">
                    {medicamentosArray.length === 0 ? 'No hay medicamentos disponibles' : `${medicamentosArray.length} medicamentos cargados`}
                  </div>
                </div>

                <div>
                  <label className="block mb-2">Farmacia</label>
                  <select
                    name="farmaciaId"
                    value={formData.farmaciaId}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                    required
                  >
                    <option value="">Seleccionar farmacia</option>
                    {farmaciasArray.map(farm => (
                      <option key={farm.id} value={farm.id}>
                        {farm.nombre}
                      </option>
                    ))}
                  </select>
                  <div className="text-sm text-gray-500 mt-1">
                    {farmaciasArray.length === 0 ? 'No hay farmacias disponibles' : `${farmaciasArray.length} farmacias cargadas`}
                  </div>
                </div>

                <div>
                  <label className="block mb-2">Cantidad</label>
                  <input
                    type="number"
                    name="cantidad"
                    value={formData.cantidad}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                    required
                    min="1"
                  />
                </div>

                <div>
                  <label className="block mb-2">Motivo</label>
                  <textarea
                    name="motivo"
                    value={formData.motivo}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded"
                    rows="3"
                    placeholder="Explique el motivo de la devolución"
                  />
                </div>

                <div className="flex justify-between">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className={`${loading ? 'bg-purple-400' : 'bg-purple-500 hover:bg-purple-600'} text-white px-4 py-2 rounded`}
                  >
                    {loading ? 'Procesando...' : 'Registrar Devolución'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Detalles de Devolución
 */
export const DevolucionDetails = ({ devolucion, onClose }) => {
  if (!devolucion) return null;

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Detalles de Devolución</h2>
        <button 
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="grid gap-4">
        <div>
          <strong>Fecha:</strong> {new Date(devolucion.fecha).toLocaleString()}
        </div>
        <div>
          <strong>Medicamento:</strong> {devolucion.medicamento?.nombre || 'N/A'}
        </div>
        <div>
          <strong>Cantidad:</strong> {devolucion.cantidad}
        </div>
        <div>
          <strong>Farmacia:</strong> {devolucion.farmacia?.nombre || 'N/A'}
        </div>
        {devolucion.motivo && (
          <div>
            <strong>Motivo:</strong> {devolucion.motivo}
          </div>
        )}
      </div>
    </div>
  );
};

export default {
  DevolucionesList,
  CrearDevolucionModal,
  DevolucionDetails
};