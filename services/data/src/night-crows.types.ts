export type MSubZoneData = Array<{
  Type: string;
  Name: string;
  Class: string;
  Properties: {
    RowStruct: {
      ObjectName: string;
      ObjectPath: string;
    };
  };
  Rows: Record<
    string,
    {
      Title: {
        StringId: string;
      };
      Airship: {
        StringId: string;
      };
      Zone: {
        StringId: string;
      };
      Type: string;
      Priority: number;
      Icon: {
        AssetPathName: string;
        SubPathString: any;
      };
      Recommendation: {
        IsEnabled: boolean;
        Priority: number;
        RecommendedPcLevel: number;
        Accuracy: {
          Min: number;
          Max: number;
        };
        Armor: {
          Min: number;
          Max: number;
        };
      };
      FieldType: string;
      DeathPenalty: {
        IsDropEquipment: boolean;
      };
      CannotMoveAutomaticallty: boolean;
      Teleport: {
        CannotTeleportRandomly: boolean;
        CanSavePosition: boolean;
        CannotTeleportToSpecificSubzone: boolean;
        ReturnSubzone: {
          StringId: string;
        };
        Cost: {
          Currency: {
            StringId: string;
          };
          Count: number;
        };
      };
      UiOrder: number;
      RealmNumber: number;
      IconResource: {
        AssetPathName: string;
        SubPathString: any;
      };
      IconArea: string;
      ParentSubzone: {
        StringId: string;
      };
      Areas: Array<any>;
      AirshipArea: string;
      DestinationAreas: Array<any>;
      Permission: {
        StringId: string;
      };
      PcCollision: boolean;
      Bgms: {
        Bgm: {
          AssetPathName: string;
          SubPathString: any;
        };
        Ambient: {
          AssetPathName: string;
          SubPathString: any;
        };
      };
      ID: number;
    }
  >;
}>;

export type MZoneResourceExportData = Array<{
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
    "0": {
      ZoneResourceId: {
        StringId: string;
      };
      Areas: Array<{
        Key: string;
        Position: {
          X: number;
          Y: number;
          Z: number;
        };
        Yaw: number;
        UseZPos: boolean;
        Type: string;
        BoxCircleBound: {
          X: number;
          Y: number;
        };
      }>;
      ID: number;
    };
    "1": {
      ZoneResourceId: {
        StringId: string;
      };
      Areas: Array<{
        Key: string;
        Position: {
          X: number;
          Y: number;
          Z: number;
        };
        Yaw: number;
        UseZPos: boolean;
        Type: string;
        BoxCircleBound: {
          X: number;
          Y: number;
        };
      }>;
      ID: number;
    };
    "2": {
      ZoneResourceId: {
        StringId: string;
      };
      Areas: Array<{
        Key: string;
        Position: {
          X: number;
          Y: number;
          Z: number;
        };
        Yaw: number;
        UseZPos: boolean;
        Type: string;
        BoxCircleBound: {
          X: number;
          Y: number;
        };
      }>;
      ID: number;
    };
    "3": {
      ZoneResourceId: {
        StringId: string;
      };
      Areas: Array<{
        Key: string;
        Position: {
          X: number;
          Y: number;
          Z: number;
        };
        Yaw: number;
        UseZPos: boolean;
        Type: string;
        BoxCircleBound: {
          X: number;
          Y: number;
        };
      }>;
      ID: number;
    };
    "4": {
      ZoneResourceId: {
        StringId: string;
      };
      Areas: Array<{
        Key: string;
        Position: {
          X: number;
          Y: number;
          Z: number;
        };
        Yaw: number;
        UseZPos: boolean;
        Type: string;
        BoxCircleBound: {
          X: number;
          Y: number;
        };
      }>;
      ID: number;
    };
    "5": {
      ZoneResourceId: {
        StringId: string;
      };
      Areas: Array<{
        Key: string;
        Position: {
          X: number;
          Y: number;
          Z: number;
        };
        Yaw: number;
        UseZPos: boolean;
        Type: string;
        BoxCircleBound: {
          X: number;
          Y: number;
        };
      }>;
      ID: number;
    };
    "6": {
      ZoneResourceId: {
        StringId: string;
      };
      Areas: Array<{
        Key: string;
        Position: {
          X: number;
          Y: number;
          Z: number;
        };
        Yaw: number;
        UseZPos: boolean;
        Type: string;
        BoxCircleBound: {
          X: number;
          Y: number;
        };
      }>;
      ID: number;
    };
    "7": {
      ZoneResourceId: {
        StringId: string;
      };
      Areas: Array<{
        Key: string;
        Position: {
          X: number;
          Y: number;
          Z: number;
        };
        Yaw: number;
        UseZPos: boolean;
        Type: string;
        BoxCircleBound: {
          X: number;
          Y: number;
        };
      }>;
      ID: number;
    };
    "8": {
      ZoneResourceId: {
        StringId: string;
      };
      Areas: Array<{
        Key: string;
        Position: {
          X: number;
          Y: number;
          Z: number;
        };
        Yaw: number;
        UseZPos: boolean;
        Type: string;
        BoxCircleBound: {
          X: number;
          Y: number;
        };
      }>;
      ID: number;
    };
    "9": {
      ZoneResourceId: {
        StringId: string;
      };
      Areas: Array<{
        Key: string;
        Position: {
          X: number;
          Y: number;
          Z: number;
        };
        Yaw: number;
        UseZPos: boolean;
        Type: string;
        BoxCircleBound: {
          X: number;
          Y: number;
        };
      }>;
      ID: number;
    };
    "10": {
      ZoneResourceId: {
        StringId: string;
      };
      Areas: Array<{
        Key: string;
        Position: {
          X: number;
          Y: number;
          Z: number;
        };
        Yaw: number;
        UseZPos: boolean;
        Type: string;
        BoxCircleBound: {
          X: number;
          Y: number;
        };
      }>;
      ID: number;
    };
    "11": {
      ZoneResourceId: {
        StringId: string;
      };
      Areas: Array<{
        Key: string;
        Position: {
          X: number;
          Y: number;
          Z: number;
        };
        Yaw: number;
        UseZPos: boolean;
        Type: string;
        BoxCircleBound: {
          X: number;
          Y: number;
        };
      }>;
      ID: number;
    };
    "12": {
      ZoneResourceId: {
        StringId: string;
      };
      Areas: Array<{
        Key: string;
        Position: {
          X: number;
          Y: number;
          Z: number;
        };
        Yaw: number;
        UseZPos: boolean;
        Type: string;
        BoxCircleBound: {
          X: number;
          Y: number;
        };
      }>;
      ID: number;
    };
    "13": {
      ZoneResourceId: {
        StringId: string;
      };
      Areas: Array<{
        Key: string;
        Position: {
          X: number;
          Y: number;
          Z: number;
        };
        Yaw: number;
        UseZPos: boolean;
        Type: string;
        BoxCircleBound: {
          X: number;
          Y: number;
        };
      }>;
      ID: number;
    };
    "14": {
      ZoneResourceId: {
        StringId: string;
      };
      Areas: Array<{
        Key: string;
        Position: {
          X: number;
          Y: number;
          Z: number;
        };
        Yaw: number;
        UseZPos: boolean;
        Type: string;
        BoxCircleBound: {
          X: number;
          Y: number;
        };
      }>;
      ID: number;
    };
    "15": {
      ZoneResourceId: {
        StringId: string;
      };
      Areas: Array<{
        Key: string;
        Position: {
          X: number;
          Y: number;
          Z: number;
        };
        Yaw: number;
        UseZPos: boolean;
        Type: string;
        BoxCircleBound: {
          X: number;
          Y: number;
        };
      }>;
      ID: number;
    };
    "16": {
      ZoneResourceId: {
        StringId: string;
      };
      Areas: Array<{
        Key: string;
        Position: {
          X: number;
          Y: number;
          Z: number;
        };
        Yaw: number;
        UseZPos: boolean;
        Type: string;
        BoxCircleBound: {
          X: number;
          Y: number;
        };
      }>;
      ID: number;
    };
    "17": {
      ZoneResourceId: {
        StringId: string;
      };
      Areas: Array<{
        Key: string;
        Position: {
          X: number;
          Y: number;
          Z: number;
        };
        Yaw: number;
        UseZPos: boolean;
        Type: string;
        BoxCircleBound: {
          X: number;
          Y: number;
        };
      }>;
      ID: number;
    };
    "18": {
      ZoneResourceId: {
        StringId: string;
      };
      Areas: Array<{
        Key: string;
        Position: {
          X: number;
          Y: number;
          Z: number;
        };
        Yaw: number;
        UseZPos: boolean;
        Type: string;
        BoxCircleBound: {
          X: number;
          Y: number;
        };
      }>;
      ID: number;
    };
    "19": {
      ZoneResourceId: {
        StringId: string;
      };
      Areas: Array<{
        Key: string;
        Position: {
          X: number;
          Y: number;
          Z: number;
        };
        Yaw: number;
        UseZPos: boolean;
        Type: string;
        BoxCircleBound: {
          X: number;
          Y: number;
        };
      }>;
      ID: number;
    };
    "20": {
      ZoneResourceId: {
        StringId: string;
      };
      Areas: Array<{
        Key: string;
        Position: {
          X: number;
          Y: number;
          Z: number;
        };
        Yaw: number;
        UseZPos: boolean;
        Type: string;
        BoxCircleBound: {
          X: number;
          Y: number;
        };
      }>;
      ID: number;
    };
    "21": {
      ZoneResourceId: {
        StringId: string;
      };
      Areas: Array<{
        Key: string;
        Position: {
          X: number;
          Y: number;
          Z: number;
        };
        Yaw: number;
        UseZPos: boolean;
        Type: string;
        BoxCircleBound: {
          X: number;
          Y: number;
        };
      }>;
      ID: number;
    };
    "22": {
      ZoneResourceId: {
        StringId: string;
      };
      Areas: Array<{
        Key: string;
        Position: {
          X: number;
          Y: number;
          Z: number;
        };
        Yaw: number;
        UseZPos: boolean;
        Type: string;
        BoxCircleBound: {
          X: number;
          Y: number;
        };
      }>;
      ID: number;
    };
    "23": {
      ZoneResourceId: {
        StringId: string;
      };
      Areas: Array<{
        Key: string;
        Position: {
          X: number;
          Y: number;
          Z: number;
        };
        Yaw: number;
        UseZPos: boolean;
        Type: string;
        BoxCircleBound: {
          X: number;
          Y: number;
        };
      }>;
      ID: number;
    };
    "24": {
      ZoneResourceId: {
        StringId: string;
      };
      Areas: Array<{
        Key: string;
        Position: {
          X: number;
          Y: number;
          Z: number;
        };
        Yaw: number;
        UseZPos: boolean;
        Type: string;
        BoxCircleBound: {
          X: number;
          Y: number;
        };
      }>;
      ID: number;
    };
    "25": {
      ZoneResourceId: {
        StringId: string;
      };
      Areas: Array<{
        Key: string;
        Position: {
          X: number;
          Y: number;
          Z: number;
        };
        Yaw: number;
        UseZPos: boolean;
        Type: string;
        BoxCircleBound: {
          X: number;
          Y: number;
        };
      }>;
      ID: number;
    };
    "26": {
      ZoneResourceId: {
        StringId: string;
      };
      Areas: Array<{
        Key: string;
        Position: {
          X: number;
          Y: number;
          Z: number;
        };
        Yaw: number;
        UseZPos: boolean;
        Type: string;
        BoxCircleBound: {
          X: number;
          Y: number;
        };
      }>;
      ID: number;
    };
    "27": {
      ZoneResourceId: {
        StringId: string;
      };
      Areas: Array<{
        Key: string;
        Position: {
          X: number;
          Y: number;
          Z: number;
        };
        Yaw: number;
        UseZPos: boolean;
        Type: string;
        BoxCircleBound: {
          X: number;
          Y: number;
        };
      }>;
      ID: number;
    };
    "28": {
      ZoneResourceId: {
        StringId: string;
      };
      Areas: Array<{
        Key: string;
        Position: {
          X: number;
          Y: number;
          Z: number;
        };
        Yaw: number;
        UseZPos: boolean;
        Type: string;
        BoxCircleBound: {
          X: number;
          Y: number;
        };
      }>;
      ID: number;
    };
    "29": {
      ZoneResourceId: {
        StringId: string;
      };
      Areas: Array<{
        Key: string;
        Position: {
          X: number;
          Y: number;
          Z: number;
        };
        Yaw: number;
        UseZPos: boolean;
        Type: string;
        BoxCircleBound: {
          X: number;
          Y: number;
        };
      }>;
      ID: number;
    };
    "30": {
      ZoneResourceId: {
        StringId: string;
      };
      Areas: Array<{
        Key: string;
        Position: {
          X: number;
          Y: number;
          Z: number;
        };
        Yaw: number;
        UseZPos: boolean;
        Type: string;
        BoxCircleBound: {
          X: number;
          Y: number;
        };
      }>;
      ID: number;
    };
    "31": {
      ZoneResourceId: {
        StringId: string;
      };
      Areas: Array<{
        Key: string;
        Position: {
          X: number;
          Y: number;
          Z: number;
        };
        Yaw: number;
        UseZPos: boolean;
        Type: string;
        BoxCircleBound: {
          X: number;
          Y: number;
        };
      }>;
      ID: number;
    };
    "32": {
      ZoneResourceId: {
        StringId: string;
      };
      Areas: Array<{
        Key: string;
        Position: {
          X: number;
          Y: number;
          Z: number;
        };
        Yaw: number;
        UseZPos: boolean;
        Type: string;
        BoxCircleBound: {
          X: number;
          Y: number;
        };
      }>;
      ID: number;
    };
    "33": {
      ZoneResourceId: {
        StringId: string;
      };
      Areas: Array<{
        Key: string;
        Position: {
          X: number;
          Y: number;
          Z: number;
        };
        Yaw: number;
        UseZPos: boolean;
        Type: string;
        BoxCircleBound: {
          X: number;
          Y: number;
        };
      }>;
      ID: number;
    };
    "34": {
      ZoneResourceId: {
        StringId: string;
      };
      Areas: Array<{
        Key: string;
        Position: {
          X: number;
          Y: number;
          Z: number;
        };
        Yaw: number;
        UseZPos: boolean;
        Type: string;
        BoxCircleBound: {
          X: number;
          Y: number;
        };
      }>;
      ID: number;
    };
    "35": {
      ZoneResourceId: {
        StringId: string;
      };
      Areas: Array<{
        Key: string;
        Position: {
          X: number;
          Y: number;
          Z: number;
        };
        Yaw: number;
        UseZPos: boolean;
        Type: string;
        BoxCircleBound: {
          X: number;
          Y: number;
        };
      }>;
      ID: number;
    };
    "36": {
      ZoneResourceId: {
        StringId: string;
      };
      Areas: Array<{
        Key: string;
        Position: {
          X: number;
          Y: number;
          Z: number;
        };
        Yaw: number;
        UseZPos: boolean;
        Type: string;
        BoxCircleBound: {
          X: number;
          Y: number;
        };
      }>;
      ID: number;
    };
    "37": {
      ZoneResourceId: {
        StringId: string;
      };
      Areas: Array<{
        Key: string;
        Position: {
          X: number;
          Y: number;
          Z: number;
        };
        Yaw: number;
        UseZPos: boolean;
        Type: string;
        BoxCircleBound: {
          X: number;
          Y: number;
        };
      }>;
      ID: number;
    };
    "38": {
      ZoneResourceId: {
        StringId: string;
      };
      Areas: Array<{
        Key: string;
        Position: {
          X: number;
          Y: number;
          Z: number;
        };
        Yaw: number;
        UseZPos: boolean;
        Type: string;
        BoxCircleBound: {
          X: number;
          Y: number;
        };
      }>;
      ID: number;
    };
    "39": {
      ZoneResourceId: {
        StringId: string;
      };
      Areas: Array<{
        Key: string;
        Position: {
          X: number;
          Y: number;
          Z: number;
        };
        Yaw: number;
        UseZPos: boolean;
        Type: string;
        BoxCircleBound: {
          X: number;
          Y: number;
        };
      }>;
      ID: number;
    };
    "40": {
      ZoneResourceId: {
        StringId: string;
      };
      Areas: Array<any>;
      ID: number;
    };
    "41": {
      ZoneResourceId: {
        StringId: string;
      };
      Areas: Array<{
        Key: string;
        Position: {
          X: number;
          Y: number;
          Z: number;
        };
        Yaw: number;
        UseZPos: boolean;
        Type: string;
        BoxCircleBound: {
          X: number;
          Y: number;
        };
      }>;
      ID: number;
    };
    "42": {
      ZoneResourceId: {
        StringId: string;
      };
      Areas: Array<{
        Key: string;
        Position: {
          X: number;
          Y: number;
          Z: number;
        };
        Yaw: number;
        UseZPos: boolean;
        Type: string;
        BoxCircleBound: {
          X: number;
          Y: number;
        };
      }>;
      ID: number;
    };
    "43": {
      ZoneResourceId: {
        StringId: string;
      };
      Areas: Array<{
        Key: string;
        Position: {
          X: number;
          Y: number;
          Z: number;
        };
        Yaw: number;
        UseZPos: boolean;
        Type: string;
        BoxCircleBound: {
          X: number;
          Y: number;
        };
      }>;
      ID: number;
    };
    "44": {
      ZoneResourceId: {
        StringId: string;
      };
      Areas: Array<{
        Key: string;
        Position: {
          X: number;
          Y: number;
          Z: number;
        };
        Yaw: number;
        UseZPos: boolean;
        Type: string;
        BoxCircleBound: {
          X: number;
          Y: number;
        };
      }>;
      ID: number;
    };
    "45": {
      ZoneResourceId: {
        StringId: string;
      };
      Areas: Array<{
        Key: string;
        Position: {
          X: number;
          Y: number;
          Z: number;
        };
        Yaw: number;
        UseZPos: boolean;
        Type: string;
        BoxCircleBound: {
          X: number;
          Y: number;
        };
      }>;
      ID: number;
    };
    "46": {
      ZoneResourceId: {
        StringId: string;
      };
      Areas: Array<{
        Key: string;
        Position: {
          X: number;
          Y: number;
          Z: number;
        };
        Yaw: number;
        UseZPos: boolean;
        Type: string;
        BoxCircleBound: {
          X: number;
          Y: number;
        };
      }>;
      ID: number;
    };
    "47": {
      ZoneResourceId: {
        StringId: string;
      };
      Areas: Array<{
        Key: string;
        Position: {
          X: number;
          Y: number;
          Z: number;
        };
        Yaw: number;
        UseZPos: boolean;
        Type: string;
        BoxCircleBound: {
          X: number;
          Y: number;
        };
      }>;
      ID: number;
    };
    "48": {
      ZoneResourceId: {
        StringId: string;
      };
      Areas: Array<{
        Key: string;
        Position: {
          X: number;
          Y: number;
          Z: number;
        };
        Yaw: number;
        UseZPos: boolean;
        Type: string;
        BoxCircleBound: {
          X: number;
          Y: number;
        };
      }>;
      ID: number;
    };
    "49": {
      ZoneResourceId: {
        StringId: string;
      };
      Areas: Array<{
        Key: string;
        Position: {
          X: number;
          Y: number;
          Z: number;
        };
        Yaw: number;
        UseZPos: boolean;
        Type: string;
        BoxCircleBound: {
          X: number;
          Y: number;
        };
      }>;
      ID: number;
    };
    "50": {
      ZoneResourceId: {
        StringId: string;
      };
      Areas: Array<{
        Key: string;
        Position: {
          X: number;
          Y: number;
          Z: number;
        };
        Yaw: number;
        UseZPos: boolean;
        Type: string;
        BoxCircleBound: {
          X: number;
          Y: number;
        };
      }>;
      ID: number;
    };
    "51": {
      ZoneResourceId: {
        StringId: string;
      };
      Areas: Array<{
        Key: string;
        Position: {
          X: number;
          Y: number;
          Z: number;
        };
        Yaw: number;
        UseZPos: boolean;
        Type: string;
        BoxCircleBound: {
          X: number;
          Y: number;
        };
      }>;
      ID: number;
    };
    "52": {
      ZoneResourceId: {
        StringId: string;
      };
      Areas: Array<{
        Key: string;
        Position: {
          X: number;
          Y: number;
          Z: number;
        };
        Yaw: number;
        UseZPos: boolean;
        Type: string;
        BoxCircleBound: {
          X: number;
          Y: number;
        };
      }>;
      ID: number;
    };
    "53": {
      ZoneResourceId: {
        StringId: string;
      };
      Areas: Array<{
        Key: string;
        Position: {
          X: number;
          Y: number;
          Z: number;
        };
        Yaw: number;
        UseZPos: boolean;
        Type: string;
        BoxCircleBound: {
          X: number;
          Y: number;
        };
      }>;
      ID: number;
    };
    "54": {
      ZoneResourceId: {
        StringId: string;
      };
      Areas: Array<{
        Key: string;
        Position: {
          X: number;
          Y: number;
          Z: number;
        };
        Yaw: number;
        UseZPos: boolean;
        Type: string;
        BoxCircleBound: {
          X: number;
          Y: number;
        };
      }>;
      ID: number;
    };
  };
}>;

