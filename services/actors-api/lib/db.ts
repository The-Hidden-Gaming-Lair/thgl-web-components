import { Database } from "bun:sqlite";

export type Actor = {
  id: string;
  type: string;
  mapName: string;
  x: number;
  y: number;
  z: number;
};

export function openDB(name: string) {
  const db = new Database("db/" + name, { create: true });

  // Create the table if it doesn't exist
  db.query(
    "CREATE TABLE IF NOT EXISTS actors (id TEXT PRIMARY KEY, type TEXT, mapName TEXT, x REAL, y REAL, z REAL)",
  ).run();

  // Add an index on the mapName column
  db.query(
    "CREATE INDEX IF NOT EXISTS idx_actors_mapName ON actors(mapName)",
  ).run();

  // Add an index on the type column
  db.query("CREATE INDEX IF NOT EXISTS idx_actors_type ON actors(type)").run();

  return db;
}

export function serializeDB(db: Database) {
  return db.serialize();
}

export function selectActors(db: Database) {
  return db.query<Actor, any>("SELECT * FROM actors").all();
}

export function selectActorsByMap(db: Database, mapName: string) {
  return db
    .query<Actor, any>("SELECT * FROM actors WHERE mapName = $mapName")
    .all({
      $mapName: mapName,
    });
}

export function selectActorsByType(db: Database, type: string) {
  return db.query<Actor, any>("SELECT * FROM actors WHERE type = $type").all({
    $type: type,
  });
}

export function selectActorsByTypeAndMapname(
  db: Database,
  type: string,
  mapName: string,
) {
  return db
    .query<
      Actor,
      any
    >("SELECT * FROM actors WHERE type = $type AND mapName = $mapName")
    .all({
      $type: type,
      $mapName: mapName,
    });
}

export function selectActorsByMapName(db: Database, mapName: string) {
  return db
    .query<Actor, any>("SELECT * FROM actors WHERE mapName = $mapName")
    .all({
      $mapName: mapName,
    });
}

export function deleteActors(db: Database) {
  db.query<Actor, any>("DELETE FROM actors").run();
  return db.query("VACUUM").run();
}

export function insertActors(db: Database, actor: Actor[]) {
  const insertActor = db.prepare<Actor, any>(
    "INSERT OR IGNORE INTO actors (id, type, mapName, x, y, z) VALUES ($id, $type, $mapName, $x, $y, $z)",
  );
  const insertActors = db.transaction((actors) => {
    for (const actor of actors)
      insertActor.run({
        $id: actor.id,
        $type: actor.type,
        $mapName: actor.mapName,
        $x: actor.x,
        $y: actor.y,
        $z: actor.z,
      });
  });
  insertActors(actor);
}
