// src/pages/Inventory/InventoryMovementsPage.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import inventoryMovementsService, { MOVIMIENTO_TIPOS } from '../../services/inventoryMovementsService';

// Listado para opciones del select
const OPCIONES_TIPO_MOVIMIENTO = [
  { value: MOVIMIENTO_TIPOS.INGRESO, label: 'Ingreso' },
  { value: MOVIMIENTO_TIPOS.SALIDA, label: 'Salida' }
];

const InventoryMovementsPage = () => {
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    tipo: MOVIMIENTO_TIPOS.INGRESO, // Usar el valor correcto del enum
    medicamentoId: '',
    farmaciaId: '',
    cantidad: ''
    // Eliminado el campo motivo ya que no existe en el modelo
  });
  const [medicamentos, setMedicamentos] = useState([]);
  const [farmacias, setFarmacias] = useState([]);
  const [formVisible, setFormVisible] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Cargar los movimientos utilizando el servicio
      const movementsData = await inventoryMovementsService.getMovements();
      setMovements(movementsData);
      
      // Cargar medicamentos y farmacias
      await fetchMedicinesAndPharmacies();
    } catch (err) {
      console.error('Error al cargar datos:', err);
      setError(err.message || 'Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const fetchMedicinesAndPharmacies = async () => {
    try {
      // Obtener el token y configurar headers
      const authConfig = getAuthHeaders();

      // Obtener medicamentos
      const medicinesResponse = await axios.get('/api/medicamentos', authConfig);
      console.log('Respuesta de medicamentos completa:', medicinesResponse.data);
      
      // Extraer el array de medicamentos
      let medicinesList = [];
      const medicinesData = medicinesResponse.data;
      
      if (medicinesData && Array.isArray(medicinesData)) {
        // Si la respuesta es directamente un array
        medicinesList = medicinesData;
      } else if (medicinesData && typeof medicinesData === 'object') {
        if (medicinesData.data && Array.isArray(medicinesData.data)) {
          // Si hay un campo data que es un array
          medicinesList = medicinesData.data;
        } else if (medicinesData.data && typeof medicinesData.data === 'object') {
          // Si hay un campo data que es un objeto, buscar arrays dentro
          const possibleArrays = Object.values(medicinesData.data).filter(val => Array.isArray(val));
          if (possibleArrays.length > 0) {
            medicinesList = possibleArrays[0];
          }
        } else {
          // Si no hay un campo data, buscar directamente en las propiedades de primer nivel
          const possibleArrays = Object.values(medicinesData).filter(val => Array.isArray(val));
          if (possibleArrays.length > 0) {
            medicinesList = possibleArrays[0];
          }
        }
      }
      
      console.log('Medicamentos extraídos:', medicinesList);
      setMedicamentos(medicinesList);
      
      // Obtener farmacias
      const pharmaciesResponse = await axios.get('/api/farmacias', authConfig);
      console.log('Respuesta de farmacias completa:', pharmaciesResponse.data);
      
      // Extraer el array de farmacias
      let pharmaciesList = [];
      const pharmaciesData = pharmaciesResponse.data;
      
      if (pharmaciesData && Array.isArray(pharmaciesData)) {
        // Si la respuesta es directamente un array
        pharmaciesList = pharmaciesData;
      } else if (pharmaciesData && typeof pharmaciesData === 'object') {
        if (pharmaciesData.data && Array.isArray(pharmaciesData.data)) {
          // Si hay un campo data que es un array
          pharmaciesList = pharmaciesData.data;
        } else if (pharmaciesData.data && typeof pharmaciesData.data === 'object') {
          // Si hay un campo data que es un objeto, buscar arrays dentro
          const possibleArrays = Object.values(pharmaciesData.data).filter(val => Array.isArray(val));
          if (possibleArrays.length > 0) {
            pharmaciesList = possibleArrays[0];
          }
        } else {
          // Si no hay un campo data, buscar directamente en las propiedades de primer nivel
          const possibleArrays = Object.values(pharmaciesData).filter(val => Array.isArray(val));
          if (possibleArrays.length > 0) {
            pharmaciesList = possibleArrays[0];
          }
        }
      }
      
      console.log('Farmacias extraídas:', pharmaciesList);
      setFarmacias(pharmaciesList);
    } catch (err) {
      console.error('Error al cargar medicamentos y farmacias:', err);
      setError('Error al cargar medicamentos y farmacias: ' + (err.response?.data?.message || err.message));
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
    setError(null);
    
    try {
      // Validar la cantidad
      const cantidad = parseInt(formData.cantidad, 10);
      if (isNaN(cantidad) || cantidad <= 0) {
        throw new Error('La cantidad debe ser un número positivo');
      }
      
      // Validar que el tipo sea uno de los valores válidos
      if (!Object.values(MOVIMIENTO_TIPOS).includes(formData.tipo)) {
        throw new Error(`Tipo de movimiento no válido: ${formData.tipo}`);
      }
      
      // Crear el objeto de datos para el movimiento
      // IMPORTANTE: No incluir el campo motivo que no existe en el modelo
      const movimientoData = {
        tipo: formData.tipo,
        medicamentoId: formData.medicamentoId,
        farmaciaId: formData.farmaciaId,
        cantidad
      };
      
      console.log('Datos que se enviarán al servidor:', movimientoData);
      
      // Verificar que los IDs son strings válidos o números
      if (!movimientoData.medicamentoId) {
        throw new Error('Debe seleccionar un medicamento');
      }
      
      if (!movimientoData.farmaciaId) {
        throw new Error('Debe seleccionar una farmacia');
      }
      
      // Usar axios directamente para tener más control sobre el proceso
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/movimientos', movimientoData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Respuesta del servidor:', response.data);
      
      // Verificar la respuesta
      if (response.data && response.data.status === 'success') {
        // Notificar éxito
        alert('Movimiento de inventario creado correctamente');
        
        // Limpiar formulario
        setFormData({
          tipo: MOVIMIENTO_TIPOS.INGRESO,
          medicamentoId: '',
          farmaciaId: '',
          cantidad: ''
        });
        
        // Ocultar formulario
        setFormVisible(false);
        
        // Refrescar datos
        fetchData();
      } else {
        throw new Error('La respuesta del servidor no indica éxito');
      }
    } catch (err) {
      console.error('Error al crear movimiento:', err);
      
      // Mostrar información detallada del error
      if (err.response) {
        // El servidor respondió con un código de error
        console.error('Datos de la respuesta de error:', err.response.data);
        console.error('Estado HTTP:', err.response.status);
        console.error('Cabeceras de respuesta:', err.response.headers);
        
        // Mostrar un mensaje más específico basado en la respuesta
        if (err.response.data && err.response.data.message) {
          setError(`Error del servidor: ${err.response.data.message}`);
        } else if (err.response.status === 500) {
          setError('Error interno del servidor. Contacte al administrador del sistema.');
        } else {
          setError(`Error HTTP ${err.response.status}: ${err.message}`);
        }
      } else if (err.request) {
        // La petición fue hecha pero no se recibió respuesta
        console.error('No se recibió respuesta del servidor:', err.request);
        setError('No se pudo conectar con el servidor. Verifique su conexión a internet.');
      } else {
        // Error en la configuración de la petición
        setError(`Error al procesar la solicitud: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Función para depuración
  const testMovementCreation = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Obtener token
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No hay token de autenticación. Por favor inicie sesión nuevamente.');
      }
      
      // 1. Primero, veamos la estructura de medicamentos y farmacias
      console.log('Medicamentos disponibles:', medicamentosArray);
      console.log('Farmacias disponibles:', farmaciasArray);
      
      // 2. Verificar si hay datos para usar
      if (medicamentosArray.length === 0 || farmaciasArray.length === 0) {
        throw new Error('No hay medicamentos o farmacias disponibles para crear un movimiento');
      }
      
      // 3. Crear datos de prueba con el primer medicamento y farmacia disponible
      const testData = {
        tipo: MOVIMIENTO_TIPOS.INGRESO,
        medicamentoId: medicamentosArray[0].id.toString(),
        farmaciaId: farmaciasArray[0].id.toString(),
        cantidad: 10
        // Eliminado el campo motivo que no existe en el modelo
      };
      
      console.log('Enviando datos de prueba:', testData);
      
      // 4. Intentar crear un movimiento
      const response = await axios.post('/api/movimientos', testData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Respuesta exitosa:', response.data);
      alert('Movimiento de prueba creado exitosamente');
      
      // 5. Refrescar datos
      fetchData();
    } catch (err) {
      console.error('Error en prueba de creación:', err);
      
      // Mostrar información detallada del error
      if (err.response) {
        console.error('Datos de error del servidor:', err.response.data);
        console.error('Estado HTTP:', err.response.status);
        
        // Tratando de obtener más información sobre el error 500
        if (err.response.status === 500 && err.response.data) {
          let errorMsg = 'Error interno del servidor';
          
          // Intentar extraer mensaje de error
          if (typeof err.response.data === 'string') {
            errorMsg += ': ' + err.response.data;
          } else if (err.response.data.message) {
            errorMsg += ': ' + err.response.data.message;
          } else if (err.response.data.error) {
            errorMsg += ': ' + (err.response.data.error.message || JSON.stringify(err.response.data.error));
          }
          
          setError(errorMsg);
        } else {
          setError(`Error HTTP ${err.response.status}: ${err.message}`);
        }
      } else {
        setError(`Error de conexión: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Asegurar arrays válidos
  const medicamentosArray = Array.isArray(medicamentos) ? medicamentos : [];
  const farmaciasArray = Array.isArray(farmacias) ? farmacias : [];
  const movementsArray = Array.isArray(movements) ? movements : [];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Movimientos de Inventario</h1>
        <div className="flex">
          <button
            onClick={() => setFormVisible(!formVisible)}
            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
          >
            {formVisible ? 'Cancelar' : 'Nuevo Movimiento'}
          </button>
          <button 
            type="button"
            onClick={testMovementCreation}
            className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 ml-2"
          >
            Probar creación
          </button>
          <button 
            type="button"
            onClick={fetchMedicinesAndPharmacies}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 ml-2"
          >
            Cargar datos
          </button>
        </div>
      </div>
      
      {loading && !formVisible && (
        <div className="text-center py-4">Cargando datos...</div>
      )}
      
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
              {error && error.includes('401') && (
                <p className="text-sm text-red-700 mt-1">
                  Tu sesión puede haber expirado. Intenta <a href="/login" className="underline">iniciar sesión</a> de nuevo.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
      
      {formVisible && (
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Registrar Nuevo Movimiento</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block mb-2">Tipo de Movimiento</label>
              <select
                name="tipo"
                value={formData.tipo}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                required
              >
                {OPCIONES_TIPO_MOVIMIENTO.map(opcion => (
                  <option key={opcion.value} value={opcion.value}>
                    {opcion.label}
                  </option>
                ))}
              </select>
            </div>

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

            {/* Se eliminó el campo motivo ya que no existe en el modelo */}

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setFormVisible(false)}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400 mr-2"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className={`${loading ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'} text-white px-4 py-2 rounded`}
              >
                {loading ? 'Guardando...' : 'Guardar Movimiento'}
              </button>
            </div>
          </form>
        </div>
      )}
      
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Historial de Movimientos</h2>
        <table className="w-full">
          <thead>
            <tr className="bg-gray-100 border-b">
              <th className="p-3 text-left">Fecha</th>
              <th className="p-3 text-left">Tipo</th>
              <th className="p-3 text-left">Medicamento</th>
              <th className="p-3 text-left">Cantidad</th>
              <th className="p-3 text-left">Farmacia</th>
            </tr>
          </thead>
          <tbody>
            {movementsArray.length === 0 ? (
              <tr>
                <td colSpan="5" className="p-4 text-center text-gray-500">
                  No hay movimientos de inventario registrados
                </td>
              </tr>
            ) : (
              movementsArray.map((movement) => (
                <tr key={movement.id} className="border-b hover:bg-gray-50">
                  <td className="p-3">{new Date(movement.fecha).toLocaleDateString()}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      movement.tipo === MOVIMIENTO_TIPOS.INGRESO ? 'bg-green-100 text-green-800' :
                      movement.tipo === MOVIMIENTO_TIPOS.SALIDA ? 'bg-red-100 text-red-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {movement.tipo}
                    </span>
                  </td>
                  <td className="p-3">{movement.medicamento?.nombre || 'N/A'}</td>
                  <td className="p-3">{movement.cantidad}</td>
                  <td className="p-3">{movement.farmacia?.nombre || 'N/A'}</td>
                  {/* Se eliminó la columna motivo ya que no existe en el modelo */}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InventoryMovementsPage;