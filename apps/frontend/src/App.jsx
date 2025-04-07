import React, { useEffect, useState, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import { AuthProvider } from './context/AuthContext';

// Páginas
import Dashboard from './pages/Dashboard/Dashboard';
import Login from './pages/Login/Login';
import VentasPage from './pages/Ventas/Ventas';
import DevolucionesPage from './pages/Devoluciones/DevolucionesPage';
import Inventarios from './pages/Inventario/Inventario';
import MedicamentosPage from './pages/Medicamentos/Medicamentos';
import FarmaciasPage from './pages/Farmacias/Farmacias';
import ReservasPage from './pages/Reservas/Reservas';
import UsuariosPage from './pages/Usuarios/Usuarios';
// import PrediccionesDashboard from './pages/Predicciones/PrediccionesDashboard';
// import PrediccionesRecomendaciones from './pages/Predicciones/PrediccionesRecomendaciones';
import '../axios';

// Componente para rutas protegidas con control de permisos mejorado
const ProtectedRoute = ({ children, requiredRoles = [] }) => {
  // Usar una referencia para evitar renderizados infinitos
  const didInitialCheck = useRef(false);
  const token = localStorage.getItem('token');
  
  // Verificar token
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  // Si no se requiere un rol específico, permitir acceso
  if (requiredRoles.length === 0) {
    return children;
  }
  
  // Verificar rol del usuario solo una vez
  if (!didInitialCheck.current) {
    didInitialCheck.current = true;
    
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const userRole = String(user.rol || '').trim().toUpperCase();
      
      // Si el usuario tiene uno de los roles requeridos, permitir acceso
      if (requiredRoles.includes(userRole)) {
        return children;
      }
      
      // Si el usuario no tiene los permisos, redirigir a una página por defecto según su rol
      if (userRole === 'FARMACIA') {
        return <Navigate to="/ventas" replace />;
      }
      
      // Por defecto redirigir al dashboard
      return <Navigate to="/dashboard" replace />;
    } catch (error) {
      console.error("Error parsing user data:", error);
      return <Navigate to="/login" replace />;
    }
  }
  
  // Por defecto, mostrar los children después del chequeo inicial
  return children;
};

// Componente para redireccionar según el rol del usuario
const RoleBasedRedirect = ({ adminPath, defaultPath }) => {
  const initialCheckRef = useRef(false);
  
  if (!initialCheckRef.current) {
    initialCheckRef.current = true;
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const userRole = String(user.rol || '').trim().toUpperCase();
      
      return <Navigate to={userRole === 'ADMIN' ? adminPath : defaultPath} replace />;
    } catch (error) {
      console.error("Error in RoleBasedRedirect:", error);
      return <Navigate to="/login" replace />;
    }
  }
  
  // Nunca debería llegar aquí, pero por si acaso
  return null;
};

