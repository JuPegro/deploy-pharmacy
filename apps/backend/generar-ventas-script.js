const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function generarVentas() {
  try {
    // Verificar usuarios
    const usuarios = await prisma.usuario.findMany();
    console.log(`Usuarios encontrados: ${usuarios.length}`);
    if (usuarios.length === 0) {
      throw new Error('No hay usuarios para asociar ventas');
    }

    // Verificar inventarios
    const inventariosConStock = await prisma.inventario.findMany({
      where: {
        stock: {
          gt: 0 // Solo inventarios con stock mayor a 0
        }
      },
      include: {
        farmacia: true,
        medicamento: true
      }
    });
    console.log(`Inventarios con stock: ${inventariosConStock.length}`);
    if (inventariosConStock.length === 0) {
      throw new Error('No hay inventarios con stock disponible');
    }

    // Generar ventas
    const ventas = [];

    // Determinar número de ventas a generar
    const numVentas = Math.max(15, Math.floor(inventariosConStock.length * 0.5));
    console.log(`Generando ${numVentas} ventas`);

    // Conjunto para rastrear inventarios ya usados
    const inventariosUsados = new Set();

    for (let i = 0; i < numVentas; i++) {
      // Seleccionar un inventario que no haya sido usado
      let inventarioSeleccionado;
      do {
        inventarioSeleccionado = inventariosConStock[
          Math.floor(Math.random() * inventariosConStock.length)
        ];
      } while (
        inventariosUsados.has(inventarioSeleccionado.id) || 
        inventarioSeleccionado.stock === 0
      );

      // Calcular cantidad de venta (entre 1 y el stock disponible)
      const cantidadMaxima = Math.min(inventarioSeleccionado.stock, 10);
      const cantidadVenta = Math.floor(Math.random() * cantidadMaxima) + 1;

      // Seleccionar usuario aleatorio
      const usuarioSeleccionado = usuarios[Math.floor(Math.random() * usuarios.length)];

      // Crear objeto de venta
      const venta = {
        inventarioId: inventarioSeleccionado.id,
        farmaciaId: inventarioSeleccionado.farmaciaId,
        cantidad: cantidadVenta,
        precioUnitario: inventarioSeleccionado.precio,
        usuarioId: usuarioSeleccionado.id,
        fecha: new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000))
      };

      ventas.push(venta);
      inventariosUsados.add(inventarioSeleccionado.id);

      console.log(`Venta generada - Medicamento: ${inventarioSeleccionado.medicamento.nombre}, Cantidad: ${cantidadVenta}`);
    }

    // Iniciar transacción
    await prisma.$transaction(async (tx) => {
      // Crear ventas
      const resultadoVentas = await tx.venta.createMany({
        data: ventas
      });
      console.log(`Ventas creadas: ${resultadoVentas.count}`);

      // Actualizar stocks de inventario
      for (const venta of ventas) {
        await tx.inventario.update({
          where: { id: venta.inventarioId },
          data: {
            stock: {
              decrement: venta.cantidad
            }
          }
        });
      }

      // Verificar ventas creadas
      const ventasRegistradas = await tx.venta.findMany({
        where: {
          fecha: {
            gte: new Date(Date.now() - 31 * 24 * 60 * 60 * 1000) // Últimos 31 días
          }
        },
        include: {
          farmacia: { select: { nombre: true } },
          inventario: { 
            include: { 
              medicamento: { select: { nombre: true } } 
            } 
          }
        }
      });

      console.log("\nDetalles de ventas generadas:");
      ventasRegistradas.forEach(venta => {
        console.log(`- Farmacia: ${venta.farmacia.nombre}`);
        console.log(`  Medicamento: ${venta.inventario.medicamento.nombre}`);
        console.log(`  Cantidad: ${venta.cantidad}`);
        console.log(`  Precio Unitario: $${venta.precioUnitario}`);
        console.log(`  Fecha: ${venta.fecha}`);
        console.log('---');
      });
    });

    console.log('Proceso de generación de ventas completado con éxito');
  } catch (error) {
    console.error('Error al generar ventas:', error);
    console.error('Detalles del error:', error.message);
    console.error('Traza del error:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar generación de ventas
generarVentas();