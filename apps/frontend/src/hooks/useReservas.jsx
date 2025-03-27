// src/hooks/useReservas.js
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

// Constantes para estados de reserva
export const ESTADO_RESERVA = {
  PENDIENTE: 'PENDIENTE',
  CONFIRMADA: 'CONFIRMADA',
  CANCELADA: 'CANCELADA'
};

// Clave para almacenamiento local de datos adicionales
const CLIENT_DATA_KEY = 'reservas_client_data';

const useReservas = () => {
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedReserva, setSelectedReserva] = useState(null);
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

  // Función para almacenar datos adicionales que no están en BD
  const saveClientData = (id, clientData) => {
    try {
      const existingData = JSON.parse(localStorage.getItem(CLIENT_DATA_KEY) || '{}');
      existingData[id] = clientData;
      localStorage.setItem(CLIENT_DATA_KEY, JSON.stringify(existingData));
    } catch (err) {
      console.error('Error guardando datos de cliente:', err);
    }
  };

  // Función para obtener datos adicionales
  const getClientData = (id) => {
    try {
      const existingData = JSON.parse(localStorage.getItem(CLIENT_DATA_KEY) || '{}');
      return existingData[id] || {};
    } catch (err) {
      console.error('Error obteniendo datos de cliente:', err);
      return {};
    }
  };

  // Función para cargar todas las reservas
  const fetchReservas = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No hay token de autenticación. Por favor inicie sesión nuevamente.');
      }
      
      console.log('Cargando reservas...');
      const response = await axios.get('/api/reservas', getAuthHeaders());
      
      console.log('Respuesta completa de reservas:', response);
      
      // Extraer el array de reservas de la respuesta
      let reservasData = [];
      
      if (response.data && response.data.status === 'success') {
        if (response.data.data && response.data.data.reservas && Array.isArray(response.data.data.reservas)) {
          reservasData = response.data.data.reservas;
        } else if (Array.isArray(response.data.data)) {
          reservasData = response.data.data;
        } else if (response.data.data && typeof response.data.data === 'object') {
          // Buscar arrays dentro del objeto data
          const possibleArrays = Object.values(response.data.data).filter(val => Array.isArray(val));
          if (possibleArrays.length > 0) {
            reservasData = possibleArrays[0];
          }
        }
      } else if (Array.isArray(response.data)) {
        // Si la respuesta es directamente un array
        reservasData = response.data;
      } else if (response.data && typeof response.data === 'object') {
        // Buscar arrays en la respuesta
        const possibleArrays = Object.values(response.data).filter(val => Array.isArray(val));
        if (possibleArrays.length > 0) {
          reservasData = possibleArrays[0];
        }
      }
      
      // Agregar datos de cliente almacenados localmente
      const reservasConDatos = reservasData.map(reserva => {
        const clientData = getClientData(reserva.id);
        return {
          ...reserva,
          cantidad: clientData.cantidad || 1,
          nombreCliente: clientData.nombreCliente || 'Cliente',
          contacto: clientData.contacto || '',
          fechaRetiro: clientData.fechaRetiro || null
        };
      });
      
      console.log('Reservas enriquecidas con datos locales:', reservasConDatos);
      setReservas(reservasConDatos);
    } catch (err) {
      console.error('Error al cargar reservas:', err);
      setError(err.response?.data?.message || err.message || 'Error al cargar reservas');
      setReservas([]); // Inicializar con array vacío en caso de error
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar reservas al montar el componente o cuando se solicite una recarga
  useEffect(() => {
    console.log('Efecto de carga activado, reload:', reload);
    fetchReservas();
  }, [fetchReservas, reload]);

  // Función para crear una nueva reserva
  const createReserva = async (reservaData) => {
    setLoading(true);
    setError(null);
    try {
      // Verificar autenticación
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No hay token de autenticación. Por favor inicie sesión nuevamente.');
      }
      
      // Extraer solo los campos que existen en el esquema
      const formattedData = {
        medicamentoId: String(reservaData.medicamentoId),
        farmaciaId: String(reservaData.farmaciaId),
        estado: reservaData.estado || ESTADO_RESERVA.PENDIENTE
      };
      
      console.log('Datos a enviar al servidor:', formattedData);
      
      // Usar axios directamente para tener más control
      const response = await axios.post('/api/reservas', formattedData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Respuesta de creación de reserva:', response);
      
      if (response.data && (response.data.status === 'success' || response.data.id)) {
        // Obtener ID de la nueva reserva creada
        const nuevaReserva = response.data.data?.reserva || response.data;
        const nuevaReservaId = nuevaReserva.id;
        
        if (!nuevaReservaId) {
          throw new Error('No se pudo obtener el ID de la reserva creada');
        }
        
        // Guardar datos adicionales localmente
        const clientData = {
          cantidad: parseInt(reservaData.cantidad, 10) || 1,
          nombreCliente: reservaData.nombreCliente || 'Cliente',
          contacto: reservaData.contacto || '',
          fechaRetiro: reservaData.fechaRetiro || null
        };
        
        saveClientData(nuevaReservaId, clientData);
        
        // Recargar la lista de reservas
        console.log('Reserva creada exitosamente, recargando lista...');
        refreshReservas();
        
        return {
          ...nuevaReserva,
          ...clientData
        };
      } else {
        throw new Error('Respuesta inválida del servidor');
      }
    } catch (err) {
      console.error('Error detallado al crear reserva:', err);
      
      const errorMessage = err.response?.data?.message || err.message || 'Error al crear reserva';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Función para obtener una reserva específica
  const getReserva = async (id) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`/api/reservas/${id}`, getAuthHeaders());
      
      let reserva = null;
      if (response.data && response.data.status === 'success') {
        reserva = response.data.data.reserva;
      } else if (response.data && response.data.id) {
        reserva = response.data;
      } else {
        throw new Error('Formato de respuesta inválido');
      }
      
      // Agregar datos locales
      const clientData = getClientData(id);
      return {
        ...reserva,
        cantidad: clientData.cantidad || 1,
        nombreCliente: clientData.nombreCliente || 'Cliente',
        contacto: clientData.contacto || '',
        fechaRetiro: clientData.fechaRetiro || null
      };
    } catch (err) {
      console.error(`Error al obtener reserva con ID ${id}:`, err);
      setError(err.response?.data?.message || err.message || `Error al obtener reserva con ID ${id}`);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Función para actualizar el estado de una reserva
  const updateReservaStatus = async (id, estado) => {
    setLoading(true);
    setError(null);
    
    try {
      // Validar que el estado sea válido
      if (!Object.values(ESTADO_RESERVA).includes(estado)) {
        throw new Error(`Estado no válido. Valores permitidos: ${Object.values(ESTADO_RESERVA).join(', ')}`);
      }
      
      const response = await axios.patch(
        `/api/reservas/${id}/estado`, 
        { estado },
        getAuthHeaders()
      );
      
      let reservaActualizada = null;
      if (response.data && response.data.status === 'success') {
        reservaActualizada = response.data.data.reserva;
      } else if (response.data && response.data.id) {
        reservaActualizada = response.data;
      } else {
        throw new Error('Formato de respuesta inválido');
      }
      
      // Mantener los datos adicionales almacenados
      const clientData = getClientData(id);
      const reservaCompleta = {
        ...reservaActualizada,
        cantidad: clientData.cantidad || 1,
        nombreCliente: clientData.nombreCliente || 'Cliente',
        contacto: clientData.contacto || '',
        fechaRetiro: clientData.fechaRetiro || null
      };
      
      // Recargar la lista de reservas
      refreshReservas();
      
      return reservaCompleta;
    } catch (err) {
      console.error(`Error al actualizar estado de reserva ${id}:`, err);
      setError(err.response?.data?.message || err.message || 'Error al actualizar estado de la reserva');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Función para refrescar la lista de reservas
  const refreshReservas = useCallback(() => {
    // Incrementar el contador de reload para forzar una recarga
    setReload(prev => prev + 1);
  }, []);

  return {
    reservas,
    loading,
    error,
    selectedReserva,
    setSelectedReserva,
    createReserva,
    getReserva,
    updateReservaStatus,
    refreshReservas,
    fetchReservas // Exportar la función directamente para uso externo
  };
};

export default useReservas;