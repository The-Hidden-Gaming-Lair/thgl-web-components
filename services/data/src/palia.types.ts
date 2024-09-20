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
