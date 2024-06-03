export type Sanctuary_Eastern_Continent = {
  __fileName__: string;
  __snoID__: number;
  __type__: string;
  __typeHash__: number;
  ptServerData: Array<{
    __type__: string;
    __typeHash__: number;
    ptSceneChunks: Array<{
      __type__: string;
      __typeHash__: number;
      snoname: {
        __raw__: number;
        __group__: number;
        __type__: string;
        __typeHash__: number;
        __targetFileName__: string;
        groupName: string;
        name: string;
      };
      transform: {
        __type__: string;
        __typeHash__: number;
        q: {
          __type__: string;
          __typeHash__: number;
          x: number;
          y: number;
          z: number;
          w: number;
        };
        wp: {
          x: number;
          y: number;
          z: number;
        };
      };
      tSceneSpec: {
        __type__: string;
        __typeHash__: number;
        dwFlags: number;
        snoLevelArea: any;
        uProceduralEntranceName: number;
        snoPrevWorld: any;
        uPrevEntranceGUID: number;
        snoPrevLevelArea: any;
        snoAudioContext: any;
        snoWeather: any;
        snoPresetWorld: any;
        nSceneChunk: number;
        arSubzones: Array<{
          __type__: string;
          __typeHash__: number;
          snoSubzone: {
            __raw__: number;
            __group__: number;
            __type__: string;
            __typeHash__: number;
            __targetFileName__: string;
            groupName: string;
            name: string;
          };
          eRelationType: number;
        }>;
      };
    }>;
    snoScript: any;
    nSeed: number;
    flMinX: number;
    flMinY: number;
    flMaxX: number;
    flMaxY: number;
    arWeatherSNOs: Array<any>;
    arSubzones: Array<{
      __raw__: number;
      __group__: number;
      __type__: string;
      __typeHash__: number;
      __targetFileName__: string;
      groupName: string;
      name: string;
    }>;
  }>;
  eLayoutType: number;
  flGridSize: number;
  tEnvironment: {
    __type__: string;
    __typeHash__: number;
    tPostFXParams: {
      __type__: string;
      __typeHash__: number;
      flFilterOffset: Array<number>;
      flFilterCoeff: Array<number>;
    };
    snoSkyboxActor: any;
    snoAudioContext: {
      __raw__: number;
      __group__: number;
      __type__: string;
      __typeHash__: number;
      __targetFileName__: string;
      groupName: string;
      name: string;
    };
    snoWeather: {
      __raw__: number;
      __group__: number;
      __type__: string;
      __typeHash__: number;
      __targetFileName__: string;
      groupName: string;
      name: string;
    };
    snoSkylightTex: any;
    qSkylightTexRotation: {
      __type__: string;
      __typeHash__: number;
      x: number;
      y: number;
      z: number;
      w: number;
    };
    snoOceanMaterial: {
      __raw__: number;
      __group__: number;
      __type__: string;
      __typeHash__: number;
      __targetFileName__: string;
      groupName: string;
      name: string;
    };
    snoGroundFogMaterial: {
      __raw__: number;
      __group__: number;
      __type__: string;
      __typeHash__: number;
      __targetFileName__: string;
      groupName: string;
      name: string;
    };
    flFarPlaneCap: number;
    snoOceanAmbient: {
      __raw__: number;
      __group__: number;
      __type__: string;
      __typeHash__: number;
      __targetFileName__: string;
      groupName: string;
      name: string;
    };
    snoCoastlineAmbient: {
      __raw__: number;
      __group__: number;
      __type__: string;
      __typeHash__: number;
      __targetFileName__: string;
      groupName: string;
      name: string;
    };
    snoRiverAmbient: {
      __raw__: number;
      __group__: number;
      __type__: string;
      __typeHash__: number;
      __targetFileName__: string;
      groupName: string;
      name: string;
    };
    snoStreamAmbient: {
      __raw__: number;
      __group__: number;
      __type__: string;
      __typeHash__: number;
      __targetFileName__: string;
      groupName: string;
      name: string;
    };
    snoCliffEdgeAmbient: {
      __raw__: number;
      __group__: number;
      __type__: string;
      __typeHash__: number;
      __targetFileName__: string;
      groupName: string;
      name: string;
    };
    unk_f4f9d6f: boolean;
    unk_55eead1: number;
    unk_a7ebd97: boolean;
  };
  flDeformationScale: number;
  uFlags: number;
  snoGameObserverOverride: any;
  snoSubzoneDefault: {
    __raw__: number;
    __group__: number;
    __type__: string;
    __typeHash__: number;
    __targetFileName__: string;
    groupName: string;
    name: string;
  };
  arDRLGLevelAreas: Array<any>;
  fHasGlobalMarkers: boolean;
  fHasZoneMap: boolean;
  unk_7f991eb: boolean;
  snoWaypointLevelArea: any;
  unk_3ef762e: number;
  unk_50f10cb: number;
  arRegionBoundaries: Array<{
    __type__: string;
    __typeHash__: number;
    snoTerritory: {
      __raw__: number;
      __group__: number;
      __type__: string;
      __typeHash__: number;
      __targetFileName__: string;
      groupName: string;
      name: string;
    };
    arPoints: Array<{
      x: number;
      y: number;
    }>;
  }>;
  dwFeatureFlags: number;
  eDungeonFlavorType: number;
  arDesignerFeatureFlags: Array<any>;
  tMatTexCloud: {
    __type__: string;
    __typeHash__: number;
    snoTex: {
      __raw__: number;
      __group__: number;
      __type__: string;
      __typeHash__: number;
      __targetFileName__: string;
      groupName: string;
      name: string;
    };
    ptTexAnim: Array<{
      __type__: string;
      __typeHash__: number;
      dwType: number;
      dwPad: number;
      flUScale: number;
      flVScale: number;
      flUTransInitial: number;
      unk_803e8a7: {
        rangeValue1: number;
        rangeValue2: number;
      };
      unk_d28788e: {
        __type__: string;
        __typeHash__: number;
        nScalarFunction: number;
        dwFlags: number;
        tInputRange: {
          rangeValue1: number;
          rangeValue2: number;
        };
        tRemapRange: {
          rangeValue1: number;
          rangeValue2: number;
        };
        eRemapEasing: number;
        szFormulaName: number;
      };
      flVTransInitial: number;
      unk_42b1708: {
        rangeValue1: number;
        rangeValue2: number;
      };
      unk_6fe64f: {
        __type__: string;
        __typeHash__: number;
        nScalarFunction: number;
        dwFlags: number;
        tInputRange: {
          rangeValue1: number;
          rangeValue2: number;
        };
        tRemapRange: {
          rangeValue1: number;
          rangeValue2: number;
        };
        eRemapEasing: number;
        szFormulaName: number;
      };
      ePinTranslation: number;
      eOrderOperation: number;
      unk_96b1a52: number;
      unk_ec7cf93: number;
      dwAnimFlags: number;
      unk_e5b0c7f: {
        rangeValue1: number;
        rangeValue2: number;
      };
      fXOffset: number;
      fYOffset: number;
      aRotationInitial: number;
      dwRotationRandomSeed: number;
      tUScaleScalar: {
        __type__: string;
        __typeHash__: number;
        nScalarFunction: number;
        dwFlags: number;
        tInputRange: {
          rangeValue1: number;
          rangeValue2: number;
        };
        tRemapRange: {
          rangeValue1: number;
          rangeValue2: number;
        };
        eRemapEasing: number;
        szFormulaName: number;
      };
      tVScaleScalar: {
        __type__: string;
        __typeHash__: number;
        nScalarFunction: number;
        dwFlags: number;
        tInputRange: {
          rangeValue1: number;
          rangeValue2: number;
        };
        tRemapRange: {
          rangeValue1: number;
          rangeValue2: number;
        };
        eRemapEasing: number;
        szFormulaName: number;
      };
    }>;
    nTexAnimStateIndex: number;
  };
  tMatTexCloud2: {
    __type__: string;
    __typeHash__: number;
    snoTex: {
      __raw__: number;
      __group__: number;
      __type__: string;
      __typeHash__: number;
      __targetFileName__: string;
      groupName: string;
      name: string;
    };
    ptTexAnim: Array<{
      __type__: string;
      __typeHash__: number;
      dwType: number;
      dwPad: number;
      flUScale: number;
      flVScale: number;
      flUTransInitial: number;
      unk_803e8a7: {
        rangeValue1: number;
        rangeValue2: number;
      };
      unk_d28788e: {
        __type__: string;
        __typeHash__: number;
        nScalarFunction: number;
        dwFlags: number;
        tInputRange: {
          rangeValue1: number;
          rangeValue2: number;
        };
        tRemapRange: {
          rangeValue1: number;
          rangeValue2: number;
        };
        eRemapEasing: number;
        szFormulaName: number;
      };
      flVTransInitial: number;
      unk_42b1708: {
        rangeValue1: number;
        rangeValue2: number;
      };
      unk_6fe64f: {
        __type__: string;
        __typeHash__: number;
        nScalarFunction: number;
        dwFlags: number;
        tInputRange: {
          rangeValue1: number;
          rangeValue2: number;
        };
        tRemapRange: {
          rangeValue1: number;
          rangeValue2: number;
        };
        eRemapEasing: number;
        szFormulaName: number;
      };
      ePinTranslation: number;
      eOrderOperation: number;
      unk_96b1a52: number;
      unk_ec7cf93: number;
      dwAnimFlags: number;
      unk_e5b0c7f: {
        rangeValue1: number;
        rangeValue2: number;
      };
      fXOffset: number;
      fYOffset: number;
      aRotationInitial: number;
      dwRotationRandomSeed: number;
      tUScaleScalar: {
        __type__: string;
        __typeHash__: number;
        nScalarFunction: number;
        dwFlags: number;
        tInputRange: {
          rangeValue1: number;
          rangeValue2: number;
        };
        tRemapRange: {
          rangeValue1: number;
          rangeValue2: number;
        };
        eRemapEasing: number;
        szFormulaName: number;
      };
      tVScaleScalar: {
        __type__: string;
        __typeHash__: number;
        nScalarFunction: number;
        dwFlags: number;
        tInputRange: {
          rangeValue1: number;
          rangeValue2: number;
        };
        tRemapRange: {
          rangeValue1: number;
          rangeValue2: number;
        };
        eRemapEasing: number;
        szFormulaName: number;
      };
    }>;
    nTexAnimStateIndex: number;
  };
  flCloudScale: number;
  tZoneMapParams: {
    __type__: string;
    __typeHash__: number;
    flZoneArtScale: number;
    vecZoneArtCenter: {
      x: number;
      y: number;
    };
    flZoneBaseScale: number;
    flZoneZoomScaleMax: number;
    unk_4e79635: number;
    unk_341cf9b: number;
    unk_7ed5974: number;
    unk_f373e7a: number;
    unk_77999b9: number;
    arZoomBreakpoints: Array<number>;
    unk_42cbe27: number;
    snoMagMaxBoxMap: {
      __raw__: number;
      __group__: number;
      __type__: string;
      __typeHash__: number;
      __targetFileName__: string;
      groupName: string;
      name: string;
    };
    unk_3620f37: number;
    unk_c60b9b0: number;
    snoFoWMaskOverlay: {
      __raw__: number;
      __group__: number;
      __type__: string;
      __typeHash__: number;
      __targetFileName__: string;
      groupName: string;
      name: string;
    };
    arFogOfWar: Array<{
      __type__: string;
      __typeHash__: number;
      snoFoW: {
        __raw__: number;
        __group__: number;
        __type__: string;
        __typeHash__: number;
        __targetFileName__: string;
        groupName: string;
        name: string;
      };
      snoTexture: {
        __raw__: number;
        __group__: number;
        __type__: string;
        __typeHash__: number;
        __targetFileName__: string;
        groupName: string;
        name: string;
      };
      vecWorldOffset: {
        x: number;
        y: number;
      };
      vecWorldSize: {
        x: number;
        y: number;
      };
    }>;
    arGridSecretTextures: Array<{
      __type__: string;
      __typeHash__: number;
      nX: number;
      nY: number;
      arSecretTextures: Array<{
        __type__: string;
        __typeHash__: number;
        snoSecretTexture: {
          __raw__: number;
          __group__: number;
          __type__: string;
          __typeHash__: number;
          __targetFileName__: string;
          groupName: string;
          name: string;
        };
        arCampaignConditions: Array<{
          __type__: string;
          __typeHash__: number;
          snoCampaignCondition: {
            __raw__: number;
            __group__: number;
            __type__: string;
            __typeHash__: number;
            __targetFileName__: string;
            groupName: string;
            name: string;
          };
          unk_2cfa560: boolean;
        }>;
      }>;
    }>;
  };
};

