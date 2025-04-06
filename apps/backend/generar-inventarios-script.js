// apps/backend/scripts/generar-inventarios.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Función para generar una fecha de vencimiento
const generarFechaVencimiento = () => {
  const hoy = new Date();
  // Generar una fecha entre 6 meses y 2 años en el futuro
  const diasHastaVencimiento = Math.floor(Math.random() * 540) + 180;
  const fechaVencimiento = new Date(hoy);
  fechaVencimiento.setDate(hoy.getDate() + diasHastaVencimiento);
  return fechaVencimiento;
};

// Función para generar precio basado en la categoría del medicamento
const generarPrecio = (categoria) => {
  const rangos = {
    'Analgésicos': [500, 2000],
    'Antibióticos': [2000, 5000],
    'Antihipertensivos': [1500, 3500],
    'Antidiabéticos': [2500, 6000],
    'Inhibidores de bomba de protones': [1000, 3000],
    'Broncodilatadores': [2000, 4500],
    'Vitaminas': [500, 1500],
    'Corticosteroides': [1500, 4000],
    'Antilipemiantes': [2500, 5500],
    'default': [1000, 3000]
  };

  const [min, max] = rangos[categoria] || rangos['default'];
  return parseFloat((Math.random() * (max - min) + min).toFixed(2));
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
    const totalOperaciones = farmacias.length * medicamentos.length;
    
    for (const farmacia of farmacias) {
      for (const medicamento of medicamentos) {
        // Verificar si ya existe este inventario
        if (claveExistente(farmacia.id, medicamento.id)) {
          continue;
        }
        
        // Generar stock basado en la categoría del medicamento
        const stock = Math.floor(Math.random() * 500) + 50; // Entre 50 y 550
        const stockMinimo = Math.floor(Math.random() * 30) + 10; // Entre 10 y 40
        
        // Crear un nuevo inventario
        await prisma.inventario.create({
          data: {
            farmaciaId: farmacia.id,
            medicamentoId: medicamento.id,
            stock,
            stockMinimo,
            precio: generarPrecio(medicamento.categoria),
            vencimiento: generarFechaVencimiento()
          }
        });
        
        creados++;
        
        if (creados % 50 === 0) {
          console.log(`Progreso: ${creados}/${totalOperaciones} inventarios creados`);
        }
      }
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