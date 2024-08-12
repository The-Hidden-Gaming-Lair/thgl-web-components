// https://app.quicktype.io/?l=ts

export type Map = {
  __attr: {
    catalog_archetypes: {
      __fref: string;
    };
    details: {
      __fref: string;
    };
    preplaced_named_objects: {
      __fref: string;
    };
    terrain: {
      __fref: string;
    };
  };
  catalog_archetypes: string;
  catalogs: Array<string>;
  details: string;
  gameplay_level_name: string;
  level_script_location: string;
  managed_archetypes_path: string;
  preplaced_named_objects: string;
  terrain: string;
};

export type Details = {
  dimensions: Array<number>;
  description: string;
  map_name: string;
  map_tags: Array<string>;
  game_mode: string;
  tile_set_id: string;
  visibility: string;
  water_table_id: string;
  data_format_version: number;
};

export type Terrain = {
  terrainLevel: number;
  terrain_nodes: Array<number>;
  height_nodes: Array<number>;
  material_weights: Array<number>;
  edge_nodes: Array<any>;
  pathing_water_unpathables: Array<any>;
  pathing_unbuildables: Array<any>;
  water_data: Array<number>;
};

export type PreplacedNamedObjects = Record<
  string,
  {
    data?: {
      seed: number;
    };
    facing: number;
    kind: string;
    player: number;
    position: Array<number>;
  }
>;

