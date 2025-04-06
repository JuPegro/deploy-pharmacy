exports.procesarResultadosSQL = (resultados) => {
    // Para manejar resultados tanto en arrays como en objetos
    if (Array.isArray(resultados)) {
      return resultados.map(item => procesarBigInt(item));
    } else if (resultados && typeof resultados === 'object') {
      return procesarBigInt(resultados);
    }
    return resultados;
  };
  
  function procesarBigInt(objeto) {
    const resultado = {};
    
    // Recorrer todas las propiedades del objeto
    for (const [clave, valor] of Object.entries(objeto)) {
      // Si es BigInt, convertir a Number
      if (typeof valor === 'bigint') {
        resultado[clave] = Number(valor);
      } 
      // Si es objeto (y no null), procesar recursivamente
      else if (valor && typeof valor === 'object' && !Array.isArray(valor)) {
        resultado[clave] = procesarBigInt(valor);
      } 
      // Si es array, aplicar la función a cada elemento
      else if (Array.isArray(valor)) {
        resultado[clave] = valor.map(item => {
          if (typeof item === 'object') return procesarBigInt(item);
          if (typeof item === 'bigint') return Number(item);
          return item;
        });
      } 
      // Cualquier otro tipo de valor queda igual
      else {
        resultado[clave] = valor;
      }
    }
    
    return resultado;
  }