// dsl example using arc second
import * as A from "arcsecond";

// Parsers básicos
const whitespace = A.regex(/^\s*/);
const number = A.regex(/^[0-9]+/).map(Number);

// Avanzar
const avanzar = A.sequenceOf([A.str("AVANZAR"), whitespace, number]).map(
  ([, , steps]) => {
    console.log(`Parsed AVANZAR with steps: ${steps}`);
    return {
      type: "AVANZAR",
      steps,
    };
  }
);

// Girar
const girar = A.sequenceOf([
  A.str("GIRAR"),
  whitespace,
  A.choice([A.str("IZQUIERDA"), A.str("DERECHA")]),
]).map(([, , direction]) => {
  console.log(`Parsed GIRAR with direction: ${direction}`);
  return {
    type: "GIRAR",
    direction,
  };
});

// Comando y bloque de comandos (forward declarations)
let comando, bloqueComandos;

// Repetir
const repetir = A.coroutine(function* () {
  console.log("Parsing REPETIR");
  yield A.str("REPETIR");
  yield whitespace;
  const times = yield number;
  console.log(`Parsed times: ${times}`);
  yield whitespace;
  yield A.str("VECES");
  yield whitespace;
  console.log("Parsing commands block");
  const commands = yield bloqueComandos;
  console.log(`Parsed commands block in REPETIR: ${JSON.stringify(commands)}`);
  yield A.str("FIN");
  console.log("Parsed FIN for REPETIR");

  return {
    type: "REPETIR",
    times,
    commands,
  };
});

// Comando (actual definition)
comando = A.choice([avanzar, girar, repetir]).map((result) => {
  console.log(`Parsed command: ${JSON.stringify(result)}`);
  return result;
});

// Bloque de comandos
bloqueComandos = A.sequenceOf([whitespace, A.many1(comando), whitespace]).map(
  ([_, cmds]) => {
    console.log(`Parsed block of commands: ${JSON.stringify(cmds)}`);
    return cmds;
  }
);

// Programa completo (una secuencia de comandos)
const programa = A.sequenceOf([whitespace, bloqueComandos, whitespace]).map(
  ([, cmds]) => cmds
);

// Función para parsear un programa
function parseProgram(input) {
  console.log(`Parsing program: ${input}`);
  const result = programa.run(input);
  if (result.isError) {
    console.error(`Error de parsing: ${result.error}`);
    throw new Error(`Error de parsing: ${result.error}`);
  }
  console.log(`Parsed program result: ${JSON.stringify(result.result)}`);
  return result.result;
}

// Ejemplo de uso
const programaEjemplo = `
  AVANZAR 5
  GIRAR DERECHA
  REPETIR 3 VECES
    AVANZAR 2
    GIRAR IZQUIERDA
  FIN
  AVANZAR 1
`;

try {
  const resultado = parseProgram(programaEjemplo);
  console.log(JSON.stringify(resultado, null, 2));
} catch (error) {
  console.error(error.message);
}
