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

export type AchieveCollectData = Record<
  string,
  {
    icon: string;
    attrs: Array<string>;
  }
>;

export type TriggerData = {
  place_nodes: Record<string, Record<string, any>>;
  links: Record<string, any>;
};

export type InteractResData = Record<
  string,
  {
    enable_culled: boolean;
    res_name: string;
    drop_type: number;
    dungeon_show_type: number;
    far_behavior_dis: number;
    high_light_range: number;
    near_behavior_dis: number;
    res_subtype: number;
    behavior_time: number;
    interact_cd: number;
    res_icon: string;
    sense_height: number;
    vehicle_destroy_level: number;
    sense_range: number;
    res_type: number;
    sense_horizontial_offset: number;
    behavior_type: number;
    space_rule_effect_lst: Array<number>;
    sense_height_offset: Array<number>;
    res_detect_type: number;
  }
>;

export type BigWorldCollectableNotesData = Record<
  string,
  {
    title3: string;
    text_type: number;
    is_theater: boolean;
    sort_priority: number;
    map_img_path: string;
    content_lst: Array<string>;
    corr_series_id: string;
    sub_type_name: string;
    picture_path: string;
    second_title_lst: Array<string>;
    sidebar_show_duration: number;
    title: string;
    title2: string;
    sub_text_type: number;
    carrier_model_type: string;
    trigger_id: number;
    title1: string;
    audio_path: string;
    video_path: string;
  }
>;

export type BookCollectSeriesData = Record<
  string,
  {
    frag_num: number;
    corr_super_no: string;
    award_id: number;
    text_type: number;
    trigger_id: number;
    series_name: string;
  }
>;

export type CollectNewTagData = Record<
  string,
  {
    refresh_rules25: Array<any>;
    model_path21: string;
    refresh_rules26: Array<any>;
    model_path28: string;
    refresh_rules27: Array<any>;
    model_path7: string;
    refresh_rules28: Array<any>;
    refresh_rules10: Array<any>;
    refresh_rules15: Array<any>;
    refresh_rules30: Array<any>;
    drops26: Array<any>;
    drops6: Array<any>;
    drops11: Array<any>;
    drops8: Array<any>;
    drops9: Array<any>;
    drops1: Array<number>;
    refresh_rules4: Array<any>;
    refresh_rules9: Array<any>;
    season_stages: Array<any>;
    weights: Array<number>;
    refresh_rules18: Array<any>;
    refresh_rules19: Array<any>;
    drops16: Array<any>;
    drops4: Array<any>;
    model_path13: string;
    model_path27: string;
    drops10: Array<any>;
    drops25: Array<any>;
    model_path20: string;
    model_path25: string;
    model_path9: string;
    refresh_rules13: Array<any>;
    refresh_rules17: Array<any>;
    refresh_rules23: Array<any>;
    model_path16: string;
    refresh_rules29: Array<any>;
    drops12: Array<any>;
    influence_detour: number;
    refresh_rules6: Array<any>;
    runtime_refresh_rule: number;
    model_path2: string;
    model_path11: string;
    refresh_rules24: Array<any>;
    refresh_rules7: Array<any>;
    model_path17: string;
    model_path22: string;
    refresh_rules5: Array<any>;
    weight30: number;
    model_path19: string;
    drops20: Array<any>;
    drops22: Array<any>;
    drops21: Array<any>;
    model_path4: string;
    refresh_rules3: Array<any>;
    model_path15: string;
    drops2: Array<any>;
    model_path5: string;
    refresh_rules22: Array<any>;
    rule: string;
    refresh_rules8: Array<any>;
    model_path3: string;
    drops30: Array<any>;
    refresh_rules11: Array<any>;
    drops18: Array<any>;
    drops7: Array<any>;
    drops14: Array<any>;
    drops27: Array<any>;
    caption: string;
    drops24: Array<any>;
    drops28: Array<any>;
    drops19: Array<any>;
    ids: Array<number>;
    model_path26: string;
    model_path23: string;
    refresh_rules12: Array<any>;
    model_path1: string;
    refresh_rules14: Array<any>;
    refresh_rules16: Array<any>;
    refresh_rules20: Array<any>;
    drops5: Array<any>;
    model_path29: string;
    model_path12: string;
    drops15: Array<any>;
    drops13: Array<any>;
    drops29: Array<any>;
    model_path24: string;
    model_path10: string;
    model_path18: string;
    model_path6: string;
    drops17: Array<any>;
    model_path8: string;
    drops3: Array<any>;
    drops23: Array<any>;
    refresh_rules1: Array<number>;
    model_path14: string;
    model_path30: string;
    refresh_rules2: Array<any>;
    refresh_rules21: Array<any>;
  }