export type Archetype =
  | {
      __base_type: "Stat";
      based_on: string;
      id: string;
    }
  | {
      __base_type: "Function";
      based_on: string;
      editor_config: {
        icon: string;
        node: string;
      };
      grammar_text: string;
      hint_text: string;
      id: string;
      name: string;
      options: {
        is_async: boolean;
        is_deprecated: boolean;
        is_expression_only: boolean;
        is_hidden: boolean;
        is_implemented: boolean;
        is_inline: boolean;
        is_native: boolean;
      };
      parameters: Array<{
        allow_multiple: boolean;
        allowed_presets: Array<any>;
        default_values: Array<any>;
        hint_text: string;
        id: string;
        inline_separator: string;
        is_callable: boolean;
        is_this: boolean;
        name: string;
        type: {
          directive: string;
          implements: string;
          inner_type: string;
          param_id: string;
          sub_directive: string;
          tags: Array<any>;
          type: string;
        };
      }>;
      path: string;
      return_type: {
        directive: string;
        implements: string;
        inner_type: string;
        param_id: string;
        sub_directive: string;
        tags: Array<any>;
        type: string;
      };
      script: string;
      script_id: string;
      sub_functions: Array<any>;
      type: string;
    }
  | {
      __base_type: "MorphAbilityData";
      based_on: string;
      command_visualizer: string;
      commands: Array<{
        cooldown: {
          duration: number;
          name: string;
          scope: string;
        };
        requirement: string;
        unit: string;
      }>;
      flags: {
        approach: boolean;
        best_unit: boolean;
        builds: boolean;
        cancelable: boolean;
        disable_abilities: boolean;
        perform_height_transition: boolean;
        placement: boolean;
        unload_cargo: boolean;
        upgrade: boolean;
      };
      height_transition_duration: number;
      height_transition_initial_delay: number;
      id: string;
      morph_duration: number;
      morph_finish_effect: string;
      morph_finish_fx: string;
      morph_start_fx: string;
      placement_range: number;
      progress_description: string;
      target_actor: string;
      timings: {
        abilities: number;
        vitals: number;
      };
      unreal_component: string;
      vital_energy_field: number;
      vital_energy_update: string;
      vital_health_field: number;
      vital_health_update: string;
      vital_shield_field: number;
      vital_shield_update: string;
    }
  | {
      UseUITint: boolean;
      __base_type: "Button";
      based_on: string;
      icon: string;
      id: string;
      name: string;
      tooltip: string;
    }
  | {
      __base_type: "Preset";
      based_on: string;
      extends: string;
      id: string;
      name: string;
      type: {
        directive: string;
        implements: string;
        inner_type: string;
        param_id: string;
        sub_directive: string;
        tags: Array<any>;
        type: string;
      };
      values: Array<{
        id: string;
        is_default: boolean;
        name: string;
        script: string;
      }>;
    }
  | {
      __base_type: "Requirement";
      based_on: string;
      can_show: {
        root: {
          left: {
            name: string;
            node: string;
            parameters: Array<{
              argument: {
                name?: string;
                node: string;
                parameters?: Array<any>;
                type: string;
                value?: string;
              };
              name: string;
              type: string;
            }>;
            type: string;
          };
          node: string;
          operator: string;
          right: {
            node: string;
            type: string;
            value: number;
          };
          type: string;
        };
        type: string;
      };
      can_use: Array<{
        check: {
          root: {
            left: {
              name: string;
              node: string;
              parameters: Array<{
                argument: {
                  name?: string;
                  node: string;
                  parameters?: Array<any>;
                  type: string;
                  value?: string;
                };
                name: string;
                type: string;
              }>;
              type: string;
            };
            node: string;
            operator: string;
            right: {
              node: string;
              type: string;
              value: number;
            };
            type: string;
          };
          type: string;
        };
        reason: string;
        reason_announcement: string;
      }>;
      id: string;
    }
  | {
      __base_type: "Validator";
      based_on: string;
      check: {
        root: {
          name: string;
          node: string;
          parameters: Array<{
            argument: {
              name?: string;
              node: string;
              parameters?: Array<any>;
              type: string;
              value?: Array<string>;
            };
            name: string;
            type: string;
          }>;
          type: string;
        };
        type: string;
      };
      id: string;
    }
  | {
      __base_type: "SoundEmitter";
      affected_by_time_of_day: boolean;
      attenuation_model: string;
      attenuation_shape: string;
      attenuation_shape_box: {
        extent_x: number;
        extent_y: number;
        extent_z: number;
      };
      attenuation_shape_capsule: {
        half_height: number;
        radius: number;
      };
      attenuation_shape_sphere: {
        inner_radius: number;
      };
      based_on: string;
      falloff_distance: number;
      id: string;
      name: string;
      pitch_multiplier: number;
      placed_name: string;
      play_on_start: boolean;
      sound: string;
      unreal_actor: string;
      volume_multiplier: number;
    }
  | {
      __base_type: "TerrainLayer";
      based_on: string;
      display_name: string;
      id: string;
      layer_name: string;
      minimap_color: string;
      painted_doodads: Array<any>;
      texture_base: string;
      texture_height: string;
      texture_normal: string;
      texture_orm: string;
      value_blend_type: number;
      value_metalness_multi: number;
      value_metalness_offset: number;
      value_normal_power: number;
      value_roughness_multi: number;
      value_roughness_offset: number;
      value_tiling: number;
    }
  | {
      __base_type: "UpgradeData";
      based_on: string;
      button: string;
      flags: {
        shared_with_team: boolean;
      };
      id: string;
      name: string;
      player_modifiers: Array<any>;
      player_responses: Array<any>;
      research_time: number;
      resource_cost: {
        resource_a: number;
        resource_b: number;
        resource_c: number;
        resource_d: number;
      };
      set_values: Array<any>;
      unit_modifiers: Array<any>;
    }
  | {
      __base_type: "UnitData";
      abilityList: Array<any>;
      additional_black_mask_vision_radius: number;
      alias_tech: Array<any>;
      armor: number;
      armor_icon: string;
      armor_name: string;
      attack_target_priority: number;
      based_on: string;
      behaviors: Array<any>;
      buffs: Array<any>;
      build_cost: {
        resource_a: number;
        resource_b: number;
        resource_c: number;
        resource_d: number;
      };
      build_time: number;
      cargo_size: string;
      cascade_field_radius: number;
      commandList: Array<{
        ability: string;
        button: string;
        commandIndex: number;
        panel: string;
        repeatable: boolean;
        row: number;
        slot: number;
        submenu: number;
        targetSubmenu: number;
      }>;
      construction_set_sfx: string;
      damage_response: string;
      default_acquire_level: string;
      default_control_groups: Array<any>;
      effects: {
        birth: string;
        constructed: string;
        creation: string;
        death: string;
        revenge: string;
      };
      enabled_unit_tech: Array<any>;
      expiration_time: number;
      faction: string;
      fidget: {
        delay_maximum: number;
        delay_minimum: number;
        turning_angle: number;
        turning_duration: number;
        weights: {
          animate: number;
          idle: number;
          turn: number;
        };
      };
      flags: {
        detector: boolean;
        display_ui_description: boolean;
        has_prime_structure: boolean;
        hologram: boolean;
        overlap_resource_a: boolean;
        requires_cascade_field: boolean;
        requires_cascade_field_to_morph: boolean;
        seek_and_destroy: boolean;
        stealth: boolean;
        uncommandable: boolean;
      };
      fog_visibility: string;
      footprint: {
        angled: boolean;
        clumpable: boolean;
        snap: boolean;
        unbuildable: boolean;
        vision_block_height: number;
        x: number;
        y: number;
      };
      global_energy: string;
      global_resource_overrides: Array<any>;
      height: number;
      id: string;
      inner_radius: number;
      minimap_icon: string;
      minimap_icon_size: number;
      minimap_icon_use_heading: boolean;
      minimap_icon_use_team_color: boolean;
      movement: {
        acceleration_time: number;
        collision: {
          air: boolean;
          burrowed: boolean;
          ground: boolean;
          ground_tall: boolean;
          item: boolean;
          worker: boolean;
        };
        deceleration_time: number;
        idle_pushable: boolean;
        lock_facing: boolean;
        moving_turn_period: number;
        pathing_mode: string;
        push_priority: number;
        push_priority_same_team: number;
        speed: number;
        stationary_turn_period: number;
        turn_radius: number;
        turn_without_slowing: boolean;
      };
      name: string;
      num_corpses: number;
      outer_radius: number;
      placed_name: string;
      power_consumed: number;
      power_produced: number;
      responses: Array<any>;
      sb_id: string;
      selection_alias: string;
      shroud_radius: number;
      starting_snowtags: Array<string>;
      subgroup_priority: number;
      supply_add: number;
      supply_cost: number;
      traits: Array<any>;
      turret_list: Array<any>;
      ui_flags: {
        callout_attacks_air: boolean;
        callout_attacks_ground: boolean;
      };
      ui_kind: string;
      unit_button: string;
      unit_info_portrait: string;
      unreal_actor: string;
      unreal_corpse_actor: string;
      veterancy_given_on_death: number;
      veterancy_starting_tier: number;
      veterancy_tiers: Array<any>;
      veterancy_vxp_weight: number;
      vision_height: number;
      vision_radius: number;
      vital_energy: {
        maximum: number;
        regen: number;
        starting: number;
      };
      vital_health: {
        maximum: number;
        regen: number;
        starting: number;
      };
      vital_out_shroud_deduction_energy_flat: number;
      vital_out_shroud_deduction_energy_multiplier: number;
      vital_out_shroud_deduction_health_flat: number;
      vital_out_shroud_deduction_health_multiplier: number;
      vital_out_shroud_deduction_shield_flat: number;
      vital_out_shroud_deduction_shield_multiplier: number;
      vital_shield: {
        maximum: number;
        regen: number;
        starting: number;
      };
      vital_shroud_bonus_energy_flat: number;
      vital_shroud_bonus_energy_multiplier: number;
      vital_shroud_bonus_health_flat: number;
      vital_shroud_bonus_health_multiplier: number;
      vital_shroud_bonus_shield_flat: number;
      vital_shroud_bonus_shield_multiplier: number;
      vitals_force_hide: boolean;
      weaponList: Array<string>;
    }
  | {
      __base_type: "Buff";
      alignment: string;
      applied_tags: Array<string>;
      based_on: string;
      buff_tags: Array<string>;
      buff_visuals: string;
      display_area_effect: string;
      duration: number;
      effect_expire: string;
      effect_final: string;
      effect_initial: string;
      effect_periodic: string;
      effect_refresh: string;
      flags: {
        change_owner_on_polymorph: boolean;
        disable_on_attacking: boolean;
        disable_on_damage_taken: boolean;
        hidden: boolean;
        hide_timer: boolean;
        override_source: boolean;
        pause_while_disabled: boolean;
        remove_on_attacking: boolean;
        remove_on_damage_taken: boolean;
        show_progress: boolean;
      };
      height: {
        adjust_height: boolean;
        duration: number;
        duration_reversed: number;
        target_height: number;
      };
      icon: string;
      id: string;
      modifiers: Array<{
        amount: number;
        stat_mod: string;
      }>;
      name: string;
      periodic_duration: number;
      polymorph_actors: Array<any>;
      power_consumed: number;
      priority: number;
      radar: {
        radius: number;
        target_filter: {
          alliance: {
            ally: boolean;
            enemy: boolean;
            neutral: boolean;
            player: boolean;
            self: boolean;
          };
          tags: {
            excluded: Array<any>;
            required: Array<any>;
          };
        };
        validator: string;
      };
      removed_tags: Array<any>;
      responses: Array<any>;
      stacks: {
        aggregation: string;
        buff_scope_effect_parent: string;
        decay: number;
        initial: number;
        maximum: number;
      };
      state_flags: {
        armor_base_suppressed: boolean;
        armor_negative_mod_suppressed: boolean;
        armor_positive_mod_suppressed: boolean;
        collision_suppressed: boolean;
        detector: boolean;
        grounded: boolean;
        lifted: boolean;
        stealth: boolean;
        stealth_suppressed: boolean;
      };
      tooltip: string;
      validator_disable: string;
      validator_remove: string;
    }
  | {
      __base_type: "GameEffectApplyPlayerBuff";
      based_on: string;
      editor_icon: string;
      effect_target: {
        effect_parent: string;
        target: string;
      };
      id: string;
      impact_fx: string;
      player_buff: string;
      stacks: number;
      tracker: string;
      validator: string;
    }
  | {
      __base_type: "GameEffectDamage";
      amount: number;
      amount_expression: {};
      based_on: string;
      damage_tags: Array<string>;
      death_type: string;
      editor_icon: string;
      effect_target: {
        effect_parent: string;
        target: string;
      };
      flags: {
        alert: boolean;
        damage_response: boolean;
      };
      friendly_fire_percentage: number;
      id: string;
      impact_fx: string;
      tag_bonuses: Array<any>;
      target_armor_multiplier: number;
      tracker: string;
      validator: string;
      vitals_leech: {
        energy: {
          max: number;
          min: number;
          percent: number;
        };
        health: {
          max: number;
          min: number;
          percent: number;
        };
      };
    }
  | {
      __base_type: "GameEffectSet";
      based_on: string;
      editor_icon: string;
      effect_location: {
        effect_parent: string;
        entity_or_point: string;
        target: string;
      };
      effects: Array<string>;
      flags: {
        target_becomes_instigator: boolean;
      };
      id: string;
      impact_fx: string;
      repetition_limit: number;
      tracker: string;
      validator: string;
    }
  | {
      __base_type: "TraitData";
      based_on: string;
      button: string;
      id: string;
      requirement: string;
    }
  | {
      __base_type: "GameEffectSwitch";
      based_on: string;
      cases: Array<any>;
      default_action: string;
      editor_icon: string;
      effect_location: {
        effect_parent: string;
        entity_or_point: string;
        target: string;
      };
      id: string;
      impact_fx: string;
      tracker: string;
      validator: string;
    }
  | {
      __base_type: "GameEffectCopySelection";
      based_on: string;
      copy_from: {
        effect_parent: string;
        target: string;
      };
      copy_to: {
        effect_parent: string;
        target: string;
      };
      editor_icon: string;
      flags: {
        control_groups: boolean;
        current_selection: boolean;
      };
      id: string;
      impact_fx: string;
      tracker: string;
      validator: string;
    }
  | {
      __base_type: "Unlockable";
      based_on: string;
      description: string;
      id: string;
      image: string;
      subtitle: string;
      tags: Array<any>;
      title: string;
    }
  | {
      __base_type: "GameEffectMorph";
      based_on: string;
      editor_icon: string;
      effect_target: {
        effect_parent: string;
        target: string;
      };
      flags: {
        clear_order_queue: boolean;
      };
      id: string;
      impact_fx: string;
      morph_type: string;
      tracker: string;
      validator: string;
    }
  | {
      __base_type: "GameEffectDamage";
      amount: number;
      amount_expression: {};
      based_on: string;
      damage_tags: Array<string>;
      death_type: string;
      editor_icon: string;
      effect_target: {
        effect_parent: string;
        target: string;
      };
      flags: {
        alert: boolean;
        damage_response: boolean;
      };
      friendly_fire_percentage: number;
      id: string;
      impact_fx: string;
      tag_bonuses: Array<any>;
      target_armor_multiplier: number;
      tracker: string;
      validator: string;
      vitals_leech: {
        energy: {
          max: number;
          min: number;
          percent: number;
        };
        health: {
          max: number;
          min: number;
          percent: number;
        };
      };
    }
  | {
      __base_type: "ResponseDamage";
      based_on: string;
      clamp: number;
      clamped_fraction: number;
      damage_shield_settings: {
        display_as_shields: boolean;
        remove_holding_buff_when_exhausted: boolean;
        shields_max: number;
        shields_max_expression: {
          root: {
            left: {
              node: string;
              type: string;
              value: number;
            };
            node: string;
            operator: string;
            right: {
              left: {
                name: string;
                node: string;
                parameters: Array<{
                  argument: {
                    node: string;
                    type: string;
                    value: string;
                  };
                  name: string;
                  type: string;
                }>;
                type: string;
              };
              node: string;
              operator: string;
              right: {
                name: string;
                node: string;
                parameters: Array<{
                  argument: {
                    name: string;
                    node: string;
                    parameters: Array<{
                      argument: {
                        node: string;
                        type: string;
                        value: string;
                      };
                      name: string;
                      type: string;
                    }>;
                    type: string;
                  };
                  name: string;
                  type: string;
                }>;
                type: string;
              };
              type: string;
            };
            type: string;
          };
          type: string;
        };
      };
      fatal: boolean;
      handle_zero_damage: boolean;
      id: string;
      modify_amount: number;
      modify_fraction: number;
      shared: {
        chance: number;
        charges: number;
        cooldown: {
          duration: number;
          name: string;
          scope: string;
        };
        location: string;
        priority: number;
        required_effect: string;
        response_effect: string;
        response_fx: string;
        target_filter: {
          alliance: {
            ally: boolean;
            enemy: boolean;
            neutral: boolean;
            player: boolean;
            self: boolean;
          };
          tags: {
            excluded: Array<any>;
            required: Array<any>;
          };
        };
        validator: string;
      };
    }
  | {
      __base_type: "SnowTag";
      based_on: string;
      display: string;
      display_name: string;
      flags: {
        display_as_attribute: boolean;
        display_as_callout: boolean;
      };
      id: string;
    }
  | {
      __base_type: "LocationMarkerData";
      based_on: string;
      id: string;
      radius: number;
      sb_id: string;
      tag: string;
      unreal_actor: string;
    }
  | {
      __base_type: "CapturePoint";
      based_on: string;
      capture_additional_units_max: number;
      capture_additional_units_rate: number;
      capture_filter: {
        excluded: Array<string>;
        required: Array<string>;
      };
      capture_range: number;
      flags: {
        capture_from_higher: boolean;
        capture_from_lower: boolean;
        lock_after_capture: boolean;
      };
      fog_visibility: string;
      icon: string;
      id: string;
      placed_name: string;
      reward: string;
      time_to_capture: number;
      time_to_recapture: number;
      time_to_regress: number;
      time_to_uncapture: number;
      unreal_actor: string;
    }
  | {
      __base_type: "CreepCamp";
      based_on: string;
      camp_type: string;
      capture_point: string;
      creep_level_buffs: Array<string>;
      creep_level_starting: number;
      creeps: Array<string>;
      flags: {
        dynamic_creeps: boolean;
      };
      fog_visibility: string;
      id: string;
      leash_patience: number;
      leash_radius: number;
      leash_radius_slop: number;
      placed_name: string;
      respawn_time: number;
      reward_captureless: string;
      spawn_time: number;
      unreal_actor: string;
    }
  | {
      __base_type: "WeaponData";
      ammo: string;
      arc: number;
      arc_slop: number;
      backswing: number;
      backswing_locked: number;
      based_on: string;
      can_use: string;
      display_effect_damage: string;
      flags: {
        can_attack_location: boolean;
        channeled: boolean;
        fires_passively: boolean;
        hide_weapon: boolean;
        melee: boolean;
        scan_for_new_targets: boolean;
      };
      icon: string;
      id: string;
      name: string;
      period: number;
      preswing_initial: number;
      preswing_repeating: number;
      preswing_winddown: number;
      random_delay_maximum: number;
      random_delay_minimum: number;
      range_acquire: number;
      range_maximum: number;
      range_minimum: number;
      range_slop: number;
      swing: number;
      turret: string;
      unreal_component: string;
      weapon_acquire_filter: {
        alliance: {
          ally: boolean;
          enemy: boolean;
          neutral: boolean;
          player: boolean;
          self: boolean;
        };
        tags: {
          excluded: Array<string>;
          required: Array<any>;
        };
      };
      weapon_fire: string;
      weapon_target_filter: {
        alliance: {
          ally: boolean;
          enemy: boolean;
          neutral: boolean;
          player: boolean;
          self: boolean;
        };
        tags: {
          excluded: Array<string>;
          required: Array<string>;
        };
      };
    }
  | {
      __base_type: "GameEffectDamageRadius";
      amount: number;
      areas: Array<{
        damage_fraction: number;
        radius: number;
      }>;
      based_on: string;
      black_white_list: {
        exclude: Array<any>;
        include: Array<{
          effect_parent: string;
          target: string;
        }>;
      };
      damage_impact_fx: string;
      damage_tags: Array<any>;
      death_type: string;
      editor_icon: string;
      flags: {
        alert: boolean;
        damage_response: boolean;
      };
      friendly_fire_percentage: number;
      id: string;
      location_impact_fx: string;
      search_filter: {
        alliance: {
          ally: boolean;
          enemy: boolean;
          neutral: boolean;
          player: boolean;
          self: boolean;
        };
        tags: {
          excluded: Array<string>;
          required: Array<string>;
        };
      };
      search_location: {
        effect_parent: string;
        entity_or_point: string;
        target: string;
      };
      tag_bonuses: Array<any>;
      target_armor_multiplier: number;
      tracker: string;
      validator: string;
      vitals_leech: {
        energy: {
          max: number;
          min: number;
          percent: number;
        };
        health: {
          max: number;
          min: number;
          percent: number;
        };
      };
    };

