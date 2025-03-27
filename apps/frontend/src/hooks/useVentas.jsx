// src/hooks/useVentas.js
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const useVentas = () => {
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedVenta, setSelectedVenta] = useState(null);
  const [reload, setReload] = useState(0); // Cambiado a número para forzar actualizaciones

  // Obtener headers con token de autenticación
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };
  };

  // Función mejorada para cargar todas las ventas
  const fetchVentas = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No hay token de autenticación. Por favor inicie sesión nuevamente.');
      }
      
      console.log('Cargando ventas...');
      const response = await axios.get('/api/ventas', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Respuesta completa de ventas:', response);
      
      // Extraer el array de ventas de la respuesta
      let ventasData = [];
      
      if (response.data && response.data.status === 'success') {
        if (Array.isArray(response.data.data)) {
          ventasData = response.data.data;
        } else if (response.data.data && typeof response.data.data === 'object') {
          // Buscar arrays dentro del objeto data
          const possibleArrays = Object.values(response.data.data).filter(val => Array.isArray(val));
          if (possibleArrays.length > 0) {
            ventasData = possibleArrays[0];
          }
        }
      } else if (Array.isArray(response.data)) {
        // Si la respuesta es directamente un array
        ventasData = response.data;
      } else if (response.data && typeof response.data === 'object') {
        // Buscar arrays en la respuesta
        const possibleArrays = Object.values(response.data).filter(val => Array.isArray(val));
        if (possibleArrays.length > 0) {
          ventasData = possibleArrays[0];
        }
      }
      
      console.log('Ventas extraídas:', ventasData);
      setVentas(ventasData);
    } catch (err) {
      console.error('Error al cargar ventas:', err);
      setError(err.response?.data?.message || 'Error al cargar ventas');
      setVentas([]); // Inicializar con array vacío en caso de error
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar ventas al montar el componente o cuando se solicite una recarga
  useEffect(() => {
    console.log('Efecto de carga activado, reload:', reload);
    fetchVentas();
  }, [fetchVentas, reload]);

  // Función mejorada para crear una nueva venta
  const createVenta = async (ventaData) => {
    setLoading(true);
    setError(null);
    try {
      // Verificar autenticación
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No hay token de autenticación. Por favor inicie sesión nuevamente.');
      }
      
      // Eliminar campos que no existen en el modelo
      const { total, clienteNombre, ...validData } = ventaData;
      
      // Asegurar que los tipos de datos sean correctos
      const formattedData = {
        ...validData,
        medicamentoId: String(ventaData.medicamentoId),
        farmaciaId: String(ventaData.farmaciaId),
        cantidad: parseInt(ventaData.cantidad, 10)
      };
      
      console.log('Datos formateados para enviar:', formattedData);
      
      // Usar axios directamente para tener más control
      const response = await axios.post('/api/ventas', formattedData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Respuesta de creación de venta:', response);
      
      if (response.data && response.data.status === 'success') {
        // Recargar la lista de ventas inmediatamente
        console.log('Venta creada exitosamente, actualizando lista...');
        refreshVentas();
        return response.data.data;
      } else {
        throw new Error('Respuesta inválida del servidor');
      }
    } catch (err) {
      console.error('Error detallado al crear venta:', err);
      
      const errorMessage = err.response?.data?.message || err.message || 'Error al crear venta';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Función para eliminar una venta
  const deleteVenta = async (ventaId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.delete(`/api/ventas/${ventaId}`, getAuthHeaders());
      if (response.data && response.data.status === 'success') {
        // Recargar la lista de ventas
        refreshVentas();
        return true;
      } else {
        throw new Error('Respuesta inválida del servidor');
      }
    } catch (err) {
      console.error('Error al eliminar venta:', err);
      setError(err.response?.data?.message || 'Error al eliminar venta');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Función para actualizar una venta
  const updateVenta = async (ventaId, ventaData) => {
    setLoading(true);
    setError(null);
    try {
      // Eliminar campos que no existen en el modelo
      const { total, clienteNombre, ...validData } = ventaData;
      
      // Asegurar que los tipos de datos sean correctos
      const formattedData = {
        ...validData,
        medicamentoId: validData.medicamentoId && String(validData.medicamentoId),
        farmaciaId: validData.farmaciaId && String(validData.farmaciaId),
        cantidad: validData.cantidad !== undefined ? parseInt(validData.cantidad, 10) : undefined
      };
      
      const response = await axios.put(`/api/ventas/${ventaId}`, formattedData, getAuthHeaders());
      if (response.data && response.data.status === 'success') {
        // Recargar la lista de ventas
        refreshVentas();
        return response.data.data;
      } else {
        throw new Error('Respuesta inválida del servidor');
      }
    } catch (err) {
      console.error('Error al actualizar venta:', err);
      setError(err.response?.data?.message || 'Error al actualizar venta');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Función para refrescar la lista de ventas
  const refreshVentas = useCallback(() => {
    // Incrementar el contador de reload para forzar una recarga
    setReload(prev => prev + 1);
  }, []);

  return {
    ventas,
    loading,
    error,
    selectedVenta,
    setSelectedVenta,
    createVenta,
    deleteVenta,
    updateVenta,
    refreshVentas,
    fetchVentas // Exportar la función directamente para uso externo
  };
};

export default useVentas;