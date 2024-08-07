/*
  Add:      (+ 10 2)
  Subtract: (- 10 2)
  Multiply: (* 10 2)
  Divide:   (/ 10 2)

  Nest calculations: (+ (* 10 2) (- (/ 50 3) 2))
*/

import { digits, str, choice, sequenceOf, between, lazy } from "./lib.js";

const betweenBrackets = between(str("("), str(")"));

const numberParser = digits.map((x) => ({
  type: "number",
  value: Number(x),
}));

const operatorParser = choice([str("+"), str("-"), str("*"), str("/")]);

const expr = lazy(() => choice([numberParser, operationParser]));

const operationParser = betweenBrackets(
  sequenceOf([operatorParser, str(" "), expr, str(" "), expr])
).map((results) => ({
  type: "operation",
  value: {
    op: results[0],
    a: results[2],
    b: results[4],
  },
}));

// Tree walk intepreter algorithm
const evaluate = (node) => {
  if (node.type === "number") {
    return node.value;
  }

  if (node.type === "operation") {
    if (node.value.op === "+") {
      console.log("node a", node.value.a);
      return evaluate(node.value.a) + evaluate(node.value.b);
    }
    if (node.value.op === "-") {
      return evaluate(node.value.a) - evaluate(node.value.b);
    }
    if (node.value.op === "*") {
      return evaluate(node.value.a) * evaluate(node.value.b);
    }
    if (node.value.op === "/") {
      return evaluate(node.value.a) / evaluate(node.value.b);
    }
  }
};

// Tree walk intepreter algorithm
const validate = (ast) => {
  if (ast.type === "number") {
    if (!Number.isFinite(ast.value)) {
      throw new Error(`Invalid number: ${ast.value}`);
    }
  } else if (ast.type === "operation") {
    validate(ast.value.a);
    validate(ast.value.b);
    if (ast.value.op === "/" && evaluate(ast.value.b) === 0) {
      throw new Error("Division by zero");
    }
  } else {
    throw new Error(`Unknown node type: ${ast.type}`);
  }
};

const interpreter = (program) => {
  const parseResult = expr.run(program);
  if (parseResult.isError) {
    throw new Error(`Parse error: ${parseResult.error}`);
  }

  try {
    validate(parseResult.result);
  } catch (error) {
    throw new Error(`Validation error: ${error.message}`);
  }

  return evaluate(parseResult.result);
};

// const program = "(+ (* 10 2) (- (/ 50 3) 2))";
const program = "(+ 10 2)";

console.log(interpreter(program));
console.log(interpreter("(/ 10 (- 3 3))")); // Should throw: Division by zero