export type StringList = {
  __fileName__: string;
  __snoID__: number;
  __type__: string;
  __typeHash__: number;
  arStrings: Array<{
    __type__: string;
    __typeHash__: number;
    szLabel: string;
    szText: string;
    hLabel: number;
  }>;
  ptMapStringTable: string;
};

export type Subzone = {
  __fileName__: string;
  __snoID__: number;
  __type__: string;
  __typeHash__: number;
  snoPrimaryWorld: {
    __raw__: number;
    __group__: number;
    __type__: string;
    __typeHash__: number;
    __targetFileName__: string;
    groupName: string;
    name: string;
  };
  uEntranceGUID: number;
  arLevelAreas: Array<any>;
  eType: number;
  eParentZone: number;
  snoTerritory: any;
  ePvPType: number;
  snoPvPSourceWorld: any;
  snoActorGroups: any;
  ptPostprocessed: string;
  arWorldMarkerSets: Array<any>;
  arSnoSecondaryWorlds: Array<any>;
  dwFlags: number;
  unk_35fc338: boolean;
  arPublicLevelScalingDataOverride: Array<{
    __type__: string;
    __typeHash__: number;
    nLevelScalingMin: number;
    nLevelScalingMatchUntilLevel: number;
    nLevelScalingDelta: number;
    nLevelScalingMax: number;
  }>;
  tPrivateLevelScalingDataOverride: {
    __type__: string;
    __typeHash__: number;
    nLevelScalingMin: number;
    nLevelScalingMatchUntilLevel: number;
    nLevelScalingDelta: number;
    nLevelScalingMax: number;
  };
  bHasWorldEvent: boolean;
  bAlwaysPrivate: boolean;
  arForcedPrefetchData: Array<any>;
};