export type MStringData = Array<{
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
    [key: string]: {
      String: {
        Namespace: string;
        Key: string;
        SourceString: string;
        LocalizedString: string;
      };
      English: {
        Namespace: string;
        Key: string;
        SourceString: string;
        LocalizedString: string;
      };
      SimplifiedChinese: {
        Namespace: string;
        Key: string;
        SourceString: string;
        LocalizedString: string;
      };
      TraditionalChinese: {
        Namespace: string;
        Key: string;
        SourceString: string;
        LocalizedString: string;
      };
      Japanese: {
        Namespace: string;
        Key: string;
        SourceString: string;
        LocalizedString: string;
      };
      Thai: {
        Namespace: string;
        Key: string;
        SourceString: string;
        LocalizedString: string;
      };
      Spanish: {
        Namespace: string;
        Key: string;
        SourceString: string;
        LocalizedString: string;
      };
      Portuguese: {
        Namespace: string;
        Key: string;
        SourceString: string;
        LocalizedString: string;
      };
      Russian: {
        Namespace: string;
        Key: string;
        SourceString: string;
        LocalizedString: string;
      };
      ID: number;
    };
  };
}>;

export type UIDataAsset = Array<{
  Type: string;
  Name: string;
  Class: string;
  Properties: {
    CollapseSubzoneTitleInZonemapZones: Array<{
      StringId: string;
    }>;
    CdnDefaultTexture: {
      AssetPathName: string;
      SubPathString: string;
    };
    FadeOpacity: {
      ObjectName: string;
      ObjectPath: string;
    };
    ItemWidgdetBp: {
      ObjectName: string;
      ObjectPath: string;
    };
    CurrencyWidgdetBp: {
      ObjectName: string;
      ObjectPath: string;
    };
    CreatureWidgdetBp: {
      ObjectName: string;
      ObjectPath: string;
    };
    EtcAssetWidgdetBp: {
      ObjectName: string;
      ObjectPath: string;
    };
    ItemBigWidgdetBp: {
      ObjectName: string;
      ObjectPath: string;
    };
    CurrencyBigWidgdetBp: {
      ObjectName: string;
      ObjectPath: string;
    };
    CreatureBigWidgdetBp: {
      ObjectName: string;
      ObjectPath: string;
    };
    EtcAssetIconMap: Array<{
      Key: string;
      Value: {
        AssetPathName: string;
        SubPathString: string;
      };
    }>;
    PrimaryStatIconMap: Array<{
      Key: string;
      Value: {
        AssetPathName: string;
        SubPathString: string;
      };
    }>;
    RealmGroupFieldDisplayInfoMap: Array<{
      Key: string;
      Value: {
        Bg: {
          AssetPathName: string;
          SubPathString: string;
        };
      };
    }>;
    GradeDatas: Array<{
      Grade: string;
      Color: {
        R: number;
        G: number;
        B: number;
        A: number;
        Hex: string;
      };
      ColorDark: {
        R: number;
        G: number;
        B: number;
        A: number;
        Hex: string;
      };
    }>;
    CraftGradeMap: Array<{
      Key: string;
      Value: {
        SpecifiedColor: {
          R: number;
          G: number;
          B: number;
          A: number;
          Hex: string;
        };
        ColorUseRule: string;
      };
    }>;
    GradeProgressBarFillImages: Array<{
      Key: string;
      Value: {
        bIsDynamicallyLoaded: boolean;
        DrawAs: string;
        Tiling: string;
        Mirroring: string;
        ImageType: string;
        ImageSize: {
          X: number;
          Y: number;
        };
        Margin: {
          Left: number;
          Top: number;
          Right: number;
          Bottom: number;
        };
        TintColor: {
          SpecifiedColor: {
            R: number;
            G: number;
            B: number;
            A: number;
            Hex: string;
          };
          ColorUseRule: string;
        };
        OutlineSettings: {
          CornerRadii: {
            X: number;
            Y: number;
            Z: number;
            W: number;
          };
          Color: {
            SpecifiedColor: {
              R: number;
              G: number;
              B: number;
              A: number;
              Hex: string;
            };
            ColorUseRule: string;
          };
          Width: number;
          RoundingType: string;
          bUseBrushTransparency: boolean;
        };
        ResourceObject: {
          ObjectName: string;
          ObjectPath: string;
        };
        ResourceName: string;
        UVRegion: {
          Min: {
            X: number;
            Y: number;
          };
          Max: {
            X: number;
            Y: number;
          };
          bIsValid: number;
        };
      };
    }>;
    CoreElementDatas: Array<{
      Key: string;
      Value: {
        Icon: {
          AssetPathName: string;
          SubPathString: string;
        };
        PartsIcon: {
          AssetPathName: string;
          SubPathString: string;
        };
        Color: {
          R: number;
          G: number;
          B: number;
          A: number;
          Hex: string;
        };
        ProgressBarFillImage: {
          bIsDynamicallyLoaded: boolean;
          DrawAs: string;
          Tiling: string;
          Mirroring: string;
          ImageType: string;
          ImageSize: {
            X: number;
            Y: number;
          };
          Margin: {
            Left: number;
            Top: number;
            Right: number;
            Bottom: number;
          };
          TintColor: {
            SpecifiedColor: {
              R: number;
              G: number;
              B: number;
              A: number;
              Hex: string;
            };
            ColorUseRule: string;
          };
          OutlineSettings: {
            CornerRadii: {
              X: number;
              Y: number;
              Z: number;
              W: number;
            };
            Color: {
              SpecifiedColor: {
                R: number;
                G: number;
                B: number;
                A: number;
                Hex: string;
              };
              ColorUseRule: string;
            };
            Width: number;
            RoundingType: string;
            bUseBrushTransparency: boolean;
          };
          ResourceObject: {
            ObjectName: string;
            ObjectPath: string;
          };
          ResourceName: string;
          UVRegion: {
            Min: {
              X: number;
              Y: number;
            };
            Max: {
              X: number;
              Y: number;
            };
            bIsValid: number;
          };
        };
      };
    }>;
    ChatBalloonExpireSecond: number;
    MSpeechBalloonWidgetBp: {
      ObjectName: string;
      ObjectPath: string;
    };
    MTargetMarkWidgetBp: {
      ObjectName: string;
      ObjectPath: string;
    };
    SharedTargetMarkWidgetBp: {
      ObjectName: string;
      ObjectPath: string;
    };
    TargetNumberWidgetBp: {
      ObjectName: string;
      ObjectPath: string;
    };
    RankTierIconBp: {
      ObjectName: string;
      ObjectPath: string;
    };
    NamePlatePixelOffset: number;
    RelationColorMap: Array<{
      Key: string;
      Value: {
        R: number;
        G: number;
        B: number;
        A: number;
        Hex: string;
      };
    }>;
    SlayerIconTex: {
      AssetPathName: string;
      SubPathString: string;
    };
    AggressorIconTex: {
      AssetPathName: string;
      SubPathString: string;
    };
    LoadingWidgetBp: {
      ObjectName: string;
      ObjectPath: string;
    };
    MRootWidget: {
      ObjectName: string;
      ObjectPath: string;
    };
    LongPressFxWidgetBp: {
      ObjectName: string;
      ObjectPath: string;
    };
    TouchFxWidgetBp: {
      ObjectName: string;
      ObjectPath: string;
    };
    TouchFxMaxCount: number;
    MCalculatorWidgetBp: {
      AssetPathName: string;
      SubPathString: string;
    };
    NpcBrush: {
      ImageSize: {
        X: number;
        Y: number;
      };
      ResourceObject: {
        ObjectName: string;
        ObjectPath: string;
      };
    };
    PcBrush: {
      ResourceObject: {
        ObjectName: string;
        ObjectPath: string;
      };
    };
    PcBrushPriority: number;
    PartyBrush: {
      ImageSize: {
        X: number;
        Y: number;
      };
      ResourceObject: {
        ObjectName: string;
        ObjectPath: string;
      };
    };
    PartyBrushPriority: number;
    GuildBrush: {
      ImageSize: {
        X: number;
        Y: number;
      };
      ResourceObject: {
        ObjectName: string;
        ObjectPath: string;
      };
    };
    GuildBrushPriority: number;
    SlayerBrush: {
      ResourceObject: {
        ObjectName: string;
        ObjectPath: string;
      };
    };
    HostilePcBrush: {
      ImageSize: {
        X: number;
        Y: number;
      };
      ResourceObject: {
        ObjectName: string;
        ObjectPath: string;
      };
    };
    NeutralPcBrush: {
      ImageSize: {
        X: number;
        Y: number;
      };
      TintColor: {
        SpecifiedColor: {
          R: number;
          G: number;
          B: number;
          A: number;
          Hex: string;
        };
      };
      ResourceObject: {
        ObjectName: string;
        ObjectPath: string;
      };
    };
    BossMonsterBrush: {
      ResourceObject: {
        ObjectName: string;
        ObjectPath: string;
      };
    };
    BossMonsterBrushPriority: number;
    EliteMonsterBrush: {
      ImageSize: {
        X: number;
        Y: number;
      };
      ResourceObject: {
        ObjectName: string;
        ObjectPath: string;
      };
    };
    NamedMonsterBrush: {
      ImageSize: {
        X: number;
        Y: number;
      };
      ResourceObject: {
        ObjectName: string;
        ObjectPath: string;
      };
    };
    NpcRoleBrushPriority: number;
    PcCameraBrush: {
      ImageSize: {
        X: number;
        Y: number;
      };
      ResourceObject: {
        ObjectName: string;
        ObjectPath: string;
      };
    };
    DungeonPortalBrush: {
      ResourceObject: {
        ObjectName: string;
        ObjectPath: string;
      };
    };
    DungeonPortalBrushPriority: number;
    UpDraftBrush: {
      ResourceObject: {
        ObjectName: string;
        ObjectPath: string;
      };
    };
    DimmedColor: {
      DimmedBaseColor: {
        ChildDimmedColor: {
          R: number;
          G: number;
          B: number;
          A: number;
          Hex: string;
        };
        BgDimmedColor: {
          R: number;
          G: number;
          B: number;
          A: number;
          Hex: string;
        };
      };
      DimmedPresetColor: Array<{
        Key: string;
        Value: {
          ChildDimmedColor: {
            R: number;
            G: number;
            B: number;
            A: number;
            Hex: string;
          };
          BgDimmedColor: {
            R: number;
            G: number;
            B: number;
            A: number;
            Hex: string;
          };
        };
      }>;
    };
    RedDotBrush: {
      ResourceObject: {
        ObjectName: string;
        ObjectPath: string;
      };
    };
    SlideAnimCurve: {
      ObjectName: string;
      ObjectPath: string;
    };
    CurveDuration: number;
    Curve: {
      AssetPathName: string;
      SubPathString: string;
    };
    ContractInfoMap: Array<{
      Key: string;
      Value: {
        Scene: {
          StringId: string;
        };
        Title: {
          StringId: string;
        };
        FeatureActivation: {
          StringId: string;
        };
        RedDotId: {
          StringId: string;
        };
        Icon: {
          AssetPathName: string;
          SubPathString: string;
        };
      };
    }>;
    GuildStatDisplayInfoMap: Array<{
      Key: string;
      Value: {
        Title: string;
        Subtitle: string;
        Icon: {
          AssetPathName: string;
          SubPathString: string;
        };
      };
    }>;
    ChattingColorData: Array<{
      Key: string;
      Value: {
        SpecifiedColor: {
          R: number;
          G: number;
          B: number;
          A: number;
          Hex: string;
        };
        ColorUseRule: string;
      };
    }>;
    ChattingHeaderBGColorData: Array<{
      Key: string;
      Value: {
        R: number;
        G: number;
        B: number;
        A: number;
        Hex: string;
      };
    }>;
    TargetListBossNpcNameColor: {
      SpecifiedColor: {
        R: number;
        G: number;
        B: number;
        A: number;
        Hex: string;
      };
    };
    TargetListDefaultNpcNameColor: {
      SpecifiedColor: {
        R: number;
        G: number;
        B: number;
        A: number;
        Hex: string;
      };
    };
    LocationLinkColor: {
      SpecifiedColor: {
        R: number;
        G: number;
        B: number;
        A: number;
        Hex: string;
      };
    };
    ChattingTimestampStyle: {
      Font: {
        FontObject: {
          ObjectName: string;
          ObjectPath: string;
        };
        OutlineSettings: {
          OutlineSize: number;
          OutlineColor: {
            R: number;
            G: number;
            B: number;
            A: number;
            Hex: string;
          };
        };
        TypefaceFontName: string;
        Size: number;
      };
      ColorAndOpacity: {
        SpecifiedColor: {
          R: number;
          G: number;
          B: number;
          A: number;
          Hex: string;
        };
      };
    };
    TransparentButtonStyle: {
      Normal: {
        ImageSize: {
          X: number;
          Y: number;
        };
        ResourceObject: {
          ObjectName: string;
          ObjectPath: string;
        };
      };
      Hovered: {
        ImageSize: {
          X: number;
          Y: number;
        };
        ResourceObject: {
          ObjectName: string;
          ObjectPath: string;
        };
      };
      Pressed: {
        ImageSize: {
          X: number;
          Y: number;
        };
        ResourceObject: {
          ObjectName: string;
          ObjectPath: string;
        };
      };
      Disabled: {
        DrawAs: string;
        ImageSize: {
          X: number;
          Y: number;
        };
        ResourceObject: {
          ObjectName: string;
          ObjectPath: string;
        };
      };
    };
    NullItemIconBrush: {
      ImageSize: {
        X: number;
        Y: number;
      };
      ResourceObject: {
        ObjectName: string;
        ObjectPath: string;
      };
    };
    ZoneCongestionColorData: Array<{
      Key: string;
      Value: {
        R: number;
        G: number;
        B: number;
        A: number;
        Hex: string;
      };
    }>;
    ItemWidgetLockBp: {
      ObjectName: string;
      ObjectPath: string;
    };
    ItemWidgetEquipIconBp: {
      ObjectName: string;
      ObjectPath: string;
    };
    ItemWidgetDamagedBp: {
      ObjectName: string;
      ObjectPath: string;
    };
    ItemWidgetDropBp: {
      ObjectName: string;
      ObjectPath: string;
    };
    EquipmentDetailWidgetBp: {
      ObjectName: string;
      ObjectPath: string;
    };
    StatSummaryDatas: Array<string>;
    WeightPenaltyData: Array<{
      Key: string;
      Value: {
        bIsDynamicallyLoaded: boolean;
        DrawAs: string;
        Tiling: string;
        Mirroring: string;
        ImageType: string;
        ImageSize: {
          X: number;
          Y: number;
        };
        Margin: {
          Left: number;
          Top: number;
          Right: number;
          Bottom: number;
        };
        TintColor: {
          SpecifiedColor: {
            R: number;
            G: number;
            B: number;
            A: number;
            Hex: string;
          };
          ColorUseRule: string;
        };
        OutlineSettings: {
          CornerRadii: {
            X: number;
            Y: number;
            Z: number;
            W: number;
          };
          Color: {
            SpecifiedColor: {
              R: number;
              G: number;
              B: number;
              A: number;
              Hex: string;
            };
            ColorUseRule: string;
          };
          Width: number;
          RoundingType: string;
          bUseBrushTransparency: boolean;
        };
        ResourceObject: {
          ObjectName: string;
          ObjectPath: string;
        };
        ResourceName: string;
        UVRegion: {
          Min: {
            X: number;
            Y: number;
          };
          Max: {
            X: number;
            Y: number;
          };
          bIsValid: number;
        };
      };
    }>;
    QuestColorMap: Array<{
      Key: string;
      Value: {
        R: number;
        G: number;
        B: number;
        A: number;
        Hex: string;
      };
    }>;
    QuestSubTypeColorMap: Array<{
      Key: string;
      Value: {
        R: number;
        G: number;
        B: number;
        A: number;
        Hex: string;
      };
    }>;
    NightCrowQuestTextColor: {
      R: number;
      G: number;
      B: number;
      A: number;
      Hex: string;
    };
    GuildQuestScoreCurve: {
      ObjectName: string;
      ObjectPath: string;
    };
    CombatPowerCurve: {
      ObjectName: string;
      ObjectPath: string;
    };
    HPLackWidget: {
      ObjectName: string;
      ObjectPath: string;
    };
    UnderAttackAlertWidget: {
      ObjectName: string;
      ObjectPath: string;
    };
    TerritoryTypeIconMap: Array<{
      Key: string;
      Value: {
        AssetPathName: string;
        SubPathString: string;
      };
    }>;
    WeaponTypeDatas: Array<{
      WeaponType: string;
      Icon: {
        AssetPathName: string;
        SubPathString: string;
      };
    }>;
    RealmIconList: Array<{
      Key: string;
      Value: {
        IconId: string;
        IconBrush: {
          bIsDynamicallyLoaded: boolean;
          DrawAs: string;
          Tiling: string;
          Mirroring: string;
          ImageType: string;
          ImageSize: {
            X: number;
            Y: number;
          };
          Margin: {
            Left: number;
            Top: number;
            Right: number;
            Bottom: number;
          };
          TintColor: {
            SpecifiedColor: {
              R: number;
              G: number;
              B: number;
              A: number;
              Hex: string;
            };
            ColorUseRule: string;
          };
          OutlineSettings: {
            CornerRadii: {
              X: number;
              Y: number;
              Z: number;
              W: number;
            };
            Color: {
              SpecifiedColor: {
                R: number;
                G: number;
                B: number;
                A: number;
                Hex: string;
              };
              ColorUseRule: string;
            };
            Width: number;
            RoundingType: string;
            bUseBrushTransparency: boolean;
          };
          ResourceObject: {
            ObjectName: string;
            ObjectPath: string;
          };
          ResourceName: string;
          UVRegion: {
            Min: {
              X: number;
              Y: number;
            };
            Max: {
              X: number;
              Y: number;
            };
            bIsValid: number;
          };
        };
        OtherRealmGroupIconBrush: {
          bIsDynamicallyLoaded: boolean;
          DrawAs: string;
          Tiling: string;
          Mirroring: string;
          ImageType: string;
          ImageSize: {
            X: number;
            Y: number;
          };
          Margin: {
            Left: number;
            Top: number;
            Right: number;
            Bottom: number;
          };
          TintColor: {
            SpecifiedColor: {
              R: number;
              G: number;
              B: number;
              A: number;
              Hex: string;
            };
            ColorUseRule: string;
          };
          OutlineSettings: {
            CornerRadii: {
              X: number;
              Y: number;
              Z: number;
              W: number;
            };
            Color: {
              SpecifiedColor: {
                R: number;
                G: number;
                B: number;
                A: number;
                Hex: string;
              };
              ColorUseRule: string;
            };
            Width: number;
            RoundingType: string;
            bUseBrushTransparency: boolean;
          };
          ResourceObject: {
            ObjectName: string;
            ObjectPath: string;
          };
          ResourceName: string;
          UVRegion: {
            Min: {
              X: number;
              Y: number;
            };
            Max: {
              X: number;
              Y: number;
            };
            bIsValid: number;
          };
        };
      };
    }>;
    WorldFieldMatchedRealmIconList: Array<{
      bIsDynamicallyLoaded: boolean;
      DrawAs: string;
      Tiling: string;
      Mirroring: string;
      ImageType: string;
      ImageSize: {
        X: number;
        Y: number;
      };
      Margin: {
        Left: number;
        Top: number;
        Right: number;
        Bottom: number;
      };
      TintColor: {
        SpecifiedColor: {
          R: number;
          G: number;
          B: number;
          A: number;
          Hex: string;
        };
        ColorUseRule: string;
      };
      OutlineSettings: {
        CornerRadii: {
          X: number;
          Y: number;
          Z: number;
          W: number;
        };
        Color: {
          SpecifiedColor: {
            R: number;
            G: number;
            B: number;
            A: number;
            Hex: string;
          };
          ColorUseRule: string;
        };
        Width: number;
        RoundingType: string;
        bUseBrushTransparency: boolean;
      };
      ResourceObject: {
        ObjectName: string;
        ObjectPath: string;
      };
      ResourceName: string;
      UVRegion: {
        Min: {
          X: number;
          Y: number;
        };
        Max: {
          X: number;
          Y: number;
        };
        bIsValid: number;
      };
    }>;
    CurrencyTypes: Array<string>;
    AcquisitionNotiOffset: {
      X: number;
      Y: number;
    };
    SkipTranslateRegex: string;
  };
}>;

