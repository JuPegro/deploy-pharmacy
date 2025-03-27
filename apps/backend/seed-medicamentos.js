// seed-medicamentos.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Comprobar si hay al menos una farmacia
//   const farmacia = await prisma.farmacia.findFirst();
  
//   if (!farmacia) {
//     throw new Error('No hay farmacias registradas. Por favor, crea al menos una farmacia antes de ejecutar este script.');
//   }

  // Lista de 200 medicamentos reales con sus categorías
  const medicamentosReales = [
    // Analgésicos
    { nombre: "Paracetamol 500mg", categoria: "Analgésico", precio: 1500 },
    { nombre: "Ibuprofeno 400mg", categoria: "Analgésico/Antiinflamatorio", precio: 2300 },
    { nombre: "Aspirina 500mg", categoria: "Analgésico", precio: 1800 },
    { nombre: "Naproxeno 550mg", categoria: "Analgésico/Antiinflamatorio", precio: 2500 },
    { nombre: "Diclofenaco 50mg", categoria: "Analgésico/Antiinflamatorio", precio: 1950 },
    { nombre: "Tramadol 50mg", categoria: "Analgésico opioide", precio: 3500 },
    { nombre: "Ketorolaco 10mg", categoria: "Analgésico/Antiinflamatorio", precio: 2800 },
    { nombre: "Metamizol 575mg", categoria: "Analgésico", precio: 2100 },
    { nombre: "Paracetamol 650mg", categoria: "Analgésico", precio: 1700 },
    { nombre: "Dexketoprofeno 25mg", categoria: "Analgésico/Antiinflamatorio", precio: 2900 },
    
    // Antibióticos
    { nombre: "Amoxicilina 500mg", categoria: "Antibiótico", precio: 3200 },
    { nombre: "Azitromicina 500mg", categoria: "Antibiótico", precio: 4500 },
    { nombre: "Ciprofloxacino 500mg", categoria: "Antibiótico", precio: 3800 },
    { nombre: "Claritromicina 500mg", categoria: "Antibiótico", precio: 4200 },
    { nombre: "Cefalexina 500mg", categoria: "Antibiótico", precio: 3500 },
    { nombre: "Doxiciclina 100mg", categoria: "Antibiótico", precio: 2900 },
    { nombre: "Eritromicina 500mg", categoria: "Antibiótico", precio: 3100 },
    { nombre: "Metronidazol 500mg", categoria: "Antibiótico", precio: 2800 },
    { nombre: "Amoxicilina + Ác. Clavulánico 875/125mg", categoria: "Antibiótico", precio: 5200 },
    { nombre: "Sulfametoxazol + Trimetoprima 800/160mg", categoria: "Antibiótico", precio: 3800 },
    
    // Antihistamínicos
    { nombre: "Loratadina 10mg", categoria: "Antihistamínico", precio: 1900 },
    { nombre: "Cetirizina 10mg", categoria: "Antihistamínico", precio: 2100 },
    { nombre: "Desloratadina 5mg", categoria: "Antihistamínico", precio: 2400 },
    { nombre: "Fexofenadina 120mg", categoria: "Antihistamínico", precio: 2600 },
    { nombre: "Ebastina 10mg", categoria: "Antihistamínico", precio: 2300 },
    { nombre: "Levocetirizina 5mg", categoria: "Antihistamínico", precio: 2500 },
    { nombre: "Difenhidramina 50mg", categoria: "Antihistamínico", precio: 1800 },
    { nombre: "Clemastina 1mg", categoria: "Antihistamínico", precio: 2200 },
    { nombre: "Hidroxizina 25mg", categoria: "Antihistamínico", precio: 2100 },
    { nombre: "Clorfenamina 4mg", categoria: "Antihistamínico", precio: 1500 },
    
    // Antihipertensivos
    { nombre: "Enalapril 10mg", categoria: "Antihipertensivo", precio: 2200 },
    { nombre: "Losartán 50mg", categoria: "Antihipertensivo", precio: 2500 },
    { nombre: "Amlodipino 5mg", categoria: "Antihipertensivo", precio: 2300 },
    { nombre: "Valsartán 80mg", categoria: "Antihipertensivo", precio: 3100 },
    { nombre: "Lisinopril 20mg", categoria: "Antihipertensivo", precio: 2400 },
    { nombre: "Metoprolol 50mg", categoria: "Antihipertensivo", precio: 2300 },
    { nombre: "Hidroclorotiazida 25mg", categoria: "Antihipertensivo", precio: 1900 },
    { nombre: "Ramipril 5mg", categoria: "Antihipertensivo", precio: 2600 },
    { nombre: "Irbesartán 150mg", categoria: "Antihipertensivo", precio: 2900 },
    { nombre: "Atenolol 50mg", categoria: "Antihipertensivo", precio: 2100 },
    
    // Antidiabéticos
    { nombre: "Metformina 850mg", categoria: "Antidiabético", precio: 2100 },
    { nombre: "Glibenclamida 5mg", categoria: "Antidiabético", precio: 1900 },
    { nombre: "Glimepirida 2mg", categoria: "Antidiabético", precio: 2300 },
    { nombre: "Sitagliptina 100mg", categoria: "Antidiabético", precio: 5800 },
    { nombre: "Linagliptina 5mg", categoria: "Antidiabético", precio: 6200 },
    { nombre: "Empagliflozina 10mg", categoria: "Antidiabético", precio: 6500 },
    { nombre: "Dapagliflozina 10mg", categoria: "Antidiabético", precio: 6300 },
    { nombre: "Pioglitazona 15mg", categoria: "Antidiabético", precio: 4100 },
    { nombre: "Repaglinida 1mg", categoria: "Antidiabético", precio: 3800 },
    { nombre: "Vildagliptina 50mg", categoria: "Antidiabético", precio: 5500 },
    
    // Antiinflamatorios
    { nombre: "Dexametasona 4mg", categoria: "Antiinflamatorio esteroideo", precio: 2300 },
    { nombre: "Prednisona 20mg", categoria: "Antiinflamatorio esteroideo", precio: 2100 },
    { nombre: "Prednisolona 15mg", categoria: "Antiinflamatorio esteroideo", precio: 2200 },
    { nombre: "Betametasona 0.5mg", categoria: "Antiinflamatorio esteroideo", precio: 2400 },
    { nombre: "Hidrocortisona 10mg", categoria: "Antiinflamatorio esteroideo", precio: 2000 },
    { nombre: "Metilprednisolona 4mg", categoria: "Antiinflamatorio esteroideo", precio: 2700 },
    { nombre: "Meloxicam 15mg", categoria: "Antiinflamatorio", precio: 2600 },
    { nombre: "Celecoxib 200mg", categoria: "Antiinflamatorio", precio: 3200 },
    { nombre: "Etoricoxib 90mg", categoria: "Antiinflamatorio", precio: 3500 },
    { nombre: "Nimesulida 100mg", categoria: "Antiinflamatorio", precio: 2400 },
    
    // Antiácidos y protectores gástricos
    { nombre: "Omeprazol 20mg", categoria: "Inhibidor de la bomba de protones", precio: 2400 },
    { nombre: "Pantoprazol 40mg", categoria: "Inhibidor de la bomba de protones", precio: 2600 },
    { nombre: "Esomeprazol 40mg", categoria: "Inhibidor de la bomba de protones", precio: 3100 },
    { nombre: "Lansoprazol 30mg", categoria: "Inhibidor de la bomba de protones", precio: 2800 },
    { nombre: "Ranitidina 150mg", categoria: "Antagonista H2", precio: 1900 },
    { nombre: "Famotidina 40mg", categoria: "Antagonista H2", precio: 2100 },
    { nombre: "Hidróxido de aluminio + Hidróxido de magnesio", categoria: "Antiácido", precio: 1500 },
    { nombre: "Bismuto 262mg", categoria: "Protector gástrico", precio: 2300 },
    { nombre: "Sucralfato 1g", categoria: "Protector gástrico", precio: 2600 },
    { nombre: "Almagato 500mg", categoria: "Antiácido", precio: 1700 },
    
    // Antidepresivos
    { nombre: "Fluoxetina 20mg", categoria: "Antidepresivo", precio: 2500 },
    { nombre: "Sertralina 50mg", categoria: "Antidepresivo", precio: 2700 },
    { nombre: "Escitalopram 10mg", categoria: "Antidepresivo", precio: 3100 },
    { nombre: "Paroxetina 20mg", categoria: "Antidepresivo", precio: 2900 },
    { nombre: "Venlafaxina 75mg", categoria: "Antidepresivo", precio: 3300 },
    { nombre: "Duloxetina 30mg", categoria: "Antidepresivo", precio: 3500 },
    { nombre: "Mirtazapina 15mg", categoria: "Antidepresivo", precio: 3200 },
    { nombre: "Bupropión 150mg", categoria: "Antidepresivo", precio: 3400 },
    { nombre: "Amitriptilina 25mg", categoria: "Antidepresivo", precio: 2200 },
    { nombre: "Trazodona 100mg", categoria: "Antidepresivo", precio: 2800 },
    
    // Ansiolíticos
    { nombre: "Alprazolam 0.5mg", categoria: "Ansiolítico", precio: 2300 },
    { nombre: "Diazepam 5mg", categoria: "Ansiolítico", precio: 2100 },
    { nombre: "Lorazepam 1mg", categoria: "Ansiolítico", precio: 2200 },
    { nombre: "Clonazepam 0.5mg", categoria: "Ansiolítico", precio: 2400 },
    { nombre: "Bromazepam 3mg", categoria: "Ansiolítico", precio: 2300 },
    { nombre: "Zolpidem 10mg", categoria: "Hipnótico", precio: 2500 },
    { nombre: "Zopiclona 7.5mg", categoria: "Hipnótico", precio: 2600 },
    { nombre: "Buspirona 10mg", categoria: "Ansiolítico", precio: 2700 },
    { nombre: "Clobazam 10mg", categoria: "Ansiolítico", precio: 2400 },
    { nombre: "Midazolam 7.5mg", categoria: "Hipnótico", precio: 2800 },
    
    // Anticonceptivos
    { nombre: "Levonorgestrel 0.15mg + Etinilestradiol 0.03mg", categoria: "Anticonceptivo", precio: 2500 },
    { nombre: "Drospirenona 3mg + Etinilestradiol 0.03mg", categoria: "Anticonceptivo", precio: 3500 },
    { nombre: "Desogestrel 0.075mg", categoria: "Anticonceptivo", precio: 2900 },
    { nombre: "Dienogest 2mg + Etinilestradiol 0.03mg", categoria: "Anticonceptivo", precio: 3200 },
    { nombre: "Levonorgestrel 1.5mg", categoria: "Anticonceptivo de emergencia", precio: 2800 },
    { nombre: "Etonogestrel 68mg (implante)", categoria: "Anticonceptivo", precio: 15000 },
    { nombre: "Levonorgestrel 52mg (DIU)", categoria: "Anticonceptivo", precio: 18000 },
    { nombre: "Noretisterona 0.35mg", categoria: "Anticonceptivo", precio: 2600 },
    { nombre: "Gestodeno 75mcg + Etinilestradiol 20mcg", categoria: "Anticonceptivo", precio: 3100 },
    { nombre: "Nomegestrol 2.5mg + Estradiol 1.5mg", categoria: "Anticonceptivo", precio: 3300 },
    
    // Antilipémicos
    { nombre: "Atorvastatina 20mg", categoria: "Antilipémico", precio: 2800 },
    { nombre: "Simvastatina 20mg", categoria: "Antilipémico", precio: 2500 },
    { nombre: "Rosuvastatina 10mg", categoria: "Antilipémico", precio: 3200 },
    { nombre: "Pravastatina 40mg", categoria: "Antilipémico", precio: 2700 },
    { nombre: "Fluvastatina 40mg", categoria: "Antilipémico", precio: 2600 },
    { nombre: "Ezetimiba 10mg", categoria: "Antilipémico", precio: 3500 },
    { nombre: "Fenofibrato 145mg", categoria: "Antilipémico", precio: 2900 },
    { nombre: "Gemfibrozilo 600mg", categoria: "Antilipémico", precio: 2700 },
    { nombre: "Colestiramina 4g", categoria: "Antilipémico", precio: 3100 },
    { nombre: "Bezafibrato 400mg", categoria: "Antilipémico", precio: 2800 },
    
    // Anticoagulantes
    { nombre: "Warfarina 5mg", categoria: "Anticoagulante", precio: 2200 },
    { nombre: "Rivaroxabán 10mg", categoria: "Anticoagulante", precio: 5500 },
    { nombre: "Apixabán 2.5mg", categoria: "Anticoagulante", precio: 5300 },
    { nombre: "Dabigatrán 110mg", categoria: "Anticoagulante", precio: 5600 },
    { nombre: "Edoxabán 30mg", categoria: "Anticoagulante", precio: 5400 },
    { nombre: "Enoxaparina 40mg/0.4ml", categoria: "Anticoagulante", precio: 4500 },
    { nombre: "Bemiparina 3500UI", categoria: "Anticoagulante", precio: 4300 },
    { nombre: "Fondaparinux 2.5mg", categoria: "Anticoagulante", precio: 5100 },
    { nombre: "Ácido acetilsalicílico 100mg", categoria: "Antiagregante plaquetario", precio: 1600 },
    { nombre: "Clopidogrel 75mg", categoria: "Antiagregante plaquetario", precio: 3100 },
    
    // Vitaminas y suplementos
    { nombre: "Complejo B", categoria: "Vitamina", precio: 2200 },
    { nombre: "Ácido fólico 5mg", categoria: "Vitamina", precio: 1800 },
    { nombre: "Vitamina C 500mg", categoria: "Vitamina", precio: 2100 },
    { nombre: "Vitamina D3 1000UI", categoria: "Vitamina", precio: 2300 },
    { nombre: "Hierro 100mg", categoria: "Suplemento mineral", precio: 2000 },
    { nombre: "Calcio 600mg + Vitamina D3", categoria: "Suplemento mineral", precio: 2500 },
    { nombre: "Magnesio 300mg", categoria: "Suplemento mineral", precio: 2200 },
    { nombre: "Zinc 50mg", categoria: "Suplemento mineral", precio: 2100 },
    { nombre: "Omega 3 1000mg", categoria: "Suplemento", precio: 2700 },
    { nombre: "Multivitamínico", categoria: "Vitamina", precio: 2600 },
    
    // Medicamentos para problemas respiratorios
    { nombre: "Salbutamol inhalador 100mcg", categoria: "Broncodilatador", precio: 3200 },
    { nombre: "Fluticasona inhalador 250mcg", categoria: "Corticosteroide inhalado", precio: 4500 },
    { nombre: "Montelukast 10mg", categoria: "Antileucotrieno", precio: 3100 },
    { nombre: "Budesonida + Formoterol inhalador", categoria: "Corticosteroide + Broncodilatador", precio: 5200 },
    { nombre: "Ipratropio inhalador 20mcg", categoria: "Broncodilatador", precio: 3800 },
    { nombre: "Tiotropio 18mcg", categoria: "Broncodilatador", precio: 5500 },
    { nombre: "Ambroxol 30mg", categoria: "Mucolítico", precio: 2300 },
    { nombre: "Acetilcisteína 600mg", categoria: "Mucolítico", precio: 2500 },
    { nombre: "Dextrometorfano 15mg", categoria: "Antitusivo", precio: 2100 },
    { nombre: "Bromhexina 8mg", categoria: "Mucolítico", precio: 2200 },
    
    // Medicamentos dermatológicos
    { nombre: "Betametasona crema 0.05%", categoria: "Corticosteroide tópico", precio: 2500 },
    { nombre: "Clotrimazol crema 1%", categoria: "Antimicótico tópico", precio: 2200 },
    { nombre: "Ketoconazol champú 2%", categoria: "Antimicótico tópico", precio: 2800 },
    { nombre: "Adapaleno gel 0.1%", categoria: "Antiacné", precio: 3100 },
    { nombre: "Peróxido de benzoilo gel 5%", categoria: "Antiacné", precio: 2400 },
    { nombre: "Ácido salicílico loción 2%", categoria: "Queratolítico", precio: 2200 },
    { nombre: "Calcipotriol pomada 50mcg/g", categoria: "Antipsoriásico", precio: 4500 },
    { nombre: "Tacrolimus pomada 0.1%", categoria: "Inmunomodulador tópico", precio: 4800 },
    { nombre: "Hidrocortisona crema 1%", categoria: "Corticosteroide tópico", precio: 2300 },
    { nombre: "Mupirocina pomada 2%", categoria: "Antibiótico tópico", precio: 2700 },
    
    // Antiparasitarios
    { nombre: "Albendazol 400mg", categoria: "Antiparasitario", precio: 2200 },
    { nombre: "Mebendazol 100mg", categoria: "Antiparasitario", precio: 2100 },
    { nombre: "Metronidazol 500mg", categoria: "Antiparasitario/Antibiótico", precio: 2300 },
    { nombre: "Ivermectina 6mg", categoria: "Antiparasitario", precio: 2500 },
    { nombre: "Praziquantel 600mg", categoria: "Antiparasitario", precio: 2700 },
    { nombre: "Nitazoxanida 500mg", categoria: "Antiparasitario", precio: 2900 },
    { nombre: "Permetrina crema 5%", categoria: "Antiparasitario tópico", precio: 2600 },
    { nombre: "Lindano loción 1%", categoria: "Antiparasitario tópico", precio: 2400 },
    { nombre: "Pirantel 250mg", categoria: "Antiparasitario", precio: 2200 },
    { nombre: "Niclosamida 500mg", categoria: "Antiparasitario", precio: 2500 },
    
    // Oftálmicos
    { nombre: "Lágrimas artificiales", categoria: "Oftálmico", precio: 2500 },
    { nombre: "Tobramicina gotas 0.3%", categoria: "Antibiótico oftálmico", precio: 2900 },
    { nombre: "Timolol gotas 0.5%", categoria: "Antiglaucoma", precio: 2800 },
    { nombre: "Latanoprost gotas 0.005%", categoria: "Antiglaucoma", precio: 4500 },
    { nombre: "Dexametasona gotas 0.1%", categoria: "Corticosteroide oftálmico", precio: 2700 },
    { nombre: "Ketotifeno gotas 0.025%", categoria: "Antialérgico oftálmico", precio: 2600 },
    { nombre: "Olopatadina gotas 0.1%", categoria: "Antialérgico oftálmico", precio: 3200 },
    { nombre: "Ciclosporina gotas 0.05%", categoria: "Inmunomodulador oftálmico", precio: 5500 },
    { nombre: "Hipromelosa gotas 0.3%", categoria: "Lubricante oftálmico", precio: 2400 },
    { nombre: "Ciprofloxacino gotas 0.3%", categoria: "Antibiótico oftálmico", precio: 2800 }
  ];

  console.log(`Comenzando inserción de ${medicamentosReales.length} medicamentos...`);
  
  // Crear medicamentos en la base de datos
  for (const med of medicamentosReales) {
    // Generar stock aleatorio entre 5 y 100
    const stock = Math.floor(Math.random() * 96) + 5;
    
    // Generar stock mínimo aleatorio entre 3 y 20
    const stockMinimo = Math.floor(Math.random() * 18) + 3;
    
    // Generar fecha de vencimiento aleatoria entre 6 meses y 2 años en el futuro
    const diasAleatorios = Math.floor(Math.random() * 550) + 180;
    const fechaVencimiento = new Date();
    fechaVencimiento.setDate(fechaVencimiento.getDate() + diasAleatorios);
    
    await prisma.medicamento.create({
      data: {
        nombre: med.nombre,
        categoria: med.categoria,
        precio: med.precio,
        stock: stock,
        stockMinimo: stockMinimo,
        vencimiento: fechaVencimiento,
        farmaciaId: farmacia.id
      }
    });
  }
  
  console.log('Inserción de medicamentos completada con éxito.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });