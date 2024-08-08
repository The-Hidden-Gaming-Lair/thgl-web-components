export type PrefabInfoData = Record<
  string,
  {
    mark_detail_icon_path: string;
    prefab_name: string;
    editable_bounding_info: string;
    stronghold_size: string;
    prefab_group_index: string;
    bigmap_icon_id: number;
    layer_level: string;
    mask_level: number;
    need_show_in_bigmap: boolean;
    area_id: number;
    pos: Array<number>;
    rot: Array<number>;
    rot_yzx: Array<number>;
    stronghold_souvenir_tag: Array<any>;
    safe_area_id: number;
    dungeon_id: Array<any>;
    public_event: string;
    scale: Array<number>;
    bigmap_background_img: string;
    note: string;
    special_world_type: number;
    stronghold_entrance_type: string;
    stronghold_item_lst: Array<number>;
    stronghold_level: number;
    accurate_map_id: number;
    stronghold_type: string;
    bigmap_sub_icon_type_id: number;
    stronghold_name: string;
    background_summary: string;
    stronghold_area: number;
    level_offset: number;
    can_build: string;
    unbuildable_area_info: Array<any>;
    stronghold_people_recommend_type: number;
  }
>;

export type ScenePrefabData = Record<
  string,
  {
    collide_aabb: [Array<number>, Array<number>, number];
    bounding_info: [Array<number>, Array<number>, number];
    greyscale_value: number;
    prefab_path: string;
    position: Array<number>;
    prefab_name: string;
    quaternion: Array<number>;
    new_collide_aabb: [Array<number>, Array<number>, number];
    map_icon_pos: Array<number>;
    rotate: Array<number>;
    scale: Array<number>;
    name: string;
    rotate_yzx: Array<number>;
    prefab_index: string;
    tier_level: number;
    uuid: string;
  }
>;
