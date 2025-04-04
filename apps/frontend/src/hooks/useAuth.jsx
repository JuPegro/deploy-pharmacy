// apps/frontend/hooks/useAuth.js
import { useState, useEffect, useContext, createContext } from 'react';

// Crear contexto de autenticación
const AuthContext = createContext(null);

// Proveedor de autenticación
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cargar usuario al iniciar
  useEffect(() => {
    const iniciarSesion = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Verificar si hay un token en localStorage
        const token = localStorage.getItem('token');
        
        if (!token) {
          setUser(null);
          setLoading(false);
          return;
        }
        
        // Obtener información del usuario con el token
        const response = await fetch('/api/auth/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) {
          // Si el token no es válido, limpiar localStorage
          if (response.status === 401) {
            localStorage.removeItem('token');
          }
          throw new Error('Error al obtener información del usuario');
        }
        
        const data = await response.json();
        setUser(data.data?.usuario || null);
      } catch (err) {
        console.error('Error de autenticación:', err);
        setError(err.message);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    
    iniciarSesion();
  }, []);
  
  // Función para iniciar sesión
  const login = async (email, password) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al iniciar sesión');
      }
      
      const data = await response.json();
      
      // Guardar token en localStorage
      localStorage.setItem('token', data.data?.token);
      
      // Obtener información del usuario
      await obtenerInfoUsuario();
      
      return true;
    } catch (err) {
      console.error('Error al iniciar sesión:', err);
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  // Función para cerrar sesión
  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };
  
  // Obtener información del usuario
  const obtenerInfoUsuario = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setUser(null);
        return;
      }
      
      const response = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
        }
        throw new Error('Error al obtener información del usuario');
      }
      
      const data = await response.json();
      setUser(data.data?.usuario || null);
    } catch (err) {
      console.error('Error al obtener información del usuario:', err);
      setUser(null);
      throw err;
    }
  };
  
  // Función para cambiar la farmacia activa
  const cambiarFarmaciaActiva = async (farmaciaId) => {
    try {
      const response = await fetch('/api/usuarios/farmacia-activa', {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}` 
        },
        body: JSON.stringify({ farmaciaId })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al cambiar farmacia activa');
      }
      
      // Actualizar información del usuario
      await obtenerInfoUsuario();
      
      return true;
    } catch (err) {
      console.error('Error al cambiar farmacia activa:', err);
      throw err;
    }
  };
  
  // Verificar si el usuario tiene un rol específico
  const tieneRol = (rol) => {
    if (!user || !user.roles) return false;
    return user.roles.some(r => r.nombre === rol);
  };
  
  // Verificar si el usuario tiene permiso para una acción
  const tienePermiso = (permiso) => {
    if (!user || !user.permisos) return false;
    return user.permisos.includes(permiso);
  };
  
  // Valores a exponer en el contexto
  const value = {
    user,
    loading,
    error,
    login,
    logout,
    obtenerInfoUsuario,
    cambiarFarmaciaActiva,
    tieneRol,
    tienePermiso,
    isAuthenticated: !!user
  };
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook para usar el contexto de autenticación
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
}

export default useAuth;