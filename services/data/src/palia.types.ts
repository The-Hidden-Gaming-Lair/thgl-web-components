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

export type Forage = Array<{
  Type: string;
  Name: string;
  Class: string;
  Super?: {
    ObjectName: string;
    ObjectPath: string;
  };
  Properties?: {
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
    SimpleConstructionScript?: {
      ObjectName: string;
      ObjectPath: string;
    };
    InheritableComponentHandler?: {
      ObjectName: string;
      ObjectPath: string;
    };
    SM_gatherable?: {
      ObjectName: string;
      ObjectPath: string;
    };
    override_meshMaterial?: boolean;
    mat_gatherable?: Array<{
      ObjectName: string;
      ObjectPath: string;
    }>;
    "Sfx Idle Loop"?: {
      ObjectName: string;
      ObjectPath: string;
    };
    ItemType?: {
      ObjectName: string;
      ObjectPath: string;
    };
    ItemAmount?: number;
    AdditionalRewards?: Array<{
      PercentChance: number;
      rewards: Array<{
        PlayerTagRequirements: Array<any>;
        OverrideIsCriticalReward: string;
        OverrideIsPermanentUnlock: string;
        ItemType: any;
        ItemAmount: number;
        AdditionalItems: Array<any>;
        QualityStars: number;
        RecipeConfig: {
          DataTable: any;
          RowName: string;
        };
        Loot: {
          DataTable: {
            ObjectName: string;
            ObjectPath: string;
          };
          RowName: string;
        };
        DisallowItemsGrantingAccomplishmentProgress: boolean;
        VitalType: string;
        VitalAmount: number;
        VitalRewardIsUpgrade: boolean;
        CurrencyConfig: any;
        CurrencyAmount: number;
        RelationshipVillager: {
          DataTable: any;
          RowName: string;
        };
        RelationshipVillagerCore: {
          DataTable: any;
          RowName: string;
        };
        FriendshipChange: number;
        RomanceChange: number;
        RomanceStateChange: string;
        MailMessage: {
          DataTable: any;
          RowName: string;
        };
        MailMessageToDeleteIfUnread: {
          DataTable: any;
          RowName: string;
        };
        GiftPreferenceRevealed: {
          Villager: {
            DataTable: any;
            RowName: string;
          };
          GiftPreference: {
            DataTable: any;
            RowName: string;
          };
        };
        VisitToGrant: {
          VillagerConfigId: number;
        };
        BuffConfig: {
          DataTable: any;
          RowName: string;
        };
        SkillXpEarnings: {
          DataTable: {
            ObjectName: string;
            ObjectPath: string;
          };
          RowName: string;
        };
        PlayerTagWriteback: Array<any>;
        GrantBagUpgrade: boolean;
        BagUpgradeType: string;
        ItemUseChange: {
          UseChange: number;
          CurrentlyEquipped: boolean;
        };
        LanternFuelTime: number;
        NameplateReward: string;
        GrantedHousingSlots: Array<any>;
        QuestToStart: {
          AssetPathName: string;
          SubPathString: string;
        };
      }>;
    }>;
    LocalHasBeenGatheredMaterials?: Array<{
      AssetPathName: string;
      SubPathString: string;
    }>;
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
    OverrideParameters?: {
      ParameterData: Array<number>;
    };
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
  Template?: {
    ObjectName: string;
    ObjectPath: string;
  };
  Outer?: string;
}>;

export type MiningNode = Array<{
  Type: string;
  Name: string;
  Class: string;
  Super?: {
    ObjectName: string;
    ObjectPath: string;
  };
  Properties?: {
    OwnerVitals?: {
      ObjectName: string;
      ObjectPath: string;
    };
    bTrackable?: boolean;
    SphereRadius?: number;
    RelativeLocation?: {
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
    SimpleConstructionScript?: {
      ObjectName: string;
      ObjectPath: string;
    };
    InheritableComponentHandler?: {
      ObjectName: string;
      ObjectPath: string;
    };
    mineNode_type?: string;
    mineNode_size?: string;
    SM_miningNode?: {
      ObjectName: string;
      ObjectPath: string;
    };
    Mat_miningNode?: Array<{
      ObjectName: string;
      ObjectPath: string;
    }>;
    pos_offsetMesh?: {
      X: number;
      Y: number;
      Z: number;
    };
    ExplosionSFX?: {
      ObjectName: string;
      ObjectPath: string;
    };
    SFX_Hit?: {
      ObjectName: string;
      ObjectPath: string;
    };
    ValeriaGAS?: {
      ObjectName: string;
      ObjectPath: string;
    };
    Vitals: any;
    RequirementConfig?: {
      ItemTags: {
        GameplayTags: {
          GameplayTags: Array<string>;
        };
      };
    };
    RewardFinal?: {
      Loot: {
        DataTable: {
          ObjectName: string;
          ObjectPath: string;
        };
        RowName: string;
      };
      SkillXpEarnings: {
        DataTable: {
          ObjectName: string;
          ObjectPath: string;
        };
        RowName: string;
      };
    };
    ChestTemplate?: {
      ObjectName: string;
      ObjectPath: string;
    };
    RewardPerVital?: {
      Loot: {
        DataTable: {
          ObjectName: string;
          ObjectPath: string;
        };
        RowName: string;
      };
    };
    LootPerVitalAmount?: number;
    Tags?: {
      GameplayTags: Array<string>;
    };
    OnChangedContext?: {
      InvocationList: Array<{
        Object: {
          ObjectName: string;
          ObjectPath: string;
        };
        FunctionName: string;
      }>;
    };
    AttributeSet?: {
      ObjectName: string;
      ObjectPath: string;
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
  Template?: {
    ObjectName: string;
    ObjectPath: string;
  };
  Outer?: string;
}>;

export type Tree = Array<{
  Type: string;
  Name: string;
  Class: string;
  Super?: {
    ObjectName: string;
    ObjectPath: string;
  };
  Properties?: {
    OwnerVitals?: {
      ObjectName: string;
      ObjectPath: string;
    };
    StaticMesh?: {
      ObjectName: string;
      ObjectPath: string;
    };
    SphereRadius?: number;
    RelativeLocation?: {
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
    SimpleConstructionScript?: {
      ObjectName: string;
      ObjectPath: string;
    };
    InheritableComponentHandler?: {
      ObjectName: string;
      ObjectPath: string;
    };
    SM_Plant?: {
      ObjectName: string;
      ObjectPath: string;
    };
    plant_LocationOffset?: {
      X: number;
      Y: number;
      Z: number;
    };
    leaf_type?: string;
    leaf_size?: number;
    leaf_spawnAmount?: number;
    dust_size?: number;
    dust_spawnAmount?: number;
    branch_size?: number;
    branch_spawnAmount?: number;
    trunk_spawnAmount?: number;
    trunk_size?: {
      X: number;
      Y: number;
      Z: number;
    };
    AkOneShot?: {
      ObjectName: string;
      ObjectPath: string;
    };
    tree_size?: string;
    decal_MaxSize?: {
      X: number;
      Y: number;
      Z: number;
    };
    heal_radius?: number;
    heal_offset?: number;
    FlowClass?: {
      ObjectName: string;
      ObjectPath: string;
    };
    delay_destroyMe?: number;
    ValeriaGAS?: {
      ObjectName: string;
      ObjectPath: string;
    };
    Vitals: any;
    RequirementConfig?: {
      ItemTags: {
        GameplayTags: {
          GameplayTags: Array<string>;
        };
      };
    };
    RewardFinal?: {
      Loot: {
        DataTable: {
          ObjectName: string;
          ObjectPath: string;
        };
        RowName: string;
      };
    };
    ChestTemplate?: {
      ObjectName: string;
      ObjectPath: string;
    };
    RewardPerVital?: {
      Loot: {
        DataTable: {
          ObjectName: string;
          ObjectPath: string;
        };
        RowName: string;
      };
      SkillXpEarnings: {
        DataTable: {
          ObjectName: string;
          ObjectPath: string;
        };
        RowName: string;
      };
    };
    LootPerVitalAmount?: number;
    Tags?: {
      GameplayTags: Array<string>;
    };
    OnChangedContext?: {
      InvocationList: Array<{
        Object: {
          ObjectName: string;
          ObjectPath: string;
        };
        FunctionName: string;
      }>;
    };
    AttributeSet?: {
      ObjectName: string;
      ObjectPath: string;
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
    OverrideParameters?: {};
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
  Outer?: string;
  Template?: {
    ObjectName: string;
    ObjectPath: string;
  };
}>;

export type Creature = Array<{
  Type: string;
  Name: string;
  Outer?: string;
  Class: string;
  Template?: {
    ObjectName: string;
    ObjectPath: string;
  };
  Super?: {
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
    AnimClass?: {
      ObjectName: string;
      ObjectPath: string;
    };
    SkeletalMesh?: {
      ObjectName: string;
      ObjectPath: string;
    };
    SkinnedAsset?: {
      ObjectName: string;
      ObjectPath: string;
    };
    bCastCapsuleDirectShadow?: boolean;
    AttachParent?: {
      ObjectName: string;
      ObjectPath: string;
    };
    RelativeLocation?: {
      X: number;
      Y: number;
      Z: number;
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
      ItemType: any;
      ItemAmount: number;
      AdditionalItems: Array<any>;
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
    ChestTemplate?: {
      ObjectName: string;
      ObjectPath: string;
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
    CreatureAudioSet?: {
      ObjectName: string;
      ObjectPath: string;
    };
    CapsuleHalfHeight?: number;
    CapsuleRadius?: number;
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
    AIControllerClass?: {
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

export type GrowableTree = Array<{
  Type: string;
  Name: string;
  Class: string;
  Super?: {
    ObjectName: string;
    ObjectPath: string;
  };
  Properties?: {
    OwnerVitals?: {
      ObjectName: string;
      ObjectPath: string;
    };
    StaticMesh?: {
      ObjectName: string;
      ObjectPath: string;
    };
    OverrideMaterials?: Array<{
      ObjectName: string;
      ObjectPath: string;
    }>;
    RuntimeVirtualTextures?: Array<{
      ObjectName: string;
      ObjectPath: string;
    }>;
    VirtualTextureRenderPassType?: string;
    RelativeLocation?: {
      X: number;
      Y: number;
      Z: number;
    };
    RelativeScale3D?: {
      X: number;
      Y: number;
      Z: number;
    };
    RootNodes?: Array<{
      ObjectName: string;
      ObjectPath: string;
    }>;
    AllNodes?: Array<{
      ObjectName: string;
      ObjectPath: string;
    }>;
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
    ParentComponentOrVariableName?: string;
    ParentComponentOwnerClassName?: string;
    SimpleConstructionScript?: {
      ObjectName: string;
      ObjectPath: string;
    };
    InheritableComponentHandler?: {
      ObjectName: string;
      ObjectPath: string;
    };
    DisableAmbientAudio?: boolean;
    ValeriaGAS?: {
      ObjectName: string;
      ObjectPath: string;
    };
    Vitals?: {
      ObjectName: string;
      ObjectPath: string;
    };
    RequiredTimesToWaterForReward?: number;
    IntervalStartsBeforeWater?: boolean;
    ItemTypeToReward?: {
      AssetPathName: string;
      SubPathString: string;
    };
    ItemType?: {
      ObjectName: string;
      ObjectPath: string;
    };
    ItemAmount?: number;
    OnChangedContext?: {
      InvocationList: Array<{
        Object: {
          ObjectName: string;
          ObjectPath: string;
        };
        FunctionName: string;
      }>;
    };
    AttributeSet?: {
      ObjectName: string;
      ObjectPath: string;
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
    InteractPlateUseSphereLocation?: boolean;
    OverrideParameters?: {};
    bAlwaysAddHomeOwnerToParticipantList?: boolean;
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
  Template?: {
    ObjectName: string;
    ObjectPath: string;
  };
  Outer?: string;
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

export type DT_SpawnRarityConfigs = Array<{
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
      BaseActor: {
        AssetPathName: string;
        SubPathString: string;
      };
      BaseRarity: string;
      StarQualityVariant: {
        AssetPathName: string;
        SubPathString: string;
      };
      StarQualityChance: number;
    }
  >;
}>;

export type DT_LootBundleConfigs = Array<{
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
      bEnabled: boolean;
      LootBundle: Array<{
        DataTable: {
          ObjectName: string;
          ObjectPath: string;
        };
        RowName: string;
      }>;
      bAwardRecipesAsInspiration: boolean;
      InspirationOptionCount: number;
    }
  >;
}>;

export type DT_LootPoolConfigs = Array<{
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
      PersistId: number;
      bEnabled: boolean;
      BadLuckTrackingThreshold: number;
      bShouldUseSharedLoot: boolean;
      LootPool: Array<{
        Weight: number;
        Requirements: {
          TimeOfDay: {
            Periods: number;
            MinTime: {
              Hour: number;
              Minute: number;
            };
            MaxTime: {
              Hour: number;
              Minute: number;
            };
          };
          FriendshipRequirements: Array<any>;
          RomanceRequirements: Array<any>;
          PlayerTagRequirements: Array<any>;
          QuestPrereqs: Array<any>;
          RequiredItems: Array<any>;
          VitalRequirement: {
            VitalType: string;
            MinimumAmount: number;
          };
          RequiredAccomplishments: Array<any>;
          RequiredRecipes: Array<any>;
          WeatherGameStates: Array<any>;
          ContentBatch: {
            AssetPathName: string;
            SubPathString: string;
          };
        };
        ItemType?: {
          ObjectName: string;
          ObjectPath: string;
        };
        ItemAmount: number;
        QualityStars: number;
        bTrackedForBadLuck: boolean;
        RecipeConfig: {
          DataTable: any;
          RowName: string;
        };
        CurrencyConfig: any;
        CurrencyAmount: number;
      }>;
    }
  >;
}>;
