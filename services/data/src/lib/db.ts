import { CONTENT_DIR } from "./dirs.js";
import { readDirRecursive, readDirSync, writeJSON } from "./fs.js";
import { Database } from "bun:sqlite";
import { mock } from "bun:test";

export function sqliteToJSON(dbDir: string) {
  for (const path of readDirRecursive(CONTENT_DIR + dbDir)) {
    if (!path.endsWith(".db") && !path.endsWith(".sqlite")) {
      continue;
    }
    console.log("Converting", path);
    const db = new Database(path);
    // Get all table names
    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table'")
      .all();

    const result: any = {};

    for (const table of tables) {
      const tableName = (table as any).name;
      console.log(`Processing table ${tableName}`);
      const rows = db.prepare(`SELECT * FROM ${tableName}`).all();
      writeJSON(
        path.replace(".db", "").replace(".sqlite", "") +
          "_" +
          tableName +
          ".json",
        rows,
      );

      result[tableName] = rows;
    }
    // writeJSON(path.replace(".db", ".json").replace(".sqlite", ".json"), result);
  }
}

export function sqliteToJSONWithModels(dbDir: string, jsDir: string) {
  mock.module(CONTENT_DIR + jsDir + "/Core/Common/Log", () => {
    return {};
  });

  mock.module(CONTENT_DIR + jsDir + "/Core/Common/Stats", () => {
    return {};
  });

  for (const path of readDirRecursive(CONTENT_DIR + dbDir)) {
    // if (!path.endsWith("db_LevelPlayData.db")) {
    // if (!path.endsWith("db_map_mark.db")) {
    if (!path.endsWith(".db")) {
      continue;
    }
    console.log("Converting", path);
    const db = new Database(path);
    // Get all table names
    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table'")
      .all();

    const result: any = {};

    const { ByteBuffer } = require(
      CONTENT_DIR + jsDir + "/RunTimeLibs/FlatBuffers/byte-buffer.js",
    );

    const models = readDirSync(CONTENT_DIR + jsDir + "/Core/Define/Config");

    for (const table of tables) {
      const tableName = (table as any).name;
      console.log(`Processing table ${tableName}`);
      const rows = db.prepare(`SELECT * FROM ${tableName}`).all();

      const modelName = models.find(
        (m: string) => m.toLowerCase() === tableName.toLowerCase() + ".js",
      );
      if (!modelName) {
        console.warn(`Missing model: ${tableName}`);
        result[tableName] = rows.map(({ BinData, ...row }: any) => row);
        continue;
      }
      console.log(`Found model: ${modelName}`);

      const model = require(
        CONTENT_DIR + jsDir + `/Core/Define/Config/${modelName}`,
      );
      const exported = Object.values(model)[0] as any;

      result[tableName] = rows.map(({ BinData, ...row }: any) => {
        if (!BinData) {
          return row;
        }

        const arr = BinData as Uint8Array;
        const byteBuffer = new ByteBuffer(arr);
        const getRootKey = Object.getOwnPropertyNames(exported).find((key) =>
          key.startsWith("getRoot"),
        )!;
        // console.log(`Calling ${getRootKey} on ${tableName}`);
        const root = exported[getRootKey](byteBuffer);

        const getters = getGetters(root);
        const data = getters.reduce((acc: any, key: string) => {
          if (root[key] === null) {
            acc[key] = null;
          } else if (Array.isArray(root[key])) {
            acc[key] = [];
            for (const item of root[key]) {
              if (item.constructor.name === "IntVector") {
                const getters = getGetters(item);
                const data = getters.reduce((acc: any, key: string) => {
                  acc[key] = item[key];
                  return acc;
                }, {});
                acc[key].push(data);
              } else {
                acc[key].push(item);
              }
            }
          } else if (root[key].constructor.name === "String") {
            try {
              acc[key] = JSON.parse(root[key]);
            } catch (e) {
              acc[key] = root[key];
            }
          } else if (root[key].constructor.name === "IntVector") {
            const getters = getGetters(root[key]);
            const data = getters.reduce((a: any, k: string) => {
              a[k] = root[key][k];
              return a;
            }, {});
            acc[key] = data;
          } else {
            acc[key] = root[key];
          }
          return acc;
        }, {});

        return {
          ...row,
          data,
        };
      });
    }
    writeJSON(path.replace(".db", ".json"), result);
  }
}

function getGetters(obj: any) {
  let proto = Object.getPrototypeOf(obj);
  const getters: string[] = [];

  while (proto !== null) {
    Object.entries(Object.getOwnPropertyDescriptors(proto))
      .filter(
        ([key, descriptor]) =>
          typeof descriptor.get === "function" && key !== "__proto__",
      )
      .forEach(([key]) => getters.push(key));

    proto = Object.getPrototypeOf(proto);
  }

  return getters;
}