export type GlobalMarkers = {
  __fileName__: string;
  __snoID__: number;
  __type__: string;
  __typeHash__: number;
  dwNextID: number;
  ptContent: Array<{
    __type__: string;
    __typeHash__: number;
    dwType: number;
    dwPad: number;
    arGlobalMarkerActors: Array<{
      __type__: string;
      __typeHash__: number;
      snoMarkerSet: {
        __raw__: number;
        __group__: number;
        __type__: string;
        __typeHash__: number;
        __targetFileName__?: string;
        groupName: string;
        name?: string;
      };
      szMarkerName: number;
      dwMarkerPathID: number;
      snoActor: {
        __raw__: number;
        __group__: number;
        __type__: string;
        __typeHash__: number;
        __targetFileName__?: string;
        groupName: string;
        name?: string;
      };
      eActorType: number;
      eGizmoType: number;
      snoWorld: {
        __raw__: number;
        __group__: number;
        __type__: string;
        __typeHash__: number;
        __targetFileName__?: string;
        groupName: string;
        name?: string;
      };
      tWorldTransform: {
        __type__: string;
        __typeHash__: number;
        q: {
          __type__: string;
          __typeHash__: number;
          x: number;
          y: number;
          z: number;
          w: number;
        };
        wp: {
          x: number;
          y: number;
          z: number;
        };
      };
      snoCampaignEnableCondition?: {
        __raw__: number;
        __group__: number;
        __type__: string;
        __typeHash__: number;
        __targetFileName__: string;
        groupName: string;
        name: string;
      };
      snoLevelArea?: {
        __raw__: number;
        __group__: number;
        __type__: string;
        __typeHash__: number;
        __targetFileName__?: string;
        groupName: string;
        name?: string;
      };
      snoFogOfWar?: {
        __raw__: number;
        __group__: number;
        __type__: string;
        __typeHash__: number;
        __targetFileName__: string;
        groupName: string;
        name: string;
      };
      arSubzones: Array<{
        __raw__: number;
        __group__: number;
        __type__: string;
        __typeHash__: number;
        __targetFileName__?: string;
        groupName: string;
        name?: string;
      }>;
      ptData: Array<{
        __type__: string;
        __typeHash__: number;
        dwType: number;
        dwPad: number;
        dwEntranceName?: number;
        dwPortalType?: number;
        eWorldToChoose?: number;
        snoSpecifiedWorld?: {
          __raw__: number;
          __group__: number;
          __type__: string;
          __typeHash__: number;
          __targetFileName__?: string;
          groupName: string;
          name?: string;
        };
        dwEntranceNameToFind?: number;
        snoPortalDestSubzone?: {
          __raw__: number;
          __group__: number;
          __type__: string;
          __typeHash__: number;
          __targetFileName__?: string;
          groupName: string;
          name?: string;
        };
        ePortalDestSubzoneType?: number;
        dwPortalDestSubzoneFlags?: number;
        dwWorldFeatureFlags?: number;
        eDungeonFlavorType?: number;
        snoPortalDestLevelArea?: {
          __raw__: number;
          __group__: number;
          __type__: string;
          __typeHash__: number;
          __targetFileName__?: string;
          groupName: string;
          name?: string;
        };
        snoPhasingVisibilityCondition?: {
          __raw__: number;
          __group__: number;
          __type__: string;
          __typeHash__: number;
          __targetFileName__: string;
          groupName: string;
          name: string;
        };
        snoGizmoCondition?: {
          __raw__: number;
          __group__: number;
          __type__: string;
          __typeHash__: number;
          __targetFileName__: string;
          groupName: string;
          name: string;
        };
        snoPortalDestObjectiveQuest?: {
          __raw__: number;
          __group__: number;
          __type__: string;
          __typeHash__: number;
          __targetFileName__: string;
          groupName: string;
          name: string;
        };
        snoPortalDestObjectiveDisplayItem: any;
        snoPortalDestObjectiveTrackedReward?: {
          __raw__: number;
          __group__: number;
          __type__: string;
          __typeHash__: number;
          __targetFileName__: string;
          groupName: string;
          name: string;
        };
        unk_9799a99?: boolean;
        hZoneLabel?: number;
        unk_92edf50?: {
          __raw__: number;
          __group__: number;
          __type__: string;
          __typeHash__: number;
          __targetFileName__: string;
          groupName: string;
          name: string;
        };
        arWaypointEffects?: Array<{
          __type__: string;
          __typeHash__: number;
          snoIntroEffect: any;
          snoLoopIntroEffect: any;
          snoLoopEffect: any;
          snoLoopOutroEffect: any;
          snoLoopSkipEffect: any;
          unk_7bc440d: number;
          flLoopMinDuration: number;
          unk_86403ef: boolean;
          unk_f0eaae5: boolean;
          unk_e0a3943: boolean;
          unk_9c071e3: boolean;
          unk_4bd94b4: boolean;
          unk_69b2ec7: boolean;
          unk_449111f: boolean;
          snoLoopingWorld: any;
          szCameraMarkerName: string;
          snoOutroEffect: any;
          snoSkippedOutroEffect: any;
          unk_bdd12d: boolean;
          unk_f8d8170: number;
          unk_188141b: number;
          unk_66ebec: number;
          unk_e660d97: number;
        }>;
        snoSubzone?: {
          __raw__: number;
          __group__: number;
          __type__: string;
          __typeHash__: number;
          __targetFileName__: string;
          groupName: string;
          name: string;
        };
        snoLevelArea?: {
          __raw__: number;
          __group__: number;
          __type__: string;
          __typeHash__: number;
          __targetFileName__: string;
          groupName: string;
          name: string;
        };
        gbidHiddenCache?: {
          __raw__: number;
          __type__: string;
          __typeHash__: number;
          group: number;
          name: string;
        };
        hMinimapIcon?: number;
        unk_a94748a?: number;
        unk_a0b181c?: number;
        snoVisibilityCondition?: {
          __raw__: number;
          __group__: number;
          __type__: string;
          __typeHash__: number;
          __targetFileName__: string;
          groupName: string;
          name: string;
        };
        fMinimapRespectsFoW?: boolean;
      }>;
    }>;
  }>;
};

