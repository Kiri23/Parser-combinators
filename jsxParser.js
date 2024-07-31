// library that showcase how a parser combinator can be used to parser a DSL like JSX
// This work by creating two AST, one AST to understand the JSX code and another AST to create React element
// or how Typescript is "transpiled" into Javascript code
// or how SASS extend CSS
// or for refactorizing proccess  Código fuente → AST → AST modificado → Código fuente refactorizado
// or templating languaes
import {
  char,
  choice,
  many,
  sequenceOf,
  str,
  regex,
  possibly,
  between,
  recursiveParser,
  whitespace,
  takeRight,
} from "arcsecond";

// Parser para espacios en blanco y saltos de línea
const optionalWhitespace = regex(/^\s*/);

// Parser para identificadores
const identifier = regex(/^[a-zA-Z_$][a-zA-Z0-9_$]*/).map((value) => {
  console.log("Parsed identifier:", value);
  return value;
});

// Parser para literales de cadena
const stringLiteral = choice([
  between(char("'"))(char("'"))(regex(/^[^']*/)),
  between(char('"'))(char('"'))(regex(/^[^"]/)),
]).map((value) => {
  console.log("Parsed string literal:", value);
  return { type: "StringLiteral", value };
});

// Parser para expresiones JavaScript simples
const jsExpression = between(char("{"))(char("}"))(
  regex(/^[^}]+/).map((content) => {
    console.log("Parsed JS expression:", content);
    return {
      type: "JSXExpressionContainer",
      expression: { type: "Expression", value: content.trim() },
    };
  })
);

// Parser para atributos JSX
const jsxAttribute = sequenceOf([
  identifier,
  possibly(
    sequenceOf([
      optionalWhitespace,
      char("="),
      optionalWhitespace,
      choice([stringLiteral, jsExpression]),
    ])
  ),
]).map(([name, valueArray]) => {
  const value = valueArray
    ? valueArray[3]
    : { type: "BooleanLiteral", value: true };
  console.log("Parsed attribute:", name, value);
  return {
    type: "JSXAttribute",
    name: { type: "JSXIdentifier", name },
    value,
  };
});

// Parser para elementos JSX (usando recursiveParser)
const jsxElement = recursiveParser(() => {
  const openTag = between(char("<"))(char(">"))(
    sequenceOf([
      identifier,
      many(sequenceOf([whitespace, jsxAttribute]).map(([_, attr]) => attr)),
    ]).map(([name, attributes]) => {
      console.log("Parsed opening tag:", name, attributes);
      return {
        type: "JSXOpeningElement",
        name: { type: "JSXIdentifier", name },
        attributes,
      };
    })
  );

  const closeTag = sequenceOf([str("</"), identifier, char(">")]).map(
    ([_, name]) => {
      console.log("Parsed closing tag:", name);
      return {
        type: "JSXClosingElement",
        name: { type: "JSXIdentifier", name },
      };
    }
  );

  const jsxText = regex(/^[^<{]+/).map((text) => {
    const trimmedText = text.trim();
    if (trimmedText) {
      console.log("Parsed JSX text:", trimmedText);
      return { type: "JSXText", value: trimmedText };
    }
    return null;
  });

  const jsxContent = choice([jsxElement, jsxText, jsExpression]);

  return sequenceOf([
    openTag,
    many(choice([jsxContent, takeRight(optionalWhitespace)(jsxContent)])),
    closeTag,
  ]).map(([open, children, close]) => {
    console.log(
      `Parsed JSX element: ${open.name.name} with ${children.length} children`
    );
    const filteredChildren = children.filter((child) => child !== null);
    return {
      type: "JSXElement",
      openingElement: open,
      children: filteredChildren,
      closingElement: close,
    };
  });
});

// Parser principal para JSX
const jsxParser = sequenceOf([
  optionalWhitespace,
  jsxElement,
  optionalWhitespace,
]).map(([_, element]) => {
  console.log("Finished parsing entire JSX structure");
  return element;
});

// Función para transformar el AST de JSX a AST de JavaScript
function transformJSXtoJS(jsxAst) {
  console.log("Transforming JSX AST:", JSON.stringify(jsxAst, null, 2));

  if (jsxAst.type === "JSXElement") {
    return {
      type: "CallExpression",
      callee: { type: "Identifier", name: "React.createElement" },
      arguments: [
        { type: "StringLiteral", value: jsxAst.openingElement.name.name },
        jsxAst.openingElement.attributes.length > 0
          ? {
              type: "ObjectExpression",
              properties: jsxAst.openingElement.attributes.map((attr) => ({
                type: "ObjectProperty",
                key: { type: "Identifier", name: attr.name.name },
                value: transformAttributeValue(attr.value),
              })),
            }
          : { type: "NullLiteral" },
        ...jsxAst.children.map(transformJSXtoJS),
      ],
    };
  } else if (jsxAst.type === "JSXText") {
    return { type: "StringLiteral", value: jsxAst.value.trim() };
  } else if (jsxAst.type === "JSXExpressionContainer") {
    return transformExpression(jsxAst.expression);
  }

  return jsxAst;
}

function transformAttributeValue(value) {
  if (value.type === "StringLiteral") {
    return value;
  } else if (value.type === "JSXExpressionContainer") {
    return transformExpression(value.expression);
  } else if (value.type === "BooleanLiteral") {
    return value;
  }
  // Para otros tipos de valores, podríamos necesitar más casos
  return value;
}

function transformExpression(expression) {
  if (expression.type === "Expression") {
    // Aquí asumimos que el valor es un identificador simple
    // En un caso real, necesitaríamos un parser más complejo para expresiones JavaScript
    return { type: "Identifier", name: expression.value };
  }
  // Para otros tipos de expresiones, podríamos necesitar más casos
  return expression;
}

// Simulación básica de React.createElement
function React() {}
React.createElement = function (type, props, ...children) {
  return { type, props, children };
};

// Función para evaluar el AST y convertirlo en llamadas de método reales
function evaluateAST(node) {
  switch (node.type) {
    case "CallExpression":
      const callee = evaluateAST(node.callee);
      const args = node.arguments.map(evaluateAST);
      return callee(...args);

    case "Identifier":
      if (node.name === "React.createElement") {
        return React.createElement;
      }
      // Para otros identificadores, podríamos querer buscarlos en un scope,
      // pero para este ejemplo, simplemente devolveremos el nombre
      return node.name;

    case "StringLiteral":
      return node.value;

    case "BooleanLiteral":
      return node.value;

    case "NullLiteral":
      return null;

    case "ObjectExpression":
      const obj = {};
      for (let prop of node.properties) {
        obj[evaluateAST(prop.key)] = evaluateAST(prop.value);
      }
      return obj;

    default:
      console.error("Unsupported node type:", node.type);
      return null;
  }
}

// Ejemplo de uso
// JSX → AST de JSX → AST de llamadas a React.createElement → Elementos React → DOM Virtual → DOM Real
const jsxCode = `
  <div className='container'>
    <h1>
      Hello, {name}!
    </h1>
    <p>Welcome to JSX parsing.</p>
    <button onClick={handleClick} disabled>
      Click me
    </button>
  </div>
  `;
const jsxCode2 = `
  <div className='container'>
   hello
  </div>
  `;

console.log("Starting to parse JSX:", jsxCode2);
const result = jsxParser.run(jsxCode2);

if (result.isError) {
  console.error("Error parsing JSX:", result.error);
  console.error("Error occurred at position:", result.index);
  console.error("Remaining input:", jsxCode2.slice(result.index));
} else {
  console.log("Successfully parsed JSX");
  console.log("JSX AST:", JSON.stringify(result.result, null, 2));
}
const jsAst = transformJSXtoJS(result.result);
// Evaluar el AST
const reactCode = evaluateAST(jsAst);

console.log("JSX AST:", JSON.stringify(result.result, null, 2));
console.log("Transformed JS AST:", JSON.stringify(jsAst, null, 2));
console.log("React code:");
console.log(JSON.stringify(reactCode, null, 2));
