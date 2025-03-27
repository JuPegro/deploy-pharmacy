const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Motivos de devolución predefinidos
const motivosDevoluciones = [
  'Producto dañado',
  'Fecha de vencimiento próxima',
  'Error en pedido',
  'Sobrestock',
  'Producto no solicitado',
  'Cambio de medicamento',
  'Deterioro del empaque'
];

async function generarDevoluciones() {
  try {
    // Iniciar transacción
    const resultado = await prisma.$transaction(async (tx) => {
      // Obtener ventas recientes con inventarios y medicamentos
      const ventas = await tx.venta.findMany({
        where: {
          fecha: {
            gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) // Ventas de los últimos 90 días
          }
        },
        include: {
          inventario: {
            include: {
              medicamento: true,
              farmacia: true
            }
          }
        }
      });

      console.log(`Ventas encontradas: ${ventas.length}`);
      
      if (ventas.length === 0) {
        throw new Error('No hay ventas para generar devoluciones');
      }

      // Generar devoluciones
      const devoluciones = [];
      const inventariosDevueltos = new Set();

      // Generar 10 devoluciones o el máximo posible
      const numDevoluciones = Math.min(10, ventas.length);
      console.log(`Generando ${numDevoluciones} devoluciones`);

      for (let i = 0; i < numDevoluciones; i++) {
        // Seleccionar una venta que no haya sido devuelta aún
        let ventaSeleccionada;
        do {
          ventaSeleccionada = ventas[Math.floor(Math.random() * ventas.length)];
        } while (
          inventariosDevueltos.has(ventaSeleccionada.inventarioId)
        );

        // Calcular cantidad de devolución (entre 1 y el 30% de la venta original)
        const cantidadMaxima = Math.min(
          ventaSeleccionada.cantidad, 
          Math.floor(ventaSeleccionada.cantidad * 0.3)
        );
        const cantidadDevolucion = Math.floor(Math.random() * cantidadMaxima) + 1;

        // Crear objeto de devolución
        const devolucion = {
          inventarioId: ventaSeleccionada.inventarioId,
          farmaciaId: ventaSeleccionada.farmaciaId,
          cantidad: cantidadDevolucion,
          motivo: motivosDevoluciones[Math.floor(Math.random() * motivosDevoluciones.length)],
          fecha: new Date(Date.now() - Math.floor(Math.random() * 90 * 24 * 60 * 60 * 1000))
        };

        devoluciones.push(devolucion);
        inventariosDevueltos.add(ventaSeleccionada.inventarioId);

        console.log(`Devolución generada - Medicamento: ${ventaSeleccionada.inventario.medicamento.nombre}, Cantidad: ${cantidadDevolucion}`);
      }

      // Crear devoluciones
      const resultadoDevoluciones = await tx.devolucion.createMany({
        data: devoluciones
      });
      console.log(`Devoluciones creadas: ${resultadoDevoluciones.count}`);

      // Actualizar stocks de inventario
      for (const devolucion of devoluciones) {
        await tx.inventario.update({
          where: { id: devolucion.inventarioId },
          data: {
            stock: {
              increment: devolucion.cantidad
            }
          }
        });
      }

      // Verificar devoluciones creadas
      const devolucionesRegistradas = await tx.devolucion.findMany({
        where: {
          fecha: {
            gte: new Date(Date.now() - 91 * 24 * 60 * 60 * 1000) // Últimos 91 días
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

      console.log("\nDetalles de devoluciones generadas:");
      devolucionesRegistradas.forEach(devolucion => {
        console.log(`- Farmacia: ${devolucion.farmacia.nombre}`);
        console.log(`  Medicamento: ${devolucion.inventario.medicamento.nombre}`);
        console.log(`  Cantidad: ${devolucion.cantidad}`);
        console.log(`  Motivo: ${devolucion.motivo}`);
        console.log(`  Fecha: ${devolucion.fecha}`);
        console.log('---');
      });

      return devolucionesRegistradas;
    });

    console.log('Proceso de generación de devoluciones completado con éxito');
    return resultado;
  } catch (error) {
    console.error('Error al generar devoluciones:', error);
    console.error('Detalles del error:', error.message);
    console.error('Traza del error:', error.stack);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar generación de devoluciones
generarDevoluciones();