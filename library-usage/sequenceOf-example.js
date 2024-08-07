import { sequenceOf, str, digits } from "../lib.js";
const parser2 = sequenceOf([str("hello there"), str(" "), digits]);
console.log("parser", parser2.run("hello there 456"));
