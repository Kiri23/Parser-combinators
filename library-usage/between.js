import { between, str, letters } from "../lib.js";
// Would get the text between ( )
const betweenBrackets = between(str("("), str(")"));
const parser3 = betweenBrackets(letters);
console.log("parser", parser3.run("(hello)"));
