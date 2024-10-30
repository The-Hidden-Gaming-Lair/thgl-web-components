import { dlopen, FFIType, ptr, CString } from "bun:ffi";

// Load kernel32.dll with function definitions
const kernel32 = dlopen("kernel32.dll", {
  OpenProcess: {
    args: [FFIType.u32, FFIType.bool, FFIType.u32],
    returns: FFIType.ptr,
  },
  CloseHandle: {
    args: [FFIType.ptr],
    returns: FFIType.bool,
  },
  ReadProcessMemory: {
    args: [FFIType.ptr, FFIType.int64_t, FFIType.ptr, FFIType.u32, FFIType.ptr],
    returns: FFIType.bool,
  },
  CreateToolhelp32Snapshot: {
    args: [FFIType.u32, FFIType.u32],
    returns: FFIType.ptr,
  },
  Process32First: {
    args: [FFIType.ptr, FFIType.ptr],
    returns: FFIType.bool,
  },
  Process32Next: {
    args: [FFIType.ptr, FFIType.ptr],
    returns: FFIType.bool,
  },
  Module32First: {
    args: [FFIType.ptr, FFIType.ptr],
    returns: FFIType.bool,
  },
  Module32Next: {
    args: [FFIType.ptr, FFIType.ptr],
    returns: FFIType.bool,
  },
  VirtualQueryEx: {
    args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32],
    returns: FFIType.u32,
  },
});

// Constants for process access and snapshot creation
const PROCESS_QUERY_INFORMATION = 0x0400;
const PROCESS_VM_READ = 0x0010;
const TH32CS_SNAPPROCESS = 0x00000002;
const TH32CS_SNAPMODULE = 0x00000008;
const MEM_COMMIT = 0x1000;
const PAGE_READWRITE = 0x04;

// Define the structure size for PROCESSENTRY32 and MODULEENTRY32
const PROCESSENTRY32_SIZE = 568;
const PROCESSENTRY32 = Buffer.alloc(PROCESSENTRY32_SIZE);
PROCESSENTRY32.writeUInt32LE(PROCESSENTRY32_SIZE, 0);

const MODULEENTRY32_SIZE = 1080;
const MODULEENTRY32 = Buffer.alloc(MODULEENTRY32_SIZE);
MODULEENTRY32.writeUInt32LE(MODULEENTRY32_SIZE, 0);

const MEMORY_BASIC_INFORMATION_SIZE = 48;
const MEMORY_BASIC_INFORMATION = Buffer.alloc(MEMORY_BASIC_INFORMATION_SIZE);

function getProcessIdByName(processName: string): number | null {
  const snapshot = kernel32.symbols.CreateToolhelp32Snapshot(
    TH32CS_SNAPPROCESS,
    0,
  );
  if (snapshot === 0) throw new Error("Failed to create snapshot");

  let pid: number | null = null;
  if (
    kernel32.symbols.Process32First(
      snapshot,
      ptr(PROCESSENTRY32.buffer, PROCESSENTRY32.byteOffset),
    )
  ) {
    do {
      const exeNameBuffer = PROCESSENTRY32.subarray(44, 304);
      const exeName = new CString(
        ptr(exeNameBuffer.buffer, exeNameBuffer.byteOffset),
      ).toString();

      if (exeName === processName) {
        pid = PROCESSENTRY32.readUInt32LE(8);
        break;
      }
    } while (
      kernel32.symbols.Process32Next(
        snapshot,
        ptr(PROCESSENTRY32.buffer, PROCESSENTRY32.byteOffset),
      )
    );
  }
  kernel32.symbols.CloseHandle(snapshot);
  return pid;
}

function getModuleBaseAddress(pid: number): number | null {
  const snapshot = kernel32.symbols.CreateToolhelp32Snapshot(
    TH32CS_SNAPMODULE,
    pid,
  );
  if (snapshot === 0) throw new Error("Failed to create module snapshot");

  let baseAddress: number | null = null;
  if (
    kernel32.symbols.Module32First(
      snapshot,
      ptr(MODULEENTRY32.buffer, MODULEENTRY32.byteOffset),
    )
  ) {
    baseAddress = Number(MODULEENTRY32.readBigUInt64LE(24)); // Base address is at offset 24
  }
  console.log("Found base address:", baseAddress?.toString(16));
  kernel32.symbols.CloseHandle(snapshot);
  return baseAddress;
}