export type MarkerSet = {
  __fileName__: string;
  __snoID__: number;
  __type__: string;
  __typeHash__: number;
  tMarkerSet: Array<{
    __type__: string;
    __typeHash__: number;
    dwHash: number;
    nID: number;
    eType: number;
    transform: {
      __type__: string;
      __typeHash__: number;
      q: {
        __type__: string;
        __typeHash__: number;
        x: number;
        y: number;
        z: number;
        w: number;
      };
      wp: {
        x: number;
        y: number;
        z: number;
      };
    };
    snoname: {
      __raw__: number;
      __group__: number;
      __type__: string;
      __typeHash__: number;
      __targetFileName__: string;
      groupName: string;
      name: string;
    } | null;
    dwMarkerFlags: number;
    dwMarkerFlagsEx: number;
    vecScale: {
      x: number;
      y: number;
      z: number;
    };
    ptBase: Array<{
      __type__: string;
      __typeHash__: number;
      dwType: number;
      dwPad: number;
      szLookName: number;
      dwShaderMapOverride: number;
      dwMarkerActorFlags: number;
      eFadeMethod: number;
      nFadeGroup: number;
      unk_d094b9a: number;
      unk_529dc44: number;
      eActorType: number;
      eGizmoType: number;
      unk_940ff8e: number;
      ptServerData: Array<{
        __type__: string;
        __typeHash__: number;
        arActorGroups: Array<any>;
        snoPhasingVisibilityCondition: any;
      }>;
      ptMonsterActorData: Array<any>;
      ptActorGizmoData: Array<{
        __type__: string;
        __typeHash__: number;
        ptDoorGizmoData: Array<any>;
        ptLockData: Array<any>;
        ptPOICameraInstanceData: Array<any>;
        ptTraversalInstanceData: Array<any>;
        ptChestGizmoData: Array<any>;
        ptSpawnerGizmoData: Array<any>;
        ptPortalGizmoData: Array<any>;
        ptPortalDestGizmoData: Array<any>;
        ptProxData: Array<any>;
        ptTriggerProximityGizmoData: Array<any>;
        ptMarkerBaseGizmoData: Array<{
          __type__: string;
          __typeHash__: number;
          fQuestRestricted: boolean;
          fGizmoStartsDisabled: boolean;
        }>;
        ptHiddenCacheGizmoData: Array<any>;
        ptRecipeEventGizmoData: Array<any>;
        ptGizmoConditionData: Array<{
          __type__: string;
          __typeHash__: number;
          snoGizmoCondition: any;
        }>;
      }>;
      ptNPCActorData: Array<any>;
      arBakedBoneTransforms: Array<any>;
      eCullingLevelOverride: number;
      ptRunTimeMaterialValues: Array<any>;
      arPrefabCustomizations: Array<any>;
      gbidSpawnLocType?: {
        __raw__: number;
        __type__: string;
        __typeHash__: number;
        group: number;
        name: string;
      };
    }>;
    ptGroupData: Array<any>;
    ptMarkerLinks: Array<any>;
    unk_c339f69: number;
    dwSeed: number;
    tPrefabData: {
      __type__: string;
      __typeHash__: number;
      dwFlags: number;
      unk_32bf9c6: number;
      eFadeMethod: number;
      nFadeGroup: number;
      unk_d094b9a: number;
      eCullingLevel: number;
      szLookOverride: number;
      dwShaderMapOverride: number;
      ptRunTimeMaterialValues: Array<any>;
    };
  }>;
  dwMarkerSetFlags: number;
  nLabel: any;
  snoCampaignEnableCondition: any;
  arPrefabDataInfo: Array<any>;
  ptPrefabDataMap: string;
  ptChunks: Array<any>;
  arVertexAOOffsets: Array<{
    __type__: string;
    __typeHash__: number;
    dwMarkerPathID: number;
    nAOOffset: number;
    nDamageState: number;
  }>;
  ptMergedMsgTriggeredEvents: Array<any>;
  unk_2bbd1d: {
    __type__: string;
    __typeHash__: number;
    nWidth: number;
    nHeight: number;
    nDepth: number;
    dwPitch: number;
    dwSlicePitch: number;
    flGridSize: number;
    wpOrigin: {
      x: number;
      y: number;
      z: number;
    };
    unk_4b236f4: string;
    unk_aa0958e: {
      __type__: string;
      __typeHash__: number;
      __flags__: number;
      __external__: boolean;
      value: {
        __typeHash__: number;
        __type__: string;
        dataOffset: number;
        dataSize: number;
      };
    };
    unk_aa09583: {
      __type__: string;
      __typeHash__: number;
      __flags__: number;
      __external__: boolean;
      value: {
        __typeHash__: number;
        __type__: string;
        dataOffset: number;
        dataSize: number;
      };
    };
    unk_aa0957e: {
      __type__: string;
      __typeHash__: number;
      __flags__: number;
      __external__: boolean;
      value: {
        __typeHash__: number;
        __type__: string;
        dataOffset: number;
        dataSize: number;
      };
    };
    unk_dd3cf4b: {
      __type__: string;
      __typeHash__: number;
      __flags__: number;
      __external__: boolean;
      value: {
        __typeHash__: number;
        __type__: string;
        dataOffset: number;
        dataSize: number;
      };
    };
    unk_dd3cf40: {
      __type__: string;
      __typeHash__: number;
      __flags__: number;
      __external__: boolean;
      value: {
        __typeHash__: number;
        __type__: string;
        dataOffset: number;
        dataSize: number;
      };
    };
    unk_dd3cf3b: {
      __type__: string;
      __typeHash__: number;
      __flags__: number;
      __external__: boolean;
      value: {
        __typeHash__: number;
        __type__: string;
        dataOffset: number;
        dataSize: number;
      };
    };
  };
  arVertexAO: {
    __type__: string;
    __typeHash__: number;
    __flags__: number;
    __external__: boolean;
    value: {
      __typeHash__: number;
      __type__: string;
      dataOffset: number;
      dataSize: number;
    };
  };
  unk_2f217b0: number;
  ptPrefabAOMap: string;
};

