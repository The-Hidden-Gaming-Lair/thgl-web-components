import { $ } from "bun";
import { closeSync, openSync, readSync, statSync } from "node:fs";
import * as minidump from "minidump";

export async function createMemoryDump(processName: string) {
  console.log("Creating memory dump for process:", processName);
  const dmpFileName = processName + ".dmp";
  const dmpFilePath = `.\\dumps\\${dmpFileName}`;
  try {
    await $`.\\bin\\procdump.exe -ma ${processName} ${dmpFilePath} -o`;
  } catch (e) {
    // procdump returns 254, even if it successfully creates the dump
    // return;
  }
  console.log("Memory dump created:", dmpFilePath);
  return dmpFilePath;
}

// Define constants
const CHUNK_SIZE = 4096; // Size of each read chunk (4KB is typical, but can be adjusted)

// Function to search for a pattern in a binary file
export function searchInMemoryDump(
  filePath: string,
  searchString: string,
): number[] {
  // Open the file as a binary stream
  const fileSize = statSync(filePath).size;
  const fileStream = openSync(filePath, "r");

  const searchBuffer = Buffer.from(searchString, "utf8");
  const searchLength = searchBuffer.length;

  let position = 0;
  const matches: number[] = [];
  let lastBuffer = Buffer.alloc(0); // To handle boundaries

  console.log(
    `Scanning memory dump (${fileSize} bytes) for pattern: "${searchString}"\n`,
  );

  while (position < fileSize) {
    // Calculate the amount to read (remaining bytes if near the end)
    const bytesToRead = Math.min(CHUNK_SIZE, fileSize - position);

    // Prepare buffer and read a chunk from the file
    const buffer = Buffer.alloc(bytesToRead);
    readSync(fileStream, buffer, 0, bytesToRead, position);

    // Combine with the last buffer for cross-boundary search
    const combinedBuffer = Buffer.concat([lastBuffer, buffer]);

    // Search the combined buffer
    let offset = combinedBuffer.indexOf(searchBuffer);
    while (offset !== -1) {
      const matchAddress = position + offset - lastBuffer.length;
      matches.push(matchAddress);
      offset = combinedBuffer.indexOf(searchBuffer, offset + 1);
    }

    // Update lastBuffer to the end of the current buffer for next iteration
    lastBuffer = buffer.slice(-searchLength + 1); // Keep enough overlap for boundary search

    // Move position forward
    position += bytesToRead;
  }

  closeSync(fileStream);

  return matches;
}

// Function to convert pattern string to byte array and mask array for wildcards
export function parsePattern(pattern: string): {
  bytes: number[];
  mask: boolean[];
} {
  const parts = pattern.split(" ");
  const bytes = [];
  const mask = [];

  for (const part of parts) {
    if (part === "?") {
      bytes.push(0); // Placeholder value for wildcard
      mask.push(false); // False indicates this byte can match any value
    } else {
      bytes.push(parseInt(part, 16));
      mask.push(true); // True indicates this byte must match exactly
    }
  }

  return { bytes, mask };
}

// Function to search for the parsed pattern in a memory dump
export function searchPatternInMemoryDump(
  filePath: string,
  pattern: string,
  maxResults = Number.MAX_SAFE_INTEGER,
): number[] {
  const { bytes: patternBytes, mask: patternMask } = parsePattern(pattern);
  const patternLength = patternBytes.length;

  const fileSize = statSync(filePath).size;
  const fileStream = openSync(filePath, "r");

  let position = 0;
  const matches: number[] = [];
  let lastBuffer = Buffer.alloc(0); // For handling boundaries

  console.log(
    `Scanning memory dump (${fileSize} bytes) for pattern: "${pattern}"\n`,
  );

  while (position < fileSize) {
    // Calculate bytes to read (remaining bytes if near the end)
    const bytesToRead = Math.min(CHUNK_SIZE, fileSize - position);

    // Prepare buffer and read a chunk from the file
    const buffer = Buffer.alloc(bytesToRead);
    readSync(fileStream, buffer, 0, bytesToRead, position);

    // Combine with the last buffer for cross-boundary search
    const combinedBuffer = Buffer.concat([lastBuffer, buffer]);

    // Scan the combined buffer for the pattern
    for (let i = 0; i <= combinedBuffer.length - patternLength; i++) {
      let match = true;
      for (let j = 0; j < patternLength; j++) {
        if (patternMask[j] && combinedBuffer[i + j] !== patternBytes[j]) {
          match = false;
          break;
        }
      }
      if (match) {
        const matchAddress = position + i - lastBuffer.length;
        matches.push(matchAddress);
        if (matches.length >= maxResults) {
          closeSync(fileStream);
          return matches;
        }
      }
    }

    // Update lastBuffer with the last `patternLength - 1` bytes for boundary overlap
    lastBuffer = buffer.slice(-patternLength + 1);

    // Move position forward
    position += bytesToRead;
  }

  closeSync(fileStream);
  return matches;
}

