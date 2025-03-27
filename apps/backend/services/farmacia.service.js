const { prisma } = require('../config');
const AppError = require('../utils/errorHandler');

exports.crearFarmacia = async (farmaciaData) => {
  // Validaciones adicionales
  if (!farmaciaData.nombre || !farmaciaData.direccion) {
    throw new AppError('Nombre y dirección son requeridos', 400);
  }

  // Validar coordenadas
  if (farmaciaData.latitud === undefined || farmaciaData.longitud === undefined) {
    throw new AppError('Latitud y longitud son requeridas', 400);
  }

  return await prisma.farmacia.create({
    data: {
      nombre: farmaciaData.nombre,
      direccion: farmaciaData.direccion,
      latitud: farmaciaData.latitud,
      longitud: farmaciaData.longitud
    }
  });
};

exports.obtenerFarmacias = async (opciones = {}) => {
  const { 
    pagina = 1, 
    limite = 10, 
    busqueda = '',
    ordenarPor = 'nombre',
    ordenDireccion = 'asc'
  } = opciones;

  // Calcular offset para paginación
  const skip = (pagina - 1) * limite;

  // Preparar condiciones de búsqueda
  const where = busqueda 
    ? {
        OR: [
          { nombre: { contains: busqueda, mode: 'insensitive' } },
          { direccion: { contains: busqueda, mode: 'insensitive' } }
        ]
      }
    : {};

  // Obtener farmacias con paginación y opciones de búsqueda
  const [totalFarmacias, farmacias] = await Promise.all([
    prisma.farmacia.count({ where }),
    prisma.farmacia.findMany({
      where,
      skip,
      take: limite,
      include: {
        usuarios: {
          select: {
            id: true,
            nombre: true,
            email: true
          }
        },
        inventarios: {
          select: {
            id: true,
            stock: true,
            medicamento: {
              select: {
                nombre: true
              }
            }
          }
        },
        _count: {
          select: { 
            usuarios: true,
            inventarios: true,
            ventas: true
          }
        }
      },
      orderBy: {
        [ordenarPor]: ordenDireccion
      }
    })
  ]);

  // Calcular total de páginas
  const totalPaginas = Math.ceil(totalFarmacias / limite);

  return {
    farmacias,
    paginacion: {
      paginaActual: pagina,
      totalPaginas,
      totalFarmacias,
      limitePorPagina: limite
    }
  };
};

exports.obtenerFarmacia = async (id) => {
  const farmacia = await prisma.farmacia.findUnique({
    where: { id },
    include: {
      usuarios: {
        select: {
          id: true,
          nombre: true,
          email: true
        }
      },
      inventarios: {
        include: {
          medicamento: true
        }
      },
      ventas: {
        include: {
          inventario: {
            include: {
              medicamento: true
            }
          }
        }
      },
      _count: {
        select: { 
          usuarios: true,
          inventarios: true,
          ventas: true
        }
      }
    }
  });

  if (!farmacia) {
    throw new AppError('No se encontró la farmacia', 404);
  }

  return farmacia;
};

exports.actualizarFarmacia = async (id, farmaciaData) => {
  // Verificar existencia de la farmacia
  const farmaciaExistente = await prisma.farmacia.findUnique({
    where: { id }
  });

  if (!farmaciaExistente) {
    throw new AppError('No se encontró la farmacia', 404);
  }

  // Validaciones
  if (farmaciaData.nombre && farmaciaData.nombre.trim() === '') {
    throw new AppError('El nombre no puede estar vacío', 400);
  }

  return await prisma.farmacia.update({
    where: { id },
    data: {
      nombre: farmaciaData.nombre,
      direccion: farmaciaData.direccion,
      latitud: farmaciaData.latitud,
      longitud: farmaciaData.longitud
    }
  });
};

exports.eliminarFarmacia = async (id) => {
  // Verificar dependencias antes de eliminar
  const [inventarios, usuarios, ventas] = await Promise.all([
    prisma.inventario.count({ where: { farmaciaId: id } }),
    prisma.usuario.count({ where: { farmacias: { some: { id } } } }),
    prisma.venta.count({ where: { farmaciaId: id } })
  ]);

  if (inventarios > 0) {
    throw new AppError('No se puede eliminar. La farmacia tiene inventarios asociados.', 400);
  }

  if (usuarios > 0) {
    throw new AppError('No se puede eliminar. La farmacia tiene usuarios asociados.', 400);
  }

  if (ventas > 0) {
    throw new AppError('No se puede eliminar. La farmacia tiene ventas registradas.', 400);
  }

  // Eliminar farmacia
  return await prisma.farmacia.delete({
    where: { id }
  });
};