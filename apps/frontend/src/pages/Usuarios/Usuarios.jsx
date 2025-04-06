import React, { useState, useEffect } from 'react';

const Usuarios = () => {
  // Estados principales
  const [usuarios, setUsuarios] = useState([]);
  const [farmacias, setFarmacias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalError, setModalError] = useState(null);
  
  // Estado para nuevo usuario
  const [nuevoUsuario, setNuevoUsuario] = useState({
    nombre: '',
    email: '',
    password: '',
    rol: 'FARMACIA',
    farmaciaId: ''
  });

  // Estado para edición de usuario
  const [editingUserId, setEditingUserId] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  // Función para cargar usuarios desde el backend
  const fetchUsuarios = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No se encontró token de autenticación');
      }

      const response = await fetch('/api/usuarios', {
        method: 'GET',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error al obtener usuarios: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.status === 'success' && data.data && data.data.usuarios) {
        setUsuarios(data.data.usuarios);
      } else {
        setUsuarios([]);
      }

      // También cargar farmacias para el selector
      const farmaciasResponse = await fetch('/api/farmacias', {
        method: 'GET',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (farmaciasResponse.ok) {
        const farmaciasData = await farmaciasResponse.json();
        if (farmaciasData.status === 'success' && farmaciasData.data && farmaciasData.data.farmacias) {
          setFarmacias(farmaciasData.data.farmacias);
        }
      }

      setLoading(false);
    } catch (err) {
      console.error('Error al obtener usuarios:', err);
      setError(err.message || 'Error al cargar usuarios');
      setLoading(false);
    }
  };

  // Efecto para cargar datos al inicio
  useEffect(() => {
    fetchUsuarios();
  }, []);

  // Manejar cambios en el formulario de nuevo usuario
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setModalError(null); // Limpiar errores previos
    setNuevoUsuario(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Abrir modal para editar usuario
  const handleEditClick = (usuario) => {
    setEditingUserId(usuario.id);
    setNuevoUsuario({
      nombre: usuario.nombre || '',
      email: usuario.email || '',
      password: '', // No mostrar contraseña actual por seguridad
      rol: usuario.rol || 'FARMACIA',
      farmaciaId: usuario.farmaciaActivaId || usuario.farmacias?.[0]?.id || ''
    });
    setIsModalOpen(true);
  };

  // Abrir modal para nuevo usuario
  const handleNewUserClick = () => {
    setEditingUserId(null);
    setNuevoUsuario({
      nombre: '',
      email: '',
      password: '',
      rol: 'FARMACIA',
      farmaciaId: ''
    });
    setIsModalOpen(true);
  };

  // Confirmar eliminación de usuario
  const handleDeleteClick = (usuario) => {
    setUserToDelete(usuario);
    setShowDeleteConfirm(true);
  };

  // Ejecutar eliminación de usuario
  const confirmDelete = async () => {
    if (!userToDelete) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/usuarios/${userToDelete.id}`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al eliminar usuario');
      }

      // Actualizar lista
      fetchUsuarios();
      setShowDeleteConfirm(false);
      setUserToDelete(null);
    } catch (err) {
      console.error('Error al eliminar usuario:', err);
      alert(err.message || 'Error al eliminar usuario');
    }
  };

  // Enviar nuevo usuario o actualizar existente
  const handleSubmit = async (e) => {
    e.preventDefault();
    setModalError(null);

    // Validación básica
    if (!nuevoUsuario.nombre || !nuevoUsuario.email || (!editingUserId && !nuevoUsuario.password)) {
      setModalError('Los campos nombre, email y contraseña son obligatorios');
      return;
    }

    if (nuevoUsuario.rol === 'FARMACIA' && !nuevoUsuario.farmaciaId) {
      setModalError('Debe seleccionar una farmacia para usuarios de tipo FARMACIA');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      // Preparar datos a enviar
      const userData = { ...nuevoUsuario };
      
      // Si estamos editando y no se cambió la contraseña, no la enviamos
      if (editingUserId && !userData.password) {
        delete userData.password;
      }

      // URL y método según si es creación o edición
      const url = editingUserId ? `/api/usuarios/${editingUserId}` : '/api/usuarios';
      const method = editingUserId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });

      if (!response.ok) {
        const responseData = await response.json();
        throw new Error(responseData.message || `Error al ${editingUserId ? 'actualizar' : 'crear'} usuario`);
      }

      // Resetear formulario y cerrar modal
      setNuevoUsuario({
        nombre: '',
        email: '',
        password: '',
        rol: 'FARMACIA',
        farmaciaId: ''
      });
      setIsModalOpen(false);
      setEditingUserId(null);
      
      // Actualizar lista
      fetchUsuarios();
    } catch (err) {
      console.error('Error en operación de usuario:', err);
      setModalError(err.message || 'Error en la operación');
    }
  };

  // Estado de carga
  if (loading && !usuarios.length) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
        <p className="text-gray-600 text-xl ml-3">Cargando usuarios...</p>
      </div>
    );
  }

  // Estado de error
  if (error && !usuarios.length) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-red-50 border border-red-500 text-red-700 px-4 py-3 rounded-lg max-w-md w-full">
          <div className="flex justify-between items-center">
            <span className="block sm:inline">{error}</span>
            <button 
              onClick={fetchUsuarios} 
              className="ml-4 bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600 transition"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="container mx-auto max-w-7xl">
        {/* Encabezado */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Usuarios</h1>
          <button 
            onClick={handleNewUserClick}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center space-x-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            <span>Nuevo Usuario</span>
          </button>
        </div>

        {/* Tabla de Usuarios */}
        {usuarios.length > 0 ? (
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nombre
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rol
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Farmacia
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {usuarios.map((usuario) => (
                    <tr key={usuario.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {usuario.nombre}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {usuario.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          usuario.rol === 'ADMIN' 
                            ? 'bg-purple-100 text-purple-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {usuario.rol}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {usuario.farmaciaActiva?.nombre || 
                         (usuario.farmacias && usuario.farmacias.length > 0 
                           ? usuario.farmacias[0].nombre 
                           : 'N/A')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEditClick(usuario)}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleDeleteClick(usuario)}
                            className="text-red-600 hover:text-red-900"
                            disabled={usuario.rol === 'ADMIN'} // Proteger admin
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-white shadow-md rounded-lg p-6 text-center">
            <p className="text-gray-500">No hay usuarios registrados</p>
          </div>
        )}

        {/* Modal para nuevo/editar usuario */}
        {isModalOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
            onClick={() => setIsModalOpen(false)}
          >
            <div 
              className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 m-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingUserId ? 'Editar Usuario' : 'Crear Nuevo Usuario'}
                </h2>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {modalError && (
                <div className="mb-4 bg-red-50 border border-red-500 text-red-700 px-4 py-3 rounded-lg">
                  {modalError}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    id="nombre"
                    name="nombre"
                    value={nuevoUsuario.nombre}
                    onChange={handleInputChange}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={nuevoUsuario.email}
                    onChange={handleInputChange}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    Contraseña {editingUserId ? '(dejar en blanco para mantener actual)' : '*'}
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={nuevoUsuario.password}
                    onChange={handleInputChange}
                    required={!editingUserId}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                  />
                </div>

                <div>
                  <label htmlFor="rol" className="block text-sm font-medium text-gray-700 mb-1">
                    Rol *
                  </label>
                  <select
                    id="rol"
                    name="rol"
                    value={nuevoUsuario.rol}
                    onChange={handleInputChange}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                  >
                    <option value="ADMIN">Administrador</option>
                    <option value="FARMACIA">Usuario de Farmacia</option>
                  </select>
                </div>

                {nuevoUsuario.rol === 'FARMACIA' && (
                  <div>
                    <label htmlFor="farmaciaId" className="block text-sm font-medium text-gray-700 mb-1">
                      Farmacia *
                    </label>
                    <select
                      id="farmaciaId"
                      name="farmaciaId"
                      value={nuevoUsuario.farmaciaId}
                      onChange={handleInputChange}
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                    >
                      <option value="">Seleccione una farmacia</option>
                      {farmacias.map(farmacia => (
                        <option key={farmacia.id} value={farmacia.id}>
                          {farmacia.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                  >
                    {editingUserId ? 'Actualizar' : 'Guardar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal de confirmación de eliminación */}
        {showDeleteConfirm && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
            onClick={() => setShowDeleteConfirm(false)}
          >
            <div 
              className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 m-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-bold text-gray-900 mb-4">Confirmar eliminación</h2>
              <p className="text-gray-700 mb-6">
                ¿Está seguro que desea eliminar al usuario <span className="font-semibold">{userToDelete?.nombre}</span>?
                Esta acción no se puede deshacer.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Usuarios;