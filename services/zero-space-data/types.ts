export type A_FactionChoices_C = Array<{
  Type: string;
  Name: string;
  Class: string;
  SuperStruct?: {
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
  Properties?: {
    FactionPool: Array<{
      ObjectName: string;
      ObjectPath: string;
    }>;
    MercenaryPool: Array<{
      ObjectName: string;
      ObjectPath: string;
    }>;
  };
}>;

export type Faction_Protectorate_C = Array<{
  Type: string;
  Name: string;
  Class: string;
  SuperStruct?: {
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
  Properties?: {
    DeckInfo: {
      FactionDescription: {
        Namespace: string;
        Key: string;
        SourceString: string;
        LocalizedString: string;
      };
      Portrait: {
        ObjectName: string;
        ObjectPath: string;
      };
      FactionName: string;
      TopBarDetails: {
        FactionIcon: {
          AssetPathName: string;
          SubPathString: string;
        };
        EnergyTextPreConst: {
          Namespace: string;
          Key: string;
          SourceString: string;
          LocalizedString: string;
        };
        EnergyTextPastConst: {
          Namespace: string;
          Key: string;
          SourceString: string;
          LocalizedString: string;
        };
        EnergyPerAbility: number;
        EnergyPerNotification: number;
        EnergyAbilityCue: {
          AssetPathName: string;
          SubPathString: string;
        };
      };
      PrimaryColor: {
        R: number;
        G: number;
        B: number;
        A: number;
        Hex: string;
      };
      TeamColorMapDataTable: Array<{
        ObjectName: string;
        ObjectPath: string;
      }>;
      Heroes: Array<{
        ObjectName: string;
        ObjectPath: string;
      }>;
      MultiplayerReplacements: Array<{
        ToReplace: {
          ObjectName: string;
          ObjectPath: string;
        };
        Replacement?: {
          ObjectName: string;
          ObjectPath: string;
        };
      }>;
      TopBarAbilities: Array<{
        ObjectName: string;
        ObjectPath: string;
      }>;
      Research: Array<{
        ObjectName: string;
        ObjectPath: string;
      }>;
      SoundMap: Array<{
        Enum: string;
        Sound?: {
          ObjectName: string;
          ObjectPath: string;
        };
        RepeatMessageCooldown: number;
        Reliable: boolean;
        PingMinimap: boolean;
        Location: {
          X: number;
          Y: number;
          Z: number;
        };
        Sound2D: boolean;
      }>;
      FactionResearchTree: {
        LevelUpCurveTable: {
          LevelUpCurveTable: {
            ObjectName: string;
            ObjectPath: string;
          };
        };
        Layers: Array<{
          TotalLayerSkillpointRequired: number;
          Researches: Array<{
            Research: {
              ObjectName: string;
              ObjectPath: string;
            };
            ResearchLimit: number;
            CurrentResearch: {
              ResearchItem: any;
              PlayerController: any;
              ProductionComponent: any;
              NumResearched: number;
              DisabledTimer: number;
              DisabledTimerMax: number;
              ResearchTimer: number;
              ResearchTimerMax: number;
              CanResearchNow: boolean;
              AlreadyResearched: boolean;
              WaitingForQueue: boolean;
              CannotResearchAnymore: boolean;
              RequirementsMet: boolean;
              CanResearchWithDeck: boolean;
              bRespawnType: boolean;
              RequiredResearch: Array<any>;
              RequiredBuildings: Array<any>;
              NumQueuedInProduction: number;
              Hotkey: string;
              RealHotkey: {
                Key: {
                  KeyName: string;
                };
                bShift: boolean;
                bCtrl: boolean;
                bAlt: boolean;
                bCmd: boolean;
              };
              bSetCountAndCooldown: boolean;
              ProductionCount: number;
              Cooldown: number;
              MaxCooldown: number;
            };
            IsValidResearch: boolean;
            bAutoUnlocks: boolean;
          }>;
          IsUnlocked: boolean;
          TotalSkillpointsAllocated: number;
          CurrentLevel: number;
          CurrentAllocatedLevel: number;
        }>;
      };
      ResearchOnLevelUps: Array<{
        LevelUnlocked: number;
        ResearchItem: {
          ObjectName: string;
          ObjectPath: string;
        };
      }>;
      BuildingLimits: Array<{
        BuildingType: {
          ObjectName: string;
          ObjectPath: string;
        };
        Limit: number;
      }>;
      ResearchHordeMode: Array<{
        ObjectName: string;
        ObjectPath: string;
      }>;
      FactionMusic: Array<{
        ObjectName: string;
        ObjectPath: string;
      }>;
    };
  };
}>;

export type RI_Hero_FluffyHero_C = Array<{
  Type: string;
  Name: string;
  Class: string;
  Properties?: {
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
    SimpleConstructionScript?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GrantProducts?: Array<{
      AssetPathName: string;
      SubPathString: string;
    }>;
    LocalResearchTags?: Array<string>;
    ResearchAbility?: {
      ObjectName: string;
      ObjectPath: string;
    };
    Title?: string;
    Portrait?: {
      ObjectName: string;
      ObjectPath: string;
    };
    bUnitUpgradeOnly?: boolean;
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
  Outer?: string;
}>;

export type Troop_MPHero_Mera_C = Array<{
  Type: string;
  Name: string;
  Outer?: string;
  Class: string;
  ChildProperties?: Array<{
    Type: string;
    Name: string;
    Flags: string;
    ElementSize: number;
    PropertyFlags?: string;
    SignatureFunction?: {
      ObjectName: string;
      ObjectPath: string;
    };
    Struct?: {
      ObjectName: string;
      ObjectPath: string;
    };
    PropertyClass?: {
      ObjectName: string;
      ObjectPath: string;
    };
    FieldSize?: number;
    ByteOffset?: number;
    ByteMask?: number;
    FieldMask?: number;
    BoolSize?: number;
    bIsNativeBool?: boolean;
  }>;
  FunctionFlags?: string;
  SuperStruct?: {
    ObjectName: string;
    ObjectPath: string;
  };
  Super?: {
    ObjectName: string;
    ObjectPath: string;
  };
  Properties?: {
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
    ParentComponentOrVariableName?: string;
    bIsParentComponentNative?: boolean;
    VariableGuid?: string;
    InternalVariableName?: string;
    Health?: {};
    MaxHealth?: {};
    Armor?: {};
    MaxArmor?: {};
    Shields?: {};
    MaxShields?: {};
    ArmorRating?: {};
    MoveSpeed?: {};
    Cloaking?: {};
    Detection?: {};
    SightRange?: {};
    MaxEnergy?: {};
    Energy?: {};
    DamageCapShields?: {};
    DamageCapArmor?: {};
    DamageCapHealth?: {};
    AttackSpeed?: {};
    DamageMitigation?: {};
    DamageIncrease?: {};
    RangeIncrease?: {};
    DamageMultiplier?: {};
    RegenRateHealth?: {};
    RegenRateShields?: {};
    RegenRateEnergy?: {};
    LifestealPercent?: {};
    StunResist?: {};
    HealingMultiplier?: {};
    CastingRange?: {};
    SoundTriggers?: Array<{
      TriggerType: string;
      SoundCue: {
        ObjectName: string;
        ObjectPath: string;
      };
      bUsesAttenuation: boolean;
      bIsAttachedToOwner: boolean;
      SoundConcurrency: {
        ObjectName: string;
        ObjectPath: string;
      };
      SoundAttenuation: {
        ObjectName: string;
        ObjectPath: string;
      };
    }>;
    AnimClass?: {
      ObjectName: string;
      ObjectPath: string;
    };
    SkeletalMesh?: {
      ObjectName: string;
      ObjectPath: string;
    };
    AttachParent?: {
      ObjectName: string;
      ObjectPath: string;
    };
    RelativeScale3D?: {
      X: number;
      Y: number;
      Z: number;
    };
    SelectedSound?: {
      ObjectName: string;
      ObjectPath: string;
    };
    Title?: string;
    Description?: string;
    ShortDescription?: string;
    Portrait?: {
      ObjectName: string;
      ObjectPath: string;
    };
    ReplicatedPredictionKeyMap?: {
      PredictionKeys: Array<{
        PredictionKey: {
          PredictiveConnection: any;
          Current: number;
          Base: number;
          bIsStale: boolean;
          bIsServerInitiated: boolean;
        };
        ReplicationID: number;
        ReplicationKey: number;
        MostRecentArrayReplicationKey: number;
      }>;
      ArrayReplicationKey: number;
    };
    Asset?: {
      ObjectName: string;
      ObjectPath: string;
    };
    OverrideParameters?: {
      UserParameterRedirects: Array<{
        Key: {
          VarData: string;
          Name: string;
          TypeDef: {
            ClassStructOrEnum: {
              ObjectName: string;
              ObjectPath: string;
            };
            UnderlyingType: number;
          };
        };
        Value: {
          VarData: string;
          Name: string;
          TypeDef: {
            ClassStructOrEnum: {
              ObjectName: string;
              ObjectPath: string;
            };
            UnderlyingType: number;
          };
        };
      }>;
      SortedParameterOffsets: Array<{
        Offset: number;
        Name: string;
        TypeDef: {
          ClassStructOrEnum: {
            ObjectName: string;
            ObjectPath: string;
          };
          UnderlyingType: number;
        };
      }>;
      ParameterData: Array<number>;
    };
    RelativeLocation?: {
      X: number;
      Y: number;
      Z: number;
    };
    bAutoActivate?: boolean;
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
    UberGraphFrame?: {};
    AbilitySystem?: {
      ObjectName: string;
      ObjectPath: string;
    };
    NovaAttributes?: {
      ObjectName: string;
      ObjectPath: string;
    };
    InnateAbilities?: Array<{
      ObjectName: string;
      ObjectPath: string;
    }>;
    InnateEffects?: Array<{
      ObjectName: string;
      ObjectPath: string;
    }>;
    InnateRIs?: Array<{
      ObjectName: string;
      ObjectPath: string;
    }>;
    Vitals?: Array<{
      AttributeName: {
        AttributeName: string;
        Attribute: {
          Path: Array<string>;
          ResolvedOwner: {
            ObjectName: string;
            ObjectPath: string;
          };
        };
        AttributeOwner: {
          ObjectName: string;
          ObjectPath: string;
        };
      };
      AttributeValue: number;
    }>;
    OwnerComponent?: {
      ObjectName: string;
      ObjectPath: string;
    };
    SpawnedFromResearchItem?: {
      ObjectName: string;
      ObjectPath: string;
    };
    DefaultWeapon?: {
      ObjectName: string;
      ObjectPath: string;
    };
    RepTimers?: {
      ObjectName: string;
      ObjectPath: string;
    };
    SoundComponent?: {
      ObjectName: string;
      ObjectPath: string;
    };
    Mesh?: {
      ObjectName: string;
      ObjectPath: string;
    };
    CharacterMovement?: {
      ObjectName: string;
      ObjectPath: string;
    };
    CapsuleComponent?: {
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
    UberGraphFunction?: {
      ObjectName: string;
      ObjectPath: string;
    };
  };
  Children?: Array<{
    ObjectName: string;
    ObjectPath: string;
  }>;
  FuncMap?: {
    ExecuteUbergraph_Troop_MPHero_Mera: {
      ObjectName: string;
      ObjectPath: string;
    };
    HideSwordTrailDelayed: {
      ObjectName: string;
      ObjectPath: string;
    };
    Internal_DeactivateBuff: {
      ObjectName: string;
      ObjectPath: string;
    };
    OnWeaponFired: {
      ObjectName: string;
      ObjectPath: string;
    };
    ReceiveBeginPlay: {
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
  Template?: {
    ObjectName: string;
    ObjectPath: string;
  };
}>;

export type BlueprintBase_Hero_C = Array<{
  Type: string;
  Name: string;
  Outer?: string;
  Class: string;
  ChildProperties?: Array<{
    Type: string;
    Name: string;
    Flags: string;
    ElementSize: number;
    PropertyFlags?: string;
    FieldSize?: number;
    ByteOffset?: number;
    ByteMask?: number;
    FieldMask?: number;
    BoolSize?: number;
    bIsNativeBool?: boolean;
    PropertyClass?: {
      ObjectName: string;
      ObjectPath: string;
    };
    Struct?: {
      ObjectName: string;
      ObjectPath: string;
    };
    MetaClass?: {
      ObjectName: string;
      ObjectPath: string;
    };
    SignatureFunction?: {
      ObjectName: string;
      ObjectPath: string;
    };
    RepIndex?: number;
  }>;
  FunctionFlags?: string;
  SuperStruct?: {
    ObjectName: string;
    ObjectPath: string;
  };
  Super?: {
    ObjectName: string;
    ObjectPath: string;
  };
  Properties?: {
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
    bIsParentComponentNative?: boolean;
    Health?: {};
    MaxHealth?: {};
    Armor?: {};
    MaxArmor?: {};
    Shields?: {};
    MaxShields?: {};
    ArmorRating?: {};
    MoveSpeed?: {};
    Cloaking?: {};
    Detection?: {};
    SightRange?: {};
    MaxEnergy?: {};
    Energy?: {};
    DamageCapShields?: {};
    DamageCapArmor?: {};
    DamageCapHealth?: {};
    AttackSpeed?: {};
    DamageMitigation?: {};
    DamageIncrease?: {};
    RangeIncrease?: {};
    DamageMultiplier?: {};
    RegenRateHealth?: {};
    RegenRateShields?: {};
    RegenRateEnergy?: {};
    LifestealPercent?: {};
    StunResist?: {};
    HealingMultiplier?: {};
    CastingRange?: {};
    StaticMesh?: {
      ObjectName: string;
      ObjectPath: string;
    };
    OverrideMaterials?: Array<{
      ObjectName: string;
      ObjectPath: string;
    }>;
    bGenerateOverlapEvents?: boolean;
    bVisibleInReflectionCaptures?: boolean;
    bVisibleInRealTimeSkyCaptures?: boolean;
    bVisibleInRayTracing?: boolean;
    bReceivesDecals?: boolean;
    CastShadow?: boolean;
    bApplyImpulseOnDamage?: boolean;
    CanCharacterStepUpOn?: string;
    CustomDepthStencilValue?: number;
    CustomPrimitiveData?: {
      Data: Array<number>;
    };
    BodyInstance?: {
      ObjectType: string;
      CollisionProfileName: string;
      CollisionResponses: {
        ResponseArray: Array<{
          Channel: string;
          Response: string;
        }>;
      };
      bEnableGravity: boolean;
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
    ComponentTags?: Array<string>;
    bEnableUpdateRateOptimizations?: boolean;
    AttachParent?: {
      ObjectName: string;
      ObjectPath: string;
    };
    RelativeRotation?: {
      Pitch: number;
      Yaw: number;
      Roll: number;
    };
    SelectedConcurrency?: {
      ObjectName: string;
      ObjectPath: string;
    };
    SelectionRadiusOverride?: number;
    SupplyCost?: number;
    Resources?: Array<{
      Key: string;
      Value: number;
    }>;
    Portrait?: {
      ObjectName: string;
      ObjectPath: string;
    };
    DamageCurveTable?: {
      CurveTable: {
        ObjectName: string;
        ObjectPath: string;
      };
      RowName: string;
    };
    VitalsCurveTable?: {
      CurveTable: {
        ObjectName: string;
        ObjectPath: string;
      };
      RowName: string;
    };
    RespawnTime?: number;
    ReplicatedPredictionKeyMap?: {
      PredictionKeys: Array<{
        PredictionKey: {
          PredictiveConnection: any;
          Current: number;
          Base: number;
          bIsStale: boolean;
          bIsServerInitiated: boolean;
        };
        ReplicationID: number;
        ReplicationKey: number;
        MostRecentArrayReplicationKey: number;
      }>;
      ArrayReplicationKey: number;
    };
    PushabilityFactor?: number;
    CollisionWeightTier?: number;
    bIsUnstoppable?: boolean;
    MaxWalkSpeed?: number;
    MaxWalkSpeedCrouched?: number;
    MaxSwimSpeed?: number;
    MaxFlySpeed?: number;
    MaxCustomMovementSpeed?: number;
    RotationRate?: {
      Pitch: number;
      Yaw: number;
      Roll: number;
    };
    bCanEverAffectNavigation?: boolean;
    CapsuleHalfHeight?: number;
    CapsuleRadius?: number;
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
    UberGraphFrame?: {};
    SpeedBonusTimeApplied?: number;
    DefaultActions?: Array<string>;
    AbilitySystem?: {
      ObjectName: string;
      ObjectPath: string;
    };
    NovaAttributes?: {
      ObjectName: string;
      ObjectPath: string;
    };
    Vitals?: Array<{
      AttributeName: {
        AttributeName: string;
        Attribute: {
          Path: Array<string>;
          ResolvedOwner: {
            ObjectName: string;
            ObjectPath: string;
          };
        };
        AttributeOwner: {
          ObjectName: string;
          ObjectPath: string;
        };
      };
      AttributeValue: number;
    }>;
    OwnerComponent?: {
      ObjectName: string;
      ObjectPath: string;
    };
    ExplosionEffectsOnDestroy?: Array<{
      ObjectName: string;
      ObjectPath: string;
    }>;
    GameplayTags?: Array<string>;
    HealthBarWidth?: number;
    HealthBarZOffset?: number;
    RepTimers?: {
      ObjectName: string;
      ObjectPath: string;
    };
    SoundComponent?: {
      ObjectName: string;
      ObjectPath: string;
    };
    Mesh?: {
      ObjectName: string;
      ObjectPath: string;
    };
    CharacterMovement?: {
      ObjectName: string;
      ObjectPath: string;
    };
    CapsuleComponent?: {
      ObjectName: string;
      ObjectPath: string;
    };
    RootComponent?: {
      ObjectName: string;
      ObjectPath: string;
    };
    NumReplicatedProperties?: number;
    SimpleConstructionScript?: {
      ObjectName: string;
      ObjectPath: string;
    };
    InheritableComponentHandler?: {
      ObjectName: string;
      ObjectPath: string;
    };
    UberGraphFunction?: {
      ObjectName: string;
      ObjectPath: string;
    };
  };
  Children?: Array<{
    ObjectName: string;
    ObjectPath: string;
  }>;
  FuncMap?: {
    LimboStateChanged__DelegateSignature: {
      ObjectName: string;
      ObjectPath: string;
    };
    SpeedupSuccessful__DelegateSignature: {
      ObjectName: string;
      ObjectPath: string;
    };
    ExecuteUbergraph_BlueprintBase_Hero: {
      ObjectName: string;
      ObjectPath: string;
    };
    SpeedBonusVFX: {
      ObjectName: string;
      ObjectPath: string;
    };
    HideAura: {
      ObjectName: string;
      ObjectPath: string;
    };
    OnKilledImplEvent: {
      ObjectName: string;
      ObjectPath: string;
    };
    LevelUpVFX: {
      ObjectName: string;
      ObjectPath: string;
    };
    OnLevelUpCallback_Event_0: {
      ObjectName: string;
      ObjectPath: string;
    };
    SpeedUpSuccessEvent: {
      ObjectName: string;
      ObjectPath: string;
    };
    AttemptSpeedupRespawn: {
      ObjectName: string;
      ObjectPath: string;
    };
    LimboStateChange: {
      ObjectName: string;
      ObjectPath: string;
    };
    LimboChanged: {
      ObjectName: string;
      ObjectPath: string;
    };
    ReceiveBeginPlay: {
      ObjectName: string;
      ObjectPath: string;
    };
    Infused: {
      ObjectName: string;
      ObjectPath: string;
    };
    RefreshCooldown: {
      ObjectName: string;
      ObjectPath: string;
    };
    ChangeCooldown: {
      ObjectName: string;
      ObjectPath: string;
    };
    CalcCostMultiplier: {
      ObjectName: string;
      ObjectPath: string;
    };
    VitalSpeedBonus: {
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
  Interfaces?: Array<{
    Class: {
      ObjectName: string;
      ObjectPath: string;
    };
    PointerOffset: number;
    bImplementedByK2: boolean;
  }>;
  bCooked?: boolean;
  ClassDefaultObject?: {
    ObjectName: string;
    ObjectPath: string;
  };
  Template?: {
    ObjectName: string;
    ObjectPath: string;
  };
}>;