const App = () => {
  return (
    <AuthProvider>
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
            {/* Ruta de inicio redirige según el rol */}
            <Route index element={<RoleBasedRedirect adminPath="/dashboard" defaultPath="/dashboard" />} />
            
            {/* Dashboard - Para todos los usuarios (removimos la restricción de rol) */}
            <Route path="dashboard" element={<Dashboard />} />
            
            {/* Ventas - Para todos */}
            <Route path="ventas" element={<VentasPage />} />
            
            {/* Devoluciones - Para todos */}
            <Route path="devoluciones" element={<DevolucionesPage />} />
            
            {/* Inventario - Para todos */}
            <Route path="inventario" element={<Navigate to="/inventario/movimientos" replace />} />
            <Route path="inventario/movimientos" element={<Inventarios />} />
            
            {/* Medicamentos - Para todos, pero con diferentes capacidades según rol */}
            <Route path="medicamentos" element={<MedicamentosPage />} />
            
            {/* Reservas - Para todos */}
            <Route path="reservas" element={<ReservasPage />} />
            
            {/* Farmacias - Solo para ADMIN */}
            <Route path="farmacias" element={
              <ProtectedRoute requiredRoles={['ADMIN']}>
                <FarmaciasPage />
              </ProtectedRoute>
            } />
            
            {/* Usuarios - Solo para ADMIN */}
            <Route path="usuarios" element={
              <ProtectedRoute requiredRoles={['ADMIN']}>
                <UsuariosPage />
              </ProtectedRoute>
            } />
            
            {/* Predicciones - Diferentes rutas según rol */}
            <Route path="predicciones" element={<RoleBasedRedirect adminPath="/predicciones/dashboard" defaultPath="/predicciones/recomendaciones" />} />
            
            {/* <Route path="predicciones/dashboard" element={
              <ProtectedRoute requiredRoles={['ADMIN']}>
                <PrediccionesDashboard />
              </ProtectedRoute>
            } />
            
            <Route path="predicciones/recomendaciones" element={<PrediccionesRecomendaciones />} /> */}
          </Route>
          
          {/* Ruta por defecto - redirigir según rol */}
          <Route path="*" element={<RoleBasedRedirect adminPath="/dashboard" defaultPath="/dashboard" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;


// import React, { useEffect, useState, useRef } from 'react';
// import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
// import Layout from './components/Layout/Layout';
// import { AuthProvider } from './context/AuthContext';

// // Páginas
// import Dashboard from './pages/Dashboard/Dashboard';
// import Login from './pages/Login/Login';
// import VentasPage from './pages/Ventas/Ventas';
// import DevolucionesPage from './pages/Devoluciones/DevolucionesPage';
// import Inventarios from './pages/Inventario/Inventario';
// import MedicamentosPage from './pages/Medicamentos/Medicamentos';
// import FarmaciasPage from './pages/Farmacias/Farmacias';
// import ReservasPage from './pages/Reservas/Reservas';
// import UsuariosPage from './pages/Usuarios/Usuarios';
// // import PrediccionesDashboard from './pages/Predicciones/PrediccionesDashboard';
// // import PrediccionesRecomendaciones from './pages/Predicciones/PrediccionesRecomendaciones';
// import '../axios';

// // Componente para rutas protegidas con control de permisos mejorado
// const ProtectedRoute = ({ children, requiredRoles = [] }) => {
//   // Usar una referencia para evitar renderizados infinitos
//   const didInitialCheck = useRef(false);
//   const token = localStorage.getItem('token');
  
//   // Verificar token
//   if (!token) {
//     return <Navigate to="/login" replace />;
//   }
  
//   // Si no se requiere un rol específico, permitir acceso
//   if (requiredRoles.length === 0) {
//     return children;
//   }
  
//   // Verificar rol del usuario solo una vez
//   if (!didInitialCheck.current) {
//     didInitialCheck.current = true;
    
//     try {
//       const user = JSON.parse(localStorage.getItem('user') || '{}');
//       const userRole = String(user.rol || '').trim().toUpperCase();
      
//       // Si el usuario tiene uno de los roles requeridos, permitir acceso
//       if (requiredRoles.includes(userRole)) {
//         return children;
//       }
      
//       // Si el usuario no tiene los permisos, redirigir a una página por defecto según su rol
//       if (userRole === 'FARMACIA') {
//         return <Navigate to="/ventas" replace />;
//       }
      
//       // Por defecto redirigir al dashboard
//       return <Navigate to="/dashboard" replace />;
//     } catch (error) {
//       console.error("Error parsing user data:", error);
//       return <Navigate to="/login" replace />;
//     }
//   }
  
//   // Por defecto, mostrar los children después del chequeo inicial
//   return children;
// };

// // Componente para redireccionar según el rol del usuario
// const RoleBasedRedirect = ({ adminPath, defaultPath }) => {
//   const initialCheckRef = useRef(false);
  
//   if (!initialCheckRef.current) {
//     initialCheckRef.current = true;
//     try {
//       const user = JSON.parse(localStorage.getItem('user') || '{}');
//       const userRole = String(user.rol || '').trim().toUpperCase();
      
//       return <Navigate to={userRole === 'ADMIN' ? adminPath : defaultPath} replace />;
//     } catch (error) {
//       console.error("Error in RoleBasedRedirect:", error);
//       return <Navigate to="/login" replace />;
//     }
//   }
  
//   // Nunca debería llegar aquí, pero por si acaso
//   return null;
// };

// const App = () => {
//   return (
//     <AuthProvider>
//       <Router>
//         <Routes>
//           {/* Ruta pública */}
//           <Route path="/login" element={<Login />} />
          
//           {/* Rutas protegidas dentro del layout principal */}
//           <Route path="/" element={
//             <ProtectedRoute>
//               <Layout />
//             </ProtectedRoute>
//           }>
//             {/* Ruta de inicio redirige según el rol */}
//             <Route index element={<RoleBasedRedirect adminPath="/dashboard" defaultPath="/ventas" />} />
            
//             {/* Dashboard - Solo para ADMIN */}
//             <Route path="dashboard" element={
//               <ProtectedRoute requiredRoles={['ADMIN']}>
//                 <Dashboard />
//               </ProtectedRoute>
//             } />
            
//             {/* Ventas - Para todos */}
//             <Route path="ventas" element={<VentasPage />} />
            
//             {/* Devoluciones - Para todos */}
//             <Route path="devoluciones" element={<DevolucionesPage />} />
            
//             {/* Inventario - Para todos */}
//             <Route path="inventario" element={<Navigate to="/inventario/movimientos" replace />} />
//             <Route path="inventario/movimientos" element={<Inventarios />} />
            
//             {/* Medicamentos - Para todos, pero con diferentes capacidades según rol */}
//             <Route path="medicamentos" element={<MedicamentosPage />} />
            
//             {/* Reservas - Para todos */}
//             <Route path="reservas" element={<ReservasPage />} />
            
//             {/* Farmacias - Solo para ADMIN */}
//             <Route path="farmacias" element={
//               <ProtectedRoute requiredRoles={['ADMIN']}>
//                 <FarmaciasPage />
//               </ProtectedRoute>
//             } />
            
//             {/* Usuarios - Solo para ADMIN */}
//             <Route path="usuarios" element={
//               <ProtectedRoute requiredRoles={['ADMIN']}>
//                 <UsuariosPage />
//               </ProtectedRoute>
//             } />
            
//             {/* Predicciones - Diferentes rutas según rol */}
//             <Route path="predicciones" element={<RoleBasedRedirect adminPath="/predicciones/dashboard" defaultPath="/predicciones/recomendaciones" />} />
            
//             {/* <Route path="predicciones/dashboard" element={
//               <ProtectedRoute requiredRoles={['ADMIN']}>
//                 <PrediccionesDashboard />
//               </ProtectedRoute>
//             } />
            
//             <Route path="predicciones/recomendaciones" element={<PrediccionesRecomendaciones />} /> */}
//           </Route>
          
//           {/* Ruta por defecto - redirigir según rol */}
//           <Route path="*" element={<RoleBasedRedirect adminPath="/dashboard" defaultPath="/ventas" />} />
//         </Routes>
//       </Router>
//     </AuthProvider>
//   );
// };

// export default App;

// // import React, { useEffect, useState } from 'react';
// // import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
// // import Layout from './components/Layout/Layout';
// // import { AuthProvider } from './context/AuthContext';

// // // Páginas
// // import Dashboard from './pages/Dashboard/Dashboard';
// // import Login from './pages/Login/Login';
// // import VentasPage from './pages/Ventas/Ventas';
// // import DevolucionesPage from './pages/Devoluciones/DevolucionesPage';
// // import Inventarios from './pages/Inventario/Inventario';
// // import MedicamentosPage from './pages/Medicamentos/Medicamentos';
// // import FarmaciasPage from './pages/Farmacias/Farmacias';
// // import ReservasPage from './pages/Reservas/Reservas';
// // import UsuariosPage from './pages/Usuarios/Usuarios';
// // // import PrediccionesDashboard from './pages/Predicciones/PrediccionesDashboard';
// // // import PrediccionesRecomendaciones from './pages/Predicciones/PrediccionesRecomendaciones';
// // import '../axios';

// // // Componente para rutas protegidas con control de permisos
// // const ProtectedRoute = ({ children, requiredRoles = [] }) => {
// //   const token = localStorage.getItem('token');
  
// //   // Verificar token
// //   if (!token) {
// //     return <Navigate to="/login" replace />;
// //   }
  
// //   // Si no se requiere un rol específico, permitir acceso
// //   if (requiredRoles.length === 0) {
// //     return children;
// //   }
  
// //   // Verificar rol del usuario
// //   let user;
// //   try {
// //     user = JSON.parse(localStorage.getItem('user') || '{}');
// //     const userRole = String(user.rol || '').trim().toUpperCase();
    
// //     // Si el usuario tiene uno de los roles requeridos, permitir acceso
// //     if (requiredRoles.includes(userRole)) {
// //       return children;
// //     }
// //   } catch (error) {
// //     console.error("Error parsing user data:", error);
// //   }
  
// //   // Si el usuario no tiene los permisos, redirigir a una página por defecto según su rol
// //   try {
// //     const userRole = String(user.rol || '').trim().toUpperCase();
// //     if (userRole === 'FARMACIA') {
// //       return <Navigate to="/ventas" replace />;
// //     }
// //   } catch (error) {
// //     console.error("Error handling redirection:", error);
// //   }
  
// //   // Por defecto redirigir al dashboard
// //   return <Navigate to="/dashboard" replace />;
// // };

// // const App = () => {
// //   // Estado para almacenar el rol del usuario
// //   const [userRole, setUserRole] = useState('');
  
// //   // Determinar el rol del usuario al cargar la aplicación
// //   useEffect(() => {
// //     try {
// //       const user = JSON.parse(localStorage.getItem('user') || '{}');
// //       const role = String(user.rol || '').trim().toUpperCase();
// //       setUserRole(role);
// //     } catch (error) {
// //       console.error("Error parsing user role:", error);
// //       setUserRole('');
// //     }
// //   }, []);
  
// //   return (
// //     <AuthProvider>
// //       <Router>
// //         <Routes>
// //           {/* Ruta pública */}
// //           <Route path="/login" element={<Login />} />
          
// //           {/* Rutas protegidas dentro del layout principal */}
// //           <Route path="/" element={
// //             <ProtectedRoute>
// //               <Layout />
// //             </ProtectedRoute>
// //           }>
// //             {/* Ruta de inicio redirige según el rol */}
// //             <Route index element={
// //               userRole === 'ADMIN' ? 
// //                 <Navigate to="/dashboard" replace /> : 
// //                 <Navigate to="/ventas" replace />
// //             } />
            
// //             {/* Dashboard - Solo para ADMIN */}
// //             <Route path="dashboard" element={
// //               <ProtectedRoute requiredRoles={['ADMIN']}>
// //                 <Dashboard />
// //               </ProtectedRoute>
// //             } />
            
// //             {/* Ventas - Para todos */}
// //             <Route path="ventas" element={<VentasPage />} />
            
// //             {/* Devoluciones - Para todos */}
// //             <Route path="devoluciones" element={<DevolucionesPage />} />
            
// //             {/* Inventario - Para todos */}
// //             <Route path="inventario" element={<Navigate to="/inventario/movimientos" replace />} />
// //             <Route path="inventario/movimientos" element={<Inventarios />} />
            
// //             {/* Medicamentos - Para todos, pero con diferentes capacidades según rol */}
// //             <Route path="medicamentos" element={<MedicamentosPage />} />
            
// //             {/* Reservas - Para todos */}
// //             <Route path="reservas" element={<ReservasPage />} />
            
// //             {/* Farmacias - Solo para ADMIN */}
// //             <Route path="farmacias" element={
// //               <ProtectedRoute requiredRoles={['ADMIN']}>
// //                 <FarmaciasPage />
// //               </ProtectedRoute>
// //             } />
            
// //             {/* Usuarios - Solo para ADMIN */}
// //             <Route path="usuarios" element={
// //               <ProtectedRoute requiredRoles={['ADMIN']}>
// //                 <UsuariosPage />
// //               </ProtectedRoute>
// //             } />
            
// //             {/* Predicciones - Diferentes rutas según rol */}
// //             <Route path="predicciones" element={<Navigate to={userRole === 'ADMIN' ? "/predicciones/dashboard" : "/predicciones/recomendaciones"} replace />} />
            
// //             {/* <Route path="predicciones/dashboard" element={
// //               <ProtectedRoute requiredRoles={['ADMIN']}>
// //                 <PrediccionesDashboard />
// //               </ProtectedRoute>
// //             } /> */}
            
// //             {/* <Route path="predicciones/recomendaciones" element={<PrediccionesRecomendaciones />} /> */}
// //           </Route>
          
// //           {/* Ruta por defecto - redirigir según rol */}
// //           <Route path="*" element={
// //             userRole === 'ADMIN' ? 
// //               <Navigate to="/dashboard" replace /> : 
// //               <Navigate to="/ventas" replace />
// //           } />
// //         </Routes>
// //       </Router>
// //     </AuthProvider>
// //   );
// // };

// // export default App;


// // // src/App.jsx modificado
// // import React from 'react';
// // import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
// // import Layout from './components/Layout/Layout';
// // import { AuthProvider } from './context/AuthContext';

// // // Páginas
// // import Dashboard from './pages/Dashboard/Dashboard';
// // import Login from './pages/Login/Login';
// // import VentasPage from './pages/Ventas/Ventas';
// // import DevolucionesPage from './pages/Devoluciones/DevolucionesPage';
// // import Inventarios from './pages/Inventario/Inventario';
// // import MedicamentosPage from './pages/Medicamentos/Medicamentos';
// // import FarmaciasPage from './pages/Farmacias/Farmacias';
// // import ReservasPage from './pages/Reservas/Reservas';
// // import '../axios';

// // // Componente para rutas protegidas
// // const ProtectedRoute = ({ children }) => {
// //   const token = localStorage.getItem('token');
  
// //   if (!token) {
// //     // Redirigir al login si no hay token
// //     return <Navigate to="/login" replace />;
// //   }
  
// //   return children;
// // };

// // const App = () => {
// //   return (
// //     <AuthProvider>
// //       <Router>
// //         <Routes>
// //           {/* Ruta pública */}
// //           <Route path="/login" element={<Login />} />
          
// //           {/* Rutas protegidas dentro del layout principal */}
// //           <Route path="/" element={
// //             <ProtectedRoute>
// //               <Layout />
// //             </ProtectedRoute>
// //           }>
// //             <Route index element={<Dashboard />} />
// //             <Route path="dashboard" element={<Dashboard />} />
// //             <Route path="ventas" element={<VentasPage />} />
// //             <Route path="devoluciones" element={<DevolucionesPage />} />
// //             <Route path="inventario/movimientos" element={<Inventarios />} />
// //             <Route path="medicamentos" element={<MedicamentosPage />} />
// //             <Route path="farmacias" element={<FarmaciasPage />} />
// //             <Route path="reservas" element={<ReservasPage />} />
// //           </Route>
          
// //           {/* Ruta por defecto - redirigir al dashboard */}
// //           <Route path="*" element={<Navigate to="/dashboard" replace />} />
// //         </Routes>
// //       </Router>
// //     </AuthProvider>
// //   );
// // };

// // export default App;


// // // // src/App.jsx o donde tengas tus rutas definidas
// // // import React from 'react';
// // // import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
// // // import Layout from './components/Layout/Layout';

// // // // Páginas
// // // import Dashboard from './pages/Dashboard/Dashboard';
// // // import Login from './pages/Login/Login';
// // // import VentasPage from './pages/Ventas/Ventas';
// // // import DevolucionesPage from './pages/Devoluciones/DevolucionesPage';
// // // import Inventarios from './pages/Inventario/Inventario';
// // // import MedicamentosPage from './pages/Medicamentos/Medicamentos';
// // // import FarmaciasPage from './pages/Farmacias/Farmacias';
// // // import ReservasPage from './pages/Reservas/Reservas';
// // // import '../axios'

// // // // Componente para rutas protegidas
// // // const ProtectedRoute = ({ children }) => {
// // //   const token = localStorage.getItem('token');
  
// // //   if (!token) {
// // //     // Redirigir al login si no hay token
// // //     return <Navigate to="/login" replace />;
// // //   }
  
// // //   return children;
// // // };

// // // const App = () => {
// // //   return (
// // //     <Router>
// // //       <Routes>
// // //         {/* Ruta pública */}
// // //         <Route path="/login" element={<Login />} />
        
// // //         {/* Rutas protegidas dentro del layout principal */}
// // //         <Route path="/" element={
// // //           <ProtectedRoute>
// // //             <Layout />
// // //           </ProtectedRoute>
// // //         }>
// // //           <Route index element={<Dashboard />} />
// // //           <Route path="dashboard" element={<Dashboard />} />
// // //           <Route path="ventas" element={<VentasPage />} />
// // //           <Route path="devoluciones" element={<DevolucionesPage />} />
// // //           <Route path="inventario/movimientos" element={<Inventarios />} />
// // //           <Route path="medicamentos" element={<MedicamentosPage />} />
// // //           <Route path="farmacias" element={<FarmaciasPage />} />
// // //           <Route path="reservas" element={<ReservasPage />} />
// // //         </Route>
        
// // //         {/* Ruta por defecto - redirigir al dashboard */}
// // //         <Route path="*" element={<Navigate to="/dashboard" replace />} />
// // //       </Routes>
// // //     </Router>
// // //   );
// // // };

// // // export default App;