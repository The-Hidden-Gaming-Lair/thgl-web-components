import * as fs from "fs";

const HEADER_FILECODESIZE = 32;

const HEADER_NUMENTRIES = 0x20;
const HEADER_HEADERSIZE = 0x28;
const HEADER_OFFSETDICT = 0x30;
const HEADER_OFFSETTEXT = 0x38;
const HEADER_SIZEOFTEXT = 0x40;

const OFFSET_STARTOFDICT = 0x48;
const ENTRY_SIZE = 12;

export function decodeAvaf(inputFile: string): Record<string, string> {
  console.log("Input file: " + inputFile);

  const di = fs.readFileSync(inputFile);

  const numEntries = di.readBigUInt64LE(HEADER_NUMENTRIES);
  const headerSize = di.readBigUInt64LE(HEADER_HEADERSIZE);
  const dictSize = di.readBigUInt64LE(HEADER_OFFSETDICT);
  const textblockOffset = di.readBigUInt64LE(HEADER_OFFSETTEXT);
  const textblockSize = di.readBigUInt64LE(HEADER_SIZEOFTEXT);

  console.log("format: (" + di.toString("ascii", 0, HEADER_FILECODESIZE) + ")");
  console.log("ENTRIES: " + numEntries);
  console.log("HEADER SIZE: " + headerSize);
  console.log("DICTIONARY SIZE: " + dictSize);
  console.log("DICTIONARY END/TEXT START: " + textblockOffset);
  console.log("TEXT SIZE: " + textblockSize);

  const dictionary = di.slice(Number(headerSize), Number(textblockOffset));
  const rawtext = di.slice(
    Number(textblockOffset),
    Number(textblockOffset + textblockSize),
  );

  const result: Record<string, string> = {};
  let key = "";
  for (let entryindex = 0; entryindex < Number(numEntries) * 2; entryindex++) {
    const entryoffset = entryindex * ENTRY_SIZE;
    const textoffset = Number(dictionary.readBigUInt64LE(entryoffset));
    const textsize = dictionary.readUInt32LE(entryoffset + 8);
    const value = rawtext
      .slice(textoffset, textoffset + textsize)
      .toString()
      .replace(/\x0a/g, "\\n");
    if (entryindex % 2 == 0) {
      key = value;
    } else {
      result[key] = value;
    }
  }
  return result;
}
