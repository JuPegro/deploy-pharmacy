// src/services/InventoryMovementsService.js
import axios from 'axios';

// Definir los tipos de movimiento válidos para Prisma
// Estos coinciden EXACTAMENTE con los definidos en tu schema.prisma
const MOVIMIENTO_TIPOS = {
  INGRESO: 'INGRESO',
  SALIDA: 'SALIDA'
};

class InventoryMovementsService {
  constructor() {
    this.baseUrl = '/api/movimientos';
    this.tiposValidos = MOVIMIENTO_TIPOS;
  }

  // Obtener headers con token de autenticación
  getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };
  }

  // Método para validar el tipo de movimiento
  validarTipoMovimiento(tipo) {
    // Verificar que el tipo sea uno de los valores válidos en Prisma
    if (!Object.values(this.tiposValidos).includes(tipo)) {
      throw new Error(`Tipo de movimiento "${tipo}" no válido. Los tipos válidos son: ${Object.values(this.tiposValidos).join(', ')}`);
    }
    return tipo;
  }

  // Obtener todos los movimientos
  async getMovements() {
    try {
      const response = await axios.get(this.baseUrl, this.getAuthHeaders());
      console.log('Respuesta completa de movimientos:', response.data);
      
      if (response.data && response.data.status === 'success') {
        if (Array.isArray(response.data.data)) {
          return response.data.data;
        } else if (response.data.data && typeof response.data.data === 'object') {
          // Buscar arrays dentro del objeto data
          const possibleArrays = Object.values(response.data.data).filter(val => Array.isArray(val));
          if (possibleArrays.length > 0) {
            return possibleArrays[0];
          }
          return [];
        } else {
          return [];
        }
      } else if (Array.isArray(response.data)) {
        // Si la respuesta es directamente un array
        return response.data;
      } else {
        // Buscar arrays en la respuesta
        const possibleArrays = Object.values(response.data).filter(val => Array.isArray(val));
        if (possibleArrays.length > 0) {
          return possibleArrays[0];
        }
        return [];
      }
    } catch (error) {
      console.error('Error al obtener movimientos:', error);
      // Si es un error de autenticación, mostrar mensaje específico
      if (error.response && error.response.status === 401) {
        throw new Error('No autorizado. Por favor inicie sesión nuevamente.');
      }
      throw error;
    }
  }

  // Crear un nuevo movimiento con mejor manejo de errores
  async createMovement(movementData) {
    try {
      // Validar los datos mínimos requeridos
      if (!movementData.medicamentoId) {
        throw new Error('Se requiere ID de medicamento');
      }
      
      if (!movementData.farmaciaId) {
        throw new Error('Se requiere ID de farmacia');
      }
      
      if (!movementData.cantidad || isNaN(parseInt(movementData.cantidad))) {
        throw new Error('Se requiere una cantidad válida');
      }
      
      if (!movementData.tipo) {
        throw new Error('Se requiere el tipo de movimiento');
      }
      
      // Validar que el tipo de movimiento sea válido para Prisma
      this.validarTipoMovimiento(movementData.tipo);
      
      // Eliminar el campo motivo si existe y asegurar que los IDs sean strings
      const { motivo, ...dataWithoutMotivo } = movementData;
      const formattedData = {
        ...dataWithoutMotivo,
        medicamentoId: String(movementData.medicamentoId),
        farmaciaId: String(movementData.farmaciaId),
        cantidad: parseInt(movementData.cantidad)
      };
      
      console.log('Datos de movimiento formateados (sin motivo):', formattedData);
      
      // Obtener token fresco por si acaso
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No hay token de autenticación');
      }
      
      const response = await axios.post(this.baseUrl, formattedData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Respuesta completa:', response);
      
      if (response.data && response.data.status === 'success') {
        return response.data.data;
      } else {
        throw new Error('La respuesta no indica éxito');
      }
    } catch (error) {
      console.error('Error detallado al crear movimiento:', error);
      
      // Extraer el mensaje más útil del error
      let errorMessage = 'Error al crear movimiento';
      
      if (error.response) {
        if (error.response.status === 500) {
          console.error('Datos del error 500:', error.response.data);
          
          // Intentar extraer información más detallada
          if (error.response.data && error.response.data.message) {
            errorMessage = `Error del servidor: ${error.response.data.message}`;
          } else if (error.response.data && error.response.data.error) {
            errorMessage = `Error del servidor: ${error.response.data.error}`;
          } else {
            errorMessage = 'Error interno del servidor';
          }
        } else if (error.response.status === 400) {
          errorMessage = `Datos incorrectos: ${error.response.data.message || 'Verifique los datos ingresados'}`;
        } else if (error.response.status === 401) {
          errorMessage = 'Sesión expirada. Por favor inicie sesión nuevamente.';
        } else {
          errorMessage = `Error HTTP ${error.response.status}: ${error.message}`;
        }
      } else if (error.request) {
        errorMessage = 'No se recibió respuesta del servidor. Verifique su conexión.';
      } else {
        errorMessage = error.message;
      }
      
      throw new Error(errorMessage);
    }
  }

  // Obtener un movimiento específico
  async getMovementById(id) {
    try {
      const response = await axios.get(`${this.baseUrl}/${id}`, this.getAuthHeaders());
      if (response.data && response.data.status === 'success') {
        return response.data.data;
      }
      throw new Error('Respuesta inválida del servidor');
    } catch (error) {
      console.error(`Error al obtener movimiento con ID ${id}:`, error);
      if (error.response && error.response.status === 401) {
        throw new Error('No autorizado. Por favor inicie sesión nuevamente.');
      }
      throw error;
    }
  }

  // Actualizar un movimiento existente
  async updateMovement(id, movementData) {
    try {
      // Validar el tipo de movimiento si está presente
      if (movementData.tipo) {
        this.validarTipoMovimiento(movementData.tipo);
      }
      
      // Eliminar el campo motivo si existe
      const { motivo, ...dataWithoutMotivo } = movementData;
      
      const response = await axios.put(`${this.baseUrl}/${id}`, dataWithoutMotivo, this.getAuthHeaders());
      if (response.data && response.data.status === 'success') {
        return response.data.data;
      }
      throw new Error('Respuesta inválida del servidor');
    } catch (error) {
      console.error(`Error al actualizar movimiento con ID ${id}:`, error);
      if (error.response && error.response.status === 401) {
        throw new Error('No autorizado. Por favor inicie sesión nuevamente.');
      }
      throw error;
    }
  }

  // Eliminar un movimiento
  async deleteMovement(id) {
    try {
      const response = await axios.delete(`${this.baseUrl}/${id}`, this.getAuthHeaders());
      if (response.data && response.data.status === 'success') {
        return true;
      }
      throw new Error('Respuesta inválida del servidor');
    } catch (error) {
      console.error(`Error al eliminar movimiento con ID ${id}:`, error);
      if (error.response && error.response.status === 401) {
        throw new Error('No autorizado. Por favor inicie sesión nuevamente.');
      }
      throw error;
    }
  }

  // Obtener movimientos por tipo
  async getMovementsByType(type) {
    try {
      // Validar que el tipo sea válido
      this.validarTipoMovimiento(type);
      
      const response = await axios.get(`${this.baseUrl}/tipo/${type}`, this.getAuthHeaders());
      if (response.data && response.data.status === 'success') {
        return Array.isArray(response.data.data) 
          ? response.data.data 
          : response.data.data?.movimientos || [];
      }
      throw new Error('Respuesta inválida del servidor');
    } catch (error) {
      console.error(`Error al obtener movimientos de tipo ${type}:`, error);
      if (error.response && error.response.status === 401) {
        throw new Error('No autorizado. Por favor inicie sesión nuevamente.');
      }
      throw error;
    }
  }

  // Obtener movimientos por farmacia
  async getMovementsByPharmacy(pharmacyId) {
    try {
      const response = await axios.get(`${this.baseUrl}/farmacia/${pharmacyId}`, this.getAuthHeaders());
      if (response.data && response.data.status === 'success') {
        return Array.isArray(response.data.data) 
          ? response.data.data 
          : response.data.data?.movimientos || [];
      }
      throw new Error('Respuesta inválida del servidor');
    } catch (error) {
      console.error(`Error al obtener movimientos de farmacia ${pharmacyId}:`, error);
      if (error.response && error.response.status === 401) {
        throw new Error('No autorizado. Por favor inicie sesión nuevamente.');
      }
      throw error;
    }
  }

  // Obtener movimientos por medicamento
  async getMovementsByMedicine(medicineId) {
    try {
      const response = await axios.get(`${this.baseUrl}/medicamento/${medicineId}`, this.getAuthHeaders());
      if (response.data && response.data.status === 'success') {
        return Array.isArray(response.data.data) 
          ? response.data.data 
          : response.data.data?.movimientos || [];
      }
      throw new Error('Respuesta inválida del servidor');
    } catch (error) {
      console.error(`Error al obtener movimientos de medicamento ${medicineId}:`, error);
      if (error.response && error.response.status === 401) {
        throw new Error('No autorizado. Por favor inicie sesión nuevamente.');
      }
      throw error;
    }
  }
}

// Exportar una instancia ya creada para usar directamente
export default new InventoryMovementsService();

// También exportar la clase para quien necesite crear instancias personalizadas
export { InventoryMovementsService, MOVIMIENTO_TIPOS };