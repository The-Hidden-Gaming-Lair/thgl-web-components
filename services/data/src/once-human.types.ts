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

export type BigMapItemData = Record<
  string,
  {
    fog_flag: number;
    can_gray: number;
    recommend_title_info: Array<any>;
    search_type_word: string;
    search_priority: number;
    search_desc_info: Array<any>;
    layer_id: number;
    recommend_desc_info: Array<any>;
    keep_screen: number;
    search_title_info: Array<any>;
    is_custom_mark_icon: number;
    tag_number: number;
    scale: number;
    search_show_type: number;
    res_path: string;
    tip_id_list: Array<number>;
    search_words: Array<string>;
    recommend_show_type: number;
    item_name: string;
    search_rule: number;
  }
>;

export type SmallMapItemData = Record<
  string,
  {
    show_radius: number;
    zorder: number;
    scale: number;
    edge_flag: number;
    res_path: string;
  }
>;

export type PrefabGroupInfoData = Record<
  string,
  {
    task_award: number;
    prefab_group_level: number;
    prefab_group_bigmap_icon_id: number;
    area_id: number;
    bgm_tag: string;
    prefab_group_show_name: string;
    mark_detail_icon_path: string;
    prefab_group_pos: Array<number>;
    prefab_item_lst: Array<number>;
    task_name: string;
    task_info_list: Array<any>;
    workshop_id: string;
  }
>;

export type TreasureMonsterDropData = Record<
  string,
  {
    tip_id_lst: Array<number>;
    pos3: Array<number>;
    tip_radius_lst: Array<number>;
    euler_y: number;
    monster_no: string;
  }
>;

export type BaseNPCData = Record<
  string,
  {
    aoi_radius2: number;
    drop_show_id: string;
    revive_gap: number;
    unit_name: string;
    dun_trigger_radius: number;
    use_alias: boolean;
    unit_group_def_no: string;
    openworld_control_flag: boolean;
    unit_title: string;
    is_public_npc: number;
    model_path: string;
    area_lable: string;
    npc_word: string;
    combat_prototype_no: string;
    unit_upper_type_name: string;
    unit_alias: string;
    Type: string;
    dun_trigger_group: any;
    need_dynamics_level: boolean;
    trigger_radius: number;
    ai_evo_template_id: string;
    dun_trigger_tag: string;
    anim_graph_path: string;
    combat_unit_no: string;
    model_scale: Array<number>;
    custom_init_id: number;
    drop_gift_id: string;
    func_entry: Array<any>;
    head_bar_rule_list: Array<number>;
    cam_no: any;
    npc_mesh_no: string;
    space_no: number;
    is_follower: boolean;
    special_drop_gift_id: string;
    special_drop_show_id: string;
    aoi_radius: number;
    unit_camp_template_no: string;
    init_mtl_type: string;
    unit_type: string;
    unit_entity_type: string;
    unit_hold_item: string;
    npc_is_always_exist: boolean;
    unit_id: string;
    default_dialogs: Array<any>;
    ai_file: string;
    unit_prototype: number;
  }
>;

