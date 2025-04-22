// apps/backend/scripts/generar-devoluciones.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Motivos de devolución predefinidos
const motivosDevoluciones = [
  'Producto dañado',
  'Fecha de vencimiento próxima',
  'Error en pedido',
  'Producto en mal estado',
  'Sobrestock',
  'Cambio de medicamento',
  'Reacción adversa',
  'Empaque defectuoso'
];

async function generarDevoluciones() {
  try {
    console.log("Iniciando generación de devoluciones...");
    
    // Obtener usuarios administradores para aprobar devoluciones
    const adminUsuarios = await prisma.usuario.findMany({
      where: { rol: 'ADMIN' }
    });

    if (adminUsuarios.length === 0) {
      throw new Error('No hay usuarios administradores para aprobar devoluciones.');
    }

    // Obtener ventas de los últimos meses
    const ventas = await prisma.venta.findMany({
      include: {
        inventario: {
          include: {
            medicamento: true,
            farmacia: true
          }
        }
      }
    });

    if (ventas.length === 0) {
      throw new Error('No hay ventas disponibles. Ejecute primero el script de ventas.');
    }

    // Generar devoluciones
    const devoluciones = [];
    
    // Seleccionar un subconjunto de ventas para devoluciones
    const ventasParaDevoluciones = ventas
      .sort(() => 0.5 - Math.random()) // Mezclar aleatoriamente
      .slice(0, Math.floor(ventas.length * 0.2)); // Tomar el 20% de las ventas

    for (const venta of ventasParaDevoluciones) {
      // Generar cantidad de devolución (entre 1 y la cantidad vendida)
      const cantidad = Math.floor(Math.random() * venta.cantidad) + 1;
      
      // Seleccionar motivo aleatorio
      const motivo = motivosDevoluciones[
        Math.floor(Math.random() * motivosDevoluciones.length)
      ];

      // Generar fecha de devolución (después de la venta)
      const fechaVenta = new Date(venta.fecha);
      const fechaDevolucion = new Date(fechaVenta);
      fechaDevolucion.setDate(fechaVenta.getDate() + Math.floor(Math.random() * 30) + 1);

      // Determinar estado de la devolución
      const estados = ['PENDIENTE', 'APROBADA', 'RECHAZADA'];
      const estado = estados[Math.floor(Math.random() * estados.length)];

      const devolucion = {
        cantidad,
        motivo,
        farmaciaId: venta.farmaciaId,
        inventarioId: venta.inventarioId,
        fecha: fechaDevolucion,
        estado,
        mes: fechaDevolucion.getMonth() + 1,
        anio: fechaDevolucion.getFullYear(),
        usuarioId: venta.usuarioId // Quien realizó la venta original
      };

      // Si está aprobada, añadir información de aprobación
      if (estado === 'APROBADA') {
        devolucion.aprobadoPorId = adminUsuarios[
          Math.floor(Math.random() * adminUsuarios.length)
        ].id;
        devolucion.fechaAprobacion = new Date();
      } else if (estado === 'RECHAZADA') {
        devolucion.aprobadoPorId = adminUsuarios[
          Math.floor(Math.random() * adminUsuarios.length)
        ].id;
        devolucion.fechaAprobacion = new Date();
        devolucion.motivoRechazo = 'No cumple con los criterios de devolución';
      }

      devoluciones.push(devolucion);
    }

    // Crear todas las devoluciones primero sin transacciones anidadas
    const devolucionesCreadas = await prisma.$transaction(
      devoluciones.map(devolucion => 
        prisma.devolucion.create({
          data: devolucion
        })
      )
    );
    
    console.log(`Creadas ${devolucionesCreadas.length} devoluciones.`);

    // Ahora procesar las aprobadas en un segundo paso
    const devolucionesAprobadas = devolucionesCreadas.filter(dev => dev.estado === 'APROBADA');
    
    if (devolucionesAprobadas.length > 0) {
      console.log(`Procesando ${devolucionesAprobadas.length} devoluciones aprobadas...`);
      
      // Procesar cada devolución aprobada en transacciones separadas
      for (const devolucion of devolucionesAprobadas) {
        await prisma.$transaction([
          // Actualizar el inventario
          prisma.inventario.update({
            where: { id: devolucion.inventarioId },
            data: { 
              stock: {
                increment: devolucion.cantidad
              }
            }
          }),
          
          // Registrar movimiento de inventario
          prisma.movimientoInventario.create({
            data: {
              tipo: 'INGRESO',
              cantidad: devolucion.cantidad,
              inventarioId: devolucion.inventarioId,
              farmaciaId: devolucion.farmaciaId,
              usuarioId: devolucion.aprobadoPorId,
              fecha: devolucion.fechaAprobacion,
              observacion: `Devolución de ${devolucion.cantidad} unidades`
            }
          })
        ]);
      }
    }

    console.log(`Generación de devoluciones completada. Se crearon ${devolucionesCreadas.length} devoluciones.`);

    return devolucionesCreadas;

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