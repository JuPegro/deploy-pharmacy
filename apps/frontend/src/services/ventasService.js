// src/features/ventas/services/ventasService.js

class VentasService {
    /**
     * Método interno para manejar respuestas de fetch
     * @param {Response} response - Respuesta de fetch
     * @returns {Promise<any>} Datos parseados
     */
    static async handleResponse(response) {
      // Primero, verificar el tipo de contenido
      const contentType = response.headers.get('content-type');
      
      // Si no es JSON, intentar obtener el texto para debugging
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Respuesta no es JSON:', text);
        throw new Error(`Respuesta inesperada: ${text}`);
      }
  
      // Si es JSON, continuar con el parseo normal
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error en la solicitud');
      }
  
      return await response.json();
    }
  
    /**
     * Fetch all sales with enhanced error handling
     * @returns {Promise<Array>} List of sales
     */
    static async getAll() {
        try {
          const token = localStorage.getItem('token');
          console.log('Token:', token); // Logging del token
          const response = await fetch('/api/ventas', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          console.log('Respuesta raw:', response); // Logging de la respuesta completa
          const text = await response.text();
          console.log('Respuesta en texto:', text);
          
          // Si quieres parsear manualmente
          try {
            const data = JSON.parse(text);
            return data.data?.ventas || [];
          } catch (parseError) {
            console.error('Error al parsear JSON:', parseError);
            throw new Error('Respuesta no es JSON válido');
          }
        } catch (error) {
          console.error('Error fetching sales:', error);
          throw error;
        }
      }
  
    /**
     * Get details of a specific sale
     * @param {string|number} id - ID of the sale
     * @returns {Promise<Object>} Sale details
     */
    static async getById(id) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/ventas/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        const data = await this.handleResponse(response);
        return data.data?.venta || null;
      } catch (error) {
        console.error(`Error fetching sale ${id}:`, error);
        throw error;
      }
    }
  
    /**
     * Create a new sale
     * @param {Object} saleData - Data for the new sale
     * @returns {Promise<Object>} Created sale
     */
    static async create(saleData) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/ventas', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(saleData)
        });
        
        const data = await this.handleResponse(response);
        return data.data?.venta || null;
      } catch (error) {
        console.error('Error creating sale:', error);
        throw error;
      }
    }
  
    /**
     * Filter sales
     * @param {Object} filters - Filtering criteria
     * @returns {Promise<Array>} Filtered sales
     */
    static async filter(filters) {
      try {
        const token = localStorage.getItem('token');
        const queryParams = new URLSearchParams(
          Object.entries(filters).map(([key, value]) => [key, value.toString()])
        ).toString();
  
        const response = await fetch(`/api/ventas?${queryParams}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        const data = await this.handleResponse(response);
        return data.data?.ventas || [];
      } catch (error) {
        console.error('Error filtering sales:', error);
        throw error;
      }
    }
  }
  
  export default VentasService;