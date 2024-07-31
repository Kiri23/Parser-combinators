import {
  char,
  choice,
  many,
  sequenceOf,
  str,
  regex,
  anythingExcept,
  possibly,
  between,
  recursiveParser,
} from "arcsecond";

// Parsers auxiliares
const whitespace = regex(/^\s*/);
const identifier = regex(/^[a-zA-Z_$][a-zA-Z0-9_$]*/).map((value) => {
  console.log("Parsed identifier:", value);
  return value;
});
const stringLiteral = between(char("'"))(char("'"))(regex(/^[^']*/)).map(
  (value) => {
    console.log("Parsed string literal:", value);
    return { type: "StringLiteral", value };
  }
);

// Parser para atributos JSX
const jsxAttribute = sequenceOf([identifier, char("="), stringLiteral]).map(
  ([name, _, value]) => {
    console.log("Parsed attribute:", name, value);
    return {
      type: "JSXAttribute",
      name: { type: "JSXIdentifier", name },
      value,
    };
  }
);

// Parser para elementos JSX (usando recursiveParser)
const jsxElement = recursiveParser(() => {
  const openTag = between(char("<"))(char(">"))(
    sequenceOf([identifier, whitespace, many(jsxAttribute)]).map(
      ([name, _, attributes]) => {
        console.log("Parsed opening tag:", name, attributes);
        return {
          type: "JSXOpeningElement",
          name: { type: "JSXIdentifier", name },
          attributes,
        };
      }
    )
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

  return sequenceOf([
    openTag,
    many(anythingExcept(closeTag)).map((content) => {
      const text = content.join("").trim();
      console.log("Parsed content:", text);
      return text ? [{ type: "JSXText", value: text }] : [];
    }),
    closeTag,
  ]).map(([open, children, close]) => {
    console.log("Parsed JSX element:", open, children, close);
    return {
      type: "JSXElement",
      openingElement: open,
      children: children.flat(), // Asegurarse de que children sea siempre un array
      closingElement: close,
    };
  });
});

// Parser principal para JSX
const jsxParser = jsxElement;

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
                value: attr.value,
              })),
            }
          : { type: "NullLiteral" },
        ...(jsxAst.children || []).map((child) => {
          if (child.type === "JSXText") {
            return { type: "StringLiteral", value: child.value.trim() };
          }
          return transformJSXtoJS(child);
        }),
      ],
    };
  }
  return jsxAst;
}

// Ejemplo de uso
const jsxCode = "<div className='container'> <h1> hello </h1> </div>";
console.log("Parsing JSX:", jsxCode);
const result = jsxParser.run(jsxCode);

if (result.isError) {
  console.error("Error parsing JSX:", result.error);
} else {
  console.log("Successfully parsed JSX");
  const jsxAst = result.result;
  console.log("JSX AST:", JSON.stringify(jsxAst, null, 2));
  const jsAst = transformJSXtoJS(jsxAst);
  console.log("Transformed JS AST:", JSON.stringify(jsAst, null, 2));
}