export type BattleFieldData = {
  flags: {};
  flag_occupy_rule: {};
  __ep_serialize_field__: {
    meta: {};
    data: Array<any>;
  };
  transport_npc_list: Array<any>;
  public_event_basic_config: {};
  transport_road_data: Array<any>;
  score_rule: {};
  reborn_points: Record<
    string,
    {
      rebirth_center: Array<number>;
      is_rebirth_point: boolean;
      nid: string;
      rebirth_cooling_time: number;
      rebirth_length_width: Array<number>;
      radius: number;
      node_type: string;
      rebirth_alarm_type: string;
      camp_no: number;
      Type: string;
      rebirth_radius: number;
      pos4: Array<number>;
      is_init_birth_point: boolean;
    }
  >;
  ai_path_group_info: {};
  public_event_center: {};
  unit_data: Record<
    string,
    {
      is_stronghold_npc: boolean;
      init_mtl_type: string;
      combat_prototype_no: string;
      is_public_npc: number;
      can_trigger_range_listener: boolean;
      unit_title: string;
      ai_file: string;
      npc_rotatable: boolean;
      Type: string;
      model_scale: Array<number>;
      node_type: string;
      sense_height: number;
      euler: Array<number>;
      join_calculate_dungeon_center: boolean;
      unit_entity_type: string;
      need_perceptron: boolean;
      device_type: number;
      combat_unit_no: string;
      init_invisible: boolean;
      name: string;
      shoot_range_target_id: number;
      pos3: Array<number>;
      ai_blackboard_vars: Array<{
        param_key: string;
        param_type: string;
        str_value: number;
        bool_value: number;
        float_value: number;
        enum_value: number;
        int_value: number;
      }>;
      special_drop_show_id: string;
      is_default_perceived_params: boolean;
      s_animal_path: string;
      hide_npc_word: boolean;
      aoi_radius2: number;
      aoi_radius: number;
      is_transport_npc: boolean;
      show_interactable: boolean;
      create_by_start_port: boolean;
      disable_hear_params: boolean;
      hide_damage_tips: boolean;
      animation_path: string;
      head_bar_rule_list: Array<number>;
      drop_gift_id: string;
      forced_move_resistance: number;
      heraldry_path: string;
      init_buff_list: Array<any>;
      battle_same_time: boolean;
      current_rate: number;
      avoid_be_hit: number;
      can_stealth: boolean;
      is_disable_exit_combat_dis: boolean;
      is_shield_drop_exp: boolean;
      is_show_heraldry_path: boolean;
      is_stealth: boolean;
      model_path: string;
      prefab_id: string;
      record_combat_info: boolean;
      disable_col_and_hit_box: boolean;
      sense_height_offset: Array<number>;
      disable_capsule: boolean;
      sense_range: number;
      is_show_scene_3dui: boolean;
      npc_mesh_no: string;
      stealth_type: number;
      unit_camp_template_no: string;
      anim_graph_path: string;
      unit_hold_item: string;
      play_anim_times: number;
      is_show_be_hit: boolean;
      unit_hold_item2: string;
      unit_id: string;
      condition_drops: Array<any>;
      unit_name: string;
      nid: string;
      can_mod_pos_y: boolean;
      npc_show_name_bar_range: number;
      ui_key: number;
      unit_label: string;
      max_summon: number;
      unit_type: string;
      monster_group_id: string;
      drop_show_id: string;
      unit_upper_type_name: string;
      special_anim_no: Array<any>;
      normal_anim_no: string;
      show_client_hp_bar: boolean;
      use_alias: boolean;
      will_use_perf_budget: boolean;
      unit_alias: string;
      special_drop_gift_id: string;
      changed_attrs: Array<string>;
      npc_interactable: boolean;
      s_idle_animal_path: string;
      disable_sight_params: boolean;
      high_light_range: number;
      data_source: string;
      custom_init_id: number;
      hide_title_ui: boolean;
      interactable_text: string;
    }
  >;
  stage_create_node: Array<string>;
  nodes: Record<
    string,
    | {
        node_type: string;
        Type: "TriggerStartEvent";
      }
    | {
        is_stronghold_npc: boolean;
        init_mtl_type: string;
        combat_prototype_no: string;
        is_public_npc: number;
        can_trigger_range_listener: boolean;
        unit_title: string;
        ai_file: string;
        npc_rotatable: boolean;
        Type: "NpcNode";
        model_scale: Array<number>;
        node_type: string;
        sense_height: number;
        euler: Array<number>;
        join_calculate_dungeon_center: boolean;
        unit_entity_type: string;
        need_perceptron: boolean;
        device_type: number;
        combat_unit_no: string;
        init_invisible: boolean;
        name: string;
        shoot_range_target_id: number;
        pos3: Array<number>;
        ai_blackboard_vars: Array<{
          param_key: string;
          param_type: string;
          str_value: number;
          bool_value: number;
          float_value: number;
          enum_value: number;
          int_value: number;
        }>;
        special_drop_show_id: string;
        is_default_perceived_params: boolean;
        s_animal_path: string;
        hide_npc_word: boolean;
        aoi_radius2: number;
        aoi_radius: number;
        is_transport_npc: boolean;
        show_interactable: boolean;
        create_by_start_port: boolean;
        disable_hear_params: boolean;
        hide_damage_tips: boolean;
        animation_path: string;
        head_bar_rule_list: Array<number>;
        drop_gift_id: string;
        forced_move_resistance: number;
        heraldry_path: string;
        init_buff_list: Array<any>;
        battle_same_time: boolean;
        current_rate: number;
        avoid_be_hit: number;
        can_stealth: boolean;
        is_disable_exit_combat_dis: boolean;
        is_shield_drop_exp: boolean;
        is_show_heraldry_path: boolean;
        is_stealth: boolean;
        model_path: string;
        prefab_id: string;
        record_combat_info: boolean;
        disable_col_and_hit_box: boolean;
        sense_height_offset: Array<number>;
        disable_capsule: boolean;
        sense_range: number;
        is_show_scene_3dui: boolean;
        npc_mesh_no: string;
        stealth_type: number;
        unit_camp_template_no: string;
        anim_graph_path: string;
        unit_hold_item: string;
        play_anim_times: number;
        is_show_be_hit: boolean;
        unit_hold_item2: string;
        unit_id: string;
        condition_drops: Array<any>;
        unit_name?: string;
        nid: string;
        can_mod_pos_y: boolean;
        npc_show_name_bar_range: number;
        ui_key: number;
        unit_label: string;
        max_summon: number;
        unit_type: string;
        monster_group_id: string;
        drop_show_id: string;
        unit_upper_type_name: string;
        special_anim_no: Array<any>;
        normal_anim_no: string;
        show_client_hp_bar: boolean;
        use_alias: boolean;
        will_use_perf_budget: boolean;
        unit_alias: string;
        special_drop_gift_id: string;
        changed_attrs: Array<string>;
        npc_interactable: boolean;
        s_idle_animal_path: string;
        disable_sight_params: boolean;
        high_light_range: number;
        data_source: string;
        custom_init_id: number;
        hide_title_ui: boolean;
        interactable_text: string;
      }
    | {
        block_mesh_path: string;
        euler: Array<number>;
        length_width: Array<number>;
        shape: number;
        clear_navmesh: boolean;
        block_mask_type: number;
        Type: "BlockNode";
        sfx_euler: number;
        height: number;
        sfx_scale: Array<number>;
        pos3: string;
        block_hinder_attack: boolean;
        radius: number;
        nid: string;
        sfx_path: string;
        use_refraction: boolean;
        node_type: string;
      }
    | {
        node_type: string;
        Type: "TriggerStageCreate";
      }
    | {
        Type: "TriggerBigWorldReturnPoint";
        nid: string;
        pos4: Array<number>;
        node_type: string;
      }
    | {
        Type: "TriggerEndEvent";
        nid: string;
        leave_countdown: number;
        node_type: string;
      }
  >;
  prefab: {};
  prefab_pos_node: {};
  dungeon_drop_item: {};
  add_buff_on_enter: {};
  variable_change_dict: {};
  basic_config: {
    public_event_destroy_delay_time: number;
    can_revive_when_die: boolean;
    public_event_duration: number;
    scense_file: string;
    dun_member: number;
    is_display_death_ui: boolean;
    auto_adjust_unit_property: boolean;
    dun_type: string;
    Type: string;
    restart_on_lose_connect: boolean;
    medium_stronghold_no: number;
    hide_btn_exit: boolean;
    item_revive_num: number;
    exit_dungeon_radius: number;
    exit_dungeon_radius_countdown: number;
    changed_model_scale: number;
    modify_npc_strength: number;
    dun_no: number;
    is_consume_item_revive: boolean;
    is_persist_dungeon: boolean;
    modify_npc_level: number;
    is_reset_dun_in_wipe: boolean;
    dun_subtype: number;
    node_type: string;
    no_fail_on_die: boolean;
    is_migrate_leave: boolean;
    public_event_radius: number;
    no_leave_effect: boolean;
    use_prefab: boolean;
  };
  birth_points: {};
  space_description_data: {
    zones: {
      "1": {
        fixed_bound: boolean;
        right_bottom: Array<number>;
        left_top: Array<number>;
      };
    };
    min_zone_radius: number;
    left_top: Array<number>;
    space_life_type: string;
    right_bottom: Array<number>;
    zone_tree: number;
  };
  transport_target_points: Array<any>;
  links: {
    "s1002,OutputStageCreate": Array<Array<string>>;
    "s1003,OutputDeath": Array<Array<string>>;
  };
  add_buff_on_normal_leave: {};
};
