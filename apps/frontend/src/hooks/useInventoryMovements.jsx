// src/features/inventoryMovements/hooks/useInventoryMovements.js
import { useState, useCallback, useEffect } from 'react';
import InventoryMovementsService from '../services/inventoryMovementsService';

const useInventoryMovements = () => {
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedMovement, setSelectedMovement] = useState(null);

  const fetchMovements = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const fetchedMovements = await InventoryMovementsService.getAll();
      console.log('Movimientos fetcheados:', fetchedMovements);
      setMovements(fetchedMovements);
    } catch (err) {
      console.error('Error completo en hook de movimientos:', err);
      setError(err.message || 'Error desconocido al cargar movimientos de inventario');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMovementById = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      const movement = await InventoryMovementsService.getById(id);
      setSelectedMovement(movement);
    } catch (err) {
      console.error('Error en detalle de movimiento:', err);
      setError(err.message || 'Error desconocido al cargar movimiento');
    } finally {
      setLoading(false);
    }
  }, []);

  const createMovement = useCallback(async (movementData) => {
    setLoading(true);
    setError(null);
    try {
      const newMovement = await InventoryMovementsService.create(movementData);
      setMovements(prev => [...prev, newMovement]);
      return newMovement;
    } catch (err) {
      console.error('Error al crear movimiento:', err);
      setError(err.message || 'Error desconocido al crear movimiento');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const filterMovements = useCallback(async (filters) => {
    setLoading(true);
    setError(null);
    try {
      const filteredMovements = await InventoryMovementsService.filter(filters);
      setMovements(filteredMovements);
    } catch (err) {
      console.error('Error al filtrar movimientos:', err);
      setError(err.message || 'Error desconocido al filtrar movimientos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMovements();
  }, [fetchMovements]);

  return {
    movements,
    loading,
    error,
    selectedMovement,
    fetchMovements,
    fetchMovementById,
    createMovement,
    filterMovements,
    setSelectedMovement
  };
};

export default useInventoryMovements;