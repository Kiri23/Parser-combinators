// Version: 4
// Header length: 5 * 32-bit = 20 bytes
// TOS: 0x00
// Total Length: 0x0044 (68 bytes)
// Identification: 0xad0b
// Flags and Fragments: 0x0000
// TTL: 0x40 (64 hops)
// Protocol: 0x11 (UDP)
// Header Checksom: 0x7272
// Source: 0xac1402fd (172.20.2.253)
// Destination: 0xac140006 (172.20.0.6)

// A 16 bit number: (24161)
// 0101111001100001

// And some of the different ways we might interpret this number

// 0101111001100001                 :: As one 16 bit number (24161)
// 01011110 01100001                :: As two 8 bit numbers (94, 97)
// 0101 1110 0110 0001              :: As four 4 bit numbers (5, 14, 6, 1)
// 0 1 0 1 1 1 1 0 0 1 1 0 0 0 0 1  :: As sixteen individual bits

import {
  Parser,
  updateParserError,
  updateParserState,
  sequenceOf,
} from "../../lib.js";
import fs from "fs";
import path from "path";

const extractBit = (byte, bitIndex) => {
  // What bit we want to get: 0, 1, 2, 3, 4, 5, 6, or 7
  // Subtract from 7 because we start counting from left to right
  /**
    Bit index:    0  1  2  3  4  5  6  7
    Bit value:    1  0  1  0  1  0  1  0
    Bit offset:   7  6  5  4  3  2  1  0
   */
  const bitOffset = 7 - (bitIndex % 8);

  // The << left operator will add 0s to the right or move the bits to the left by (bitOffset) positions
  // 1 << 3 = 1000
  // 1 << 4 = 10000
  const bitMask = 1 << bitOffset;

  // The AND operation isolates the bit we want and converts to 0 the ones we don't want
  /**
   * Let's say we want to extract the 3rd bit (index 2) from the byte 10101010:
   * Byte:     1 0 1 0 1 0 1 0
   * Bit mask: 0 0 1 0 0 0 0 0  (1 << 5, because bitOffset would be 5 for index 2)
   * Result:   0 0 1 0 0 0 0 0
   *
   * The last step >> bitOffset removes the 0s we added because of the bit mask so we can
   * effectively extract a single bit (0 or 1)
   * Another way of saying it is that it reverses the step we did on the bitmask
   */
  return (byte & bitMask) >> bitOffset;
};

const Bit = new Parser((parserState) => {
  if (parserState.isError) {
    return parserState;
  }
  const byteOffset = Math.floor(parserState.index / 8);

  if (byteOffset >= parserState.target.byteLength) {
    return updateParserError(parserState, `Bit: Unexpected end of input`);
  }
  const byte = parserState.target.getUint8(byteOffset);

  const bit = extractBit(byte, parserState.index);
  return updateParserState(parserState, parserState.index + 1, bit);
});

const Zero = new Parser((parserState) => {
  if (parserState.isError) {
    return parserState;
  }

  const byteOffset = Math.floor(parserState.index / 8);

  if (byteOffset >= parserState.target.byteLength) {
    return updateParserError(parserState, `Zero: Unexpected end of input`);
  }

  const byte = parserState.target.getUint8(byteOffset);
  const bit = extractBit(byte, parserState.index);

  if (bit !== 0) {
    return updateParserError(
      parserState,
      `Zero: Expected a zero, but got a one at index ${parserState.index}`
    );
  }

  return updateParserState(parserState, parserState.index + 1, bit);
});

const One = new Parser((parserState) => {
  if (parserState.isError) {
    return parserState;
  }

  const byteOffset = Math.floor(parserState.index / 8);

  if (byteOffset >= parserState.target.byteLength) {
    return updateParserError(parserState, `One: Unexpected end of input`);
  }

  const byte = parserState.target.getUint8(byteOffset);
  const bit = extractBit(byte, parserState.index);

  if (bit !== 1) {
    return updateParserError(
      parserState,
      `One: Expected a One, but got a Zero at index ${parserState.index}`
    );
  }

  return updateParserState(parserState, parserState.index + 1, bit);
});