export type RuntimeSession = {
  archetypes: Record<string, [number, Archetype]>;
  assetReferences: Record<string, string>;
  assetsToPreload: {};
  localizedStringReferences: Record<string, Array<string>>;
  snowplayBindings: {
    keys: Record<
      string,
      {
        KeyName: string;
        UiMapping: string;
        ValueHash: number;
        ValueType: string;
      }
    >;
  };
  mappings: {
    buff: {
      Data: {
        type: {
          alignment: string;
          duration: string;
          hidden: string;
          hide_timer: string;
          icon: string;
          name: string;
          showProgress: string;
          tooltip: string;
        };
      };
      UiKind: string;
    };
    capture_point: {
      Data: {
        type: {
          capture_range: string;
          fog_visibility: string;
          icon: string;
        };
      };
      UiKind: string;
    };
    creep_camp: {
      Data: {
        type: {
          color_b: string;
          color_g: string;
          color_r: string;
          fog_visibility: string;
          icon: string;
          minimap_icon: string;
          minimap_icon_size: string;
          name: string;
        };
      };
      UiKind: string;
    };
    destructible: {
      Data: {
        display: {
          description: string;
          displayName: string;
          icon: string;
          minimap_icon: string;
          minimap_icon_size: string;
          minimap_icon_use_heading: string;
          minimap_icon_use_team_color: string;
          vitals_force_hide: string;
        };
        type: {
          fog_visibility: string;
        };
      };
      UiKind: string;
    };
    item: {
      Data: {
        abilities: {
          command: string;
          unitCost: string;
          unitCostSupply: string;
        };
        command: {
          ability: string;
          buildCalloutDisplayAsAttribute: string;
          buildCalloutDisplayAsCallout: string;
          buildCalloutDisplayName: string;
          buildCallouts: string;
          buildCastDuration: string;
          buildCastDurationOverride: string;
          buildCostResources: string;
          buildCostResourcesIgnore: string;
          buildCostResourcesOverride: string;
          buildCostSpawnCount: string;
          buildCostSupply: string;
          buildCostVitals: string;
          buildEnables: string;
          button: string;
          callout_canAttack: string;
          canAutocast: string;
          cancelable: string;
          cargoCapacity: string;
          cargoMaxUnits: string;
          chargeDuration: string;
          chargeName: string;
          commandIndex: string;
          cooldown: string;
          cooldownName: string;
          cooldownScope: string;
          description: string;
          icon: string;
          morphDuration: string;
          morphProgressDescription: string;
          name: string;
          panel: string;
          productionSlots: string;
          repeatable: string;
          requirementCanUse: string;
          researchCostResources: string;
          researchDuration: string;
          row: string;
          slot: string;
          stagedCastDuration: string;
          stagedCostResources: string;
          stagedCostVitals: string;
          submenu: string;
          targetSubmenu: string;
          ui_flags: string;
          useUITint: string;
          weaponList: string;
        };
        type: {
          description: string;
          icon: string;
          maxStacks: string;
          name: string;
          tooltip: string;
        };
      };
      UiKind: string;
    };
    projectile: {
      Data: {
        display: {
          minimap_icon: string;
          minimap_icon_size: string;
          minimap_icon_use_heading: string;
          minimap_icon_use_team_color: string;
        };
      };
      UiKind: string;
    };
    resource: {
      Data: {
        type: {
          description: string;
          fog_visibility: string;
          max_harvesters: string;
          max_resources: string;
          minimap_icon: string;
          minimap_icon_size: string;
          name: string;
          resource_type: string;
          use_harvester_faction_bonus: string;
        };
      };
      UiKind: string;
    };
    snowtags: {
      Data: {
        type: {
          displayAsAttribute: string;
          displayAsCallout: string;
          displayName: string;
        };
      };
      UiKind: string;
    };
    trait: {
      Data: {
        type: {
          icon: string;
          name: string;
          requirementReasons: string;
          tooltip: string;
        };
      };
      UiKind: string;
    };
    unit: {
      Data: {
        abilities: {
          commands: string;
          unitCost: string;
          unitCostSupply: string;
        };
        armor: {
          amount: string;
          icon: string;
          name: string;
          speed: string;
        };
        callouts: {
          displayAsAttribute: string;
          displayName: string;
        };
        command: {
          ability: string;
          buildCalloutDisplayAsAttribute: string;
          buildCalloutDisplayAsCallout: string;
          buildCalloutDisplayName: string;
          buildCallouts: string;
          buildCastDuration: string;
          buildCastDurationOverride: string;
          buildCostResources: string;
          buildCostResourcesIgnore: string;
          buildCostResourcesOverride: string;
          buildCostSpawnCount: string;
          buildCostSupply: string;
          buildCostVitals: string;
          buildEnables: string;
          button: string;
          callout_canAttack: string;
          canAutocast: string;
          cancelable: string;
          cargoCapacity: string;
          cargoMaxUnits: string;
          chargeDuration: string;
          chargeName: string;
          commandIndex: string;
          cooldown: string;
          cooldownName: string;
          cooldownScope: string;
          costPower: string;
          description: string;
          icon: string;
          magazineMaxCapacity: string;
          morphDuration: string;
          morphProgressDescription: string;
          name: string;
          panel: string;
          productionSlots: string;
          redirectToTopbar: string;
          repeatable: string;
          requirementCanUse: string;
          researchCostResources: string;
          researchDuration: string;
          row: string;
          slot: string;
          stagedCastDuration: string;
          stagedCostResources: string;
          stagedCostVitals: string;
          submenu: string;
          targetSubmenu: string;
          ui_flags: string;
          useUITint: string;
          weaponList: string;
        };
        display: {
          description: string;
          displayName: string;
          icon: string;
          minimap_icon: string;
          minimap_icon_size: string;
          minimap_icon_use_heading: string;
          minimap_icon_use_team_color: string;
          vitals_force_hide: string;
        };
        energy_bar: {
          max: string;
          min: string;
        };
        faction: {
          build: string;
          buildAdvanced: string;
          characterImage: string;
          description: string;
          descriptionTitle: string;
          harvesterBonusCount: string;
          icon: string;
          name: string;
          research: string;
          researchAdvanced: string;
          storeItem: string;
          train: string;
          trainAdvanced: string;
        };
        health_bar: {
          max: string;
        };
        power: {
          power_consumed: string;
          power_produced: string;
        };
        shield_bar: {
          max: string;
        };
        timer: {
          duration: string;
        };
        timer1: {
          duration: string;
        };
        traits: {
          icon: string;
          name: string;
          tooltip: string;
        };
        type: {
          display_ui_description: string;
          fog_visibility: string;
          uncommandable: string;
        };
        veterancy: {
          statModAmount: string;
          statModDescription: string;
          threshold: string;
        };
        weapons: {
          damage: string;
          hide_weapon: string;
          icon: string;
          name: string;
          range: string;
          speed: string;
          targets: string;
        };
      };
      UiKind: string;
    };
  };
};

export type Archetypes = {
  Enum: Record<
    string,
    {
      values: Array<{
        display_name: string;
        name: string;
        value: number;
      }>;
    }
  >;
};
