export type ExportedMapData = {
  mapName: string;
  campDataArray: Array<{
    uId: string;
    name: string;
    faction: string;
    location: {
      x: number;
      y: number;
      z: number;
    };
  }>;
  landingZoneDataArray: Array<{
    uId: string;
    name: string;
    location: {
      x: number;
      y: number;
      z: number;
    };
  }>;
  lootBoxDataArray: Array<{
    uId: string;
    name: string;
    location: {
      x: number;
      y: number;
      z: number;
    };
  }>;
  lockedDoorDataArray: Array<{
    uId: string;
    name: string;
    key: string;
    location: {
      x: number;
      y: number;
      z: number;
    };
  }>;
  lootPointDataArray: Array<{
    uId: string;
    name: string;
    location: {
      x: number;
      y: number;
      z: number;
    };
  }>;
  interactivePropDataArray: Array<any>;
  explorableAreaDataArray: Array<{
    uId: string;
    name: string;
    location: {
      x: number;
      y: number;
      z: number;
    };
  }>;
  quests: Array<{
    questId: string;
    name: string;
    briefing: string;
    debriefing: string;
    demands: Array<any>;
    nextQuests: Array<{
      type: string;
      questNames: Array<string>;
    }>;
    objectives: Array<{
      lock: boolean;
      subobjectives: Array<any>;
      type: string;
      description: string;
      visibleInUI: boolean;
      timePeriod: string;
      tags: string;
      amount: number;
      targetPosition: {
        x: number;
        y: number;
        z: number;
      };
      range: number;
      targetActor: string;
      requiredItem: string;
      itemToReceive: string;
      item: string;
      pickupItem: string;
    }>;
  }>;
};
