// src/config/axios.js
import axios from 'axios';

// Interceptor para agregar el token a todas las solicitudes
axios.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores comunes de respuesta
axios.interceptors.response.use(
  response => response,
  error => {
    // Manejar error de autenticación (401)
    if (error.response && error.response.status === 401) {
      console.log('Error de autenticación. Redirigiendo al login...');
      
      // Opcional: redireccionar automáticamente al login
      // Si estás usando una ruta que no sea /login, cámbiala aquí
      // window.location.href = '/login';
    }
    
    // Manejar error de autorización (403)
    if (error.response && error.response.status === 403) {
      console.log('Error de autorización. No tienes permisos para realizar esta acción.');
    }
    
    // Manejar error de servidor (500)
    if (error.response && error.response.status >= 500) {
      console.log('Error del servidor. Por favor intente más tarde.');
    }
    
    return Promise.reject(error);
  }
);

export default axios;