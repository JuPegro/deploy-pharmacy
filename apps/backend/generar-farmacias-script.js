// apps/backend/scripts/generar-farmacias.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Datos de farmacias basados en el barrio del Excel y zonas de República Dominicana
const farmaciasDominicanas = [
  {
    nombre: "Farmacia El Almirante",
    direccion: "Calle Principal, Barrio El Almirante, Santo Domingo",
    latitud: 18.4861,
    longitud: -69.9312
  },
  {
    nombre: "Los mina",
    direccion: "Av. Principal, Santo Domingo Este",
    latitud: 18.5065,
    longitud: -69.8478
  },
  {
    nombre: "Villa faro",
    direccion: "Centro Histórico, Santo Domingo",
    latitud: 18.4626,
    longitud: -69.9494
  },
  {
    nombre: "Mendoza",
    direccion: "Santiago de los Caballeros",
    latitud: 19.4517,
    longitud: -70.6750
  },
  {
    nombre: "Invivienda",
    direccion: "San Juan de la Maguana",
    latitud: -18.8053,
    longitud: -71.2291
  },
  {
    nombre: "San Isidro",
    direccion: "San Juan de la Maguana",
    latitud: 20.8053,
    longitud: -71.2291
  },
  {
    nombre: "Hainamosa",
    direccion: "San Juan de la Maguana",
    latitud: 16.8053,
    longitud: -71.2291
  },
  {
    nombre: "Villa Carmen",
    direccion: "San Juan de la Maguana",
    latitud: 18.7053,
    longitud: -71.2291
  },
  {
    nombre: "Ensanche Ozama",
    direccion: "San Juan de la Maguana",
    latitud: 18.8053,
    longitud: -51.2291
  }
];

async function insertarFarmacias() {
  try {
    console.log("Iniciando inserción de farmacias...");
    
    // Verificar farmacias existentes
    const farmaciasExistentes = await prisma.farmacia.findMany({
      select: { nombre: true }
    });
    
    const nombresExistentes = new Set(farmaciasExistentes.map(f => f.nombre));
    
    // Filtrar farmacias que ya existen
    const farmaciasNuevas = farmaciasDominicanas.filter(f => !nombresExistentes.has(f.nombre));
    
    if (farmaciasNuevas.length === 0) {
      console.log("Todas las farmacias ya existen en la base de datos.");
      return;
    }
    
    console.log(`Se van a insertar ${farmaciasNuevas.length} nuevas farmacias.`);
    
    // Insertar nuevas farmacias
    const resultados = await Promise.all(
      farmaciasNuevas.map(farmacia => 
        prisma.farmacia.create({
          data: farmacia
        })
      )
    );
    
    console.log(`Se insertaron ${resultados.length} farmacias:`);
    resultados.forEach(farmacia => {
      console.log(`- ${farmacia.nombre} (ID: ${farmacia.id})`);
    });

  } catch (error) {
    console.error('Error al insertar farmacias:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar la función
insertarFarmacias()
  .then(() => {
    console.log('Proceso completado exitosamente.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error en el proceso:', error);
    process.exit(1);
  });