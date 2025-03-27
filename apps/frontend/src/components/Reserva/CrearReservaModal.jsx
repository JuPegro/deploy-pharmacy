// Archivo: src/components/Reserva/CrearReservaModal.jsx
import React, { useState } from 'react';
import axios from 'axios';

/**
 * Modal para Crear Reserva (ADAPTADO AL MODELO DE PRISMA)
 */
export const CrearReservaModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    medicamentoId: '',
    farmaciaId: '',
    estado: 'PENDIENTE'
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

  // Cargar medicamentos con manejo mejorado
  const fetchMedicamentos = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/medicamentos', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      console.log('Respuesta medicamentos:', response.data);
      
      // Intentar extraer medicamentos de múltiples formas posibles
      let medicinesList = [];
      
      if (Array.isArray(response.data)) {
        medicinesList = response.data;
      } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
        medicinesList = response.data.data;
      } else if (response.data && typeof response.data === 'object') {
        // Búsqueda recursiva de arrays dentro del objeto
        const findArrays = (obj) => {
          for (const key in obj) {
            if (Array.isArray(obj[key]) && obj[key].length > 0 && obj[key][0].nombre) {
              return obj[key];
            } else if (typeof obj[key] === 'object' && obj[key] !== null) {
              const result = findArrays(obj[key]);
              if (result) return result;
            }
          }
          return null;
        };
        
        const foundArray = findArrays(response.data);
        if (foundArray) {
          medicinesList = foundArray;
        }
      }
      
      console.log('Medicamentos encontrados:', medicinesList);
      setMedicamentos(medicinesList);
    } catch (err) {
      console.error('Error al cargar medicamentos:', err);
      setError('No se pudieron cargar los medicamentos: ' + (err.message || 'Error desconocido'));
      setMedicamentos([]);
    }
  };

  // Cargar farmacias con manejo mejorado
  const fetchFarmacias = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/farmacias', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      console.log('Respuesta farmacias:', response.data);
      
      // Intentar extraer farmacias de múltiples formas posibles
      let pharmaciesList = [];
      
      if (Array.isArray(response.data)) {
        pharmaciesList = response.data;
      } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
        pharmaciesList = response.data.data;
      } else if (response.data && typeof response.data === 'object') {
        // Búsqueda recursiva de arrays dentro del objeto
        const findArrays = (obj) => {
          for (const key in obj) {
            if (Array.isArray(obj[key]) && obj[key].length > 0 && obj[key][0].nombre) {
              return obj[key];
            } else if (typeof obj[key] === 'object' && obj[key] !== null) {
              const result = findArrays(obj[key]);
              if (result) return result;
            }
          }
          return null;
        };
        
        const foundArray = findArrays(response.data);
        if (foundArray) {
          pharmaciesList = foundArray;
        }
      }
      
      console.log('Farmacias encontradas:', pharmaciesList);
      setFarmacias(pharmaciesList);
    } catch (err) {
      console.error('Error al cargar farmacias:', err);
      setError('No se pudieron cargar las farmacias: ' + (err.message || 'Error desconocido'));
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
      // Validar campos necesarios
      if (!formData.medicamentoId) {
        throw new Error('Debe seleccionar un medicamento');
      }
      if (!formData.farmaciaId) {
        throw new Error('Debe seleccionar una farmacia');
      }
      
      // Crear datos para enviar a la API (SOLO con los campos que existen en el modelo)
      const reservaData = {
        medicamentoId: formData.medicamentoId,
        farmaciaId: formData.farmaciaId,
        estado: 'PENDIENTE'
      };
      
      console.log('Enviando datos de reserva:', reservaData);
      
      // Enviar la solicitud
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/reservas', reservaData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Respuesta de crear reserva:', response.data);
      
      // Verificar respuesta
      if (response.status === 201 || response.status === 200) {
        // Limpiar formulario y cerrar modal
        setFormData({
          medicamentoId: '',
          farmaciaId: '',
          estado: 'PENDIENTE'
        });
        setIsOpen(false);
        
        // Mostrar mensaje de éxito
        alert('Reserva creada exitosamente');
        
        // Recargar la lista de reservas (si tienes una función para eso)
        if (typeof window.refreshReservas === 'function') {
          window.refreshReservas();
        } else {
          window.location.reload(); // Alternativa: recargar la página
        }
      } else {
        throw new Error('Error al crear la reserva');
      }
    } catch (error) {
      console.error('Error al crear reserva:', error);
      setError(error.message || 'Error al crear la reserva');
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
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        Crear Reserva
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Crear Nueva Reserva</h2>
            
            {loading ? (
              <div className="text-center py-4">Cargando datos...</div>
            ) : error ? (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block mb-2">Medicamento *</label>
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
                    {medicamentosArray.length} medicamentos cargados
                  </div>
                </div>

                <div>
                  <label className="block mb-2">Farmacia *</label>
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
                    {farmaciasArray.length} farmacias cargadas
                  </div>
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
                    className={`${loading ? 'bg-blue-400' : 'bg-blue-500 hover:bg-blue-600'} text-white px-4 py-2 rounded`}
                  >
                    {loading ? 'Procesando...' : 'Crear Reserva'}
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