export type Quest = {
  __fileName__: string;
  __snoID__: number;
  __type__: string;
  __typeHash__: number;
  eQuestType: number;
  ePlayerQuestType: number;
  eEventQuestType: number;
  eInstanceQuestType: number;
  eRepeatType: number;
  eVignetteType: number;
  unk_43f3849: number;
  unk_48a2b16: number;
  tMarkerHandleStartLocation: {
    __type__: string;
    __typeHash__: number;
    snoMarkerSet: {
      __raw__: number;
      __group__: number;
      __type__: string;
      __typeHash__: number;
      __targetFileName__: string;
      groupName: string;
      name: string;
    };
    nID: number;
  };
  vecStartLocation: {
    x: number;
    y: number;
    z: number;
  };
  snoWorldStartLocation: {
    __raw__: number;
    __group__: number;
    __type__: string;
    __typeHash__: number;
    __targetFileName__: string;
    groupName: string;
    name: string;
  };
  tMarkerHandleDevStartLocation: {
    __type__: string;
    __typeHash__: number;
    snoMarkerSet: any;
    nID: number;
  };
  vecDevStartLocation: {
    x: number;
    y: number;
    z: number;
  };
  snoWorldDevStartLocation: any;
  unk_d2181f0: number;
  snoLevelArea: any;
  unk_f956a05: boolean;
  unk_14dee1b: boolean;
  flParticipationRadius: number;
  unk_8881b0e: number;
  dwNextUID: number;
  fPrioritySideQuest: boolean;
  ePrioritySideQuestType: number;
  ePersistentEventType: number;
  unk_e6be43: Array<any>;
  unk_79f6e17: number;
  gbidSubzoneModifierTag: any;
  snoBountySubzone: {
    __raw__: number;
    __group__: number;
    __type__: string;
    __typeHash__: number;
    __targetFileName__: string;
    groupName: string;
    name: string;
  };
  eBountyTier: number;
  eBountyType: number;
  gbidBountyDefinition: {
    __raw__: number;
    __type__: string;
    __typeHash__: number;
    group: number;
    name: string;
  };
  unk_313dbf6: boolean;
  dwRegionSourceCallbackUID: number;
  eSimQuestPhase: number;
  unk_942bcdb: number;
  dwFlags: number;
  arQuestPhases: Array<{
    __type__: string;
    __typeHash__: number;
    dwType: number;
    dwPad: number;
    dwUID: number;
    dwFlags: number;
    eType: number;
    arCallbackSets: Array<{
      __type__: string;
      __typeHash__: number;
      dwUID: number;
      ptLink: Array<{
        __type__: string;
        __typeHash__: number;
        dwDestinationPhaseUID: number;
        eLinkType: number;
      }>;
      arCallbacks: Array<{
        __type__: string;
        __typeHash__: number;
        eProgressDisplayStyle: number;
        eProgressBarSource: number;
        dwUID: number;
        dwFlags: number;
        nNeeded: number;
        tScriptMessageMap: {
          __type__: string;
          __typeHash__: number;
          eEventType: number;
          dwListenerFlags: number;
          snoCondition: any;
          unk_c3ba01d: boolean;
          flCooldownSeconds: number;
          arEventFilters: Array<{
            __type__: string;
            __typeHash__: number;
            tKey: number;
            eVariableType: number;
            pMessageFilter: Array<{
              __type__: string;
              __typeHash__: number;
              dwType: number;
              eParamType: number;
              dwPad: number;
              idValue?: number;
              tMarkerHandle?: {
                __type__: string;
                __typeHash__: number;
                snoMarkerSet: {
                  __raw__: number;
                  __group__: number;
                  __type__: string;
                  __typeHash__: number;
                  __targetFileName__: string;
                  groupName: string;
                  name: string;
                };
                nID: number;
              };
              dwStringHash?: number;
              szString?: string;
              snoQuest?: {
                __raw__: number;
                __group__: number;
                __type__: string;
                __typeHash__: number;
                __targetFileName__: string;
                groupName: string;
                name: string;
              };
            }>;
          }>;
          unk_492729e: Array<any>;
          dwEventEntryHash: number;
        };
        dwLinesSeconds: number;
        unk_47705e2: number;
        eIndicatorType: number;
        unk_9c1ea4f: number;
        snoWorld?: {
          __raw__: number;
          __group__: number;
          __type__: string;
          __typeHash__: number;
          __targetFileName__: string;
          groupName: string;
          name: string;
        };
        snoObjectiveDiscoveredConversationOverride: any;
        fDebugDisable: boolean;
        tRegionDefault: {
          __type__: string;
          __typeHash__: number;
          eType: number;
          vPolygonPoints: Array<{
            x: number;
            y: number;
          }>;
          vCenterPos: {
            x: number;
            y: number;
          };
          flRadius: number;
          bValid: boolean;
          bManuallySpecified: boolean;
        };
        arRegionOverrides: Array<any>;
        nValidRegionOverrides: number;
        arLevelAreas: Array<{
          __raw__: number;
          __group__: number;
          __type__: string;
          __typeHash__: number;
          __targetFileName__: string;
          groupName: string;
          name: string;
        }>;
        arSubzones: Array<any>;
        unk_c181024: any;
        vecPositionOffset: {
          x: number;
          y: number;
        };
        unk_7245523: string;
        arSnonameTokens: Array<any>;
        tReputationObjective: {
          __type__: string;
          __typeHash__: number;
          snoReputation: any;
          nValue: number;
        };
      }>;
      bGiveFirstTimeReward: boolean;
      snoFirstTimeRewardDisplayItem: any;
      tFirstTimeReward: {
        __type__: string;
        __typeHash__: number;
        snoTreasureClass: any;
        nXPTier: number;
        nGoldTier: number;
        unk_3592260: number;
        snoTrackedReward: any;
        bOverrideRewardDropLevel: boolean;
        tRewardDropLevelOverride: {
          __type__: string;
          __typeHash__: number;
          unk_cea351b: number;
        };
        arFakeItemRewards: Array<any>;
      };
      tReward: {
        __type__: string;
        __typeHash__: number;
        snoTreasureClass: any;
        nXPTier: number;
        nGoldTier: number;
        unk_3592260: number;
        snoTrackedReward: any;
        bOverrideRewardDropLevel: boolean;
        tRewardDropLevelOverride: {
          __type__: string;
          __typeHash__: number;
          unk_cea351b: number;
        };
        arFakeItemRewards: Array<any>;
      };
      tKeyedDungeonReward: {
        __type__: string;
        __typeHash__: number;
        snoTreasureClass: any;
        nXPTier: number;
        nGoldTier: number;
        unk_3592260: number;
        snoTrackedReward: any;
        bOverrideRewardDropLevel: boolean;
        tRewardDropLevelOverride: {
          __type__: string;
          __typeHash__: number;
          unk_cea351b: number;
        };
        arFakeItemRewards: Array<any>;
      };
      unk_8c63f3c: boolean;
      snoObjectiveDiscoveredConversation: any;
      arQuestItemsToRemove: Array<any>;
    }>;
    unk_4b2de13: number;
    unk_188a07a: Array<any>;
    unk_61c2846: boolean;
    unk_951ad2a: any;
    snoReward?: {
      __raw__: number;
      __group__: number;
      __type__: string;
      __typeHash__: number;
      groupName: string;
    };
    unk_189b89b: boolean;
    nTimerDuration: number;
    unk_2bde7b6: boolean;
    arQuestChangedDestLevel: Array<any>;
    unk_8280b0e: number;
    unk_eff642d: boolean;
    unk_fc27941: boolean;
    unk_d9a8a05: number;
    unk_5d4cfc0: number;
    unk_669bcf8: number;
    unk_287ecb5: number;
    unk_6344bd7: number;
    unk_fab6e45: {
      __type__: string;
      __typeHash__: number;
      snoMarkerSet: any;
      nID: number;
    };
    unk_47f8481: {
      x: number;
      y: number;
      z: number;
    };
    unk_ed8215b: any;
    unk_f6ded77: {
      __type__: string;
      __typeHash__: number;
      hImageHandle: number;
    };
    unk_f84da79: {
      __type__: string;
      __typeHash__: number;
      hImageHandle: number;
    };
    snoAudioContext: any;
  }>;
  arRequiredReputations: Array<any>;
  arReputationRewards: Array<any>;
  arRequiredCompletedQuests: Array<any>;
  snoStartCondition: any;
  arFollowers: Array<any>;
  arQuestItems: Array<any>;
  arQuestDungeons: Array<any>;
  unk_2aa5f20: Array<any>;
  unk_b43b442: Array<any>;
  gbidSurveyType: any;
  gbidNightmareDungeonSurveyType: any;
  unk_9ac873: boolean;
  unk_668eec8: boolean;
  tRequirementsToBeActive: {
    __type__: string;
    __typeHash__: number;
    arSeasons: Array<any>;
  };
  snoAudioContext: any;
  arAllReferencedItems: Array<any>;
  hLimitedTimeEventIcon: {
    __type__: string;
    __typeHash__: number;
    hImageHandle: number;
  };
};