export type ZoneMapIconWidget = Array<{
  Type: string;
  Name: string;
  Outer?: string;
  Class: string;
  Properties: {
    Slots?: Array<{
      ObjectName: string;
      ObjectPath: string;
    }>;
    LayoutData?: {
      Offsets: {
        Right: number;
        Bottom: number;
      };
      Anchors: {
        Minimum: {
          X: number;
          Y: number;
        };
        Maximum: {
          X: number;
          Y: number;
        };
      };
      Alignment: {
        X: number;
        Y: number;
      };
    };
    Parent?: {
      ObjectName: string;
      ObjectPath: string;
    };
    Content?: {
      ObjectName: string;
      ObjectPath: string;
    };
    Brush?: {
      ImageSize: {
        X: number;
        Y: number;
      };
      ResourceObject: {
        ObjectName: string;
        ObjectPath: string;
      };
    };
    Slot?: {
      ObjectName: string;
      ObjectPath: string;
    };
    WidgetTree?: {
      ObjectName: string;
      ObjectPath: string;
    };
    bClassRequiresNativeTick?: boolean;
    RootWidget?: {
      ObjectName: string;
      ObjectPath: string;
    };
    bHasScriptImplementedTick?: boolean;
    bHasScriptImplementedPaint?: boolean;
  };
  SuperStruct?: {
    ObjectName: string;
    ObjectPath: string;
  };
  ChildProperties?: Array<{
    Type: string;
    Name: string;
    Flags: string;
    ElementSize: number;
    PropertyFlags: string;
    PropertyClass: {
      ObjectName: string;
      ObjectPath: string;
    };
  }>;
  ClassFlags?: string;
  ClassWithin?: {
    ObjectName: string;
    ObjectPath: string;
  };
  ClassConfigName?: string;
  bCooked?: boolean;
  ClassDefaultObject?: {
    ObjectName: string;
    ObjectPath: string;
  };
  EditorTags?: {
    BlueprintType: string;
  };
}>;

