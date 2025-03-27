// src/components/layout/MainLayout.jsx
import React, { useState } from 'react';

// Mock icons as SVG components
const LayoutDashboard = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="7" height="9" x="3" y="3" rx="1"/>
    <rect width="7" height="5" x="14" y="3" rx="1"/>
    <rect width="7" height="9" x="14" y="12" rx="1"/>
    <rect width="7" height="5" x="3" y="16" rx="1"/>
  </svg>
);

const Pill = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/>
    <path d="m8.5 8.5 7 7"/>
  </svg>
);

const Clipboard = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="8" height="4" x="8" y="2" rx="1" ry="1"/>
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
  </svg>
);

const ShoppingCart = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="8" cy="21" r="1"/>
    <circle cx="19" cy="21" r="1"/>
    <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>
  </svg>
);

const Menu = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="4" x2="20" y1="12" y2="12"/>
    <line x1="4" x2="20" y1="6" y2="6"/>
    <line x1="4" x2="20" y1="18" y2="18"/>
  </svg>
);

const X = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" x2="6" y1="6" y2="18"/>
    <line x1="6" x2="18" y1="6" y2="18"/>
  </svg>
);

const MainLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Mock location to simulate current path
  const location = {
    pathname: window.location.pathname
  };

  const menuItems = [
    { 
      path: '/dashboard', 
      icon: LayoutDashboard, 
      label: 'Dashboard' 
    },
    { 
      path: '/movimientos-inventario', 
      icon: Clipboard, 
      label: 'Movimientos Inventario' 
    },
    { 
      path: '/medicamentos', 
      icon: Pill, 
      label: 'Medicamentos' 
    },
    { 
      path: '/ventas', 
      icon: ShoppingCart, 
      label: 'Ventas' 
    }
  ];

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Mobile Sidebar Toggle */}
      <button 
        className="fixed top-4 left-4 z-50 md:hidden"
        onClick={toggleSidebar}
      >
        {isSidebarOpen ? <X /> : <Menu />}
      </button>

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-lg 
        transform transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-8 text-blue-600">
            Farmacia App
          </h1>
          
          <nav>
            {menuItems.map((item) => (
              <a 
                key={item.path}
                href={item.path}
                className={`
                  flex items-center p-3 mb-2 rounded-lg transition-colors 
                  ${location.pathname === item.path 
                    ? 'bg-blue-100 text-blue-600' 
                    : 'hover:bg-gray-100 text-gray-700'
                  }
                `}
                onClick={() => setIsSidebarOpen(false)}
              >
                <item.icon className="mr-3" />
                <span>{item.label}</span>
              </a>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content Area */}
      <div 
        className="flex-1 overflow-y-auto p-6 md:p-10"
        onClick={() => isSidebarOpen && setIsSidebarOpen(false)}
      >
        {/* Overlay for mobile when sidebar is open */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black opacity-50 z-30 md:hidden"
            onClick={toggleSidebar}
          />
        )}
        
        {/* Page Content Placeholder */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-4">Contenido de la Página</h2>
          <p>Selecciona una opción del menú para comenzar.</p>
        </div>
      </div>
    </div>
  );
};

export default MainLayout;