const Uint = (n) => {
  if (n < 1) {
    throw new Error(`Uint: n must be larger than 0, but we got ${n}`);
  }

  if (n > 32) {
    throw new Error(`Uint: n must be less than 32, but we got ${n}`);
  }

  return sequenceOf(Array.from({ length: n }, () => Bit)).map((bits) => {
    return bits.reduce((acc, bit, i) => {
      return acc + Number(BigInt(bit) << BigInt(n - 1 - i));
    }, 0);
  });
};

// Ones complement
// SXXX
// 0001 = 1
// 1001 = -1
// 0000 = 0
// 1000 = ? -0

// Twos Complement
// 0001
// 1110 + 0001 = 1111 -> -1

// 1011
// 0001
//------
// 1100
// 0001
// -----
// 1101 -> -3

const Int = (n) => {
  if (n < 1) {
    throw new Error(`Int: n must be larger than 0, but we got ${n}`);
  }

  if (n > 32) {
    throw new Error(`Int: n must be less than 32, but we got ${n}`);
  }

  return sequenceOf(Array.from({ length: n }, () => Bit)).map((bits) => {
    if (bits[0] === 0) {
      return bits.reduce((acc, bit, i) => {
        return acc + Number(BigInt(bit) << BigInt(n - 1 - i));
      }, 0);
    } else {
      return -(
        1 +
        bits.reduce((acc, bit, i) => {
          return acc + Number(BigInt(bit === 0 ? 1 : 0) << BigInt(n - 1 - i));
        }, 0)
      );
    }
  });
};

const RawString = (s) => {
  if (s.length < 1) {
    throw new Error(`RawString: s must be at least 1 character`);
  }

  const byteParsers = s
    .split("")
    .map((c) => c.charCodeAt(0))
    .map((n) => {
      return Uint(8).chain((res) => {
        if (res === n) {
          return succeed(n);
        } else {
          return fail(
            `RawString: Expected character ${String.fromCharCode(
              n
            )}, but got ${String.fromCharCode(res)}`
          );
        }
      });
    });

  return sequenceOf(byteParsers);
};

const binaryNumbers = [1, 255];
// An example on how to parse bits, Number 1 (00000001), 255 (1111111)
const parser = sequenceOf([
  Zero,
  Zero,
  Zero,
  Zero,
  Zero,
  Zero,
  Zero,
  One,
  One,
  Bit,
  Bit,
  Bit,
]);

const data = new Uint8Array(binaryNumbers).buffer;
const dataView = new DataView(data);
// const res = parser.run(dataView);
// console.log(res);

// Example 2 parsing binary file that contains ip header
const tag = (type) => (value) => ({ type, value });
const parser2 = sequenceOf([
  Uint(4).map(tag("Version")),
  Uint(4).map(tag("IHL")),
  Uint(6).map(tag("DSCP")),
  Uint(2).map(tag("ECN")),
  Uint(16).map(tag("Total Length")),
  Uint(16).map(tag("Identification")),
  Uint(3).map(tag("Flags")),
  Uint(13).map(tag("Fragment Offset")),
  Uint(8).map(tag("TTL")),
  Uint(8).map(tag("Protocol")),
  Uint(16).map(tag("Header Checksum")),
  Uint(32).map(tag("Source IP")),
  Uint(32).map(tag("Destination IP")),
]).chain((res) => {
  if (res[1].value > 5) {
    const remainingBytes = Array.from({ length: res[1].value - 20 }, () =>
      Uint(8)
    );
    // In the video .chain() was used here (incorrectly)
    // Thanks to https://github.com/IceSentry for pointing that one out
    return sequenceOf(remainingBytes).map((remaining) => [
      ...res,
      tag("Options")(remaining),
    ]);
  }
  return succeed(res);
});

const relativePath =
  "/Users/christiannogueras/Documents/Personal projects/Learning /Parser-combinators/library-usage/parsing-ip-packet-header/";
const file = fs.readFileSync(relativePath + "packet.bin").buffer;
const dataView2 = new DataView(file);

const res = parser2.run(dataView2);

console.log(res);
