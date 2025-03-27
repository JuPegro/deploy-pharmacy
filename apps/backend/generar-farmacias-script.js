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
  },
  {
    nombre: "Farmacia Puerto Plata",
    direccion: "Malecón, Puerto Plata",
    latitud: 19.7892,
    longitud: -70.6828
  },
  {
    nombre: "Farmacia Bávaro",
    direccion: "Av. Turística, Bávaro",
    latitud: 18.6847,
    longitud: -68.4050
  },
  {
    nombre: "Farmacia Santo Domingo Norte",
    direccion: "Av. Jacobo Majluta, Santo Domingo Norte",
    latitud: 18.5500,
    longitud: -69.8667
  },
  {
    nombre: "Farmacia Moca",
    direccion: "Calle El Progreso, Moca",
    latitud: 19.3889,
    longitud: -70.5264
  },
  {
    nombre: "Farmacia Barahona",
    direccion: "Av. Lizandro Procopio, Barahona",
    latitud: 18.2096,
    longitud: -71.0984
  },
  {
    nombre: "Farmacia San Pedro de Macorís",
    direccion: "Calle Duarte, San Pedro de Macorís",
    latitud: 18.4615,
    longitud: -69.3081
  },
  {
    nombre: "Farmacia Samaná",
    direccion: "Malecón, Samaná",
    latitud: 19.2042,
    longitud: -69.3375
  },
  {
    nombre: "Farmacia Monte Cristi",
    direccion: "Calle Principal, Monte Cristi",
    latitud: 19.8472,
    longitud: -71.6550
  },
  {
    nombre: "Farmacia Romana",
    direccion: "Av. Circunvalación, La Romana",
    latitud: 18.4270,
    longitud: -68.9730
  },
  {
    nombre: "Farmacia Bonao",
    direccion: "Calle Duarte, Bonao",
    latitud: 18.9789,
    longitud: -70.4107
  }
];

async function insertarFarmacias() {
  try {
    // Eliminar farmacias existentes
    await prisma.farmacia.deleteMany();
    console.log("Farmacias anteriores eliminadas.");

    // Insertar nuevas farmacias
    const resultado = await prisma.farmacia.createMany({
      data: farmaciasDominicanas
    });

    console.log(`Se insertaron ${resultado.count} farmacias`);

    // Verificar farmacias insertadas
    const farmaciasEnBD = await prisma.farmacia.findMany();
    console.log("Farmacias insertadas:");
    farmaciasEnBD.forEach(farmacia => {
      console.log(`- ${farmacia.nombre} (${farmacia.direccion})`);
    });

  } catch (error) {
    console.error('Error al insertar farmacias:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar la inserción
insertarFarmacias();