export type DA_WorldMapGlobalConfig = Array<{
  Type: string;
  Name: string;
  Class: string;
  Properties: {
    WorldMaps: Array<{
      Key: string;
      Value: {
        Name: string;
        WorldMapDisplayType: string;
        Image: {
          AssetPathName: string;
          SubPathString: string;
        };
        BottomRightCorner: {
          X: number;
          Y: number;
          Z: number;
        };
        TopLeftCorner: {
          X: number;
          Y: number;
          Z: number;
        };
        bPlayerMustBeWithinBounds: boolean;
        NumberMarkersRequired: number;
        WorldMapType: string;
      };
    }>;
    PrivateSpaceMaps: Array<{
      Key: string;
      Value: {
        Name: string;
        WorldMapDisplayType: string;
        Image: {
          AssetPathName: string;
          SubPathString: string;
        };
        BottomRightCorner: {
          X: number;
          Y: number;
          Z: number;
        };
        TopLeftCorner: {
          X: number;
          Y: number;
          Z: number;
        };
        bPlayerMustBeWithinBounds: boolean;
        NumberMarkersRequired: number;
        WorldMapType: string;
      };
    }>;
  };
}>;

export type DT_LevelConfigs = Array<{
  Type: string;
  Name: string;
  Class: string;
  Properties: {
    RowStruct: {
      ObjectName: string;
      ObjectPath: string;
    };
  };
  Rows: {
    KilimaVillage: {
      Level: {
        AssetPathName: string;
        SubPathString: string;
      };
      VillagerSpawnConfigDataTable: {
        ObjectName: string;
        ObjectPath: string;
      };
      EventVillagerSpawnConfigs: Array<{
        Key: string;
        Value: {
          ObjectName: string;
          ObjectPath: string;
        };
      }>;
    };
    BahariBay: {
      Level: {
        AssetPathName: string;
        SubPathString: string;
      };
      VillagerSpawnConfigDataTable: {
        ObjectName: string;
        ObjectPath: string;
      };
      EventVillagerSpawnConfigs: Array<any>;
    };
    MajiMarket_EDITOR: {
      Level: {
        AssetPathName: string;
        SubPathString: string;
      };
      VillagerSpawnConfigDataTable: any;
      EventVillagerSpawnConfigs: Array<{
        Key: string;
        Value: {
          ObjectName: string;
          ObjectPath: string;
        };
      }>;
    };
    Gym_NPC_Behaviors: {
      Level: {
        AssetPathName: string;
        SubPathString: string;
      };
      VillagerSpawnConfigDataTable: {
        ObjectName: string;
        ObjectPath: string;
      };
      EventVillagerSpawnConfigs: Array<any>;
    };
    Gym_WorldPartitioning: {
      Level: {
        AssetPathName: string;
        SubPathString: string;
      };
      VillagerSpawnConfigDataTable: {
        ObjectName: string;
        ObjectPath: string;
      };
      EventVillagerSpawnConfigs: Array<any>;
    };
    Gym_PrivateSpaces: {
      Level: {
        AssetPathName: string;
        SubPathString: string;
      };
      VillagerSpawnConfigDataTable: any;
      EventVillagerSpawnConfigs: Array<any>;
    };
    Gym_Dialogue: {
      Level: {
        AssetPathName: string;
        SubPathString: string;
      };
      VillagerSpawnConfigDataTable: {
        ObjectName: string;
        ObjectPath: string;
      };
      EventVillagerSpawnConfigs: Array<any>;
    };
    Gym_VillagerSchedules: {
      Level: {
        AssetPathName: string;
        SubPathString: string;
      };
      VillagerSpawnConfigDataTable: {
        ObjectName: string;
        ObjectPath: string;
      };
      EventVillagerSpawnConfigs: Array<any>;
    };
    Fairgrounds: {
      Level: {
        AssetPathName: string;
        SubPathString: string;
      };
      VillagerSpawnConfigDataTable: any;
      EventVillagerSpawnConfigs: Array<{
        Key: string;
        Value: {
          ObjectName: string;
          ObjectPath: string;
        };
      }>;
    };
  };
}>;

export type MapData = Array<{
  Type: string;
  Name: string;
  Outer: string;
  Class: string;
  Properties?: Record<string, any>;
  Template?: Record<string, any>;
}>;

export type TeleportTravelConfigAsset = Array<{
  Type: string;
  Name: string;
  Class: string;
  Properties: {
    DestinationDisplayName: {
      Namespace: string;
      Key: string;
      SourceString: string;
      LocalizedString: string;
    };
    ExperiencePackage?: {
      AssetPathName: string;
      SubPathString: string;
    };
    PrivateSpaceConfig?: {
      AssetPathName: string;
      SubPathString: string;
    };
    PlayerTagRequirements?: Array<{
      TagToCheck: {
        TagName: string;
      };
      MinimumAcceptedValue: number;
      MaximumAcceptedValue: number;
      TagPrereq: {
        TagName: string;
      };
      TagPrereq_MinimumAcceptedValue: number;
      TagPrereq_MaximumAcceptedValue: number;
    }>;
    WrongTagsErrorMessage?: {
      Namespace: string;
      Key: string;
      SourceString: string;
      LocalizedString: string;
    };
  };
}>;