function readMemory(pid: number, address: number, size: number): Buffer {
  const processHandle = kernel32.symbols.OpenProcess(
    PROCESS_QUERY_INFORMATION | PROCESS_VM_READ,
    false,
    pid,
  );
  if (processHandle === 0) throw new Error("Failed to open process");

  const buffer = Buffer.alloc(size);
  const bytesRead = Buffer.alloc(4);

  const success = kernel32.symbols.ReadProcessMemory(
    processHandle,
    address,
    new Uint8Array(buffer.buffer),
    size,
    new Uint8Array(bytesRead.buffer),
  );

  kernel32.symbols.CloseHandle(processHandle);

  if (!success) throw new Error("Failed to read memory");
  return buffer;
}

function scanMemoryForString(pid: number, searchString: string): number[] {
  const processHandle = kernel32.symbols.OpenProcess(
    PROCESS_QUERY_INFORMATION | PROCESS_VM_READ,
    false,
    pid,
  );
  if (processHandle === 0) throw new Error("Failed to open process");

  const matches: number[] = [];
  const searchBuffer = new Uint8Array(Buffer.from(searchString, "utf8"));
  const overlapSize = searchBuffer.length - 1; // To ensure overlap for split strings

  const baseAddress = getModuleBaseAddress(pid);
  if (!baseAddress)
    throw new Error("Failed to get the base address of the main module");

  let address = baseAddress;
  let lastBuffer = new Uint8Array(Buffer.alloc(0)); // To store overlap from the last read

  while (true) {
    let combinedSize = 0;
    let contiguousRegions: number[] = [];

    // Identify contiguous, compatible regions
    while (true) {
      const result = kernel32.symbols.VirtualQueryEx(
        processHandle,
        address + combinedSize,
        ptr(
          MEMORY_BASIC_INFORMATION.buffer,
          MEMORY_BASIC_INFORMATION.byteOffset,
        ),
        MEMORY_BASIC_INFORMATION_SIZE,
      );
      if (result === 0) break;

      const regionSize = Number(MEMORY_BASIC_INFORMATION.readBigUInt64LE(16));
      if (regionSize === 0) break; // End of region
      contiguousRegions.push(address + combinedSize);
      combinedSize += regionSize;
      if (combinedSize >= 0x100000) break; // Limit to 1MB
    }
    console.log("Scanning combinedSize:", address.toString(16), combinedSize);

    if (combinedSize === 0) break; // No more regions to scan
    try {
      // Read a large chunk combining contiguous regions
      const buffer = new Uint8Array(readMemory(pid, address, combinedSize));
      const combinedBuffer = Buffer.concat([lastBuffer, buffer]);

      // Search for the string within the combined buffer
      let offset = combinedBuffer.indexOf(searchBuffer);
      while (offset !== -1) {
        const matchAddress = address + offset - lastBuffer.length;
        matches.push(matchAddress);
        console.log("Found match at:", matchAddress.toString(16));
        offset = combinedBuffer.indexOf(searchBuffer, offset + 1);
      }

      lastBuffer = new Uint8Array(buffer.slice(-overlapSize)); // Update overlap buffer
    } catch (error) {
      // Ignore read errors and continue to next region
    }

    address += combinedSize;
  }

  kernel32.symbols.CloseHandle(processHandle);
  return matches;
}

// Example usage
const processName = "ONCE_HUMAN.exe";
const searchString = "ag_l_01.gim"; // Replace with the string you want to search for

try {
  const pid = getProcessIdByName(processName);
  if (!pid) {
    console.log(`Process ${processName} not found.`);
  } else {
    console.log("Found process:", processName);
    const matches = scanMemoryForString(pid, searchString);
    if (matches.length > 0) {
      console.log(
        "Found matches at addresses:",
        matches.map((addr) => addr.toString(16)),
      );
    } else {
      console.log("No matches found.");
    }
  }
} catch (error) {
  console.error("Error:", (error as Error).message);
} finally {
  console.log("Done");
}