export type MZoneResourceData = Array<{
  Type: string;
  Name: string;
  Class: string;
  Properties: {
    RowStruct: {
      ObjectName: string;
      ObjectPath: string;
    };
  };
  Rows: Record<
    string,
    {
      Title: {
        StringId: string;
      };
      Persistent: {
        StringId: string;
      };
      AreaLevel: {
        AssetPathName: string;
        SubPathString: string;
      };
      ShowEnvironmentIcon: boolean;
      ID: number;
    }
  >;
}>;

export type MZonePersistentData = Array<{
  Type: string;
  Name: string;
  Class: string;
  Properties: {
    RowStruct: {
      ObjectName: string;
      ObjectPath: string;
    };
  };
  Rows: Record<
    string,
    {
      Disable: boolean;
      Level: {
        AssetPathName: string;
        SubPathString: string;
      };
      MiniatureLevel: {
        StringId: string;
      };
      MinimapData: {
        ObjectName: string;
        ObjectPath: string;
      };
      IsOutDoor: boolean;
      ID: number;
    }
  >;
}>;

export type MinimapDataAsset = Array<{
  Type: string;
  Name: string;
  Class: string;
  Properties: {
    RelativePositionFromOrigin?: {
      X: number;
      Y: number;
    };
    PixelPerCentimeter: number;
    MinimapTexture: {
      AssetPathName: string;
      SubPathString: string;
    };
  };
}>;

export type MZoneExportData = Array<{
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
    [key: string]: {
      PcStartPoints: Array<{
        ID: number;
        Name: string;
        Position: {
          X: number;
          Y: number;
          Z: number;
        };
        Radius: number;
        Yaw: number;
      }>;
      PcRestartPoints: Array<{
        ID: number;
        Name: string;
        Position: {
          X: number;
          Y: number;
          Z: number;
        };
        Radius: number;
        Yaw: number;
      }>;
      NpcSpawnSpots: Array<{
        ID: number;
        Name: string;
        Yaw: number;
        SpotCommon: {
          Spawnable: boolean;
          Position: {
            X: number;
            Y: number;
            Z: number;
          };
        };
        NpcSpawnCommon: {
          NpcId: number;
          NpcSpawnId: number;
          NpcSpawnNum: number;
        };
        NpcPersonalization: number;
        NpcIdleMotion: number;
      }>;
      NpcSpawnSpotGroups: Array<any>;
      NpcRandomSpawnSpotGroup: Array<any>;
      NpcRandomSpawnAreas: Array<{
        ID: number;
        Name: string;
        SpotCommon: {
          Spawnable: boolean;
          Position: {
            X: number;
            Y: number;
            Z: number;
          };
        };
        NpcSpawn: Array<{
          NpcSpawnCommon: {
            NpcId: number;
            NpcSpawnId: number;
            NpcSpawnNum: number;
          };
        }>;
        SpawnRadius: number;
      }>;
      InteractiveObjectSpawnSpots: Array<{
        ID: number;
        Name: string;
        Yaw: number;
        SpotCommon: {
          Spawnable: boolean;
          Position: {
            X: number;
            Y: number;
            Z: number;
          };
        };
        SpawnGdId: number;
      }>;
      NavVolume: {
        Min: {
          X: number;
          Y: number;
        };
        Max: {
          X: number;
          Y: number;
        };
      };
      UpDrafts: Array<any>;
      ID: number;
    };
  };
}>;

export type MNpcData = Array<{
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
    [key: string]: {
      Bp: {
        AssetPathName: string;
        SubPathString: string;
      };
      WalkSpeed: number;
      Title: {
        StringId: string;
      };
      Subtitle: {
        StringId: string;
      };
      Level: number;
      ShowTargetInfo: boolean;
      TargetInfoHpBarLineCount: number;
      ShowBattleCoinReward: boolean;
      ShowWorldFieldCoinReward: boolean;
      DropGroup: {
        StringId: string;
      };
      NpcRole: {
        StringId: string;
      };
      Type: string;
      Subzone: {
        StringId: string;
      };
      MultiSubzoneList: Array<any>;
      IsAggressive: boolean;
      IsDevil: boolean;
      Faction: {
        StringId: string;
      };
      UiOrder: number;
      LookAtRotationType: string;
      HitRadius: number;
      SpeechBalloon: {
        Social: {
          StringId: string;
        };
        Combat: {
          StringId: string;
        };
      };
      AlwaysShowNameplate: boolean;
      ShowNameplateHpBar: boolean;
      IsSecretHp: boolean;
      DialogStep: {
        StringId: string;
      };
      Immune: {
        StringId: string;
      };
      IgnoreHitReactionRate: number;
      IgnoreHitReactionRateForSkill: number;
      DeadToast: {
        StringId: string;
      };
      ID: number;
    };
  };
}>;

export type MNpcRoleData = Array<{
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
    [key: string]: {
      Title: {
        StringId: string;
      };
      Icon: {
        AssetPathName: string;
        SubPathString: string;
      };
      MinimapIcon: {
        ObjectName: string;
        ObjectPath: string;
      };
      Type: string;
      AssetGoodsCatalog: {
        StringId: string;
      };
      GameplayCommand: {
        StringId: string;
      };
      FilterGroup: {
        StringId: string;
      };
      OrderInNpcList: number;
      ShouldRotateWhenRole: boolean;
      ID: number;
    };
  };
}>;

export type MPrivateMissionData = Array<{
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
    [key: string]: {
      Title: {
        StringId: string;
      };
      Type: string;
      TargetCount: number;
      UseShortenTargetCountOnHud: boolean;
      ZoneType: string;
      Zone: {
        StringId: string;
      };
      DestinationArea: string;
      ZoneContributionGrade: {
        StringId: string;
      };
      NpcType: string;
      ItemType: string;
      ItemGrade: string;
      BaseItemName: {
        StringId: string;
      };
      EnhancementLevel: number;
      QuestType: string;
      Quest: {
        StringId: string;
      };
      PcClassTier: string;
      WeaponType: string;
      CraftSkill: {
        StringId: string;
      };
      CraftGrade: string;
      CreatureType: string;
      CreatureGrade: string;
      ID: number;
    };
  };
}>;

export type MAchievementData = Array<{
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
    [key: string]: {
      Title: {
        StringId: string;
      };
      Category: {
        StringId: string;
      };
      UiOrder: number;
      MissionGroup: {
        StringId: string;
      };
      InitializePeriodType: string;
      Repeatable: boolean;
      ID: number;
    };
  };
}>;

export type MMaterialItemData = Array<{
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
    [key: string]: {
      Base: {
        StringId: string;
      };
      Title: {
        StringId: string;
      };
      Description: {
        StringId: string;
      };
      MaterialItemType: string;
      CommonTrait: {
        Grade: string;
        SellPrice: number;
        Weight: number;
        CanDelete: boolean;
        StoringType: string;
        TradingSubCategory: {
          StringId: string;
        };
        AcquisitionAlarm: boolean;
      };
      Icon: {
        AssetPathName: string;
        SubPathString: string;
      };
      DecompositionGroup: {
        StringId: string;
      };
      PcClassGroup: {
        StringId: string;
      };
      DisplayingStatEffect: {
        StringId: string;
      };
      ItemExpiration: {
        StringId: string;
      };
      CollectionOnly: boolean;
      ID: number;
    };
  };
}>;

export type MEquipmentItemData = Array<{
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
    [key: string]: {
      Base: {
        StringId: string;
      };
      Title: {
        StringId: string;
      };
      Description: {
        StringId: string;
      };
      EquipmentType: string;
      WeaponType: string;
      AttackRange: number;
      PcClassGroup: {
        StringId: string;
      };
      CommonTrait: {
        Grade: string;
        SellPrice: number;
        Weight: number;
        CanDelete: boolean;
        StoringType: string;
        TradingSubCategory: {
          StringId: string;
        };
        AcquisitionAlarm: boolean;
      };
      CanBreak: boolean;
      Enhancement: {
        StringId: string;
      };
      EnhancementProbability: {
        StringId: string;
      };
      DeathPenalty: {
        Type: string;
        RepairGoldCost: number;
      };
      OptionalStatSlotSet: {
        StringId: string;
      };
      PcClassExchangeGroup: {
        Group: string;
        Cost: number;
      };
      Icon: {
        AssetPathName: string;
        SubPathString: string;
      };
      DecompositionGroup: {
        StringId: string;
      };
      ItemExpiration: {
        StringId: string;
      };
      ID: number;
    };
  };
}>;

export type MBoxItemData = Array<{
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
    [key: string]: {
      Title: {
        StringId: string;
      };
      Description: {
        StringId: string;
      };
      RewardGroup: {
        Type: string;
        Name: {
          StringId: string;
        };
      };
      CommonTrait: {
        Grade: string;
        SellPrice: number;
        Weight: number;
        CanDelete: boolean;
        StoringType: string;
        TradingSubCategory: {
          StringId: string;
        };
        AcquisitionAlarm: boolean;
      };
      Icon: {
        AssetPathName: string;
        SubPathString: string;
      };
      ItemExpiration: {
        StringId: string;
      };
      UseRoulette: boolean;
      UseRoulette11: boolean;
      ID: number;
    };
  };
}>;

