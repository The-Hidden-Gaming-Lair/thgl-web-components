export const RelevantActors = ["BP_ResourceNode_C", "BP_DropPod_C", "BP_MercerShrine_C", "BP_SomerSloopShrine_C"] as const

type AdditionalTypes = "BP_WorldScannableDataGenerator_C";

export type ActorType = typeof RelevantActors[number];

export type ActorBase = {
  Type: ActorType | AdditionalTypes;
  Name: string;
  Outer: string;
  Class: string;
  Properties: Record<any, any>
}

export type Template = {
  ObjectName: string;
  ObjectPath: string;
}

export type Location = {
  X: number,
  Y: number,
  Z: number
}

export type RessourceActor = {
  Type: "BP_ResourceNode_C";
  Properties: { mPurity?: "RP_PURE" | "RP_Inpure", mResourceClass: Template, RelativeLocation: Location };
} & ActorBase;

export type DriveActor = {
  Type: "BP_DropPod_C";
  Template: Template,
  Properties: {
    CachedActorTransform: {
      Translation: Location;
    },
    mUnlockCost: {
      CostType: "EFGDropPodUnlockCostType::Item" | "EFGDropPodUnlockCostType::Power",
      ItemCost: {
        ItemClass: Template,
        Amount: number
      }
    },
    mPowerConnectionComponent: Template,
    mPowerInfoComponent: Template,
    mInventoryComponent: Template,
    mDropPodGuid: string
  }
} & ActorBase

export type ShrineActor = {
  Type: "BP_MercerShrine_C" | "BP_SomerSloopShrine_C"
  Template: Template;
  Properties: {
    CachedActorTransform: {
      Translation: Location;
    }
  }
} & ActorBase

export type RelevantActors = ShrineActor | DriveActor | RessourceActor;

export type StreamingActor = {
  Type: "WorldPartitionLevelStreamingPolicy",
  Properties: {
    SubObjectsToCellRemapping: {
      Key: string,
      Value: string
    }[]
  }
} & ActorBase

export type ScanningActor = {
  Type: "BP_WorldScannableDataGenerator_C",
  Properties: {
    mItemPickups: {
      ActorGuid: string,
      ActorClass: string,
      ActorLocation: Location
    }[]
  }
} & ActorBase

export type Actor = ScanningActor |StreamingActor | RelevantActors;
export type PersistentLevel = Actor[];

export type IconLibrary = Array<{
  Type: string;
  Name: string;
  Class: string;
  Properties: {
    mIconData: Array<{
      ID: number;
      Texture: {
        AssetPathName: string;
        SubPathString: string;
      };
      ItemDescriptor: {
        AssetPathName: string;
        SubPathString: string;
      };
      DisplayNameOverride: boolean;
      IconName: {
        CultureInvariantString?: string;
        TableId?: string;
        Key?: string;
        SourceString: any;
        LocalizedString: any;
      };
      IconType: string;
      Hidden: boolean;
      SearchOnly: boolean;
      Animated: boolean;
    }>;
    mMonochromeIconData: Array<{
      ID: number;
      Texture: {
        AssetPathName: string;
        SubPathString: string;
      };
      ItemDescriptor: {
        AssetPathName: string;
        SubPathString: string;
      };
      DisplayNameOverride: boolean;
      IconName: {
        TableId: string;
        Key: string;
        SourceString: any;
        LocalizedString: any;
      };
      IconType: string;
      Hidden: boolean;
      SearchOnly: boolean;
      Animated: boolean;
    }>;
    mCustomIconData: Array<{
      ID: number;
      Texture: {
        AssetPathName: string;
        SubPathString: string;
      };
      ItemDescriptor: {
        AssetPathName: string;
        SubPathString: string;
      };
      DisplayNameOverride: boolean;
      IconName: {
        TableId: string;
        Key: string;
        SourceString: any;
        LocalizedString: any;
      };
      IconType: string;
      Hidden: boolean;
      SearchOnly: boolean;
      Animated: boolean;
    }>;
    mMaterialIconData: Array<{
      ID: number;
      Texture: {
        AssetPathName: string;
        SubPathString: string;
      };
      ItemDescriptor: {
        AssetPathName: string;
        SubPathString: string;
      };
      DisplayNameOverride: boolean;
      IconName: {
        TableId: string;
        Key: string;
        SourceString: any;
        LocalizedString: any;
      };
      IconType: string;
      Hidden: boolean;
      SearchOnly: boolean;
      Animated: boolean;
    }>;
    mMapStampIconData: Array<{
      ID: number;
      Texture: {
        AssetPathName: string;
        SubPathString: string;
      };
      ItemDescriptor: {
        AssetPathName: string;
        SubPathString: string;
      };
      DisplayNameOverride: boolean;
      IconName: {
        TableId: string;
        Key: string;
        SourceString: any;
        LocalizedString: any;
      };
      IconType: string;
      Hidden: boolean;
      SearchOnly: boolean;
      Animated: boolean;
    }>;
  };
}>;
