import { letters, digits, str, sequenceOf } from "../lib.js";
// this example show how to use a second parser based on the result of the first parser
// parse the remaining string based on the string before

const stringParser = letters.map((result) => ({
  type: "string",
  value: result,
}));

const numberParser = digits.map((result) => ({
  type: "number",
  value: Number(result),
}));

const dicerollParser = sequenceOf([digits, str("d"), digits]).map(
  ([n, _, s]) => ({
    type: "diceroll",
    value: [Number(n), Number(s)],
  })
);

const parser = sequenceOf([letters, str(":")])
  .map((results) => results[0])
  .chain((type) => {
    if (type === "string") {
      return stringParser;
    } else if (type === "number") {
      return numberParser;
    }
    return dicerollParser;
  });

console.log("result", parser.run("diceroll:4d3"));
// output: diceroll,4,3
console.log("result", parser.run("number:4d3"));
// output 4
console.log("result", parser.run("string:rft"));
// output rft
