export type ItemTreasureStart = Array<{
  Type: string;
  Name: string;
  Outer?: string;
  Class?: string;
  Template?: {
    ObjectName: string;
    ObjectPath: string;
  };
  Properties?: {
    BodyInstance?: {
      MaxAngularVelocity: number;
    };
    AttachParent?: {
      ObjectName: string;
      ObjectPath: string;
    };
    UCSSerializationIndex?: number;
    bNetAddressable?: boolean;
    CreationMethod?: string;
    AttachSocketName?: string;
    PrimaryComponentTick?: {
      EndTickGroup: string;
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
    UCSModifiedProperties?: Array<{
      MemberParent: {
        ObjectName: string;
        ObjectPath: string;
      };
      MemberName: string;
      MemberGuid: string;
    }>;
    OverrideParameters?: {
      SortedParameterOffsets?: Array<{
        Offset: number;
        Name: string;
        TypeDef: {
          ClassStructOrEnum: {
            ObjectName: string;
            ObjectPath: string;
          };
          UnderlyingType: number;
          Flags: number;
        };
      }>;
    };
    bCreateOnClient?: boolean;
    NavigationSystemClass?: {
      AssetPathName: string;
      SubPathString: string;
    };
    BoxComponent?: {
      ObjectName: string;
      ObjectPath: string;
    };
    RootComponent?: {
      ObjectName: string;
      ObjectPath: string;
    };
    Model?: {
      ObjectName: string;
      ObjectPath: string;
    };
    LevelBuildDataId?: string;
    WorldSettings?: {
      ObjectName: string;
      ObjectPath: string;
    };
    CineCamera?: {
      ObjectName: string;
      ObjectPath: string;
    };
    BoxCover?: {
      ObjectName: string;
      ObjectPath: string;
    };
    BoxBase?: {
      ObjectName: string;
      ObjectPath: string;
    };
    DummyMesh?: {
      ObjectName: string;
      ObjectPath: string;
    };
    BGUAnimationSync?: {
      ObjectName: string;
      ObjectPath: string;
    };
    GSInteractSock?: {
      ObjectName: string;
      ObjectPath: string;
    };
    Cube1?: {
      ObjectName: string;
      ObjectPath: string;
    };
    InteractTransformF2?: {
      ObjectName: string;
      ObjectPath: string;
    };
    Cube?: {
      ObjectName: string;
      ObjectPath: string;
    };
    InteractTransformF1?: {
      ObjectName: string;
      ObjectPath: string;
    };
    Box_ani?: {
      ObjectName: string;
      ObjectPath: string;
    };
    BUS_SceneInactiveActorComp?: {
      ObjectName: string;
      ObjectPath: string;
    };
    Sphere?: {
      ObjectName: string;
      ObjectPath: string;
    };
    "03"?: {
      ObjectName: string;
      ObjectPath: string;
    };
    "02"?: {
      ObjectName: string;
      ObjectPath: string;
    };
    NG_Collect_Yaocai01_Loop?: {
      ObjectName: string;
      ObjectPath: string;
    };
    Box?: {
      ObjectName: string;
      ObjectPath: string;
    };
    StaticMeshNormal?: {
      ObjectName: string;
      ObjectPath: string;
    };
    Niagara?: {
      ObjectName: string;
      ObjectPath: string;
    };
    DefaultSceneRoot?: {
      ObjectName: string;
      ObjectPath: string;
    };
    AreaClass?: {
      ObjectName: string;
      ObjectPath: string;
    };
    SectorRadius?: number;
    SectorMinAngle?: number;
    SectorMaxAngle?: number;
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

export type FUStSummonCommDesc = {
  "1": Array<{
    "1": number;
    "2"?: number;
    "3"?: number;
    "4"?: string;
    "5"?: string;
    "6"?: number;
    "7"?: number;
    "11"?: string;
    "17": Array<string>;
    "18"?: number;
    "27": number;
    "28": number;
    "13"?: string;
    "15": any;
    "22": any;
    "10"?: string;
    "20"?: number;
    "21"?: number;
    "14"?: number;
    "16"?: string;
    "9"?: number;
    "19"?: number;
    "23"?: number;
    "24"?: number;
    "8"?: number;
    "26"?: number;
    "25"?: number;
  }>;
};

export type FUStGuideGroupDesc = {
  "1": Array<{
    "1": number;
    "3": string;
    "4"?: number;
    "5"?: number;
    "6"?: number;
    "8"?: number;
    "2"?: number;
    "7"?: number;
  }>;
};

export type CardDesc = {
  "1": Array<{
    "1": number;
    "2": string;
    "3": number;
    "4"?: number;
    "5"?: string;
    "6": string;
    "7": {
      "1": number;
      "2": string;
    };
    "8"?: number;
    "9"?: number;
    "10"?: string;
    "12": number;
    "13": number;
    "11"?: number;
  }>;
};

export type GMMapStaticData = {
  MapData: Record<
    string,
    Record<
      string,
      {
        Guid: string;
        CategoryName: string;
        ResId: number;
        ActorLoctionX: number;
        ActorLoctionY: number;
        ActorLoctionZ: number;
        TransformLoctionX: number;
        TransformLoctionY: number;
        TransformLoctionZ: number;
        ExtendId: number;
      }
    >
  >;
};