>;

export type GiftDropNormalDataClient = Record<
  string,
  {
    hive_item_nums: Array<any>;
    is_public_deviation: boolean;
    extra_rule_ids: Array<number>;
    need_bind: number;
    item_no_lst: Array<number>;
    hive_item_nos: Array<any>;
    num_lst: Array<number>;
    tot_weight: number;
    gameplay_type: number;
    batch_float: number;
    weight_lst: Array<number>;
    hive_item_weights: Array<any>;
  }
>;

export type ItemData = Record<
  string,
  {
    weight: number;
    type: number;
    can_destroy: number;
    forge_icon_female: string;
    name: string;
    nev_transfer_limit_point: number;
    has_sel_state: number;
    item_belonge_tab: number;
    can_repair: number;
    can_use: number;
    durability_cost_type: number;
    is_bind: number;
    can_drop: number;
    item_type_name: string;
    item_belonge_page: number;
    can_break: number;
    item_filter_desc_type: number;
    sub_type: number;
    item_detail_type: number;
    show_toast: number;
    durability: number;
    quality: number;
    stack_num: number;
    forge_icon: string;
    item_deliver_type: number;
    icon_female: string;
    icon: string;
  }
>;

export type DeviationBaseData = Record<
  string,
  {
    deviation_degree_coe: {
      "5": number;
      "1": number;
      "2": number;
      "3": number;
      "4": number;
    };
    frostbite_point: number;
    mood_recover_base: number;
    containment_recover_base: number;
    base_temperature: number;
    heatstroke_point: number;
    balance_degree_coe: {
      "5": number;
      "1": number;
      "2": number;
      "3": number;
      "4": number;
    };
    power: number;
    unit_type: number;
    skill_icon_lst: Array<string>;
    share_big_icon: string;
    skill_name_lst: Array<string>;
    max_containment: number;
    mood_state_coe: {
      "3": number;
      "1": number;
      "2": number;
    };
    mood_base: number;
    mood_state_val_dict: {
      "3": number;
      "1": number;
      "2": number;
    };
    max_mood: number;
    pal_icon: string;
    quality_dict: {
      "3": number;
      "1": number;
      "2": number;
    };
    skill_info_lst: Array<string>;
    unit_id: string;
    squeezed_coe: Array<number>;
    min_work_containment: number;
    containment_recover_coe_by_power: number;
    deviation_type: number;
    name: string;
    containment_base: number;
  }
>;

export type BookCollectModelData = Record<
  string,
  {
    title2: string;
    unlock2: number;
    brand_type: number;
    text_type: number;
    display_name: string;
    content2: string;
    content1: string;
    mobile_rotation: Array<number>;
    mobile_pos3: Array<number>;
    title1: string;
    title: string;
    mobile_scale: Array<number>;
    hand_hold_item_no: number;
    pos3: Array<number>;
    title3: string;
    content3: string;
    rotation: Array<number>;
    scale: Array<number>;
    anim_path: string;
    name: string;
    head_img_path: string;
    sort_priority: number;
    unit_ids: Array<string>;
    unlock3: number;
    model_path?: string;
  }
>;
