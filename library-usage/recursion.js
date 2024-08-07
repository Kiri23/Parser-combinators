import { between, str, digits, lazy, choice, sepBy } from "../lib.js";

const betweenSquareBrackets = between(str("["), str("]"));

const commaSeparated = sepBy(str(","));

// between square bracket and after each , I will find a digit
const parser5 = betweenSquareBrackets(commaSeparated(digits));
const arrayStr = "[1,2,3]";
console.log("One level nested", arrayStr);
console.log("Result", parser5.run(arrayStr));
/**
 * By trying to parse a nested structure wee need a different solution
 * This will not work -> console.log("episode 5 ", parser5.run("[1,[2],4]"))
 * We could try to solve it by defining the array can contain a digit or another array
 * const value = choice([digits, arrayParser]);
 * const arrayParser = betweenSquareBrackets(commaSeparated(value));
 * This will result in a problem because arrayParser variable is defined before initiliazation
 * Because JS is eager evaluation
 * if we wrap arrayParser in a function like this const arrayParser = () => {...}
 * It will allow us to bypass the error because function are executed when they are called
 */

// Solution for nested structures
const value = lazy(() => choice([digits, arrayParser]));
const arrayParser = betweenSquareBrackets(commaSeparated(value));
const nestedArray = "[1,2,3,[4,[5],6],7]";
console.log("Nested Array", nestedArray);
console.log(
  "parsing each digit in a nested array",
  arrayParser.run(nestedArray)
);
