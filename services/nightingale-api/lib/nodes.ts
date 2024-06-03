import Ajv, { JSONSchemaType } from "ajv";

const ajv = new Ajv();

type Actor = {
  type: string;
  mapName: string;
  path: string;
  hidden?: boolean;
  x: number;
  y: number;
  z: number;
  r: number;
};

export const actorsSchema: JSONSchemaType<Actor[]> = {
  type: "array",
  items: {
    type: "object",
    properties: {
      type: { type: "string" },
      mapName: { type: "string" },
      path: { type: "string" },
      hidden: { type: "boolean", nullable: true },
      x: { type: "number" },
      y: { type: "number" },
      z: { type: "number" },
      r: { type: "number" },
    },
    required: ["type", "mapName", "path", "x", "y", "z", "r"],
    additionalProperties: true,
  },
};

export const validateActors = ajv.compile(actorsSchema);

export type Node = {
  type: string;
  mapName: string;
  path: string;
  x: number;
  y: number;
  z: number;
  timestamp: number;
};

export function toNode(actor: Actor): Node {
  return {
    type: actor.type,
    mapName: actor.mapName,
    path: actor.path,
    x: actor.x,
    y: actor.y,
    z: actor.z,
    timestamp: Date.now(),
  };
}

export function getMinDistance() {
  return 1000;
}

export function calculateDistance(
  node1: Node,
  coords: [number, number, number, string]
) {
  const dx = node1.x - coords[0];
  const dy = node1.y - coords[1];
  return Math.sqrt(dx * dx + dy * dy);
}

export const BLACKLISTED_TYPES = [
  "DefaultPhysicsVolume",
  "BP_PlayerController_C",
  "BP_PlayerCameraManager_C",
  "HUD_CommonNWX_C",
  "BP_GameState_C",
  "BP_Spectator_C",
  "WindDirectionalSource",
  "BP_PlayerInputHandler_C",
  "StreamingLevelProxyActor",
  "BP_StreamingLevelProxy_C",
  "BP_PlayerState_C",
  "BP_Structure_Constructed_C",
  "BP_Structure_DeathChest_C",
  "StaticMeshActor",
  "BP_POIConfig_C",
  "BP_StructureBuilder_C",
  "BP_Proof_Garden_TEST_02_C",
  "BP_StructurePartProxy_C",
  "BP_UI_ThirdPersonLights_C",
  "BP_Character_C",
  "BP_Weapon_Base_C",
  "BP_EquippableItemBase_C",
  "BP_Encounter_Gym_C",
  "BP_EncounterMusic_C",
  "BPP_SL_CH_0_NightmareRealm_C",
  "NWXPlayerStart",
  "PointLight",
  "NiagaraActor",
  "SpotLight",
  "EncounterConfig",
  "BP_AVFXPlacer_Cavern_Bat_Cannon_C",
  "BP_NightmareIntroAnimTrigger_C",
  "Actor",
  "BP_PortalArchVFX_C",
  "BP_AKEventTrigger_NightmareMeteor_C",
  "BP_DialogueEventTrigger_C",
  "BP_Creature_NPC_Puck_C",
  "BP_VST_ForestMid06_C",
  "BP_VST_Forest01_C",
  "CullDistanceVolume",
  "NavModifierVolume",
  "Audio_ML_FRT_NST_Cave_03_31m_C",
  "BP_AVFXPlacer_Cavern_Fog_C",
  "BP_AVFXPlacer_Cavern_FallingRocks_C",
  "BP_Cave_EmissiveLight_01_C",
  "InstancedFoliageActor",
  "BP_CaveCliffside_AVFXPlane_C",
  "BP_VST_ForestMid01_C",
  "BP_VST_ForestMid03_C",
  "BP_VST_ForestMid02_C",
  "BP_VST_ForestMid04_C",
  "BP_FRT_ScatterGrass01_C",
  "BP_VST_ForestMid05_C",
  "BP_VST_Forest02_C",
  "Audio_ML_FRT_NST_Cave_04_31m_C",
  "Audio_ML_FRT_NST_Cave_05_31m_C",
  "DecalActor",
  "BP_Waterfall_Volume_C",
  "Audio_ML_FRT_WTF_Waterfall08_10m_C",
  "BP_MapPinClientActor_C",
  "BP_AoePayload_Dispellable_Miasma_Spawn_Cloud_C",
  "BP_ResourceNode_IIM_C",
];
