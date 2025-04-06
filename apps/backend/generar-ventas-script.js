// apps/backend/scripts/generar-ventas.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Meses del año
const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio'];

async function generarVentas() {
  try {
    console.log("Iniciando generación de ventas...");
    
    // Obtener usuarios para asociar ventas
    const usuarios = await prisma.usuario.findMany();
    const usuarioIds = usuarios.map(u => u.id);

    // Obtener inventarios
    const inventarios = await prisma.inventario.findMany({
      include: {
        farmacia: true,
        medicamento: true
      }
    });

    if (inventarios.length === 0) {
      throw new Error('No hay inventarios disponibles. Ejecute primero el script de inventarios.');
    }

    // Generar ventas
    const ventas = [];
    
    // Iterar por cada mes
    for (const mes of meses) {
      // Obtener el índice del mes para el campo anio y mes
      const indiceMes = meses.indexOf(mes) + 1;
      const anioActual = new Date().getFullYear();

      // Generar ventas para cada inventario
      for (const inventario of inventarios) {
        // Generar cantidad de venta aleatoria
        const cantidad = Math.floor(Math.random() * 100) + 1; // Entre 1 y 100 unidades
        
        // Verificar que hay suficiente stock
        if (cantidad <= inventario.stock) {
          const venta = {
            cantidad,
            farmaciaId: inventario.farmaciaId,
            inventarioId: inventario.id,
            precioUnitario: inventario.precio,
            fecha: new Date(anioActual, indiceMes - 1, Math.floor(Math.random() * 28) + 1), // Día aleatorio
            mes: indiceMes,
            anio: anioActual,
            usuarioId: usuarioIds.length > 0 
              ? usuarioIds[Math.floor(Math.random() * usuarioIds.length)] 
              : null
          };

          ventas.push(venta);
        }
      }
    }

    // Crear ventas en transacción
    const resultadoVentas = await prisma.$transaction(
      ventas.map(venta => 
        prisma.venta.create({ 
          data: venta 
        })
      )
    );

    console.log(`Generación de ventas completada. Se crearon ${resultadoVentas.length} ventas.`);

    // Actualizar inventarios
    await prisma.$transaction(
      ventas.map(venta => 
        prisma.inventario.update({
          where: { id: venta.inventarioId },
          data: { 
            stock: {
              decrement: venta.cantidad
            }
          }
        })
      )
    );

    // Registrar movimientos de inventario
    await prisma.$transaction(
      ventas.map(venta => 
        prisma.movimientoInventario.create({
          data: {
            tipo: 'SALIDA',
            cantidad: venta.cantidad,
            inventarioId: venta.inventarioId,
            farmaciaId: venta.farmaciaId,
            usuarioId: venta.usuarioId,
            fecha: venta.fecha
          }
        })
      )
    );

    return resultadoVentas;

  } catch (error) {
    console.error('Error al generar ventas:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar la función
generarVentas()
  .then(() => {
    console.log('Proceso completado exitosamente.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error en el proceso:', error);
    process.exit(1);
  });