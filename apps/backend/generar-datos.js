const { exec } = require('child_process');
const path = require('path');

const scripts = [
  'generar-farmacias-script.js',
  'generar-medicamentos-script.js',
  'create-users.js',
  'generar-inventarios-script.js',
  'generar-ventas-script.js',
  'generar-devoluciones-script.js'
];

function runScript(script) {
  return new Promise((resolve, reject) => {
    const fullPath = path.join(__dirname, script);
    console.log(`Ejecutando ${script}...`);
    
    exec(`node ${fullPath}`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error en ${script}:`, error);
        reject(error);
        return;
      }
      
      console.log(`${script} completado.`);
      console.log(stdout);
      resolve();
    });
  });
}

async function generarDatosCompletos() {
  try {
    for (const script of scripts) {
      await runScript(script);
    }
    console.log('Todos los scripts completados exitosamente.');
    process.exit(0);
  } catch (error) {
    console.error('Error al generar datos:', error);
    process.exit(1);
  }
}

generarDatosCompletos();