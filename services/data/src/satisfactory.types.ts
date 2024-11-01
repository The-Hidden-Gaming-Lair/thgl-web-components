export type Actor = {
  Type: string;
  Name: string;
  Outer: string;
  Class: string;
  Properties: any & { mPurity?: "RP_PURE" | "RP_Inpure" };
};

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
