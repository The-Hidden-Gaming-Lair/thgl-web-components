export type DT_PaldexDistributionData = Array<{
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
    [id: string]: {
      dayTimeLocations: {
        locations: Array<{
          X: number;
          Y: number;
          Z: number;
        }>;
        Radius: number;
      };
      nightTimeLocations: {
        locations: Array<{
          X: number;
          Y: number;
          Z: number;
        }>;
        Radius: number;
      };
    };
  };
}>;

export type DT_PalNameText = Array<{
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
      TextData: {
        Namespace: string;
        Key: string;
        SourceString: string;
        LocalizedString: string;
      };
    };
  };
}>;

export type DT_PalLongDescriptionText = Array<{
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
      TextData: {
        Namespace: string;
        Key: string;
        SourceString: string;
        LocalizedString: string;
      };
    };
  };
}>;

export type DT_PalMonsterParameter = Array<{
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
      OverrideNameTextId: string;
      NamePrefixID: string;
      OverridePartnerSkillTextID: string;
      IsPal: boolean;
      Tribe: string;
      BPClass: string;
      ZukanIndex: number;
      ZukanIndexSuffix: string;
      Size: string;
      Rarity: number;
      ElementType1: string;
      ElementType2: string;
      GenusCategory: string;
      Organization: string;
      Weapon: string;
      WeaponEquip: boolean;
      HP: number;
      MeleeAttack: number;
      ShotAttack: number;
      Defense: number;
      Support: number;
      CraftSpeed: number;
      EnemyMaxHPRate: number;
      EnemyReceiveDamageRate: number;
      EnemyInflictDamageRate: number;
      CaptureRateCorrect: number;
      ExpRatio: number;
      Price: number;
      StatusResistUpRate: number;
      AIResponse: string;
      AISightResponse: string;
      SlowWalkSpeed: number;
      WalkSpeed: number;
      RunSpeed: number;
      RideSprintSpeed: number;
      TransportSpeed: number;
      IsBoss: boolean;
      IsTowerBoss: boolean;
      IsRaidBoss: boolean;
      UseBossHPGauge: boolean;
      BattleBGM: string;
      IgnoreLeanBack: boolean;
      IgnoreBlowAway: boolean;
      MaxFullStomach: number;
      FullStomachDecreaseRate: number;
      FoodAmount: number;
      ViewingDistance: number;
      ViewingAngle: number;
      HearingRate: number;
      NooseTrap: boolean;
      Nocturnal: boolean;
      BiologicalGrade: number;
      Predator: boolean;
      Edible: boolean;
      Stamina: number;
      MaleProbability: number;
      CombiRank: number;
      WorkSuitability_EmitFlame: number;
      WorkSuitability_Watering: number;
      WorkSuitability_Seeding: number;
      WorkSuitability_GenerateElectricity: number;
      WorkSuitability_Handcraft: number;
      WorkSuitability_Collection: number;
      WorkSuitability_Deforest: number;
      WorkSuitability_Mining: number;
      WorkSuitability_OilExtraction: number;
      WorkSuitability_ProductMedicine: number;
      WorkSuitability_Cool: number;
      WorkSuitability_Transport: number;
      WorkSuitability_MonsterFarm: number;
      PassiveSkill1: string;
      PassiveSkill2: string;
      PassiveSkill3: string;
      PassiveSkill4: string;
    };
  };
}>;

export type DT_PalCharacterIconDataTable = Array<{
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
      Icon: {
        AssetPathName: string;
        SubPathString: string;
      };
    };
  };
}>;

