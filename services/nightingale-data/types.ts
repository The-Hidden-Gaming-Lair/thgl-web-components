export type MAP_ROOT = Array<{
  Type: string;
  Name: string;
  Outer?: string;
  Class: string;
  Template?: {
    ObjectName: string;
    ObjectPath: string;
  };
  Properties?: {
    UCSSerializationIndex?: number;
    bNetAddressable?: boolean;
    CreationMethod?: string;
    WaterMesh?: {
      ObjectName: string;
      ObjectPath: string;
    };
    ZoneExtent?: {
      X: number;
      Y: number;
    };
    RootComponent?: {
      ObjectName: string;
      ObjectPath: string;
    };
    InstanceComponents?: Array<
      | {
          ObjectName: string;
          ObjectPath: string;
        }
      | undefined
    >;
    Depth?: {
      Points: Array<{
        InVal: number;
        OutVal: number;
        ArriveTangent: number;
        LeaveTangent: number;
        InterpMode: string;
      }>;
    };
    WaterVelocityScalar?: {
      Points: Array<{
        InVal: number;
        OutVal: number;
        ArriveTangent: number;
        LeaveTangent: number;
        InterpMode: string;
      }>;
    };
    RiverWidth?: {
      Points: Array<{
        InVal: number;
        OutVal: number;
        ArriveTangent: number;
        LeaveTangent: number;
        InterpMode: string;
      }>;
    };
    AudioIntensity?: {
      Points: Array<{
        InVal: number;
        OutVal: number;
        ArriveTangent: number;
        LeaveTangent: number;
        InterpMode: string;
      }>;
    };
    SplineCurves?: {
      position: {
        Points: Array<{
          InVal: number;
          OutVal: {
            X: number;
            Y: number;
            Z: number;
          };
          ArriveTangent: {
            X: number;
            Y: number;
            Z: number;
          };
          LeaveTangent: {
            X: number;
            Y: number;
            Z: number;
          };
          InterpMode: string;
        }>;
        bIsLooped?: boolean;
        LoopKeyOffset?: number;
      };
      Rotation: {
        Points: Array<{
          InVal: number;
          OutVal: {
            X: number;
            Y: number;
            Z: number;
            W: number;
            IsNormalized: boolean;
            Size: number;
            SizeSquared: number;
          };
          ArriveTangent: {
            X: number;
            Y: number;
            Z: number;
            W: number;
            IsNormalized: boolean;
            Size: number;
            SizeSquared: number;
          };
          LeaveTangent: {
            X: number;
            Y: number;
            Z: number;
            W: number;
            IsNormalized: boolean;
            Size: number;
            SizeSquared: number;
          };
          InterpMode: string;
        }>;
        bIsLooped?: boolean;
        LoopKeyOffset?: number;
      };
      Scale?: {
        Points: Array<{
          InVal: number;
          OutVal: {
            X: number;
            Y: number;
            Z: number;
          };
          ArriveTangent: {
            X: number;
            Y: number;
            Z: number;
          };
          LeaveTangent: {
            X: number;
            Y: number;
            Z: number;
          };
          InterpMode: string;
        }>;
        bIsLooped?: boolean;
        LoopKeyOffset?: number;
      };
      ReparamTable: {
        Points: Array<{
          InVal: number;
          OutVal: number;
          ArriveTangent: number;
          LeaveTangent: number;
          InterpMode: string;
        }>;
      };
    };
    bClosedLoop?: boolean;
    AttachParent?: {
      ObjectName: string;
      ObjectPath: string;
    };
    FarDistanceMaterial?: {
      ObjectName: string;
      ObjectPath: string;
    };
    FarDistanceMeshExtent?: number;
    TileSize?: number;
    ExtentInTiles?: {
      X: number;
      Y: number;
    };
    RelativeLocation?: {
      X: number;
      Y: number;
      Z: number;
    };
    CollisionBoxes?: Array<{
      ObjectName: string;
      ObjectPath: string;
    }>;
    CollisionHullSets?: Array<{
      ObjectName: string;
      ObjectPath: string;
    }>;
    CollisionExtents?: {
      X: number;
      Y: number;
      Z: number;
    };
    OceanExtents?: {
      X: number;
      Y: number;
    };
    PhysicalMaterial?: {
      ObjectName: string;
      ObjectPath: string;
    };
    CurveSettings?: {
      ChannelDepth: number;
    };
    WaterMaterial?: {
      ObjectName: string;
      ObjectPath: string;
    };
    UnderwaterPostProcessMaterial?: {
      ObjectName: string;
      ObjectPath: string;
    };
    WaterHeightmapSettings?: {
      FalloffSettings: {
        FalloffAngle: number;
      };
    };
    WaterBodyExclusionVolumes?: Array<{
      AssetPathName: string;
      SubPathString: string;
    }>;
    OwningWaterZone?: {
      AssetPathName: string;
      SubPathString: string;
    };
    WaterNavAreaClass?: {
      ObjectName: string;
      ObjectPath: string;
    };
    bFillCollisionUnderneathForNavmesh?: boolean;
    bHasCustomNavigableGeometry?: string;
    BodyInstance?: {
      ObjectType?: string;
      CollisionEnabled?: string;
      CollisionProfileName?: string;
      CollisionResponses?: {
        ResponseArray: Array<{
          Channel: string;
          Response: string;
        }>;
      };
      PhysMaterialOverride?: {
        ObjectName: string;
        ObjectPath: string;
      };
      bInterpolateWhenSubStepping?: boolean;
      MaxAngularVelocity?: number;
      bAutoWeld?: boolean;
      bUpdateMassWhenScaleChanges?: boolean;
      WalkableSlopeOverride?: {
        WalkableSlopeBehavior: string;
        WalkableSlopeAngle: number;
      };
    };
    bCanEverAffectNavigation?: boolean;
    SplineComp?: {
      ObjectName: string;
      ObjectPath: string;
    };
    WaterSplineMetadata?: {
      ObjectName: string;
      ObjectPath: string;
    };
    WaterBodyComponent?: {
      ObjectName: string;
      ObjectPath: string;
    };
    WaterInfoMeshComponent?: {
      ObjectName: string;
      ObjectPath: string;
    };
    DilatedWaterInfoMeshComponent?: {
      ObjectName: string;
      ObjectPath: string;
    };
    LakeMeshComp?: {
      ObjectName: string;
      ObjectPath: string;
    };
    LakeCollision?: {
      ObjectName: string;
      ObjectPath: string;
    };
    StaticMesh?: {
      ObjectName: string;
      ObjectPath: string;
    };
    OverrideMaterials?: Array<
      | {
          ObjectName: string;
          ObjectPath: string;
        }
      | undefined
    >;
    bIsValidTextureStreamingBuiltData?: boolean;
    bHasNoStreamableTextures?: boolean;
    bComputedBoundsOnceForGame?: boolean;
    WaterBodiesToExclude?: Array<{
      ObjectName: string;
      ObjectPath: string;
    }>;
    BrushType?: string;
    Brush?: {
      ObjectName: string;
      ObjectPath: string;
    };
    BrushComponent?: {
      ObjectName: string;
      ObjectPath: string;
    };
    bHidden?: boolean;
    ReflectionViewSampleCountScaleValue?: number;
    ShadowReflectionViewSampleCountScaleValue?: number;
    AddressX?: string;
    AddressY?: string;
    ImportedSize?: {
      X: number;
      Y: number;
    };
    LightingGuid?: string;
    LODGroup?: string;
    SRGB?: boolean;
    CastShadow?: boolean;
    RelativeScale3D?: {
      X: number;
      Y: number;
      Z: number;
    };
    bAbsoluteScale?: boolean;
    bVisible?: boolean;
    bHiddenInGame?: boolean;
    Mobility?: string;
    bEvaluateWorldPositionOffsetInRayTracing?: boolean;
    StaticMaterials?: Array<{
      MaterialInterface: any;
      MaterialSlotName: string;
      ImportedMaterialSlotName: string;
      UVChannelData: {
        bInitialized: boolean;
        bOverrideDensities: boolean;
        LocalUVDensities: number;
      };
    }>;
    bHasNavigationData?: boolean;
    bSupportRayTracing?: boolean;
    ExtendedBounds?: {
      Origin: {
        X: number;
        Y: number;
        Z: number;
      };
      BoxExtent: {
        X: number;
        Y: number;
        Z: number;
      };
      SphereRadius: number;
    };
    SplineParams?: {
      StartPos?: {
        X: number;
        Y: number;
        Z: number;
      };
      StartTangent: {
        X: number;
        Y: number;
        Z: number;
      };
      StartScale: {
        X: number;
        Y: number;
      };
      StartRoll?: number;
      EndPos: {
        X: number;
        Y: number;
        Z: number;
      };
      EndScale: {
        X: number;
        Y: number;
      };
      EndTangent: {
        X: number;
        Y: number;
        Z: number;
      };
      EndRoll: number;
    };
    CachedMeshBodySetupGuid?: string;
    BodySetup?: {
      ObjectName: string;
      ObjectPath: string;
    };
    StreamingTextureData?: Array<{
      PackedRelativeBox: number;
      TextureLevelIndex: number;
      TexelFactor: number;
    }>;
    RuntimeVirtualTextures?: Array<{
      ObjectName: string;
      ObjectPath: string;
    }>;
    VirtualTextureRenderPassType?: string;
    TranslucencySortPriority?: number;
    RelativeRotation?: {
      Pitch: number;
      Yaw: number;
      Roll: number;
    };
    VirtualTextureComponent?: {
      ObjectName: string;
      ObjectPath: string;
    };
    BoundsAlignActor?: {
      AssetPathName: string;
      SubPathString: string;
    };
    VirtualTexture?: {
      ObjectName: string;
      ObjectPath: string;
    };
    CachedBodySetup?: {
      ObjectName: string;
      ObjectPath: string;
    };
    BoxExtent?: {
      X: number;
      Y: number;
      Z: number;
    };
    bDrawOnlyIfSelected?: boolean;
    IIMManagerIndex?: {
      ObjectName: string;
      ObjectPath: string;
    };
    BiomeId?: string;
    POIData?: Array<{
      Location: {
        X: number;
        Y: number;
        Z: number;
      };
      Rotation: {
        Pitch: number;
        Yaw: number;
        Roll: number;
      };
      POIRadius: number;
      POIType: string;
      bHasRoad: boolean;
      bIsInWater: boolean;
      bIsOnPlateau: boolean;
      bIsInClearing: boolean;
      bIsUnused: boolean;
      bIsHub: boolean;
      RegionMask: number;
      DistanceToWater: number;
      ClusterTheme: string;
      POIHeight: number;
    }>;
    TemporalRealmData?: {
      AssetPathName: string;
      SubPathString: string;
    };
    NavigationSystemConfig?: {
      ObjectName: string;
      ObjectPath: string;
    };
    DefaultGameMode?: {
      ObjectName: string;
      ObjectPath: string;
    };
    BookmarkArray?: Array<
      | {
          ObjectName: string;
          ObjectPath: string;
        }
      | undefined
    >;
    NavMeshResolutionParams?: {
      AgentMaxStepHeight: number;
    };
    AgentRadius?: number;
    AgentHeight?: number;
    AgentMaxSlope?: number;
    AgentMaxStepHeight?: number;
    PlayerStartTag?: string;
    CapsuleComponent?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GoodSprite: any;
    BadSprite: any;
    SpawnCollisionHandlingMethod?: string;
    bAutoSpawnMissingNavData?: boolean;
    NavigationSystemClass?: {
      AssetPathName: string;
      SubPathString: string;
    };
    bIsOverriden?: boolean;
    ActiveGameplayCues?: {
      Owner: {
        ObjectName: string;
        ObjectPath: string;
      };
    };
    MinimalReplicationGameplayCues?: {
      Owner: {
        ObjectName: string;
        ObjectPath: string;
      };
    };
    TextureMapMasks?: Array<{
      Key: string;
      Value: {
        ObjectName: string;
        ObjectPath: string;
      };
    }>;
    BoxComponent?: {
      ObjectName: string;
      ObjectPath: string;
    };
    bAutoUpdateBounds?: boolean;
    Model?: {
      ObjectName: string;
      ObjectPath: string;
    };
    LevelScriptActor?: {
      ObjectName: string;
      ObjectPath: string;
    };
    StreamingTextureGuids?: Array<string>;
    StreamingTextures?: Array<string>;
    PackedTextureStreamingQualityLevelFeatureLevel?: number;
    LevelBuildDataId?: string;
    WorldSettings?: {
      ObjectName: string;
      ObjectPath: string;
    };
    ComponentLayerInfos?: Array<{
      ObjectName: string;
      ObjectPath: string;
    }>;
    SectionBaseX?: number;
    SectionBaseY?: number;
    CollisionSizeQuads?: number;
    CollisionScale?: number;
    HeightfieldGuid?: string;
    CachedLocalBox?: {
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
    RenderComponentRef?: {
      ObjectName: string;
      ObjectPath: string;
    };
    CookedPhysicalMaterials?: Array<{
      ObjectName: string;
      ObjectPath: string;
    }>;
    ComponentSizeQuads?: number;
    SubsectionSizeQuads?: number;
    NumSubsections?: number;
    MaterialInstances?: Array<{
      ObjectName: string;
      ObjectPath: string;
    }>;
    LODIndexToMaterialIndex?: Array<number>;
    WeightmapScaleBias?: {
      X: number;
      Y: number;
      Z: number;
      W: number;
    };
    WeightmapSubsectionOffset?: number;
    HeightmapScaleBias?: {
      X: number;
      Y: number;
      Z: number;
      W: number;
    };
    CollisionComponentRef?: {
      ObjectName: string;
      ObjectPath: string;
    };
    HeightmapTexture?: {
      ObjectName: string;
      ObjectPath: string;
    };
    WeightmapLayerAllocations?: Array<{
      LayerInfo: {
        ObjectName: string;
        ObjectPath: string;
      };
      WeightmapTextureIndex: number;
      WeightmapTextureChannel: number;
    }>;
    WeightmapTextures?: Array<{
      ObjectName: string;
      ObjectPath: string;
    }>;
    MapBuildDataId?: string;
    StateId?: string;
    MobileWeightmapLayerAllocations?: Array<{
      LayerInfo: {
        ObjectName: string;
        ObjectPath: string;
      };
      WeightmapTextureIndex: number;
      WeightmapTextureChannel: number;
    }>;
    bCastFarShadow?: boolean;
    LandscapeGuid?: string;
    LandscapeMaterial?: {
      ObjectName: string;
      ObjectPath: string;
    };
    LandscapeHoleMaterial?: {
      ObjectName: string;
      ObjectPath: string;
    };
    LandscapeComponents?: Array<{
      ObjectName: string;
      ObjectPath: string;
    }>;
    CollisionComponents?: Array<{
      ObjectName: string;
      ObjectPath: string;
    }>;
    bHasLayersContent?: boolean;
    InstancingRandomSeed?: number;
    GameplayActorId?: number;
    OnInstanceStateChanged?: {
      InvocationList: Array<{
        Object: {
          ObjectName: string;
          ObjectPath: string;
        };
        FunctionName: string;
      }>;
    };
    LocalToReplicatedIdIndex?: Array<{
      Key: string;
      Value: number;
    }>;
    ReplicatedToLocalIdIndex?: Array<number>;
    InstanceHealth?: Array<number>;
    ReverseIndex?: Array<number>;
    SortedInstances?: Array<number>;
    NumBuiltInstances?: number;
    BuiltInstanceBounds?: {
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
    CacheMeshExtendedBounds?: {
      Origin?: {
        X: number;
        Y: number;
        Z: number;
      };
      BoxExtent: {
        X: number;
        Y: number;
        Z: number;
      };
      SphereRadius: number;
    };
    InstanceCountToRender?: number;
    InstanceStartCullDistance?: number;
    InstanceEndCullDistance?: number;
    InstanceReorderTable?: Array<number>;
    WorldPositionOffsetDisableDistance?: number;
    NavMeshCollisionExport?: {
      PackedBits: number;
    };
    bAffectDynamicIndirectLighting?: boolean;
    bCastStaticShadow?: boolean;
    bAbsoluteRotation?: boolean;
    bIsTraversable?: boolean;
    OcclusionLayerNumNodes?: number;
    TranslatedInstanceSpaceOrigin?: {
      X: number;
      Y: number;
      Z: number;
    };
    bEnableDensityScaling?: boolean;
    OverriddenLightMapRes?: number;
    bEnableAutoLODGeneration?: boolean;
    bReceivesDecals?: boolean;
    bHasPerInstanceHitProxies?: boolean;
    bAffectDistanceFieldLighting?: boolean;
    LateReverbComponent?: {
      ObjectName: string;
      ObjectPath: string;
    };
    DirectionalAuxBusses?: {
      ObjectName: string;
      ObjectPath: string;
    };
    PrimaryComponentTick?: {
      bCanEverTick: boolean;
      bStartWithTickEnabled: boolean;
    };
    AreaClassOverride?: {
      ObjectName: string;
      ObjectPath: string;
    };
    bUseSystemDefaultObstacleAreaClass?: boolean;
    BrushBodySetup?: {
      ObjectName: string;
      ObjectPath: string;
    };
    CanCharacterStepUpOn?: string;
    BM_Card?: {
      ObjectName: string;
      ObjectPath: string;
    };
    LensFlareSun?: {
      ObjectName: string;
      ObjectPath: string;
    };
    PostProcess_ColorCorrect_Working?: {
      ObjectName: string;
      ObjectPath: string;
    };
    Weather?: {
      ObjectName: string;
      ObjectPath: string;
    };
    Moon_Atm_Half_D_03?: {
      ObjectName: string;
      ObjectPath: string;
    };
    Moon_Atm_Half_E?: {
      ObjectName: string;
      ObjectPath: string;
    };
    Moon_Atm_Half_D_02?: {
      ObjectName: string;
      ObjectPath: string;
    };
    Moon_Atm_Half_D_01?: {
      ObjectName: string;
      ObjectPath: string;
    };
    Moon_Atm_Half_C_02?: {
      ObjectName: string;
      ObjectPath: string;
    };
    Moon_Atm_Half_C_01?: {
      ObjectName: string;
      ObjectPath: string;
    };
    Moon_Atm_Crescent_B_02?: {
      ObjectName: string;
      ObjectPath: string;
    };
    Moon_Atm_Crescent_B_01?: {
      ObjectName: string;
      ObjectPath: string;
    };
    Moon_Atm_Crescent_A_02?: {
      ObjectName: string;
      ObjectPath: string;
    };
    Moon_Atm_Crescent_A_01?: {
      ObjectName: string;
      ObjectPath: string;
    };
    Moon_Half_D_03?: {
      ObjectName: string;
      ObjectPath: string;
    };
    Moon_Half_C_02?: {
      ObjectName: string;
      ObjectPath: string;
    };
    Moon_Half_D_02?: {
      ObjectName: string;
      ObjectPath: string;
    };
    Moon_Crescent_A_02?: {
      ObjectName: string;
      ObjectPath: string;
    };
    Moon_Crescent_B_02?: {
      ObjectName: string;
      ObjectPath: string;
    };
    Moon_Full_E_01?: {
      ObjectName: string;
      ObjectPath: string;
    };
    Moon_Half_D_01?: {
      ObjectName: string;
      ObjectPath: string;
    };
    Moon_Crescent_B_01?: {
      ObjectName: string;
      ObjectPath: string;
    };
    Moon_Half_C_01?: {
      ObjectName: string;
      ObjectPath: string;
    };
    Moon_Crescent_A_01?: {
      ObjectName: string;
      ObjectPath: string;
    };
    Volumetric_Aurora?: {
      ObjectName: string;
      ObjectPath: string;
    };
    PostProcess?: {
      ObjectName: string;
      ObjectPath: string;
    };
    TimeOfDay_Audio?: {
      ObjectName: string;
      ObjectPath: string;
    };
    TimeofDay_Seasons?: {
      ObjectName: string;
      ObjectPath: string;
    };
    TimeofDay_VFX?: {
      ObjectName: string;
      ObjectPath: string;
    };
    TimeofDay_Weather?: {
      ObjectName: string;
      ObjectPath: string;
    };
    TimeofDay_Lighting?: {
      ObjectName: string;
      ObjectPath: string;
    };
    Sky_Sphere?: {
      ObjectName: string;
      ObjectPath: string;
    };
    DirectionalLight_Sun?: {
      ObjectName: string;
      ObjectPath: string;
    };
    VolumetricCloud?: {
      ObjectName: string;
      ObjectPath: string;
    };
    SkyAtmosphere?: {
      ObjectName: string;
      ObjectPath: string;
    };
    ExponentialHeightFog?: {
      ObjectName: string;
      ObjectPath: string;
    };
    SkyLight?: {
      ObjectName: string;
      ObjectPath: string;
    };
    DirectionalLight_Celestial?: {
      ObjectName: string;
      ObjectPath: string;
    };
    AdjustedTime?: number;
    PreviewTime?: number;
    "Visual_Environment_Preset "?: string;
    "Realm - Color Master "?: number;
    "Realm - Rapid Color Biome"?: number;
    "Realm - Rapid Color Adjust"?: number;
    "Realm - Color Correction"?: number;
    "Realm - Celestial Type"?: number;
    "Realm - Atmosphere"?: number;
    "Realm - Fog Day"?: number;
    "Realm - Fog Night"?: number;
    "Realm - Fog Volume Level "?: number;
    "Realm - Cloud"?: number;
    "Realm - Cloud Color"?: number;
    "Realm - Season"?: number;
    "Realm - Secondary Moons"?: number;
    "Realm - Secondary Moon Type"?: number;
    "Realm - Rain"?: number;
    "Realm - MPC_BIome"?: number;
    "Realm - Fae Magic Alt Toggle"?: number;
    RandomStream?: {
      InitialSeed: number;
      Seed: number;
    };
    "Cloud Coverage"?: number;
    "Bottom Altitude"?: number;
    "Extinction Scale Top"?: number;
    "Volumetric Clouds Scale"?: number;
    "View Sample Scale (Day)"?: number;
    "View Sample Scale (Night)"?: number;
    "Shadow Tracing Distance"?: number;
    "Layer 2 Coverage Scale"?: number;
    "Layer 2 Extinction Scale"?: number;
    "Layer 2 Cloud Scale"?: {
      X: number;
      Y: number;
    };
    "Distance Between Layers"?: number;
    "Overall Intensity"?: number;
    "Cloud Speed"?: number;
    "Cloud Phase"?: number;
    "Starting Cloud Texture Velocity"?: {
      X: number;
      Y: number;
      Z: number;
    };
    BP_PlayerVisibilityComponent?: {
      ObjectName: string;
      ObjectPath: string;
    };
    DefaultSceneRoot?: {
      ObjectName: string;
      ObjectPath: string;
    };
    AbilitySystem?: {
      ObjectName: string;
      ObjectPath: string;
    };
    AttributeSet?: {
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
    GTS_HUM_AIR_RopeTied04?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_AIR_RopeTied03?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_AIR_RopeTied02?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_AIR_RopeTied01?: {
      ObjectName: string;
      ObjectPath: string;
    };
    Cable?: {
      ObjectName: string;
      ObjectPath: string;
    };
    AVFXPlane12?: {
      ObjectName: string;
      ObjectPath: string;
    };
    AVFXPlane11?: {
      ObjectName: string;
      ObjectPath: string;
    };
    AVFXPlane10?: {
      ObjectName: string;
      ObjectPath: string;
    };
    AVFXPlane9?: {
      ObjectName: string;
      ObjectPath: string;
    };
    AVFXPlane8?: {
      ObjectName: string;
      ObjectPath: string;
    };
    AVFXPlane7?: {
      ObjectName: string;
      ObjectPath: string;
    };
    AVFXPlane6?: {
      ObjectName: string;
      ObjectPath: string;
    };
    AVFXPlane5?: {
      ObjectName: string;
      ObjectPath: string;
    };
    AVFXPlane4?: {
      ObjectName: string;
      ObjectPath: string;
    };
    AVFXPlane3?: {
      ObjectName: string;
      ObjectPath: string;
    };
    AVFXPlane2?: {
      ObjectName: string;
      ObjectPath: string;
    };
    AVFXPlane1?: {
      ObjectName: string;
      ObjectPath: string;
    };
    AVFXPlane?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_TrainPlatform17_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_TowerFrame20M63_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_TowerFrame20M62_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_TowerFrame20M61_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_TowerFrame20M60_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_TowerFrame20M59_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_TowerFrame20M58_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_TowerFrame20M57_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_TowerFrame20M56_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_TowerFrame20M55_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_TowerFrame20M54_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_TowerFrame20M53_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_TowerFrame20M52_GTS_HUM_STW_Platform10M?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_TowerFrame20M52_DefaultSceneRoot?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_TowerFrame20M51_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_TowerFrame20M50_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_TowerFrame20M49_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_TowerFrame20M48_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_TowerFrame20M47_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_TowerFrame20M46_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_TowerFrame20M45_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_TowerFrame20M44_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_TowerFrame20M43_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_TowerFrame20M42_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_TowerFrame20M41_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_TowerFrame20M40_GTS_HUM_STW_Platform10M?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_TowerFrame20M40_DefaultSceneRoot?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_TowerFrame20M39_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Stairs10M20_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Stairs10M19_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Stairs10M18_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Stairs10M17_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Stairs10M16_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Stairs10M15_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Stairs10M14_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Stairs10M13_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Pipe4M_B158_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Pipe4M_B157_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Pipe4M_B156_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Pipe4M_B155_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Pipe4M_B154_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Pipe4M_B153_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Pipe4M_B152_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Pipe4M_B151_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Pipe4M_B150_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Pipe4M_B149_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Pipe4M_B148_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Pipe4M_B147_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Pipe4M_B146_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Pipe4M_B145_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Pipe4M_B144_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Pipe4M_B143_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Pipe4M_B134_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Pipe4M_B132_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Pipe4M_B131_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Pipe4M_B117_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Pipe4M_B116_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Pipe4M_B108_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Frame4M_A23_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Frame4M_A22_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Frame4M_A21_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    CableActor3_CableComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    BP_HUM_CraneLight_01_DES1_PointLight_LightComponent1?: {
      ObjectName: string;
      ObjectPath: string;
    };
    BP_HUM_CraneLight_01_DES1_PointLight_LightComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    BP_HUM_CraneLight_01_DES1_GTS_HUM_GiantCraneTower02b_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    BP_HUM_CraneLight_01_DES1_SharedRoot?: {
      ObjectName: string;
      ObjectPath: string;
    };
    BP_Balloon_01_AnchorPoint?: {
      ObjectName: string;
      ObjectPath: string;
    };
    BP_Balloon_01_GTS_HUM_AIR_CargoBalloon01?: {
      ObjectName: string;
      ObjectPath: string;
    };
    BP_Balloon_01_DefaultSceneRoot?: {
      ObjectName: string;
      ObjectPath: string;
    };
    TopTowerCenter_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_Scaffold_4x4_Plank3_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_Scaffold_4x4_Plank02_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_Scaffold_4x4_Plank01_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_Scaffold_4x2_Plank5_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_Scaffold_4x2_Plank4_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_Scaffold_4x2_Plank03_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_Scaffold_4x2_Plank01_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_TrainPlatform48_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_TrainPlatform47_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_TrainPlatform46_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_TrainPlatform45_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_TrainPlatform44_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_TrainPlatform43_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_TrainPlatform42_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_TrainPlatform39_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_TrainPlatform38_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_TrainPlatform37_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_TrainPlatform36_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_TrainPlatform35_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_TrainPlatform34_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_TrainPlatform33_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_TrainPlatform32_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_TrainPlatform31_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_TrainPlatform30_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_TrainPlatform29_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_TrainPlatform28_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_TrainPlatform27_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_TrainPlatform26_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_TrainPlatform25_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_TrainPlatform24_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_TrainPlatform23_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_TrainPlatform22_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_TrainPlatform21_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_TrainPlatform20_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_TrainPlatform19_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_TrainPlatform18_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_TrainPlatform16_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_TrainPlatform15_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_TrainPlatform14_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_TrainPlatform13_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_TrainPlatform12_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_TrainPlatform11_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_TrainPlatform10_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_TrainPlatform9_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_TrainPlatform8_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_TrainPlatform7_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_TrainPlatform6_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_TrainPlatform5_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_TrainPlatform4_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_TrainPlatform3_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_TrainPlatform2_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_TrainPlatform01_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_TowerFrame20M74_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_TowerFrame20M73_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_TowerFrame20M72_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_TowerFrame20M71_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_TowerFrame20M70_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_TowerFrame20M69_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_TowerFrame20M68_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_TowerFrame20M67_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_TowerFrame20M66_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_TowerFrame20M65_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_TowerFrame20M64_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_TowerFrame20M38_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_TowerFrame20M37_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_TowerFrame20M36_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_TowerFrame20M35_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_TowerFrame20M34_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_TowerFrame20M33_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_TowerFrame20M32_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_TowerFrame20M31_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_TowerFrame20M30_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_TowerFrame20M29_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_TowerFrame20M28_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_TowerFrame20M27_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_TowerFrame20M26_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_TowerFrame20M25_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_TowerFrame20M24_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_TowerFrame20M23_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_TowerFrame20M22_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_TowerFrame20M21_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_TowerFrame20M20_GTS_HUM_STW_Platform10M?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_TowerFrame20M20_DefaultSceneRoot?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_TowerFrame20M19_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_TowerFrame20M18_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_TowerFrame20M17_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_TowerFrame20M16_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_TowerFrame20M15_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_TowerFrame20M14_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_TowerFrame20M13_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_TowerFrame20M12_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_TowerFrame20M11_GTS_HUM_STW_Platform10M?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_TowerFrame20M11_DefaultSceneRoot?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_TowerFrame20M10_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_TowerFrame20M9_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_TowerFrame20M4_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_TowerFrame20M3_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_TowerFrame20M2_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_TowerFrame20M_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Stairs10M26_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Stairs10M25_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Stairs10M24_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Stairs10M23_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Stairs10M22_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Stairs10M21_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Stairs10M12_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Stairs10M11_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Stairs10M10_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Stairs10M9_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Stairs10M8_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Stairs10M7_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Stairs10M6_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Stairs10M5_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Stairs10M4_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Stairs10M3_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Stairs10M_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Railing4M37_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Railing4M36_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Railing4M35_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Railing4M34_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Railing4M33_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Railing4M32_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Railing4M31_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Railing4M30_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Railing4M29_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Railing4M28_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Railing4M27_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Railing4M26_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Railing4M25_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Railing4M24_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Railing4M23_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Railing4M22_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Railing4M21_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Railing4M20_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Railing4M19_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Railing4M18_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Railing4M16_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Railing4M15_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Railing4M14_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Railing4M13_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Railing4M12_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Railing4M11_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Railing4M10_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Railing4M9_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Railing4M8_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Railing4M7_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Railing4M6_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Railing4M5_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Railing4M4_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Railing4M3_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Railing4M2_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Railing4M_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Platform16M4_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Platform16M3_GTS_HUM_STW_Platform16M_Stairs?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Platform16M3_GTS_HUM_STW_Platform16M?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Platform16M3_DefaultSceneRoot?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Platform16M2_GTS_HUM_STW_Platform16M_Stairs?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Platform16M2_GTS_HUM_STW_Platform16M?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Platform16M2_DefaultSceneRoot?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Platform16M_GTS_HUM_STW_Platform16M_Stairs?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Platform16M_GTS_HUM_STW_Platform16M?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Platform16M_DefaultSceneRoot?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Pipe4M_B165_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Pipe4M_B164_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Pipe4M_B163_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Pipe4M_B162_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Pipe4M_B161_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Pipe4M_B160_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Pipe4M_B159_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Pipe4M_B142_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Pipe4M_B141_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Pipe4M_B140_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Pipe4M_B139_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Pipe4M_B138_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Pipe4M_B137_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Pipe4M_B136_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Pipe4M_B135_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Pipe4M_B133_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Pipe4M_B130_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Pipe4M_B129_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Pipe4M_B128_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Pipe4M_B127_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Pipe4M_B126_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Pipe4M_B125_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Pipe4M_B124_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Pipe4M_B123_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Pipe4M_B122_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Pipe4M_B121_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Pipe4M_B120_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Pipe4M_B119_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Pipe4M_B115_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Pipe4M_B114_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Pipe4M_B113_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Pipe4M_B112_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Pipe4M_B111_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Pipe4M_B110_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Pipe4M_B109_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Pipe4M_B107_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Pipe4M_B106_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Pipe4M_B105_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Pipe4M_B104_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Pipe4M_B103_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Pipe4M_B102_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Pipe4M_B101_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Pipe4M_B100_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Pipe4M_B99_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Pipe4M_B98_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Pipe4M_B97_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Pipe4M_B96_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Pipe4M_B95_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Pipe4M_B94_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Pipe4M_B93_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Pipe4M_B92_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Pipe4M_B91_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Pipe4M_B90_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Pipe4M_B89_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Pipe4M_B88_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Pipe4M_B87_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Pipe4M_B86_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Pipe4M_B85_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Pipe4M_B84_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Pipe4M_B83_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Pipe4M_B82_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Pipe4M_B81_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Pipe4M_B80_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Pipe4M_B79_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Pipe4M_B78_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Pipe4M_B77_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Pipe4M_B76_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Pipe4M_B75_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Pipe4M_B74_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Pipe4M_B73_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Pipe4M_B72_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Pipe4M_B71_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Pipe4M_B70_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Pipe4M_B69_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Pipe4M_B68_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Pipe4M_B67_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Pipe4M_B66_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Pipe4M_B65_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Pipe4M_B64_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Pipe4M_B63_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Pipe4M_B62_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Pipe4M_B61_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Pipe4M_B60_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Pipe4M_B59_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Pipe4M_B58_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Pipe4M_B57_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Pipe4M_B56_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Pipe4M_B55_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Pipe4M_B54_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Pipe4M_B53_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Pipe4M_B52_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Pipe4M_B51_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Pipe4M_B50_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Pipe4M_B49_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Pipe4M_B48_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Pipe4M_B47_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Pipe4M_B46_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Pipe4M_B45_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Pipe4M_B44_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Pipe4M_B43_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Pipe4M_B42_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Pipe4M_B41_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Pipe4M_B40_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Pipe4M_B39_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Pipe4M_B38_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Pipe4M_B37_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Pipe4M_B36_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Pipe4M_B35_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Pipe4M_B34_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Pipe4M_B33_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Pipe4M_B32_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Pipe4M_B31_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Pipe4M_B30_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Pipe4M_B29_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Pipe4M_B28_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Pipe4M_B27_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Pipe4M_B26_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Pipe4M_B25_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Pipe4M_B24_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Pipe4M_B23_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Pipe4M_B22_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Pipe4M_B21_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Pipe4M_B20_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Pipe4M_B19_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Pipe4M_B18_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Pipe4M_B13_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Pipe4M_B12_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Pipe4M_B11_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Pipe4M_B10_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Pipe4M_B9_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Pipe4M_B8_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Pipe4M_B7_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Pipe4M_B6_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Pipe4M_B5_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Pipe4M_B4_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Pipe4M_B3_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Pipe4M_B2_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Frame4M_B9_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Frame4M_B8_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Frame4M_B7_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Frame4M_B6_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Frame4M_B4_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Frame4M_B3_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Frame4M_B2_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Frame4M_B_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Frame4M_A27_GTS_HUM_STW_RoofPeak?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Frame4M_A27_DefaultSceneRoot?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Frame4M_A26_GTS_HUM_STW_RoofPeak?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Frame4M_A26_DefaultSceneRoot?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Frame4M_A25_GTS_HUM_STW_RoofPeak?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Frame4M_A25_DefaultSceneRoot?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Frame4M_A24_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Frame4M_A20_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Frame4M_A19_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Frame4M_A18_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Frame4M_A17_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Frame4M_A16_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Frame4M_A15_GTS_HUM_STW_RoofPeak?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Frame4M_A15_DefaultSceneRoot?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Frame4M_A14_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Frame4M_A13_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Frame4M_A12_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Frame4M_A11_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Frame4M_A10_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Frame4M_A9_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Frame4M_A8_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Frame4M_A7_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Frame4M_A6_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Frame4M_A5_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Frame4M_A4_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Frame4M_A2_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_STW_Frame4M_A_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_AIR_PilotPlatform_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_AIR_MountingRing01_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_AIR_MetalWire9_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_AIR_MetalWire8_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_AIR_MetalWire7_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_AIR_MetalWire6_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_AIR_MetalWire5_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_AIR_MetalWire4_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_AIR_MetalWire3_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_AIR_MetalWire02_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_AIR_MetalWire2_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_AIR_MetalWire01_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_AIR_CargoskidPiece01_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_HUM_AIR_Cargoskid01_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_ASP_IM_DC_Jar_H2_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_ASP_IM_DC_Jar_H01_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_ASP_EM_DC_Box_D20_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_ASP_EM_DC_Box_D18_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_ASP_EM_DC_Box_D17_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_ASP_EM_DC_Box_D16_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_ASP_EM_DC_Box_D15_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_ASP_EM_DC_Box_D14_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_ASP_EM_DC_Box_D13_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_ASP_EM_DC_Box_D12_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_ASP_EM_DC_Box_D11_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_ASP_EM_DC_Box_D10_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_ASP_EM_DC_Box_D9_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_ASP_EM_DC_Box_D8_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_ASP_EM_DC_Box_D7_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_ASP_EM_DC_Box_D6_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_ASP_EM_DC_Box_D5_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_ASP_EM_DC_Box_D4_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_ASP_EM_DC_Box_D3_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_ASP_EM_DC_Box_D2_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_ASP_EM_DC_Box_D1_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_AC1_SpikeWall24_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_AC1_SpikeWall23_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_AC1_SpikeWall22_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_AC1_SpikeWall21_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_AC1_SpikeWall20_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_AC1_SpikeWall19_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_AC1_SpikeWall18_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_AC1_SpikeWall17_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_AC1_SpikeWall16_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_AC1_SpikeWall15_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_AC1_SpikeWall14_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_AC1_SpikeWall13_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_AC1_SpikeWall12_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_AC1_SpikeWall10_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_AC1_SpikeWall9_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_AC1_SpikeWall8_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_AC1_SpikeWall7_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_AC1_SpikeWall6_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_AC1_SpikeWall5_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_AC1_SpikeWall4_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_AC1_SpikeWall3_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_AC1_SpikeWall2_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_AC1_SpikePost17_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_AC1_SpikePost16_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_AC1_SpikePost15_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_AC1_SpikePost14_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_AC1_SpikePost13_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_AC1_SpikePost12_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_AC1_SpikePost11_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_AC1_SpikePost10_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_AC1_SpikePost9_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_AC1_SpikePost8_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_AC1_SpikePost7_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_AC1_SpikePost6_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_AC1_SpikePost5_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_AC1_SpikePost4_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_AC1_SpikePost3_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_AC1_SpikePost2_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_AC1_SpikePost01_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_AC1_Sandbag11_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_AC1_Sandbag10_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_AC1_Sandbag9_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_AC1_Sandbag8_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_AC1_Sandbag7_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_AC1_Sandbag6_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_AC1_Sandbag5_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_AC1_Sandbag4_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_AC1_Sandbag03_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_AC1_Sandbag3_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_AC1_Sandbag02_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_AC1_Sandbag2_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_AC1_Sandbag01_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GRK_SwampMedRock01_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GPR_HUM_Ladder06_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GPR_HUM_Ladder05_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GPR_HUM_Ladder04_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GPR_HUM_Crane2_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GPR_HUM_Crane01_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GPR_HUM_Blankets_01c_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GPR_HUM_Blankets_01a_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    CableActor8_CableComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    CableActor5_CableComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    CableActor4_CableComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    CableActor2_CableComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    BP_SmallStool3_DefaultSceneRoot?: {
      ObjectName: string;
      ObjectPath: string;
    };
    BP_SmallStool2_GPR_HUM_Chair15?: {
      ObjectName: string;
      ObjectPath: string;
    };
    BP_SmallStool2_DefaultSceneRoot?: {
      ObjectName: string;
      ObjectPath: string;
    };
    BP_SmallStool_GPR_HUM_Chair15?: {
      ObjectName: string;
      ObjectPath: string;
    };
    BP_SmallStool_DefaultSceneRoot?: {
      ObjectName: string;
      ObjectPath: string;
    };
    BP_CargoBalloon_2_AnchorPoint?: {
      ObjectName: string;
      ObjectPath: string;
    };
    BP_CargoBalloon_2_GTS_HUM_AIR_Cargoskid01?: {
      ObjectName: string;
      ObjectPath: string;
    };
    BP_CargoBalloon_2_GTS_HUM_AIR_Windmill02?: {
      ObjectName: string;
      ObjectPath: string;
    };
    BP_CargoBalloon_2_GTS_HUM_AIR_Windmill01?: {
      ObjectName: string;
      ObjectPath: string;
    };
    BP_CargoBalloon_2_GTS_HUM_AIR_CargoBalloon01?: {
      ObjectName: string;
      ObjectPath: string;
    };
    BP_CargoBalloon_2_DefaultSceneRoot?: {
      ObjectName: string;
      ObjectPath: string;
    };
    BP_Balloon_6_AnchorPoint?: {
      ObjectName: string;
      ObjectPath: string;
    };
    BP_Balloon_6_GTS_HUM_AIR_CargoBalloon01?: {
      ObjectName: string;
      ObjectPath: string;
    };
    BP_Balloon_6_DefaultSceneRoot?: {
      ObjectName: string;
      ObjectPath: string;
    };
    BP_Balloon_4_AnchorPoint?: {
      ObjectName: string;
      ObjectPath: string;
    };
    BP_Balloon_4_GTS_HUM_AIR_CargoBalloon01?: {
      ObjectName: string;
      ObjectPath: string;
    };
    BP_Balloon_4_DefaultSceneRoot?: {
      ObjectName: string;
      ObjectPath: string;
    };
    BP_Balloon_3_AnchorPoint?: {
      ObjectName: string;
      ObjectPath: string;
    };
    BP_Balloon_3_GTS_HUM_AIR_CargoBalloon01?: {
      ObjectName: string;
      ObjectPath: string;
    };
    BP_Balloon_3_DefaultSceneRoot?: {
      ObjectName: string;
      ObjectPath: string;
    };
    BP_Balloon_2_AnchorPoint?: {
      ObjectName: string;
      ObjectPath: string;
    };
    BP_Balloon_2_GTS_HUM_AIR_CargoBalloon01?: {
      ObjectName: string;
      ObjectPath: string;
    };
    BP_Balloon_2_DefaultSceneRoot?: {
      ObjectName: string;
      ObjectPath: string;
    };
    TowerCenter_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_ASP_EM_DC_DamagedPanel01b3_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GTS_ASP_EM_DC_DamagedCylinder02_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GPR_HUM_Stall02b_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GPR_HUM_Stall01b_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    BP_SWP_CrateScrapPile01_GTS_HUM_TrainPart9_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    BP_SWP_CrateScrapPile01_GPR_HUM_Crate03_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    BP_SWP_CrateScrapPile01_GPR_HUM_Crate4_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    BP_SWP_CrateScrapPile01_GTS_HUM_TrainPart10_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    BP_SWP_CrateScrapPile01_GPR_HUM_Debris7_StaticMeshComponent0?: {
      ObjectName: string;
      ObjectPath: string;
    };
    BP_SWP_CrateScrapPile01_SharedRoot?: {
      ObjectName: string;
      ObjectPath: string;
    };
    SharedRoot?: {
      ObjectName: string;
      ObjectPath: string;
    };
    NavMarkupIsm?: {
      ObjectName: string;
      ObjectPath: string;
    };
    SplineMeshes?: Array<{
      ObjectName: string;
      ObjectPath: string;
    }>;
    A?: {
      X: number;
      Y: number;
      Z: string;
    };
    Splines?: Array<{
      ObjectName: string;
      ObjectPath: string;
    }>;
    BP_InteractableComponent?: {
      ObjectName: string;
      ObjectPath: string;
    };
    BP_FloatyTextComponent?: {
      ObjectName: string;
      ObjectPath: string;
    };
    IIMComponent?: {
      ObjectName: string;
      ObjectPath: string;
    };
    Billboard?: {
      ObjectName: string;
      ObjectPath: string;
    };
    MeshManagers?: Array<any>;
    ReadinessAwaiter?: {
      ObjectName: string;
      ObjectPath: string;
    };
    Bounds?: {
      X: number;
      Y: number;
      Z: number;
    };
    BoundsWorldMin?: {
      X: number;
      Y: number;
      Z: number;
    };
    BoundsWorldMax?: {
      X: number;
      Y: number;
      Z: number;
    };
    GameplayActorStride?: number;
    GameplayActorClass?: {
      ObjectName: string;
      ObjectPath: string;
    };
    MeshComponents?: Array<{
      ObjectName: string;
      ObjectPath: string;
    }>;
    Root?: {
      ObjectName: string;
      ObjectPath: string;
    };
    RuntimeResources?: Array<{
      Key: string;
      Value: {
        ResourceId: string;
        LeafSockets: Array<any>;
        StateComponentIDs: Array<number>;
      };
    }>;
    Instances?: Array<{
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
      InternalResourceId: number;
      InternalComponentId: number;
      InternalInstanceId: number;
      GameplayActorId: number;
      StateId: number;
      bIsDead: boolean;
    }>;
    GameplayComponents?: Array<any>;
    CodexAssetReference?: {
      CodexDataAsset: {
        ObjectName: string;
        ObjectPath: string;
      };
      CodexSubentryTag: {
        TagName: string;
      };
    };
    CodexStaticMeshComponent?: {
      ObjectName: string;
      ObjectPath: string;
    };
    colorred?: number;
    colorblue?: number;
    coloralpha?: number;
    fx_fogthickness?: number;
    Child_FX_Type?: number;
    colorgreen?: number;
    fx_envopenedge?: number;
    fx_envtrees?: number;
    fx_envshrubshore?: number;
    fx_envopenmid?: number;
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
      CollisionProfileName: string;
      CollisionResponses: {
        ResponseArray: Array<{
          Channel: string;
          Response: string;
        }>;
      };
    };
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
    CollisionTraceFlag?: string;
    bGenerateMirroredCollision?: boolean;
    PhysMaterial?: {
      ObjectName: string;
      ObjectPath: string;
    };
  };
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
  PerInstanceSMData?: Array<{
    TransformData: {
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
      IsRotationNormalized: boolean;
    };
  }>;
  Actors?: Array<
    | {
        ObjectName: string;
        ObjectPath: string;
      }
    | undefined
  >;
  URL?: {
    Protocol: string;
    Host: string;
    Port: number;
    Valid: boolean;
    Map: string;
    Op: Array<any>;
    Portal: string;
  };
  Model?: {
    ObjectName: string;
    ObjectPath: string;
  };
  ModelComponents?: Array<any>;
  LevelScriptActor?: {
    ObjectName: string;
    ObjectPath: string;
  };
  NavListStart: any;
  NavListEnd: any;
  PrecomputedVisibilityHandler?: {
    PrecomputedVisibilityCellBucketOriginXY: {
      X: number;
      Y: number;
    };
    PrecomputedVisibilityCellSizeXY: number;
    PrecomputedVisibilityCellSizeZ: number;
    PrecomputedVisibilityCellBucketSizeXY: number;
    PrecomputedVisibilityNumCellBuckets: number;
    PrecomputedVisibilityCellBuckets: Array<any>;
  };
  PrecomputedVolumeDistanceField?: {
    VolumeMaxDistance: number;
    VolumeBox: {
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
    VolumeSizeX: number;
    VolumeSizeY: number;
    VolumeSizeZ: number;
    Data: Array<any>;
  };
  Bounds?: {
    Origin: {
      X: number;
      Y: number;
      Z: number;
    };
    BoxExtent: {
      X: number;
      Y: number;
      Z: number;
    };
    SphereRadius: number;
  };
  Vectors?: Array<{
    X: number;
    Y: number;
    Z: number;
  }>;
  Points?: Array<{
    X: number;
    Y: number;
    Z: number;
  }>;
  Nodes?: Array<{
    Plane: {
      Vector: {
        X: number;
        Y: number;
        Z: number;
      };
      W: number;
      X: number;
      Y: number;
      Z: number;
    };
    iVertPool: number;
    iSurf: number;
    iVertexIndex: number;
    ComponentIndex: number;
    ComponentNodeIndex: number;
    ComponentElementIndex: number;
    iBack: number;
    iFront: number;
    iPlane: number;
    iCollisionBound: number;
    iZone0: number;
    iZone1: number;
    NumVertices: number;
    NodeFlags: number;
    iLeaf0: number;
    iLeaf1: number;
  }>;
  Surfs?: Array<{
    Material: any;
    PolyFlags: number;
    pBase: number;
    vNormal: number;
    vTextureU: number;
    vTextureV: number;
    iBrushPoly: number;
    Actor: any;
    Plane: {
      Vector: {
        X: number;
        Y: number;
        Z: number;
      };
      W: number;
      X: number;
      Y: number;
      Z: number;
    };
    LightMapScale: number;
    iLightmassIndex: number;
  }>;
  NumSharedSides?: number;
  VertexBuffer?: {
    Vertices: Array<any>;
  };
  LightingGuid?: string;
  LightmassSettings?: Array<{
    bUseTwoSidedLighting: boolean;
    bShadowIndirectOnly: boolean;
    bUseEmissiveForStaticLighting: boolean;
    bUseVertexNormalForHemisphereGather: boolean;
    EmissiveLightFalloffExponent: number;
    EmissiveLightExplicitInfluenceRadius: number;
    EmissiveBoost: number;
    DiffuseBoost: number;
    FullyOccludedSamplesFraction: number;
  }>;
  bStaticLightingBuiltGUID?: string;
  BodySetup?: {
    ObjectName: string;
    ObjectPath: string;
  };
  NavCollision: any;
  RenderData?: {
    LODs: Array<{
      Sections: Array<{
        MaterialIndex: number;
        FirstIndex: number;
        NumTriangles: number;
        MinVertexIndex: number;
        MaxVertexIndex: number;
        bEnableCollision: boolean;
        bCastShadow: boolean;
        bForceOpaque: boolean;
        bVisibleInRayTracing: boolean;
      }>;
      MaxDeviation: number;
      PositionVertexBuffer: {
        Stride: number;
        NumVertices: number;
      };
      VertexBuffer: {
        NumTexCoords: number;
        NumVertices: number;
        Strides: number;
        UseHighPrecisionTangentBasis: boolean;
        UseFullPrecisionUVs: boolean;
      };
      ColorVertexBuffer: {
        Stride: number;
        NumVertices: number;
      };
      CardRepresentationData: {
        Bounds: {
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
        MaxLodLevel: number;
        bMostlyTwoSided: boolean;
        CardBuildData: Array<{
          OBB: {
            AxisX: {
              X: number;
              Y: number;
              Z: number;
            };
            AxisY: {
              X: number;
              Y: number;
              Z: number;
            };
            AxisZ: {
              X: number;
              Y: number;
              Z: number;
            };
            Origin: {
              X: number;
              Y: number;
              Z: number;
            };
            Extent: {
              X: number;
              Y: number;
              Z: number;
            };
          };
          LODLevel: number;
          AxisAlignedDirectionIndex: number;
        }>;
      };
    }>;
    NaniteResources: {
      RootData: any;
      StreamablePages: {
        BulkDataFlags: string;
        ElementCount: number;
        SizeOnDisk: number;
        OffsetInFile: string;
      };
      ImposterAtlas: Array<any>;
      HierarchyNodes: Array<any>;
      HierarchyRootOffsets: Array<any>;
      PageStreamingStates: Array<any>;
      PageDependencies: Array<any>;
      NumRootPages: number;
      PositionPrecision: number;
      NormalPrecision: number;
      TangentPrecision: number;
      NumInputTriangles: number;
      NumInputVertices: number;
      NumInputMeshes: number;
      NumInputTexCoords: number;
      NumClusters: number;
      ResourceFlags: number;
    };
    Bounds: {
      Origin: {
        X: number;
        Y: number;
        Z: number;
      };
      BoxExtent: {
        X: number;
        Y: number;
        Z: number;
      };
      SphereRadius: number;
    };
    bLODsShareStaticLighting: boolean;
    ScreenSize: Array<number>;
  };
  SizeX?: number;
  SizeY?: number;
  PackedData?: number;
  PixelFormat?: string;
  FirstMipToSerialize?: number;
  Mips?: Array<{
    BulkData: {
      BulkDataFlags: string;
      ElementCount: number;
      SizeOnDisk: number;
      OffsetInFile: string;
    };
    SizeX: number;
    SizeY: number;
    SizeZ: number;
  }>;
  PersistentLevel?: {
    ObjectName: string;
    ObjectPath: string;
  };
  ExtraReferencedObjects?: Array<any>;
  StreamingLevels?: Array<any>;
}>;

export type CDT_BPCreatureData = Array<{
  Type: string;
  Name: string;
  Class: string;
  Properties: {
    ParentTables: Array<{
      ObjectName: string;
      ObjectPath: string;
    }>;
    RowStruct: {
      ObjectName: string;
      ObjectPath: string;
    };
  };
  Rows: {
    [key: string]: {
      AICCreatureData_5_4C3F914F4D9F5FF753D7FA839410B9CE: {
        DataTable: {
          ObjectName: string;
          ObjectPath: string;
        };
        RowName: string;
      };
      ItemRewards_105_F2FAFE4C41443D911A7AF49E33CF86AF: any;
      AddedTags_2_C5AB1E914E0203006F2C258CFA79D710: Array<string>;
      HostilityTag_27_8E058A5D40DEC19B67CC649035B59554: {
        TagName: string;
      };
      Prey_11_C65EC3284577F75E9FE801B23C46468B: Array<any>;
      HitReactionThresholdStagger_98_CAED1B4F46E87ECE01E6FCAF72CBE239: number;
      HitReactionThresholdKnockdown_99_0E043984433C32FCADBDB181F6807263: number;
      HitReactionThresholdExplosive_102_F681D9B246B2FB37F6AAF2BD47575BD4: number;
      AllowCorpseDamage_39_B02E6CE644AECF6AAD5C76BE25A19FBA: boolean;
      GASAttributes_47_D7D5DB844903F7C7243F3BA3DD65BC40: Array<any>;
      HitReactThresholdReactions_53_4CA5202E457299B7D756F5855349F67E: {
        UseHitReactThresholdReactions_11_3D682FB1451332DDFFB414A0973B47BE: boolean;
        HitReactThresholdValue_12_6D2278E04C0D408DE48D0BB06D5CBEBF: number;
        HitReactThresholdUpdateRate_14_40023FBA448CD3F24B146D822E703C06: number;
        HitReactThresholdDecayRate_15_F92CCB104ED2297B2B679D8DBDDBFAEB: number;
        HitReactThresholdIncreasePerReaction_21_CFAF94394C274D4655251A9D18795A4E: number;
        HitReactThresholdIncreaseDecayRate_22_7B227BDD4C3ADCC7B705D49D24799334: number;
      };
      MovementSpeeds_58_B5681098453142D99C175ABC409D7C9B: Array<{
        Key: string;
        Value: number;
      }>;
      WeakPointData_61_C97D6665404AB38EF5A19DB7D85A2064: {
        DataTable: {
          ObjectName: string;
          ObjectPath: string;
        };
        RowName: string;
      };
      UIData_65_EC03BEAC4A64525471F201B77ABADC02: {
        DataTable: {
          ObjectName: string;
          ObjectPath: string;
        };
        RowName: string;
      };
      MeshVariations_78_3498B6A940CC1FEF7AB75986B8BC75FF: Array<any>;
      SocketTraceData_86_7E3C67E64F42AC0A04A0E190F38C26EF: Array<any>;
      CorpseCleanupTime_89_88C9EBDB4ED67F9EC13BFA8C68F44301: number;
      FamilyTag_92_622830484996C2C36F57A5920FE79FF1: {
        TagName: string;
      };
      PowerTier_95_90754F82435854FBA2E68FBC64F29752: number;
      ChallengeRating_97_D9F774424149996AAF3895B82F0370BA: number;
      CreatureClassCategory_108_2650EBF0470C603DD877039E2A821F42: string;
    };
  };
}>;

export type CDT_CreatureUIData = Array<{
  Type: string;
  Name: string;
  Class: string;
  Properties: {
    ParentTables: Array<{
      ObjectName: string;
      ObjectPath: string;
    }>;
    RowStruct: {
      ObjectName: string;
      ObjectPath: string;
    };
  };
  Rows: {
    Default: {
      CreatureName_2_DC83695545356E53970200BDB975D888: {
        Namespace: string;
        Key: string;
        SourceString: string;
        LocalizedString: string;
      };
      CreatureIcon_7_DF4EEA0643C8418D15044B8CF2A9A018: {
        AssetPathName: string;
        SubPathString: string;
      };
      FerocityMin_10_BB446F4C4B68F7CDEDF902B32DA39A04: number;
      FerocityMax_12_42DB45344FD4021F041B8CAE20C45427: number;
      Biomes_16_E1592CDE48EAC92ABE18348E6664D599: Array<string>;
      DefaultShowNameplate_19_D2A233F74E1D799A216806B6FA79980C: boolean;
    };
    Critter: {
      CreatureName_2_DC83695545356E53970200BDB975D888: {
        Namespace: string;
        Key: string;
        SourceString: string;
        LocalizedString: string;
      };
      CreatureIcon_7_DF4EEA0643C8418D15044B8CF2A9A018: {
        AssetPathName: string;
        SubPathString: string;
      };
      FerocityMin_10_BB446F4C4B68F7CDEDF902B32DA39A04: number;
      FerocityMax_12_42DB45344FD4021F041B8CAE20C45427: number;
      Biomes_16_E1592CDE48EAC92ABE18348E6664D599: Array<string>;
      DefaultShowNameplate_19_D2A233F74E1D799A216806B6FA79980C: boolean;
    };
    Bear: {
      CreatureName_2_DC83695545356E53970200BDB975D888: {
        TableId: string;
        Key: string;
      };
      CreatureIcon_7_DF4EEA0643C8418D15044B8CF2A9A018: {
        AssetPathName: string;
        SubPathString: string;
      };
      FerocityMin_10_BB446F4C4B68F7CDEDF902B32DA39A04: number;
      FerocityMax_12_42DB45344FD4021F041B8CAE20C45427: number;
      Biomes_16_E1592CDE48EAC92ABE18348E6664D599: Array<string>;
      DefaultShowNameplate_19_D2A233F74E1D799A216806B6FA79980C: boolean;
    };
    Wolf: {
      CreatureName_2_DC83695545356E53970200BDB975D888: {
        TableId: string;
        Key: string;
      };
      CreatureIcon_7_DF4EEA0643C8418D15044B8CF2A9A018: {
        AssetPathName: string;
        SubPathString: string;
      };
      FerocityMin_10_BB446F4C4B68F7CDEDF902B32DA39A04: number;
      FerocityMax_12_42DB45344FD4021F041B8CAE20C45427: number;
      Biomes_16_E1592CDE48EAC92ABE18348E6664D599: Array<string>;
      DefaultShowNameplate_19_D2A233F74E1D799A216806B6FA79980C: boolean;
    };
    Deer: {
      CreatureName_2_DC83695545356E53970200BDB975D888: {
        TableId: string;
        Key: string;
      };
      CreatureIcon_7_DF4EEA0643C8418D15044B8CF2A9A018: {
        AssetPathName: string;
        SubPathString: string;
      };
      FerocityMin_10_BB446F4C4B68F7CDEDF902B32DA39A04: number;
      FerocityMax_12_42DB45344FD4021F041B8CAE20C45427: number;
      Biomes_16_E1592CDE48EAC92ABE18348E6664D599: Array<string>;
      DefaultShowNameplate_19_D2A233F74E1D799A216806B6FA79980C: boolean;
    };
    DeerDoe: {
      CreatureName_2_DC83695545356E53970200BDB975D888: {
        TableId: string;
        Key: string;
      };
      CreatureIcon_7_DF4EEA0643C8418D15044B8CF2A9A018: {
        AssetPathName: string;
        SubPathString: string;
      };
      FerocityMin_10_BB446F4C4B68F7CDEDF902B32DA39A04: number;
      FerocityMax_12_42DB45344FD4021F041B8CAE20C45427: number;
      Biomes_16_E1592CDE48EAC92ABE18348E6664D599: Array<string>;
      DefaultShowNameplate_19_D2A233F74E1D799A216806B6FA79980C: boolean;
    };
    DeerStag: {
      CreatureName_2_DC83695545356E53970200BDB975D888: {
        TableId: string;
        Key: string;
      };
      CreatureIcon_7_DF4EEA0643C8418D15044B8CF2A9A018: {
        AssetPathName: string;
        SubPathString: string;
      };
      FerocityMin_10_BB446F4C4B68F7CDEDF902B32DA39A04: number;
      FerocityMax_12_42DB45344FD4021F041B8CAE20C45427: number;
      Biomes_16_E1592CDE48EAC92ABE18348E6664D599: Array<string>;
      DefaultShowNameplate_19_D2A233F74E1D799A216806B6FA79980C: boolean;
    };
    DeerFawn: {
      CreatureName_2_DC83695545356E53970200BDB975D888: {
        TableId: string;
        Key: string;
      };
      CreatureIcon_7_DF4EEA0643C8418D15044B8CF2A9A018: {
        AssetPathName: string;
        SubPathString: string;
      };
      FerocityMin_10_BB446F4C4B68F7CDEDF902B32DA39A04: number;
      FerocityMax_12_42DB45344FD4021F041B8CAE20C45427: number;
      Biomes_16_E1592CDE48EAC92ABE18348E6664D599: Array<string>;
      DefaultShowNameplate_19_D2A233F74E1D799A216806B6FA79980C: boolean;
    };
    Elk: {
      CreatureName_2_DC83695545356E53970200BDB975D888: {
        Namespace: string;
        Key: string;
        SourceString: string;
        LocalizedString: string;
      };
      CreatureIcon_7_DF4EEA0643C8418D15044B8CF2A9A018: {
        AssetPathName: string;
        SubPathString: string;
      };
      FerocityMin_10_BB446F4C4B68F7CDEDF902B32DA39A04: number;
      FerocityMax_12_42DB45344FD4021F041B8CAE20C45427: number;
      Biomes_16_E1592CDE48EAC92ABE18348E6664D599: Array<string>;
      DefaultShowNameplate_19_D2A233F74E1D799A216806B6FA79980C: boolean;
    };
    ElkDoe: {
      CreatureName_2_DC83695545356E53970200BDB975D888: {
        Namespace: string;
        Key: string;
        SourceString: string;
        LocalizedString: string;
      };
      CreatureIcon_7_DF4EEA0643C8418D15044B8CF2A9A018: {
        AssetPathName: string;
        SubPathString: string;
      };
      FerocityMin_10_BB446F4C4B68F7CDEDF902B32DA39A04: number;
      FerocityMax_12_42DB45344FD4021F041B8CAE20C45427: number;
      Biomes_16_E1592CDE48EAC92ABE18348E6664D599: Array<string>;
      DefaultShowNameplate_19_D2A233F74E1D799A216806B6FA79980C: boolean;
    };
    ElkStag: {
      CreatureName_2_DC83695545356E53970200BDB975D888: {
        Namespace: string;
        Key: string;
        SourceString: string;
        LocalizedString: string;
      };
      CreatureIcon_7_DF4EEA0643C8418D15044B8CF2A9A018: {
        AssetPathName: string;
        SubPathString: string;
      };
      FerocityMin_10_BB446F4C4B68F7CDEDF902B32DA39A04: number;
      FerocityMax_12_42DB45344FD4021F041B8CAE20C45427: number;
      Biomes_16_E1592CDE48EAC92ABE18348E6664D599: Array<string>;
      DefaultShowNameplate_19_D2A233F74E1D799A216806B6FA79980C: boolean;
    };
    ElkFawn: {
      CreatureName_2_DC83695545356E53970200BDB975D888: {
        Namespace: string;
        Key: string;
        SourceString: string;
        LocalizedString: string;
      };
      CreatureIcon_7_DF4EEA0643C8418D15044B8CF2A9A018: {
        AssetPathName: string;
        SubPathString: string;
      };
      FerocityMin_10_BB446F4C4B68F7CDEDF902B32DA39A04: number;
      FerocityMax_12_42DB45344FD4021F041B8CAE20C45427: number;
      Biomes_16_E1592CDE48EAC92ABE18348E6664D599: Array<string>;
      DefaultShowNameplate_19_D2A233F74E1D799A216806B6FA79980C: boolean;
    };
    VineElk: {
      CreatureName_2_DC83695545356E53970200BDB975D888: {
        TableId: string;
        Key: string;
      };
      CreatureIcon_7_DF4EEA0643C8418D15044B8CF2A9A018: {
        AssetPathName: string;
        SubPathString: string;
      };
      FerocityMin_10_BB446F4C4B68F7CDEDF902B32DA39A04: number;
      FerocityMax_12_42DB45344FD4021F041B8CAE20C45427: number;
      Biomes_16_E1592CDE48EAC92ABE18348E6664D599: Array<string>;
      DefaultShowNameplate_19_D2A233F74E1D799A216806B6FA79980C: boolean;
    };
    Bighorn: {
      CreatureName_2_DC83695545356E53970200BDB975D888: {
        Namespace: string;
        Key: string;
        SourceString: string;
        LocalizedString: string;
      };
      CreatureIcon_7_DF4EEA0643C8418D15044B8CF2A9A018: {
        AssetPathName: string;
        SubPathString: string;
      };
      FerocityMin_10_BB446F4C4B68F7CDEDF902B32DA39A04: number;
      FerocityMax_12_42DB45344FD4021F041B8CAE20C45427: number;
      Biomes_16_E1592CDE48EAC92ABE18348E6664D599: Array<string>;
      DefaultShowNameplate_19_D2A233F74E1D799A216806B6FA79980C: boolean;
    };
    BighornFemale: {
      CreatureName_2_DC83695545356E53970200BDB975D888: {
        Namespace: string;
        Key: string;
        SourceString: string;
        LocalizedString: string;
      };
      CreatureIcon_7_DF4EEA0643C8418D15044B8CF2A9A018: {
        AssetPathName: string;
        SubPathString: string;
      };
      FerocityMin_10_BB446F4C4B68F7CDEDF902B32DA39A04: number;
      FerocityMax_12_42DB45344FD4021F041B8CAE20C45427: number;
      Biomes_16_E1592CDE48EAC92ABE18348E6664D599: Array<string>;
      DefaultShowNameplate_19_D2A233F74E1D799A216806B6FA79980C: boolean;
    };
    BighornMale: {
      CreatureName_2_DC83695545356E53970200BDB975D888: {
        Namespace: string;
        Key: string;
        SourceString: string;
        LocalizedString: string;
      };
      CreatureIcon_7_DF4EEA0643C8418D15044B8CF2A9A018: {
        AssetPathName: string;
        SubPathString: string;
      };
      FerocityMin_10_BB446F4C4B68F7CDEDF902B32DA39A04: number;
      FerocityMax_12_42DB45344FD4021F041B8CAE20C45427: number;
      Biomes_16_E1592CDE48EAC92ABE18348E6664D599: Array<string>;
      DefaultShowNameplate_19_D2A233F74E1D799A216806B6FA79980C: boolean;
    };
    BighornYoung: {
      CreatureName_2_DC83695545356E53970200BDB975D888: {
        Namespace: string;
        Key: string;
        SourceString: string;
        LocalizedString: string;
      };
      CreatureIcon_7_DF4EEA0643C8418D15044B8CF2A9A018: {
        AssetPathName: string;
        SubPathString: string;
      };
      FerocityMin_10_BB446F4C4B68F7CDEDF902B32DA39A04: number;
      FerocityMax_12_42DB45344FD4021F041B8CAE20C45427: number;
      Biomes_16_E1592CDE48EAC92ABE18348E6664D599: Array<string>;
      DefaultShowNameplate_19_D2A233F74E1D799A216806B6FA79980C: boolean;
    };
    Hippo: {
      CreatureName_2_DC83695545356E53970200BDB975D888: {
        TableId: string;
        Key: string;
      };
      CreatureIcon_7_DF4EEA0643C8418D15044B8CF2A9A018: {
        AssetPathName: string;
        SubPathString: string;
      };
      FerocityMin_10_BB446F4C4B68F7CDEDF902B32DA39A04: number;
      FerocityMax_12_42DB45344FD4021F041B8CAE20C45427: number;
      Biomes_16_E1592CDE48EAC92ABE18348E6664D599: Array<string>;
      DefaultShowNameplate_19_D2A233F74E1D799A216806B6FA79980C: boolean;
    };
    HippoAdult: {
      CreatureName_2_DC83695545356E53970200BDB975D888: {
        TableId: string;
        Key: string;
      };
      CreatureIcon_7_DF4EEA0643C8418D15044B8CF2A9A018: {
        AssetPathName: string;
        SubPathString: string;
      };
      FerocityMin_10_BB446F4C4B68F7CDEDF902B32DA39A04: number;
      FerocityMax_12_42DB45344FD4021F041B8CAE20C45427: number;
      Biomes_16_E1592CDE48EAC92ABE18348E6664D599: Array<string>;
      DefaultShowNameplate_19_D2A233F74E1D799A216806B6FA79980C: boolean;
    };
    HippoYoung: {
      CreatureName_2_DC83695545356E53970200BDB975D888: {
        TableId: string;
        Key: string;
      };
      CreatureIcon_7_DF4EEA0643C8418D15044B8CF2A9A018: {
        AssetPathName: string;
        SubPathString: string;
      };
      FerocityMin_10_BB446F4C4B68F7CDEDF902B32DA39A04: number;
      FerocityMax_12_42DB45344FD4021F041B8CAE20C45427: number;
      Biomes_16_E1592CDE48EAC92ABE18348E6664D599: Array<string>;
      DefaultShowNameplate_19_D2A233F74E1D799A216806B6FA79980C: boolean;
    };
    Rabbit: {
      CreatureName_2_DC83695545356E53970200BDB975D888: {
        TableId: string;
        Key: string;
      };
      CreatureIcon_7_DF4EEA0643C8418D15044B8CF2A9A018: {
        AssetPathName: string;
        SubPathString: string;
      };
      FerocityMin_10_BB446F4C4B68F7CDEDF902B32DA39A04: number;
      FerocityMax_12_42DB45344FD4021F041B8CAE20C45427: number;
      Biomes_16_E1592CDE48EAC92ABE18348E6664D599: Array<string>;
      DefaultShowNameplate_19_D2A233F74E1D799A216806B6FA79980C: boolean;
    };
    CritterDog: {
      CreatureName_2_DC83695545356E53970200BDB975D888: {
        TableId: string;
        Key: string;
      };
      CreatureIcon_7_DF4EEA0643C8418D15044B8CF2A9A018: {
        AssetPathName: string;
        SubPathString: string;
      };
      FerocityMin_10_BB446F4C4B68F7CDEDF902B32DA39A04: number;
      FerocityMax_12_42DB45344FD4021F041B8CAE20C45427: number;
      Biomes_16_E1592CDE48EAC92ABE18348E6664D599: Array<string>;
      DefaultShowNameplate_19_D2A233F74E1D799A216806B6FA79980C: boolean;
    };
    CritterCat: {
      CreatureName_2_DC83695545356E53970200BDB975D888: {
        TableId: string;
        Key: string;
      };
      CreatureIcon_7_DF4EEA0643C8418D15044B8CF2A9A018: {
        AssetPathName: string;
        SubPathString: string;
      };
      FerocityMin_10_BB446F4C4B68F7CDEDF902B32DA39A04: number;
      FerocityMax_12_42DB45344FD4021F041B8CAE20C45427: number;
      Biomes_16_E1592CDE48EAC92ABE18348E6664D599: Array<string>;
      DefaultShowNameplate_19_D2A233F74E1D799A216806B6FA79980C: boolean;
    };
    CritterScarab: {
      CreatureName_2_DC83695545356E53970200BDB975D888: {
        TableId: string;
        Key: string;
      };
      CreatureIcon_7_DF4EEA0643C8418D15044B8CF2A9A018: {
        AssetPathName: string;
        SubPathString: string;
      };
      FerocityMin_10_BB446F4C4B68F7CDEDF902B32DA39A04: number;
      FerocityMax_12_42DB45344FD4021F041B8CAE20C45427: number;
      Biomes_16_E1592CDE48EAC92ABE18348E6664D599: Array<string>;
      DefaultShowNameplate_19_D2A233F74E1D799A216806B6FA79980C: boolean;
    };
    MushroomRabbit: {
      CreatureName_2_DC83695545356E53970200BDB975D888: {
        TableId: string;
        Key: string;
      };
      CreatureIcon_7_DF4EEA0643C8418D15044B8CF2A9A018: {
        AssetPathName: string;
        SubPathString: string;
      };
      FerocityMin_10_BB446F4C4B68F7CDEDF902B32DA39A04: number;
      FerocityMax_12_42DB45344FD4021F041B8CAE20C45427: number;
      Biomes_16_E1592CDE48EAC92ABE18348E6664D599: Array<string>;
      DefaultShowNameplate_19_D2A233F74E1D799A216806B6FA79980C: boolean;
    };
    Raccoon: {
      CreatureName_2_DC83695545356E53970200BDB975D888: {
        TableId: string;
        Key: string;
      };
      CreatureIcon_7_DF4EEA0643C8418D15044B8CF2A9A018: {
        AssetPathName: string;
        SubPathString: string;
      };
      FerocityMin_10_BB446F4C4B68F7CDEDF902B32DA39A04: number;
      FerocityMax_12_42DB45344FD4021F041B8CAE20C45427: number;
      Biomes_16_E1592CDE48EAC92ABE18348E6664D599: Array<string>;
      DefaultShowNameplate_19_D2A233F74E1D799A216806B6FA79980C: boolean;
    };
    Rhino: {
      CreatureName_2_DC83695545356E53970200BDB975D888: {
        Namespace: string;
        Key: string;
        SourceString: string;
        LocalizedString: string;
      };
      CreatureIcon_7_DF4EEA0643C8418D15044B8CF2A9A018: {
        AssetPathName: string;
        SubPathString: string;
      };
      FerocityMin_10_BB446F4C4B68F7CDEDF902B32DA39A04: number;
      FerocityMax_12_42DB45344FD4021F041B8CAE20C45427: number;
      Biomes_16_E1592CDE48EAC92ABE18348E6664D599: Array<string>;
      DefaultShowNameplate_19_D2A233F74E1D799A216806B6FA79980C: boolean;
    };
    Spider: {
      CreatureName_2_DC83695545356E53970200BDB975D888: {
        TableId: string;
        Key: string;
      };
      CreatureIcon_7_DF4EEA0643C8418D15044B8CF2A9A018: {
        AssetPathName: string;
        SubPathString: string;
      };
      FerocityMin_10_BB446F4C4B68F7CDEDF902B32DA39A04: number;
      FerocityMax_12_42DB45344FD4021F041B8CAE20C45427: number;
      Biomes_16_E1592CDE48EAC92ABE18348E6664D599: Array<string>;
      DefaultShowNameplate_19_D2A233F74E1D799A216806B6FA79980C: boolean;
    };
    YellowSpider: {
      CreatureName_2_DC83695545356E53970200BDB975D888: {
        TableId: string;
        Key: string;
      };
      CreatureIcon_7_DF4EEA0643C8418D15044B8CF2A9A018: {
        AssetPathName: string;
        SubPathString: string;
      };
      FerocityMin_10_BB446F4C4B68F7CDEDF902B32DA39A04: number;
      FerocityMax_12_42DB45344FD4021F041B8CAE20C45427: number;
      Biomes_16_E1592CDE48EAC92ABE18348E6664D599: Array<string>;
      DefaultShowNameplate_19_D2A233F74E1D799A216806B6FA79980C: boolean;
    };
    FaeAssassin: {
      CreatureName_2_DC83695545356E53970200BDB975D888: {
        TableId: string;
        Key: string;
      };
      CreatureIcon_7_DF4EEA0643C8418D15044B8CF2A9A018: {
        AssetPathName: string;
        SubPathString: string;
      };
      FerocityMin_10_BB446F4C4B68F7CDEDF902B32DA39A04: number;
      FerocityMax_12_42DB45344FD4021F041B8CAE20C45427: number;
      Biomes_16_E1592CDE48EAC92ABE18348E6664D599: Array<string>;
      DefaultShowNameplate_19_D2A233F74E1D799A216806B6FA79980C: boolean;
    };
    FaeCommander: {
      CreatureName_2_DC83695545356E53970200BDB975D888: {
        Namespace: string;
        Key: string;
        SourceString: string;
        LocalizedString: string;
      };
      CreatureIcon_7_DF4EEA0643C8418D15044B8CF2A9A018: {
        AssetPathName: string;
        SubPathString: string;
      };
      FerocityMin_10_BB446F4C4B68F7CDEDF902B32DA39A04: number;
      FerocityMax_12_42DB45344FD4021F041B8CAE20C45427: number;
      Biomes_16_E1592CDE48EAC92ABE18348E6664D599: Array<string>;
      DefaultShowNameplate_19_D2A233F74E1D799A216806B6FA79980C: boolean;
    };
    Workhorse: {
      CreatureName_2_DC83695545356E53970200BDB975D888: {
        Namespace: string;
        Key: string;
        SourceString: string;
        LocalizedString: string;
      };
      CreatureIcon_7_DF4EEA0643C8418D15044B8CF2A9A018: {
        AssetPathName: string;
        SubPathString: string;
      };
      FerocityMin_10_BB446F4C4B68F7CDEDF902B32DA39A04: number;
      FerocityMax_12_42DB45344FD4021F041B8CAE20C45427: number;
      Biomes_16_E1592CDE48EAC92ABE18348E6664D599: Array<string>;
      DefaultShowNameplate_19_D2A233F74E1D799A216806B6FA79980C: boolean;
    };
    Horse: {
      CreatureName_2_DC83695545356E53970200BDB975D888: {
        Namespace: string;
        Key: string;
        SourceString: string;
        LocalizedString: string;
      };
      CreatureIcon_7_DF4EEA0643C8418D15044B8CF2A9A018: {
        AssetPathName: string;
        SubPathString: string;
      };
      FerocityMin_10_BB446F4C4B68F7CDEDF902B32DA39A04: number;
      FerocityMax_12_42DB45344FD4021F041B8CAE20C45427: number;
      Biomes_16_E1592CDE48EAC92ABE18348E6664D599: Array<string>;
      DefaultShowNameplate_19_D2A233F74E1D799A216806B6FA79980C: boolean;
    };
    Boar: {
      CreatureName_2_DC83695545356E53970200BDB975D888: {
        TableId: string;
        Key: string;
      };
      CreatureIcon_7_DF4EEA0643C8418D15044B8CF2A9A018: {
        AssetPathName: string;
        SubPathString: string;
      };
      FerocityMin_10_BB446F4C4B68F7CDEDF902B32DA39A04: number;
      FerocityMax_12_42DB45344FD4021F041B8CAE20C45427: number;
      Biomes_16_E1592CDE48EAC92ABE18348E6664D599: Array<string>;
      DefaultShowNameplate_19_D2A233F74E1D799A216806B6FA79980C: boolean;
    };
    BoarAdult: {
      CreatureName_2_DC83695545356E53970200BDB975D888: {
        TableId: string;
        Key: string;
      };
      CreatureIcon_7_DF4EEA0643C8418D15044B8CF2A9A018: {
        AssetPathName: string;
        SubPathString: string;
      };
      FerocityMin_10_BB446F4C4B68F7CDEDF902B32DA39A04: number;
      FerocityMax_12_42DB45344FD4021F041B8CAE20C45427: number;
      Biomes_16_E1592CDE48EAC92ABE18348E6664D599: Array<string>;
      DefaultShowNameplate_19_D2A233F74E1D799A216806B6FA79980C: boolean;
    };
    BoarYoung: {
      CreatureName_2_DC83695545356E53970200BDB975D888: {
        TableId: string;
        Key: string;
      };
      CreatureIcon_7_DF4EEA0643C8418D15044B8CF2A9A018: {
        AssetPathName: string;
        SubPathString: string;
      };
      FerocityMin_10_BB446F4C4B68F7CDEDF902B32DA39A04: number;
      FerocityMax_12_42DB45344FD4021F041B8CAE20C45427: number;
      Biomes_16_E1592CDE48EAC92ABE18348E6664D599: Array<string>;
      DefaultShowNameplate_19_D2A233F74E1D799A216806B6FA79980C: boolean;
    };
    Hellpig: {
      CreatureName_2_DC83695545356E53970200BDB975D888: {
        TableId: string;
        Key: string;
      };
      CreatureIcon_7_DF4EEA0643C8418D15044B8CF2A9A018: {
        AssetPathName: string;
        SubPathString: string;
      };
      FerocityMin_10_BB446F4C4B68F7CDEDF902B32DA39A04: number;
      FerocityMax_12_42DB45344FD4021F041B8CAE20C45427: number;
      Biomes_16_E1592CDE48EAC92ABE18348E6664D599: Array<string>;
      DefaultShowNameplate_19_D2A233F74E1D799A216806B6FA79980C: boolean;
    };
    Bound: {
      CreatureName_2_DC83695545356E53970200BDB975D888: {
        Namespace: string;
        Key: string;
        SourceString: string;
        LocalizedString: string;
      };
      CreatureIcon_7_DF4EEA0643C8418D15044B8CF2A9A018: {
        AssetPathName: string;
        SubPathString: string;
      };
      FerocityMin_10_BB446F4C4B68F7CDEDF902B32DA39A04: number;
      FerocityMax_12_42DB45344FD4021F041B8CAE20C45427: number;
      Biomes_16_E1592CDE48EAC92ABE18348E6664D599: Array<string>;
      DefaultShowNameplate_19_D2A233F74E1D799A216806B6FA79980C: boolean;
    };
    BoundMinion: {
      CreatureName_2_DC83695545356E53970200BDB975D888: {
        TableId: string;
        Key: string;
      };
      CreatureIcon_7_DF4EEA0643C8418D15044B8CF2A9A018: {
        AssetPathName: string;
        SubPathString: string;
      };
      FerocityMin_10_BB446F4C4B68F7CDEDF902B32DA39A04: number;
      FerocityMax_12_42DB45344FD4021F041B8CAE20C45427: number;
      Biomes_16_E1592CDE48EAC92ABE18348E6664D599: Array<string>;
      DefaultShowNameplate_19_D2A233F74E1D799A216806B6FA79980C: boolean;
    };
    BoundMinon_Quad: {
      CreatureName_2_DC83695545356E53970200BDB975D888: {
        TableId: string;
        Key: string;
      };
      CreatureIcon_7_DF4EEA0643C8418D15044B8CF2A9A018: {
        AssetPathName: string;
        SubPathString: string;
      };
      FerocityMin_10_BB446F4C4B68F7CDEDF902B32DA39A04: number;
      FerocityMax_12_42DB45344FD4021F041B8CAE20C45427: number;
      Biomes_16_E1592CDE48EAC92ABE18348E6664D599: Array<string>;
      DefaultShowNameplate_19_D2A233F74E1D799A216806B6FA79980C: boolean;
    };
    BoundLanternhead: {
      CreatureName_2_DC83695545356E53970200BDB975D888: {
        TableId: string;
        Key: string;
      };
      CreatureIcon_7_DF4EEA0643C8418D15044B8CF2A9A018: {
        AssetPathName: string;
        SubPathString: string;
      };
      FerocityMin_10_BB446F4C4B68F7CDEDF902B32DA39A04: number;
      FerocityMax_12_42DB45344FD4021F041B8CAE20C45427: number;
      Biomes_16_E1592CDE48EAC92ABE18348E6664D599: Array<string>;
      DefaultShowNameplate_19_D2A233F74E1D799A216806B6FA79980C: boolean;
    };
    BoundGrenadier: {
      CreatureName_2_DC83695545356E53970200BDB975D888: {
        TableId: string;
        Key: string;
      };
      CreatureIcon_7_DF4EEA0643C8418D15044B8CF2A9A018: {
        AssetPathName: string;
        SubPathString: string;
      };
      FerocityMin_10_BB446F4C4B68F7CDEDF902B32DA39A04: number;
      FerocityMax_12_42DB45344FD4021F041B8CAE20C45427: number;
      Biomes_16_E1592CDE48EAC92ABE18348E6664D599: Array<string>;
      DefaultShowNameplate_19_D2A233F74E1D799A216806B6FA79980C: boolean;
    };
    BoundSwordsman: {
      CreatureName_2_DC83695545356E53970200BDB975D888: {
        TableId: string;
        Key: string;
      };
      CreatureIcon_7_DF4EEA0643C8418D15044B8CF2A9A018: {
        AssetPathName: string;
        SubPathString: string;
      };
      FerocityMin_10_BB446F4C4B68F7CDEDF902B32DA39A04: number;
      FerocityMax_12_42DB45344FD4021F041B8CAE20C45427: number;
      Biomes_16_E1592CDE48EAC92ABE18348E6664D599: Array<string>;
      DefaultShowNameplate_19_D2A233F74E1D799A216806B6FA79980C: boolean;
    };
    BoundCaster: {
      CreatureName_2_DC83695545356E53970200BDB975D888: {
        TableId: string;
        Key: string;
      };
      CreatureIcon_7_DF4EEA0643C8418D15044B8CF2A9A018: {
        AssetPathName: string;
        SubPathString: string;
      };
      FerocityMin_10_BB446F4C4B68F7CDEDF902B32DA39A04: number;
      FerocityMax_12_42DB45344FD4021F041B8CAE20C45427: number;
      Biomes_16_E1592CDE48EAC92ABE18348E6664D599: Array<string>;
      DefaultShowNameplate_19_D2A233F74E1D799A216806B6FA79980C: boolean;
    };
    BoundBruiser: {
      CreatureName_2_DC83695545356E53970200BDB975D888: {
        TableId: string;
        Key: string;
      };
      CreatureIcon_7_DF4EEA0643C8418D15044B8CF2A9A018: {
        AssetPathName: string;
        SubPathString: string;
      };
      FerocityMin_10_BB446F4C4B68F7CDEDF902B32DA39A04: number;
      FerocityMax_12_42DB45344FD4021F041B8CAE20C45427: number;
      Biomes_16_E1592CDE48EAC92ABE18348E6664D599: Array<string>;
      DefaultShowNameplate_19_D2A233F74E1D799A216806B6FA79980C: boolean;
    };
    BoundEliteGuard: {
      CreatureName_2_DC83695545356E53970200BDB975D888: {
        TableId: string;
        Key: string;
      };
      CreatureIcon_7_DF4EEA0643C8418D15044B8CF2A9A018: {
        AssetPathName: string;
        SubPathString: string;
      };
      FerocityMin_10_BB446F4C4B68F7CDEDF902B32DA39A04: number;
      FerocityMax_12_42DB45344FD4021F041B8CAE20C45427: number;
      Biomes_16_E1592CDE48EAC92ABE18348E6664D599: Array<string>;
      DefaultShowNameplate_19_D2A233F74E1D799A216806B6FA79980C: boolean;
    };
    BoundAegis: {
      CreatureName_2_DC83695545356E53970200BDB975D888: {
        TableId: string;
        Key: string;
      };
      CreatureIcon_7_DF4EEA0643C8418D15044B8CF2A9A018: {
        AssetPathName: string;
        SubPathString: string;
      };
      FerocityMin_10_BB446F4C4B68F7CDEDF902B32DA39A04: number;
      FerocityMax_12_42DB45344FD4021F041B8CAE20C45427: number;
      Biomes_16_E1592CDE48EAC92ABE18348E6664D599: Array<string>;
      DefaultShowNameplate_19_D2A233F74E1D799A216806B6FA79980C: boolean;
    };
    BoundFlameSpitter: {
      CreatureName_2_DC83695545356E53970200BDB975D888: {
        TableId: string;
        Key: string;
      };
      CreatureIcon_7_DF4EEA0643C8418D15044B8CF2A9A018: {
        AssetPathName: string;
        SubPathString: string;
      };
      FerocityMin_10_BB446F4C4B68F7CDEDF902B32DA39A04: number;
      FerocityMax_12_42DB45344FD4021F041B8CAE20C45427: number;
      Biomes_16_E1592CDE48EAC92ABE18348E6664D599: Array<string>;
      DefaultShowNameplate_19_D2A233F74E1D799A216806B6FA79980C: boolean;
    };
    BoundPuppeteer: {
      CreatureName_2_DC83695545356E53970200BDB975D888: {
        TableId: string;
        Key: string;
      };
      CreatureIcon_7_DF4EEA0643C8418D15044B8CF2A9A018: {
        AssetPathName: string;
        SubPathString: string;
      };
      FerocityMin_10_BB446F4C4B68F7CDEDF902B32DA39A04: number;
      FerocityMax_12_42DB45344FD4021F041B8CAE20C45427: number;
      Biomes_16_E1592CDE48EAC92ABE18348E6664D599: Array<string>;
      DefaultShowNameplate_19_D2A233F74E1D799A216806B6FA79980C: boolean;
    };
    BoundSoldier: {
      CreatureName_2_DC83695545356E53970200BDB975D888: {
        TableId: string;
        Key: string;
      };
      CreatureIcon_7_DF4EEA0643C8418D15044B8CF2A9A018: {
        AssetPathName: string;
        SubPathString: string;
      };
      FerocityMin_10_BB446F4C4B68F7CDEDF902B32DA39A04: number;
      FerocityMax_12_42DB45344FD4021F041B8CAE20C45427: number;
      Biomes_16_E1592CDE48EAC92ABE18348E6664D599: Array<string>;
      DefaultShowNameplate_19_D2A233F74E1D799A216806B6FA79980C: boolean;
    };
    BoundSniper: {
      CreatureName_2_DC83695545356E53970200BDB975D888: {
        TableId: string;
        Key: string;
      };
      CreatureIcon_7_DF4EEA0643C8418D15044B8CF2A9A018: {
        AssetPathName: string;
        SubPathString: string;
      };
      FerocityMin_10_BB446F4C4B68F7CDEDF902B32DA39A04: number;
      FerocityMax_12_42DB45344FD4021F041B8CAE20C45427: number;
      Biomes_16_E1592CDE48EAC92ABE18348E6664D599: Array<string>;
      DefaultShowNameplate_19_D2A233F74E1D799A216806B6FA79980C: boolean;
    };
    BoundExploder: {
      CreatureName_2_DC83695545356E53970200BDB975D888: {
        Namespace: string;
        Key: string;
        SourceString: string;
        LocalizedString: string;
      };
      CreatureIcon_7_DF4EEA0643C8418D15044B8CF2A9A018: {
        AssetPathName: string;
        SubPathString: string;
      };
      FerocityMin_10_BB446F4C4B68F7CDEDF902B32DA39A04: number;
      FerocityMax_12_42DB45344FD4021F041B8CAE20C45427: number;
      Biomes_16_E1592CDE48EAC92ABE18348E6664D599: Array<string>;
      DefaultShowNameplate_19_D2A233F74E1D799A216806B6FA79980C: boolean;
    };
    GiantRat: {
      CreatureName_2_DC83695545356E53970200BDB975D888: {
        TableId: string;
        Key: string;
      };
      CreatureIcon_7_DF4EEA0643C8418D15044B8CF2A9A018: {
        AssetPathName: string;
        SubPathString: string;
      };
      FerocityMin_10_BB446F4C4B68F7CDEDF902B32DA39A04: number;
      FerocityMax_12_42DB45344FD4021F041B8CAE20C45427: number;
      Biomes_16_E1592CDE48EAC92ABE18348E6664D599: Array<string>;
      DefaultShowNameplate_19_D2A233F74E1D799A216806B6FA79980C: boolean;
    };
    Bison: {
      CreatureName_2_DC83695545356E53970200BDB975D888: {
        TableId: string;
        Key: string;
      };
      CreatureIcon_7_DF4EEA0643C8418D15044B8CF2A9A018: {
        AssetPathName: string;
        SubPathString: string;
      };
      FerocityMin_10_BB446F4C4B68F7CDEDF902B32DA39A04: number;
      FerocityMax_12_42DB45344FD4021F041B8CAE20C45427: number;
      Biomes_16_E1592CDE48EAC92ABE18348E6664D599: Array<string>;
      DefaultShowNameplate_19_D2A233F74E1D799A216806B6FA79980C: boolean;
    };
    NPC: {
      CreatureName_2_DC83695545356E53970200BDB975D888: {
        Namespace: string;
        Key: string;
        SourceString: string;
        LocalizedString: string;
      };
      CreatureIcon_7_DF4EEA0643C8418D15044B8CF2A9A018: {
        AssetPathName: string;
        SubPathString: string;
      };
      FerocityMin_10_BB446F4C4B68F7CDEDF902B32DA39A04: number;
      FerocityMax_12_42DB45344FD4021F041B8CAE20C45427: number;
      Biomes_16_E1592CDE48EAC92ABE18348E6664D599: Array<string>;
      DefaultShowNameplate_19_D2A233F74E1D799A216806B6FA79980C: boolean;
    };
    SwampGiant: {
      CreatureName_2_DC83695545356E53970200BDB975D888: {
        TableId: string;
        Key: string;
      };
      CreatureIcon_7_DF4EEA0643C8418D15044B8CF2A9A018: {
        AssetPathName: string;
        SubPathString: string;
      };
      FerocityMin_10_BB446F4C4B68F7CDEDF902B32DA39A04: number;
      FerocityMax_12_42DB45344FD4021F041B8CAE20C45427: number;
      Biomes_16_E1592CDE48EAC92ABE18348E6664D599: Array<string>;
      DefaultShowNameplate_19_D2A233F74E1D799A216806B6FA79980C: boolean;
    };
    SwampGiantDruid: {
      CreatureName_2_DC83695545356E53970200BDB975D888: {
        TableId: string;
        Key: string;
      };
      CreatureIcon_7_DF4EEA0643C8418D15044B8CF2A9A018: {
        AssetPathName: string;
        SubPathString: string;
      };
      FerocityMin_10_BB446F4C4B68F7CDEDF902B32DA39A04: number;
      FerocityMax_12_42DB45344FD4021F041B8CAE20C45427: number;
      Biomes_16_E1592CDE48EAC92ABE18348E6664D599: Array<string>;
      DefaultShowNameplate_19_D2A233F74E1D799A216806B6FA79980C: boolean;
    };
    Ishmael: {
      CreatureName_2_DC83695545356E53970200BDB975D888: {
        TableId: string;
        Key: string;
      };
      CreatureIcon_7_DF4EEA0643C8418D15044B8CF2A9A018: {
        AssetPathName: string;
        SubPathString: string;
      };
      FerocityMin_10_BB446F4C4B68F7CDEDF902B32DA39A04: number;
      FerocityMax_12_42DB45344FD4021F041B8CAE20C45427: number;
      Biomes_16_E1592CDE48EAC92ABE18348E6664D599: Array<string>;
      DefaultShowNameplate_19_D2A233F74E1D799A216806B6FA79980C: boolean;
    };
    Harpy: {
      CreatureName_2_DC83695545356E53970200BDB975D888: {
        TableId: string;
        Key: string;
      };
      CreatureIcon_7_DF4EEA0643C8418D15044B8CF2A9A018: {
        AssetPathName: string;
        SubPathString: string;
      };
      FerocityMin_10_BB446F4C4B68F7CDEDF902B32DA39A04: number;
      FerocityMax_12_42DB45344FD4021F041B8CAE20C45427: number;
      Biomes_16_E1592CDE48EAC92ABE18348E6664D599: Array<string>;
      DefaultShowNameplate_19_D2A233F74E1D799A216806B6FA79980C: boolean;
    };
    Elephant: {
      CreatureName_2_DC83695545356E53970200BDB975D888: {
        TableId: string;
        Key: string;
      };
      CreatureIcon_7_DF4EEA0643C8418D15044B8CF2A9A018: {
        AssetPathName: string;
        SubPathString: string;
      };
      FerocityMin_10_BB446F4C4B68F7CDEDF902B32DA39A04: number;
      FerocityMax_12_42DB45344FD4021F041B8CAE20C45427: number;
      Biomes_16_E1592CDE48EAC92ABE18348E6664D599: Array<string>;
      DefaultShowNameplate_19_D2A233F74E1D799A216806B6FA79980C: boolean;
    };
    Pet: {
      CreatureName_2_DC83695545356E53970200BDB975D888: {
        Namespace: string;
        Key: string;
        SourceString: string;
        LocalizedString: string;
      };
      CreatureIcon_7_DF4EEA0643C8418D15044B8CF2A9A018: {
        AssetPathName: string;
        SubPathString: string;
      };
      FerocityMin_10_BB446F4C4B68F7CDEDF902B32DA39A04: number;
      FerocityMax_12_42DB45344FD4021F041B8CAE20C45427: number;
      Biomes_16_E1592CDE48EAC92ABE18348E6664D599: Array<string>;
      DefaultShowNameplate_19_D2A233F74E1D799A216806B6FA79980C: boolean;
    };
    PetCat: {
      CreatureName_2_DC83695545356E53970200BDB975D888: {
        TableId: string;
        Key: string;
      };
      CreatureIcon_7_DF4EEA0643C8418D15044B8CF2A9A018: {
        AssetPathName: string;
        SubPathString: string;
      };
      FerocityMin_10_BB446F4C4B68F7CDEDF902B32DA39A04: number;
      FerocityMax_12_42DB45344FD4021F041B8CAE20C45427: number;
      Biomes_16_E1592CDE48EAC92ABE18348E6664D599: Array<string>;
      DefaultShowNameplate_19_D2A233F74E1D799A216806B6FA79980C: boolean;
    };
    PetDaschund: {
      CreatureName_2_DC83695545356E53970200BDB975D888: {
        Namespace: string;
        Key: string;
        SourceString: string;
        LocalizedString: string;
      };
      CreatureIcon_7_DF4EEA0643C8418D15044B8CF2A9A018: {
        AssetPathName: string;
        SubPathString: string;
      };
      FerocityMin_10_BB446F4C4B68F7CDEDF902B32DA39A04: number;
      FerocityMax_12_42DB45344FD4021F041B8CAE20C45427: number;
      Biomes_16_E1592CDE48EAC92ABE18348E6664D599: Array<string>;
      DefaultShowNameplate_19_D2A233F74E1D799A216806B6FA79980C: boolean;
    };
    PetRabbit: {
      CreatureName_2_DC83695545356E53970200BDB975D888: {
        TableId: string;
        Key: string;
      };
      CreatureIcon_7_DF4EEA0643C8418D15044B8CF2A9A018: {
        AssetPathName: string;
        SubPathString: string;
      };
      FerocityMin_10_BB446F4C4B68F7CDEDF902B32DA39A04: number;
      FerocityMax_12_42DB45344FD4021F041B8CAE20C45427: number;
      Biomes_16_E1592CDE48EAC92ABE18348E6664D599: Array<string>;
      DefaultShowNameplate_19_D2A233F74E1D799A216806B6FA79980C: boolean;
    };
    HillGiant: {
      CreatureName_2_DC83695545356E53970200BDB975D888: {
        Namespace: string;
        Key: string;
        SourceString: string;
        LocalizedString: string;
      };
      CreatureIcon_7_DF4EEA0643C8418D15044B8CF2A9A018: {
        AssetPathName: string;
        SubPathString: string;
      };
      FerocityMin_10_BB446F4C4B68F7CDEDF902B32DA39A04: number;
      FerocityMax_12_42DB45344FD4021F041B8CAE20C45427: number;
      Biomes_16_E1592CDE48EAC92ABE18348E6664D599: Array<string>;
      DefaultShowNameplate_19_D2A233F74E1D799A216806B6FA79980C: boolean;
    };
    Pihrat: {
      CreatureName_2_DC83695545356E53970200BDB975D888: {
        TableId: string;
        Key: string;
      };
      CreatureIcon_7_DF4EEA0643C8418D15044B8CF2A9A018: {
        AssetPathName: string;
        SubPathString: string;
      };
      FerocityMin_10_BB446F4C4B68F7CDEDF902B32DA39A04: number;
      FerocityMax_12_42DB45344FD4021F041B8CAE20C45427: number;
      Biomes_16_E1592CDE48EAC92ABE18348E6664D599: Array<string>;
      DefaultShowNameplate_19_D2A233F74E1D799A216806B6FA79980C: boolean;
    };
    Brippo: {
      CreatureName_2_DC83695545356E53970200BDB975D888: {
        TableId: string;
        Key: string;
      };
      CreatureIcon_7_DF4EEA0643C8418D15044B8CF2A9A018: {
        AssetPathName: string;
        SubPathString: string;
      };
      FerocityMin_10_BB446F4C4B68F7CDEDF902B32DA39A04: number;
      FerocityMax_12_42DB45344FD4021F041B8CAE20C45427: number;
      Biomes_16_E1592CDE48EAC92ABE18348E6664D599: Array<string>;
      DefaultShowNameplate_19_D2A233F74E1D799A216806B6FA79980C: boolean;
    };
    BoundCasterSupport: {
      CreatureName_2_DC83695545356E53970200BDB975D888: {
        Namespace: string;
        Key: string;
        SourceString: string;
        LocalizedString: string;
      };
      CreatureIcon_7_DF4EEA0643C8418D15044B8CF2A9A018: {
        AssetPathName: string;
        SubPathString: string;
      };
      FerocityMin_10_BB446F4C4B68F7CDEDF902B32DA39A04: number;
      FerocityMax_12_42DB45344FD4021F041B8CAE20C45427: number;
      Biomes_16_E1592CDE48EAC92ABE18348E6664D599: Array<string>;
      DefaultShowNameplate_19_D2A233F74E1D799A216806B6FA79980C: boolean;
    };
    Eoten: {
      CreatureName_2_DC83695545356E53970200BDB975D888: {
        TableId: string;
        Key: string;
      };
      CreatureIcon_7_DF4EEA0643C8418D15044B8CF2A9A018: {
        AssetPathName: string;
        SubPathString: string;
      };
      FerocityMin_10_BB446F4C4B68F7CDEDF902B32DA39A04: number;
      FerocityMax_12_42DB45344FD4021F041B8CAE20C45427: number;
      Biomes_16_E1592CDE48EAC92ABE18348E6664D599: Array<string>;
      DefaultShowNameplate_19_D2A233F74E1D799A216806B6FA79980C: boolean;
    };
    DemonDeer: {
      CreatureName_2_DC83695545356E53970200BDB975D888: {
        TableId: string;
        Key: string;
      };
      CreatureIcon_7_DF4EEA0643C8418D15044B8CF2A9A018: {
        AssetPathName: string;
        SubPathString: string;
      };
      FerocityMin_10_BB446F4C4B68F7CDEDF902B32DA39A04: number;
      FerocityMax_12_42DB45344FD4021F041B8CAE20C45427: number;
      Biomes_16_E1592CDE48EAC92ABE18348E6664D599: Array<string>;
      DefaultShowNameplate_19_D2A233F74E1D799A216806B6FA79980C: boolean;
    };
    Villager: {
      CreatureName_2_DC83695545356E53970200BDB975D888: {
        Namespace: string;
        Key: string;
        SourceString: string;
        LocalizedString: string;
      };
      CreatureIcon_7_DF4EEA0643C8418D15044B8CF2A9A018: {
        AssetPathName: string;
        SubPathString: string;
      };
      FerocityMin_10_BB446F4C4B68F7CDEDF902B32DA39A04: number;
      FerocityMax_12_42DB45344FD4021F041B8CAE20C45427: number;
      Biomes_16_E1592CDE48EAC92ABE18348E6664D599: Array<string>;
      DefaultShowNameplate_19_D2A233F74E1D799A216806B6FA79980C: boolean;
    };
    Bees: {
      CreatureName_2_DC83695545356E53970200BDB975D888: {
        Namespace: string;
        Key: string;
        SourceString: string;
        LocalizedString: string;
      };
      CreatureIcon_7_DF4EEA0643C8418D15044B8CF2A9A018: {
        AssetPathName: string;
        SubPathString: string;
      };
      FerocityMin_10_BB446F4C4B68F7CDEDF902B32DA39A04: number;
      FerocityMax_12_42DB45344FD4021F041B8CAE20C45427: number;
      Biomes_16_E1592CDE48EAC92ABE18348E6664D599: Array<string>;
      DefaultShowNameplate_19_D2A233F74E1D799A216806B6FA79980C: boolean;
    };
    DemonDeerWisp: {
      CreatureName_2_DC83695545356E53970200BDB975D888: {
        TableId: string;
        Key: string;
      };
      CreatureIcon_7_DF4EEA0643C8418D15044B8CF2A9A018: {
        AssetPathName: string;
        SubPathString: string;
      };
      FerocityMin_10_BB446F4C4B68F7CDEDF902B32DA39A04: number;
      FerocityMax_12_42DB45344FD4021F041B8CAE20C45427: number;
      Biomes_16_E1592CDE48EAC92ABE18348E6664D599: Array<string>;
      DefaultShowNameplate_19_D2A233F74E1D799A216806B6FA79980C: boolean;
    };
    PlayerWisp: {
      CreatureName_2_DC83695545356E53970200BDB975D888: {
        TableId: string;
        Key: string;
      };
      CreatureIcon_7_DF4EEA0643C8418D15044B8CF2A9A018: {
        AssetPathName: string;
        SubPathString: string;
      };
      FerocityMin_10_BB446F4C4B68F7CDEDF902B32DA39A04: number;
      FerocityMax_12_42DB45344FD4021F041B8CAE20C45427: number;
      Biomes_16_E1592CDE48EAC92ABE18348E6664D599: Array<string>;
      DefaultShowNameplate_19_D2A233F74E1D799A216806B6FA79980C: boolean;
    };
    AutomatonPawn: {
      CreatureName_2_DC83695545356E53970200BDB975D888: {
        TableId: string;
        Key: string;
      };
      CreatureIcon_7_DF4EEA0643C8418D15044B8CF2A9A018: {
        AssetPathName: string;
        SubPathString: string;
      };
      FerocityMin_10_BB446F4C4B68F7CDEDF902B32DA39A04: number;
      FerocityMax_12_42DB45344FD4021F041B8CAE20C45427: number;
      Biomes_16_E1592CDE48EAC92ABE18348E6664D599: Array<string>;
      DefaultShowNameplate_19_D2A233F74E1D799A216806B6FA79980C: boolean;
    };
    AutomatonBishop: {
      CreatureName_2_DC83695545356E53970200BDB975D888: {
        TableId: string;
        Key: string;
      };
      CreatureIcon_7_DF4EEA0643C8418D15044B8CF2A9A018: {
        AssetPathName: string;
        SubPathString: string;
      };
      FerocityMin_10_BB446F4C4B68F7CDEDF902B32DA39A04: number;
      FerocityMax_12_42DB45344FD4021F041B8CAE20C45427: number;
      Biomes_16_E1592CDE48EAC92ABE18348E6664D599: Array<string>;
      DefaultShowNameplate_19_D2A233F74E1D799A216806B6FA79980C: boolean;
    };
    AutomatonRook: {
      CreatureName_2_DC83695545356E53970200BDB975D888: {
        TableId: string;
        Key: string;
      };
      CreatureIcon_7_DF4EEA0643C8418D15044B8CF2A9A018: {
        AssetPathName: string;
        SubPathString: string;
      };
      FerocityMin_10_BB446F4C4B68F7CDEDF902B32DA39A04: number;
      FerocityMax_12_42DB45344FD4021F041B8CAE20C45427: number;
      Biomes_16_E1592CDE48EAC92ABE18348E6664D599: Array<string>;
      DefaultShowNameplate_19_D2A233F74E1D799A216806B6FA79980C: boolean;
    };
    AutomatonKnight: {
      CreatureName_2_DC83695545356E53970200BDB975D888: {
        TableId: string;
        Key: string;
      };
      CreatureIcon_7_DF4EEA0643C8418D15044B8CF2A9A018: {
        AssetPathName: string;
        SubPathString: string;
      };
      FerocityMin_10_BB446F4C4B68F7CDEDF902B32DA39A04: number;
      FerocityMax_12_42DB45344FD4021F041B8CAE20C45427: number;
      Biomes_16_E1592CDE48EAC92ABE18348E6664D599: Array<string>;
      DefaultShowNameplate_19_D2A233F74E1D799A216806B6FA79980C: boolean;
    };
    AutomatonQueen: {
      CreatureName_2_DC83695545356E53970200BDB975D888: {
        Namespace: string;
        Key: string;
        SourceString: string;
        LocalizedString: string;
      };
      CreatureIcon_7_DF4EEA0643C8418D15044B8CF2A9A018: {
        AssetPathName: string;
        SubPathString: string;
      };
      FerocityMin_10_BB446F4C4B68F7CDEDF902B32DA39A04: number;
      FerocityMax_12_42DB45344FD4021F041B8CAE20C45427: number;
      Biomes_16_E1592CDE48EAC92ABE18348E6664D599: Array<string>;
      DefaultShowNameplate_19_D2A233F74E1D799A216806B6FA79980C: boolean;
    };
    Barat: {
      CreatureName_2_DC83695545356E53970200BDB975D888: {
        TableId: string;
        Key: string;
      };
      CreatureIcon_7_DF4EEA0643C8418D15044B8CF2A9A018: {
        AssetPathName: string;
        SubPathString: string;
      };
      FerocityMin_10_BB446F4C4B68F7CDEDF902B32DA39A04: number;
      FerocityMax_12_42DB45344FD4021F041B8CAE20C45427: number;
      Biomes_16_E1592CDE48EAC92ABE18348E6664D599: Array<string>;
      DefaultShowNameplate_19_D2A233F74E1D799A216806B6FA79980C: boolean;
    };
    Rabbtor: {
      CreatureName_2_DC83695545356E53970200BDB975D888: {
        TableId: string;
        Key: string;
      };
      CreatureIcon_7_DF4EEA0643C8418D15044B8CF2A9A018: {
        AssetPathName: string;
        SubPathString: string;
      };
      FerocityMin_10_BB446F4C4B68F7CDEDF902B32DA39A04: number;
      FerocityMax_12_42DB45344FD4021F041B8CAE20C45427: number;
      Biomes_16_E1592CDE48EAC92ABE18348E6664D599: Array<string>;
      DefaultShowNameplate_19_D2A233F74E1D799A216806B6FA79980C: boolean;
    };
    Frog: {
      CreatureName_2_DC83695545356E53970200BDB975D888: {
        TableId: string;
        Key: string;
      };
      CreatureIcon_7_DF4EEA0643C8418D15044B8CF2A9A018: {
        AssetPathName: string;
        SubPathString: string;
      };
      FerocityMin_10_BB446F4C4B68F7CDEDF902B32DA39A04: number;
      FerocityMax_12_42DB45344FD4021F041B8CAE20C45427: number;
      Biomes_16_E1592CDE48EAC92ABE18348E6664D599: Array<string>;
      DefaultShowNameplate_19_D2A233F74E1D799A216806B6FA79980C: boolean;
    };
    Locust: {
      CreatureName_2_DC83695545356E53970200BDB975D888: {
        TableId: string;
        Key: string;
      };
      CreatureIcon_7_DF4EEA0643C8418D15044B8CF2A9A018: {
        AssetPathName: string;
        SubPathString: string;
      };
      FerocityMin_10_BB446F4C4B68F7CDEDF902B32DA39A04: number;
      FerocityMax_12_42DB45344FD4021F041B8CAE20C45427: number;
      Biomes_16_E1592CDE48EAC92ABE18348E6664D599: Array<string>;
      DefaultShowNameplate_19_D2A233F74E1D799A216806B6FA79980C: boolean;
    };
    Scorpion: {
      CreatureName_2_DC83695545356E53970200BDB975D888: {
        TableId: string;
        Key: string;
      };
      CreatureIcon_7_DF4EEA0643C8418D15044B8CF2A9A018: {
        AssetPathName: string;
        SubPathString: string;
      };
      FerocityMin_10_BB446F4C4B68F7CDEDF902B32DA39A04: number;
      FerocityMax_12_42DB45344FD4021F041B8CAE20C45427: number;
      Biomes_16_E1592CDE48EAC92ABE18348E6664D599: Array<string>;
      DefaultShowNameplate_19_D2A233F74E1D799A216806B6FA79980C: boolean;
    };
    Scarab: {
      CreatureName_2_DC83695545356E53970200BDB975D888: {
        TableId: string;
        Key: string;
      };
      CreatureIcon_7_DF4EEA0643C8418D15044B8CF2A9A018: {
        AssetPathName: string;
        SubPathString: string;
      };
      FerocityMin_10_BB446F4C4B68F7CDEDF902B32DA39A04: number;
      FerocityMax_12_42DB45344FD4021F041B8CAE20C45427: number;
      Biomes_16_E1592CDE48EAC92ABE18348E6664D599: Array<string>;
      DefaultShowNameplate_19_D2A233F74E1D799A216806B6FA79980C: boolean;
    };
    Shroat: {
      CreatureName_2_DC83695545356E53970200BDB975D888: {
        TableId: string;
        Key: string;
      };
      CreatureIcon_7_DF4EEA0643C8418D15044B8CF2A9A018: {
        AssetPathName: string;
        SubPathString: string;
      };
      FerocityMin_10_BB446F4C4B68F7CDEDF902B32DA39A04: number;
      FerocityMax_12_42DB45344FD4021F041B8CAE20C45427: number;
      Biomes_16_E1592CDE48EAC92ABE18348E6664D599: Array<string>;
      DefaultShowNameplate_19_D2A233F74E1D799A216806B6FA79980C: boolean;
    };
    EotenApex: {
      CreatureName_2_DC83695545356E53970200BDB975D888: {
        TableId: string;
        Key: string;
      };
      CreatureIcon_7_DF4EEA0643C8418D15044B8CF2A9A018: {
        AssetPathName: string;
        SubPathString: string;
      };
      FerocityMin_10_BB446F4C4B68F7CDEDF902B32DA39A04: number;
      FerocityMax_12_42DB45344FD4021F041B8CAE20C45427: number;
      Biomes_16_E1592CDE48EAC92ABE18348E6664D599: Array<string>;
      DefaultShowNameplate_19_D2A233F74E1D799A216806B6FA79980C: boolean;
    };
    SunGiant: {
      CreatureName_2_DC83695545356E53970200BDB975D888: {
        TableId: string;
        Key: string;
      };
      CreatureIcon_7_DF4EEA0643C8418D15044B8CF2A9A018: {
        AssetPathName: string;
        SubPathString: string;
      };
      FerocityMin_10_BB446F4C4B68F7CDEDF902B32DA39A04: number;
      FerocityMax_12_42DB45344FD4021F041B8CAE20C45427: number;
      Biomes_16_E1592CDE48EAC92ABE18348E6664D599: Array<string>;
      DefaultShowNameplate_19_D2A233F74E1D799A216806B6FA79980C: boolean;
    };
    Bear_Hero: {
      CreatureName_2_DC83695545356E53970200BDB975D888: {
        TableId: string;
        Key: string;
      };
      CreatureIcon_7_DF4EEA0643C8418D15044B8CF2A9A018: {
        AssetPathName: string;
        SubPathString: string;
      };
      FerocityMin_10_BB446F4C4B68F7CDEDF902B32DA39A04: number;
      FerocityMax_12_42DB45344FD4021F041B8CAE20C45427: number;
      Biomes_16_E1592CDE48EAC92ABE18348E6664D599: Array<string>;
      DefaultShowNameplate_19_D2A233F74E1D799A216806B6FA79980C: boolean;
    };
    Wolf_Hero: {
      CreatureName_2_DC83695545356E53970200BDB975D888: {
        TableId: string;
        Key: string;
      };
      CreatureIcon_7_DF4EEA0643C8418D15044B8CF2A9A018: {
        AssetPathName: string;
        SubPathString: string;
      };
      FerocityMin_10_BB446F4C4B68F7CDEDF902B32DA39A04: number;
      FerocityMax_12_42DB45344FD4021F041B8CAE20C45427: number;
      Biomes_16_E1592CDE48EAC92ABE18348E6664D599: Array<string>;
      DefaultShowNameplate_19_D2A233F74E1D799A216806B6FA79980C: boolean;
    };
    Deer_Hero: {
      CreatureName_2_DC83695545356E53970200BDB975D888: {
        TableId: string;
        Key: string;
      };
      CreatureIcon_7_DF4EEA0643C8418D15044B8CF2A9A018: {
        AssetPathName: string;
        SubPathString: string;
      };
      FerocityMin_10_BB446F4C4B68F7CDEDF902B32DA39A04: number;
      FerocityMax_12_42DB45344FD4021F041B8CAE20C45427: number;
      Biomes_16_E1592CDE48EAC92ABE18348E6664D599: Array<string>;
      DefaultShowNameplate_19_D2A233F74E1D799A216806B6FA79980C: boolean;
    };
    VineElk_Hero: {
      CreatureName_2_DC83695545356E53970200BDB975D888: {
        TableId: string;
        Key: string;
      };
      CreatureIcon_7_DF4EEA0643C8418D15044B8CF2A9A018: {
        AssetPathName: string;
        SubPathString: string;
      };
      FerocityMin_10_BB446F4C4B68F7CDEDF902B32DA39A04: number;
      FerocityMax_12_42DB45344FD4021F041B8CAE20C45427: number;
      Biomes_16_E1592CDE48EAC92ABE18348E6664D599: Array<string>;
      DefaultShowNameplate_19_D2A233F74E1D799A216806B6FA79980C: boolean;
    };
    Hippo_Hero: {
      CreatureName_2_DC83695545356E53970200BDB975D888: {
        TableId: string;
        Key: string;
      };
      CreatureIcon_7_DF4EEA0643C8418D15044B8CF2A9A018: {
        AssetPathName: string;
        SubPathString: string;
      };
      FerocityMin_10_BB446F4C4B68F7CDEDF902B32DA39A04: number;
      FerocityMax_12_42DB45344FD4021F041B8CAE20C45427: number;
      Biomes_16_E1592CDE48EAC92ABE18348E6664D599: Array<string>;
      DefaultShowNameplate_19_D2A233F74E1D799A216806B6FA79980C: boolean;
    };
    Spider_Hero: {
      CreatureName_2_DC83695545356E53970200BDB975D888: {
        TableId: string;
        Key: string;
      };
      CreatureIcon_7_DF4EEA0643C8418D15044B8CF2A9A018: {
        AssetPathName: string;
        SubPathString: string;
      };
      FerocityMin_10_BB446F4C4B68F7CDEDF902B32DA39A04: number;
      FerocityMax_12_42DB45344FD4021F041B8CAE20C45427: number;
      Biomes_16_E1592CDE48EAC92ABE18348E6664D599: Array<string>;
      DefaultShowNameplate_19_D2A233F74E1D799A216806B6FA79980C: boolean;
    };
    YellowSpider_Hero: {
      CreatureName_2_DC83695545356E53970200BDB975D888: {
        TableId: string;
        Key: string;
      };
      CreatureIcon_7_DF4EEA0643C8418D15044B8CF2A9A018: {
        AssetPathName: string;
        SubPathString: string;
      };
      FerocityMin_10_BB446F4C4B68F7CDEDF902B32DA39A04: number;
      FerocityMax_12_42DB45344FD4021F041B8CAE20C45427: number;
      Biomes_16_E1592CDE48EAC92ABE18348E6664D599: Array<string>;
      DefaultShowNameplate_19_D2A233F74E1D799A216806B6FA79980C: boolean;
    };
    Boar_Hero: {
      CreatureName_2_DC83695545356E53970200BDB975D888: {
        TableId: string;
        Key: string;
      };
      CreatureIcon_7_DF4EEA0643C8418D15044B8CF2A9A018: {
        AssetPathName: string;
        SubPathString: string;
      };
      FerocityMin_10_BB446F4C4B68F7CDEDF902B32DA39A04: number;
      FerocityMax_12_42DB45344FD4021F041B8CAE20C45427: number;
      Biomes_16_E1592CDE48EAC92ABE18348E6664D599: Array<string>;
      DefaultShowNameplate_19_D2A233F74E1D799A216806B6FA79980C: boolean;
    };
    Hellpig_Hero: {
      CreatureName_2_DC83695545356E53970200BDB975D888: {
        TableId: string;
        Key: string;
      };
      CreatureIcon_7_DF4EEA0643C8418D15044B8CF2A9A018: {
        AssetPathName: string;
        SubPathString: string;
      };
      FerocityMin_10_BB446F4C4B68F7CDEDF902B32DA39A04: number;
      FerocityMax_12_42DB45344FD4021F041B8CAE20C45427: number;
      Biomes_16_E1592CDE48EAC92ABE18348E6664D599: Array<string>;
      DefaultShowNameplate_19_D2A233F74E1D799A216806B6FA79980C: boolean;
    };
    GiantRat_Hero: {
      CreatureName_2_DC83695545356E53970200BDB975D888: {
        TableId: string;
        Key: string;
      };
      CreatureIcon_7_DF4EEA0643C8418D15044B8CF2A9A018: {
        AssetPathName: string;
        SubPathString: string;
      };
      FerocityMin_10_BB446F4C4B68F7CDEDF902B32DA39A04: number;
      FerocityMax_12_42DB45344FD4021F041B8CAE20C45427: number;
      Biomes_16_E1592CDE48EAC92ABE18348E6664D599: Array<string>;
      DefaultShowNameplate_19_D2A233F74E1D799A216806B6FA79980C: boolean;
    };
    Bison_Hero: {
      CreatureName_2_DC83695545356E53970200BDB975D888: {
        TableId: string;
        Key: string;
      };
      CreatureIcon_7_DF4EEA0643C8418D15044B8CF2A9A018: {
        AssetPathName: string;
        SubPathString: string;
      };
      FerocityMin_10_BB446F4C4B68F7CDEDF902B32DA39A04: number;
      FerocityMax_12_42DB45344FD4021F041B8CAE20C45427: number;
      Biomes_16_E1592CDE48EAC92ABE18348E6664D599: Array<string>;
      DefaultShowNameplate_19_D2A233F74E1D799A216806B6FA79980C: boolean;
    };
    Pihrat_Hero: {
      CreatureName_2_DC83695545356E53970200BDB975D888: {
        TableId: string;
        Key: string;
      };
      CreatureIcon_7_DF4EEA0643C8418D15044B8CF2A9A018: {
        AssetPathName: string;
        SubPathString: string;
      };
      FerocityMin_10_BB446F4C4B68F7CDEDF902B32DA39A04: number;
      FerocityMax_12_42DB45344FD4021F041B8CAE20C45427: number;
      Biomes_16_E1592CDE48EAC92ABE18348E6664D599: Array<string>;
      DefaultShowNameplate_19_D2A233F74E1D799A216806B6FA79980C: boolean;
    };
    Brippo_Hero: {
      CreatureName_2_DC83695545356E53970200BDB975D888: {
        TableId: string;
        Key: string;
      };
      CreatureIcon_7_DF4EEA0643C8418D15044B8CF2A9A018: {
        AssetPathName: string;
        SubPathString: string;
      };
      FerocityMin_10_BB446F4C4B68F7CDEDF902B32DA39A04: number;
      FerocityMax_12_42DB45344FD4021F041B8CAE20C45427: number;
      Biomes_16_E1592CDE48EAC92ABE18348E6664D599: Array<string>;
      DefaultShowNameplate_19_D2A233F74E1D799A216806B6FA79980C: boolean;
    };
    Barat_Hero: {
      CreatureName_2_DC83695545356E53970200BDB975D888: {
        TableId: string;
        Key: string;
      };
      CreatureIcon_7_DF4EEA0643C8418D15044B8CF2A9A018: {
        AssetPathName: string;
        SubPathString: string;
      };
      FerocityMin_10_BB446F4C4B68F7CDEDF902B32DA39A04: number;
      FerocityMax_12_42DB45344FD4021F041B8CAE20C45427: number;
      Biomes_16_E1592CDE48EAC92ABE18348E6664D599: Array<string>;
      DefaultShowNameplate_19_D2A233F74E1D799A216806B6FA79980C: boolean;
    };
    Rabbtor_Hero: {
      CreatureName_2_DC83695545356E53970200BDB975D888: {
        TableId: string;
        Key: string;
      };
      CreatureIcon_7_DF4EEA0643C8418D15044B8CF2A9A018: {
        AssetPathName: string;
        SubPathString: string;
      };
      FerocityMin_10_BB446F4C4B68F7CDEDF902B32DA39A04: number;
      FerocityMax_12_42DB45344FD4021F041B8CAE20C45427: number;
      Biomes_16_E1592CDE48EAC92ABE18348E6664D599: Array<string>;
      DefaultShowNameplate_19_D2A233F74E1D799A216806B6FA79980C: boolean;
    };
    Locust_Hero: {
      CreatureName_2_DC83695545356E53970200BDB975D888: {
        TableId: string;
        Key: string;
      };
      CreatureIcon_7_DF4EEA0643C8418D15044B8CF2A9A018: {
        AssetPathName: string;
        SubPathString: string;
      };
      FerocityMin_10_BB446F4C4B68F7CDEDF902B32DA39A04: number;
      FerocityMax_12_42DB45344FD4021F041B8CAE20C45427: number;
      Biomes_16_E1592CDE48EAC92ABE18348E6664D599: Array<string>;
      DefaultShowNameplate_19_D2A233F74E1D799A216806B6FA79980C: boolean;
    };
    Scorpion_Hero: {
      CreatureName_2_DC83695545356E53970200BDB975D888: {
        TableId: string;
        Key: string;
      };
      CreatureIcon_7_DF4EEA0643C8418D15044B8CF2A9A018: {
        AssetPathName: string;
        SubPathString: string;
      };
      FerocityMin_10_BB446F4C4B68F7CDEDF902B32DA39A04: number;
      FerocityMax_12_42DB45344FD4021F041B8CAE20C45427: number;
      Biomes_16_E1592CDE48EAC92ABE18348E6664D599: Array<string>;
      DefaultShowNameplate_19_D2A233F74E1D799A216806B6FA79980C: boolean;
    };
    Scarab_Hero: {
      CreatureName_2_DC83695545356E53970200BDB975D888: {
        TableId: string;
        Key: string;
      };
      CreatureIcon_7_DF4EEA0643C8418D15044B8CF2A9A018: {
        AssetPathName: string;
        SubPathString: string;
      };
      FerocityMin_10_BB446F4C4B68F7CDEDF902B32DA39A04: number;
      FerocityMax_12_42DB45344FD4021F041B8CAE20C45427: number;
      Biomes_16_E1592CDE48EAC92ABE18348E6664D599: Array<string>;
      DefaultShowNameplate_19_D2A233F74E1D799A216806B6FA79980C: boolean;
    };
    Shroat_Hero: {
      CreatureName_2_DC83695545356E53970200BDB975D888: {
        TableId: string;
        Key: string;
      };
      CreatureIcon_7_DF4EEA0643C8418D15044B8CF2A9A018: {
        AssetPathName: string;
        SubPathString: string;
      };
      FerocityMin_10_BB446F4C4B68F7CDEDF902B32DA39A04: number;
      FerocityMax_12_42DB45344FD4021F041B8CAE20C45427: number;
      Biomes_16_E1592CDE48EAC92ABE18348E6664D599: Array<string>;
      DefaultShowNameplate_19_D2A233F74E1D799A216806B6FA79980C: boolean;
    };
    Frog_Hero: {
      CreatureName_2_DC83695545356E53970200BDB975D888: {
        TableId: string;
        Key: string;
      };
      CreatureIcon_7_DF4EEA0643C8418D15044B8CF2A9A018: {
        AssetPathName: string;
        SubPathString: string;
      };
      FerocityMin_10_BB446F4C4B68F7CDEDF902B32DA39A04: number;
      FerocityMax_12_42DB45344FD4021F041B8CAE20C45427: number;
      Biomes_16_E1592CDE48EAC92ABE18348E6664D599: Array<string>;
      DefaultShowNameplate_19_D2A233F74E1D799A216806B6FA79980C: boolean;
    };
    BirdWolf: {
      CreatureName_2_DC83695545356E53970200BDB975D888: {
        TableId: string;
        Key: string;
      };
      CreatureIcon_7_DF4EEA0643C8418D15044B8CF2A9A018: {
        AssetPathName: string;
        SubPathString: string;
      };
      FerocityMin_10_BB446F4C4B68F7CDEDF902B32DA39A04: number;
      FerocityMax_12_42DB45344FD4021F041B8CAE20C45427: number;
      Biomes_16_E1592CDE48EAC92ABE18348E6664D599: Array<string>;
      DefaultShowNameplate_19_D2A233F74E1D799A216806B6FA79980C: boolean;
    };
    BirdWolf_Hero: {
      CreatureName_2_DC83695545356E53970200BDB975D888: {
        TableId: string;
        Key: string;
      };
      CreatureIcon_7_DF4EEA0643C8418D15044B8CF2A9A018: {
        AssetPathName: string;
        SubPathString: string;
      };
      FerocityMin_10_BB446F4C4B68F7CDEDF902B32DA39A04: number;
      FerocityMax_12_42DB45344FD4021F041B8CAE20C45427: number;
      Biomes_16_E1592CDE48EAC92ABE18348E6664D599: Array<string>;
      DefaultShowNameplate_19_D2A233F74E1D799A216806B6FA79980C: boolean;
    };
    AutomatonPawn_Hero: {
      CreatureName_2_DC83695545356E53970200BDB975D888: {
        TableId: string;
        Key: string;
      };
      CreatureIcon_7_DF4EEA0643C8418D15044B8CF2A9A018: {
        AssetPathName: string;
        SubPathString: string;
      };
      FerocityMin_10_BB446F4C4B68F7CDEDF902B32DA39A04: number;
      FerocityMax_12_42DB45344FD4021F041B8CAE20C45427: number;
      Biomes_16_E1592CDE48EAC92ABE18348E6664D599: Array<string>;
      DefaultShowNameplate_19_D2A233F74E1D799A216806B6FA79980C: boolean;
    };
    AutomatonRook_Hero: {
      CreatureName_2_DC83695545356E53970200BDB975D888: {
        TableId: string;
        Key: string;
      };
      CreatureIcon_7_DF4EEA0643C8418D15044B8CF2A9A018: {
        AssetPathName: string;
        SubPathString: string;
      };
      FerocityMin_10_BB446F4C4B68F7CDEDF902B32DA39A04: number;
      FerocityMax_12_42DB45344FD4021F041B8CAE20C45427: number;
      Biomes_16_E1592CDE48EAC92ABE18348E6664D599: Array<string>;
      DefaultShowNameplate_19_D2A233F74E1D799A216806B6FA79980C: boolean;
    };
    DesertEoten: {
      CreatureName_2_DC83695545356E53970200BDB975D888: {
        TableId: string;
        Key: string;
      };
      CreatureIcon_7_DF4EEA0643C8418D15044B8CF2A9A018: {
        AssetPathName: string;
        SubPathString: string;
      };
      FerocityMin_10_BB446F4C4B68F7CDEDF902B32DA39A04: number;
      FerocityMax_12_42DB45344FD4021F041B8CAE20C45427: number;
      Biomes_16_E1592CDE48EAC92ABE18348E6664D599: Array<string>;
      DefaultShowNameplate_19_D2A233F74E1D799A216806B6FA79980C: boolean;
    };
    DesertEoten_Hero: {
      CreatureName_2_DC83695545356E53970200BDB975D888: {
        TableId: string;
        Key: string;
      };
      CreatureIcon_7_DF4EEA0643C8418D15044B8CF2A9A018: {
        AssetPathName: string;
        SubPathString: string;
      };
      FerocityMin_10_BB446F4C4B68F7CDEDF902B32DA39A04: number;
      FerocityMax_12_42DB45344FD4021F041B8CAE20C45427: number;
      Biomes_16_E1592CDE48EAC92ABE18348E6664D599: Array<string>;
      DefaultShowNameplate_19_D2A233F74E1D799A216806B6FA79980C: boolean;
    };
    Elephant_Hero: {
      CreatureName_2_DC83695545356E53970200BDB975D888: {
        TableId: string;
        Key: string;
      };
      CreatureIcon_7_DF4EEA0643C8418D15044B8CF2A9A018: {
        AssetPathName: string;
        SubPathString: string;
      };
      FerocityMin_10_BB446F4C4B68F7CDEDF902B32DA39A04: number;
      FerocityMax_12_42DB45344FD4021F041B8CAE20C45427: number;
      Biomes_16_E1592CDE48EAC92ABE18348E6664D599: Array<string>;
      DefaultShowNameplate_19_D2A233F74E1D799A216806B6FA79980C: boolean;
    };
    AutomatonBishop_Hero: {
      CreatureName_2_DC83695545356E53970200BDB975D888: {
        TableId: string;
        Key: string;
      };
      CreatureIcon_7_DF4EEA0643C8418D15044B8CF2A9A018: {
        AssetPathName: string;
        SubPathString: string;
      };
      FerocityMin_10_BB446F4C4B68F7CDEDF902B32DA39A04: number;
      FerocityMax_12_42DB45344FD4021F041B8CAE20C45427: number;
      Biomes_16_E1592CDE48EAC92ABE18348E6664D599: Array<string>;
      DefaultShowNameplate_19_D2A233F74E1D799A216806B6FA79980C: boolean;
    };
    AutomatonKnight_Hero: {
      CreatureName_2_DC83695545356E53970200BDB975D888: {
        TableId: string;
        Key: string;
      };
      CreatureIcon_7_DF4EEA0643C8418D15044B8CF2A9A018: {
        AssetPathName: string;
        SubPathString: string;
      };
      FerocityMin_10_BB446F4C4B68F7CDEDF902B32DA39A04: number;
      FerocityMax_12_42DB45344FD4021F041B8CAE20C45427: number;
      Biomes_16_E1592CDE48EAC92ABE18348E6664D599: Array<string>;
      DefaultShowNameplate_19_D2A233F74E1D799A216806B6FA79980C: boolean;
    };
    Critter_Rat: {
      CreatureName_2_DC83695545356E53970200BDB975D888: {
        TableId: string;
        Key: string;
      };
      CreatureIcon_7_DF4EEA0643C8418D15044B8CF2A9A018: {
        AssetPathName: string;
        SubPathString: string;
      };
      FerocityMin_10_BB446F4C4B68F7CDEDF902B32DA39A04: number;
      FerocityMax_12_42DB45344FD4021F041B8CAE20C45427: number;
      Biomes_16_E1592CDE48EAC92ABE18348E6664D599: Array<string>;
      DefaultShowNameplate_19_D2A233F74E1D799A216806B6FA79980C: boolean;
    };
    Critter_Eoten: {
      CreatureName_2_DC83695545356E53970200BDB975D888: {
        TableId: string;
        Key: string;
      };
      CreatureIcon_7_DF4EEA0643C8418D15044B8CF2A9A018: {
        AssetPathName: string;
        SubPathString: string;
      };
      FerocityMin_10_BB446F4C4B68F7CDEDF902B32DA39A04: number;
      FerocityMax_12_42DB45344FD4021F041B8CAE20C45427: number;
      Biomes_16_E1592CDE48EAC92ABE18348E6664D599: Array<string>;
      DefaultShowNameplate_19_D2A233F74E1D799A216806B6FA79980C: boolean;
    };
    Ishmael_Vault: {
      CreatureName_2_DC83695545356E53970200BDB975D888: {
        TableId: string;
        Key: string;
      };
      CreatureIcon_7_DF4EEA0643C8418D15044B8CF2A9A018: {
        AssetPathName: string;
        SubPathString: string;
      };
      FerocityMin_10_BB446F4C4B68F7CDEDF902B32DA39A04: number;
      FerocityMax_12_42DB45344FD4021F041B8CAE20C45427: number;
      Biomes_16_E1592CDE48EAC92ABE18348E6664D599: Array<string>;
      DefaultShowNameplate_19_D2A233F74E1D799A216806B6FA79980C: boolean;
    };
    EotenApex_Vault: {
      CreatureName_2_DC83695545356E53970200BDB975D888: {
        TableId: string;
        Key: string;
      };
      CreatureIcon_7_DF4EEA0643C8418D15044B8CF2A9A018: {
        AssetPathName: string;
        SubPathString: string;
      };
      FerocityMin_10_BB446F4C4B68F7CDEDF902B32DA39A04: number;
      FerocityMax_12_42DB45344FD4021F041B8CAE20C45427: number;
      Biomes_16_E1592CDE48EAC92ABE18348E6664D599: Array<string>;
      DefaultShowNameplate_19_D2A233F74E1D799A216806B6FA79980C: boolean;
    };
    SunGiant_Vault: {
      CreatureName_2_DC83695545356E53970200BDB975D888: {
        TableId: string;
        Key: string;
      };
      CreatureIcon_7_DF4EEA0643C8418D15044B8CF2A9A018: {
        AssetPathName: string;
        SubPathString: string;
      };
      FerocityMin_10_BB446F4C4B68F7CDEDF902B32DA39A04: number;
      FerocityMax_12_42DB45344FD4021F041B8CAE20C45427: number;
      Biomes_16_E1592CDE48EAC92ABE18348E6664D599: Array<string>;
      DefaultShowNameplate_19_D2A233F74E1D799A216806B6FA79980C: boolean;
    };
    EventWisp: {
      CreatureName_2_DC83695545356E53970200BDB975D888: {
        TableId: string;
        Key: string;
      };
      CreatureIcon_7_DF4EEA0643C8418D15044B8CF2A9A018: {
        AssetPathName: string;
        SubPathString: string;
      };
      FerocityMin_10_BB446F4C4B68F7CDEDF902B32DA39A04: number;
      FerocityMax_12_42DB45344FD4021F041B8CAE20C45427: number;
      Biomes_16_E1592CDE48EAC92ABE18348E6664D599: Array<string>;
      DefaultShowNameplate_19_D2A233F74E1D799A216806B6FA79980C: boolean;
    };
    BoundRitualHead: {
      CreatureName_2_DC83695545356E53970200BDB975D888: {
        TableId: string;
        Key: string;
      };
      CreatureIcon_7_DF4EEA0643C8418D15044B8CF2A9A018: {
        AssetPathName: string;
        SubPathString: string;
      };
      FerocityMin_10_BB446F4C4B68F7CDEDF902B32DA39A04: number;
      FerocityMax_12_42DB45344FD4021F041B8CAE20C45427: number;
      Biomes_16_E1592CDE48EAC92ABE18348E6664D599: Array<string>;
      DefaultShowNameplate_19_D2A233F74E1D799A216806B6FA79980C: boolean;
    };
    BoundHornHead: {
      CreatureName_2_DC83695545356E53970200BDB975D888: {
        TableId: string;
        Key: string;
      };
      CreatureIcon_7_DF4EEA0643C8418D15044B8CF2A9A018: {
        AssetPathName: string;
        SubPathString: string;
      };
      FerocityMin_10_BB446F4C4B68F7CDEDF902B32DA39A04: number;
      FerocityMax_12_42DB45344FD4021F041B8CAE20C45427: number;
      Biomes_16_E1592CDE48EAC92ABE18348E6664D599: Array<string>;
      DefaultShowNameplate_19_D2A233F74E1D799A216806B6FA79980C: boolean;
    };
    TemplateCreature: {
      CreatureName_2_DC83695545356E53970200BDB975D888: {
        Namespace: string;
        Key: string;
        SourceString: string;
        LocalizedString: string;
      };
      CreatureIcon_7_DF4EEA0643C8418D15044B8CF2A9A018: {
        AssetPathName: string;
        SubPathString: string;
      };
      FerocityMin_10_BB446F4C4B68F7CDEDF902B32DA39A04: number;
      FerocityMax_12_42DB45344FD4021F041B8CAE20C45427: number;
      Biomes_16_E1592CDE48EAC92ABE18348E6664D599: Array<string>;
      DefaultShowNameplate_19_D2A233F74E1D799A216806B6FA79980C: boolean;
    };
    PlainsGiant: {
      CreatureName_2_DC83695545356E53970200BDB975D888: {
        Namespace: string;
        Key: string;
        SourceString: string;
        LocalizedString: string;
      };
      CreatureIcon_7_DF4EEA0643C8418D15044B8CF2A9A018: {
        AssetPathName: string;
        SubPathString: string;
      };
      FerocityMin_10_BB446F4C4B68F7CDEDF902B32DA39A04: number;
      FerocityMax_12_42DB45344FD4021F041B8CAE20C45427: number;
      Biomes_16_E1592CDE48EAC92ABE18348E6664D599: Array<string>;
      DefaultShowNameplate_19_D2A233F74E1D799A216806B6FA79980C: boolean;
    };
  };
}>;

export type ST_Y1S1_Creatures = Array<{
  Type: string;
  Name: string;
  Class: string;
  StringTable: {
    TableNamespace: string;
    KeysToMetaData: {
      Wildlife_Forest_Wolf: string;
      Wildlife_Forest_Boar: string;
      "Wildlife_Forest_Deer(Stag)": string;
      "Wildlife_Forest_Deer(doe)": string;
      "Wildlife_Forest_Deer(fawn)": string;
      Wildlife_Forest_Bear: string;
      Wildlife_Forest_VineElk: string;
      Wildlife_Forest_Hellpig: string;
      Wildlife_Forest_Barat: string;
      Critter_Forest_Rabbit: string;
      Critter_Forest_MushroomRabbit: string;
      Critter_Forest_Cat: string;
      Wildlife_Forest_Spider: string;
      Critter_Desert_DesertDog: string;
      Critter_Desert_DesertScarab: string;
      Wildlife_Desert_DesertEoten: string;
      Wildlife_Desert_AutomatonGathererPawn: string;
      Wildlife_Desert_Elephant: string;
      Wildlife_Desert_AutomatonHarvesterRook: string;
      Wildlife_Desert_Scarab: string;
      Wildlife_Desert_Scorpion: string;
      Wildlife_Desert_Locust: string;
      Wildlife_Desert_BirdWolf: string;
      Monster_Forest_Eoten: string;
      Monster_Forest_DemonDeer: string;
      Apex_Forest_ElderEoten: string;
      Monster_Desert_AutomatonBishop: string;
      Monster_Desert_AutomatonKnight: string;
      Apex_Swamp_Ishmael: string;
      "Wildlife_Swamp_WaterBuffalo(bison)": string;
      Wildlife_Swamp_Shroat: string;
      Wildlife_Swamp_Hippo: string;
      Apex_Desert_SunGiant: string;
      Wildlife_Swamp_Brippo: string;
      Wildlife_Swamp_Frog: string;
      Wildlife_Swamp_YellowSpider: string;
      Wildlife_Swamp_Pihrat: string;
      Wildlife_Swamp_Rabbtor: string;
      Monster_Swamp_Harpy: string;
      Monster_Swamp_SwampGiant: string;
      Wildlife_Swamp_HippoYoung: string;
      Wildlife_Forest_BoarYoung: string;
      Bound_Minion: string;
      Bound_MinionQuad: string;
      Bound_Lanternhead: string;
      Bound_Grenadier: string;
      Bound_Swordsman: string;
      Bound_Flamespitter: string;
      Bound_EliteGuard: string;
      Bound_FaeAssassin: string;
      Bound_Puppeteer: string;
      Bound_Bruiser: string;
      Bound_Caster: string;
      Apex_Swamp_Ishmael_Hero: string;
      Apex_Forest_ElderEoten_Hero: string;
      Apex_Desert_SunGiant_Hero: string;
      Wildlife_Desert_AutomatonGathererPawn_Hero: string;
      Wildlife_Desert_AutomatonHaversterRook_Hero: string;
      Wildlife_Desert_Birdwolf_Hero: string;
      Wildlife_Desert_DesertEoten_Hero: string;
      Wildlife_Desert_Elephant_Hero: string;
      Wildlife_Desert_Locust_Hero: string;
      Wildlife_Desert_Scarab_Hero: string;
      Wildlife_Desert_Scorpion_Hero: string;
      Wildlife_Forest_Barat_Hero: string;
      Wildlife_Forest_Bear_Hero: string;
      Wildlife_Forest_Boar_Hero: string;
      Wildlife_Forest_Deer_Hero: string;
      Wildlife_Forest_Hellpig_Hero: string;
      Wildlife_Forest_Spider_Hero: string;
      Wildlife_Forest_VineElk_Hero: string;
      Wildlife_Forest_Wolf_Hero: string;
      Wildlife_Swamp_Brippo_Hero: string;
      Wildlife_Swamp_Frog_Hero: string;
      Wildlife_Swamp_Hippo_Hero: string;
      Wildlife_Swamp_Pihrat_Hero: string;
      Wildlife_Swamp_Rabbtor_Hero: string;
      Wildlife_Swamp_Shroat_Hero: string;
      Wildlife_Swamp_WaterBuffalo_Hero: string;
      Wildlife_Swamp_YellowSpider_Hero: string;
      "Critter_Forest_Cat(Normal)": string;
      Critter_Swamp_Rat: string;
      Critter_Swamp_Eoten: string;
      Monster_Swamp_SwampGiant_Druid: string;
      Critter_Swamp_Raccoon: string;
      Monster_Desert_AutomatonBishop_Hero: string;
      Monster_Desert_AutomatonKnight_Hero: string;
      Bound_Mortar: string;
      Bound_Aegis: string;
    };
  };
  StringTableId: number;
}>;

export type DA_Coast = Array<{
  Type: string;
  Name: string;
  Class: string;
  Template: {
    ObjectName: string;
    ObjectPath: string;
  };
  Properties: {
    WorldResolution: {
      X: number;
      Y: number;
    };
    WorldPixelSize: number;
    WorldGroundMap: {
      ObjectName: string;
      ObjectPath: string;
    };
    AreaLocation: {
      X: number;
      Y: number;
      Z: number;
    };
    AreaSize: {
      X: number;
      Y: number;
      Z: number;
    };
    WorldCoastlineMap: {
      ObjectName: string;
      ObjectPath: string;
    };
    CaptureOffset: number;
    NativeClass: {
      ObjectName: string;
      ObjectPath: string;
    };
  };
}>;