export type MNpcSpawnData = Array<{
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
    F01_All_W_NormalMonster: {
      WaitingTime: number;
      RoamRadius: number;
      DesignatedTimeList: Array<any>;
      InitialSpawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
      };
      Spawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
        Type: string;
        RandomTypeRate: number;
      };
      ID: number;
    };
    F02_All_W_NormalMonster: {
      WaitingTime: number;
      RoamRadius: number;
      DesignatedTimeList: Array<any>;
      InitialSpawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
      };
      Spawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
        Type: string;
        RandomTypeRate: number;
      };
      ID: number;
    };
    F03_All_W_NormalMonster: {
      WaitingTime: number;
      RoamRadius: number;
      DesignatedTimeList: Array<any>;
      InitialSpawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
      };
      Spawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
        Type: string;
        RandomTypeRate: number;
      };
      ID: number;
    };
    FD02_Stg01_NormalMonster: {
      WaitingTime: number;
      RoamRadius: number;
      DesignatedTimeList: Array<any>;
      InitialSpawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
      };
      Spawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
        Type: string;
        RandomTypeRate: number;
      };
      ID: number;
    };
    FD02_Stg02_NormalMonster: {
      WaitingTime: number;
      RoamRadius: number;
      DesignatedTimeList: Array<any>;
      InitialSpawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
      };
      Spawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
        Type: string;
        RandomTypeRate: number;
      };
      ID: number;
    };
    FD02_Stg03_NormalMonster: {
      WaitingTime: number;
      RoamRadius: number;
      DesignatedTimeList: Array<any>;
      InitialSpawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
      };
      Spawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
        Type: string;
        RandomTypeRate: number;
      };
      ID: number;
    };
    FD02_Stg04_NormalMonster: {
      WaitingTime: number;
      RoamRadius: number;
      DesignatedTimeList: Array<any>;
      InitialSpawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
      };
      Spawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
        Type: string;
        RandomTypeRate: number;
      };
      ID: number;
    };
    FD02_Stg05_NormalMonster: {
      WaitingTime: number;
      RoamRadius: number;
      DesignatedTimeList: Array<any>;
      InitialSpawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
      };
      Spawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
        Type: string;
        RandomTypeRate: number;
      };
      ID: number;
    };
    FD02_Stg06_NormalMonster: {
      WaitingTime: number;
      RoamRadius: number;
      DesignatedTimeList: Array<any>;
      InitialSpawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
      };
      Spawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
        Type: string;
        RandomTypeRate: number;
      };
      ID: number;
    };
    FD02_Stg07_NormalMonster: {
      WaitingTime: number;
      RoamRadius: number;
      DesignatedTimeList: Array<any>;
      InitialSpawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
      };
      Spawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
        Type: string;
        RandomTypeRate: number;
      };
      ID: number;
    };
    FD02_Stg08_NormalMonster: {
      WaitingTime: number;
      RoamRadius: number;
      DesignatedTimeList: Array<any>;
      InitialSpawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
      };
      Spawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
        Type: string;
        RandomTypeRate: number;
      };
      ID: number;
    };
    FD02_Stg09_NormalMonster: {
      WaitingTime: number;
      RoamRadius: number;
      DesignatedTimeList: Array<any>;
      InitialSpawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
      };
      Spawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
        Type: string;
        RandomTypeRate: number;
      };
      ID: number;
    };
    FD02_Stg10_NormalMonster: {
      WaitingTime: number;
      RoamRadius: number;
      DesignatedTimeList: Array<any>;
      InitialSpawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
      };
      Spawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
        Type: string;
        RandomTypeRate: number;
      };
      ID: number;
    };
    FD03_Stg01_NormalMonster: {
      WaitingTime: number;
      RoamRadius: number;
      DesignatedTimeList: Array<any>;
      InitialSpawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
      };
      Spawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
        Type: string;
        RandomTypeRate: number;
      };
      ID: number;
    };
    FD03_Stg02_NormalMonster: {
      WaitingTime: number;
      RoamRadius: number;
      DesignatedTimeList: Array<any>;
      InitialSpawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
      };
      Spawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
        Type: string;
        RandomTypeRate: number;
      };
      ID: number;
    };
    FD03_Stg03_NormalMonster: {
      WaitingTime: number;
      RoamRadius: number;
      DesignatedTimeList: Array<any>;
      InitialSpawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
      };
      Spawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
        Type: string;
        RandomTypeRate: number;
      };
      ID: number;
    };
    FD03_Stg04_NormalMonster: {
      WaitingTime: number;
      RoamRadius: number;
      DesignatedTimeList: Array<any>;
      InitialSpawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
      };
      Spawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
        Type: string;
        RandomTypeRate: number;
      };
      ID: number;
    };
    FD03_Stg05_NormalMonster: {
      WaitingTime: number;
      RoamRadius: number;
      DesignatedTimeList: Array<any>;
      InitialSpawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
      };
      Spawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
        Type: string;
        RandomTypeRate: number;
      };
      ID: number;
    };
    FD03_Stg06_NormalMonster: {
      WaitingTime: number;
      RoamRadius: number;
      DesignatedTimeList: Array<any>;
      InitialSpawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
      };
      Spawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
        Type: string;
        RandomTypeRate: number;
      };
      ID: number;
    };
    FD03_Stg07_NormalMonster: {
      WaitingTime: number;
      RoamRadius: number;
      DesignatedTimeList: Array<any>;
      InitialSpawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
      };
      Spawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
        Type: string;
        RandomTypeRate: number;
      };
      ID: number;
    };
    FD03_Stg08_NormalMonster: {
      WaitingTime: number;
      RoamRadius: number;
      DesignatedTimeList: Array<any>;
      InitialSpawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
      };
      Spawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
        Type: string;
        RandomTypeRate: number;
      };
      ID: number;
    };
    FD03_Stg09_NormalMonster: {
      WaitingTime: number;
      RoamRadius: number;
      DesignatedTimeList: Array<any>;
      InitialSpawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
      };
      Spawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
        Type: string;
        RandomTypeRate: number;
      };
      ID: number;
    };
    FD03_Stg10_NormalMonster: {
      WaitingTime: number;
      RoamRadius: number;
      DesignatedTimeList: Array<any>;
      InitialSpawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
      };
      Spawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
        Type: string;
        RandomTypeRate: number;
      };
      ID: number;
    };
    DD01_Stg01_NormalMonster: {
      WaitingTime: number;
      RoamRadius: number;
      DesignatedTimeList: Array<any>;
      InitialSpawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
      };
      Spawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
        Type: string;
        RandomTypeRate: number;
      };
      ID: number;
    };
    DD01_Stg02_NormalMonster: {
      WaitingTime: number;
      RoamRadius: number;
      DesignatedTimeList: Array<any>;
      InitialSpawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
      };
      Spawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
        Type: string;
        RandomTypeRate: number;
      };
      ID: number;
    };
    DD01_Stg03_NormalMonster: {
      WaitingTime: number;
      RoamRadius: number;
      DesignatedTimeList: Array<any>;
      InitialSpawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
      };
      Spawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
        Type: string;
        RandomTypeRate: number;
      };
      ID: number;
    };
    DD01_Stg04_NormalMonster: {
      WaitingTime: number;
      RoamRadius: number;
      DesignatedTimeList: Array<any>;
      InitialSpawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
      };
      Spawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
        Type: string;
        RandomTypeRate: number;
      };
      ID: number;
    };
    DD01_Stg05_NormalMonster: {
      WaitingTime: number;
      RoamRadius: number;
      DesignatedTimeList: Array<any>;
      InitialSpawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
      };
      Spawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
        Type: string;
        RandomTypeRate: number;
      };
      ID: number;
    };
    DD01_Stg06_NormalMonster: {
      WaitingTime: number;
      RoamRadius: number;
      DesignatedTimeList: Array<any>;
      InitialSpawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
      };
      Spawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
        Type: string;
        RandomTypeRate: number;
      };
      ID: number;
    };
    DD02_Stg01_NormalMonster: {
      WaitingTime: number;
      RoamRadius: number;
      DesignatedTimeList: Array<any>;
      InitialSpawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
      };
      Spawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
        Type: string;
        RandomTypeRate: number;
      };
      ID: number;
    };
    DD02_Stg02_NormalMonster: {
      WaitingTime: number;
      RoamRadius: number;
      DesignatedTimeList: Array<any>;
      InitialSpawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
      };
      Spawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
        Type: string;
        RandomTypeRate: number;
      };
      ID: number;
    };
    DD02_Stg03_NormalMonster: {
      WaitingTime: number;
      RoamRadius: number;
      DesignatedTimeList: Array<any>;
      InitialSpawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
      };
      Spawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
        Type: string;
        RandomTypeRate: number;
      };
      ID: number;
    };
    DD02_Stg04_NormalMonster: {
      WaitingTime: number;
      RoamRadius: number;
      DesignatedTimeList: Array<any>;
      InitialSpawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
      };
      Spawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
        Type: string;
        RandomTypeRate: number;
      };
      ID: number;
    };
    DD02_Stg05_NormalMonster: {
      WaitingTime: number;
      RoamRadius: number;
      DesignatedTimeList: Array<any>;
      InitialSpawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
      };
      Spawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
        Type: string;
        RandomTypeRate: number;
      };
      ID: number;
    };
    DD02_Stg06_NormalMonster: {
      WaitingTime: number;
      RoamRadius: number;
      DesignatedTimeList: Array<any>;
      InitialSpawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
      };
      Spawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
        Type: string;
        RandomTypeRate: number;
      };
      ID: number;
    };
    RGD01_Stg01_NormalMonster: {
      WaitingTime: number;
      RoamRadius: number;
      DesignatedTimeList: Array<any>;
      InitialSpawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
      };
      Spawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
        Type: string;
        RandomTypeRate: number;
      };
      ID: number;
    };
    RGD01_Stg02_NormalMonster: {
      WaitingTime: number;
      RoamRadius: number;
      DesignatedTimeList: Array<any>;
      InitialSpawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
      };
      Spawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
        Type: string;
        RandomTypeRate: number;
      };
      ID: number;
    };
    RGD01_Stg03_NormalMonster: {
      WaitingTime: number;
      RoamRadius: number;
      DesignatedTimeList: Array<any>;
      InitialSpawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
      };
      Spawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
        Type: string;
        RandomTypeRate: number;
      };
      ID: number;
    };
    RGD01_Stg04_NormalMonster: {
      WaitingTime: number;
      RoamRadius: number;
      DesignatedTimeList: Array<any>;
      InitialSpawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
      };
      Spawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
        Type: string;
        RandomTypeRate: number;
      };
      ID: number;
    };
    RGD01_Stg05_NormalMonster: {
      WaitingTime: number;
      RoamRadius: number;
      DesignatedTimeList: Array<any>;
      InitialSpawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
      };
      Spawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
        Type: string;
        RandomTypeRate: number;
      };
      ID: number;
    };
    RGD01_Stg06_NormalMonster: {
      WaitingTime: number;
      RoamRadius: number;
      DesignatedTimeList: Array<any>;
      InitialSpawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
      };
      Spawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
        Type: string;
        RandomTypeRate: number;
      };
      ID: number;
    };
    RGD01_Stg07_NormalMonster: {
      WaitingTime: number;
      RoamRadius: number;
      DesignatedTimeList: Array<any>;
      InitialSpawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
      };
      Spawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
        Type: string;
        RandomTypeRate: number;
      };
      ID: number;
    };
    RGD01_Stg08_NormalMonster: {
      WaitingTime: number;
      RoamRadius: number;
      DesignatedTimeList: Array<any>;
      InitialSpawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
      };
      Spawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
        Type: string;
        RandomTypeRate: number;
      };
      ID: number;
    };
    RGD01_Stg09_NormalMonster: {
      WaitingTime: number;
      RoamRadius: number;
      DesignatedTimeList: Array<any>;
      InitialSpawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
      };
      Spawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
        Type: string;
        RandomTypeRate: number;
      };
      ID: number;
    };
    RGD01_Stg10_NormalMonster: {
      WaitingTime: number;
      RoamRadius: number;
      DesignatedTimeList: Array<any>;
      InitialSpawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
      };
      Spawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
        Type: string;
        RandomTypeRate: number;
      };
      ID: number;
    };
    RGD01_Stg11_NormalMonster: {
      WaitingTime: number;
      RoamRadius: number;
      DesignatedTimeList: Array<any>;
      InitialSpawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
      };
      Spawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
        Type: string;
        RandomTypeRate: number;
      };
      ID: number;
    };
    RGD01_Stg12_NormalMonster: {
      WaitingTime: number;
      RoamRadius: number;
      DesignatedTimeList: Array<any>;
      InitialSpawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
      };
      Spawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
        Type: string;
        RandomTypeRate: number;
      };
      ID: number;
    };
    RGD01_Stg13_NormalMonster: {
      WaitingTime: number;
      RoamRadius: number;
      DesignatedTimeList: Array<any>;
      InitialSpawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
      };
      Spawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
        Type: string;
        RandomTypeRate: number;
      };
      ID: number;
    };
    RGD01_Stg14_NormalMonster: {
      WaitingTime: number;
      RoamRadius: number;
      DesignatedTimeList: Array<any>;
      InitialSpawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
      };
      Spawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
        Type: string;
        RandomTypeRate: number;
      };
      ID: number;
    };
    RGD01_Stg15_NormalMonster: {
      WaitingTime: number;
      RoamRadius: number;
      DesignatedTimeList: Array<any>;
      InitialSpawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
      };
      Spawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
        Type: string;
        RandomTypeRate: number;
      };
      ID: number;
    };
    F01_GrowthSz_W_NormalMonster: {
      WaitingTime: number;
      RoamRadius: number;
      DesignatedTimeList: Array<any>;
      InitialSpawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
      };
      Spawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
        Type: string;
        RandomTypeRate: number;
      };
      ID: number;
    };
    RGD01_Stg03_GoblinWarrior_Boss: {
      WaitingTime: number;
      RoamRadius: number;
      DesignatedTimeList: Array<any>;
      InitialSpawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
      };
      Spawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
        Type: string;
        RandomTypeRate: number;
      };
      ID: number;
    };
    RGD01_Stg03_GoblinFighter_Boss: {
      WaitingTime: number;
      RoamRadius: number;
      DesignatedTimeList: Array<any>;
      InitialSpawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
      };
      Spawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
        Type: string;
        RandomTypeRate: number;
      };
      ID: number;
    };
    RGD01_Stg04_GnollWarrior_Boss: {
      WaitingTime: number;
      RoamRadius: number;
      DesignatedTimeList: Array<any>;
      InitialSpawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
      };
      Spawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
        Type: string;
        RandomTypeRate: number;
      };
      ID: number;
    };
    RGD01_Stg04_GnollFighter_Boss: {
      WaitingTime: number;
      RoamRadius: number;
      DesignatedTimeList: Array<any>;
      InitialSpawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
      };
      Spawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
        Type: string;
        RandomTypeRate: number;
      };
      ID: number;
    };
    RGD01_Stg05_SilenusFighter_Boss: {
      WaitingTime: number;
      RoamRadius: number;
      DesignatedTimeList: Array<any>;
      InitialSpawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
      };
      Spawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
        Type: string;
        RandomTypeRate: number;
      };
      ID: number;
    };
    RGD01_Stg06_SilenusShaman_Boss: {
      WaitingTime: number;
      RoamRadius: number;
      DesignatedTimeList: Array<any>;
      InitialSpawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
      };
      Spawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
        Type: string;
        RandomTypeRate: number;
      };
      ID: number;
    };
    RGD01_Stg07_SilenusMonk_Boss: {
      WaitingTime: number;
      RoamRadius: number;
      DesignatedTimeList: Array<any>;
      InitialSpawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
      };
      Spawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
        Type: string;
        RandomTypeRate: number;
      };
      ID: number;
    };
    RGD01_Stg08_SkeletonWarrior_Boss: {
      WaitingTime: number;
      RoamRadius: number;
      DesignatedTimeList: Array<any>;
      InitialSpawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
      };
      Spawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
        Type: string;
        RandomTypeRate: number;
      };
      ID: number;
    };
    RGD01_Stg09_SkeletonLancer_Boss: {
      WaitingTime: number;
      RoamRadius: number;
      DesignatedTimeList: Array<any>;
      InitialSpawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
      };
      Spawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
        Type: string;
        RandomTypeRate: number;
      };
      ID: number;
    };
    RGD01_Stg10_GolemFlame_Boss: {
      WaitingTime: number;
      RoamRadius: number;
      DesignatedTimeList: Array<any>;
      InitialSpawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
      };
      Spawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
        Type: string;
        RandomTypeRate: number;
      };
      ID: number;
    };
    RGD01_Stg11_MinotaurosFighter_Boss: {
      WaitingTime: number;
      RoamRadius: number;
      DesignatedTimeList: Array<any>;
      InitialSpawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
      };
      Spawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
        Type: string;
        RandomTypeRate: number;
      };
      ID: number;
    };
    RGD01_Stg12_MinotaurosWarrior_Boss: {
      WaitingTime: number;
      RoamRadius: number;
      DesignatedTimeList: Array<any>;
      InitialSpawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
      };
      Spawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
        Type: string;
        RandomTypeRate: number;
      };
      ID: number;
    };
    RGD01_Stg13_MinotaurosHalberdier_Boss: {
      WaitingTime: number;
      RoamRadius: number;
      DesignatedTimeList: Array<any>;
      InitialSpawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
      };
      Spawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
        Type: string;
        RandomTypeRate: number;
      };
      ID: number;
    };
    RGD01_Stg01_MinotaurosFighter_Boss: {
      WaitingTime: number;
      RoamRadius: number;
      DesignatedTimeList: Array<any>;
      InitialSpawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
      };
      Spawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
        Type: string;
        RandomTypeRate: number;
      };
      ID: number;
    };
    RGD01_Stg02_MinotaurosWarrior_Boss: {
      WaitingTime: number;
      RoamRadius: number;
      DesignatedTimeList: Array<any>;
      InitialSpawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
      };
      Spawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
        Type: string;
        RandomTypeRate: number;
      };
      ID: number;
    };
    F01_Phase_S_NormalMonster: {
      WaitingTime: number;
      RoamRadius: number;
      DesignatedTimeList: Array<any>;
      InitialSpawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
      };
      Spawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
        Type: string;
        RandomTypeRate: number;
      };
      ID: number;
    };
    F01_Phase_S_BossMonster: {
      WaitingTime: number;
      RoamRadius: number;
      DesignatedTimeList: Array<any>;
      InitialSpawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
      };
      Spawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
        Type: string;
        RandomTypeRate: number;
      };
      ID: number;
    };
    F02_Phase_S_NormalMonster: {
      WaitingTime: number;
      RoamRadius: number;
      DesignatedTimeList: Array<any>;
      InitialSpawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
      };
      Spawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
        Type: string;
        RandomTypeRate: number;
      };
      ID: number;
    };
    F02_Phase_S_BossMonster: {
      WaitingTime: number;
      RoamRadius: number;
      DesignatedTimeList: Array<any>;
      InitialSpawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
      };
      Spawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
        Type: string;
        RandomTypeRate: number;
      };
      ID: number;
    };
    F03_Phase_S_NormalMonster: {
      WaitingTime: number;
      RoamRadius: number;
      DesignatedTimeList: Array<any>;
      InitialSpawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
      };
      Spawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
        Type: string;
        RandomTypeRate: number;
      };
      ID: number;
    };
    F03_Phase_S_BossMonster: {
      WaitingTime: number;
      RoamRadius: number;
      DesignatedTimeList: Array<any>;
      InitialSpawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
      };
      Spawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
        Type: string;
        RandomTypeRate: number;
      };
      ID: number;
    };
    FieldAll_S_Citizen: {
      WaitingTime: number;
      RoamRadius: number;
      DesignatedTimeList: Array<any>;
      InitialSpawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
      };
      Spawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
        Type: string;
        RandomTypeRate: number;
      };
      ID: number;
    };
    RGF01_S1_W_NormalMonster: {
      WaitingTime: number;
      RoamRadius: number;
      DesignatedTimeList: Array<any>;
      InitialSpawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
      };
      Spawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
        Type: string;
        RandomTypeRate: number;
      };
      ID: number;
    };
    RGF01_S2_W_NormalMonster: {
      WaitingTime: number;
      RoamRadius: number;
      DesignatedTimeList: Array<any>;
      InitialSpawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
      };
      Spawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
        Type: string;
        RandomTypeRate: number;
      };
      ID: number;
    };
    RGF01_S3_W_NormalMonster: {
      WaitingTime: number;
      RoamRadius: number;
      DesignatedTimeList: Array<any>;
      InitialSpawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
      };
      Spawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
        Type: string;
        RandomTypeRate: number;
      };
      ID: number;
    };
    RGF01_S1_W_HardMonster: {
      WaitingTime: number;
      RoamRadius: number;
      DesignatedTimeList: Array<any>;
      InitialSpawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
      };
      Spawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
        Type: string;
        RandomTypeRate: number;
      };
      ID: number;
    };
    RGF01_S2_W_HardMonster: {
      WaitingTime: number;
      RoamRadius: number;
      DesignatedTimeList: Array<any>;
      InitialSpawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
      };
      Spawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
        Type: string;
        RandomTypeRate: number;
      };
      ID: number;
    };
    RGF01_S3_W_HardlMonster: {
      WaitingTime: number;
      RoamRadius: number;
      DesignatedTimeList: Array<any>;
      InitialSpawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
      };
      Spawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
        Type: string;
        RandomTypeRate: number;
      };
      ID: number;
    };
    RGF01_S1_W_SpotMonster: {
      WaitingTime: number;
      RoamRadius: number;
      DesignatedTimeList: Array<any>;
      InitialSpawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
      };
      Spawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
        Type: string;
        RandomTypeRate: number;
      };
      ID: number;
    };
    RGF01_S2_W_SpotMonster: {
      WaitingTime: number;
      RoamRadius: number;
      DesignatedTimeList: Array<any>;
      InitialSpawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
      };
      Spawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
        Type: string;
        RandomTypeRate: number;
      };
      ID: number;
    };
    RGF01_S3_W_SpotMonster: {
      WaitingTime: number;
      RoamRadius: number;
      DesignatedTimeList: Array<any>;
      InitialSpawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
      };
      Spawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
        Type: string;
        RandomTypeRate: number;
      };
      ID: number;
    };
    RGF_01_B3_Boss: {
      WaitingTime: number;
      RoamRadius: number;
      DesignatedTimeList: Array<any>;
      InitialSpawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
      };
      Spawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
        Type: string;
        RandomTypeRate: number;
      };
      ID: number;
    };
    RGF01_All_SzA_Elite: {
      WaitingTime: number;
      RoamRadius: number;
      DesignatedTimeList: Array<any>;
      InitialSpawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
      };
      Spawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
        Type: string;
        RandomTypeRate: number;
      };
      ID: number;
    };
    RGF01_All_SzB_Elite: {
      WaitingTime: number;
      RoamRadius: number;
      DesignatedTimeList: Array<any>;
      InitialSpawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
      };
      Spawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
        Type: string;
        RandomTypeRate: number;
      };
      ID: number;
    };
    RGF01_All_SzC_Elite: {
      WaitingTime: number;
      RoamRadius: number;
      DesignatedTimeList: Array<any>;
      InitialSpawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
      };
      Spawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
        Type: string;
        RandomTypeRate: number;
      };
      ID: number;
    };
    RGF01_All_S1_H_Elite: {
      WaitingTime: number;
      RoamRadius: number;
      DesignatedTimeList: Array<any>;
      InitialSpawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
      };
      Spawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
        Type: string;
        RandomTypeRate: number;
      };
      ID: number;
    };
    RGF01_All_SzA_SpecialElite: {
      WaitingTime: number;
      RoamRadius: number;
      DesignatedTimeList: Array<any>;
      InitialSpawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
      };
      Spawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
        Type: string;
        RandomTypeRate: number;
      };
      ID: number;
    };
    RGF01_All_SzB_SpecialElite: {
      WaitingTime: number;
      RoamRadius: number;
      DesignatedTimeList: Array<any>;
      InitialSpawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
      };
      Spawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
        Type: string;
        RandomTypeRate: number;
      };
      ID: number;
    };
    RGF01_All_SzC_SpecialElite: {
      WaitingTime: number;
      RoamRadius: number;
      DesignatedTimeList: Array<any>;
      InitialSpawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
      };
      Spawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
        Type: string;
        RandomTypeRate: number;
      };
      ID: number;
    };
    RGF01_All_S1_H_SpecialElite: {
      WaitingTime: number;
      RoamRadius: number;
      DesignatedTimeList: Array<any>;
      InitialSpawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
      };
      Spawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
        Type: string;
        RandomTypeRate: number;
      };
      ID: number;
    };
    GD01_NormalMonster: {
      WaitingTime: number;
      RoamRadius: number;
      DesignatedTimeList: Array<any>;
      InitialSpawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
      };
      Spawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
        Type: string;
        RandomTypeRate: number;
      };
      ID: number;
    };
    GD01_SummonedMonster: {
      WaitingTime: number;
      RoamRadius: number;
      DesignatedTimeList: Array<any>;
      InitialSpawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
      };
      Spawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
        Type: string;
        RandomTypeRate: number;
      };
      ID: number;
    };
    GD01_Qeust1_Boss: {
      WaitingTime: number;
      RoamRadius: number;
      DesignatedTimeList: Array<any>;
      InitialSpawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
      };
      Spawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
        Type: string;
        RandomTypeRate: number;
      };
      ID: number;
    };
    GD01_Qeust2_Boss: {
      WaitingTime: number;
      RoamRadius: number;
      DesignatedTimeList: Array<any>;
      InitialSpawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
      };
      Spawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
        Type: string;
        RandomTypeRate: number;
      };
      ID: number;
    };
    GD01_Qeust3_Boss: {
      WaitingTime: number;
      RoamRadius: number;
      DesignatedTimeList: Array<any>;
      InitialSpawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
      };
      Spawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
        Type: string;
        RandomTypeRate: number;
      };
      ID: number;
    };
    GD01_Qeust3_Step2_Monster: {
      WaitingTime: number;
      RoamRadius: number;
      DesignatedTimeList: Array<any>;
      InitialSpawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
      };
      Spawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
        Type: string;
        RandomTypeRate: number;
      };
      ID: number;
    };
    ProtoNpc: {
      WaitingTime: number;
      RoamRadius: number;
      DesignatedTimeList: Array<any>;
      InitialSpawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
      };
      Spawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
        Type: string;
        RandomTypeRate: number;
      };
      ID: number;
    };
    BrokenWall: {
      WaitingTime: number;
      RoamRadius: number;
      DesignatedTimeList: Array<any>;
      InitialSpawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
      };
      Spawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
        Type: string;
        RandomTypeRate: number;
      };
      ID: number;
    };
    ProtoNpc2: {
      WaitingTime: number;
      RoamRadius: number;
      DesignatedTimeList: Array<any>;
      InitialSpawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
      };
      Spawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
        Type: string;
        RandomTypeRate: number;
      };
      ID: number;
    };
    Stand: {
      WaitingTime: number;
      RoamRadius: number;
      DesignatedTimeList: Array<any>;
      InitialSpawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
      };
      Spawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
        Type: string;
        RandomTypeRate: number;
      };
      ID: number;
    };
    Test_Wander_M2_W5: {
      WaitingTime: number;
      RoamRadius: number;
      DesignatedTimeList: Array<any>;
      InitialSpawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
      };
      Spawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
        Type: string;
        RandomTypeRate: number;
      };
      ID: number;
    };
    Test_Wander_M5_W10: {
      WaitingTime: number;
      RoamRadius: number;
      DesignatedTimeList: Array<any>;
      InitialSpawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
      };
      Spawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
        Type: string;
        RandomTypeRate: number;
      };
      ID: number;
    };
    Test_Stand: {
      WaitingTime: number;
      RoamRadius: number;
      DesignatedTimeList: Array<any>;
      InitialSpawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
      };
      Spawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
        Type: string;
        RandomTypeRate: number;
      };
      ID: number;
    };
    Test_Wander_M5_W3: {
      WaitingTime: number;
      RoamRadius: number;
      DesignatedTimeList: Array<any>;
      InitialSpawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
      };
      Spawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
        Type: string;
        RandomTypeRate: number;
      };
      ID: number;
    };
    Test_Wander_M1_W1: {
      WaitingTime: number;
      RoamRadius: number;
      DesignatedTimeList: Array<any>;
      InitialSpawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
      };
      Spawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
        Type: string;
        RandomTypeRate: number;
      };
      ID: number;
    };
    Test_Stand_Respawn: {
      WaitingTime: number;
      RoamRadius: number;
      DesignatedTimeList: Array<any>;
      InitialSpawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
      };
      Spawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
        Type: string;
        RandomTypeRate: number;
      };
      ID: number;
    };
    Test_NamedRespawn: {
      WaitingTime: number;
      RoamRadius: number;
      DesignatedTimeList: Array<any>;
      InitialSpawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
      };
      Spawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
        Type: string;
        RandomTypeRate: number;
      };
      ID: number;
    };
    Test_RandomGroupSpawn: {
      WaitingTime: number;
      RoamRadius: number;
      DesignatedTimeList: Array<any>;
      InitialSpawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
      };
      Spawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
        Type: string;
        RandomTypeRate: number;
      };
      ID: number;
    };
    Test_RandomGroupSpawn_2: {
      WaitingTime: number;
      RoamRadius: number;
      DesignatedTimeList: Array<any>;
      InitialSpawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
      };
      Spawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
        Type: string;
        RandomTypeRate: number;
      };
      ID: number;
    };
    Test_RandomGroupSpawn_3: {
      WaitingTime: number;
      RoamRadius: number;
      DesignatedTimeList: Array<any>;
      InitialSpawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
      };
      Spawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
        Type: string;
        RandomTypeRate: number;
      };
      ID: number;
    };
    Test_RandomGroupSpawn_4: {
      WaitingTime: number;
      RoamRadius: number;
      DesignatedTimeList: Array<any>;
      InitialSpawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
      };
      Spawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
        Type: string;
        RandomTypeRate: number;
      };
      ID: number;
    };
    Test_BossZone_BossMonster: {
      WaitingTime: number;
      RoamRadius: number;
      DesignatedTimeList: Array<any>;
      InitialSpawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
      };
      Spawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
        Type: string;
        RandomTypeRate: number;
      };
      ID: number;
    };
    Test_Summon_Spawn: {
      WaitingTime: number;
      RoamRadius: number;
      DesignatedTimeList: Array<any>;
      InitialSpawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
      };
      Spawn: {
        TimeInfo: {
          IntervalSec: number;
          RandomDelaySec: number;
        };
        Type: string;
        RandomTypeRate: number;
      };
      ID: number;
    };
  };
}>;

