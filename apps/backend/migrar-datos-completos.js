// HAINAMOSA

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');

// Instancia del cliente Prisma para interactuar con la base de datos
const prisma = new PrismaClient();

// Script modificado para migrar únicamente los datos de la farmacia Hainamosa

// Lee y parsea el archivo JSON
function parsearDatosFarmacia(archivo) {
  const filePath = path.join(__dirname, archivo);
  const fileContent = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(fileContent);
}

// Función para generar contraseña hash
async function generarContrasena() {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash('farmacia123', salt);
}

// Función para limpiar caracteres especiales
function limpiarTexto(texto) {
  return texto.replace(/Ã¡/g, 'á')
              .replace(/Ã©/g, 'é')
              .replace(/Ã­/g, 'í')
              .replace(/Ã³/g, 'ó')
              .replace(/Ãº/g, 'ú')
              .replace(/Ã±/g, 'ñ')
              .replace(/Ã"/g, 'Ó')
              .replace(/Ã"/g, 'Ñ')
              .replace(/Ã­/g, 'í')
              .replace(/Ã³/g, 'ó');
}

// Función para obtener categoría de medicamento
function obtenerCategoria(nombre) {
  const categorias = {
    'Paracetamol': 'Analgésicos',
    'Ibuprofeno': 'Antiinflamatorios',
    'acetilsalicílico': 'Analgésicos',
    'Diclofenaco': 'Antiinflamatorios',
    'Naproxeno': 'Antiinflamatorios',
    'Amoxicilina': 'Antibióticos',
    'Azitromicina': 'Antibióticos',
    'Ciprofloxacino': 'Antibióticos',
    'Cefalexina': 'Antibióticos',
    'Clindamicina': 'Antibióticos',
    'Losartán': 'Antihipertensivos',
    'Amlodipino': 'Antihipertensivos',
    'Hidroclorotiazida': 'Diuréticos',
    'Enalapril': 'Antihipertensivos',
    'Metoprolol': 'Betabloqueantes',
    'Metformina': 'Antidiabéticos',
    'Glibenclamida': 'Antidiabéticos',
    'Insulina': 'Antidiabéticos',
    'Sitagliptina': 'Antidiabéticos',
    'Glimepirida': 'Antidiabéticos',
    'Clotrimazol': 'Antimicóticos',
    'Miconazol': 'Antimicóticos',
    'Hidrocortisona': 'Corticosteroides',
    'Betametasona': 'Corticosteroides',
    'retinoico': 'Dermatológicos',
    'Vitamina': 'Vitaminas y suplementos',
    'Hierro': 'Vitaminas y suplementos',
    'fólico': 'Vitaminas y suplementos',
    'Complejo B': 'Vitaminas y suplementos',
    'Salbutamol': 'Broncodilatadores',
    'Sales de rehidratación': 'Rehidratación',
    'Omeprazol': 'Inhibidores de la bomba de protones',
    'Loratadina': 'Antihistamínicos',
    'Prednisona': 'Corticosteroides',
    'Levotiroxina': 'Hormonas tiroideas',
    'Atorvastatina': 'Estatinas',
    'valproico': 'Antiepilépticos',
    'Carbamazepina': 'Antiepilépticos',
    'Furosemida': 'Diuréticos',
    'Heparina': 'Anticoagulantes',
    'Warfarina': 'Anticoagulantes',
    'Diazepam': 'Ansiolíticos',
    'Guaifenesina': 'Expectorantes',
    'Pseudoefedrina': 'Descongestionantes'
  };

  for (const [key, categoria] of Object.entries(categorias)) {
    if (nombre.toLowerCase().includes(key.toLowerCase())) return categoria;
  }
  
  return 'Otros medicamentos';
}

// Función para encontrar o crear usuario
async function encontrarOCrearUsuario(datos) {
  try {
    // Primero, intentar encontrar por email
    let usuario = await prisma.usuario.findUnique({
      where: { email: datos.email }
    });

    // Si no existe, crear
    if (!usuario) {
      const hashedPassword = await generarContrasena();
      usuario = await prisma.usuario.create({
        data: {
          ...datos,
          password: hashedPassword
        }
      });
    }

    return usuario;
  } catch (error) {
    // Si hay un error único (como email duplicado), buscar nuevamente
    if (error.code === 'P2002') {
      return await prisma.usuario.findUnique({
        where: { email: datos.email }
      });
    }
    throw error;
  }
}

// Función para encontrar o crear farmacia
async function encontrarOCrearFarmacia(datos) {
  try {
    // Primero, intentar encontrar por nombre
    let farmacia = await prisma.farmacia.findFirst({
      where: { nombre: datos.nombre }
    });

    // Si no existe, crear
    if (!farmacia) {
      farmacia = await prisma.farmacia.create({
        data: datos
      });
    }

    return farmacia;
  } catch (error) {
    // Si hay un error, buscar nuevamente
    if (error.code === 'P2002') {
      return await prisma.farmacia.findFirst({
        where: { nombre: datos.nombre }
      });
    }
    throw error;
  }
}

async function migrarDatosFarmacia(nombreFarmacia, archivoFarmacia, ubicacion, correos) {
  try {
    console.log(`Iniciando migración de datos de ${nombreFarmacia}...`);

    // 1. Crear farmacia base
    const farmacia = await encontrarOCrearFarmacia({
      nombre: `Farmacia ${nombreFarmacia}`,
      direccion: `Barrio ${nombreFarmacia}, Santo Domingo Este`,
      latitud: ubicacion.latitud,
      longitud: ubicacion.longitud
    });

    // 2. Crear usuario administrador y de farmacia
    const adminUsuario = await encontrarOCrearUsuario({
      nombre: `Administrador ${nombreFarmacia}`,
      email: correos.admin,
      rol: 'ADMIN'
    });

    const farmaciaUsuario = await encontrarOCrearUsuario({
      nombre: correos.nombreUsuario,
      email: correos.usuario,
      rol: 'FARMACIA'
    });

    // Asignar farmacia al usuario si aún no lo está
    if (farmaciaUsuario) {
      const usuarioConFarmacia = await prisma.usuario.update({
        where: { id: farmaciaUsuario.id },
        data: {
          farmacias: {
            connect: [{ id: farmacia.id }]
          },
          farmaciaActiva: {
            connect: { id: farmacia.id }
          }
        }
      });
    }

    // 3. Procesar datos de la farmacia
    const datosFarmacia = parsearDatosFarmacia(archivoFarmacia);

    // 4. Crear medicamentos únicos
    const medicamentosUnicos = {};
    datosFarmacia.forEach(item => {
      const nombreLimpio = limpiarTexto(item.Producto);
      if (!medicamentosUnicos[nombreLimpio]) {
        medicamentosUnicos[nombreLimpio] = {
          nombre: nombreLimpio,
          codigo: `${nombreFarmacia.toUpperCase()}${item.Codigo}`,
          categoria: obtenerCategoria(nombreLimpio),
          presentacion: limpiarTexto(item.Presentacion),
          descripcion: `Medicamento de ${obtenerCategoria(nombreLimpio)}`
        };
      }
    });

    const medicamentosCreados = {};
    for (const [nombre, medData] of Object.entries(medicamentosUnicos)) {
      // Buscar si ya existe un medicamento con este código
      let medicamento = await prisma.medicamento.findUnique({
        where: { codigo: medData.codigo }
      });

      // Si no existe, crear
      if (!medicamento) {
        medicamento = await prisma.medicamento.create({
          data: medData
        });
      }
      
      medicamentosCreados[nombre] = medicamento;
    }

    // 5. Crear inventarios y generar ventas
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

    for (const item of datosFarmacia) {
      const nombreLimpio = limpiarTexto(item.Producto);
      const medicamento = medicamentosCreados[nombreLimpio];
      
      // Solo crear inventario si tiene stock
      if (item.Entrada > 0) {
        // Buscar si ya existe un inventario para este medicamento en esta farmacia
        let inventario = await prisma.inventario.findFirst({
          where: {
            farmaciaId: farmacia.id,
            medicamentoId: medicamento.id
          }
        });

        // Si no existe, crear
        if (!inventario) {
          inventario = await prisma.inventario.create({
            data: {
              farmaciaId: farmacia.id,
              medicamentoId: medicamento.id,
              stock: item.Entrada,
              stockMinimo: Math.floor(item.Entrada * 0.15), // 15% del stock inicial como mínimo
              precio: Math.floor(Math.random() * 4000) + 1300, // Precio aleatorio entre 1300 y 5300
              vencimiento: new Date(2025, 11, 31) // Fecha de vencimiento a fin de 2025
            }
          });
        }

        // Generar ventas
        if (item.Ventas > 0) {
          const mesIndex = meses.indexOf(item.Mes);
          const fechaVenta = new Date(2024, mesIndex, Math.floor(Math.random() * 28) + 1);

          // Verificar si ya existe una venta similar
          const ventaExistente = await prisma.venta.findFirst({
            where: {
              inventarioId: inventario.id,
              fecha: fechaVenta,
              cantidad: item.Ventas
            }
          });

          if (!ventaExistente) {
            const venta = await prisma.venta.create({
              data: {
                cantidad: item.Ventas,
                farmaciaId: farmacia.id,
                inventarioId: inventario.id,
                precioUnitario: inventario.precio,
                fecha: fechaVenta,
                mes: mesIndex + 1,
                anio: 2024,
                usuarioId: farmaciaUsuario.id
              }
            });

            // Registrar movimiento de inventario
            await prisma.movimientoInventario.create({
              data: {
                tipo: 'SALIDA',
                cantidad: item.Ventas,
                inventarioId: inventario.id,
                farmaciaId: farmacia.id,
                usuarioId: farmaciaUsuario.id,
                fecha: fechaVenta,
                observacion: `Venta de ${nombreLimpio}`
              }
            });

            // Generar algunas devoluciones aleatorias
            if (Math.random() < 0.10) { // 10% de probabilidad de devolución
              const cantidadDevolucion = Math.floor(item.Ventas * 0.08); // 8% de la venta
              if (cantidadDevolucion > 0) {
                const devolucionExistente = await prisma.devolucion.findFirst({
                  where: {
                    inventarioId: inventario.id,
                    cantidad: cantidadDevolucion,
                    fecha: fechaVenta
                  }
                });

                if (!devolucionExistente) {
                  await prisma.devolucion.create({
                    data: {
                      cantidad: cantidadDevolucion,
                      motivo: 'Producto próximo a vencer',
                      farmaciaId: farmacia.id,
                      inventarioId: inventario.id,
                      estado: 'PENDIENTE',
                      usuarioId: farmaciaUsuario.id,
                      fecha: new Date(2024, mesIndex, Math.floor(Math.random() * 28) + 1),
                      mes: mesIndex + 1,
                      anio: 2024
                    }
                  });
                }
              }
            }
          }
        }
      }
    }

    // 6. Generar algunas reservas aleatorias
    const inventarios = await prisma.inventario.findMany({
      where: { 
        farmaciaId: farmacia.id,
        stock: { gt: 0 } 
      }
    });

    // Nombres y apellidos dominicanos comunes para las reservas
    const nombres = ['Antonio', 'Carmen', 'Roberto', 'Diana', 'Eduardo', 'Fátima', 'Ricardo', 'Alicia', 'Santiago', 'Claudia', 'Jesús', 'Miriam', 'Jorge', 'Isabel', 'Manuel'];
    const apellidos = ['Torres', 'Valdez', 'Guerrero', 'Morales', 'Figueroa', 'Almonte', 'Núñez', 'Sánchez', 'Castillo', 'Ortiz', 'Vargas', 'Féliz', 'Espinal', 'Rosario', 'Matos'];

    // Generar 18 reservas aleatorias
    for (let i = 0; i < 18; i++) {
      const inventario = inventarios[Math.floor(Math.random() * inventarios.length)];
      const nombreCliente = `${nombres[Math.floor(Math.random() * nombres.length)]} ${apellidos[Math.floor(Math.random() * apellidos.length)]}`;
      
      // Verificar si ya existe una reserva similar
      const reservaExistente = await prisma.reserva.findFirst({
        where: {
          inventarioId: inventario.id,
          nombreCliente: nombreCliente
        }
      });

      if (!reservaExistente) {
        await prisma.reserva.create({
          data: {
            farmaciaId: farmacia.id,
            inventarioId: inventario.id,
            nombreCliente: nombreCliente,
            telefonoCliente: `849-${Math.floor(100 + Math.random() * 900)}-${Math.floor(1000 + Math.random() * 9000)}`,
            estado: Math.random() < 0.75 ? 'PENDIENTE' : 'COMPLETADA',
            fecha: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1)
          }
        });
      }
    }

    console.log(`Migración de datos de ${nombreFarmacia} completa.`);
    return { farmacia, adminUsuario, farmaciaUsuario };

  } catch (error) {
    console.error('Error al migrar datos:', error);
    throw error;
  }
}

async function migrarHainamosa() {
  try {
    // Migrar solo Hainamosa
    await migrarDatosFarmacia('Hainamosa', 'hainamosa.txt', 
      { latitud: 18.5123, longitud: -69.8234 },
      { 
        admin: 'admin.hainamosa@farmacia.com',
        usuario: 'pedro.ramirez@farmacia.com',
        nombreUsuario: 'Pedro Ramírez'
      }
    );
    
    console.log('Proceso de migración de Hainamosa completado exitosamente.');
  } catch (error) {
    console.error('Error en el proceso de migración:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar la función
migrarHainamosa()
  .then(() => {
    console.log('Proceso completado exitosamente.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error en el proceso:', error);
    process.exit(1);
  });

// SAN ISIDRO

// apps/backend/migrar-datos-sanisidro.js
// const { PrismaClient } = require('@prisma/client');
// const bcrypt = require('bcrypt');
// const fs = require('fs');
// const path = require('path');

// const prisma = new PrismaClient();

// // Lee y parsea el archivo JSON
// function parsearDatosSanIsidro() {
//   const filePath = path.join(__dirname, 'sanisidro.txt');
//   const fileContent = fs.readFileSync(filePath, 'utf8');
//   return JSON.parse(fileContent);
// }

// // Función para generar contraseña hash
// async function generarContrasena() {
//   const salt = await bcrypt.genSalt(10);
//   return await bcrypt.hash('farmacia123', salt);
// }

// // Función para limpiar caracteres especiales
// function limpiarTexto(texto) {
//   return texto.replace(/Ã¡/g, 'á')
//               .replace(/Ã©/g, 'é')
//               .replace(/Ã­/g, 'í')
//               .replace(/Ã³/g, 'ó')
//               .replace(/Ãº/g, 'ú')
//               .replace(/Ã±/g, 'ñ')
//               .replace(/Ã"/g, 'Ó')
//               .replace(/Ã"/g, 'Ñ')
//               .replace(/Ã­/g, 'í')
//               .replace(/Ã³/g, 'ó');
// }

// // Función para obtener categoría de medicamento
// function obtenerCategoria(nombre) {
//   const categorias = {
//     'Paracetamol': 'Analgésicos',
//     'Ibuprofeno': 'Antiinflamatorios',
//     'acetilsalicílico': 'Analgésicos',
//     'Diclofenaco': 'Antiinflamatorios',
//     'Naproxeno': 'Antiinflamatorios',
//     'Amoxicilina': 'Antibióticos',
//     'Azitromicina': 'Antibióticos',
//     'Ciprofloxacino': 'Antibióticos',
//     'Cefalexina': 'Antibióticos',
//     'Clindamicina': 'Antibióticos',
//     'Losartán': 'Antihipertensivos',
//     'Amlodipino': 'Antihipertensivos',
//     'Hidroclorotiazida': 'Diuréticos',
//     'Enalapril': 'Antihipertensivos',
//     'Metoprolol': 'Betabloqueantes',
//     'Metformina': 'Antidiabéticos',
//     'Glibenclamida': 'Antidiabéticos',
//     'Insulina': 'Antidiabéticos',
//     'Sitagliptina': 'Antidiabéticos',
//     'Glimepirida': 'Antidiabéticos',
//     'Clotrimazol': 'Antimicóticos',
//     'Miconazol': 'Antimicóticos',
//     'Hidrocortisona': 'Corticosteroides',
//     'Betametasona': 'Corticosteroides',
//     'retinoico': 'Dermatológicos',
//     'Vitamina': 'Vitaminas y suplementos',
//     'Hierro': 'Vitaminas y suplementos',
//     'fólico': 'Vitaminas y suplementos',
//     'Complejo B': 'Vitaminas y suplementos',
//     'Salbutamol': 'Broncodilatadores',
//     'Sales de rehidratación': 'Rehidratación',
//     'Omeprazol': 'Inhibidores de la bomba de protones',
//     'Loratadina': 'Antihistamínicos',
//     'Prednisona': 'Corticosteroides',
//     'Levotiroxina': 'Hormonas tiroideas',
//     'Atorvastatina': 'Estatinas',
//     'valproico': 'Antiepilépticos',
//     'Carbamazepina': 'Antiepilépticos',
//     'Furosemida': 'Diuréticos',
//     'Heparina': 'Anticoagulantes',
//     'Warfarina': 'Anticoagulantes',
//     'Diazepam': 'Ansiolíticos',
//     'Guaifenesina': 'Expectorantes',
//     'Pseudoefedrina': 'Descongestionantes'
//   };

//   for (const [key, categoria] of Object.entries(categorias)) {
//     if (nombre.toLowerCase().includes(key.toLowerCase())) return categoria;
//   }
  
//   return 'Otros medicamentos';
// }

// // Función para encontrar o crear usuario
// async function encontrarOCrearUsuario(datos) {
//   try {
//     // Primero, intentar encontrar por email
//     let usuario = await prisma.usuario.findUnique({
//       where: { email: datos.email }
//     });

//     // Si no existe, crear
//     if (!usuario) {
//       const hashedPassword = await generarContrasena();
//       usuario = await prisma.usuario.create({
//         data: {
//           ...datos,
//           password: hashedPassword
//         }
//       });
//     }

//     return usuario;
//   } catch (error) {
//     // Si hay un error único (como email duplicado), buscar nuevamente
//     if (error.code === 'P2002') {
//       return await prisma.usuario.findUnique({
//         where: { email: datos.email }
//       });
//     }
//     throw error;
//   }
// }

// // Función para encontrar o crear farmacia
// async function encontrarOCrearFarmacia(datos) {
//   try {
//     // Primero, intentar encontrar por nombre
//     let farmacia = await prisma.farmacia.findFirst({
//       where: { nombre: datos.nombre }
//     });

//     // Si no existe, crear
//     if (!farmacia) {
//       farmacia = await prisma.farmacia.create({
//         data: datos
//       });
//     }

//     return farmacia;
//   } catch (error) {
//     // Si hay un error, buscar nuevamente
//     if (error.code === 'P2002') {
//       return await prisma.farmacia.findFirst({
//         where: { nombre: datos.nombre }
//       });
//     }
//     throw error;
//   }
// }

// async function migrarDatosSanIsidro() {
//   try {
//     console.log("Iniciando migración de datos de San Isidro...");

//     // 1. Crear farmacia base
//     const farmacia = await encontrarOCrearFarmacia({
//       nombre: "Farmacia San Isidro",
//       direccion: "Barrio San Isidro, Santo Domingo Este",
//       latitud: 18.4855,
//       longitud: -69.7923
//     });

//     // 2. Crear usuario administrador y de farmacia
//     const adminUsuario = await encontrarOCrearUsuario({
//       nombre: "Administrador San Isidro",
//       email: "admin.sanisidro@farmacia.com",
//       rol: 'ADMIN'
//     });

//     const farmaciaUsuario = await encontrarOCrearUsuario({
//       nombre: "María González",
//       email: "maria.gonzalez@farmacia.com",
//       rol: 'FARMACIA'
//     });

//     // Asignar farmacia al usuario si aún no lo está
//     if (farmaciaUsuario) {
//       const usuarioConFarmacia = await prisma.usuario.update({
//         where: { id: farmaciaUsuario.id },
//         data: {
//           farmacias: {
//             connect: [{ id: farmacia.id }]
//           },
//           farmaciaActiva: {
//             connect: { id: farmacia.id }
//           }
//         }
//       });
//     }

//     // 3. Procesar datos de San Isidro
//     const datosSanIsidro = parsearDatosSanIsidro();

//     // 4. Crear medicamentos únicos
//     const medicamentosUnicos = {};
//     datosSanIsidro.forEach(item => {
//       const nombreLimpio = limpiarTexto(item.Producto);
//       if (!medicamentosUnicos[nombreLimpio]) {
//         medicamentosUnicos[nombreLimpio] = {
//           nombre: nombreLimpio,
//           codigo: `SANISIDRO${item.Codigo}`,
//           categoria: obtenerCategoria(nombreLimpio),
//           presentacion: limpiarTexto(item.Presentacion),
//           descripcion: `Medicamento de ${obtenerCategoria(nombreLimpio)}`
//         };
//       }
//     });

//     const medicamentosCreados = {};
//     for (const [nombre, medData] of Object.entries(medicamentosUnicos)) {
//       // Buscar si ya existe un medicamento con este código
//       let medicamento = await prisma.medicamento.findUnique({
//         where: { codigo: medData.codigo }
//       });

//       // Si no existe, crear
//       if (!medicamento) {
//         medicamento = await prisma.medicamento.create({
//           data: medData
//         });
//       }
      
//       medicamentosCreados[nombre] = medicamento;
//     }

//     // 5. Crear inventarios y generar ventas
//     const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

//     for (const item of datosSanIsidro) {
//       const nombreLimpio = limpiarTexto(item.Producto);
//       const medicamento = medicamentosCreados[nombreLimpio];
      
//       // Solo crear inventario si tiene stock
//       if (item.Entrada > 0) {
//         // Buscar si ya existe un inventario para este medicamento en esta farmacia
//         let inventario = await prisma.inventario.findFirst({
//           where: {
//             farmaciaId: farmacia.id,
//             medicamentoId: medicamento.id
//           }
//         });

//         // Si no existe, crear
//         if (!inventario) {
//           inventario = await prisma.inventario.create({
//             data: {
//               farmaciaId: farmacia.id,
//               medicamentoId: medicamento.id,
//               stock: item.Entrada,
//               stockMinimo: Math.floor(item.Entrada * 0.15), // 15% del stock inicial como mínimo
//               precio: Math.floor(Math.random() * 4000) + 1300, // Precio aleatorio entre 1300 y 5300
//               vencimiento: new Date(2025, 11, 31) // Fecha de vencimiento a fin de 2025
//             }
//           });
//         }

//         // Generar ventas
//         if (item.Ventas > 0) {
//           const mesIndex = meses.indexOf(item.Mes);
//           const fechaVenta = new Date(2024, mesIndex, Math.floor(Math.random() * 28) + 1);

//           // Verificar si ya existe una venta similar
//           const ventaExistente = await prisma.venta.findFirst({
//             where: {
//               inventarioId: inventario.id,
//               fecha: fechaVenta,
//               cantidad: item.Ventas
//             }
//           });

//           if (!ventaExistente) {
//             const venta = await prisma.venta.create({
//               data: {
//                 cantidad: item.Ventas,
//                 farmaciaId: farmacia.id,
//                 inventarioId: inventario.id,
//                 precioUnitario: inventario.precio,
//                 fecha: fechaVenta,
//                 mes: mesIndex + 1,
//                 anio: 2024,
//                 usuarioId: farmaciaUsuario.id
//               }
//             });

//             // Registrar movimiento de inventario
//             await prisma.movimientoInventario.create({
//               data: {
//                 tipo: 'SALIDA',
//                 cantidad: item.Ventas,
//                 inventarioId: inventario.id,
//                 farmaciaId: farmacia.id,
//                 usuarioId: farmaciaUsuario.id,
//                 fecha: fechaVenta,
//                 observacion: `Venta de ${nombreLimpio}`
//               }
//             });

//             // Generar algunas devoluciones aleatorias
//             if (Math.random() < 0.10) { // 10% de probabilidad de devolución
//               const cantidadDevolucion = Math.floor(item.Ventas * 0.08); // 8% de la venta
//               if (cantidadDevolucion > 0) {
//                 const devolucionExistente = await prisma.devolucion.findFirst({
//                   where: {
//                     inventarioId: inventario.id,
//                     cantidad: cantidadDevolucion,
//                     fecha: fechaVenta
//                   }
//                 });

//                 if (!devolucionExistente) {
//                   await prisma.devolucion.create({
//                     data: {
//                       cantidad: cantidadDevolucion,
//                       motivo: 'Producto próximo a vencer',
//                       farmaciaId: farmacia.id,
//                       inventarioId: inventario.id,
//                       estado: 'PENDIENTE',
//                       usuarioId: farmaciaUsuario.id,
//                       fecha: new Date(2024, mesIndex, Math.floor(Math.random() * 28) + 1),
//                       mes: mesIndex + 1,
//                       anio: 2024
//                     }
//                   });
//                 }
//               }
//             }
//           }
//         }
//       }
//     }

//     // 6. Generar algunas reservas aleatorias
//     const inventarios = await prisma.inventario.findMany({
//       where: { 
//         farmaciaId: farmacia.id,
//         stock: { gt: 0 } 
//       }
//     });

//     // Nombres y apellidos dominicanos comunes para las reservas
//     const nombres = ['Antonio', 'Carmen', 'Roberto', 'Diana', 'Eduardo', 'Fátima', 'Ricardo', 'Alicia', 'Santiago', 'Claudia', 'Jesús', 'Miriam', 'Jorge', 'Isabel', 'Manuel'];
//     const apellidos = ['Torres', 'Valdez', 'Guerrero', 'Morales', 'Figueroa', 'Almonte', 'Núñez', 'Sánchez', 'Castillo', 'Ortiz', 'Vargas', 'Féliz', 'Espinal', 'Rosario', 'Matos'];

//     // Generar 18 reservas aleatorias
//     for (let i = 0; i < 18; i++) {
//       const inventario = inventarios[Math.floor(Math.random() * inventarios.length)];
//       const nombreCliente = `${nombres[Math.floor(Math.random() * nombres.length)]} ${apellidos[Math.floor(Math.random() * apellidos.length)]}`;
      
//       // Verificar si ya existe una reserva similar
//       const reservaExistente = await prisma.reserva.findFirst({
//         where: {
//           inventarioId: inventario.id,
//           nombreCliente: nombreCliente
//         }
//       });

//       if (!reservaExistente) {
//         await prisma.reserva.create({
//           data: {
//             farmaciaId: farmacia.id,
//             inventarioId: inventario.id,
//             nombreCliente: nombreCliente,
//             telefonoCliente: `849-${Math.floor(100 + Math.random() * 900)}-${Math.floor(1000 + Math.random() * 9000)}`,
//             estado: Math.random() < 0.75 ? 'PENDIENTE' : 'COMPLETADA',
//             fecha: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1)
//           }
//         });
//       }
//     }

//     console.log("Migración de datos de San Isidro completa.");
//     return { farmacia, adminUsuario, farmaciaUsuario };

//   } catch (error) {
//     console.error('Error al migrar datos:', error);
//     throw error;
//   } finally {
//     await prisma.$disconnect();
//   }
// }

// // Ejecutar la función
// migrarDatosSanIsidro()
//   .then(() => {
//     console.log('Proceso completado exitosamente.');
//     process.exit(0);
//   })
//   .catch((error) => {
//     console.error('Error en el proceso:', error);
//     process.exit(1);
//   });


// BRAZOS

// // apps/backend/migrar-datos-brazos.js
// const { PrismaClient } = require('@prisma/client');
// const bcrypt = require('bcrypt');
// const fs = require('fs');
// const path = require('path');

// const prisma = new PrismaClient();

// // Lee y parsea el archivo JSON
// function parsearDatosTresBrazos() {
//   const filePath = path.join(__dirname, 'brazos.txt');
//   const fileContent = fs.readFileSync(filePath, 'utf8');
//   return JSON.parse(fileContent);
// }

// // Función para generar contraseña hash
// async function generarContrasena() {
//   const salt = await bcrypt.genSalt(10);
//   return await bcrypt.hash('farmacia123', salt);
// }

// // Función para limpiar caracteres especiales
// function limpiarTexto(texto) {
//   return texto.replace(/Ã¡/g, 'á')
//               .replace(/Ã©/g, 'é')
//               .replace(/Ã­/g, 'í')
//               .replace(/Ã³/g, 'ó')
//               .replace(/Ãº/g, 'ú')
//               .replace(/Ã±/g, 'ñ')
//               .replace(/Ã"/g, 'Ó')
//               .replace(/Ã"/g, 'Ñ')
//               .replace(/Ã­/g, 'í')
//               .replace(/Ã³/g, 'ó');
// }

// // Función para obtener categoría de medicamento
// function obtenerCategoria(nombre) {
//   const categorias = {
//     'Paracetamol': 'Analgésicos',
//     'Ibuprofeno': 'Antiinflamatorios',
//     'acetilsalicílico': 'Analgésicos',
//     'Diclofenaco': 'Antiinflamatorios',
//     'Naproxeno': 'Antiinflamatorios',
//     'Amoxicilina': 'Antibióticos',
//     'Azitromicina': 'Antibióticos',
//     'Ciprofloxacino': 'Antibióticos',
//     'Cefalexina': 'Antibióticos',
//     'Clindamicina': 'Antibióticos',
//     'Losartán': 'Antihipertensivos',
//     'Amlodipino': 'Antihipertensivos',
//     'Hidroclorotiazida': 'Diuréticos',
//     'Enalapril': 'Antihipertensivos',
//     'Metoprolol': 'Betabloqueantes',
//     'Metformina': 'Antidiabéticos',
//     'Glibenclamida': 'Antidiabéticos',
//     'Insulina': 'Antidiabéticos',
//     'Sitagliptina': 'Antidiabéticos',
//     'Glimepirida': 'Antidiabéticos',
//     'Clotrimazol': 'Antimicóticos',
//     'Miconazol': 'Antimicóticos',
//     'Hidrocortisona': 'Corticosteroides',
//     'Betametasona': 'Corticosteroides',
//     'retinoico': 'Dermatológicos',
//     'Vitamina': 'Vitaminas y suplementos',
//     'Hierro': 'Vitaminas y suplementos',
//     'fólico': 'Vitaminas y suplementos',
//     'Complejo B': 'Vitaminas y suplementos',
//     'Salbutamol': 'Broncodilatadores',
//     'Sales de rehidratación': 'Rehidratación',
//     'Omeprazol': 'Inhibidores de la bomba de protones',
//     'Loratadina': 'Antihistamínicos',
//     'Prednisona': 'Corticosteroides',
//     'Levotiroxina': 'Hormonas tiroideas',
//     'Atorvastatina': 'Estatinas',
//     'valproico': 'Antiepilépticos',
//     'Carbamazepina': 'Antiepilépticos',
//     'Furosemida': 'Diuréticos',
//     'Heparina': 'Anticoagulantes',
//     'Warfarina': 'Anticoagulantes',
//     'Diazepam': 'Ansiolíticos',
//     'Guaifenesina': 'Expectorantes',
//     'Pseudoefedrina': 'Descongestionantes'
//   };

//   for (const [key, categoria] of Object.entries(categorias)) {
//     if (nombre.toLowerCase().includes(key.toLowerCase())) return categoria;
//   }
  
//   return 'Otros medicamentos';
// }

// // Función para encontrar o crear usuario
// async function encontrarOCrearUsuario(datos) {
//   try {
//     // Primero, intentar encontrar por email
//     let usuario = await prisma.usuario.findUnique({
//       where: { email: datos.email }
//     });

//     // Si no existe, crear
//     if (!usuario) {
//       const hashedPassword = await generarContrasena();
//       usuario = await prisma.usuario.create({
//         data: {
//           ...datos,
//           password: hashedPassword
//         }
//       });
//     }

//     return usuario;
//   } catch (error) {
//     // Si hay un error único (como email duplicado), buscar nuevamente
//     if (error.code === 'P2002') {
//       return await prisma.usuario.findUnique({
//         where: { email: datos.email }
//       });
//     }
//     throw error;
//   }
// }

// // Función para encontrar o crear farmacia
// async function encontrarOCrearFarmacia(datos) {
//   try {
//     // Primero, intentar encontrar por nombre
//     let farmacia = await prisma.farmacia.findFirst({
//       where: { nombre: datos.nombre }
//     });

//     // Si no existe, crear
//     if (!farmacia) {
//       farmacia = await prisma.farmacia.create({
//         data: datos
//       });
//     }

//     return farmacia;
//   } catch (error) {
//     // Si hay un error, buscar nuevamente
//     if (error.code === 'P2002') {
//       return await prisma.farmacia.findFirst({
//         where: { nombre: datos.nombre }
//       });
//     }
//     throw error;
//   }
// }

// async function migrarDatosTresBrazos() {
//   try {
//     console.log("Iniciando migración de datos de Los Tres Brazos...");

//     // 1. Crear farmacia base
//     const farmacia = await encontrarOCrearFarmacia({
//       nombre: "Farmacia Los Tres Brazos",
//       direccion: "Barrio Los Tres Brazos, Santo Domingo Este",
//       latitud: 18.4956,
//       longitud: -69.8731
//     });

//     // 2. Crear usuario administrador y de farmacia
//     const adminUsuario = await encontrarOCrearUsuario({
//       nombre: "Administrador Los Tres Brazos",
//       email: "admin.tresbrazos@farmacia.com",
//       rol: 'ADMIN'
//     });

//     const farmaciaUsuario = await encontrarOCrearUsuario({
//       nombre: "Luisa Hernández",
//       email: "luisa.hernandez@farmacia.com",
//       rol: 'FARMACIA'
//     });

//     // Asignar farmacia al usuario si aún no lo está
//     if (farmaciaUsuario) {
//       const usuarioConFarmacia = await prisma.usuario.update({
//         where: { id: farmaciaUsuario.id },
//         data: {
//           farmacias: {
//             connect: [{ id: farmacia.id }]
//           },
//           farmaciaActiva: {
//             connect: { id: farmacia.id }
//           }
//         }
//       });
//     }

//     // 3. Procesar datos de Los Tres Brazos
//     const datosTresBrazos = parsearDatosTresBrazos();

//     // 4. Crear medicamentos únicos
//     const medicamentosUnicos = {};
//     datosTresBrazos.forEach(item => {
//       const nombreLimpio = limpiarTexto(item.Producto);
//       if (!medicamentosUnicos[nombreLimpio]) {
//         medicamentosUnicos[nombreLimpio] = {
//           nombre: nombreLimpio,
//           codigo: `BRZ${item.Codigo}`,
//           categoria: obtenerCategoria(nombreLimpio),
//           presentacion: limpiarTexto(item.Presentacion),
//           descripcion: `Medicamento de ${obtenerCategoria(nombreLimpio)}`
//         };
//       }
//     });

//     const medicamentosCreados = {};
//     for (const [nombre, medData] of Object.entries(medicamentosUnicos)) {
//       // Buscar si ya existe un medicamento con este código
//       let medicamento = await prisma.medicamento.findUnique({
//         where: { codigo: medData.codigo }
//       });

//       // Si no existe, crear
//       if (!medicamento) {
//         medicamento = await prisma.medicamento.create({
//           data: medData
//         });
//       }
      
//       medicamentosCreados[nombre] = medicamento;
//     }

//     // 5. Crear inventarios y generar ventas
//     const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

//     for (const item of datosTresBrazos) {
//       const nombreLimpio = limpiarTexto(item.Producto);
//       const medicamento = medicamentosCreados[nombreLimpio];
      
//       // Solo crear inventario si tiene stock
//       if (item.Entrada > 0) {
//         // Buscar si ya existe un inventario para este medicamento en esta farmacia
//         let inventario = await prisma.inventario.findFirst({
//           where: {
//             farmaciaId: farmacia.id,
//             medicamentoId: medicamento.id
//           }
//         });

//         // Si no existe, crear
//         if (!inventario) {
//           inventario = await prisma.inventario.create({
//             data: {
//               farmaciaId: farmacia.id,
//               medicamentoId: medicamento.id,
//               stock: item.Entrada,
//               stockMinimo: Math.floor(item.Entrada * 0.1), // 10% del stock inicial como mínimo
//               precio: Math.floor(Math.random() * 4500) + 1200, // Precio aleatorio entre 1200 y 5700
//               vencimiento: new Date(2025, 11, 31) // Fecha de vencimiento a fin de 2025
//             }
//           });
//         }

//         // Generar ventas
//         if (item.Ventas > 0) {
//           const mesIndex = meses.indexOf(item.Mes);
//           const fechaVenta = new Date(2024, mesIndex, Math.floor(Math.random() * 28) + 1);

//           // Verificar si ya existe una venta similar
//           const ventaExistente = await prisma.venta.findFirst({
//             where: {
//               inventarioId: inventario.id,
//               fecha: fechaVenta,
//               cantidad: item.Ventas
//             }
//           });

//           if (!ventaExistente) {
//             const venta = await prisma.venta.create({
//               data: {
//                 cantidad: item.Ventas,
//                 farmaciaId: farmacia.id,
//                 inventarioId: inventario.id,
//                 precioUnitario: inventario.precio,
//                 fecha: fechaVenta,
//                 mes: mesIndex + 1,
//                 anio: 2024,
//                 usuarioId: farmaciaUsuario.id
//               }
//             });

//             // Registrar movimiento de inventario
//             await prisma.movimientoInventario.create({
//               data: {
//                 tipo: 'SALIDA',
//                 cantidad: item.Ventas,
//                 inventarioId: inventario.id,
//                 farmaciaId: farmacia.id,
//                 usuarioId: farmaciaUsuario.id,
//                 fecha: fechaVenta,
//                 observacion: `Venta de ${nombreLimpio}`
//               }
//             });

//             // Generar algunas devoluciones aleatorias (12% de probabilidad)
//             if (Math.random() < 0.12) {
//               const cantidadDevolucion = Math.floor(item.Ventas * 0.12); // 12% de la venta
//               if (cantidadDevolucion > 0) {
//                 const devolucionExistente = await prisma.devolucion.findFirst({
//                   where: {
//                     inventarioId: inventario.id,
//                     cantidad: cantidadDevolucion,
//                     fecha: fechaVenta
//                   }
//                 });

//                 if (!devolucionExistente) {
//                   await prisma.devolucion.create({
//                     data: {
//                       cantidad: cantidadDevolucion,
//                       motivo: 'Producto caducado',
//                       farmaciaId: farmacia.id,
//                       inventarioId: inventario.id,
//                       estado: 'PENDIENTE',
//                       usuarioId: farmaciaUsuario.id,
//                       fecha: new Date(2024, mesIndex, Math.floor(Math.random() * 28) + 1),
//                       mes: mesIndex + 1,
//                       anio: 2024
//                     }
//                   });
//                 }
//               }
//             }
//           }
//         }
//       }
//     }

//     // 6. Generar algunas reservas aleatorias
//     const inventarios = await prisma.inventario.findMany({
//       where: { 
//         farmaciaId: farmacia.id,
//         stock: { gt: 0 } 
//       }
//     });

//     // Nombres y apellidos dominicanos comunes para las reservas
//     const nombres = ['Ramón', 'Juana', 'Pedro', 'Altagracia', 'Roberto', 'Margarita', 'Fernando', 'Yolanda', 'Julio', 'Miguelina', 'Carlos', 'Francisca', 'Antonio', 'Xiomara', 'Eduardo'];
//     const apellidos = ['Jiménez', 'Castillo', 'Santos', 'De la Rosa', 'Marte', 'Polanco', 'Reyes', 'Medina', 'Alcántara', 'Nova', 'Acosta', 'Peña', 'Báez', 'Matos', 'Guzmán'];

//     // Generar 20 reservas aleatorias
//     for (let i = 0; i < 20; i++) {
//       const inventario = inventarios[Math.floor(Math.random() * inventarios.length)];
//       const nombreCliente = `${nombres[Math.floor(Math.random() * nombres.length)]} ${apellidos[Math.floor(Math.random() * apellidos.length)]}`;
      
//       // Verificar si ya existe una reserva similar
//       const reservaExistente = await prisma.reserva.findFirst({
//         where: {
//           inventarioId: inventario.id,
//           nombreCliente: nombreCliente
//         }
//       });

//       if (!reservaExistente) {
//         await prisma.reserva.create({
//           data: {
//             farmaciaId: farmacia.id,
//             inventarioId: inventario.id,
//             nombreCliente: nombreCliente,
//             telefonoCliente: `809-${Math.floor(100 + Math.random() * 900)}-${Math.floor(1000 + Math.random() * 9000)}`,
//             estado: Math.random() < 0.65 ? 'PENDIENTE' : 'COMPLETADA',
//             fecha: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1)
//           }
//         });
//       }
//     }

//     console.log("Migración de datos de Los Tres Brazos completa.");
//     return { farmacia, adminUsuario, farmaciaUsuario };

//   } catch (error) {
//     console.error('Error al migrar datos:', error);
//     throw error;
//   } finally {
//     await prisma.$disconnect();
//   }
// }

// // Ejecutar la función
// migrarDatosTresBrazos()
//   .then(() => {
//     console.log('Proceso completado exitosamente.');
//     process.exit(0);
//   })
//   .catch((error) => {
//     console.error('Error en el proceso:', error);
//     process.exit(1);
//   });

// INVIVIENDA

// // apps/backend/migrar-datos-invivienda.js
// const { PrismaClient } = require('@prisma/client');
// const bcrypt = require('bcrypt');
// const fs = require('fs');
// const path = require('path');

// const prisma = new PrismaClient();

// // Lee y parsea el archivo JSON
// function parsearDatosInvivienda() {
//   const filePath = path.join(__dirname, 'invivienda.txt');
//   const fileContent = fs.readFileSync(filePath, 'utf8');
//   return JSON.parse(fileContent);
// }

// // Función para generar contraseña hash
// async function generarContrasena() {
//   const salt = await bcrypt.genSalt(10);
//   return await bcrypt.hash('farmacia123', salt);
// }

// // Función para limpiar caracteres especiales
// function limpiarTexto(texto) {
//   return texto.replace(/Ã¡/g, 'á')
//               .replace(/Ã©/g, 'é')
//               .replace(/Ã­/g, 'í')
//               .replace(/Ã³/g, 'ó')
//               .replace(/Ãº/g, 'ú')
//               .replace(/Ã±/g, 'ñ')
//               .replace(/Ã"/g, 'Ó')
//               .replace(/Ã"/g, 'Ñ')
//               .replace(/Ã­/g, 'í')
//               .replace(/Ã³/g, 'ó');
// }

// // Función para obtener categoría de medicamento
// function obtenerCategoria(nombre) {
//   const categorias = {
//     'Paracetamol': 'Analgésicos',
//     'Ibuprofeno': 'Antiinflamatorios',
//     'acetilsalicílico': 'Analgésicos',
//     'Diclofenaco': 'Antiinflamatorios',
//     'Naproxeno': 'Antiinflamatorios',
//     'Amoxicilina': 'Antibióticos',
//     'Azitromicina': 'Antibióticos',
//     'Ciprofloxacino': 'Antibióticos',
//     'Cefalexina': 'Antibióticos',
//     'Clindamicina': 'Antibióticos',
//     'Losartán': 'Antihipertensivos',
//     'Amlodipino': 'Antihipertensivos',
//     'Hidroclorotiazida': 'Diuréticos',
//     'Enalapril': 'Antihipertensivos',
//     'Metoprolol': 'Betabloqueantes',
//     'Metformina': 'Antidiabéticos',
//     'Glibenclamida': 'Antidiabéticos',
//     'Insulina': 'Antidiabéticos',
//     'Sitagliptina': 'Antidiabéticos',
//     'Glimepirida': 'Antidiabéticos',
//     'Clotrimazol': 'Antimicóticos',
//     'Miconazol': 'Antimicóticos',
//     'Hidrocortisona': 'Corticosteroides',
//     'Betametasona': 'Corticosteroides',
//     'retinoico': 'Dermatológicos',
//     'Vitamina': 'Vitaminas y suplementos',
//     'Hierro': 'Vitaminas y suplementos',
//     'fólico': 'Vitaminas y suplementos',
//     'Complejo B': 'Vitaminas y suplementos',
//     'Salbutamol': 'Broncodilatadores',
//     'Sales de rehidratación': 'Rehidratación',
//     'Omeprazol': 'Inhibidores de la bomba de protones',
//     'Loratadina': 'Antihistamínicos',
//     'Prednisona': 'Corticosteroides',
//     'Levotiroxina': 'Hormonas tiroideas',
//     'Atorvastatina': 'Estatinas',
//     'valproico': 'Antiepilépticos',
//     'Carbamazepina': 'Antiepilépticos',
//     'Furosemida': 'Diuréticos',
//     'Heparina': 'Anticoagulantes',
//     'Warfarina': 'Anticoagulantes',
//     'Diazepam': 'Ansiolíticos',
//     'Guaifenesina': 'Expectorantes',
//     'Pseudoefedrina': 'Descongestionantes'
//   };

//   for (const [key, categoria] of Object.entries(categorias)) {
//     if (nombre.toLowerCase().includes(key.toLowerCase())) return categoria;
//   }
  
//   return 'Otros medicamentos';
// }

// // Función para encontrar o crear usuario
// async function encontrarOCrearUsuario(datos) {
//   try {
//     // Primero, intentar encontrar por email
//     let usuario = await prisma.usuario.findUnique({
//       where: { email: datos.email }
//     });

//     // Si no existe, crear
//     if (!usuario) {
//       const hashedPassword = await generarContrasena();
//       usuario = await prisma.usuario.create({
//         data: {
//           ...datos,
//           password: hashedPassword
//         }
//       });
//     }

//     return usuario;
//   } catch (error) {
//     // Si hay un error único (como email duplicado), buscar nuevamente
//     if (error.code === 'P2002') {
//       return await prisma.usuario.findUnique({
//         where: { email: datos.email }
//       });
//     }
//     throw error;
//   }
// }

// // Función para encontrar o crear farmacia
// async function encontrarOCrearFarmacia(datos) {
//   try {
//     // Primero, intentar encontrar por nombre
//     let farmacia = await prisma.farmacia.findFirst({
//       where: { nombre: datos.nombre }
//     });

//     // Si no existe, crear
//     if (!farmacia) {
//       farmacia = await prisma.farmacia.create({
//         data: datos
//       });
//     }

//     return farmacia;
//   } catch (error) {
//     // Si hay un error, buscar nuevamente
//     if (error.code === 'P2002') {
//       return await prisma.farmacia.findFirst({
//         where: { nombre: datos.nombre }
//       });
//     }
//     throw error;
//   }
// }

// async function migrarDatosInvivienda() {
//   try {
//     console.log("Iniciando migración de datos de Invivienda...");

//     // 1. Crear farmacia base
//     const farmacia = await encontrarOCrearFarmacia({
//       nombre: "Farmacia Invivienda",
//       direccion: "Barrio Invivienda, Santo Domingo Este",
//       latitud: 18.4905,
//       longitud: -69.8571
//     });

//     // 2. Crear usuario administrador y de farmacia
//     const adminUsuario = await encontrarOCrearUsuario({
//       nombre: "Administrador Invivienda",
//       email: "admin.invivienda@farmacia.com",
//       rol: 'ADMIN'
//     });

//     const farmaciaUsuario = await encontrarOCrearUsuario({
//       nombre: "Carlos Méndez",
//       email: "carlos.mendez@farmacia.com",
//       rol: 'FARMACIA'
//     });

//     // Asignar farmacia al usuario si aún no lo está
//     if (farmaciaUsuario) {
//       const usuarioConFarmacia = await prisma.usuario.update({
//         where: { id: farmaciaUsuario.id },
//         data: {
//           farmacias: {
//             connect: [{ id: farmacia.id }]
//           },
//           farmaciaActiva: {
//             connect: { id: farmacia.id }
//           }
//         }
//       });
//     }

//     // 3. Procesar datos de Invivienda
//     const datosInvivienda = parsearDatosInvivienda();

//     // 4. Crear medicamentos únicos
//     const medicamentosUnicos = {};
//     datosInvivienda.forEach(item => {
//       const nombreLimpio = limpiarTexto(item.Producto);
//       if (!medicamentosUnicos[nombreLimpio]) {
//         medicamentosUnicos[nombreLimpio] = {
//           nombre: nombreLimpio,
//           codigo: `INV${item.Codigo}`,
//           categoria: obtenerCategoria(nombreLimpio),
//           presentacion: limpiarTexto(item.Presentacion),
//           descripcion: `Medicamento de ${obtenerCategoria(nombreLimpio)}`
//         };
//       }
//     });

//     const medicamentosCreados = {};
//     for (const [nombre, medData] of Object.entries(medicamentosUnicos)) {
//       // Buscar si ya existe un medicamento con este código
//       let medicamento = await prisma.medicamento.findUnique({
//         where: { codigo: medData.codigo }
//       });

//       // Si no existe, crear
//       if (!medicamento) {
//         medicamento = await prisma.medicamento.create({
//           data: medData
//         });
//       }
      
//       medicamentosCreados[nombre] = medicamento;
//     }

//     // 5. Crear inventarios y generar ventas
//     const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

//     for (const item of datosInvivienda) {
//       const nombreLimpio = limpiarTexto(item.Producto);
//       const medicamento = medicamentosCreados[nombreLimpio];
      
//       // Solo crear inventario si tiene stock
//       if (item.Entrada > 0) {
//         // Buscar si ya existe un inventario para este medicamento en esta farmacia
//         let inventario = await prisma.inventario.findFirst({
//           where: {
//             farmaciaId: farmacia.id,
//             medicamentoId: medicamento.id
//           }
//         });

//         // Si no existe, crear
//         if (!inventario) {
//           inventario = await prisma.inventario.create({
//             data: {
//               farmaciaId: farmacia.id,
//               medicamentoId: medicamento.id,
//               stock: item.Entrada,
//               stockMinimo: Math.floor(item.Entrada * 0.1), // 10% del stock inicial como mínimo
//               precio: Math.floor(Math.random() * 4000) + 1500, // Precio aleatorio entre 1500 y 5500
//               vencimiento: new Date(2025, 11, 31) // Fecha de vencimiento a fin de 2025
//             }
//           });
//         }

//         // Generar ventas
//         if (item.Ventas > 0) {
//           const mesIndex = meses.indexOf(item.Mes);
//           const fechaVenta = new Date(2024, mesIndex, Math.floor(Math.random() * 28) + 1);

//           // Verificar si ya existe una venta similar
//           const ventaExistente = await prisma.venta.findFirst({
//             where: {
//               inventarioId: inventario.id,
//               fecha: fechaVenta,
//               cantidad: item.Ventas
//             }
//           });

//           if (!ventaExistente) {
//             const venta = await prisma.venta.create({
//               data: {
//                 cantidad: item.Ventas,
//                 farmaciaId: farmacia.id,
//                 inventarioId: inventario.id,
//                 precioUnitario: inventario.precio,
//                 fecha: fechaVenta,
//                 mes: mesIndex + 1,
//                 anio: 2024,
//                 usuarioId: farmaciaUsuario.id
//               }
//             });

//             // Registrar movimiento de inventario
//             await prisma.movimientoInventario.create({
//               data: {
//                 tipo: 'SALIDA',
//                 cantidad: item.Ventas,
//                 inventarioId: inventario.id,
//                 farmaciaId: farmacia.id,
//                 usuarioId: farmaciaUsuario.id,
//                 fecha: fechaVenta,
//                 observacion: `Venta de ${nombreLimpio}`
//               }
//             });

//             // Generar algunas devoluciones aleatorias
//             if (Math.random() < 0.15) { // 15% de probabilidad de devolución
//               const cantidadDevolucion = Math.floor(item.Ventas * 0.15); // 15% de la venta
//               if (cantidadDevolucion > 0) {
//                 const devolucionExistente = await prisma.devolucion.findFirst({
//                   where: {
//                     inventarioId: inventario.id,
//                     cantidad: cantidadDevolucion,
//                     fecha: fechaVenta
//                   }
//                 });

//                 if (!devolucionExistente) {
//                   await prisma.devolucion.create({
//                     data: {
//                       cantidad: cantidadDevolucion,
//                       motivo: 'Producto en mal estado',
//                       farmaciaId: farmacia.id,
//                       inventarioId: inventario.id,
//                       estado: 'PENDIENTE',
//                       usuarioId: farmaciaUsuario.id,
//                       fecha: new Date(2024, mesIndex, Math.floor(Math.random() * 28) + 1),
//                       mes: mesIndex + 1,
//                       anio: 2024
//                     }
//                   });
//                 }
//               }
//             }
//           }
//         }
//       }
//     }

//     // 6. Generar algunas reservas aleatorias
//     const inventarios = await prisma.inventario.findMany({
//       where: { 
//         farmaciaId: farmacia.id,
//         stock: { gt: 0 } 
//       }
//     });

//     // Nombres y apellidos dominicanos comunes para las reservas
//     const nombres = ['María', 'Juan', 'Ana', 'José', 'Carmen', 'Rafael', 'Luisa', 'Miguel', 'Rosa', 'Francisco', 'Teresa', 'Pedro', 'Ramona', 'Luis', 'Altagracia'];
//     const apellidos = ['Rodríguez', 'Pérez', 'González', 'Fernández', 'Díaz', 'Martínez', 'Sánchez', 'Ramírez', 'López', 'García', 'Hernández', 'Mejía', 'Torres', 'Pimentel', 'Gómez'];

//     // Generar 15 reservas aleatorias
//     for (let i = 0; i < 15; i++) {
//       const inventario = inventarios[Math.floor(Math.random() * inventarios.length)];
//       const nombreCliente = `${nombres[Math.floor(Math.random() * nombres.length)]} ${apellidos[Math.floor(Math.random() * apellidos.length)]}`;
      
//       // Verificar si ya existe una reserva similar
//       const reservaExistente = await prisma.reserva.findFirst({
//         where: {
//           inventarioId: inventario.id,
//           nombreCliente: nombreCliente
//         }
//       });

//       if (!reservaExistente) {
//         await prisma.reserva.create({
//           data: {
//             farmaciaId: farmacia.id,
//             inventarioId: inventario.id,
//             nombreCliente: nombreCliente,
//             telefonoCliente: `829-${Math.floor(100 + Math.random() * 900)}-${Math.floor(1000 + Math.random() * 9000)}`,
//             estado: Math.random() < 0.7 ? 'PENDIENTE' : 'COMPLETADA',
//             fecha: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1)
//           }
//         });
//       }
//     }

//     console.log("Migración de datos de Invivienda completa.");
//     return { farmacia, adminUsuario, farmaciaUsuario };

//   } catch (error) {
//     console.error('Error al migrar datos:', error);
//     throw error;
//   } finally {
//     await prisma.$disconnect();
//   }
// }

// // Ejecutar la función
// migrarDatosInvivienda()
//   .then(() => {
//     console.log('Proceso completado exitosamente.');
//     process.exit(0);
//   })
//   .catch((error) => {
//     console.error('Error en el proceso:', error);
//     process.exit(1);
//   });


// // MENDOZA

// // apps/backend/migrar-datos-mendoza.js
// const { PrismaClient } = require('@prisma/client');
// const bcrypt = require('bcrypt');
// const fs = require('fs');
// const path = require('path');

// const prisma = new PrismaClient();

// // Lee y parsea el archivo CSV
// function parsearDatosMendoza() {
//   const filePath = path.join(__dirname, 'mendoza.txt');
//   const fileContent = fs.readFileSync(filePath, 'utf8');
//   return JSON.parse(fileContent);
// }

// // Función para generar contraseña hash
// async function generarContrasena() {
//   const salt = await bcrypt.genSalt(10);
//   return await bcrypt.hash('farmacia123', salt);
// }

// // Función para limpiar caracteres especiales
// function limpiarTexto(texto) {
//   return texto.replace(/Ã¡/g, 'á')
//               .replace(/Ã©/g, 'é')
//               .replace(/Ã­/g, 'í')
//               .replace(/Ã³/g, 'ó')
//               .replace(/Ãº/g, 'ú')
//               .replace(/Ã±/g, 'ñ')
//               .replace(/Ã"/g, 'Ó')
//               .replace(/Ã"/g, 'Ñ');
// }

// // Función para obtener categoría de medicamento
// function obtenerCategoria(nombre) {
//   const categorias = {
//     'Paracetamol': 'Analgésicos',
//     'Ibuprofeno': 'Antiinflamatorios',
//     'Amoxicilina': 'Antibióticos',
//     'Losartán': 'Antihipertensivos',
//     'Metformina': 'Antidiabéticos',
//     'Omeprazol': 'Inhibidores de bomba de protones',
//     'Salbutamol': 'Broncodilatadores',
//     'Vitamina': 'Vitaminas',
//     'Prednisona': 'Corticosteroides',
//     'Atorvastatina': 'Antilipemiantes',
//     'Heparina': 'Anticoagulantes',
//     'Diclofenaco': 'Antiinflamatorios',
//     'Naproxeno': 'Antiinflamatorios',
//     'Azitromicina': 'Antibióticos'
//   };

//   for (const [key, categoria] of Object.entries(categorias)) {
//     if (nombre.includes(key)) return categoria;
//   }
  
//   return 'Otros medicamentos';
// }

// // Función para encontrar o crear usuario
// async function encontrarOCrearUsuario(datos) {
//   try {
//     // Primero, intentar encontrar por email
//     let usuario = await prisma.usuario.findUnique({
//       where: { email: datos.email }
//     });

//     // Si no existe, crear
//     if (!usuario) {
//       const hashedPassword = await generarContrasena();
//       usuario = await prisma.usuario.create({
//         data: {
//           ...datos,
//           password: hashedPassword
//         }
//       });
//     }

//     return usuario;
//   } catch (error) {
//     // Si hay un error único (como email duplicado), buscar nuevamente
//     if (error.code === 'P2002') {
//       return await prisma.usuario.findUnique({
//         where: { email: datos.email }
//       });
//     }
//     throw error;
//   }
// }

// // Función para encontrar o crear farmacia
// async function encontrarOCrearFarmacia(datos) {
//   try {
//     // Primero, intentar encontrar por nombre
//     let farmacia = await prisma.farmacia.findFirst({
//       where: { nombre: datos.nombre }
//     });

//     // Si no existe, crear
//     if (!farmacia) {
//       farmacia = await prisma.farmacia.create({
//         data: datos
//       });
//     }

//     return farmacia;
//   } catch (error) {
//     // Si hay un error, buscar nuevamente
//     if (error.code === 'P2002') {
//       return await prisma.farmacia.findFirst({
//         where: { nombre: datos.nombre }
//       });
//     }
//     throw error;
//   }
// }

// async function migrarDatosMendoza() {
//   try {
//     console.log("Iniciando migración de datos de Mendoza...");

//     // 1. Crear farmacia base
//     const farmacia = await encontrarOCrearFarmacia({
//       nombre: "Farmacia Mendoza",
//       direccion: "Barrio Mendoza, Santo Domingo",
//       latitud: 18.4861,
//       longitud: -69.9312
//     });

//     // 2. Crear usuario administrador y de farmacia
//     const adminUsuario = await encontrarOCrearUsuario({
//       nombre: "Administrador Mendoza",
//       email: "admin.mendoza@farmacia.com",
//       rol: 'ADMIN'
//     });

//     const farmaciaUsuario = await encontrarOCrearUsuario({
//       nombre: "Elena Pérez",
//       email: "elena.perez@farmacia.com",
//       rol: 'FARMACIA'
//     });

//     // Asignar farmacia al usuario si aún no lo está
//     if (farmaciaUsuario) {
//       const usuarioConFarmacia = await prisma.usuario.update({
//         where: { id: farmaciaUsuario.id },
//         data: {
//           farmacias: {
//             connect: [{ id: farmacia.id }]
//           },
//           farmaciaActiva: {
//             connect: { id: farmacia.id }
//           }
//         }
//       });
//     }

//     // 3. Procesar datos de Mendoza
//     const datosMendoza = parsearDatosMendoza();

//     // 4. Crear medicamentos únicos
//     const medicamentosUnicos = {};
//     datosMendoza.forEach(item => {
//       const nombreLimpio = limpiarTexto(item.Producto);
//       if (!medicamentosUnicos[nombreLimpio]) {
//         medicamentosUnicos[nombreLimpio] = {
//           nombre: nombreLimpio,
//           codigo: `MED${item.Codigo}`,
//           categoria: obtenerCategoria(nombreLimpio),
//           presentacion: limpiarTexto(item.Presentacion),
//           descripcion: `Medicamento de ${obtenerCategoria(nombreLimpio)}`
//         };
//       }
//     });

//     const medicamentosCreados = {};
//     for (const [nombre, medData] of Object.entries(medicamentosUnicos)) {
//       // Buscar si ya existe un medicamento con este código
//       let medicamento = await prisma.medicamento.findUnique({
//         where: { codigo: medData.codigo }
//       });

//       // Si no existe, crear
//       if (!medicamento) {
//         medicamento = await prisma.medicamento.create({
//           data: medData
//         });
//       }
      
//       medicamentosCreados[nombre] = medicamento;
//     }

//     // 5. Crear inventarios y generar ventas
//     const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

//     for (const item of datosMendoza) {
//       const nombreLimpio = limpiarTexto(item.Producto);
//       const medicamento = medicamentosCreados[nombreLimpio];
      
//       // Solo crear inventario si tiene stock
//       if (item.Entrada > 0) {
//         // Buscar si ya existe un inventario para este medicamento en esta farmacia
//         let inventario = await prisma.inventario.findFirst({
//           where: {
//             farmaciaId: farmacia.id,
//             medicamentoId: medicamento.id
//           }
//         });

//         // Si no existe, crear
//         if (!inventario) {
//           inventario = await prisma.inventario.create({
//             data: {
//               farmaciaId: farmacia.id,
//               medicamentoId: medicamento.id,
//               stock: item.Entrada,
//               stockMinimo: 10,
//               precio: Math.floor(Math.random() * 5000) + 1000, // Precio aleatorio
//               vencimiento: new Date(2025, 11, 31) // Fecha de vencimiento a fin de 2025
//             }
//           });
//         }

//         // Generar ventas
//         if (item.Ventas > 0) {
//           const mesIndex = meses.indexOf(item.Mes);
//           const fechaVenta = new Date(2024, mesIndex, Math.floor(Math.random() * 28) + 1);

//           // Verificar si ya existe una venta similar
//           const ventaExistente = await prisma.venta.findFirst({
//             where: {
//               inventarioId: inventario.id,
//               fecha: fechaVenta,
//               cantidad: item.Ventas
//             }
//           });

//           if (!ventaExistente) {
//             const venta = await prisma.venta.create({
//               data: {
//                 cantidad: item.Ventas,
//                 farmaciaId: farmacia.id,
//                 inventarioId: inventario.id,
//                 precioUnitario: inventario.precio,
//                 fecha: fechaVenta,
//                 mes: mesIndex + 1,
//                 anio: 2024,
//                 usuarioId: farmaciaUsuario.id
//               }
//             });

//             // Registrar movimiento de inventario
//             await prisma.movimientoInventario.create({
//               data: {
//                 tipo: 'SALIDA',
//                 cantidad: item.Ventas,
//                 inventarioId: inventario.id,
//                 farmaciaId: farmacia.id,
//                 usuarioId: farmaciaUsuario.id,
//                 fecha: fechaVenta,
//                 observacion: `Venta de ${nombreLimpio}`
//               }
//             });

//             // Generar algunas devoluciones aleatorias
//             if (Math.random() < 0.2) { // 20% de probabilidad de devolución
//               const cantidadDevolucion = Math.floor(item.Ventas * 0.1); // 10% de la venta
//               if (cantidadDevolucion > 0) {
//                 const devolucionExistente = await prisma.devolucion.findFirst({
//                   where: {
//                     inventarioId: inventario.id,
//                     cantidad: cantidadDevolucion,
//                     fecha: fechaVenta
//                   }
//                 });

//                 if (!devolucionExistente) {
//                   await prisma.devolucion.create({
//                     data: {
//                       cantidad: cantidadDevolucion,
//                       motivo: 'Producto en exceso',
//                       farmaciaId: farmacia.id,
//                       inventarioId: inventario.id,
//                       estado: 'PENDIENTE',
//                       usuarioId: farmaciaUsuario.id,
//                       fecha: new Date(2024, mesIndex, Math.floor(Math.random() * 28) + 1),
//                       mes: mesIndex + 1,
//                       anio: 2024
//                     }
//                   });
//                 }
//               }
//             }
//           }
//         }
//       }
//     }

//     // 6. Generar algunas reservas aleatorias
//     const inventarios = await prisma.inventario.findMany({
//       where: { 
//         farmaciaId: farmacia.id,
//         stock: { gt: 0 } 
//       }
//     });

//     // Generar 10 reservas aleatorias
//     for (let i = 0; i < 10; i++) {
//       const inventario = inventarios[Math.floor(Math.random() * inventarios.length)];
      
//       // Verificar si ya existe una reserva similar
//       const reservaExistente = await prisma.reserva.findFirst({
//         where: {
//           inventarioId: inventario.id,
//           nombreCliente: `Cliente ${i + 1}`
//         }
//       });

//       if (!reservaExistente) {
//         await prisma.reserva.create({
//           data: {
//             farmaciaId: farmacia.id,
//             inventarioId: inventario.id,
//             nombreCliente: `Cliente ${i + 1}`,
//             telefonoCliente: `809-555-${Math.floor(1000 + Math.random() * 9000)}`,
//             estado: 'PENDIENTE',
//             fecha: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1)
//           }
//         });
//       }
//     }

//     console.log("Migración de datos de Mendoza completa.");
//     return { farmacia, adminUsuario, farmaciaUsuario };

//   } catch (error) {
//     console.error('Error al migrar datos:', error);
//     throw error;
//   } finally {
//     await prisma.$disconnect();
//   }
// }

// // Ejecutar la función
// migrarDatosMendoza()
//   .then(() => {
//     console.log('Proceso completado exitosamente.');
//     process.exit(0);
//   })
//   .catch((error) => {
//     console.error('Error en el proceso:', error);
//     process.exit(1);
//   });


// VILLA FARO

// // apps/backend/migrar-datos-villa-faro.js
// const { PrismaClient } = require('@prisma/client');
// const bcrypt = require('bcrypt');
// const fs = require('fs');
// const path = require('path');

// const prisma = new PrismaClient();

// // Lee y parsea el archivo CSV
// function parsearDatosVillaFaro() {
//   const filePath = path.join(__dirname, 'villafaro.txt');
//   const fileContent = fs.readFileSync(filePath, 'utf8');
//   return JSON.parse(fileContent);
// }

// // Función para generar contraseña hash
// async function generarContrasena() {
//   const salt = await bcrypt.genSalt(10);
//   return await bcrypt.hash('farmacia123', salt);
// }

// // Función para limpiar caracteres especiales
// function limpiarTexto(texto) {
//   return texto.replace(/Ã¡/g, 'á')
//               .replace(/Ã©/g, 'é')
//               .replace(/Ã­/g, 'í')
//               .replace(/Ã³/g, 'ó')
//               .replace(/Ãº/g, 'ú')
//               .replace(/Ã±/g, 'ñ')
//               .replace(/Ã"/g, 'Ó')
//               .replace(/Ã"/g, 'Ñ');
// }

// // Función para obtener categoría de medicamento
// function obtenerCategoria(nombre) {
//   const categorias = {
//     'Paracetamol': 'Analgésicos',
//     'Ibuprofeno': 'Antiinflamatorios',
//     'Amoxicilina': 'Antibióticos',
//     'Losartán': 'Antihipertensivos',
//     'Metformina': 'Antidiabéticos',
//     'Omeprazol': 'Inhibidores de bomba de protones',
//     'Salbutamol': 'Broncodilatadores',
//     'Vitamina': 'Vitaminas',
//     'Prednisona': 'Corticosteroides',
//     'Atorvastatina': 'Antilipemiantes',
//     'Heparina': 'Anticoagulantes',
//     'Diclofenaco': 'Antiinflamatorios',
//     'Naproxeno': 'Antiinflamatorios',
//     'Azitromicina': 'Antibióticos'
//   };

//   for (const [key, categoria] of Object.entries(categorias)) {
//     if (nombre.includes(key)) return categoria;
//   }
  
//   return 'Otros medicamentos';
// }

// // Función para encontrar o crear usuario
// async function encontrarOCrearUsuario(datos) {
//   try {
//     // Primero, intentar encontrar por email
//     let usuario = await prisma.usuario.findUnique({
//       where: { email: datos.email }
//     });

//     // Si no existe, crear
//     if (!usuario) {
//       const hashedPassword = await generarContrasena();
//       usuario = await prisma.usuario.create({
//         data: {
//           ...datos,
//           password: hashedPassword
//         }
//       });
//     }

//     return usuario;
//   } catch (error) {
//     // Si hay un error único (como email duplicado), buscar nuevamente
//     if (error.code === 'P2002') {
//       return await prisma.usuario.findUnique({
//         where: { email: datos.email }
//       });
//     }
//     throw error;
//   }
// }

// // Función para encontrar o crear farmacia
// async function encontrarOCrearFarmacia(datos) {
//   try {
//     // Primero, intentar encontrar por nombre
//     let farmacia = await prisma.farmacia.findFirst({
//       where: { nombre: datos.nombre }
//     });

//     // Si no existe, crear
//     if (!farmacia) {
//       farmacia = await prisma.farmacia.create({
//         data: datos
//       });
//     }

//     return farmacia;
//   } catch (error) {
//     // Si hay un error, buscar nuevamente
//     if (error.code === 'P2002') {
//       return await prisma.farmacia.findFirst({
//         where: { nombre: datos.nombre }
//       });
//     }
//     throw error;
//   }
// }

// async function migrarDatosVillaFaro() {
//   try {
//     console.log("Iniciando migración de datos de Villa Faro...");

//     // 1. Crear farmacia base
//     const farmacia = await encontrarOCrearFarmacia({
//       nombre: "Farmacia Villa Faro",
//       direccion: "Barrio Villa Faro, Santo Domingo",
//       latitud: 18.4861,
//       longitud: -69.9312
//     });

//     // 2. Crear usuario administrador y de farmacia
//     const adminUsuario = await encontrarOCrearUsuario({
//       nombre: "Administrador Villa Faro",
//       email: "admin.villafaro@farmacia.com",
//       rol: 'ADMIN'
//     });

//     const farmaciaUsuario = await encontrarOCrearUsuario({
//       nombre: "Carlos Sánchez",
//       email: "carlos.sanchez@farmacia.com",
//       rol: 'FARMACIA'
//     });

//     // Asignar farmacia al usuario si aún no lo está
//     if (farmaciaUsuario) {
//       const usuarioConFarmacia = await prisma.usuario.update({
//         where: { id: farmaciaUsuario.id },
//         data: {
//           farmacias: {
//             connect: [{ id: farmacia.id }]
//           },
//           farmaciaActiva: {
//             connect: { id: farmacia.id }
//           }
//         }
//       });
//     }

//     // 3. Procesar datos de Villa Faro
//     const datosVillaFaro = parsearDatosVillaFaro();

//     // 4. Crear medicamentos únicos
//     const medicamentosUnicos = {};
//     datosVillaFaro.forEach(item => {
//       const nombreLimpio = limpiarTexto(item.Producto);
//       if (!medicamentosUnicos[nombreLimpio]) {
//         medicamentosUnicos[nombreLimpio] = {
//           nombre: nombreLimpio,
//           codigo: `MED${item.Codigo}`,
//           categoria: obtenerCategoria(nombreLimpio),
//           presentacion: limpiarTexto(item.Presentacion),
//           descripcion: `Medicamento de ${obtenerCategoria(nombreLimpio)}`
//         };
//       }
//     });

//     const medicamentosCreados = {};
//     for (const [nombre, medData] of Object.entries(medicamentosUnicos)) {
//       // Buscar si ya existe un medicamento con este código
//       let medicamento = await prisma.medicamento.findUnique({
//         where: { codigo: medData.codigo }
//       });

//       // Si no existe, crear
//       if (!medicamento) {
//         medicamento = await prisma.medicamento.create({
//           data: medData
//         });
//       }
      
//       medicamentosCreados[nombre] = medicamento;
//     }

//     // 5. Crear inventarios y generar ventas
//     const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

//     for (const item of datosVillaFaro) {
//       const nombreLimpio = limpiarTexto(item.Producto);
//       const medicamento = medicamentosCreados[nombreLimpio];
      
//       // Solo crear inventario si tiene stock
//       if (item.Entrada > 0) {
//         // Buscar si ya existe un inventario para este medicamento en esta farmacia
//         let inventario = await prisma.inventario.findFirst({
//           where: {
//             farmaciaId: farmacia.id,
//             medicamentoId: medicamento.id
//           }
//         });

//         // Si no existe, crear
//         if (!inventario) {
//           inventario = await prisma.inventario.create({
//             data: {
//               farmaciaId: farmacia.id,
//               medicamentoId: medicamento.id,
//               stock: item.Entrada,
//               stockMinimo: 10,
//               precio: Math.floor(Math.random() * 5000) + 1000, // Precio aleatorio
//               vencimiento: new Date(2025, 11, 31) // Fecha de vencimiento a fin de 2025
//             }
//           });
//         }

//         // Generar ventas
//         if (item.Ventas > 0) {
//           const mesIndex = meses.indexOf(item.Mes);
//           const fechaVenta = new Date(2024, mesIndex, Math.floor(Math.random() * 28) + 1);

//           // Verificar si ya existe una venta similar
//           const ventaExistente = await prisma.venta.findFirst({
//             where: {
//               inventarioId: inventario.id,
//               fecha: fechaVenta,
//               cantidad: item.Ventas
//             }
//           });

//           if (!ventaExistente) {
//             const venta = await prisma.venta.create({
//               data: {
//                 cantidad: item.Ventas,
//                 farmaciaId: farmacia.id,
//                 inventarioId: inventario.id,
//                 precioUnitario: inventario.precio,
//                 fecha: fechaVenta,
//                 mes: mesIndex + 1,
//                 anio: 2024,
//                 usuarioId: farmaciaUsuario.id
//               }
//             });

//             // Registrar movimiento de inventario
//             await prisma.movimientoInventario.create({
//               data: {
//                 tipo: 'SALIDA',
//                 cantidad: item.Ventas,
//                 inventarioId: inventario.id,
//                 farmaciaId: farmacia.id,
//                 usuarioId: farmaciaUsuario.id,
//                 fecha: fechaVenta,
//                 observacion: `Venta de ${nombreLimpio}`
//               }
//             });

//             // Generar algunas devoluciones aleatorias
//             if (Math.random() < 0.2) { // 20% de probabilidad de devolución
//               const cantidadDevolucion = Math.floor(item.Ventas * 0.1); // 10% de la venta
//               if (cantidadDevolucion > 0) {
//                 const devolucionExistente = await prisma.devolucion.findFirst({
//                   where: {
//                     inventarioId: inventario.id,
//                     cantidad: cantidadDevolucion,
//                     fecha: fechaVenta
//                   }
//                 });

//                 if (!devolucionExistente) {
//                   await prisma.devolucion.create({
//                     data: {
//                       cantidad: cantidadDevolucion,
//                       motivo: 'Producto en exceso',
//                       farmaciaId: farmacia.id,
//                       inventarioId: inventario.id,
//                       estado: 'PENDIENTE',
//                       usuarioId: farmaciaUsuario.id,
//                       fecha: new Date(2024, mesIndex, Math.floor(Math.random() * 28) + 1),
//                       mes: mesIndex + 1,
//                       anio: 2024
//                     }
//                   });
//                 }
//               }
//             }
//           }
//         }
//       }
//     }

//     // 6. Generar algunas reservas aleatorias
//     const inventarios = await prisma.inventario.findMany({
//       where: { 
//         farmaciaId: farmacia.id,
//         stock: { gt: 0 } 
//       }
//     });

//     // Generar 10 reservas aleatorias
//     for (let i = 0; i < 10; i++) {
//       const inventario = inventarios[Math.floor(Math.random() * inventarios.length)];
      
//       // Verificar si ya existe una reserva similar
//       const reservaExistente = await prisma.reserva.findFirst({
//         where: {
//           inventarioId: inventario.id,
//           nombreCliente: `Cliente ${i + 1}`
//         }
//       });

//       if (!reservaExistente) {
//         await prisma.reserva.create({
//           data: {
//             farmaciaId: farmacia.id,
//             inventarioId: inventario.id,
//             nombreCliente: `Cliente ${i + 1}`,
//             telefonoCliente: `809-555-${Math.floor(1000 + Math.random() * 9000)}`,
//             estado: 'PENDIENTE',
//             fecha: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1)
//           }
//         });
//       }
//     }

//     console.log("Migración de datos de Villa Faro completa.");
//     return { farmacia, adminUsuario, farmaciaUsuario };

//   } catch (error) {
//     console.error('Error al migrar datos:', error);
//     throw error;
//   } finally {
//     await prisma.$disconnect();
//   }
// }

// // Ejecutar la función
// migrarDatosVillaFaro()
//   .then(() => {
//     console.log('Proceso completado exitosamente.');
//     process.exit(0);
//   })
//   .catch((error) => {
//     console.error('Error en el proceso:', error);
//     process.exit(1);
//   });


// LOSMINA

// // apps/backend/migrar-datos-los-mina.js
// const { PrismaClient } = require('@prisma/client');
// const bcrypt = require('bcrypt');
// const fs = require('fs');
// const path = require('path');

// const prisma = new PrismaClient();

// // Lee y parsea el archivo CSV
// function parsearDatosLosMina() {
//   const filePath = path.join(__dirname, 'lomina.txt');
//   const fileContent = fs.readFileSync(filePath, 'utf8');
//   return JSON.parse(fileContent);
// }

// // Función para generar contraseña hash
// async function generarContrasena() {
//   const salt = await bcrypt.genSalt(10);
//   return await bcrypt.hash('farmacia123', salt);
// }

// // Función para limpiar caracteres especiales
// function limpiarTexto(texto) {
//   return texto.replace(/Ã¡/g, 'á')
//               .replace(/Ã©/g, 'é')
//               .replace(/Ã­/g, 'í')
//               .replace(/Ã³/g, 'ó')
//               .replace(/Ãº/g, 'ú')
//               .replace(/Ã±/g, 'ñ')
//               .replace(/Ã"/g, 'Ó')
//               .replace(/Ã"/g, 'Ñ');
// }

// // Función para obtener categoría de medicamento
// function obtenerCategoria(nombre) {
//   const categorias = {
//     'Paracetamol': 'Analgésicos',
//     'Ibuprofeno': 'Antiinflamatorios',
//     'Amoxicilina': 'Antibióticos',
//     'Losartán': 'Antihipertensivos',
//     'Metformina': 'Antidiabéticos',
//     'Omeprazol': 'Inhibidores de bomba de protones',
//     'Salbutamol': 'Broncodilatadores',
//     'Vitamina': 'Vitaminas',
//     'Prednisona': 'Corticosteroides',
//     'Atorvastatina': 'Antilipemiantes',
//     'Heparina': 'Anticoagulantes',
//     'Diclofenaco': 'Antiinflamatorios',
//     'Naproxeno': 'Antiinflamatorios',
//     'Azitromicina': 'Antibióticos'
//   };

//   for (const [key, categoria] of Object.entries(categorias)) {
//     if (nombre.includes(key)) return categoria;
//   }
  
//   return 'Otros medicamentos';
// }

// // Función para encontrar o crear usuario
// async function encontrarOCrearUsuario(datos) {
//   try {
//     // Primero, intentar encontrar por email
//     let usuario = await prisma.usuario.findUnique({
//       where: { email: datos.email }
//     });

//     // Si no existe, crear
//     if (!usuario) {
//       const hashedPassword = await generarContrasena();
//       usuario = await prisma.usuario.create({
//         data: {
//           ...datos,
//           password: hashedPassword
//         }
//       });
//     }

//     return usuario;
//   } catch (error) {
//     // Si hay un error único (como email duplicado), buscar nuevamente
//     if (error.code === 'P2002') {
//       return await prisma.usuario.findUnique({
//         where: { email: datos.email }
//       });
//     }
//     throw error;
//   }
// }

// // Función para encontrar o crear farmacia
// async function encontrarOCrearFarmacia(datos) {
//   try {
//     // Primero, intentar encontrar por nombre
//     let farmacia = await prisma.farmacia.findFirst({
//       where: { nombre: datos.nombre }
//     });

//     // Si no existe, crear
//     if (!farmacia) {
//       farmacia = await prisma.farmacia.create({
//         data: datos
//       });
//     }

//     return farmacia;
//   } catch (error) {
//     // Si hay un error, buscar nuevamente
//     if (error.code === 'P2002') {
//       return await prisma.farmacia.findFirst({
//         where: { nombre: datos.nombre }
//       });
//     }
//     throw error;
//   }
// }

// async function migrarDatosLosMina() {
//   try {
//     console.log("Iniciando migración de datos de Los Mina...");

//     // 1. Crear farmacia base
//     const farmacia = await encontrarOCrearFarmacia({
//       nombre: "Farmacia Los Mina",
//       direccion: "Barrio Los Mina, Santo Domingo",
//       latitud: 18.4861,
//       longitud: -69.9312
//     });

//     // 2. Crear usuario administrador y de farmacia
//     const adminUsuario = await encontrarOCrearUsuario({
//       nombre: "Administrador Los Mina",
//       email: "admin.losmina@farmacia.com",
//       rol: 'ADMIN'
//     });

//     const farmaciaUsuario = await encontrarOCrearUsuario({
//       nombre: "María Rodríguez",
//       email: "maria.rodriguez@farmacia.com",
//       rol: 'FARMACIA'
//     });

//     // Asignar farmacia al usuario si aún no lo está
//     if (farmaciaUsuario) {
//       const usuarioConFarmacia = await prisma.usuario.update({
//         where: { id: farmaciaUsuario.id },
//         data: {
//           farmacias: {
//             connect: [{ id: farmacia.id }]
//           },
//           farmaciaActiva: {
//             connect: { id: farmacia.id }
//           }
//         }
//       });
//     }

//     // 3. Procesar datos de Los Mina
//     const datosLosMina = parsearDatosLosMina();

//     // 4. Crear medicamentos únicos
//     const medicamentosUnicos = {};
//     datosLosMina.forEach(item => {
//       const nombreLimpio = limpiarTexto(item.Producto);
//       if (!medicamentosUnicos[nombreLimpio]) {
//         medicamentosUnicos[nombreLimpio] = {
//           nombre: nombreLimpio,
//           codigo: `MED${item.Codigo}`,
//           categoria: obtenerCategoria(nombreLimpio),
//           presentacion: limpiarTexto(item.Presentacion),
//           descripcion: `Medicamento de ${obtenerCategoria(nombreLimpio)}`
//         };
//       }
//     });

//     const medicamentosCreados = {};
//     for (const [nombre, medData] of Object.entries(medicamentosUnicos)) {
//       // Buscar si ya existe un medicamento con este código
//       let medicamento = await prisma.medicamento.findUnique({
//         where: { codigo: medData.codigo }
//       });

//       // Si no existe, crear
//       if (!medicamento) {
//         medicamento = await prisma.medicamento.create({
//           data: medData
//         });
//       }
      
//       medicamentosCreados[nombre] = medicamento;
//     }

//     // 5. Crear inventarios y generar ventas
//     const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

//     for (const item of datosLosMina) {
//       const nombreLimpio = limpiarTexto(item.Producto);
//       const medicamento = medicamentosCreados[nombreLimpio];
      
//       // Solo crear inventario si tiene stock
//       if (item.Entrada > 0) {
//         // Buscar si ya existe un inventario para este medicamento en esta farmacia
//         let inventario = await prisma.inventario.findFirst({
//           where: {
//             farmaciaId: farmacia.id,
//             medicamentoId: medicamento.id
//           }
//         });

//         // Si no existe, crear
//         if (!inventario) {
//           inventario = await prisma.inventario.create({
//             data: {
//               farmaciaId: farmacia.id,
//               medicamentoId: medicamento.id,
//               stock: item.Entrada,
//               stockMinimo: 10,
//               precio: Math.floor(Math.random() * 5000) + 1000, // Precio aleatorio
//               vencimiento: new Date(2025, 11, 31) // Fecha de vencimiento a fin de 2025
//             }
//           });
//         }

//         // Generar ventas
//         if (item.Ventas > 0) {
//           const mesIndex = meses.indexOf(item.Mes);
//           const fechaVenta = new Date(2024, mesIndex, Math.floor(Math.random() * 28) + 1);

//           // Verificar si ya existe una venta similar
//           const ventaExistente = await prisma.venta.findFirst({
//             where: {
//               inventarioId: inventario.id,
//               fecha: fechaVenta,
//               cantidad: item.Ventas
//             }
//           });

//           if (!ventaExistente) {
//             const venta = await prisma.venta.create({
//               data: {
//                 cantidad: item.Ventas,
//                 farmaciaId: farmacia.id,
//                 inventarioId: inventario.id,
//                 precioUnitario: inventario.precio,
//                 fecha: fechaVenta,
//                 mes: mesIndex + 1,
//                 anio: 2024,
//                 usuarioId: farmaciaUsuario.id
//               }
//             });

//             // Registrar movimiento de inventario
//             await prisma.movimientoInventario.create({
//               data: {
//                 tipo: 'SALIDA',
//                 cantidad: item.Ventas,
//                 inventarioId: inventario.id,
//                 farmaciaId: farmacia.id,
//                 usuarioId: farmaciaUsuario.id,
//                 fecha: fechaVenta,
//                 observacion: `Venta de ${nombreLimpio}`
//               }
//             });

//             // Generar algunas devoluciones aleatorias
//             if (Math.random() < 0.2) { // 20% de probabilidad de devolución
//               const cantidadDevolucion = Math.floor(item.Ventas * 0.1); // 10% de la venta
//               if (cantidadDevolucion > 0) {
//                 const devolucionExistente = await prisma.devolucion.findFirst({
//                   where: {
//                     inventarioId: inventario.id,
//                     cantidad: cantidadDevolucion,
//                     fecha: fechaVenta
//                   }
//                 });

//                 if (!devolucionExistente) {
//                   await prisma.devolucion.create({
//                     data: {
//                       cantidad: cantidadDevolucion,
//                       motivo: 'Producto en exceso',
//                       farmaciaId: farmacia.id,
//                       inventarioId: inventario.id,
//                       estado: 'PENDIENTE',
//                       usuarioId: farmaciaUsuario.id,
//                       fecha: new Date(2024, mesIndex, Math.floor(Math.random() * 28) + 1),
//                       mes: mesIndex + 1,
//                       anio: 2024
//                     }
//                   });
//                 }
//               }
//             }
//           }
//         }
//       }
//     }

//     // 6. Generar algunas reservas aleatorias
//     const inventarios = await prisma.inventario.findMany({
//       where: { 
//         farmaciaId: farmacia.id,
//         stock: { gt: 0 } 
//       }
//     });

//     // Generar 10 reservas aleatorias
//     for (let i = 0; i < 10; i++) {
//       const inventario = inventarios[Math.floor(Math.random() * inventarios.length)];
      
//       // Verificar si ya existe una reserva similar
//       const reservaExistente = await prisma.reserva.findFirst({
//         where: {
//           inventarioId: inventario.id,
//           nombreCliente: `Cliente ${i + 1}`
//         }
//       });

//       if (!reservaExistente) {
//         await prisma.reserva.create({
//           data: {
//             farmaciaId: farmacia.id,
//             inventarioId: inventario.id,
//             nombreCliente: `Cliente ${i + 1}`,
//             telefonoCliente: `809-555-${Math.floor(1000 + Math.random() * 9000)}`,
//             estado: 'PENDIENTE',
//             fecha: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1)
//           }
//         });
//       }
//     }

//     console.log("Migración de datos de Los Mina completa.");
//     return { farmacia, adminUsuario, farmaciaUsuario };

//   } catch (error) {
//     console.error('Error al migrar datos:', error);
//     throw error;
//   } finally {
//     await prisma.$disconnect();
//   }
// }

// // Ejecutar la función
// migrarDatosLosMina()
//   .then(() => {
//     console.log('Proceso completado exitosamente.');
//     process.exit(0);
//   })
//   .catch((error) => {
//     console.error('Error en el proceso:', error);
//     process.exit(1);
//   });



// ALMIRANTE

// // apps/backend/migrar-datos-completos.js
// const { PrismaClient } = require('@prisma/client');
// const bcrypt = require('bcrypt');
// const fs = require('fs');
// const path = require('path');

// const prisma = new PrismaClient();

// // Lee y parsea el archivo CSV
// function parsearDatosAlmirante() {
//   const filePath = path.join(__dirname, 'almirante.txt');
//   const fileContent = fs.readFileSync(filePath, 'utf8');
//   return JSON.parse(fileContent);
// }

// // Función para generar contraseña hash
// async function generarContrasena() {
//   const salt = await bcrypt.genSalt(10);
//   return await bcrypt.hash('farmacia123', salt);
// }

// // Función para limpiar caracteres especiales
// function limpiarTexto(texto) {
//   return texto.replace(/Ã¡/g, 'á')
//               .replace(/Ã©/g, 'é')
//               .replace(/Ã­/g, 'í')
//               .replace(/Ã³/g, 'ó')
//               .replace(/Ãº/g, 'ú')
//               .replace(/Ã±/g, 'ñ')
//               .replace(/Ã"/g, 'Ó')
//               .replace(/Ã"/g, 'Ñ');
// }

// // Función para obtener categoría de medicamento
// function obtenerCategoria(nombre) {
//   const categorias = {
//     'Paracetamol': 'Analgésicos',
//     'Ibuprofeno': 'Antiinflamatorios',
//     'Amoxicilina': 'Antibióticos',
//     'Losartán': 'Antihipertensivos',
//     'Metformina': 'Antidiabéticos',
//     'Omeprazol': 'Inhibidores de bomba de protones',
//     'Salbutamol': 'Broncodilatadores',
//     'Vitamina': 'Vitaminas',
//     'Prednisona': 'Corticosteroides',
//     'Atorvastatina': 'Antilipemiantes'
//   };

//   for (const [key, categoria] of Object.entries(categorias)) {
//     if (nombre.includes(key)) return categoria;
//   }
  
//   return 'Otros medicamentos';
// }

// // Función para encontrar o crear usuario
// async function encontrarOCrearUsuario(datos) {
//   try {
//     // Primero, intentar encontrar por email
//     let usuario = await prisma.usuario.findUnique({
//       where: { email: datos.email }
//     });

//     // Si no existe, crear
//     if (!usuario) {
//       const hashedPassword = await generarContrasena();
//       usuario = await prisma.usuario.create({
//         data: {
//           ...datos,
//           password: hashedPassword
//         }
//       });
//     }

//     return usuario;
//   } catch (error) {
//     // Si hay un error único (como email duplicado), buscar nuevamente
//     if (error.code === 'P2002') {
//       return await prisma.usuario.findUnique({
//         where: { email: datos.email }
//       });
//     }
//     throw error;
//   }
// }

// // Función para encontrar o crear farmacia
// async function encontrarOCrearFarmacia(datos) {
//   try {
//     // Primero, intentar encontrar por nombre
//     let farmacia = await prisma.farmacia.findFirst({
//       where: { nombre: datos.nombre }
//     });

//     // Si no existe, crear
//     if (!farmacia) {
//       farmacia = await prisma.farmacia.create({
//         data: datos
//       });
//     }

//     return farmacia;
//   } catch (error) {
//     // Si hay un error, buscar nuevamente
//     if (error.code === 'P2002') {
//       return await prisma.farmacia.findFirst({
//         where: { nombre: datos.nombre }
//       });
//     }
//     throw error;
//   }
// }

// async function migrarDatosCompletos() {
//   try {
//     console.log("Iniciando migración de datos completos...");

//     // 1. Crear farmacia base
//     const farmacia = await encontrarOCrearFarmacia({
//       nombre: "Farmacia El Almirante",
//       direccion: "Barrio El Almirante, Santo Domingo",
//       latitud: 18.4861,
//       longitud: -69.9312
//     });

//     // 2. Crear usuario administrador y de farmacia
//     const adminUsuario = await encontrarOCrearUsuario({
//       nombre: "Administrador El Almirante",
//       email: "admin.almirante@farmacia.com",
//       rol: 'ADMIN'
//     });

//     const farmaciaUsuario = await encontrarOCrearUsuario({
//       nombre: "Juan Mendoza",
//       email: "juan.mendoza@farmacia.com",
//       rol: 'FARMACIA'
//     });

//     // Asignar farmacia al usuario si aún no lo está
//     if (farmaciaUsuario) {
//       const usuarioConFarmacia = await prisma.usuario.update({
//         where: { id: farmaciaUsuario.id },
//         data: {
//           farmacias: {
//             connect: [{ id: farmacia.id }]
//           },
//           farmaciaActiva: {
//             connect: { id: farmacia.id }
//           }
//         }
//       });
//     }

//     // 3. Procesar datos de Almirante
//     const datosAlmirante = parsearDatosAlmirante();

//     // 4. Crear medicamentos únicos
//     const medicamentosUnicos = {};
//     datosAlmirante.forEach(item => {
//       const nombreLimpio = limpiarTexto(item.Producto);
//       if (!medicamentosUnicos[nombreLimpio]) {
//         medicamentosUnicos[nombreLimpio] = {
//           nombre: nombreLimpio,
//           codigo: `MED${item.Codigo}`,
//           categoria: obtenerCategoria(nombreLimpio),
//           presentacion: limpiarTexto(item.Presentacion),
//           descripcion: `Medicamento de ${obtenerCategoria(nombreLimpio)}`
//         };
//       }
//     });

//     const medicamentosCreados = {};
//     for (const [nombre, medData] of Object.entries(medicamentosUnicos)) {
//       // Buscar si ya existe un medicamento con este código
//       let medicamento = await prisma.medicamento.findUnique({
//         where: { codigo: medData.codigo }
//       });

//       // Si no existe, crear
//       if (!medicamento) {
//         medicamento = await prisma.medicamento.create({
//           data: medData
//         });
//       }
      
//       medicamentosCreados[nombre] = medicamento;
//     }

//     // 5. Crear inventarios y generar ventas
//     const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

//     for (const item of datosAlmirante) {
//       const nombreLimpio = limpiarTexto(item.Producto);
//       const medicamento = medicamentosCreados[nombreLimpio];
      
//       // Solo crear inventario si tiene stock
//       if (item.Entrada > 0) {
//         // Buscar si ya existe un inventario para este medicamento en esta farmacia
//         let inventario = await prisma.inventario.findFirst({
//           where: {
//             farmaciaId: farmacia.id,
//             medicamentoId: medicamento.id
//           }
//         });

//         // Si no existe, crear
//         if (!inventario) {
//           inventario = await prisma.inventario.create({
//             data: {
//               farmaciaId: farmacia.id,
//               medicamentoId: medicamento.id,
//               stock: item.Entrada,
//               stockMinimo: 10,
//               precio: Math.floor(Math.random() * 5000) + 1000, // Precio aleatorio
//               vencimiento: new Date(2025, 11, 31) // Fecha de vencimiento a fin de 2025
//             }
//           });
//         }

//         // Generar ventas
//         if (item.Ventas > 0) {
//           const mesIndex = meses.indexOf(item.Mes);
//           const fechaVenta = new Date(2024, mesIndex, Math.floor(Math.random() * 28) + 1);

//           // Verificar si ya existe una venta similar
//           const ventaExistente = await prisma.venta.findFirst({
//             where: {
//               inventarioId: inventario.id,
//               fecha: fechaVenta,
//               cantidad: item.Ventas
//             }
//           });

//           if (!ventaExistente) {
//             const venta = await prisma.venta.create({
//               data: {
//                 cantidad: item.Ventas,
//                 farmaciaId: farmacia.id,
//                 inventarioId: inventario.id,
//                 precioUnitario: inventario.precio,
//                 fecha: fechaVenta,
//                 mes: mesIndex + 1,
//                 anio: 2024,
//                 usuarioId: farmaciaUsuario.id
//               }
//             });

//             // Registrar movimiento de inventario
//             await prisma.movimientoInventario.create({
//               data: {
//                 tipo: 'SALIDA',
//                 cantidad: item.Ventas,
//                 inventarioId: inventario.id,
//                 farmaciaId: farmacia.id,
//                 usuarioId: farmaciaUsuario.id,
//                 fecha: fechaVenta,
//                 observacion: `Venta de ${nombreLimpio}`
//               }
//             });

//             // Generar algunas devoluciones aleatorias
//             if (Math.random() < 0.2) { // 20% de probabilidad de devolución
//               const cantidadDevolucion = Math.floor(item.Ventas * 0.1); // 10% de la venta
//               if (cantidadDevolucion > 0) {
//                 const devolucionExistente = await prisma.devolucion.findFirst({
//                   where: {
//                     inventarioId: inventario.id,
//                     cantidad: cantidadDevolucion,
//                     fecha: fechaVenta
//                   }
//                 });

//                 if (!devolucionExistente) {
//                   await prisma.devolucion.create({
//                     data: {
//                       cantidad: cantidadDevolucion,
//                       motivo: 'Producto en exceso',
//                       farmaciaId: farmacia.id,
//                       inventarioId: inventario.id,
//                       estado: 'PENDIENTE',
//                       usuarioId: farmaciaUsuario.id,
//                       fecha: new Date(2024, mesIndex, Math.floor(Math.random() * 28) + 1),
//                       mes: mesIndex + 1,
//                       anio: 2024
//                     }
//                   });
//                 }
//               }
//             }
//           }
//         }
//       }
//     }

//     // 6. Generar algunas reservas aleatorias
//     const inventarios = await prisma.inventario.findMany({
//       where: { 
//         farmaciaId: farmacia.id,
//         stock: { gt: 0 } 
//       }
//     });

//     // Generar 10 reservas aleatorias
//     for (let i = 0; i < 10; i++) {
//       const inventario = inventarios[Math.floor(Math.random() * inventarios.length)];
      
//       // Verificar si ya existe una reserva similar
//       const reservaExistente = await prisma.reserva.findFirst({
//         where: {
//           inventarioId: inventario.id,
//           nombreCliente: `Cliente ${i + 1}`
//         }
//       });

//       if (!reservaExistente) {
//         await prisma.reserva.create({
//           data: {
//             farmaciaId: farmacia.id,
//             inventarioId: inventario.id,
//             nombreCliente: `Cliente ${i + 1}`,
//             telefonoCliente: `809-555-${Math.floor(1000 + Math.random() * 9000)}`,
//             estado: 'PENDIENTE',
//             fecha: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1)
//           }
//         });
//       }
//     }

//     console.log("Migración de datos completa.");
//     return { farmacia, adminUsuario, farmaciaUsuario };

//   } catch (error) {
//     console.error('Error al migrar datos:', error);
//     throw error;
//   } finally {
//     await prisma.$disconnect();
//   }
// }

// // Ejecutar la función
// migrarDatosCompletos()
//   .then(() => {
//     console.log('Proceso completado exitosamente.');
//     process.exit(0);
//   })
//   .catch((error) => {
//     console.error('Error en el proceso:', error);
//     process.exit(1);
//   });