// apps/backend/scripts/crear-usuarios.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

// Función para generar contraseña segura
const generarContrasena = async () => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash('farmacia123', salt);
};

// Definir usuarios base
const usuariosBase = [
  {
    nombre: "Administrador Principal",
    email: "admin@farmacia.com",
    rol: "ADMIN"
  },
  {
    nombre: "Juan Pérez",
    email: "juan.perez@farmacia.com",
    rol: "FARMACIA"
  },
  {
    nombre: "María González",
    email: "maria.gonzalez@farmacia.com",
    rol: "FARMACIA"
  },
  {
    nombre: "Carlos Rodríguez",
    email: "carlos.rodriguez@farmacia.com",
    rol: "FARMACIA"
  },
  {
    nombre: "Ana Martínez",
    email: "ana.martinez@farmacia.com",
    rol: "FARMACIA"
  }
];

async function crearUsuarios() {
  try {
    console.log("Iniciando creación de usuarios...");
    
    // Obtener farmacias existentes
    const farmacias = await prisma.farmacia.findMany();
    
    if (farmacias.length === 0) {
      throw new Error("No hay farmacias disponibles. Ejecute primero el script de farmacias.");
    }

    // Verificar usuarios existentes
    const usuariosExistentes = await prisma.usuario.findMany({
      select: { email: true }
    });
    
    const emailsExistentes = new Set(usuariosExistentes.map(u => u.email));
    
    // Crear contraseña hasheada
    const contrasenaHasheada = await generarContrasena();
    
    // Crear usuarios
    const usuariosCreados = [];
    
    for (const usuarioBase of usuariosBase) {
      // Saltar si el email ya existe
      if (emailsExistentes.has(usuarioBase.email)) {
        console.log(`Usuario con email ${usuarioBase.email} ya existe. Saltando.`);
        continue;
      }

      // Para usuarios de farmacia, asignar una farmacia aleatoria
      const datosUsuario = usuarioBase.rol === 'FARMACIA' 
        ? {
            ...usuarioBase,
            password: contrasenaHasheada,
            farmacias: {
              connect: [{ id: farmacias[Math.floor(Math.random() * farmacias.length)].id }]
            },
            farmaciaActiva: {
              connect: { id: farmacias[Math.floor(Math.random() * farmacias.length)].id }
            }
          }
        : {
            ...usuarioBase,
            password: contrasenaHasheada
          };

      // Crear usuario
      const usuarioCreado = await prisma.usuario.create({
        data: datosUsuario,
        include: {
          farmacias: true,
          farmaciaActiva: true
        }
      });

      usuariosCreados.push(usuarioCreado);
      console.log(`Usuario creado: ${usuarioCreado.nombre} (${usuarioCreado.email})`);
    }

    // Generar usuarios adicionales de farmacia
    const usuariosAdicionales = [
      {
        nombre: "Laura Sánchez",
        email: "laura.sanchez@farmacia.com",
        rol: "FARMACIA"
      },
      {
        nombre: "Pedro Ramírez",
        email: "pedro.ramirez@farmacia.com",
        rol: "FARMACIA"
      }
    ];

    for (const usuarioAdicional of usuariosAdicionales) {
      // Saltar si el email ya existe
      if (emailsExistentes.has(usuarioAdicional.email)) {
        console.log(`Usuario con email ${usuarioAdicional.email} ya existe. Saltando.`);
        continue;
      }

      const usuarioAdicionalCreado = await prisma.usuario.create({
        data: {
          ...usuarioAdicional,
          password: contrasenaHasheada,
          farmacias: {
            connect: [{ id: farmacias[Math.floor(Math.random() * farmacias.length)].id }]
          },
          farmaciaActiva: {
            connect: { id: farmacias[Math.floor(Math.random() * farmacias.length)].id }
          }
        },
        include: {
          farmacias: true,
          farmaciaActiva: true
        }
      });

      usuariosCreados.push(usuarioAdicionalCreado);
      console.log(`Usuario adicional creado: ${usuarioAdicionalCreado.nombre} (${usuarioAdicionalCreado.email})`);
    }

    console.log(`Creación de usuarios completada. Se crearon ${usuariosCreados.length} usuarios.`);
    
    return usuariosCreados;

  } catch (error) {
    console.error('Error al crear usuarios:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar la función
crearUsuarios()
  .then(() => {
    console.log('Proceso completado exitosamente.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error en el proceso:', error);
    process.exit(1);
  });