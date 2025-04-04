// apps/backend/scripts/generar-farmacias.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Datos de farmacias en República Dominicana
const farmaciasDominicanas = [
  {
    nombre: "Farmacia Carol",
    direccion: "Av. Independencia #305, Santo Domingo",
    latitud: 18.4861,
    longitud: -69.9312
  },
  {
    nombre: "Farmacia Alemana",
    direccion: "Calle Gustavo Mejía Ricart #76, Santo Domingo",
    latitud: 18.4626,
    longitud: -69.9494
  },
  {
    nombre: "Farmacia San Martín",
    direccion: "Av. Charles de Gaulle, Santo Domingo Este",
    latitud: 18.5065,
    longitud: -69.8478
  },
  {
    nombre: "Farmacia Popular",
    direccion: "Calle Duarte #123, Santiago de los Caballeros",
    latitud: 19.4517,
    longitud: -70.6750
  },
  {
    nombre: "Farmacia La Cruz",
    direccion: "Av. Prolongación 27 de Febrero, Santo Domingo",
    latitud: 18.4626,
    longitud: -69.9394
  },
  {
    nombre: "Farmacia El Salvador",
    direccion: "Calle Máximo Gómez #45, Santo Domingo",
    latitud: 18.4883,
    longitud: -69.9375
  },
  {
    nombre: "Farmacia San Juan",
    direccion: "Av. Juan Pablo Duarte, San Juan de la Maguana",
    latitud: 18.8053,
    longitud: -71.2291
  },
  {
    nombre: "Farmacia del Pueblo",
    direccion: "Calle Proyecto, La Vega",
    latitud: 19.2200,
    longitud: -70.5269
  },
  {
    nombre: "Farmacia Central Higüey",
    direccion: "Av. Mayor, Higüey",
    latitud: 18.6163,
    longitud: -68.7046
  },
  {
    nombre: "Farmacia San Rafael",
    direccion: "Calle Duarte, San Rafael del Yuma",
    latitud: 18.4600,
    longitud: -68.3817
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