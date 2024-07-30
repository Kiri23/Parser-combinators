// Clase base para operaciones de array
class ArrayOp {
  constructor(fn) {
    this.process = fn;
  }

  run(arr) {
    console.log(`Ejecutando ${this.constructor.name}`);
    return this.process(arr);
  }

  map(fn) {
    console.log(`Creando MapOp desde ${this.constructor.name}`);
    return new MapOp((arr) => {
      console.log(arr);
      console.log("before summing 1");
      return fn(this.run(arr));
    });
  }

  filter(fn) {
    console.log(`Creando FilterOp desde ${this.constructor.name}`);
    return new FilterOp((arr) => {
      console.log("filter op", this.run(arr));
      return this.run(arr).filter(fn);
    });
  }
}

class MapOp extends ArrayOp {}
class FilterOp extends ArrayOp {}

// Operación inicial
const doubleNumbers = new ArrayOp((arr) => {
  console.log("Duplicando números", arr);
  return arr.map((x) => x * 2);
});

// Construyendo la cadena de operaciones
const processArray = doubleNumbers
  .map((arr) => {
    console.log("Sumando 1 a cada elemento", arr);
    return arr.map((x) => x + 1);
  })
  .filter((x) => {
    console.log(`Filtrando ${x}`);
    return x > 5;
  });

// Ejecutando la cadena
console.log("Resultado:", processArray.run([1, 2, 3, 4, 5]));
