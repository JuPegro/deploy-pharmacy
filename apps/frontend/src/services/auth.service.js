// src/services/auth.service.js
import axios from 'axios';

const API_URL = '/api/auth';

// Configuración por defecto de axios
axios.defaults.headers.post['Content-Type'] = 'application/json';

// Interceptor para agregar el token a las solicitudes
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

// Interceptor para manejar errores de autenticación
axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      // Token expirado o inválido
      console.log('Error de autenticación:', error.response.data);
      // Redirigir al login si es necesario
      // window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Servicio de autenticación
class AuthService {
  // Iniciar sesión
  async login(email, password) {
    try {
      const response = await axios.post(`${API_URL}/login`, { email, password });
      if (response.data && response.data.status === 'success') {
        this.setUserData(response.data.data);
        return response.data.data;
      }
      throw new Error('Respuesta inválida del servidor');
    } catch (error) {
      console.error('Error en login:', error);
      throw error;
    }
  }

  // Iniciar sesión con la API de prueba
  async loginTest(email, password) {
    const response = await axios.post(`${API_URL}/login-test`, { email, password });
    if (response.data && response.data.status === 'success') {
      this.setUserData(response.data.data);
      return response.data.data;
    }
    throw new Error('Respuesta inválida del servidor de prueba');
  }

  // Obtener datos del usuario actual
  async getCurrentUser() {
    try {
      const response = await axios.get(`${API_URL}/me`);
      return response.data.data.usuario;
    } catch (error) {
      console.error('Error al obtener usuario actual:', error);
      return null;
    }
  }

  // Cerrar sesión
  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  // Guardar datos del usuario y token
  setUserData(data) {
    if (data.token) {
      localStorage.setItem('token', data.token);
      const usuario = data.usuario || data.user || {};
      localStorage.setItem('user', JSON.stringify(usuario));
    }
  }

  // Verificar si el usuario está autenticado
  isAuthenticated() {
    return !!localStorage.getItem('token');
  }
}

export default new AuthService();