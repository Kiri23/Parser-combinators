function createChain(initialValue) {
  console.log("construyendo chain, initial value", initialValue);
  let operations = [];

  function addOperation(op) {
    operations.push(op);
    return chainObject;
  }

  const chainObject = {
    add: (n) => {
      console.log("construyendo add");
      return addOperation((x) => {
        console.log(`Añadiendo ${n}`);
        return x + n;
      });
    },
    multiply: (n) => {
      console.log("construyendo multiply");
      return addOperation((x) => {
        console.log(`Multiplicando por ${n}`);
        return x * n;
      });
    },
    execute: () => {
      console.log("Iniciando ejecución");
      return operations.reduce((result, op) => op(result), initialValue);
    },
  };

  return chainObject;
}

// Creando y ejecutando la cadena
const result = createChain(5).add(3).multiply(2).add(1).execute();

console.log("Resultado final:", result);
