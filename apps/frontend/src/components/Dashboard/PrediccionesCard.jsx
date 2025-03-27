// src/components/Dashboard/PrediccionesCard.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Link } from 'react-router-dom';

const PrediccionesCard = ({ medicamentoId, farmaciaId }) => {
  const [predicciones, setPredicciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPredicciones = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        // Si no hay medicamentoId específico, usaremos uno predeterminado para mostrar algo
        const idToUse = medicamentoId || 'default-id';
        
        const response = await axios.get(`/api/predicciones/demanda/${idToUse}`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { dias: 30 }
        });
        
        if (response.data && response.data.status === 'success') {
          // Transformar datos para el gráfico
          const datosGrafico = response.data.data.predicciones.map((item, index) => ({
            name: `Día ${index + 1}`,
            prediccion: item.cantidadPredecida
          }));
          
          setPredicciones(datosGrafico);
        } else {
          // Si no hay datos reales, usamos datos simulados para demostración
          setPredicciones(getDatosDemostracion());
        }
      } catch (err) {
        console.error('Error al cargar predicciones:', err);
        // En caso de error, mostrar datos de demostración
        setPredicciones(getDatosDemostracion());
        setError('No se pudieron cargar las predicciones reales');
      } finally {
        setLoading(false);
      }
    };

    fetchPredicciones();
  }, [medicamentoId]);

  // Función para generar datos de demostración
  const getDatosDemostracion = () => {
    return [
      { name: 'Día 1', prediccion: 42 },
      { name: 'Día 5', prediccion: 45 },
      { name: 'Día 10', prediccion: 48 },
      { name: 'Día 15', prediccion: 51 },
      { name: 'Día 20', prediccion: 53 },
      { name: 'Día 25', prediccion: 55 },
      { name: 'Día 30', prediccion: 58 },
    ];
  };

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Predicción de Demanda (30 días)
          </h3>
          {error && (
            <span className="text-xs text-yellow-600">
              {error} - Mostrando datos simulados
            </span>
          )}
        </div>
        <div className="mt-4 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={predicciones}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="prediccion" 
                stroke="#8884d8" 
                activeDot={{ r: 8 }} 
                name="Demanda Predicha"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="bg-gray-50 px-4 py-4 sm:px-6">
        <div className="text-sm">
          <Link to="/predicciones" className="font-medium text-indigo-600 hover:text-indigo-500">
            Ver análisis completo
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PrediccionesCard;