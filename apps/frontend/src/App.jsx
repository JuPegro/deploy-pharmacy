// src/App.jsx o donde tengas tus rutas definidas
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout/Layout';

// Páginas
import Dashboard from './pages/Dashboard/Dashboard';
import Login from './pages/Login/Login';
import VentasPage from './pages/Ventas/Ventas';
import DevolucionesPage from './pages/Devoluciones/DevolucionesPage';
import Inventarios from './pages/Inventario/Inventario';
import MedicamentosPage from './pages/Medicamentos/Medicamentos';
import FarmaciasPage from './pages/Farmacias/Farmacias';
import ReservasPage from './pages/Reservas/Reservas';
import '../axios'

// Componente para rutas protegidas
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    // Redirigir al login si no hay token
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

const App = () => {
  return (
    <Router>
      <Routes>
        {/* Ruta pública */}
        <Route path="/login" element={<Login />} />
        
        {/* Rutas protegidas dentro del layout principal */}
        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="ventas" element={<VentasPage />} />
          <Route path="devoluciones" element={<DevolucionesPage />} />
          <Route path="inventario/movimientos" element={<Inventarios />} />
          <Route path="medicamentos" element={<MedicamentosPage />} />
          <Route path="farmacias" element={<FarmaciasPage />} />
          <Route path="reservas" element={<ReservasPage />} />
        </Route>
        
        {/* Ruta por defecto - redirigir al dashboard */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
};

export default App;