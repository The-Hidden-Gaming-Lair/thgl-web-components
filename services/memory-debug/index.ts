import {
  createMemoryDump,
  parseMinidumpHeader,
  readMemory,
  searchInMemoryDump,
  searchPatternInMemoryDump,
} from "./lib/dumps";

const processName = "ONCE_HUMAN.exe";
// const memoryDumpPath = await createMemoryDump(processName);
const memoryDumpPath = `.\\dumps\\${processName}.dmp`;
// searchInMemoryDump(memoryDumpPath, "ag_l_01.gim");
const DUMP_MEMORY_OFFSET = "4D 5A 90";

// const dumpMemoryOffset = searchPatternInMemoryDump(
//   memoryDumpPath,
//   DUMP_MEMORY_OFFSET,
//   1,
// );
// const memoryOffset = dumpMemoryOffset[0];
// const processBaseAddress = 0x140000000;

// console.log("Base offset:", "0x" + memoryOffset.toString(16));

// const streamDataRVA = parseMinidumpHeader(memoryDumpPath);
// console.log("Stream data RVA:", "0x" + streamDataRVA?.toString(16));

const SCENE_BASE_PATTERN =
  "E8 ? ? ? ? 45 33 C0 48 8D 54 24 ? 48 8B C8 E8 ? ? ? ? 48";

// function adjustPointer(pointer: number): number {
//   return pointer - memoryOffset;
// }

const actorAddresses = searchInMemoryDump(
  memoryDumpPath,
  String.raw`environment\ecosystem\mineral\ag\ag_l_01.gim`,
);
actorAddresses.forEach((address, index) => {
  console.log("Found match at:", "0x" + address.toString(16));
  let sharedStrPtr = (address - 8).toString(16);
  if (sharedStrPtr.length % 2 !== 0) {
    sharedStrPtr = "0" + sharedStrPtr;
  }

  const sharedStrPtrPattern = sharedStrPtr.replace(/(.{2})/g, "$1 ").trim();
  console.log(sharedStrPtr, sharedStrPtrPattern);
  const dumpMemoryOffset = searchPatternInMemoryDump(
    memoryDumpPath,
    sharedStrPtrPattern,
  );
  console.log(dumpMemoryOffset);
});

// const playerAddresses = searchPatternInMemoryDump(
//   memoryDumpPath,
//   "57 8E 64 C3 7D 25 1D 43",
//   5,
// );
// playerAddresses.forEach((address, index) => {
//   console.log("Found match at:", "0x" + adjustPointer(address).toString(16));
// });

// const sceneBaseMatches = searchPatternInMemoryDump(
//   memoryDumpPath,
//   SCENE_BASE_PATTERN,
//   1,
// );
// for (const match of sceneBaseMatches) {
//   console.log("Found match at:", "0x" + match.toString(16));
//   const callFuncAddress = match + 1;
//   const callFunc =
//     readMemory(memoryDumpPath, callFuncAddress, 32).readUInt32LE(0) + match + 5;
//   console.log("callFunc:", "0x" + callFunc.toString(16));

//   const sceneOffset =
//     readMemory(memoryDumpPath, callFunc + 0x29 + 3, 4).readUInt32LE(0) +
//     callFunc +
//     0x29 +
//     3 +
//     4 -
//     0x0 +
//     0x10;
//   console.log("Scene offset:", "0x" + sceneOffset.toString(16));
//   const scene = readMemory(memoryDumpPath, sceneOffset, 8).readBigUInt64LE(0);
//   console.log("Scene:", "0x" + scene.toString(16));
//   const playerAddress = Number(scene) + 0x1848;
//   console.log("Player address:", "0x" + playerAddress.toString(16));
//   const playerPos = readMemory(memoryDumpPath, playerAddress, 12).readFloatLE(
//     0,
//   );
//   console.log("Player position:", "0x" + playerPos);
// }

console.log("Done");
