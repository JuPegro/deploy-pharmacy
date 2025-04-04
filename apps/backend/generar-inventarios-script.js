// apps/backend/scripts/generar-inventarios.js
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
  return Math.floor(Math.random() * 100) + 10; // Entre 10 y 110
};

// Función para generar precio
const generarPrecio = () => {
  return parseFloat((Math.random() * 5000 + 500).toFixed(2)); // Entre 500 y 5500
};

async function generarInventarios() {
  try {
    console.log("Iniciando generación de inventarios...");
    
    // Obtener todas las farmacias y medicamentos
    const [farmacias, medicamentos] = await Promise.all([
      prisma.farmacia.findMany(),
      prisma.medicamento.findMany()
    ]);
    
    if (farmacias.length === 0) {
      throw new Error("No hay farmacias en la base de datos. Ejecute primero el script de farmacias.");
    }
    
    if (medicamentos.length === 0) {
      throw new Error("No hay medicamentos en la base de datos. Ejecute primero el script de medicamentos.");
    }
    
    console.log(`Farmacias encontradas: ${farmacias.length}`);
    console.log(`Medicamentos encontrados: ${medicamentos.length}`);
    
    // Verificar inventarios existentes
    const inventariosExistentes = await prisma.inventario.findMany({
      select: { farmaciaId: true, medicamentoId: true }
    });
    
    const claveExistente = (farmaciaId, medicamentoId) => {
      return inventariosExistentes.some(
        inv => inv.farmaciaId === farmaciaId && inv.medicamentoId === medicamentoId
      );
    };
    
    // Crear nuevos inventarios
    let creados = 0;
    const totalOperaciones = farmacias.length * Math.min(medicamentos.length, 30); // Máximo 30 medicamentos por farmacia
    
    for (const farmacia of farmacias) {
      // Seleccionar un subconjunto aleatorio de medicamentos para esta farmacia
      const medicamentosSeleccionados = medicamentos
        .sort(() => 0.5 - Math.random()) // Mezclar aleatoriamente
        .slice(0, Math.floor(Math.random() * 20) + 10); // Entre 10 y 30 medicamentos por farmacia
      
      console.log(`Generando inventarios para ${farmacia.nombre} (${medicamentosSeleccionados.length} medicamentos)...`);
      
      for (const medicamento of medicamentosSeleccionados) {
        // Verificar si ya existe este inventario
        if (claveExistente(farmacia.id, medicamento.id)) {
          continue;
        }
        
        // Crear un nuevo inventario
        await prisma.inventario.create({
          data: {
            farmaciaId: farmacia.id,
            medicamentoId: medicamento.id,
            stock: generarStock(),
            stockMinimo: Math.floor(Math.random() * 10) + 5, // Entre 5 y 15
            precio: generarPrecio(),
            vencimiento: generarFechaVencimiento()
          }
        });
        
        creados++;
      }
      
      console.log(`Progreso: ${creados}/${totalOperaciones} inventarios creados`);
    }
    
    console.log(`Generación de inventarios completada. Se crearon ${creados} nuevos inventarios.`);

  } catch (error) {
    console.error('Error al generar inventarios:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar la función
generarInventarios()
  .then(() => {
    console.log('Proceso completado exitosamente.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error en el proceso:', error);
    process.exit(1);
  });