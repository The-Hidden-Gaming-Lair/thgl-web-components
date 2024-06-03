import fs from "node:fs";
import path, { basename, dirname } from "node:path";
import { fileURLToPath } from "url";
import { CONTENT_DIR } from "./dirs.js";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

export function readContentJSON<T>(filePath: string): T {
  return readJSON<T>(CONTENT_DIR + filePath);
}
export function readJSON<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(path.resolve(__dirname, filePath), "utf8"));
}

export function readDirSync(filePath: string) {
  return fs.readdirSync(path.resolve(__dirname, filePath));
}

export function readDirRecursive(filePath: string, extension?: string) {
  const paths = fs.readdirSync(path.resolve(__dirname, filePath), {
    withFileTypes: true,
  });
  const files = paths
    .filter(
      (dirent) =>
        dirent.isFile() && (!extension || dirent.name.endsWith(extension))
    )
    .map((dirent) => path.join(filePath, dirent.name));
  const dirs = paths.filter((dirent) => dirent.isDirectory());
  dirs.forEach((dir) => {
    files.push(...readDirRecursive(filePath + "/" + dir.name, extension));
  });
  return files;
}

export function saveImage(filePath: string, data: Buffer) {
  fs.mkdirSync(getDirname(filePath), {
    recursive: true,
  });
  fs.writeFileSync(path.resolve(__dirname, filePath), data);
}

export function getDirname(filePath: string) {
  return dirname(path.resolve(__dirname, filePath));
}

export function getBasename(filePath: string) {
  return basename(path.resolve(__dirname, filePath));
}

export function writeFileSync(filePath: string, body: string) {
  fs.mkdirSync(getDirname(filePath), {
    recursive: true,
  });
  return fs.writeFileSync(path.resolve(__dirname, filePath), body);
}

export function writeJSON(filePath: string, body: any) {
  return writeFileSync(
    filePath,
    JSON.stringify(
      body,
      (_, v) => (typeof v === "bigint" ? v.toString() : v),
      2
    )
  );
}
