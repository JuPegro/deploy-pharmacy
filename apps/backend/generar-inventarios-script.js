const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Función para generar una fecha de vencimiento
const generarFechaVencimiento = () => {
  const hoy = new Date();
  // Generar una fecha entre 6 meses y 2 años en el futuro
  const diasHastaVencimiento = Math.floor(Math.random() * 540) + 180; // Entre 6 meses y 18 meses
  const fechaVencimiento = new Date(hoy);
  fechaVencimiento.setDate(hoy.getDate() + diasHastaVencimiento);
  return fechaVencimiento;
};

// Función para generar stock
const generarStock = () => {
  return Math.floor(Math.random() * 200) + 10; // Entre 10 y 210
};

// Función para generar precio (basado en stock y un precio base del medicamento)
const generarPrecio = (stock, precioBase) => {
  return parseFloat((precioBase * stock * (Math.random() * 0.5 + 0.5)).toFixed(2));
};

async function generarInventarios() {
  try {
    // Eliminar inventarios existentes
    await prisma.inventario.deleteMany();
    console.log("Inventarios anteriores eliminados.");

    // Obtener todas las farmacias y medicamentos
    const [farmacias, medicamentos] = await Promise.all([
      prisma.farmacia.findMany(),
      prisma.medicamento.findMany()
    ]);

    // Generar inventarios
    const inventarios = [];
    const inventariosUnicos = new Set();

    // Iterar sobre cada farmacia
    for (const farmacia of farmacias) {
      // Seleccionar un subconjunto de medicamentos para esta farmacia
      const medicamentosSeleccionados = medicamentos
        .sort(() => 0.5 - Math.random()) // Mezclar aleatoriamente
        .slice(0, Math.floor(Math.random() * 20) + 10); // Entre 10 y 30 medicamentos por farmacia

      // Crear inventario para estos medicamentos
      for (const medicamento of medicamentosSeleccionados) {
        // Generar una clave única para prevenir duplicados
        const claveUnica = `${farmacia.id}-${medicamento.id}`;
        
        // Evitar duplicados
        if (!inventariosUnicos.has(claveUnica)) {
          const stock = generarStock();
          
          // Asignar un precio base al medicamento (si no existe)
          const precioBase = Math.random() * 10 + 5; // Entre 5 y 15
          
          const nuevoInventario = {
            farmaciaId: farmacia.id,
            medicamentoId: medicamento.id,
            stock: stock,
            stockMinimo: 10, // Stock mínimo por defecto
            precio: generarPrecio(stock, precioBase),
            vencimiento: generarFechaVencimiento()
          };

          inventarios.push(nuevoInventario);
          inventariosUnicos.add(claveUnica);
        }
      }
    }

    // Insertar inventarios
    const resultado = await prisma.inventario.createMany({
      data: inventarios,
      skipDuplicates: true // Evitar duplicados
    });

    console.log(`Se insertaron ${resultado.count} registros de inventario`);

    // Verificar inventarios
    const inventariosEnBD = await prisma.inventario.findMany({
      include: {
        farmacia: { select: { nombre: true } },
        medicamento: { select: { nombre: true } }
      }
    });

    console.log("\nMuestra de inventarios generados:");
    inventariosEnBD.slice(0, 20).forEach(inv => {
      console.log(`- ${inv.farmacia.nombre}: ${inv.medicamento.nombre} (Stock: ${inv.stock}, Precio: $${inv.precio})`);
    });

    console.log(`\nTotal de registros de inventario: ${inventariosEnBD.length}`);

  } catch (error) {
    console.error('Error al generar inventarios:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar generación de inventarios
generarInventarios();