export type DomainConfig = {
  name: string;
  path: string;
  root_level: string;
  version: string;
  label: string;
  level_size: number;
  divs: Array<number>;
  type: string;
  playable_area: number;
  zones: Array<{
    name: string;
    label: string;
    type: string;
    priority: number;
    stc_spawn_locations: Array<any>;
    poly_verts: Array<{
      x: number;
      y: number;
    }>;
    biome_areas: Array<{
      biome: string;
      area_min: number;
      area_max: number;
      area_avg: number;
      area_median: number;
      area_sum: number;
    }>;
    interior_rect: {
      min: {
        x: number;
        y: number;
      };
      max: {
        x: number;
        y: number;
      };
    };
  }>;
  biome_areas: Array<any>;
  portals: Array<{
    name: string;
    location: {
      x: number;
      y: number;
      z: number;
    };
  }>;
  biome_index: {
    Barren: number;
    Meadows: number;
    Grasslands: number;
    BroadleafForest: number;
    PineForest: number;
    Wetlands: number;
    Windswept: number;
    Rocky: number;
    Scrublands: number;
    PineForest_Haunted: number;
    BroadleafForest_Haunted: number;
    LegendaryForest: number;
    Wastelands: number;
    Pitted_Rocklands: number;
  };
  levels: Array<{
    map_file: string;
    name: string;
    min: Array<number>;
    max: Array<number>;
  }>;
};

export type MapCell = {
  tile_size: number;
  map_cell: Array<number>;
  biome_map: string;
  icons: Array<{
    name: string;
    entity: string;
    uuid: string;
    icon: string;
    pos: Array<number>;
  }>;
  big_tile: string;
  map_tiles: Array<{
    filename: string;
    min: Array<number>;
    max: Array<number>;
  }>;
};

export type MapMarkerTypes = Array<{
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
      marker_type_12_F0686EB649632F268F67878775844E53: string;
      icon_14_79B580D74A39832FAFDC3AA545CFCB48: {
        AssetPathName: string;
        SubPathString: string;
      };
      default_label_15_8B7267124AB44D87F87F7490EABAD1E5: {
        CultureInvariantString: any;
      };
    };
  };
}>;

export type Sockets = {
  cell_coords: string;
  sockets: Array<{
    x: number;
    y: number;
    quarrydistance_i: string;
    snow: string;
    zone: string;
    wetness: string;
    compass_i: string;
    smalllakes: string;
    lakeside: string;
    is_quarry: string;
    rock_debris: string;
    base: string;
    version_string: string;
    biome_name: string;
    waternear: string;
    GUID: string;
    dist_in_biome: string;
    curvature: string;
    treenear: string;
    biome: string;
    playable_area_mask: string;
    campdistance_i: string;
    urban: string;
    slope: string;
    lakebottom: string;
    occluded: string;
    urbandistance_i: string;
    shrinedistance_i: string;
    height: string;
    ao: string;
    zone_type: string;
    gravel: string;
    name: string;
    playerstartdistance_i: string;
    highflow: string;
  }>;
};

export type GatherablesDataAsset = Array<{
  Type: string;
  Name: string;
  Class: string;
  Properties: {
    loot_table_id_obsolete: string;
    VisualDataAsset: string;
    ResourceName: string;
    CollectType: {
      ObjectName: string;
      ObjectPath: string;
    };
    LootTableId: string;
    InteractionRadius: number;
    SpawnRadius: number;
    Instances: number;
    MinScale: number;
    MaxScale: number;
    RotConeHalfAngle: number;
    RespawnTimer: number;
    IntID: number;
    LocalizationNameKey: string;
    LocalizationDescriptionKey: string;
    IsDev?: boolean;
  };
}>;

export type PDAResourcesGatherables = Array<{
  Type: string;
  Name: string;
  Class: string;
  Properties: {
    ResourceMesh: {
      AssetPathName: string;
      SubPathString: string;
    };
  };
}>;

export type PDAResourcesMineables = Array<{
  Type: string;
  Name: string;
  Class: string;
  Properties: {
    ResourceMesh: {
      AssetPathName: string;
      SubPathString: string;
    };
    DynamicResourceMesh: {
      ObjectName: string;
      ObjectPath: string;
    };
  };
}>;

