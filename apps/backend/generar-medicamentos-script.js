// generar-medicamentos-script.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function generarMedicamentos() {
  try {
    console.log('Iniciando la inserción de medicamentos...');
    
    // Lista de medicamentos de ejemplo
    const medicamentos = [
      // Analgésicos
      { nombre: "Paracetamol 500mg", categoria: "Analgésico", principioActivo: "Paracetamol", presentacion: "Tabletas", requiereReceta: false },
      { nombre: "Ibuprofeno 400mg", categoria: "Analgésico/Antiinflamatorio", principioActivo: "Ibuprofeno", presentacion: "Tabletas", requiereReceta: false },
      { nombre: "Aspirina 500mg", categoria: "Analgésico", principioActivo: "Ácido Acetilsalicílico", presentacion: "Tabletas", requiereReceta: false },
      { nombre: "Naproxeno 550mg", categoria: "Analgésico/Antiinflamatorio", principioActivo: "Naproxeno", presentacion: "Tabletas", requiereReceta: true },
      { nombre: "Diclofenaco 50mg", categoria: "Analgésico/Antiinflamatorio", principioActivo: "Diclofenaco", presentacion: "Tabletas", requiereReceta: true },
      
      // Antibióticos
      { nombre: "Amoxicilina 500mg", categoria: "Antibiótico", principioActivo: "Amoxicilina", presentacion: "Cápsulas", requiereReceta: true },
      { nombre: "Azitromicina 500mg", categoria: "Antibiótico", principioActivo: "Azitromicina", presentacion: "Tabletas", requiereReceta: true },
      { nombre: "Ciprofloxacino 500mg", categoria: "Antibiótico", principioActivo: "Ciprofloxacino", presentacion: "Tabletas", requiereReceta: true },
      { nombre: "Claritromicina 500mg", categoria: "Antibiótico", principioActivo: "Claritromicina", presentacion: "Tabletas", requiereReceta: true },
      { nombre: "Cefalexina 500mg", categoria: "Antibiótico", principioActivo: "Cefalexina", presentacion: "Cápsulas", requiereReceta: true },
      
      // Antihistamínicos
      { nombre: "Loratadina 10mg", categoria: "Antihistamínico", principioActivo: "Loratadina", presentacion: "Tabletas", requiereReceta: false },
      { nombre: "Cetirizina 10mg", categoria: "Antihistamínico", principioActivo: "Cetirizina", presentacion: "Tabletas", requiereReceta: false },
      { nombre: "Desloratadina 5mg", categoria: "Antihistamínico", principioActivo: "Desloratadina", presentacion: "Tabletas", requiereReceta: false },
      { nombre: "Fexofenadina 120mg", categoria: "Antihistamínico", principioActivo: "Fexofenadina", presentacion: "Tabletas", requiereReceta: false },
      { nombre: "Difenhidramina 50mg", categoria: "Antihistamínico", principioActivo: "Difenhidramina", presentacion: "Cápsulas", requiereReceta: false },
      
      // Antihipertensivos
      { nombre: "Enalapril 10mg", categoria: "Antihipertensivo", principioActivo: "Enalapril", presentacion: "Tabletas", requiereReceta: true },
      { nombre: "Losartán 50mg", categoria: "Antihipertensivo", principioActivo: "Losartán", presentacion: "Tabletas", requiereReceta: true },
      { nombre: "Amlodipino 5mg", categoria: "Antihipertensivo", principioActivo: "Amlodipino", presentacion: "Tabletas", requiereReceta: true },
      { nombre: "Valsartán 80mg", categoria: "Antihipertensivo", principioActivo: "Valsartán", presentacion: "Tabletas", requiereReceta: true },
      { nombre: "Metoprolol 50mg", categoria: "Antihipertensivo", principioActivo: "Metoprolol", presentacion: "Tabletas", requiereReceta: true },
      
      // Antidiabéticos
      { nombre: "Metformina 850mg", categoria: "Antidiabético", principioActivo: "Metformina", presentacion: "Tabletas", requiereReceta: true },
      { nombre: "Glibenclamida 5mg", categoria: "Antidiabético", principioActivo: "Glibenclamida", presentacion: "Tabletas", requiereReceta: true },
      { nombre: "Glimepirida 2mg", categoria: "Antidiabético", principioActivo: "Glimepirida", presentacion: "Tabletas", requiereReceta: true },
      { nombre: "Sitagliptina 100mg", categoria: "Antidiabético", principioActivo: "Sitagliptina", presentacion: "Tabletas", requiereReceta: true },
      { nombre: "Linagliptina 5mg", categoria: "Antidiabético", principioActivo: "Linagliptina", presentacion: "Tabletas", requiereReceta: true },
      
      // Antiinflamatorios
      { nombre: "Dexametasona 4mg", categoria: "Antiinflamatorio esteroideo", principioActivo: "Dexametasona", presentacion: "Tabletas", requiereReceta: true },
      { nombre: "Prednisona 20mg", categoria: "Antiinflamatorio esteroideo", principioActivo: "Prednisona", presentacion: "Tabletas", requiereReceta: true },
      { nombre: "Prednisolona 15mg", categoria: "Antiinflamatorio esteroideo", principioActivo: "Prednisolona", presentacion: "Tabletas", requiereReceta: true },
      { nombre: "Meloxicam 15mg", categoria: "Antiinflamatorio", principioActivo: "Meloxicam", presentacion: "Tabletas", requiereReceta: true },
      { nombre: "Celecoxib 200mg", categoria: "Antiinflamatorio", principioActivo: "Celecoxib", presentacion: "Cápsulas", requiereReceta: true },
      
      // Protectores gástricos
      { nombre: "Omeprazol 20mg", categoria: "Inhibidor de la bomba de protones", principioActivo: "Omeprazol", presentacion: "Cápsulas", requiereReceta: false },
      { nombre: "Pantoprazol 40mg", categoria: "Inhibidor de la bomba de protones", principioActivo: "Pantoprazol", presentacion: "Tabletas", requiereReceta: false },
      { nombre: "Esomeprazol 40mg", categoria: "Inhibidor de la bomba de protones", principioActivo: "Esomeprazol", presentacion: "Tabletas", requiereReceta: false },
      { nombre: "Ranitidina 150mg", categoria: "Antagonista H2", principioActivo: "Ranitidina", presentacion: "Tabletas", requiereReceta: false },
      { nombre: "Sucralfato 1g", categoria: "Protector gástrico", principioActivo: "Sucralfato", presentacion: "Tabletas", requiereReceta: false },
      
      // Antidepresivos
      { nombre: "Fluoxetina 20mg", categoria: "Antidepresivo", principioActivo: "Fluoxetina", presentacion: "Cápsulas", requiereReceta: true },
      { nombre: "Sertralina 50mg", categoria: "Antidepresivo", principioActivo: "Sertralina", presentacion: "Tabletas", requiereReceta: true },
      { nombre: "Escitalopram 10mg", categoria: "Antidepresivo", principioActivo: "Escitalopram", presentacion: "Tabletas", requiereReceta: true },
      { nombre: "Amitriptilina 25mg", categoria: "Antidepresivo", principioActivo: "Amitriptilina", presentacion: "Tabletas", requiereReceta: true },
      { nombre: "Bupropión 150mg", categoria: "Antidepresivo", principioActivo: "Bupropión", presentacion: "Tabletas", requiereReceta: true },
      
      // Vitaminas y suplementos
      { nombre: "Complejo B", categoria: "Vitamina", principioActivo: "Complejo B", presentacion: "Tabletas", requiereReceta: false },
      { nombre: "Ácido fólico 5mg", categoria: "Vitamina", principioActivo: "Ácido fólico", presentacion: "Tabletas", requiereReceta: false },
      { nombre: "Vitamina C 500mg", categoria: "Vitamina", principioActivo: "Ácido ascórbico", presentacion: "Tabletas", requiereReceta: false },
      { nombre: "Vitamina D3 1000UI", categoria: "Vitamina", principioActivo: "Colecalciferol", presentacion: "Tabletas", requiereReceta: false },
      { nombre: "Magnesio 300mg", categoria: "Suplemento mineral", principioActivo: "Magnesio", presentacion: "Tabletas", requiereReceta: false },
      
      // Medicamentos respiratorios
      { nombre: "Salbutamol inhalador 100mcg", categoria: "Broncodilatador", principioActivo: "Salbutamol", presentacion: "Inhalador", requiereReceta: false },
      { nombre: "Fluticasona inhalador 250mcg", categoria: "Corticosteroide inhalado", principioActivo: "Fluticasona", presentacion: "Inhalador", requiereReceta: true },
      { nombre: "Montelukast 10mg", categoria: "Antileucotrieno", principioActivo: "Montelukast", presentacion: "Tabletas", requiereReceta: true },
      { nombre: "Ambroxol 30mg", categoria: "Mucolítico", principioActivo: "Ambroxol", presentacion: "Tabletas", requiereReceta: false },
      { nombre: "Bromhexina 8mg", categoria: "Mucolítico", principioActivo: "Bromhexina", presentacion: "Tabletas", requiereReceta: false }
    ];
    
    console.log(`Se van a insertar ${medicamentos.length} medicamentos.`);
    
    // Verificar medicamentos existentes para evitar duplicados
    const medicamentosExistentes = await prisma.medicamento.findMany({
      select: { nombre: true }
    });
    
    const nombresExistentes = new Set(medicamentosExistentes.map(m => m.nombre));
    
    // Filtrar medicamentos que ya existen
    const medicamentosNuevos = medicamentos.filter(med => !nombresExistentes.has(med.nombre));
    
    console.log(`Se van a insertar ${medicamentosNuevos.length} nuevos medicamentos.`);
    
    // Crear medicamentos en la base de datos
    let creados = 0;
    
    for (const med of medicamentosNuevos) {
      const codigo = 'MED' + Math.floor(10000000 + Math.random() * 90000000);
      
      await prisma.medicamento.create({
        data: {
          codigo,
          nombre: med.nombre,
          categoria: med.categoria,
          descripcion: med.descripcion || `Medicamento para tratamiento de ${med.categoria.toLowerCase()}`,
          principioActivo: med.principioActivo,
          presentacion: med.presentacion,
          requiereReceta: med.requiereReceta || false
        }
      });
      
      creados++;
      
      if (creados % 10 === 0) {
        console.log(`Progreso: ${creados}/${medicamentosNuevos.length} medicamentos creados`);
      }
    }
    
    console.log(`Inserción de medicamentos completada. Se crearon ${creados} medicamentos.`);
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