import React, { useState, useEffect } from 'react';

// Componente para listar movimientos de inventario
export const InventoryMovementsList = () => {
  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMovimientos = async () => {
      try {
        // Asume una función de API que se implementará en el frontend
        const response = await fetch('/api/movimientos-inventario');
        if (!response.ok) {
          throw new Error('No se pudieron cargar los movimientos de inventario');
        }
        const data = await response.json();
        setMovimientos(data.data.movimientos);
        setLoading(false);
      } catch (error) {
        setError(error.message);
        setLoading(false);
      }
    };

    fetchMovimientos();
  }, []);

  if (loading) {
    return <div className="p-4 text-center">Cargando movimientos...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">{error}</div>;
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Movimientos de Inventario</h2>
        <CrearMovimientoInventarioModal />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2 text-left">Fecha</th>
              <th className="border p-2 text-left">Medicamento</th>
              <th className="border p-2 text-left">Tipo</th>
              <th className="border p-2 text-left">Cantidad</th>
              <th className="border p-2 text-left">Farmacia</th>
            </tr>
          </thead>
          <tbody>
            {movimientos.map((movimiento) => (
              <tr key={movimiento.id} className="hover:bg-gray-50">
                <td className="border p-2">{new Date(movimiento.fecha).toLocaleDateString()}</td>
                <td className="border p-2">{movimiento.medicamento.nombre}</td>
                <td className="border p-2">{movimiento.tipo}</td>
                <td className="border p-2">{movimiento.cantidad}</td>
                <td className="border p-2">{movimiento.farmacia.nombre}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Componente de modal para crear movimiento de inventario
export const CrearMovimientoInventarioModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [medicamentos, setMedicamentos] = useState([]);
  const [farmacias, setFarmacias] = useState([]);
  const [formData, setFormData] = useState({
    medicamentoId: '',
    farmaciaId: '',
    tipo: '',
    cantidad: '',
    descripcion: ''
  });
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDependencias = async () => {
      try {
        const [medicamentosResponse, farmaciasResponse] = await Promise.all([
          fetch('/api/medicamentos'),
          fetch('/api/farmacias')
        ]);

        if (!medicamentosResponse.ok || !farmaciasResponse.ok) {
          throw new Error('No se pudieron cargar medicamentos o farmacias');
        }

        const medicamentosData = await medicamentosResponse.json();
        const farmaciasData = await farmaciasResponse.json();

        setMedicamentos(medicamentosData.data.medicamentos);
        setFarmacias(farmaciasData.data.farmacias);
      } catch (error) {
        setError(error.message);
      }
    };

    if (isOpen) {
      fetchDependencias();
    }
  }, [isOpen]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/movimientos-inventario', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          cantidad: parseInt(formData.cantidad, 10)
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al crear movimiento de inventario');
      }

      // Resetear formulario y cerrar modal
      setFormData({
        medicamentoId: '',
        farmaciaId: '',
        tipo: '',
        cantidad: '',
        descripcion: ''
      });
      setIsOpen(false);
      
      // Opcional: Mostrar mensaje de éxito o recargar lista
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div>
      <button 
        onClick={() => setIsOpen(true)} 
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        Crear Movimiento
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Crear Movimiento de Inventario</h2>
            
            {error && (
              <div className="bg-red-100 text-red-700 p-2 rounded mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block mb-2">Medicamento</label>
                <select
                  name="medicamentoId"
                  value={formData.medicamentoId}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                  required
                >
                  <option value="">Seleccionar medicamento</option>
                  {medicamentos.map((medicamento) => (
                    <option 
                      key={medicamento.id} 
                      value={medicamento.id.toString()}
                    >
                      {medicamento.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block mb-2">Farmacia</label>
                <select
                  name="farmaciaId"
                  value={formData.farmaciaId}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                  required
                >
                  <option value="">Seleccionar farmacia</option>
                  {farmacias.map((farmacia) => (
                    <option 
                      key={farmacia.id} 
                      value={farmacia.id.toString()}
                    >
                      {farmacia.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block mb-2">Tipo de Movimiento</label>
                <select
                  name="tipo"
                  value={formData.tipo}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                  required
                >
                  <option value="">Seleccionar tipo</option>
                  <option value="INGRESO">Ingreso</option>
                  <option value="SALIDA">Salida</option>
                </select>
              </div>

              <div>
                <label className="block mb-2">Cantidad</label>
                <input
                  type="number"
                  name="cantidad"
                  value={formData.cantidad}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                  required
                  min="1"
                />
              </div>

              <div>
                <label className="block mb-2">Descripción (Opcional)</label>
                <textarea
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                  rows="3"
                />
              </div>

              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                  Crear Movimiento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Componente para ver detalles de un movimiento específico
export const InventoryMovementDetails = ({ movimientoId }) => {
  const [movimiento, setMovimiento] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMovimiento = async () => {
      try {
        const response = await fetch(`/api/movimientos-inventario/${movimientoId}`);
        if (!response.ok) {
          throw new Error('No se pudo cargar el movimiento de inventario');
        }
        const data = await response.json();
        setMovimiento(data.data.movimiento);
        setLoading(false);
      } catch (error) {
        setError(error.message);
        setLoading(false);
      }
    };

    fetchMovimiento();
  }, [movimientoId]);

  if (loading) {
    return <div className="p-4 text-center">Cargando detalles del movimiento...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">{error}</div>;
  }

  if (!movimiento) {
    return <div className="p-4">Movimiento no encontrado</div>;
  }

  return (
    <div className="p-4 bg-white shadow rounded-lg">
      <h2 className="text-2xl font-bold mb-4">Detalles del Movimiento</h2>
      <div className="grid gap-4">
        <div>
          <strong>Medicamento:</strong> {movimiento.medicamento.nombre}
        </div>
        <div>
          <strong>Tipo:</strong> {movimiento.tipo}
        </div>
        <div>
          <strong>Cantidad:</strong> {movimiento.cantidad}
        </div>
        <div>
          <strong>Farmacia:</strong> {movimiento.farmacia.nombre}
        </div>
        <div>
          <strong>Fecha:</strong> {new Date(movimiento.fecha).toLocaleString()}
        </div>
        {movimiento.descripcion && (
          <div>
            <strong>Descripción:</strong> {movimiento.descripcion}
          </div>
        )}
      </div>
    </div>
  );
};

export default {
  InventoryMovementsList,
  CrearMovimientoInventarioModal,
  InventoryMovementDetails
};