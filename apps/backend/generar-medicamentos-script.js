// apps/backend/scripts/generar-medicamentos.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Estructura de medicamentos basada en los datos del Excel
const medicamentosBase = [
  {
    nombre: "Paracetamol",
    categoria: "Analgésicos",
    presentacion: "Tabletas",
    principioActivo: "Paracetamol",
    requiereReceta: false,
    descripcion: "Medicamento analgésico y antipirético"
  },
  {
    nombre: "Ibuprofeno",
    categoria: "Antiinflamatorios",
    presentacion: "Cápsulas",
    principioActivo: "Ibuprofeno",
    requiereReceta: false,
    descripcion: "Antiinflamatorio no esteroideo"
  },
  {
    nombre: "Amoxicilina",
    categoria: "Antibióticos",
    presentacion: "Cápsulas",
    principioActivo: "Amoxicilina",
    requiereReceta: true,
    descripcion: "Antibiótico de amplio espectro"
  },
  {
    nombre: "Losartán",
    categoria: "Antihipertensivos",
    presentacion: "Tabletas",
    principioActivo: "Losartán",
    requiereReceta: true,
    descripcion: "Medicamento para el tratamiento de la hipertensión"
  },
  {
    nombre: "Metformina",
    categoria: "Antidiabéticos",
    presentacion: "Tabletas",
    principioActivo: "Metformina",
    requiereReceta: true,
    descripcion: "Medicamento para el control de la diabetes"
  },
  {
    nombre: "Omeprazol",
    categoria: "Inhibidores de bomba de protones",
    presentacion: "Cápsulas",
    principioActivo: "Omeprazol",
    requiereReceta: false,
    descripcion: "Medicamento para reducir la producción de ácido estomacal"
  },
  {
    nombre: "Salbutamol",
    categoria: "Broncodilatadores",
    presentacion: "Inhalador",
    principioActivo: "Salbutamol",
    requiereReceta: false,
    descripcion: "Medicamento para tratamiento de asma y EPOC"
  },
  {
    nombre: "Vitamina C",
    categoria: "Vitaminas",
    presentacion: "Tabletas Efervescentes",
    principioActivo: "Ácido Ascórbico",
    requiereReceta: false,
    descripcion: "Suplemento vitamínico"
  },
  {
    nombre: "Prednisona",
    categoria: "Corticosteroides",
    presentacion: "Tabletas",
    principioActivo: "Prednisona",
    requiereReceta: true,
    descripcion: "Medicamento antiinflamatorio"
  },
  {
    nombre: "Atorvastatina",
    categoria: "Antilipemiantes",
    presentacion: "Tabletas",
    principioActivo: "Atorvastatina",
    requiereReceta: true,
    descripcion: "Medicamento para reducir el colesterol"
  }
];

async function generarMedicamentos() {
  try {
    console.log('Iniciando la inserción de medicamentos...');
    
    // Verificar medicamentos existentes
    const medicamentosExistentes = await prisma.medicamento.findMany({
      select: { nombre: true }
    });
    
    const nombresExistentes = new Set(medicamentosExistentes.map(m => m.nombre));
    
    // Filtrar medicamentos que ya existen
    const medicamentosNuevos = medicamentosBase.filter(med => !nombresExistentes.has(med.nombre));
    
    console.log(`Se van a insertar ${medicamentosNuevos.length} nuevos medicamentos.`);
    
    // Crear medicamentos en la base de datos
    const medicamentosCreados = await Promise.all(
      medicamentosNuevos.map(med => 
        prisma.medicamento.create({
          data: {
            codigo: 'MED' + Math.floor(10000000 + Math.random() * 90000000),
            nombre: med.nombre,
            categoria: med.categoria,
            presentacion: med.presentacion,
            principioActivo: med.principioActivo,
            requiereReceta: med.requiereReceta,
            descripcion: med.descripcion
          }
        })
      )
    );
    
    console.log(`Inserción de medicamentos completada. Se crearon ${medicamentosCreados.length} medicamentos.`);
    
    return medicamentosCreados;
  } catch (error) {
    console.error('Error al generar medicamentos:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar la función
generarMedicamentos()
  .then(() => {
    console.log('Proceso completado exitosamente.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error en el proceso:', error);
    process.exit(1);
  });