export type MDungeonStageData = Array<{
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
    Map_FD02_01: {
      Title: {
        StringId: string;
      };
      Zone: {
        Disable: boolean;
        Resource: {
          StringId: string;
        };
        DesignLevel: {
          AssetPathName: string;
          SubPathString: string;
        };
        LoadingInfo: {
          Image: {
            StringId: string;
          };
          Text: {
            StringId: string;
          };
        };
        FeatureActivation: {
          StringId: string;
        };
        Channel: {
          Min: number;
          Max: number;
        };
        UseWaitingQueue: boolean;
        PcRelationship: {
          StringId: string;
        };
        StatEffect: {
          StringId: string;
        };
      };
      Dungeon: {
        StringId: string;
      };
      EntranceCost: {
        Asset: {
          StringId: string;
        };
        Count: number;
      };
      EntranceAreaList: Array<string>;
      FieldType: string;
      PcLevel: number;
      CombatPower: number;
      Order: number;
      MainSubzone: {
        StringId: string;
      };
      MainRewardItems: Array<{
        StringId: string;
      }>;
      CanScheduling: boolean;
      ID: number;
    };
    Map_FD02_02: {
      Title: {
        StringId: string;
      };
      Zone: {
        Disable: boolean;
        Resource: {
          StringId: string;
        };
        DesignLevel: {
          AssetPathName: string;
          SubPathString: string;
        };
        LoadingInfo: {
          Image: {
            StringId: string;
          };
          Text: {
            StringId: string;
          };
        };
        FeatureActivation: {
          StringId: string;
        };
        Channel: {
          Min: number;
          Max: number;
        };
        UseWaitingQueue: boolean;
        PcRelationship: {
          StringId: string;
        };
        StatEffect: {
          StringId: string;
        };
      };
      Dungeon: {
        StringId: string;
      };
      EntranceCost: {
        Asset: {
          StringId: string;
        };
        Count: number;
      };
      EntranceAreaList: Array<string>;
      FieldType: string;
      PcLevel: number;
      CombatPower: number;
      Order: number;
      MainSubzone: {
        StringId: string;
      };
      MainRewardItems: Array<{
        StringId: string;
      }>;
      CanScheduling: boolean;
      ID: number;
    };
    Map_FD02_03: {
      Title: {
        StringId: string;
      };
      Zone: {
        Disable: boolean;
        Resource: {
          StringId: string;
        };
        DesignLevel: {
          AssetPathName: string;
          SubPathString: string;
        };
        LoadingInfo: {
          Image: {
            StringId: string;
          };
          Text: {
            StringId: string;
          };
        };
        FeatureActivation: {
          StringId: string;
        };
        Channel: {
          Min: number;
          Max: number;
        };
        UseWaitingQueue: boolean;
        PcRelationship: {
          StringId: string;
        };
        StatEffect: {
          StringId: string;
        };
      };
      Dungeon: {
        StringId: string;
      };
      EntranceCost: {
        Asset: {
          StringId: string;
        };
        Count: number;
      };
      EntranceAreaList: Array<string>;
      FieldType: string;
      PcLevel: number;
      CombatPower: number;
      Order: number;
      MainSubzone: {
        StringId: string;
      };
      MainRewardItems: Array<{
        StringId: string;
      }>;
      CanScheduling: boolean;
      ID: number;
    };
    Map_FD02_04: {
      Title: {
        StringId: string;
      };
      Zone: {
        Disable: boolean;
        Resource: {
          StringId: string;
        };
        DesignLevel: {
          AssetPathName: string;
          SubPathString: string;
        };
        LoadingInfo: {
          Image: {
            StringId: string;
          };
          Text: {
            StringId: string;
          };
        };
        FeatureActivation: {
          StringId: string;
        };
        Channel: {
          Min: number;
          Max: number;
        };
        UseWaitingQueue: boolean;
        PcRelationship: {
          StringId: string;
        };
        StatEffect: {
          StringId: string;
        };
      };
      Dungeon: {
        StringId: string;
      };
      EntranceCost: {
        Asset: {
          StringId: string;
        };
        Count: number;
      };
      EntranceAreaList: Array<string>;
      FieldType: string;
      PcLevel: number;
      CombatPower: number;
      Order: number;
      MainSubzone: {
        StringId: string;
      };
      MainRewardItems: Array<{
        StringId: string;
      }>;
      CanScheduling: boolean;
      ID: number;
    };
    Map_FD03_01: {
      Title: {
        StringId: string;
      };
      Zone: {
        Disable: boolean;
        Resource: {
          StringId: string;
        };
        DesignLevel: {
          AssetPathName: string;
          SubPathString: string;
        };
        LoadingInfo: {
          Image: {
            StringId: string;
          };
          Text: {
            StringId: string;
          };
        };
        FeatureActivation: {
          StringId: string;
        };
        Channel: {
          Min: number;
          Max: number;
        };
        UseWaitingQueue: boolean;
        PcRelationship: {
          StringId: string;
        };
        StatEffect: {
          StringId: string;
        };
      };
      Dungeon: {
        StringId: string;
      };
      EntranceCost: {
        Asset: {
          StringId: string;
        };
        Count: number;
      };
      EntranceAreaList: Array<string>;
      FieldType: string;
      PcLevel: number;
      CombatPower: number;
      Order: number;
      MainSubzone: {
        StringId: string;
      };
      MainRewardItems: Array<{
        StringId: string;
      }>;
      CanScheduling: boolean;
      ID: number;
    };
    Map_FD03_02: {
      Title: {
        StringId: string;
      };
      Zone: {
        Disable: boolean;
        Resource: {
          StringId: string;
        };
        DesignLevel: {
          AssetPathName: string;
          SubPathString: string;
        };
        LoadingInfo: {
          Image: {
            StringId: string;
          };
          Text: {
            StringId: string;
          };
        };
        FeatureActivation: {
          StringId: string;
        };
        Channel: {
          Min: number;
          Max: number;
        };
        UseWaitingQueue: boolean;
        PcRelationship: {
          StringId: string;
        };
        StatEffect: {
          StringId: string;
        };
      };
      Dungeon: {
        StringId: string;
      };
      EntranceCost: {
        Asset: {
          StringId: string;
        };
        Count: number;
      };
      EntranceAreaList: Array<string>;
      FieldType: string;
      PcLevel: number;
      CombatPower: number;
      Order: number;
      MainSubzone: {
        StringId: string;
      };
      MainRewardItems: Array<{
        StringId: string;
      }>;
      CanScheduling: boolean;
      ID: number;
    };
    Map_FD03_03: {
      Title: {
        StringId: string;
      };
      Zone: {
        Disable: boolean;
        Resource: {
          StringId: string;
        };
        DesignLevel: {
          AssetPathName: string;
          SubPathString: string;
        };
        LoadingInfo: {
          Image: {
            StringId: string;
          };
          Text: {
            StringId: string;
          };
        };
        FeatureActivation: {
          StringId: string;
        };
        Channel: {
          Min: number;
          Max: number;
        };
        UseWaitingQueue: boolean;
        PcRelationship: {
          StringId: string;
        };
        StatEffect: {
          StringId: string;
        };
      };
      Dungeon: {
        StringId: string;
      };
      EntranceCost: {
        Asset: {
          StringId: string;
        };
        Count: number;
      };
      EntranceAreaList: Array<string>;
      FieldType: string;
      PcLevel: number;
      CombatPower: number;
      Order: number;
      MainSubzone: {
        StringId: string;
      };
      MainRewardItems: Array<{
        StringId: string;
      }>;
      CanScheduling: boolean;
      ID: number;
    };
    Map_FD03_04: {
      Title: {
        StringId: string;
      };
      Zone: {
        Disable: boolean;
        Resource: {
          StringId: string;
        };
        DesignLevel: {
          AssetPathName: string;
          SubPathString: string;
        };
        LoadingInfo: {
          Image: {
            StringId: string;
          };
          Text: {
            StringId: string;
          };
        };
        FeatureActivation: {
          StringId: string;
        };
        Channel: {
          Min: number;
          Max: number;
        };
        UseWaitingQueue: boolean;
        PcRelationship: {
          StringId: string;
        };
        StatEffect: {
          StringId: string;
        };
      };
      Dungeon: {
        StringId: string;
      };
      EntranceCost: {
        Asset: {
          StringId: string;
        };
        Count: number;
      };
      EntranceAreaList: Array<string>;
      FieldType: string;
      PcLevel: number;
      CombatPower: number;
      Order: number;
      MainSubzone: {
        StringId: string;
      };
      MainRewardItems: Array<{
        StringId: string;
      }>;
      CanScheduling: boolean;
      ID: number;
    };
    Map_FD03_05: {
      Title: {
        StringId: string;
      };
      Zone: {
        Disable: boolean;
        Resource: {
          StringId: string;
        };
        DesignLevel: {
          AssetPathName: string;
          SubPathString: string;
        };
        LoadingInfo: {
          Image: {
            StringId: string;
          };
          Text: {
            StringId: string;
          };
        };
        FeatureActivation: {
          StringId: string;
        };
        Channel: {
          Min: number;
          Max: number;
        };
        UseWaitingQueue: boolean;
        PcRelationship: {
          StringId: string;
        };
        StatEffect: {
          StringId: string;
        };
      };
      Dungeon: {
        StringId: string;
      };
      EntranceCost: {
        Asset: {
          StringId: string;
        };
        Count: number;
      };
      EntranceAreaList: Array<string>;
      FieldType: string;
      PcLevel: number;
      CombatPower: number;
      Order: number;
      MainSubzone: {
        StringId: string;
      };
      MainRewardItems: Array<{
        StringId: string;
      }>;
      CanScheduling: boolean;
      ID: number;
    };
    Map_DD01_GL_01: {
      Title: {
        StringId: string;
      };
      Zone: {
        Disable: boolean;
        Resource: {
          StringId: string;
        };
        DesignLevel: {
          AssetPathName: string;
          SubPathString: string;
        };
        LoadingInfo: {
          Image: {
            StringId: string;
          };
          Text: {
            StringId: string;
          };
        };
        FeatureActivation: {
          StringId: string;
        };
        Channel: {
          Min: number;
          Max: number;
        };
        UseWaitingQueue: boolean;
        PcRelationship: {
          StringId: string;
        };
        StatEffect: {
          StringId: string;
        };
      };
      Dungeon: {
        StringId: string;
      };
      EntranceCost: {
        Asset: {
          StringId: string;
        };
        Count: number;
      };
      EntranceAreaList: Array<string>;
      FieldType: string;
      PcLevel: number;
      CombatPower: number;
      Order: number;
      MainSubzone: {
        StringId: string;
      };
      MainRewardItems: Array<{
        StringId: string;
      }>;
      CanScheduling: boolean;
      ID: number;
    };
    Map_DD01_GL_02: {
      Title: {
        StringId: string;
      };
      Zone: {
        Disable: boolean;
        Resource: {
          StringId: string;
        };
        DesignLevel: {
          AssetPathName: string;
          SubPathString: string;
        };
        LoadingInfo: {
          Image: {
            StringId: string;
          };
          Text: {
            StringId: string;
          };
        };
        FeatureActivation: {
          StringId: string;
        };
        Channel: {
          Min: number;
          Max: number;
        };
        UseWaitingQueue: boolean;
        PcRelationship: {
          StringId: string;
        };
        StatEffect: {
          StringId: string;
        };
      };
      Dungeon: {
        StringId: string;
      };
      EntranceCost: {
        Asset: {
          StringId: string;
        };
        Count: number;
      };
      EntranceAreaList: Array<string>;
      FieldType: string;
      PcLevel: number;
      CombatPower: number;
      Order: number;
      MainSubzone: {
        StringId: string;
      };
      MainRewardItems: Array<{
        StringId: string;
      }>;
      CanScheduling: boolean;
      ID: number;
    };
    Map_DD01_GL_03: {
      Title: {
        StringId: string;
      };
      Zone: {
        Disable: boolean;
        Resource: {
          StringId: string;
        };
        DesignLevel: {
          AssetPathName: string;
          SubPathString: string;
        };
        LoadingInfo: {
          Image: {
            StringId: string;
          };
          Text: {
            StringId: string;
          };
        };
        FeatureActivation: {
          StringId: string;
        };
        Channel: {
          Min: number;
          Max: number;
        };
        UseWaitingQueue: boolean;
        PcRelationship: {
          StringId: string;
        };
        StatEffect: {
          StringId: string;
        };
      };
      Dungeon: {
        StringId: string;
      };
      EntranceCost: {
        Asset: {
          StringId: string;
        };
        Count: number;
      };
      EntranceAreaList: Array<string>;
      FieldType: string;
      PcLevel: number;
      CombatPower: number;
      Order: number;
      MainSubzone: {
        StringId: string;
      };
      MainRewardItems: Array<{
        StringId: string;
      }>;
      CanScheduling: boolean;
      ID: number;
    };
    Map_DD01_GL_04: {
      Title: {
        StringId: string;
      };
      Zone: {
        Disable: boolean;
        Resource: {
          StringId: string;
        };
        DesignLevel: {
          AssetPathName: string;
          SubPathString: string;
        };
        LoadingInfo: {
          Image: {
            StringId: string;
          };
          Text: {
            StringId: string;
          };
        };
        FeatureActivation: {
          StringId: string;
        };
        Channel: {
          Min: number;
          Max: number;
        };
        UseWaitingQueue: boolean;
        PcRelationship: {
          StringId: string;
        };
        StatEffect: {
          StringId: string;
        };
      };
      Dungeon: {
        StringId: string;
      };
      EntranceCost: {
        Asset: {
          StringId: string;
        };
        Count: number;
      };
      EntranceAreaList: Array<string>;
      FieldType: string;
      PcLevel: number;
      CombatPower: number;
      Order: number;
      MainSubzone: {
        StringId: string;
      };
      MainRewardItems: Array<{
        StringId: string;
      }>;
      CanScheduling: boolean;
      ID: number;
    };
    Map_DD01_GL_05: {
      Title: {
        StringId: string;
      };
      Zone: {
        Disable: boolean;
        Resource: {
          StringId: string;
        };
        DesignLevel: {
          AssetPathName: string;
          SubPathString: string;
        };
        LoadingInfo: {
          Image: {
            StringId: string;
          };
          Text: {
            StringId: string;
          };
        };
        FeatureActivation: {
          StringId: string;
        };
        Channel: {
          Min: number;
          Max: number;
        };
        UseWaitingQueue: boolean;
        PcRelationship: {
          StringId: string;
        };
        StatEffect: {
          StringId: string;
        };
      };
      Dungeon: {
        StringId: string;
      };
      EntranceCost: {
        Asset: {
          StringId: string;
        };
        Count: number;
      };
      EntranceAreaList: Array<string>;
      FieldType: string;
      PcLevel: number;
      CombatPower: number;
      Order: number;
      MainSubzone: {
        StringId: string;
      };
      MainRewardItems: Array<{
        StringId: string;
      }>;
      CanScheduling: boolean;
      ID: number;
    };
    Map_DD01_01: {
      Title: {
        StringId: string;
      };
      Zone: {
        Disable: boolean;
        Resource: {
          StringId: string;
        };
        DesignLevel: {
          AssetPathName: string;
          SubPathString: string;
        };
        LoadingInfo: {
          Image: {
            StringId: string;
          };
          Text: {
            StringId: string;
          };
        };
        FeatureActivation: {
          StringId: string;
        };
        Channel: {
          Min: number;
          Max: number;
        };
        UseWaitingQueue: boolean;
        PcRelationship: {
          StringId: string;
        };
        StatEffect: {
          StringId: string;
        };
      };
      Dungeon: {
        StringId: string;
      };
      EntranceCost: {
        Asset: {
          StringId: string;
        };
        Count: number;
      };
      EntranceAreaList: Array<string>;
      FieldType: string;
      PcLevel: number;
      CombatPower: number;
      Order: number;
      MainSubzone: {
        StringId: string;
      };
      MainRewardItems: Array<{
        StringId: string;
      }>;
      CanScheduling: boolean;
      ID: number;
    };
    Map_DD01_02: {
      Title: {
        StringId: string;
      };
      Zone: {
        Disable: boolean;
        Resource: {
          StringId: string;
        };
        DesignLevel: {
          AssetPathName: string;
          SubPathString: string;
        };
        LoadingInfo: {
          Image: {
            StringId: string;
          };
          Text: {
            StringId: string;
          };
        };
        FeatureActivation: {
          StringId: string;
        };
        Channel: {
          Min: number;
          Max: number;
        };
        UseWaitingQueue: boolean;
        PcRelationship: {
          StringId: string;
        };
        StatEffect: {
          StringId: string;
        };
      };
      Dungeon: {
        StringId: string;
      };
      EntranceCost: {
        Asset: {
          StringId: string;
        };
        Count: number;
      };
      EntranceAreaList: Array<string>;
      FieldType: string;
      PcLevel: number;
      CombatPower: number;
      Order: number;
      MainSubzone: {
        StringId: string;
      };
      MainRewardItems: Array<{
        StringId: string;
      }>;
      CanScheduling: boolean;
      ID: number;
    };
    Map_DD01_03: {
      Title: {
        StringId: string;
      };
      Zone: {
        Disable: boolean;
        Resource: {
          StringId: string;
        };
        DesignLevel: {
          AssetPathName: string;
          SubPathString: string;
        };
        LoadingInfo: {
          Image: {
            StringId: string;
          };
          Text: {
            StringId: string;
          };
        };
        FeatureActivation: {
          StringId: string;
        };
        Channel: {
          Min: number;
          Max: number;
        };
        UseWaitingQueue: boolean;
        PcRelationship: {
          StringId: string;
        };
        StatEffect: {
          StringId: string;
        };
      };
      Dungeon: {
        StringId: string;
      };
      EntranceCost: {
        Asset: {
          StringId: string;
        };
        Count: number;
      };
      EntranceAreaList: Array<string>;
      FieldType: string;
      PcLevel: number;
      CombatPower: number;
      Order: number;
      MainSubzone: {
        StringId: string;
      };
      MainRewardItems: Array<{
        StringId: string;
      }>;
      CanScheduling: boolean;
      ID: number;
    };
    Map_DD01_04: {
      Title: {
        StringId: string;
      };
      Zone: {
        Disable: boolean;
        Resource: {
          StringId: string;
        };
        DesignLevel: {
          AssetPathName: string;
          SubPathString: string;
        };
        LoadingInfo: {
          Image: {
            StringId: string;
          };
          Text: {
            StringId: string;
          };
        };
        FeatureActivation: {
          StringId: string;
        };
        Channel: {
          Min: number;
          Max: number;
        };
        UseWaitingQueue: boolean;
        PcRelationship: {
          StringId: string;
        };
        StatEffect: {
          StringId: string;
        };
      };
      Dungeon: {
        StringId: string;
      };
      EntranceCost: {
        Asset: {
          StringId: string;
        };
        Count: number;
      };
      EntranceAreaList: Array<string>;
      FieldType: string;
      PcLevel: number;
      CombatPower: number;
      Order: number;
      MainSubzone: {
        StringId: string;
      };
      MainRewardItems: Array<{
        StringId: string;
      }>;
      CanScheduling: boolean;
      ID: number;
    };
    Map_DD02_01: {
      Title: {
        StringId: string;
      };
      Zone: {
        Disable: boolean;
        Resource: {
          StringId: string;
        };
        DesignLevel: {
          AssetPathName: string;
          SubPathString: string;
        };
        LoadingInfo: {
          Image: {
            StringId: string;
          };
          Text: {
            StringId: string;
          };
        };
        FeatureActivation: {
          StringId: string;
        };
        Channel: {
          Min: number;
          Max: number;
        };
        UseWaitingQueue: boolean;
        PcRelationship: {
          StringId: string;
        };
        StatEffect: {
          StringId: string;
        };
      };
      Dungeon: {
        StringId: string;
      };
      EntranceCost: {
        Asset: {
          StringId: string;
        };
        Count: number;
      };
      EntranceAreaList: Array<string>;
      FieldType: string;
      PcLevel: number;
      CombatPower: number;
      Order: number;
      MainSubzone: {
        StringId: string;
      };
      MainRewardItems: Array<{
        StringId: string;
      }>;
      CanScheduling: boolean;
      ID: number;
    };
    Map_DD02_02: {
      Title: {
        StringId: string;
      };
      Zone: {
        Disable: boolean;
        Resource: {
          StringId: string;
        };
        DesignLevel: {
          AssetPathName: string;
          SubPathString: string;
        };
        LoadingInfo: {
          Image: {
            StringId: string;
          };
          Text: {
            StringId: string;
          };
        };
        FeatureActivation: {
          StringId: string;
        };
        Channel: {
          Min: number;
          Max: number;
        };
        UseWaitingQueue: boolean;
        PcRelationship: {
          StringId: string;
        };
        StatEffect: {
          StringId: string;
        };
      };
      Dungeon: {
        StringId: string;
      };
      EntranceCost: {
        Asset: {
          StringId: string;
        };
        Count: number;
      };
      EntranceAreaList: Array<string>;
      FieldType: string;
      PcLevel: number;
      CombatPower: number;
      Order: number;
      MainSubzone: {
        StringId: string;
      };
      MainRewardItems: Array<{
        StringId: string;
      }>;
      CanScheduling: boolean;
      ID: number;
    };
    Map_DD02_03: {
      Title: {
        StringId: string;
      };
      Zone: {
        Disable: boolean;
        Resource: {
          StringId: string;
        };
        DesignLevel: {
          AssetPathName: string;
          SubPathString: string;
        };
        LoadingInfo: {
          Image: {
            StringId: string;
          };
          Text: {
            StringId: string;
          };
        };
        FeatureActivation: {
          StringId: string;
        };
        Channel: {
          Min: number;
          Max: number;
        };
        UseWaitingQueue: boolean;
        PcRelationship: {
          StringId: string;
        };
        StatEffect: {
          StringId: string;
        };
      };
      Dungeon: {
        StringId: string;
      };
      EntranceCost: {
        Asset: {
          StringId: string;
        };
        Count: number;
      };
      EntranceAreaList: Array<string>;
      FieldType: string;
      PcLevel: number;
      CombatPower: number;
      Order: number;
      MainSubzone: {
        StringId: string;
      };
      MainRewardItems: Array<{
        StringId: string;
      }>;
      CanScheduling: boolean;
      ID: number;
    };
    Map_DD02_04: {
      Title: {
        StringId: string;
      };
      Zone: {
        Disable: boolean;
        Resource: {
          StringId: string;
        };
        DesignLevel: {
          AssetPathName: string;
          SubPathString: string;
        };
        LoadingInfo: {
          Image: {
            StringId: string;
          };
          Text: {
            StringId: string;
          };
        };
        FeatureActivation: {
          StringId: string;
        };
        Channel: {
          Min: number;
          Max: number;
        };
        UseWaitingQueue: boolean;
        PcRelationship: {
          StringId: string;
        };
        StatEffect: {
          StringId: string;
        };
      };
      Dungeon: {
        StringId: string;
      };
      EntranceCost: {
        Asset: {
          StringId: string;
        };
        Count: number;
      };
      EntranceAreaList: Array<string>;
      FieldType: string;
      PcLevel: number;
      CombatPower: number;
      Order: number;
      MainSubzone: {
        StringId: string;
      };
      MainRewardItems: Array<{
        StringId: string;
      }>;
      CanScheduling: boolean;
      ID: number;
    };
    Map_RGD01_01: {
      Title: {
        StringId: string;
      };
      Zone: {
        Disable: boolean;
        Resource: {
          StringId: string;
        };
        DesignLevel: {
          AssetPathName: string;
          SubPathString: string;
        };
        LoadingInfo: {
          Image: {
            StringId: string;
          };
          Text: {
            StringId: string;
          };
        };
        FeatureActivation: {
          StringId: string;
        };
        Channel: {
          Min: number;
          Max: number;
        };
        UseWaitingQueue: boolean;
        PcRelationship: {
          StringId: string;
        };
        StatEffect: {
          StringId: string;
        };
      };
      Dungeon: {
        StringId: string;
      };
      EntranceCost: {
        Asset: {
          StringId: string;
        };
        Count: number;
      };
      EntranceAreaList: Array<string>;
      FieldType: string;
      PcLevel: number;
      CombatPower: number;
      Order: number;
      MainSubzone: {
        StringId: string;
      };
      MainRewardItems: Array<{
        StringId: string;
      }>;
      CanScheduling: boolean;
      ID: number;
    };
    Map_RGD01_02: {
      Title: {
        StringId: string;
      };
      Zone: {
        Disable: boolean;
        Resource: {
          StringId: string;
        };
        DesignLevel: {
          AssetPathName: string;
          SubPathString: string;
        };
        LoadingInfo: {
          Image: {
            StringId: string;
          };
          Text: {
            StringId: string;
          };
        };
        FeatureActivation: {
          StringId: string;
        };
        Channel: {
          Min: number;
          Max: number;
        };
        UseWaitingQueue: boolean;
        PcRelationship: {
          StringId: string;
        };
        StatEffect: {
          StringId: string;
        };
      };
      Dungeon: {
        StringId: string;
      };
      EntranceCost: {
        Asset: {
          StringId: string;
        };
        Count: number;
      };
      EntranceAreaList: Array<string>;
      FieldType: string;
      PcLevel: number;
      CombatPower: number;
      Order: number;
      MainSubzone: {
        StringId: string;
      };
      MainRewardItems: Array<{
        StringId: string;
      }>;
      CanScheduling: boolean;
      ID: number;
    };
    Map_RGD01_03: {
      Title: {
        StringId: string;
      };
      Zone: {
        Disable: boolean;
        Resource: {
          StringId: string;
        };
        DesignLevel: {
          AssetPathName: string;
          SubPathString: string;
        };
        LoadingInfo: {
          Image: {
            StringId: string;
          };
          Text: {
            StringId: string;
          };
        };
        FeatureActivation: {
          StringId: string;
        };
        Channel: {
          Min: number;
          Max: number;
        };
        UseWaitingQueue: boolean;
        PcRelationship: {
          StringId: string;
        };
        StatEffect: {
          StringId: string;
        };
      };
      Dungeon: {
        StringId: string;
      };
      EntranceCost: {
        Asset: {
          StringId: string;
        };
        Count: number;
      };
      EntranceAreaList: Array<string>;
      FieldType: string;
      PcLevel: number;
      CombatPower: number;
      Order: number;
      MainSubzone: {
        StringId: string;
      };
      MainRewardItems: Array<{
        StringId: string;
      }>;
      CanScheduling: boolean;
      ID: number;
    };
    Map_RGD01_04: {
      Title: {
        StringId: string;
      };
      Zone: {
        Disable: boolean;
        Resource: {
          StringId: string;
        };
        DesignLevel: {
          AssetPathName: string;
          SubPathString: string;
        };
        LoadingInfo: {
          Image: {
            StringId: string;
          };
          Text: {
            StringId: string;
          };
        };
        FeatureActivation: {
          StringId: string;
        };
        Channel: {
          Min: number;
          Max: number;
        };
        UseWaitingQueue: boolean;
        PcRelationship: {
          StringId: string;
        };
        StatEffect: {
          StringId: string;
        };
      };
      Dungeon: {
        StringId: string;
      };
      EntranceCost: {
        Asset: {
          StringId: string;
        };
        Count: number;
      };
      EntranceAreaList: Array<string>;
      FieldType: string;
      PcLevel: number;
      CombatPower: number;
      Order: number;
      MainSubzone: {
        StringId: string;
      };
      MainRewardItems: Array<{
        StringId: string;
      }>;
      CanScheduling: boolean;
      ID: number;
    };
    Map_RGD01_05: {
      Title: {
        StringId: string;
      };
      Zone: {
        Disable: boolean;
        Resource: {
          StringId: string;
        };
        DesignLevel: {
          AssetPathName: string;
          SubPathString: string;
        };
        LoadingInfo: {
          Image: {
            StringId: string;
          };
          Text: {
            StringId: string;
          };
        };
        FeatureActivation: {
          StringId: string;
        };
        Channel: {
          Min: number;
          Max: number;
        };
        UseWaitingQueue: boolean;
        PcRelationship: {
          StringId: string;
        };
        StatEffect: {
          StringId: string;
        };
      };
      Dungeon: {
        StringId: string;
      };
      EntranceCost: {
        Asset: {
          StringId: string;
        };
        Count: number;
      };
      EntranceAreaList: Array<string>;
      FieldType: string;
      PcLevel: number;
      CombatPower: number;
      Order: number;
      MainSubzone: {
        StringId: string;
      };
      MainRewardItems: Array<{
        StringId: string;
      }>;
      CanScheduling: boolean;
      ID: number;
    };
    Map_RGD01_06: {
      Title: {
        StringId: string;
      };
      Zone: {
        Disable: boolean;
        Resource: {
          StringId: string;
        };
        DesignLevel: {
          AssetPathName: string;
          SubPathString: string;
        };
        LoadingInfo: {
          Image: {
            StringId: string;
          };
          Text: {
            StringId: string;
          };
        };
        FeatureActivation: {
          StringId: string;
        };
        Channel: {
          Min: number;
          Max: number;
        };
        UseWaitingQueue: boolean;
        PcRelationship: {
          StringId: string;
        };
        StatEffect: {
          StringId: string;
        };
      };
      Dungeon: {
        StringId: string;
      };
      EntranceCost: {
        Asset: {
          StringId: string;
        };
        Count: number;
      };
      EntranceAreaList: Array<string>;
      FieldType: string;
      PcLevel: number;
      CombatPower: number;
      Order: number;
      MainSubzone: {
        StringId: string;
      };
      MainRewardItems: Array<{
        StringId: string;
      }>;
      CanScheduling: boolean;
      ID: number;
    };
    Map_RGD01_07: {
      Title: {
        StringId: string;
      };
      Zone: {
        Disable: boolean;
        Resource: {
          StringId: string;
        };
        DesignLevel: {
          AssetPathName: string;
          SubPathString: string;
        };
        LoadingInfo: {
          Image: {
            StringId: string;
          };
          Text: {
            StringId: string;
          };
        };
        FeatureActivation: {
          StringId: string;
        };
        Channel: {
          Min: number;
          Max: number;
        };
        UseWaitingQueue: boolean;
        PcRelationship: {
          StringId: string;
        };
        StatEffect: {
          StringId: string;
        };
      };
      Dungeon: {
        StringId: string;
      };
      EntranceCost: {
        Asset: {
          StringId: string;
        };
        Count: number;
      };
      EntranceAreaList: Array<string>;
      FieldType: string;
      PcLevel: number;
      CombatPower: number;
      Order: number;
      MainSubzone: {
        StringId: string;
      };
      MainRewardItems: Array<{
        StringId: string;
      }>;
      CanScheduling: boolean;
      ID: number;
    };
  };
}>;

