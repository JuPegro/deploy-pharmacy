// apps/backend/scripts/crear-usuarios.js
const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function crearUsuarios() {
  try {
    // Verificar si ya existen usuarios
    const usuariosExistentes = await prisma.usuario.findMany();
    
    if (usuariosExistentes.length > 0) {
      console.log('Ya existen usuarios en la base de datos:');
      usuariosExistentes.forEach(usuario => {
        console.log(`- ${usuario.nombre} (${usuario.email}) [${usuario.rol}]`);
      });
      
      const adminUser = usuariosExistentes.find(u => u.rol === 'ADMIN');
      const farmaciaUser = usuariosExistentes.find(u => u.rol === 'FARMACIA');
      
      if (adminUser && farmaciaUser) {
        console.log('\nPuedes usar estas credenciales para iniciar sesión:');
        console.log('- Admin: admin@farmacia.com / admin123');
        console.log('- Farmacia: farmacia@farmacia.com / farmacia123');
        return;
      }
    }
    
    console.log('Creando usuarios iniciales...');
    
    // Encriptar contraseñas
    const salt = await bcrypt.genSalt(10);
    const adminPassword = await bcrypt.hash('admin123', salt);
    const farmaciaPassword = await bcrypt.hash('farmacia123', salt);

    // Crear usuario administrador
    const admin = await prisma.usuario.create({
      data: {
        nombre: 'Administrador Principal',
        email: 'admin@farmacia.com',
        password: adminPassword,
        rol: 'ADMIN'
      }
    });

    console.log('Usuario administrador creado:', {
      id: admin.id,
      nombre: admin.nombre,
      email: admin.email,
      rol: admin.rol
    });

    // Obtener una farmacia para asignar al usuario de farmacia
    const farmacias = await prisma.farmacia.findMany({
      take: 1
    });
    
    // Si no hay farmacias, crear una farmacia por defecto
    let farmaciaId;
    if (farmacias.length === 0) {
      console.log('No se encontraron farmacias. Creando una farmacia por defecto...');
      const nuevaFarmacia = await prisma.farmacia.create({
        data: {
          nombre: "Farmacia Principal",
          direccion: "Calle Principal #123",
          latitud: 18.4861,
          longitud: -69.9312
        }
      });
      farmaciaId = nuevaFarmacia.id;
      console.log(`Farmacia creada: ${nuevaFarmacia.nombre} (ID: ${farmaciaId})`);
    } else {
      farmaciaId = farmacias[0].id;
    }
    
    // Crear usuario de farmacia y asignarle la farmacia
    const farmacia = await prisma.usuario.create({
      data: {
        nombre: 'Encargado Farmacia',
        email: 'farmacia@farmacia.com',
        password: farmaciaPassword,
        rol: 'FARMACIA',
        farmacias: {
          connect: [{ id: farmaciaId }]
        },
        farmaciaActiva: {
          connect: { id: farmaciaId }
        }
      }
    });

    console.log('Usuario de farmacia creado:', {
      id: farmacia.id,
      nombre: farmacia.nombre,
      email: farmacia.email,
      rol: farmacia.rol,
      farmaciaActivaId: farmaciaId
    });

    console.log('\nUsuarios creados exitosamente. Puedes usar estas credenciales para iniciar sesión:');
    console.log('- Admin: admin@farmacia.com / admin123');
    console.log('- Farmacia: farmacia@farmacia.com / farmacia123');
    
  } catch (error) {
    console.error('Error al crear usuarios:', error);
    
    // Si el error es por usuarios que ya existen, mostrar mensaje amigable
    if (error.code === 'P2002') {
      console.log('Los usuarios ya existen en la base de datos. Si quieres recrearlos, elimínalos primero.');
    }
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