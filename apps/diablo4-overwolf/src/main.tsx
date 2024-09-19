import "./styles/globals.css";
import "@repo/ui/styles/globals.css";

import React from "react";
import { createRoot } from "react-dom/client";
import {
  getGameInfo,
  initDiscordRPC,
  listenToGameEvents,
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

listenToGameEvents();

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
