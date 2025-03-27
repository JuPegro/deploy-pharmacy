
// src/hooks/useDevoluciones.js
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const useDevoluciones = () => {
  const [devoluciones, setDevoluciones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedDevolucion, setSelectedDevolucion] = useState(null);
  const [reload, setReload] = useState(0); // Contador para forzar actualizaciones

  // Obtener headers con token de autenticación
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };
  };

  // Función para cargar todas las devoluciones
  const fetchDevoluciones = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No hay token de autenticación. Por favor inicie sesión nuevamente.');
      }
      
      console.log('Cargando devoluciones...');
      const response = await axios.get('/api/devoluciones', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Respuesta completa de devoluciones:', response);
      
      // Extraer el array de devoluciones de la respuesta
      let devolucionesData = [];
      
      if (response.data && response.data.status === 'success') {
        if (response.data.data && response.data.data.devoluciones && Array.isArray(response.data.data.devoluciones)) {
          devolucionesData = response.data.data.devoluciones;
        } else if (Array.isArray(response.data.data)) {
          devolucionesData = response.data.data;
        } else if (response.data.data && typeof response.data.data === 'object') {
          // Buscar arrays dentro del objeto data
          const possibleArrays = Object.values(response.data.data).filter(val => Array.isArray(val));
          if (possibleArrays.length > 0) {
            devolucionesData = possibleArrays[0];
          }
        }
      } else if (Array.isArray(response.data)) {
        // Si la respuesta es directamente un array
        devolucionesData = response.data;
      } else if (response.data && typeof response.data === 'object') {
        // Buscar arrays en la respuesta
        const possibleArrays = Object.values(response.data).filter(val => Array.isArray(val));
        if (possibleArrays.length > 0) {
          devolucionesData = possibleArrays[0];
        }
      }
      
      console.log('Devoluciones extraídas:', devolucionesData);
      setDevoluciones(devolucionesData);
    } catch (err) {
      console.error('Error al cargar devoluciones:', err);
      setError(err.response?.data?.message || 'Error al cargar devoluciones');
      setDevoluciones([]); // Inicializar con array vacío en caso de error
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar devoluciones al montar el componente o cuando se solicite una recarga
  useEffect(() => {
    console.log('Efecto de carga activado, reload:', reload);
    fetchDevoluciones();
  }, [fetchDevoluciones, reload]);

  // Función para crear una nueva devolución
  const createDevolucion = async (devolucionData) => {
    setLoading(true);
    setError(null);
    try {
      // Verificar autenticación
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No hay token de autenticación. Por favor inicie sesión nuevamente.');
      }
      
      // Asegurar que los tipos de datos sean correctos
      const formattedData = {
        ...devolucionData,
        medicamentoId: String(devolucionData.medicamentoId),
        farmaciaId: String(devolucionData.farmaciaId),
        cantidad: parseInt(devolucionData.cantidad, 10)
      };
      
      console.log('Datos formateados para enviar:', formattedData);
      
      // Usar axios directamente para tener más control
      const response = await axios.post('/api/devoluciones', formattedData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Respuesta de creación de devolución:', response);
      
      if (response.data && response.data.status === 'success') {
        // Recargar la lista de devoluciones inmediatamente
        console.log('Devolución creada exitosamente, actualizando lista...');
        refreshDevoluciones();
        return response.data.data.devolucion;
      } else {
        throw new Error('Respuesta inválida del servidor');
      }
    } catch (err) {
      console.error('Error detallado al crear devolución:', err);
      
      const errorMessage = err.response?.data?.message || err.message || 'Error al crear devolución';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Función para obtener una devolución específica
  const getDevolucion = async (id) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`/api/devoluciones/${id}`, getAuthHeaders());
      
      if (response.data && response.data.status === 'success') {
        return response.data.data.devolucion;
      } else {
        throw new Error('Respuesta inválida del servidor');
      }
    } catch (err) {
      console.error(`Error al obtener devolución con ID ${id}:`, err);
      setError(err.response?.data?.message || `Error al obtener devolución con ID ${id}`);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Función para refrescar la lista de devoluciones
  const refreshDevoluciones = useCallback(() => {
    // Incrementar el contador de reload para forzar una recarga
    setReload(prev => prev + 1);
  }, []);

  return {
    devoluciones,
    loading,
    error,
    selectedDevolucion,
    setSelectedDevolucion,
    createDevolucion,
    getDevolucion,
    refreshDevoluciones,
    fetchDevoluciones // Exportar la función directamente para uso externo
  };
};

export default useDevoluciones;