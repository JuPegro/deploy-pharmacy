// apps/backend/scripts/generar-devoluciones.js
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
    console.log("Iniciando generación de devoluciones...");
    
    // Obtener ventas recientes
    const ventas = await prisma.venta.findMany({
      where: {
        fecha: {
          gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) // Ventas de los últimos 90 días
        }
      },
      include: {
        inventario: {
          include: {
            medicamento: true
          }
        },
        farmacia: true
      }
    });
    
    console.log(`Ventas encontradas: ${ventas.length}`);
    
    if (ventas.length === 0) {
      throw new Error('No hay ventas para generar devoluciones. Ejecute primero el script de ventas.');
    }
    
    // Determinar número de devoluciones a generar (aproximadamente 10% de las ventas)
    const numDevoluciones = Math.min(Math.ceil(ventas.length * 0.1), 20);
    console.log(`Generando ${numDevoluciones} devoluciones...`);
    
    // Conjunto para rastrear ventas ya devueltas (para evitar duplicados)
    const ventasDevueltas = new Set();
    
    const devoluciones = [];
    
    for (let i = 0; i < numDevoluciones; i++) {
      // Seleccionar una venta que no haya sido devuelta
      let ventaSeleccionada;
      let intentos = 0;
      
      do {
        ventaSeleccionada = ventas[Math.floor(Math.random() * ventas.length)];
        intentos++;
        
        if (intentos > 100) {
          // Evitar bucle infinito si hay pocas ventas
          console.log("Demasiados intentos para encontrar una venta no devuelta. Reiniciando conjunto...");
          ventasDevueltas.clear();
          break;
        }
      } while (
        ventasDevueltas.has(ventaSeleccionada.id) && 
        ventasDevueltas.size < ventas.length
      );
      
      // Marcar esta venta como devuelta
      ventasDevueltas.add(ventaSeleccionada.id);
      
      // Calcular cantidad de devolución (entre 1 y la cantidad vendida)
      const cantidadDevolucion = Math.min(
        ventaSeleccionada.cantidad,
        Math.floor(Math.random() * ventaSeleccionada.cantidad) + 1
      );
      
      // Seleccionar un motivo aleatorio
      const motivoAleatorio = motivosDevoluciones[
        Math.floor(Math.random() * motivosDevoluciones.length)
      ];
      
      // Generar fecha de devolución (después de la fecha de venta)
      const fechaVenta = new Date(ventaSeleccionada.fecha);
      const diasAleatorios = Math.floor(Math.random() * 14) + 1; // Entre 1 y 14 días después
      const fechaDevolucion = new Date(fechaVenta);
      fechaDevolucion.setDate(fechaVenta.getDate() + diasAleatorios);
      
      // Asegurarse de que la fecha no sea futura
      const hoy = new Date();
      if (fechaDevolucion > hoy) {
        fechaDevolucion.setTime(hoy.getTime());
      }
      
      // Crear objeto de devolución
      devoluciones.push({
        cantidad: cantidadDevolucion,
        motivo: motivoAleatorio,
        fecha: fechaDevolucion,
        inventarioId: ventaSeleccionada.inventarioId,
        farmaciaId: ventaSeleccionada.farmaciaId,
        estado: ['PENDIENTE', 'APROBADA', 'RECHAZADA'][Math.floor(Math.random() * 3)] // Estado aleatorio
      });
    }
    
    // Crear devoluciones en la base de datos
    const devolucionesCreadas = await prisma.$transaction(async (tx) => {
      const resultado = [];
      
      for (const devolucion of devoluciones) {
        const devolucionCreada = await tx.devolucion.create({
          data: devolucion,
          include: {
            inventario: {
              include: {
                medicamento: true
              }
            },
            farmacia: true
          }
        });
        
        resultado.push(devolucionCreada);
        
        // Si la devolución está aprobada, incrementar el stock
        if (devolucion.estado === 'APROBADA') {
          await tx.inventario.update({
            where: { id: devolucion.inventarioId },
            data: {
              stock: {
                increment: devolucion.cantidad
              }
            }
          });
          
          // Registrar el movimiento de inventario
          await tx.movimientoInventario.create({
            data: {
              tipo: 'INGRESO',
              cantidad: devolucion.cantidad,
              fecha: devolucion.fecha,
              inventarioId: devolucion.inventarioId,
              farmaciaId: devolucion.farmaciaId
            }
          });
        }
      }
      
      return resultado;
    });
    
    console.log(`Generación de devoluciones completada. Se crearon ${devolucionesCreadas.length} devoluciones.`);
    
    // Mostrar algunas estadísticas
    const porEstado = devolucionesCreadas.reduce((acc, dev) => {
      acc[dev.estado] = (acc[dev.estado] || 0) + 1;
      return acc;
    }, {});
    
    console.log("\nEstadísticas de devoluciones generadas:");
    for (const [estado, cantidad] of Object.entries(porEstado)) {
      console.log(`- ${estado}: ${cantidad}`);
    }

  } catch (error) {
    console.error('Error al generar devoluciones:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar la función
generarDevoluciones()
  .then(() => {
    console.log('Proceso completado exitosamente.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error en el proceso:', error);
    process.exit(1);
  });