export function readMemory(filePath: string, address: number, size: number) {
  const fileStream = openSync(filePath, "r");
  const buffer = Buffer.alloc(size);
  readSync(fileStream, buffer, 0, size, address);
  closeSync(fileStream);
  return buffer;
}

// Read the minidump header and stream directory
export function parseMinidumpHeader(filePath: string): number | null {
  const file = openSync(filePath, "r");
  const headerBuffer = Buffer.alloc(32); // Header is 32 bytes
  readSync(file, headerBuffer, 0, 32, 0);

  // Verify the signature
  const signature = headerBuffer.readUInt32LE(0);
  if (signature !== 0x504d444d) {
    // "MDMP" in ASCII
    console.error("Invalid minidump file signature.");
    closeSync(file);
    return null;
  }

  // Read the number of streams and the directory RVA
  const streamCount = headerBuffer.readUInt32LE(8);
  const streamDirectoryRVA = headerBuffer.readUInt32LE(12);

  console.log(
    `Minidump Header: Stream Count = ${streamCount}, Stream Directory RVA = ${streamDirectoryRVA}`,
  );

  // Read the stream directory to locate the module list stream
  const streamDirectoryBuffer = Buffer.alloc(streamCount * 12); // Each directory entry is 12 bytes
  readSync(
    file,
    streamDirectoryBuffer,
    0,
    streamDirectoryBuffer.length,
    streamDirectoryRVA,
  );

  let moduleListRVA = null;
  let moduleListSize = 0;

  for (let i = 0; i < streamCount; i++) {
    const streamType = streamDirectoryBuffer.readUInt32LE(i * 12);
    const streamDataRVA = streamDirectoryBuffer.readUInt32LE(i * 12 + 4);
    const streamDataSize = streamDirectoryBuffer.readUInt32LE(i * 12 + 8);

    console.log(
      `Stream ${i}: Type = ${streamType}, Data RVA = ${streamDataRVA}, Size = ${streamDataSize}`,
    );

    // Stream type 4 (ModuleListStream) typically contains the module list
    if (streamType === 4) {
      moduleListRVA = streamDataRVA;
      moduleListSize = streamDataSize;
      break;
    }
  }

  if (moduleListRVA === null) {
    console.error("Module list stream not found.");
    closeSync(file);
    return null;
  }

  // Read the module list header directly
  const moduleListHeaderBuffer = Buffer.alloc(4); // Module count is 4 bytes at the start
  readSync(file, moduleListHeaderBuffer, 0, 4, moduleListRVA);
  const moduleCount = moduleListHeaderBuffer.readUInt32LE(0);
  console.log(`Module Count from ModuleListStream: ${moduleCount}`);

  // If moduleCount is 0, something might be wrong with the dump
  if (moduleCount === 0) {
    console.error("No modules found in the module list.");
    closeSync(file);
    return null;
  }

  // Now read the actual module entries
  const moduleListBuffer = Buffer.alloc(moduleListSize);
  readSync(file, moduleListBuffer, 0, moduleListSize, moduleListRVA);

  let mainModuleBaseAddress = null;

  for (let i = 0; i < moduleCount; i++) {
    const moduleOffset = 4 + i * 108; // Each module entry is 108 bytes

    // The base address is at offset 16 in each module entry
    const baseAddress = moduleListBuffer.readBigUInt64LE(moduleOffset + 16);

    // The module name RVA is at offset 36
    const moduleNameRVA = moduleListBuffer.readUInt32LE(moduleOffset + 36);

    console.log(
      `Module ${i}: Base Address = 0x${baseAddress.toString(16)}, Name RVA = ${moduleNameRVA.toString(16)}`,
    );

    // Assuming the first module in the list is the main module
    if (i === 0) {
      mainModuleBaseAddress = Number(baseAddress);
      break;
    }
  }

  closeSync(file);

  if (mainModuleBaseAddress !== null) {
    console.log(
      `Main module base address: 0x${mainModuleBaseAddress.toString(16)}`,
    );
    return mainModuleBaseAddress;
  } else {
    console.error("Main module base address not found.");
    return null;
  }
}