export type TrackedReward = {
  __fileName__: string;
  __snoID__: number;
  __type__: string;
  __typeHash__: number;
  eSource: number;
  eType: number;
  eStatType: number;
  flAmount: number;
  snoAspect: {
    __raw__: number;
    __group__: number;
    __type__: string;
    __typeHash__: number;
    __targetFileName__: string;
    groupName: string;
    name: string;
  } | null;
  tRequirementsToBeActive: {
    __type__: string;
    __typeHash__: number;
    arSeasons: Array<any>;
  };
};

export type HiddenCaches = {
  __fileName__: string;
  __snoID__: number;
  __type__: string;
  __typeHash__: number;
  eGameBalanceType: number;
  bIgnoreOnLoad: boolean;
  ptData: Array<{
    __type__: string;
    __typeHash__: number;
    dwType: number;
    dwPad: number;
    tEntries: Array<{
      __type__: string;
      __typeHash__: number;
      tHeader: {
        __type__: string;
        __typeHash__: number;
        szName: string;
        gbid: any;
        szNameGBIDHash: number;
      };
      snoTrackedReward: {
        __raw__: number;
        __group__: number;
        __type__: string;
        __typeHash__: number;
        __targetFileName__: string;
        groupName: string;
        name: string;
      };
    }>;
  }>;
  ptPostprocessed: string;
};

