import "./styles/globals.css";
import "@repo/ui/styles/globals.css";

import React from "react";
import { createRoot } from "react-dom/client";
import {
  type ActorPlayer,
  getGameInfo,
  initDiscordRPC,
  listenToGEP,
  logVersion,
} from "@repo/lib/overwolf";
import App from "./app";

logVersion();

const el = document.getElementById("root");
if (el) {
  const root = createRoot(el);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
} else {
  throw new Error("Could not find root element!!");
}

const SCALE = 0.083492;
const DEG_45 = Math.PI / 4; // 45 degrees in radians
const OFFSET = {
  x: 113.2,
  y: -227.4,
};
const normalizePoint = ({ x, y, z }: { x: number; y: number; z: number }) => {
  const scaledX = x * SCALE;
  const scaledY = y * SCALE;
  const rotatedX = scaledX * Math.cos(DEG_45) - scaledY * Math.sin(DEG_45);
  const rotatedY = scaledX * Math.sin(DEG_45) + scaledY * Math.cos(DEG_45);
  return {
    x: (-rotatedX + OFFSET.x) / 1.65,
    y: (-rotatedY + OFFSET.y) / 1.65,
    z,
  };
};

const prevPlayer: ActorPlayer = {
  address: 0,
  type: "",
  path: "",
  x: 0,
  y: 0,
  z: 0,
  r: 0,
};
let lastTerritory = 0;

listenToGEP(22700, ["match_info", "location", "me"], (gameInfo) => {
  if (!gameInfo?.match_info) {
    return null;
  }
  const player: ActorPlayer = {
    address: 0,
    type: "",
    path: "",
    x: 0,
    y: 0,
    z: 0,
    r: 0,
    mapName: "Sanctuary",
  };

  const position = normalizePoint(
    JSON.parse(gameInfo.match_info.location) as {
      y: number;
      x: number;
      z: number;
    },
  );
  player.x = position.y;
  player.y = position.x;
  player.z = position.z;

  let map = {
    area: 0,
    territory: 0,
  };
  try {
    map = JSON.parse(gameInfo.match_info.map) as {
      area: number;
      territory: number;
    };
  } catch (err) {
    //
  }
  if (
    prevPlayer.x !== player.x ||
    prevPlayer.y !== player.y ||
    lastTerritory !== map.territory
  ) {
    const rotation =
      (Math.atan2(
        player.y - (prevPlayer.y || player.y),
        player.x - (prevPlayer.x || player.x),
      ) *
        180) /
      Math.PI;
    player.r = rotation;
    prevPlayer.x = player.x;
    prevPlayer.y = player.y;
    const isWorldTerritory = map.territory !== -1;
    prevPlayer.mapName = isWorldTerritory ? "Sanctuary" : map.area.toString();
    lastTerritory = map.territory;
    return player;
  }
  return null;
});

await initDiscordRPC("1182968067802812456", async (updatePresence) => {
  try {
    const gameInfo = await getGameInfo();
    if (!gameInfo?.character) {
      return;
    }
    const player = {
      name: gameInfo.character.name,
      level: Number(gameInfo.character.level),
      xp: Number(gameInfo.character.xp),
      class: Number(gameInfo.character.class),
      health: Number(gameInfo.character.health),
    };

    updatePresence([
      `${player.name}`,
      `${characterTypeToString(player.class)} | Level ${player.level}`,
      "diablo4",
      "Diablo IV",
      "thgl",
      "Diablo IV Map – The Hidden Gaming Lair",
      true,
      0,
      "Get The App",
      "https://www.th.gl/apps/Diablo%204%20Map?ref=discordrpc",
      "",
      "",
    ]);
  } catch (err) {
    //
  }
});

enum CharacterType {
  Invalid = -1,
  BarbarianMale = 176832,
  BarbarianFemale = 232657,
  DruidMale = 338122,
  DruidFemale = 421560,
  NecromancerMale = 430081,
  NecromancerFemale = 502576,
  RogueMale = 486910,
  RogueFemale = 223602,
  SorcererMale = 220940,
  SorcererFemale = 72908,
}

function characterTypeToString(characterType: CharacterType) {
  switch (characterType) {
    case CharacterType.BarbarianMale:
      return "Barbarian Male";
    case CharacterType.BarbarianFemale:
      return "Barbarian Female";
    case CharacterType.DruidMale:
      return "Druid Male";
    case CharacterType.DruidFemale:
      return "Druid Female";
    case CharacterType.NecromancerMale:
      return "Necromancer Male";
    case CharacterType.NecromancerFemale:
      return "Necromancer Female";
    case CharacterType.RogueMale:
      return "Rogue Male";
    case CharacterType.RogueFemale:
      return "Rogue Female";
    case CharacterType.SorcererMale:
      return "Sorcerer Male";
    case CharacterType.SorcererFemale:
      return "Sorcerer Female";
    default:
      return "";
  }
}
