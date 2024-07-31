const updateParserState = (state, index, result) => ({
  ...state,
  index,
  result,
});

const updateParserResult = (state, result) => ({
  ...state,
  result,
});

const updateParserError = (state, errorMsg) => ({
  ...state,
  isError: true,
  error: errorMsg,
});

class Parser {
  constructor(parserStateTransformerFn, desc) {
    this.parserStateTransformerFn = parserStateTransformerFn;
    this.description = desc;
  }

  run(targetString) {
    const initialState = {
      targetString,
      index: 0,
      result: null,
      isError: false,
      error: null,
    };

    console.log("class run", this.description);
    return this.parserStateTransformerFn(initialState);
  }

  map(fn) {
    console.log("construyendo map");
    return new Parser((parserState) => {
      console.log("map", this.description);
      const nextState = this.parserStateTransformerFn(parserState);

      if (nextState.isError) return nextState;

      return updateParserResult(nextState, fn(nextState.result));
    }, "map");
  }

  chain(fn) {
    return new Parser((parserState) => {
      const nextState = this.parserStateTransformerFn(parserState);

      if (nextState.isError) return nextState;

      const nextParser = fn(nextState.result);

      return nextParser.parserStateTransformerFn(nextState);
    });
  }

  errorMap(fn) {
    return new Parser((parserState) => {
      const nextState = this.parserStateTransformerFn(parserState);

      if (!nextState.isError) return nextState;

      return updateParserError(nextState, fn(nextState.error, nextState.index));
    });
  }
}

const str = (s) => {
  return new Parser((parserState) => {
    const { targetString, index, isError } = parserState;

    if (isError) {
      return parserState;
    }

    const slicedTarget = targetString.slice(index);

    if (slicedTarget.length === 0) {
      return updateParserError(
        parserState,
        `str: Tried to match "${s}", but got Unexpected end of input.`
      );
    }

    if (slicedTarget.startsWith(s)) {
      return updateParserState(parserState, index + s.length, s);
    }

    return updateParserError(
      parserState,
      `str: Tried to match "${s}", but got "${targetString.slice(
        index,
        index + 10
      )}"`
    );
  }, "str desc");
};

const lettersRegex = /^[A-Za-z]+/;
const letters = new Parser((parserState) => {
  console.log("letter");
  const { targetString, index, isError } = parserState;

  if (isError) {
    return parserState;
  }

  const slicedTarget = targetString.slice(index);

  if (slicedTarget.length === 0) {
    return updateParserError(
      parserState,
      `letters: Got Unexpected end of input.`
    );
  }

  const regexMatch = slicedTarget.match(lettersRegex);

  if (regexMatch) {
    return updateParserState(
      parserState,
      index + regexMatch[0].length,
      regexMatch[0]
    );
  }

  return updateParserError(
    parserState,
    `letters: Couldn't match letters at index ${index}`
  );
}, "letter desc");

const digitsRegex = /^[0-9]+/;
const digits = new Parser((parserState) => {
  const { targetString, index, isError } = parserState;

  if (isError) {
    return parserState;
  }

  const slicedTarget = targetString.slice(index);

  if (slicedTarget.length === 0) {
    return updateParserError(
      parserState,
      `digits: Got Unexpected end of input.`
    );
  }

  const regexMatch = slicedTarget.match(digitsRegex);

  if (regexMatch) {
    return updateParserState(
      parserState,
      index + regexMatch[0].length,
      regexMatch[0]
    );
  }

  return updateParserError(
    parserState,
    `digits: Couldn't match digits at index ${index}`
  );
}, "digit desc");

const sequenceOf = (parsers) => {
  console.log("construyendo seuqnece of");
  return new Parser((parserState) => {
    if (parserState.isError) {
      return parserState;
    }

    const results = [];
    let nextState = parserState;

    for (let p of parsers) {
      console.log("p", p.description);
      nextState = p.parserStateTransformerFn(nextState);

      results.push(nextState.result);
    }
    console.log("devuelta los resultados", results);

    return updateParserResult(nextState, results);
  }, "sequenceOf");
};

const choice = (parsers) =>
  new Parser((parserState) => {
    if (parserState.isError) {
      return parserState;
    }

    for (let p of parsers) {
      const nextState = p.parserStateTransformerFn(parserState);
      if (!nextState.isError) {
        return nextState;
      }
    }

    return updateParserError(
      parserState,
      `choice: Unable to match with any parser at index ${parserState.index}`
    );
  }, "choice desc");

