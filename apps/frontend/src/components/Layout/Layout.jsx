import React, { useState, useEffect, useRef } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';

const Layout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [farmaciaActiva, setFarmaciaActiva] = useState(null);
    const initialRenderRef = useRef(true);
    const prevPathRef = useRef(location.pathname);
    
    // Obtener el usuario del localStorage con manejo de errores
    let user;
    try {
        const userString = localStorage.getItem('user');
        user = JSON.parse(userString || '{}');
    } catch (error) {
        console.error("Error parsing user data:", error);
        user = {};
    }
    
    // Normalizar el rol para consistencia
    const rol = String(user.rol || '').trim().toUpperCase();
    
    // Determinar permisos según rol
    const isAdmin = rol === 'ADMIN';
    const isFarmacia = rol === 'FARMACIA';

    // Obtener la farmacia activa si el usuario es de tipo FARMACIA
    useEffect(() => {
        if (isFarmacia && user.farmaciaActivaId) {
            setFarmaciaActiva({
                id: user.farmaciaActivaId,
                nombre: user.farmaciaActiva?.nombre || 'Farmacia actual'
            });
        }
    }, [isFarmacia, user.farmaciaActivaId, user.farmaciaActiva?.nombre]);

    // Manejar redirecciones basadas en roles usando useEffect con useRef para evitar loops
    useEffect(() => {
        // Solo ejecutar este código en el primer renderizado
        if (initialRenderRef.current) {
            initialRenderRef.current = false;
            
            // Eliminamos la redirección del dashboard para usuarios de farmacia
            // ya que ahora queremos que puedan acceder, sólo restringimos otras áreas
            
            if (isFarmacia && (
                location.pathname === '/farmacias' || 
                location.pathname.startsWith('/usuarios')
            )) {
                navigate('/dashboard', { replace: true });
                return;
            }
        }
        
        // Actualizar la referencia a la ruta actual
        prevPathRef.current = location.pathname;
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    const isActive = (path) => {
        return location.pathname === path || location.pathname.startsWith(`${path}/`);
    };

    // Elementos de navegación para el sidebar
    const navigationItems = [
        // Dashboard - Ahora para todos los usuarios
        {
            name: 'Dashboard',
            path: '/dashboard',
            icon: (active) => (
                <svg className={`${active ? 'text-indigo-500' : 'text-gray-400 group-hover:text-gray-500'} mr-3 h-6 w-6`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
            )
        },
        
        // Ventas - Para todos
        {
            name: 'Ventas',
            path: '/ventas',
            icon: (active) => (
                <svg className={`${active ? 'text-indigo-500' : 'text-gray-400 group-hover:text-gray-500'} mr-3 h-6 w-6`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            )
        },
        
        // Medicamentos - Para todos
        {
            name: 'Medicamentos',
            path: '/medicamentos',
            icon: (active) => (
                <svg className={`${active ? 'text-indigo-500' : 'text-gray-400 group-hover:text-gray-500'} mr-3 h-6 w-6`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
            )
        },
        
        // Inventario - Para todos
        {
            name: 'Inventario',
            path: '/inventario',
            icon: (active) => (
                <svg className={`${active ? 'text-indigo-500' : 'text-gray-400 group-hover:text-gray-500'} mr-3 h-6 w-6`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
            )
        },
        
        // Devoluciones - Para todos
        {
            name: 'Devoluciones',
            path: '/devoluciones',
            icon: (active) => (
                <svg className={`${active ? 'text-indigo-500' : 'text-gray-400 group-hover:text-gray-500'} mr-3 h-6 w-6`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2z" />
                </svg>
            )
        },
        
        // Farmacias - Solo para ADMIN
        isAdmin && {
            name: 'Farmacias',
            path: '/farmacias',
            icon: (active) => (
                <svg className={`${active ? 'text-indigo-500' : 'text-gray-400 group-hover:text-gray-500'} mr-3 h-6 w-6`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
            )
        },

        // Usuarios - Solo para ADMIN
        isAdmin && {
            name: 'Usuarios',
            path: '/usuarios',
            icon: (active) => (
                <svg className={`${active ? 'text-indigo-500' : 'text-gray-400 group-hover:text-gray-500'} mr-3 h-6 w-6`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
            )
        },
    ].filter(Boolean); // Filtra los elementos nulos (los elementos condicionados por roles)

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
                    {isFarmacia && farmaciaActiva && (
                        <div className="px-4 py-2">
                            <div className="bg-indigo-50 px-3 py-2 rounded-md">
                                <p className="text-xs text-indigo-600 font-medium">Farmacia activa:</p>
                                <p className="text-sm font-semibold text-indigo-800">{farmaciaActiva.nombre}</p>
                            </div>
                        </div>
                    )}
                    <div className="mt-5 flex-1 h-0 overflow-y-auto">
                        <nav className="px-2 space-y-1">
                            {navigationItems.map(item => (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={`${isActive(item.path) ? 'bg-indigo-100 text-indigo-900' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'} group flex items-center px-2 py-2 text-base font-medium rounded-md`}
                                    onClick={() => setSidebarOpen(false)}
                                >
                                    {item.icon(isActive(item.path))}
                                    {item.name}
                                </Link>
                            ))}
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
                    {isFarmacia && farmaciaActiva && (
                        <div className="px-4 py-2">
                            <div className="bg-indigo-50 px-3 py-2 rounded-md">
                                <p className="text-xs text-indigo-600 font-medium">Farmacia activa:</p>
                                <p className="text-sm font-semibold text-indigo-800">{farmaciaActiva.nombre}</p>
                            </div>
                        </div>
                    )}
                    <div className="mt-5 flex-grow flex flex-col">
                        <nav className="flex-1 px-2 pb-4 space-y-1">
                            {navigationItems.map(item => (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={`${isActive(item.path) ? 'bg-indigo-100 text-indigo-900' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'} group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
                                >
                                    {item.icon(isActive(item.path))}
                                    {item.name}
                                </Link>
                            ))}
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
                                    <p className="text-xs text-gray-500">
                                        {rol === 'ADMIN' ? 'Administrador' : 'Usuario de farmacia'}
                                    </p>
                                    <button
                                        onClick={handleLogout}
                                        className="text-xs font-medium text-red-500 hover:text-red-700 mt-1"
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