export type MWorldFieldData = Array<{
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
    Map_WD01: {
      Zone: {
        Disable: boolean;
        Resource: {
          StringId: string;
        };
        DesignLevel: {
          AssetPathName: string;
          SubPathString: string;
        };
        LoadingInfo: {
          Image: {
            StringId: string;
          };
          Text: {
            StringId: string;
          };
        };
        FeatureActivation: {
          StringId: string;
        };
        Channel: {
          Min: number;
          Max: number;
        };
        UseWaitingQueue: boolean;
        PcRelationship: {
          StringId: string;
        };
        StatEffect: {
          StringId: string;
        };
      };
      EntranceCost: {
        Asset: {
          StringId: string;
        };
        Count: number;
      };
      Image: {
        DetailInfo: {
          AssetPathName: string;
          SubPathString: string;
        };
        Tab: {
          AssetPathName: string;
          SubPathString: string;
        };
      };
      MainRewardItems: Array<{
        StringId: string;
      }>;
      ID: number;
    };
    Map_WD01_Low: {
      Zone: {
        Disable: boolean;
        Resource: {
          StringId: string;
        };
        DesignLevel: {
          AssetPathName: string;
          SubPathString: string;
        };
        LoadingInfo: {
          Image: {
            StringId: string;
          };
          Text: {
            StringId: string;
          };
        };
        FeatureActivation: {
          StringId: string;
        };
        Channel: {
          Min: number;
          Max: number;
        };
        UseWaitingQueue: boolean;
        PcRelationship: {
          StringId: string;
        };
        StatEffect: {
          StringId: string;
        };
      };
      EntranceCost: {
        Asset: {
          StringId: string;
        };
        Count: number;
      };
      Image: {
        DetailInfo: {
          AssetPathName: string;
          SubPathString: string;
        };
        Tab: {
          AssetPathName: string;
          SubPathString: string;
        };
      };
      MainRewardItems: Array<{
        StringId: string;
      }>;
      ID: number;
    };
  };
}>;
