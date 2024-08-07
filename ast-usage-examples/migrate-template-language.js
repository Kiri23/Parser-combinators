const A = require("arcsecond");

// Parser for content outside of tags
const content = A.regex(/^[^{]+/).map((text) => ({
  type: "Text",
  value: text,
}));

// Parser for variable expressions like {{list.x}}
const variable = A.between(A.str("{{"))(A.str("}}"))(A.regex(/^[\w.]+/)).map(
  (expr) => ({ type: "Variable", value: expr })
);

// Parser for for-loop start
const forStart = A.between(A.str("{{"))(A.str("}}"))(
  A.sequenceOf([A.str("for "), A.regex(/^\w+/), A.str(" in "), A.regex(/^\w+/)])
).map(([_, item, __, list]) => ({ type: "ForStart", item, list }));

// Parser for for-loop end
const forEnd = A.str("{{endfor}}").map(() => ({ type: "ForEnd" }));

// Parser for the entire template
const template = A.many(A.choice([content, variable, forStart, forEnd]));

// Example usage
const input = `
{{for list in lists}}
  {{list.x}}
{{endfor}}
`;

const ast = template.run(input).result;

console.log("Original AST:", JSON.stringify(ast, null, 2));

// Modify the AST to use single braces
function modifyAST(node) {
  if (node.type === "Variable") {
    node.singleBrace = true;
  } else if (node.type === "ForStart") {
    node.singleBrace = true;
  } else if (node.type === "ForEnd") {
    node.singleBrace = true;
  }
  return node;
}

const modifiedAST = ast.map(modifyAST);

console.log("Modified AST:", JSON.stringify(modifiedAST, null, 2));

// Recreate code from AST
function recreateCode(node) {
  switch (node.type) {
    case "Text":
      return node.value;
    case "Variable":
      return node.singleBrace ? `{${node.value}}` : `{{${node.value}}}`;
    case "ForStart":
      return node.singleBrace
        ? `{for ${node.item} in ${node.list}}`
        : `{{for ${node.item} in ${node.list}}}`;
    case "ForEnd":
      return node.singleBrace ? "{endfor}" : "{{endfor}}";
    default:
      return "";
  }
}

const recreatedCode = modifiedAST.map(recreateCode).join("");

console.log("Recreated code:", recreatedCode);
