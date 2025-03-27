// create-users.js
const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createUsers() {
  try {
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

    // Crear usuario de farmacia
    const farmacia = await prisma.usuario.create({
      data: {
        nombre: 'Encargado Farmacia',
        email: 'farmacia@farmacia.com',
        password: farmaciaPassword,
        rol: 'FARMACIA'
      }
    });

    console.log('Usuario de farmacia creado:', {
      id: farmacia.id,
      nombre: farmacia.nombre,
      email: farmacia.email,
      rol: farmacia.rol
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

createUsers();