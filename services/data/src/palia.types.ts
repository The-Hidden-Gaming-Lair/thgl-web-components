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

export type Bug = Array<{
  Type: string;
  Name: string;
  Outer?: string;
  Class: string;
  Template?: {
    ObjectName: string;
    ObjectPath: string;
  };
  Properties?: {
    Vitals: any;
    AttributeSet?: {
      ObjectName: string;
      ObjectPath: string;
    };
    OwnerVitals?: {
      ObjectName: string;
      ObjectPath: string;
    };
    AttachParent?: {
      ObjectName: string;
      ObjectPath: string;
    };
    RelativeLocation?: {
      X: number;
      Y: number;
      Z: number;
    };
    RelativeRotation?: {
      Pitch: number;
      Yaw: number;
      Roll: number;
    };
    RelativeScale3D?: {
      X: number;
      Y: number;
      Z: number;
    };
    DefaultSceneRootNode?: {
      ObjectName: string;
      ObjectPath: string;
    };
    ComponentClass?: {
      ObjectName: string;
      ObjectPath: string;
    };
    ComponentTemplate?: {
      ObjectName: string;
      ObjectPath: string;
    };
    VariableGuid?: string;
    InternalVariableName?: string;
    OverrideParameters?: {};
    RewardFinal?: {
      ItemType: {
        ObjectName: string;
        ObjectPath: string;
      };
      Loot: {
        DataTable: {
          ObjectName: string;
          ObjectPath: string;
        };
        RowName: string;
      };
      SkillXpEarnings: {
        RowName: string;
      };
    };
    Records?: Array<{
      ComponentClass: {
        ObjectName: string;
        ObjectPath: string;
      };
      ComponentTemplate: {
        ObjectName: string;
        ObjectPath: string;
      };
      ComponentKey: {
        OwnerClass: {
          ObjectName: string;
          ObjectPath: string;
        };
        SCSVariableName: string;
        AssociatedGuid: string;
      };
      CookedComponentInstancingData: {
        ChangedPropertyList: Array<any>;
        bHasValidCookedData: boolean;
      };
    }>;
    SprintSpeedMultiplier?: number;
    MaxWalkSpeed?: number;
    CapsuleHalfHeight?: number;
    CapsuleRadius?: number;
    OverrideInsectMesh?: {
      ObjectName: string;
      ObjectPath: string;
    };
    OverrideInsectMaterial?: {
      ObjectName: string;
      ObjectPath: string;
    };
    rarity_type?: string;
    move_animSpeed?: number;
    Ak_Gen_Loop_Sound?: {
      ObjectName: string;
      ObjectPath: string;
    };
    Ak_Gen_Loop_Vocal?: {
      ObjectName: string;
      ObjectPath: string;
    };
    Max_Insect_Speed?: number;
    CreatureConfig?: {
      RowName: string;
    };
    CombatState?: {
      ObjectName: string;
      ObjectPath: string;
    };
    LootComponent?: {
      ObjectName: string;
      ObjectPath: string;
    };
    ValeriaGAS?: {
      ObjectName: string;
      ObjectPath: string;
    };
    Death?: {
      ObjectName: string;
      ObjectPath: string;
    };
    Despawn?: {
      ObjectName: string;
      ObjectPath: string;
    };
    HitReact?: {
      ObjectName: string;
      ObjectPath: string;
    };
    ParticipationTracking?: {
      ObjectName: string;
      ObjectPath: string;
    };
    EscapeValueForInsectCatching?: number;
    Mesh?: {
      ObjectName: string;
      ObjectPath: string;
    };
    MovementComponent?: {
      ObjectName: string;
      ObjectPath: string;
    };
    CapsuleComponent?: {
      ObjectName: string;
      ObjectPath: string;
    };
    VisibilityComponent?: {
      ObjectName: string;
      ObjectPath: string;
    };
    RootComponent?: {
      ObjectName: string;
      ObjectPath: string;
    };
    SimpleConstructionScript?: {
      ObjectName: string;
      ObjectPath: string;
    };
    InheritableComponentHandler?: {
      ObjectName: string;
      ObjectPath: string;
    };
  };
  Super?: {
    ObjectName: string;
    ObjectPath: string;
  };
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

export type DA_ItemType = Array<{
  Type: string;
  Name: string;
  Class: string;
  Properties: {
    MaxStackSize: number;
    DisplayName: {
      Namespace: string;
      Key: string;
      SourceString: string;
      LocalizedString: string;
    };
    Description: {
      Namespace: string;
      Key: string;
      SourceString: string;
      LocalizedString: string;
    };
    StarQualityDescription: Array<{
      Namespace: string;
      Key: string;
      SourceString: string;
      LocalizedString: string;
    }>;
    ItemIcon: {
      AssetPathName: string;
      SubPathString: string;
    };
    Placement: {
      bCanBePlaced: boolean;
      bPlacementRequiresStarQuality: boolean;
      Placeable: {
        AssetPathName: string;
        SubPathString: string;
      };
      PlacementExtents: {
        X: number;
        Y: number;
        Z: number;
      };
      PlacementAllowedTags: {
        Type: string;
        GameplayTags: {
          GameplayTags: Array<string>;
        };
      };
    };
    bIsSimpleDecor: boolean;
    Category: string;
    Rarity: string;
    IngredientConfigName: string;
    SellValueConfig: {
      DataTable: {
        ObjectName: string;
        ObjectPath: string;
      };
      RowName: string;
    };
    PlayerRequestConfig: {
      MaxNumberPerRequest: number;
    };
    RequestRewardType: string;
    RequestRewardAmount: number;
    AudioConfig: {
      DataTable: {
        ObjectName: string;
        ObjectPath: string;
      };
      RowName: string;
    };
    Tags: {
      GameplayTags: Array<string>;
    };
    PersistId: number;
  };
}>;