export type Bounties = {
  __fileName__: string;
  __snoID__: number;
  __type__: string;
  __typeHash__: number;
  dwNextID: number;
  ptContent: Array<{
    __type__: string;
    __typeHash__: number;
    dwType: number;
    dwPad: number;
    arBountyZones: Array<{
      __type__: string;
      __typeHash__: number;
      eZone: number;
      snoCondition?: {
        __raw__: number;
        __group__: number;
        __type__: string;
        __typeHash__: number;
        __targetFileName__: string;
        groupName: string;
        name: string;
      };
      arBounties: Array<any>;
    }>;
    arBountyGroups: Array<{
      __type__: string;
      __typeHash__: number;
      snoCondition: {
        __raw__: number;
        __group__: number;
        __type__: string;
        __typeHash__: number;
        __targetFileName__: string;
        groupName: string;
        name: string;
      };
      arBounties: Array<{
        __type__: string;
        __typeHash__: number;
        snoQuest: {
          __raw__: number;
          __group__: number;
          __type__: string;
          __typeHash__: number;
          __targetFileName__: string;
          groupName: string;
          name: string;
        };
        snoWorldState: {
          __raw__: number;
          __group__: number;
          __type__: string;
          __typeHash__: number;
          __targetFileName__: string;
          groupName: string;
          name: string;
        };
        nValue: number;
        eBountyType: number;
        snoBountySubzone: {
          __raw__: number;
          __group__: number;
          __type__: string;
          __typeHash__: number;
          __targetFileName__: string;
          groupName: string;
          name: string;
        };
        gbidBountyDefinition: {
          __raw__: number;
          __type__: string;
          __typeHash__: number;
          group: number;
          name: string;
        };
      }>;
    }>;
    unk_65250c9: number;
  }>;
};