export type PL_MainWorld5 = Array<{
  Type: string;
  Name: string;
  Outer?: string;
  Class: string;
  Properties?: {
    PalSoundPlayer?: {
      ObjectName: string;
      ObjectPath: string;
    };
    PalLimitVolumeBox?: {
      ObjectName: string;
      ObjectPath: string;
    };
    Glow?: {
      ObjectName: string;
      ObjectPath: string;
    };
    WarpPoint?: {
      ObjectName: string;
      ObjectPath: string;
    };
    IndicatorOrigin?: {
      ObjectName: string;
      ObjectPath: string;
    };
    BP_InteractableBox?: {
      ObjectName: string;
      ObjectPath: string;
    };
    Mesh?: {
      ObjectName: string;
      ObjectPath: string;
    };
    BuildWorkableBounds?: {
      ObjectName: string;
      ObjectPath: string;
    };
    CheckOverlapCollision?: {
      ObjectName: string;
      ObjectPath: string;
    };
    Root?: {
      ObjectName: string;
      ObjectPath: string;
    };
    FastTravelPointID?: string;
    BossType?: string;
    LevelObjectInstanceId?: string;
    RootComponent?: {
      ObjectName: string;
      ObjectPath: string;
    };
    BlueprintCreatedComponents?: Array<
      | {
          ObjectName: string;
          ObjectPath: string;
        }
      | undefined
    >;
    RespawnPointID?: string;
    MaterialBillboard?: {
      ObjectName: string;
      ObjectPath: string;
    };
    ObtainFXOrigin?: {
      ObjectName: string;
      ObjectPath: string;
    };
    StaticMesh_Base?: {
      ObjectName: string;
      ObjectPath: string;
    };
    AuraEffect?: {
      ObjectName: string;
      ObjectPath: string;
    };
    BP_InteractableSphere?: {
      ObjectName: string;
      ObjectPath: string;
    };
    StaticMesh_Gem?: {
      ObjectName: string;
      ObjectPath: string;
    };
    DefaultSceneRoot?: {
      ObjectName: string;
      ObjectPath: string;
    };
    SkeletalMesh?: {
      ObjectName: string;
      ObjectPath: string;
    };
    NoteRowName?: {
      Key: string;
    };
    NS_GoddessStatue_Glow?: {
      ObjectName: string;
      ObjectPath: string;
    };
    BP_InteractableCapsule?: {
      ObjectName: string;
      ObjectPath: string;
    };
    AttachParent?: {
      ObjectName: string;
      ObjectPath: string;
    };
    UCSSerializationIndex?: number;
    bNetAddressable?: boolean;
    CreationMethod?: string;
    OnComponentBeginOverlap?: {
      InvocationList: Array<{
        Object: {
          ObjectName: string;
          ObjectPath: string;
        };
        FunctionName: string;
      }>;
    };
    OnComponentEndOverlap?: {
      InvocationList: Array<{
        Object: {
          ObjectName: string;
          ObjectPath: string;
        };
        FunctionName: string;
      }>;
    };
    HeatLevel_DayTime?: number;
    HeatLevel_NightTime?: number;
    BoxExtent?: {
      X: number;
      Y: number;
      Z: number;
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
    BottomLayer?: {
      ObjectName: string;
      ObjectPath: string;
    };
    UnlitOpaque?: {
      ObjectName: string;
      ObjectPath: string;
    };
    LitOpaque?: {
      ObjectName: string;
      ObjectPath: string;
    };
    UnlitTranslucent?: {
      ObjectName: string;
      ObjectPath: string;
    };
    LitTranlucent?: {
      ObjectName: string;
      ObjectPath: string;
    };
    LitMasked?: {
      ObjectName: string;
      ObjectPath: string;
    };
    UnlitMasked?: {
      ObjectName: string;
      ObjectPath: string;
    };
    StaticMeshComponent?: {
      ObjectName: string;
      ObjectPath: string;
    };
    bEnableAutoLODGeneration?: boolean;
    StaticMesh: any;
    EditSpawnParameter?: {
      RespawnProbability: number;
    };
    bEditSpawnParameter?: boolean;
    SpawnAreaIds?: Array<{
      Key: string;
    }>;
    Niagara?: {
      ObjectName: string;
      ObjectPath: string;
    };
    DeadItemDropPoint?: {
      ObjectName: string;
      ObjectPath: string;
    };
    Scene?: {
      ObjectName: string;
      ObjectPath: string;
    };
    DataLayerAsset?: {
      ObjectName: string;
      ObjectPath: string;
    };
    EnemySpawnerSoftClass?: {
      AssetPathName: string;
      SubPathString: string;
    };
    RespawnCoolTimeMinutesAfterBossDefeated?: number;
    DungeonNameRowHandle?: {
      RowName: string;
    };
    Box?: {
      ObjectName: string;
      ObjectPath: string;
    };
    RelatedDataLayerAsset?: {
      ObjectName: string;
      ObjectPath: string;
    };
    BoxBrush?: {
      ObjectName: string;
      ObjectPath: string;
    };
    SceneComponent?: {
      ObjectName: string;
      ObjectPath: string;
    };
    EasySelectBillboard?: {
      ObjectName: string;
      ObjectPath: string;
    };
    RandomStream?: {
      InitialSeed?: number;
      Seed: number;
    };
    PlacementItems?: Array<{
      ItemType: string;
      Actor: {
        ObjectName: string;
        ObjectPath: string;
      };
      Mesh: any;
      Weight: number;
    }>;
    Amount?: number;
    Seed?: number;
    PlacementStyle?: string;
    bGenerateOverlapEvents?: boolean;
    RelativeScale3D?: {
      X: number;
      Y: number;
      Z: number;
    };
    bCanEverAffectNavigation?: boolean;
    AreaClassOverride?: {
      ObjectName: string;
      ObjectPath: string;
    };
    bUseSystemDefaultObstacleAreaClass?: boolean;
    BodyInstance?: {
      MaxAngularVelocity?: number;
      ObjectType?: string;
      CollisionProfileName?: string;
      CollisionResponses?: {
        ResponseArray: Array<{
          Channel: string;
          Response: string;
        }>;
      };
      bEnableGravity?: boolean;
    };
    LineThickness?: number;
    bVisibleInReflectionCaptures?: boolean;
    bVisibleInRealTimeSkyCaptures?: boolean;
    bVisibleInRayTracing?: boolean;
    bHiddenInSceneCapture?: boolean;
    CanCharacterStepUpOn?: string;
    Location?: {
      X: number;
      Y: number;
      Z: number;
    };
    Rotation?: {
      Pitch: number;
      Yaw: number;
      Roll: number;
    };
    DefaultInstance?: {
      ObjectType: string;
      CollisionEnabled?: string;
      CollisionProfileName: string;
      CollisionResponses: {
        ResponseArray: Array<{
          Channel: string;
          Response: string;
        }>;
      };
    };
    CollisionTraceFlag?: string;
    AggGeom?: {
      ConvexElems: Array<{
        VertexData: Array<{
          X: number;
          Y: number;
          Z: number;
        }>;
        IndexData: Array<number>;
        ElemBox: {
          Min: {
            X: number;
            Y: number;
            Z: number;
          };
          Max: {
            X: number;
            Y: number;
            Z: number;
          };
          IsValid: number;
        };
        Transform: {
          Rotation: {
            X: number;
            Y: number;
            Z: number;
            W: number;
            IsNormalized: boolean;
            Size: number;
            SizeSquared: number;
          };
          Translation: {
            X: number;
            Y: number;
            Z: number;
          };
          Scale3D: {
            X: number;
            Y: number;
            Z: number;
          };
        };
        RestOffset: number;
        Name: string;
        bContributeToMass: boolean;
        CollisionEnabled: string;
      }>;
    };
    bGenerateMirroredCollision?: boolean;
    PhysicsType?: string;
    StopWhenOwnerDestroyed?: boolean;
  };
  Template?: {
    ObjectName: string;
    ObjectPath: string;
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
    Struct: {
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
  BodySetupGuid?: string;
  CookedFormatData?: {
    PhysXPC: {
      BulkDataFlags: string;
      ElementCount: number;
      SizeOnDisk: number;
      OffsetInFile: string;
    };
  };
}>;

export type DT_MapRespawnPointInfoText = Array<{
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
      TextData: {
        Namespace: string;
        Key: string;
        SourceString: string;
        LocalizedString: string;
      };
    };
  };
}>;

export type DT_UI_Common_Text = Array<{
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
      TextData: {
        Namespace: string;
        Key: string;
        SourceString: string;
        LocalizedString: string;
      };
    };
  };
}>;
