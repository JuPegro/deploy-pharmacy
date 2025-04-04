// apps/backend/scripts/migrar-medicamentos.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Función para generar un código único para medicamentos
const generarCodigoMedicamento = async () => {
  // Prefijo MED seguido de 8 dígitos aleatorios
  const codigo = 'MED' + Math.floor(10000000 + Math.random() * 90000000);
  
  // Verificar que el código no existe
  const medicamentoExistente = await prisma.medicamento.findUnique({
    where: { codigo }
  });
  
  // Si ya existe, generar otro recursivamente
  if (medicamentoExistente) {
    return generarCodigoMedicamento();
  }
  
  return codigo;
};

async function migrarMedicamentos() {
  try {
    console.log('Iniciando migración de medicamentos...');
    
    // Obtener todos los medicamentos sin código
    const medicamentos = await prisma.medicamento.findMany();
    
    let actualizados = 0;
    
    // Actualizar cada medicamento
    for (const medicamento of medicamentos) {
      // Generar código único
      const codigo = await generarCodigoMedicamento();
      
      // Actualizar medicamento
      await prisma.medicamento.update({
        where: { id: medicamento.id },
        data: { codigo }
      });
      
      actualizados++;
      console.log(`Medicamento actualizado: ${medicamento.nombre} - Código: ${codigo}`);
    }
    
    console.log(`Migración completada. ${actualizados} medicamentos actualizados.`);
  } catch (error) {
    console.error('Error durante la migración:', error);
  } finally {
    await prisma.$disconnect();
  }
}

migrarMedicamentos();