export type Resource = Array<{
  Type: string;
  Name: string;
  Outer?: string;
  Class: string;
  Properties: {
    AggGeom?: {
      SphereElems: Array<{
        Center: {
          X: number;
          Y: number;
          Z: number;
        };
        Radius: number;
        RestOffset: number;
        Name: string;
        bContributeToMass: boolean;
        CollisionEnabled: string;
      }>;
    };
    PhysMaterial?: {
      ObjectName: string;
      ObjectPath: string;
    };
    DefaultInstance?: {
      ObjectType: string;
      CollisionEnabled: string;
      CollisionProfileName: string;
      CollisionResponses: {
        ResponseArray: Array<{
          Channel: string;
          Response: string;
        }>;
      };
    };
    StaticMaterials?: Array<{
      MaterialInterface: {
        ObjectName: string;
        ObjectPath: string;
      };
      MaterialSlotName: string;
      ImportedMaterialSlotName: string;
      UVChannelData: {
        bInitialized: boolean;
        bOverrideDensities: boolean;
        LocalUVDensities: number;
      };
    }>;
    LightmapUVDensity?: number;
    LightMapResolution?: number;
    LightMapCoordinateIndex?: number;
    bHasNavigationData?: boolean;
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
  BodySetup?: {
    ObjectName: string;
    ObjectPath: string;
  };
  NavCollision: any;
  LightingGuid?: string;
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
      RootData: {
        HierarchyFixups: Array<{
          PageIndex: number;
          NodeIndex: number;
          ChildIndex: number;
          ClusterGroupPartStartIndex: number;
          PageDependencyStart: number;
          PageDependencyNum: number;
        }>;
        ClusterFixups: Array<{
          PageIndex: number;
          ClusterIndex: number;
          PageDependencyStart: number;
          PageDependencyNum: number;
        }>;
        RootPageInfos: Array<{
          RuntimeResourceID: number;
          NumClusters: number;
        }>;
        Clusters: Array<any>;
      };
      StreamablePages: {
        BulkDataFlags: string;
        ElementCount: number;
        SizeOnDisk: number;
        OffsetInFile: string;
      };
      ImposterAtlas: Array<any>;
      HierarchyNodes: Array<{
        LODBounds: Array<{
          X: any;
          Y: number;
          Z: number;
          W: any;
        }>;
        Misc0: Array<{
          BoxBoundsCenter: {
            X: any;
            Y: any;
            Z: number;
          };
          MinLODError: number;
          MaxParentLODError: number;
        }>;
        Misc1: Array<{
          BoxBoundsExtent: {
            X: number;
            Y: any;
            Z: any;
          };
          ChildStartReference: number;
          bLoaded: boolean;
        }>;
        Misc2: Array<{
          NumChildren: number;
          NumPages: number;
          StartPageIndex: number;
          bEnabled: boolean;
          bLeaf: boolean;
        }>;
      }>;
      HierarchyRootOffsets: Array<number>;
      PageStreamingStates: Array<{
        BulkOffset: number;
        BulkSize: number;
        PageSize: number;
        DependenciesStart: number;
        DependenciesNum: number;
        MaxHierarchyDepth: number;
        Flags: number;
      }>;
      PageDependencies: Array<number>;
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
}>;

export type NPCDataAssets = Array<{
  Type: string;
  Name: string;
  Class: string;
  Properties: {
    Family: {
      AssetPathName: string;
      SubPathString: string;
    };
    Blueprint: {
      AssetPathName: string;
      SubPathString: string;
    };
    Behaviour: {
      AssetPathName: string;
      SubPathString: string;
    };
    VisualData: {
      AssetPathName: string;
      SubPathString: string;
    };
    LootTable: string;
    BeginGameplayTagNotifySounds: Array<{
      Key: {
        TagName: string;
      };
      Value: {
        AssetPathName: string;
        SubPathString: string;
      };
    }>;
    PowerLevel?: number;
    MeleeDamage: number;
    RangedDamage: number;
    MaxHealth: number;
    BluntPhysicalResistance: number;
    SlashingPhysicalResistance: number;
    PiercingPhysicalResistance: number;
    ResistanceMental: number;
    NPCSlashing: number;
    NPCPiercing: number;
    NPCBlunt: number;
    NPCFire: number;
    NPCCold: number;
    NPCPoison: number;
    NPCMental: number;
    RunningSpeed: number;
    RoamIntervalMin: number;
    Weapon: {
      AssetPathName: string;
      SubPathString: string;
    };
    Abilities: Array<{
      AssetPathName: string;
      SubPathString: string;
    }>;
    display_name: {
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
  };
}>;

export type DA_Item = Array<{
  Type: string;
  Name: string;
  Class: string;
  Properties: {
    Icon: {
      ObjectName: string;
      ObjectPath: string;
    };
    StaticMesh: {
      AssetPathName: string;
      SubPathString: string;
    };
    IconCameraData: Array<{
      Key: string;
      Value: {
        X: number;
        Y: number;
        Z: number;
      };
    }>;
  };
}>;

export type DA_ItemDataAsset = Array<{
  Type: string;
  Name: string;
  Class: string;
  Properties: {
    VisualDataAsset: string;
    Tier: number;
    ItemLevel: number;
    Quality: string;
    MaxStackSize: number;
    IntID: number;
    LocalizationNameKey: string;
    LocalizationDescriptionKey: string;
  };
}>;

export type PD_Recipes = Array<{
  Type: string;
  Name: string;
  Class: string;
  Properties: {
    BaseDuration: number;
    SkillRequired: {
      ObjectName: string;
      ObjectPath: string;
    };
    SkillDifficulty: number;
    SkillMinRolls: number;
    SkillMaxRolls: number;
    SkillSuccessPercentage: number;
    SkillCriticalPercentage: number;
    ItemDeliverables: Array<{
      Key: string;
      Value: number;
    }>;
    DeliverableLifetime: number;
    RecipeUnlockItemName: string;
    ItemIngredients: Array<{
      Key: string;
      Value: number;
    }>;
    IngredientCategories: Array<{
      Key: {
        TagName: string;
      };
      Value: number;
    }>;
    IntID: number;
    LocalizationNameKey: string;
    LocalizationDescriptionKey: string;
    IsDev?: boolean;
  };
}>;
export type GlobalFilter = {
  group: string;
  values: {
    id: string;
    defaultOn?: boolean;
  }[];
};

export type PD_Skills = Array<{
  Type: string;
  Name: string;
  Class: string;
  Properties: {
    UiGroup: string;
    GasAttributeName: string;
    GasAttributeXpName: string;
    SkillCounterLevel: string;
    SkillCounterExperience: string;
    SkillLevelingTableId: string;
    SkillLevelCap: number;
    SkillBaseXp: number;
    TickIntervalSeconds: number;
    IntID: number;
    LocalizationNameKey: string;
    LocalizationDescriptionKey: string;
  };
}>;

export type PC_Activatable = Array<{
  Type: string;
  Name: string;
  Class: string;
  Properties: {
    CooldownTag: {
      TagName: string;
    };
    CooldownDuration: number;
    IsConsumedOnActivation: boolean;
    CostType: Array<string>;
    CostAmount: Array<number>;
    AbilityToActivate: {
      AssetPathName: string;
      SubPathString: string;
    };
    GivesAttributes: Array<{
      Key: string;
      Value: number;
    }>;
    GivesTags: Array<{
      TagName: string;
    }>;
    VisualDataAsset: string;
    Tier: number;
    ItemLevel: number;
    Quality: string;
    MaxStackSize: number;
    IntID: number;
    LocalizationNameKey: string;
    LocalizationDescriptionKey: string;
  };
}>;

export type NPCResources = Array<{
  Type: string;
  Name: string;
  Class: string;
  Properties: {
    NpcId: string;
    interaction_radius: number;
    ResourceName: string;
    LootTableId: string;
    SpawnRadius: number;
    Instances: number;
    MinNodeVolume: number;
    MaxNodeVolume: number;
    RespawnTimer: number;
    IntID: number;
    IsDev?: boolean;
  };
}>;

export type RootLevel = Array<{
  Type: string;
  Name: string;
  Outer?: string;
  Class: string;
  Template?: {
    ObjectName: string;
    ObjectPath: string;
  };
  Properties?: {
    StaticMesh?: {
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
    BodyInstance?: {
      CollisionEnabled: string;
      bInterpolateWhenSubStepping: boolean;
      CollisionResponses: {
        ResponseArray: Array<{
          Channel: string;
          Response: string;
        }>;
      };
      ObjectType?: string;
      bAutoWeld?: boolean;
    };
    OverrideMaterials?: Array<any>;
    AttachParent?: {
      ObjectName: string;
      ObjectPath: string;
    };
    UCSSerializationIndex?: number;
    bNetAddressable?: boolean;
    CreationMethod?: string;
    bHasNoStreamableTextures?: boolean;
    bUseDefaultCollision?: boolean;
    Mobility?: string;
    ComponentTags?: Array<string>;
    StaticMeshComponent?: {
      ObjectName: string;
      ObjectPath: string;
    };
    RootComponent?: {
      ObjectName: string;
      ObjectPath: string;
    };
    Tags?: Array<string>;
    LightGuid?: string;
    NavigationSystemConfig?: {
      ObjectName: string;
      ObjectPath: string;
    };
    BookmarkArray?: Array<any>;
    TextRender: any;
    WaitTime?: number;
    BlueprintCreatedComponents?: Array<
      | {
          ObjectName: string;
          ObjectPath: string;
        }
      | undefined
    >;
    DefaultSceneRoot?: {
      ObjectName: string;
      ObjectPath: string;
    };
    InstanceComponents?: Array<{
      ObjectName: string;
      ObjectPath: string;
    }>;
    Cycle?: string;
    Waypoints?: Array<
      | {
          ObjectName: string;
          ObjectPath: string;
        }
      | undefined
    >;
    PointLightComponent?: {
      ObjectName: string;
      ObjectPath: string;
    };
    LightComponent?: {
      ObjectName: string;
      ObjectPath: string;
    };
    SM_CandleFlame_01?: {
      ObjectName: string;
      ObjectPath: string;
    };
    SM_CaveOilLamp_01?: {
      ObjectName: string;
      ObjectPath: string;
    };
    SharedRoot?: {
      ObjectName: string;
      ObjectPath: string;
    };
    PointLight?: {
      ObjectName: string;
      ObjectPath: string;
    };
    BaseDisc: any;
    Nameplate: any;
    SM_Editor_PreviewRadius: any;
    SM_ScaleSoldier: any;
    Orderplate: any;
    DebugComponents: any;
    BP_AIWaypointComponent?: {
      ObjectName: string;
      ObjectPath: string;
    };
    SphereMaterial: any;
    PawnMaterial: any;
    NPC_DA?: {
      ObjectName: string;
      ObjectPath: string;
    };
    Catalogue?: Array<{
      NPCData: {
        AssetPathName: string;
        SubPathString: string;
      };
      Tier: number;
      Amount: number;
      Probability: number;
    }>;
    RespawnTimeMin?: number;
    RespawnTimeMax?: number;
    NavInvoker?: {
      ObjectName: string;
      ObjectPath: string;
    };
    ArrowComponent?: {
      ObjectName: string;
      ObjectPath: string;
    };
    Orders?: string;
    RoamMaxDistance?: number;
    Model?: {
      ObjectName: string;
      ObjectPath: string;
    };
    LevelBuildDataId?: string;
    WorldSettings?: {
      ObjectName: string;
      ObjectPath: string;
    };
    WorldPartitionRuntimeCell?: {
      AssetPathName: string;
      SubPathString: string;
    };
  };
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
  LevelScriptActor: any;
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
  Vectors?: Array<any>;
  Points?: Array<any>;
  Nodes?: Array<any>;
  Surfs?: Array<any>;
  NumSharedSides?: number;
  VertexBuffer?: {
    Vertices: Array<any>;
  };
  LightingGuid?: string;
  LightmassSettings?: Array<any>;
  PersistentLevel?: {
    ObjectName: string;
    ObjectPath: string;
  };
  ExtraReferencedObjects?: Array<any>;
  StreamingLevels?: Array<any>;
}>;
