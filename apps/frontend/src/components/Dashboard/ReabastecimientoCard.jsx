// src/components/Dashboard/ReabastecimientoCard.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const ReabastecimientoCard = ({ farmaciaId }) => {
  const [recomendaciones, setRecomendaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRecomendaciones = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        // Si no hay farmaciaId específico, usaremos uno predeterminado
        const idToUse = farmaciaId || 'default-farmacia-id';
        
        const response = await axios.get(`/api/predicciones/recomendaciones-reabastecimiento/${idToUse}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.data && response.data.status === 'success') {
          // Usar las recomendaciones reales
          setRecomendaciones(response.data.data.recomendaciones);
        } else {
          // Si no hay datos reales, usar datos de demostración
          setRecomendaciones(getDatosDemostracion());
        }
      } catch (err) {
        console.error('Error al cargar recomendaciones:', err);
        // En caso de error, mostrar datos de demostración
        setRecomendaciones(getDatosDemostracion());
        setError('No se pudieron cargar las recomendaciones reales');
      } finally {
        setLoading(false);
      }
    };

    fetchRecomendaciones();
  }, [farmaciaId]);

  // Función para generar datos de demostración
  const getDatosDemostracion = () => {
    return [
      { 
        medicamentoId: '1', 
        nombre: 'Paracetamol 500mg', 
        stockActual: 15, 
        nivelOptimo: 50, 
        cantidadRecomendada: 35, 
        porcentajeStock: 30,
        demandaMensualEstimada: 120
      },
      { 
        medicamentoId: '2', 
        nombre: 'Ibuprofeno 400mg', 
        stockActual: 8, 
        nivelOptimo: 40, 
        cantidadRecomendada: 32, 
        porcentajeStock: 20,
        demandaMensualEstimada: 100
      },
      { 
        medicamentoId: '3', 
        nombre: 'Amoxicilina 500mg', 
        stockActual: 5, 
        nivelOptimo: 30, 
        cantidadRecomendada: 25, 
        porcentajeStock: 17,
        demandaMensualEstimada: 80
      },
    ];
  };

  // Mostrar solo las 5 recomendaciones más urgentes
  const recomendacionesUrgentes = recomendaciones
    .sort((a, b) => a.porcentajeStock - b.porcentajeStock)
    .slice(0, 5);

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-10 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Recomendaciones de Reabastecimiento
          </h3>
          {error && (
            <span className="text-xs text-yellow-600">
              {error} - Mostrando datos simulados
            </span>
          )}
        </div>
        
        <div className="mt-4">
          {recomendacionesUrgentes.length === 0 ? (
            <p className="text-sm text-gray-500">No hay recomendaciones de reabastecimiento urgentes.</p>
          ) : (
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Medicamento</th>
                    <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                    <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Óptimo</th>
                    <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pedir</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recomendacionesUrgentes.map((item) => (
                    <tr key={item.medicamentoId}>
                      <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.nombre}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm">
                        <span className={
                          item.porcentajeStock < 20 
                            ? "px-2 py-1 text-xs rounded-full bg-red-100 text-red-800" 
                            : "text-yellow-600 font-medium"
                        }>
                          {item.stockActual}
                        </span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                        {item.nivelOptimo}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-green-600 font-medium">
                        {item.cantidadRecomendada}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      <div className="bg-gray-50 px-4 py-4 sm:px-6">
        <div className="text-sm">
          <Link to="/inventario/reabastecimiento" className="font-medium text-indigo-600 hover:text-indigo-500">
            Ver todas las recomendaciones
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ReabastecimientoCard;