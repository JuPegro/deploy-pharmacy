// apps/frontend/src/contexts/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

// Crear el contexto de autenticación
const AuthContext = createContext();

// Hook personalizado para usar el contexto de autenticación
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
};

// Proveedor del contexto de autenticación
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Comprobar si hay un token almacenado al cargar la aplicación
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Si hay un token, obtener la información del usuario
      getMe(token);
    } else {
      setLoading(false);
    }
  }, []);

  // Función para obtener datos del usuario actual
  const getMe = async (token) => {
    try {
      setLoading(true);
      setError(null);
      
      // Configurar el token en los headers
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Obtener la información del usuario
      const response = await axios.get('/api/auth/me');
      
      if (response.data && response.data.data && response.data.data.usuario) {
        setUser(response.data.data.usuario);
      } else {
        // Si no hay datos de usuario válidos, limpiar
        logout();
      }
    } catch (err) {
      console.error('Error al obtener datos del usuario:', err);
      setError('Error al cargar información del usuario');
      logout();
    } finally {
      setLoading(false);
    }
  };

  // Función para iniciar sesión
  const login = async (email, password) => {
    try {
      setLoading(true);
      setError(null);
      
      // Llamar al endpoint de login
      const response = await axios.post('/api/auth/login', { email, password });
      
      // Verificar respuesta
      if (response.data && response.data.data && response.data.data.token) {
        // Guardar el token en localStorage
        localStorage.setItem('token', response.data.data.token);
        
        // Configurar el token en los headers para futuras peticiones
        axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.data.token}`;
        
        // Guardar información del usuario en el estado
        setUser(response.data.data.usuario);
        
        return true;
      } else {
        throw new Error('Respuesta del servidor inválida');
      }
    } catch (err) {
      console.error('Error en login:', err);
      setError(err.response?.data?.message || 'Error al iniciar sesión');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Función para cerrar sesión
  const logout = () => {
    // Eliminar el token del localStorage
    localStorage.removeItem('token');
    
    // Limpiar el token de los headers
    delete axios.defaults.headers.common['Authorization'];
    
    // Limpiar el estado del usuario
    setUser(null);
  };

  // Función para seleccionar una farmacia activa
  const seleccionarFarmaciaActiva = async (farmaciaId) => {
    try {
      setLoading(true);
      setError(null);
      
      // Llamar al endpoint para seleccionar farmacia activa
      const response = await axios.post('/api/auth/seleccionar-farmacia', { farmaciaId });
      
      // Actualizar el usuario con la farmacia activa
      if (response.data && response.data.data && response.data.data.usuario) {
        setUser(response.data.data.usuario);
        return true;
      } else {
        throw new Error('Respuesta del servidor inválida');
      }
    } catch (err) {
      console.error('Error al seleccionar farmacia:', err);
      setError(err.response?.data?.message || 'Error al seleccionar farmacia');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Valores que se proporcionarán a través del contexto
  const value = {
    user,
    loading,
    error,
    login,
    logout,
    seleccionarFarmaciaActiva
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;