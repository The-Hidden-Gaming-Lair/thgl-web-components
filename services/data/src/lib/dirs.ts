import fs from "fs";

export const TEMP_DIR =
  "/home/devleon/the-hidden-gaming-lair/services/data/tmp";
export let CONTENT_DIR = TEMP_DIR;
export let TEXTURE_DIR = TEMP_DIR;
export let OUTPUT_DIR = TEMP_DIR;

export function initDirs(
  contentDir: string,
  textureDir: string,
  outputDir: string,
) {
  CONTENT_DIR = contentDir;
  TEXTURE_DIR = textureDir;
  OUTPUT_DIR = outputDir;

  fs.mkdirSync(`${OUTPUT_DIR}/coordinates/`, {
    recursive: true,
  });
  fs.mkdirSync(`${OUTPUT_DIR}/dicts/`, {
    recursive: true,
  });
  fs.mkdirSync(`${OUTPUT_DIR}/icons/`, {
    recursive: true,
  });
  fs.mkdirSync(`${OUTPUT_DIR}/map-tiles/`, {
    recursive: true,
  });
}
