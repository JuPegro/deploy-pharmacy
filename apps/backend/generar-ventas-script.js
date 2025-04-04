// apps/backend/scripts/generar-ventas.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function generarVentas() {
  try {
    console.log("Iniciando generación de ventas...");
    
    // Verificar usuarios
    const usuarios = await prisma.usuario.findMany();
    console.log(`Usuarios encontrados: ${usuarios.length}`);
    
    if (usuarios.length === 0) {
      console.log("¡Advertencia! No hay usuarios. Las ventas se generarán sin asociar a un usuario.");
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
    
    console.log(`Inventarios con stock disponible: ${inventariosConStock.length}`);
    
    if (inventariosConStock.length === 0) {
      throw new Error('No hay inventarios con stock disponible. Ejecute primero el script de inventarios.');
    }
    
    // Generar ventas
    const numVentas = Math.max(30, Math.floor(inventariosConStock.length * 0.5));
    console.log(`Generando ${numVentas} ventas...`);
    
    const ventas = [];
    
    // Conjunto para rastrear inventarios ya usados (para evitar duplicados en este lote)
    const inventariosUsados = new Set();
    
    // Generar fechas distribuidas en los últimos 90 días
    const hoy = new Date();
    const hace90Dias = new Date(hoy);
    hace90Dias.setDate(hoy.getDate() - 90);
    
    for (let i = 0; i < numVentas; i++) {
      // Seleccionar un inventario aleatorio que no haya sido usado
      let inventarioSeleccionado;
      let intentos = 0;
      
      do {
        inventarioSeleccionado = inventariosConStock[
          Math.floor(Math.random() * inventariosConStock.length)
        ];
        intentos++;
        
        if (intentos > 100) {
          // Evitar bucle infinito si hay pocos inventarios
          console.log("Demasiados intentos para encontrar un inventario no usado. Reiniciando conjunto...");
          inventariosUsados.clear();
          break;
        }
      } while (
        inventariosUsados.has(inventarioSeleccionado.id) && 
        inventariosUsados.size < inventariosConStock.length
      );
      
      // Marcar este inventario como usado para este lote
      inventariosUsados.add(inventarioSeleccionado.id);
      
      // Calcular cantidad de venta (entre 1 y el stock disponible, máximo 5)
      const cantidadMaxima = Math.min(inventarioSeleccionado.stock, 5);
      const cantidadVenta = Math.floor(Math.random() * cantidadMaxima) + 1;
      
      // Seleccionar usuario aleatorio si hay disponibles
      const usuarioSeleccionado = usuarios.length > 0
        ? usuarios[Math.floor(Math.random() * usuarios.length)]
        : null;
      
      // Generar fecha aleatoria en los últimos 90 días
      const fechaVenta = new Date(
        hace90Dias.getTime() + Math.random() * (hoy.getTime() - hace90Dias.getTime())
      );
      
      // Crear objeto de venta
      ventas.push({
        cantidad: cantidadVenta,
        precioUnitario: inventarioSeleccionado.precio,
        fecha: fechaVenta,
        inventarioId: inventarioSeleccionado.id,
        farmaciaId: inventarioSeleccionado.farmaciaId,
        usuarioId: usuarioSeleccionado?.id
      });
    }
    
    // Ejecutar transacción para crear todas las ventas y actualizar inventarios
    const resultados = await prisma.$transaction(async (tx) => {
      const ventasCreadas = [];
      
      for (const venta of ventas) {
        // Crear la venta
        const ventaCreada = await tx.venta.create({
          data: venta
        });
        
        ventasCreadas.push(ventaCreada);
        
        // Actualizar el stock
        await tx.inventario.update({
          where: { id: venta.inventarioId },
          data: {
            stock: {
              decrement: venta.cantidad
            }
          }
        });
        
        // Registrar el movimiento de inventario
        await tx.movimientoInventario.create({
          data: {
            tipo: 'SALIDA',
            cantidad: venta.cantidad,
            fecha: venta.fecha,
            inventarioId: venta.inventarioId,
            farmaciaId: venta.farmaciaId,
            usuarioId: venta.usuarioId
          }
        });
      }
      
      return ventasCreadas;
    });
    
    console.log(`Generación de ventas completada. Se crearon ${resultados.length} ventas.`);
    
    // Mostrar algunas estadísticas
    console.log("\nEstadísticas de ventas generadas:");
    console.log("- Primera venta:", new Date(Math.min(...resultados.map(v => v.fecha))).toLocaleDateString());
    console.log("- Última venta:", new Date(Math.max(...resultados.map(v => v.fecha))).toLocaleDateString());
    console.log("- Cantidad promedio por venta:", (resultados.reduce((sum, v) => sum + v.cantidad, 0) / resultados.length).toFixed(2));

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