const many = (parser) =>
  new Parser((parserState) => {
    if (parserState.isError) {
      return parserState;
    }

    let nextState = parserState;
    const results = [];
    let done = false;

    while (!done) {
      let testState = parser.parserStateTransformerFn(nextState);

      if (!testState.isError) {
        results.push(testState.result);
        nextState = testState;
      } else {
        done = true;
      }
    }

    return updateParserResult(nextState, results);
  });

const many1 = (parser) =>
  new Parser((parserState) => {
    if (parserState.isError) {
      return parserState;
    }

    let nextState = parserState;
    const results = [];
    let done = false;

    while (!done) {
      const nextState = parser.parserStateTransformerFn(nextState);
      if (!nextState.isError) {
        results.push(nextState.result);
      } else {
        done = true;
      }
    }

    if (results.length === 0) {
      return updateParserError(
        parserState,
        `many1: Unable to match any input using parser @ index ${parserState.index}`
      );
    }

    return updateParserResult(nextState, results);
  });

const sepBy = (separatorParser) => (valueParser) =>
  new Parser((parserState) => {
    const results = [];
    let nextState = parserState;

    while (true) {
      const thingWeWantState = valueParser.parserStateTransformerFn(nextState);
      if (thingWeWantState.isError) {
        break;
      }
      results.push(thingWeWantState.result);
      nextState = thingWeWantState;

      const separatorState =
        separatorParser.parserStateTransformerFn(nextState);
      if (separatorState.isError) {
        break;
      }
      nextState = separatorState;
    }

    return updateParserResult(nextState, results);
  });

const sepBy1 = (separatorParser) => (valueParser) =>
  new Parser((parserState) => {
    const results = [];
    let nextState = parserState;

    while (true) {
      const thingWeWantState = valueParser.parserStateTransformerFn(nextState);
      if (thingWeWantState.isError) {
        break;
      }
      results.push(thingWeWantState.result);
      nextState = thingWeWantState;

      const separatorState =
        separatorParser.parserStateTransformerFn(nextState);
      if (separatorState.isError) {
        break;
      }
      nextState = separatorState;
    }

    if (results.length === 0) {
      return updateParserError(
        parserState,
        `sepBy1: Unable to capture any results at index ${parserState.index}`
      );
    }

    return updateParserResult(nextState, results);
  });

const between = (leftParser, rightParser) => (contentParser) =>
  sequenceOf([leftParser, contentParser, rightParser]).map(
    (results) => results[1]
  );

const lazy = (parserThunk) =>
  new Parser((parserState) => {
    const parser = parserThunk();
    return parser.parserStateTransformerFn(parserState);
  });

// and how we use it

// episode 4 , introducing chain
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

// console.log("diceroll result", dicerollParser.run("4d3"));

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

// console.log("result", parser.run("diceroll:4d3"));

// episode 2
const parser2 = sequenceOf([str("hello there"), str(" "), digits]);
// console.log("parser", parser2.run("hello there 456"));

// betwen
const betweenBrackets = between(str("("), str(")"));
const parser3 = betweenBrackets(letters);
// console.log("parser", parser3.run("(hello)"));

/** Episode 5 */
const exampleString = "[1,[2,[3],4],5]";
const betweenSquareBrackets = between(str("["), str("]"));

const commaSeparated = sepBy(str(","));

const parser5 = betweenSquareBrackets(commaSeparated(digits));
console.log("episode 5 ", parser5.run("[1,2,4]"));

// this is why we need lazy evaluation, array parser is not defined , it's used before initialization
// this happen beacuase JS is eager evalutation and not lazy evaluation
/*
const value = choice([digits, arrayParser]);
const arrayParser = betweenSquareBrackets(commaSeparated(value));
*/

//solution to value is used before initialization
const value = lazy(() => choice([digits, arrayParser]));
const arrayParser = betweenSquareBrackets(commaSeparated(value));
console.log("array parser", arrayParser.run("[1,2,3,[4,[5],6],7]"));

export {
  str,
  letters,
  digits,
  sequenceOf,
  choice,
  many,
  many1,
  sepBy,
  sepBy1,
  between,
  lazy,
};
