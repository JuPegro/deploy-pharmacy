// src/components/Layout/Layout.jsx
import React, { useState, useEffect } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';

const Layout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    
    // Acceder directamente al localStorage para debugging
    const userString = localStorage.getItem('user');
    console.log("USER STRING FROM LOCALSTORAGE:", userString);
    
    // Parsear el usuario con manejo de errores
    let user;
    try {
        user = JSON.parse(userString || '{}');
    } catch (error) {
        console.error("Error parsing user from localStorage:", error);
        user = {};
    }
    
    // Mostrar el usuario completo para debugging - IMPORTANTE: el campo es "rol" no "role"
    console.log("USER OBJECT:", user);
    console.log("USER ROL:", user.rol); // CAMBIO A rol en lugar de role
    
    // Corregir mayúsculas/minúsculas y espacios
    const rol = String(user.rol || '').trim().toUpperCase();
    console.log("NORMALIZED ROL:", rol);
    
    const isAdmin = rol === 'ADMIN';
    console.log("IS ADMIN:", isAdmin);

    useEffect(() => {
        // Si no es admin, redirigir desde dashboard a ventas
        if (!isAdmin && location.pathname === '/dashboard') {
            navigate('/ventas');
        }
    }, [isAdmin, location.pathname, navigate]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    const isActive = (path) => {
        return location.pathname === path || location.pathname.startsWith(`${path}/`);
    };

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Sidebar móvil */}
            <div className={`fixed inset-0 flex z-40 md:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
                <div
                    className="fixed inset-0 bg-gray-600 bg-opacity-75"
                    onClick={() => setSidebarOpen(false)}
                ></div>
                <div className="relative flex-1 flex flex-col max-w-xs w-full pt-5 pb-4 bg-white">
                    <div className="absolute top-0 right-0 -mr-12 pt-2">
                        <button
                            className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                            onClick={() => setSidebarOpen(false)}
                        >
                            <span className="sr-only">Cerrar sidebar</span>
                            <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    <div className="flex-shrink-0 flex items-center px-4">
                        <span className="text-xl font-bold text-indigo-600">FarmaGest</span>
                    </div>
                    <div className="mt-5 flex-1 h-0 overflow-y-auto">
                        <nav className="px-2 space-y-1">
                            {/* Dashboard - Solo para ADMIN */}
                            {isAdmin && (
                                <Link
                                    to="/dashboard"
                                    className={`${isActive('/dashboard') ? 'bg-indigo-100 text-indigo-900' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'} group flex items-center px-2 py-2 text-base font-medium rounded-md`}
                                >
                                    <svg className={`${isActive('/dashboard') ? 'text-indigo-500' : 'text-gray-400 group-hover:text-gray-500'} mr-4 h-6 w-6`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                    </svg>
                                    Dashboard
                                </Link>
                            )}
                            
                            {/* Ventas - Para todos */}
                            <Link
                                to="/ventas"
                                className={`${isActive('/ventas') ? 'bg-indigo-100 text-indigo-900' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'} group flex items-center px-2 py-2 text-base font-medium rounded-md`}
                            >
                                <svg className={`${isActive('/ventas') ? 'text-indigo-500' : 'text-gray-400 group-hover:text-gray-500'} mr-4 h-6 w-6`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Ventas
                            </Link>
                            
                            {/* Medicamentos - Para todos */}
                            <Link
                                to="/medicamentos"
                                className={`${isActive('/medicamentos') ? 'bg-indigo-100 text-indigo-900' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'} group flex items-center px-2 py-2 text-base font-medium rounded-md`}
                            >
                                <svg className={`${isActive('/medicamentos') ? 'text-indigo-500' : 'text-gray-400 group-hover:text-gray-500'} mr-4 h-6 w-6`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                </svg>
                                Medicamentos
                            </Link>
                            
                            {/* Inventario - Para todos */}
                            <Link
                                to="/inventario/movimientos"
                                className={`${isActive('/inventario/movimientos') ? 'bg-indigo-100 text-indigo-900' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'} group flex items-center px-2 py-2 text-base font-medium rounded-md`}
                            >
                                <svg className={`${isActive('/inventario/movimientos') ? 'text-indigo-500' : 'text-gray-400 group-hover:text-gray-500'} mr-4 h-6 w-6`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                </svg>
                                Inventario
                            </Link>
                            
                            {/* Devoluciones - Para todos */}
                            <Link
                                to="/devoluciones"
                                className={`${isActive('/devoluciones') ? 'bg-indigo-100 text-indigo-900' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'} group flex items-center px-2 py-2 text-base font-medium rounded-md`}
                            >
                                <svg className={`${isActive('/devoluciones') ? 'text-indigo-500' : 'text-gray-400 group-hover:text-gray-500'} mr-4 h-6 w-6`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2z" />
                                </svg>
                                Devoluciones
                            </Link>
                            
                            {/* Farmacias - Solo para ADMIN */}
                            {isAdmin && (
                                <Link
                                    to="/farmacias"
                                    className={`${isActive('/farmacias') ? 'bg-indigo-100 text-indigo-900' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'} group flex items-center px-2 py-2 text-base font-medium rounded-md`}
                                >
                                    <svg className={`${isActive('/farmacias') ? 'text-indigo-500' : 'text-gray-400 group-hover:text-gray-500'} mr-4 h-6 w-6`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                    Farmacias
                                </Link>
                            )}

                            {/* Predicciones - Solo para ADMIN */}
                            {isAdmin && (
                                <Link
                                    to="/predicciones"
                                    className={`${isActive('/predicciones') ? 'bg-indigo-100 text-indigo-900' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'} group flex items-center px-2 py-2 text-base font-medium rounded-md`}
                                >
                                    <svg className={`${isActive('/predicciones') ? 'text-indigo-500' : 'text-gray-400 group-hover:text-gray-500'} mr-4 h-6 w-6`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                    Predicciones
                                </Link>
                            )}
                        </nav>
                    </div>
                </div>
            </div>

            {/* Sidebar escritorio */}
            <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
                <div className="flex flex-col flex-grow border-r border-gray-200 pt-5 bg-white overflow-y-auto">
                    <div className="flex items-center flex-shrink-0 px-4">
                        <span className="text-xl font-bold text-indigo-600">FarmaGest</span>
                    </div>
                    <div className="mt-5 flex-grow flex flex-col">
                        <nav className="flex-1 px-2 pb-4 space-y-1">
                            {/* Dashboard - Solo para ADMIN */}
                            {isAdmin && (
                                <Link
                                    to="/dashboard"
                                    className={`${isActive('/dashboard') ? 'bg-indigo-100 text-indigo-900' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'} group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
                                >
                                    <svg className={`${isActive('/dashboard') ? 'text-indigo-500' : 'text-gray-400 group-hover:text-gray-500'} mr-3 h-6 w-6`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                    </svg>
                                    Dashboard
                                </Link>
                            )}
                            
                            {/* Ventas - Para todos */}
                            <Link
                                to="/ventas"
                                className={`${isActive('/ventas') ? 'bg-indigo-100 text-indigo-900' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'} group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
                            >
                                <svg className={`${isActive('/ventas') ? 'text-indigo-500' : 'text-gray-400 group-hover:text-gray-500'} mr-3 h-6 w-6`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Ventas
                            </Link>
                            
                            {/* Medicamentos - Para todos */}
                            <Link
                                to="/medicamentos"
                                className={`${isActive('/medicamentos') ? 'bg-indigo-100 text-indigo-900' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'} group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
                            >
                                <svg className={`${isActive('/medicamentos') ? 'text-indigo-500' : 'text-gray-400 group-hover:text-gray-500'} mr-3 h-6 w-6`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                </svg>
                                Medicamentos
                            </Link>
                            
                            {/* Inventario - Para todos */}
                            <Link
                                to="/inventario/movimientos"
                                className={`${isActive('/inventario/movimientos') ? 'bg-indigo-100 text-indigo-900' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'} group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
                            >
                                <svg className={`${isActive('/inventario/movimientos') ? 'text-indigo-500' : 'text-gray-400 group-hover:text-gray-500'} mr-3 h-6 w-6`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                </svg>
                                Inventario
                            </Link>
                            
                            {/* Devoluciones - Para todos */}
                            <Link
                                to="/devoluciones"
                                className={`${isActive('/devoluciones') ? 'bg-indigo-100 text-indigo-900' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'} group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
                            >
                                <svg className={`${isActive('/devoluciones') ? 'text-indigo-500' : 'text-gray-400 group-hover:text-gray-500'} mr-3 h-6 w-6`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2z" />
                                </svg>
                                Devoluciones
                            </Link>
                            
                            {/* Farmacias - Solo para ADMIN */}
                            {isAdmin && (
                                <Link
                                    to="/farmacias"
                                    className={`${isActive('/farmacias') ? 'bg-indigo-100 text-indigo-900' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'} group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
                                >
                                    <svg className={`${isActive('/farmacias') ? 'text-indigo-500' : 'text-gray-400 group-hover:text-gray-500'} mr-3 h-6 w-6`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                    Farmacias
                                </Link>
                            )}

                            {/* Predicciones - Solo para ADMIN */}
                            {isAdmin && (
                                <Link
                                    to="/predicciones"
                                    className={`${isActive('/predicciones') ? 'bg-indigo-100 text-indigo-900' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'} group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
                                >
                                    <svg className={`${isActive('/predicciones') ? 'text-indigo-500' : 'text-gray-400 group-hover:text-gray-500'} mr-3 h-6 w-6`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                    Predicciones
                                </Link>
                            )}
                        </nav>
                    </div>
                    <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
                        <div className="flex-shrink-0 w-full group block">
                            <div className="flex items-center">
                                <div>
                                    <svg className="inline-block h-9 w-9 rounded-full text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                                        {user.nombre || 'Usuario'}
                                    </p>
                                    <button
                                        onClick={handleLogout}
                                        className="text-xs font-medium text-red-500 hover:text-red-700"
                                    >
                                        Cerrar sesión
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Contenido principal */}
            <div className="md:pl-64 flex flex-col flex-1">
                <div className="sticky top-0 z-10 md:hidden pl-1 pt-1 sm:pl-3 sm:pt-3 bg-white">
                    <button
                        type="button"
                        className="-ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
                        onClick={() => setSidebarOpen(true)}
                    >
                        <span className="sr-only">Abrir sidebar</span>
                        <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                </div>
                <main className="flex-1 pb-8">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default Layout;