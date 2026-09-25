// Auto-generated i18n types for Node.js - DO NOT EDIT MANUALLY
// Generated at: 2026-09-12T10:59:07.205Z

export interface I18nResources {
  assets: {
    title: string;
    description: string;
    deprecated_tip: string; // 参数: {oldName, version, newName}
    global_readonly_tip: string; // 参数: {name}
    debug_mode: string;
    asset_d_b_pause_tips: string; // 参数: {operate}
    asset_d_b_init_error: string;
    save_asset: {
      fail: {
        unknown: string;
        uuid: string;
        asset: string; // 参数: {asset}
        content: string;
        readonly: string;
      };
    };
    save_asset_meta: {
      fail: {
        unknown: string;
        uuid: string;
        content: string;
        readonly: string;
      };
    };
    rename_asset: {
      fail: {
        source: string;
        include: string;
        parent: string;
      };
      warn: {
        overwrite: string;
      };
    };
    init: {
      no_asset_db_list: string;
    };
    operation: {
      invalid_url: string;
      exists_url: string;
      readonly: string;
      overwrite: string;
    };
    delete_asset: {
      fail: {
        unknown: string;
        url: string;
        unexist: string;
        readonly: string;
      };
    };
    create_asset: {
      title: string;
      fail: {
        unknown: string; // 参数: {target}
        type: string; // 参数: {type}
        url: string; // 参数: {url}
        exist: string;
        drop: string; // 参数: {target}
        to_url: string; // 参数: {target}
        uuid: string; // 参数: {target}
      };
    };
    import_asset: {
      meta_exists: string; // 参数: {name}
    };
    open_asset: {
      preference_program_warning: string; // 参数: {preferences, program, scriptEditor}
      fail: {
        no_asset: string;
      };
    };
    copy_asset: {
      fail: {
        unknown: string;
        url: string;
      };
    };
    restore_asset_d_b_from_cache_in_valid: {
      upgrade: string;
      no_library_path: string;
    };
    preferences: {
      log_level: string;
      log_level_debug: string;
      log_level_log: string;
      log_level_warn: string;
      log_level_error: string;
      ignore_glob: string;
      ignore_changed: string;
    };
  };
  builder: {
    title: string;
    description: string;
    create_user_template: string;
    build_config: string;
    build: string;
    compile: string;
    open_log_file: string;
    generate_engine: string;
    require: string;
    new_build_task: string;
    empty_task_holder: string;
    empty_scene: string;
    empty_platforms: string;
    reveal_in_explorer: string;
    view_build_config: string;
    recompile: string;
    confirm: string;
    use_splash_screen: string;
    bundle_common_chunk: string;
    bundle_common_chunk_tips: string;
    bundleCommonChunk: string;
    bundleCommonChunkTips: string;
    off: string;
    options: {
      platform: string;
      name: string;
      polyfills: string;
      polyfills_tips: string;
      async_functions: string;
      async_functions_tips: string;
      core_js: string;
      core_js_tips: string;
      buildScriptTargets: string;
      buildScriptTargetsTips: string;
      remote_server_address: string;
      remote_server_address_tips: string;
      sourceMap: string;
      sourceMapTips: string;
      sourceMapsInline: string;
      standaloneSourceMaps: string;
      experimental_erase_modules: string;
      experimental_erase_modules_tips: string;
      includeBundles: string;
      build_path: string;
      debug: string;
      debugTips: string;
      mangleProperties: string;
      manglePropertiesTip: string;
      inlineEnum: string;
      inlineEnumTip: string;
      md5_cache: string;
      md5CacheTips: string;
      main_bundle_is_remote: string;
      main_bundle_compression_type: string;
      pack_autoAtlas: string;
      start_scene: string;
      startSceneTips: string;
      start_scene_asset_bundle: string;
      start_scene_asset_bundle_tips: string;
      scenes: string;
      skip_compress_texture: string;
      bin_group_config: string;
      enable_cconb_group: string;
      enable_cconb_group_tips: string;
    };
    tips: {
      enter_name: string;
      task_name: string;
      build_path: string;
      build_scenes: string;
      set_start_scene: string;
      atlas_in_resources: string; // 参数: {info, root}
      use_texture_in_atlas: string; // 参数: {info, useInfo}
      use_image_in_atlas: string; // 参数: {info, useInfo}
      task_exist: string; // 参数: {taskName}
      task_busy: string;
      platform_missing: string; // 参数: {platform}
      conflict_platform: string; // 参数: {pkgName}
      waiting_for_remove_task: string;
      waiting_for_db_ready: string;
      waiting_for_plugin_ready: string;
      waiting_for_worker_ready: string;
      waiting_for_data_ready: string;
      scene_in_bundle: string;
      create_application_template_success: string;
      create_application_template_overwrite: string;
      application_ejs_version: string;
      set_splash_setting: string;
      build_task_canceled: string;
      pause_asset_import: string;
      disable_platform: string; // 参数: {platform}
      disable_platform_for_build_command: string; // 参数: {platform}
      disable_register_platform_info: string; // 参数: {platform}
      platform_information_invalid: string; // 参数: {platform}
      create_template_success: string;
      template_version_warning: string; // 参数: {platform, version, internalConfig}
      build_package_missing: string; // 参数: {dest}
    };
    error: {
      build_error: string;
      build_dir_not_exists: string; // 参数: {buildDir}
      build_path_contains_space: string;
      build_path_contains_chinese_and_symbol: string;
      can_not_empty: string;
      project_name_not_legal: string;
      package_name_not_legal: string;
      package_name_start_with_number: string;
      select_scenes_to_build: string;
      path_too_long_title: string;
      path_too_long_desc: string; // 参数: {max_length}
      keep_raw_texture_of_atlas: string; // 参数: {texturePath, pacPath, assetPath}
      run_hooks_failed: string; // 参数: {pkgName, funcName}
      cache_compress_texture_missing: string; // 参数: {format, path}
      deserialize_failed: string; // 参数: {url}
      missing_import_files: string; // 参数: {path, url}
      required_asset_missing: string; // 参数: {fatherUrl, uuid}
      missing_asset: string; // 参数: {uuid}
      check_options_failed: string;
      unknown_platform: string;
      asset_import_failed: string; // 参数: {asset({url, type}
      get_asset_json_failed: string; // 参数: {asset({url}
      builder_crash: string;
      texture_compress_failed: string; // 参数: {asset, type, toolsPath, toolHomePage}
      missing_splash_tips: string; // 参数: {splashScreen}
      invalid_start_scene: string;
      missing_scenes: string; // 参数: {url}
      bundle_configs: string;
      platform_register_error: string; // 参数: {platform}
      check_failed: string; // 参数: {key, value, error}
      engine_modules_config_key_missing: string;
    };
    warn: {
      no_defined_in_i18n: string; // 参数: {name}
      no_serialized_json: string; // 参数: {url, type}
      same_load_url: string; // 参数: {urlA, urlB, url}
      atlas_in_resources: string; // 参数: {url, root}
      path_not_exist: string;
      http: string;
      required: string;
      no_chinese: string;
      check_failed_with_new_value: string; // 参数: {key, value, error, newValue}
      compress_rgb_a: string; // 参数: {uuid}
      asset_bundle_is_remote_invalid: string; // 参数: {directoryName}
      require_mipmaps: string; // 参数: {effectUUID, textureUUID}
      invalid_custom_splash: string;
      invalid_remove_splash: string;
      exception_remove_splash: string;
      deprecated_tip: string; // 参数: {oldName, newName}
      resources_remote_lock_waring: string;
      repeat_atlas_in_bundle: string; // 参数: {asset({Atlas, bundle1, bundle2}
      engine_modules_fall_back_tip: string; // 参数: {fallbackMsg, platform}
      invalid_option_in_separate_engine: string;
      separate_engine_with_custom_engine: string;
      invalid_version_in_separate_engine: string;
    };
    tasks: {
      build_asset: string;
      build_engine: string;
      build_img: string;
      build_json: string;
      build_atlas: string;
      build_script: string;
      build_project_script: string;
      build_suffix: string;
      build_template: string;
      build_zip_bundle: string;
      load_script: string;
      sort_asset: string;
      build_import_map: string;
      sort_import_map: string;
      sort_asset_bundle: string;
      sort_image: string;
      sort_script: string;
      sort_sprite_frame: string;
      sort_texture: string;
      sort_json: string;
      settings: {
        cache: string;
        options: string;
        design_resolution: string;
        group: string;
        md5: string;
        scene: string;
        script: string;
        init: string;
        macro: string;
      };
      postprocess: {
        compress: string;
        save_config: string;
        save_settings: string;
      };
    };
    asset_bundle: {
      is_bundle: string;
      bundle_name: string;
      priority: string;
      priority_tooltip: string;
      compression_type: string;
      compression_type_tooltip: string;
      target_platform: string;
      target_platform_tooltip: string;
      is_remote_bundle: string;
      remote_bundle_invalid_tooltip: string;
      none: string;
      none_tooltip: string;
      subpackage: string;
      subpackage_tooltip: string;
      merge_dep: string;
      merge_dep_tooltip: string;
      merge_all_json: string;
      merge_all_json_tooltip: string;
      zip: string;
      zip_tooltip: string;
      duplicate_name_message: string; // 参数: {name, url}
      duplicate_name_messaged_auto_rename: string; // 参数: {newUrl, name, url, newName}
      duplicate_reserved_keyword_message: string; // 参数: {name}
      nest_bundle: string; // 参数: {url}
      filter_config: {
        title: string;
        add: string;
        preview: string;
        add_asset: string;
        include: string;
        exclude: string;
        asset: string;
        url: string;
        glob: string;
        glob_tips: string;
        begin_with: string;
        end_with: string;
        contain: string;
        empty_config: string;
        preview_list: string;
        preview_tips: string;
        empty_preview_list: string;
      };
      empty_bundle: string;
      bundle_build_tips: string;
      bundle_build_platform_tips: string; // 参数: {bundleUrl}
      build_bundle: string;
      publish_config: string;
      build_bundle_i_n_process: string;
      bundle_build_close_tip: string;
      build_bundle_busy: string;
      build_bundle_params: string;
      bundle_config: string;
      export_bundle_build_config: string;
      preferred_options: string;
      preferred_options_tips: string;
      fallback_options: string;
      fallback_options_tips: string;
      platform_override: string;
      platform_override_empty_tip: string;
      default_config: string;
      native: string;
      web: string;
      minigame: string;
      import_config: string;
      export_config: string;
      preview_setting: string;
      platform: string;
      platform_config: string;
      edit_config: string;
      add_config: string;
      delete_config: string;
      is_remote_fallback_tips: string;
      reset: string;
      reset_uni: string;
      separate_config: string;
      all_mini_games: string;
      uni_config: string;
      true: string;
      false: string;
      overwrite: string;
      merge: string;
    };
    project: {
      texture_compress: {
        title: string;
        compress_preset: string;
        custom_format: string;
        same_config_name: string;
        add_config: string;
        edit_config_name: string;
        export_config: string;
        import_config: string;
        import_config_options: string;
        merge: string;
        preset_name: string;
        add_format: string;
        compress_format: string;
        mipmap: {
          no_power_of_two: string;
        };
        tips: {
          require_object: string;
          require_name: string;
          xx_require_object: string; // 参数: {name}
          platform_err: string; // 参数: {platform, supportPlatforms}
          texture_type_err: string; // 参数: {format, supportFormats}
          options_quality_type_err: string; // 参数: {userQualityType, qualityType, qualityTypeOptions}
          number_quality_type_err: string; // 参数: {userQualityType, min, max}
          import_failed: string;
          user_preset_err: string;
          enter_config_name_to_add: string;
          input_config_name_to_search: string;
        };
      };
      splash_setting: {
        title: string;
        confirm: string;
        settings: {
          total_time: string;
          display_ratio: string;
          auto_fit: string;
          watermark_location: string;
          logo: {
            title: string;
            default: string;
            none: string;
            custom: string;
          };
          background: {
            title: string;
            default: string;
            color: string;
            custom: string;
            custom_tips: string; // 参数: {fitWidth, fitHeight}
          };
        };
        custom: string;
        default: string;
        disabled: string;
        watermark_location_config: {
          top: string;
          bottom: string;
          left: string;
          right: string;
          center: string;
        };
        preview: string;
        total_time_tips: string;
        display_ratio_tips: string;
        tips: string;
        select_image: string;
        use_default_tip: string;
        enable_custom_splash: string;
        reset: string;
        preview_in_browser: string;
        information_dialog_unusual: string;
      };
    };
    example: string;
    platforms: {
      native: {
        title: string;
        options: {
          make: string;
          run: string;
          encrypted: string;
          xxtea_key: string;
          compress_zip: string;
        };
        encrypt: {
          disable_tips: string;
        };
      };
      mac: {
        title: string;
        error: {
          m1_with_physic_x: string;
        };
      };
    };
  };
  common: {
    loading: string;
    success: string;
    error: string;
    warning: string;
    info: string;
    confirm: string;
    cancel: string;
    ok: string;
    yes: string;
    no: string;
    save: string;
    delete: string;
    edit: string;
    create: string;
    update: string;
    refresh: string;
    close: string;
    open: string;
    back: string;
    next: string;
    previous: string;
    finish: string;
    start: string;
    stop: string;
    pause: string;
    resume: string;
    deprecated_tip: string;
    preview: {
      device: {
        design_resolution: string;
        full_screen: string;
        webpage_full_screen: string;
      };
    };
  };
  configuration: {
    builder: {
      common: {
        title: string;
      };
      useCache: {
        title: string;
        serializeData: {
          title: string;
        };
        engine: {
          title: string;
        };
        textureCompress: {
          title: string;
        };
        autoAtlas: {
          title: string;
        };
      };
      textureCompressConfig: {
        title: string;
        description: string;
      };
      bundleConfig: {
        title: string;
        description: string;
      };
      platform: {
        configSuffix: string;
        outputName: {
          title: string;
          description: string;
        };
        packageOptions: {
          title: string;
        };
      };
    };
    import: {
      title: string;
      globList: {
        title: string;
        description: string;
        itemTitle: string;
      };
      restoreAssetDBFromCache: {
        title: string;
      };
      createTemplateRoot: {
        title: string;
      };
      userDataTemplate: {
        title: string;
        description: string;
      };
      fbx: {
        title: string;
        legacyFbxImporter: {
          title: string;
          visible: {
            title: string;
          };
        };
        material: {
          title: string;
          smart: {
            title: string;
          };
        };
      };
    };
    scene: {
      tick: {
        title: string;
        description: string;
      };
    };
    script: {
      title: string;
      useDefineForClassFields: {
        title: string;
      };
      allowDeclareFields: {
        title: string;
      };
      loose: {
        title: string;
      };
      guessCommonJsExports: {
        title: string;
        description: string;
      };
      exportsConditions: {
        title: string;
      };
      sortingPlugin: {
        title: string;
        description: string;
        itemTitle: string;
      };
      preserveSymlinks: {
        title: string;
      };
      importMap: {
        title: string;
      };
      previewBrowserslistConfigFile: {
        title: string;
      };
      updateAutoUpdateImportConfig: {
        title: string;
      };
    };
    engine: {
      dynamic: {
        includeModules: {
          title: string;
          description: string;
          itemTitle: string;
        };
        flags: {
          title: string;
          description: string;
        };
      };
      physicsConfig: {
        title: string;
        gravity: {
          title: string;
          description: string;
        };
        allowSleep: {
          title: string;
          description: string;
        };
        sleepThreshold: {
          title: string;
          description: string;
        };
        autoSimulation: {
          title: string;
          description: string;
        };
        fixedTimeStep: {
          title: string;
          description: string;
        };
        maxSubSteps: {
          title: string;
          description: string;
        };
        useNodeChains: {
          title: string;
        };
        physicsEngine: {
          title: string;
          description: string;
        };
        collisionMatrix: {
          title: string;
          description: string;
        };
        defaultMaterial: {
          title: string;
          description: string;
        };
        physX: {
          title: string;
          description: string;
        };
      };
      designResolution: {
        title: string;
        width: {
          title: string;
        };
        height: {
          title: string;
        };
        fitWidth: {
          title: string;
        };
        fitHeight: {
          title: string;
        };
      };
      splashScreen: {
        title: string;
        displayRatio: {
          title: string;
        };
        totalTime: {
          title: string;
        };
        watermarkLocation: {
          title: string;
          options: {
            default: string;
            topLeft: string;
            topRight: string;
            topCenter: string;
            bottomLeft: string;
            bottomCenter: string;
            bottomRight: string;
          };
        };
        autoFit: {
          title: string;
        };
        logo: {
          title: string;
        };
        background: {
          title: string;
        };
      };
      moduleConfig: {
        title: string;
        noDeprecatedFeatures: {
          title: string;
          description: string;
        };
      };
      graphics: {
        title: string;
        pipeline: {
          title: string;
          options: {
            custom: string;
            legacy: string;
          };
        };
        pipelineName: {
          title: string;
          description: string;
        };
        customPipelinePostProcess: {
          title: string;
          description: string;
        };
      };
      rendering: {
        title: string;
        renderPipeline: {
          title: string;
          description: string;
        };
        customPipeline: {
          title: string;
          description: string;
        };
        highQuality: {
          title: string;
        };
        downloadMaxConcurrency: {
          title: string;
        };
        customJointTextureLayouts: {
          title: string;
          description: string;
        };
      };
      jointTextureLayout: {
        title: string;
        customJointTextureLayouts: {
          title: string;
          description: string;
          itemTitle: string;
          textureLength: {
            title: string;
            description: string;
          };
          contents: {
            title: string;
            description: string;
            itemTitle: string;
            skeleton: {
              title: string;
              description: string;
            };
            clips: {
              title: string;
              description: string;
              itemTitle: string;
            };
          };
        };
      };
      macroConfig: {
        title: string;
        macroCustom: {
          title: string;
          description: string;
          itemTitle: string;
          key: {
            title: string;
          };
          value: {
            title: string;
          };
        };
      };
      layers: {
        title: string;
        customLayers: {
          title: string;
          description: string;
        };
        sortingLayers: {
          title: string;
          description: string;
        };
      };
      projectConfig: {
        title: string;
        globalConfigKey: {
          title: string;
        };
        configs: {
          title: string;
        };
        configItem: {
          title: string;
        };
        noDeprecatedFeatureConfig: {
          title: string;
          value: {
            title: string;
          };
          version: {
            title: string;
          };
        };
      };
    };
  };
  importer: {
    invalid_node_data: string; // 参数: {asset({assetUuid, type, value}
    node: string;
    component: string;
    sharp_error: string;
    gltf: {
      gltf_asset_group_mesh: string;
      gltf_asset_group_animation: string;
      gltf_asset_group_node: string;
      gltf_asset_group_skin: string;
      gltf_asset_group_sampler: string;
      gltf_asset: string; // 参数: {group, index, name}
      gltf_asset_no_name: string; // 参数: {group, index}
      unsupported_alpha_mode: string; // 参数: {material, mode}
      unsupported_texture_parameter: string; // 参数: {texture, sampler, type, value}
      texture_parameter_min_filter: string;
      texture_parameter_mag_filter: string;
      unsupported_channel_path: string; // 参数: {animation, channel, path}
      reference_skin_in_different_scene: string; // 参数: {node, skin}
      disallow_cubic_spline_channel_split: string; // 参数: {animation, channel}
      failed_to_calculate_tangents_due_to_lack_of_normals: string; // 参数: {mesh, primitive}
      failed_to_calculate_tangents_due_to_lack_of_uvs: string; // 参数: {mesh, primitive}
      empty_morph: string; // 参数: {mesh, primitive}
      unsupported_extension: string; // 参数: {name}
      failed_to_load_image: string; // 参数: {url, reason}
      image_uri_should_be_file_url: string;
      failed_to_convert_tga: string;
    };
    fbx: {
      failed_to_convert_fbx_file: string; // 参数: {path}
      no_available_fbx_temp_dir: string;
      fbx2gltf_exists_with_non_zero_code: string; // 参数: {code, output}
      fbx_gltf_conv: {
        bad_cpu: string;
        missing_dll: string;
        unsupported_inherit_type: string; // 参数: {type, nodes}
        multi_material_layers: string; // 参数: {mesh}
        skin_merge_error: string; // 参数: {node}
      };
    };
    dragonbones_atlas: {
      texture_not_imported: string; // 参数: {texture}
      texture_not_found: string; // 参数: {atlas, texture}
    };
    script: {
      invalid_class_name: string;
      find_class_name_from_file_name_failed: string; // 参数: {fileBasename, className}
      transform_failure: string; // 参数: {path, reason}
    };
    property_schema: {
      auto_atlas: {
        max_width: string;
        max_width_description: string;
        max_height: string;
        max_height_description: string;
        padding: string;
        padding_description: string;
        allow_rotation: string;
        allow_rotation_description: string;
        force_squared: string;
        force_squared_description: string;
        power_of_two: string;
        power_of_two_description: string;
        algorithm: string;
        algorithm_description: string;
        max_rects: string;
        format: string;
        format_description: string;
        png: string;
        jpg: string;
        quality: string;
        quality_description: string;
        contour_bleed: string;
        contour_bleed_description: string;
        padding_bleed: string;
        padding_bleed_description: string;
        filter_unused: string;
        filter_unused_description: string;
        remove_texture_in_bundle: string;
        remove_texture_in_bundle_description: string;
        remove_image_in_bundle: string;
        remove_image_in_bundle_description: string;
        remove_sprite_atlas_in_bundle: string;
        remove_sprite_atlas_in_bundle_description: string;
        texture_setting: string;
        texture_setting_description: string;
      };
      texture: {
        use_uuid: string;
        use_uuid_description: string;
        image_uuid_or_database_uri_description: string;
        wrap_repeat: string;
        wrap_clamp_to_edge: string;
        wrap_mirrored_repeat: string;
        filter_none: string;
        filter_nearest: string;
        filter_linear: string;
      };
      image: {
        type_raw: string;
        type_texture: string;
        type_normal_map: string;
        type_sprite_frame: string;
        type_texture_cube: string;
      };
      sprite_frame: {
        trim_type_auto: string;
        trim_type_custom: string;
        trim_type_none: string;
        mesh_type_rect: string;
        mesh_type_polygon: string;
      };
      gltf: {
        mesh_optimizer: string;
        mesh_optimizer_description: string;
        mesh_optimizer_enable: string;
        mesh_optimizer_enable_description: string;
        mesh_optimizer_algorithm: string;
        mesh_optimizer_algorithm_description: string;
        mesh_optimizer_simplify: string;
        mesh_optimizer_gltfpack: string;
        simplify_options: string;
        simplify_options_description: string;
        enable_smart_link: string;
        enable_smart_link_description: string;
        agressiveness: string;
        agressiveness_description: string;
        max_iteration_count: string;
        max_iteration_count_description: string;
        mount_all_animations_on_prefab_description: string;
        target_ratio_description: string;
      };
      fbx: {
        unit_conversion: string;
        unit_conversion_description: string;
        unit_conversion_geometry_level: string;
        unit_conversion_hierarchy_level: string;
        unit_conversion_disabled: string;
        match_mesh_names: string;
        match_mesh_names_description: string;
        fbx_description: string;
      };
    };
    texture: {
      anisotropy: string;
      anisotropy_tip: string;
      filter_mode: string;
      filter_mode_tip: string;
      minfilter: string;
      minfilter_tip: string;
      magfilter: string;
      magfilter_tip: string;
      generate_mipmaps: string;
      generate_mipmaps_tip: string;
      mipfilter: string;
      mipfilter_tip: string;
      wrap_mode: string;
      wrap_mode_tip: string;
      wrap_mode_s: string;
      wrap_mode_s_tip: string;
      wrap_mode_t: string;
      wrap_mode_t_tip: string;
      mode_warn: string;
      filter_diffenent: string; // 参数: {atlasFile}
    };
  };
}

// 扁平化的键类型
export type I18nKeys = 'assets.title' | 'assets.description' | 'assets.deprecated_tip' | 'assets.global_readonly_tip' | 'assets.debug_mode' | 'assets.asset_d_b_pause_tips' | 'assets.asset_d_b_init_error' | 'assets.save_asset.fail.unknown' | 'assets.save_asset.fail.uuid' | 'assets.save_asset.fail.asset' | 'assets.save_asset.fail.content' | 'assets.save_asset.fail.readonly' | 'assets.save_asset_meta.fail.unknown' | 'assets.save_asset_meta.fail.uuid' | 'assets.save_asset_meta.fail.content' | 'assets.save_asset_meta.fail.readonly' | 'assets.rename_asset.fail.source' | 'assets.rename_asset.fail.include' | 'assets.rename_asset.fail.parent' | 'assets.rename_asset.warn.overwrite' | 'assets.init.no_asset_db_list' | 'assets.operation.invalid_url' | 'assets.operation.exists_url' | 'assets.operation.readonly' | 'assets.operation.overwrite' | 'assets.delete_asset.fail.unknown' | 'assets.delete_asset.fail.url' | 'assets.delete_asset.fail.unexist' | 'assets.delete_asset.fail.readonly' | 'assets.create_asset.title' | 'assets.create_asset.fail.unknown' | 'assets.create_asset.fail.type' | 'assets.create_asset.fail.url' | 'assets.create_asset.fail.exist' | 'assets.create_asset.fail.drop' | 'assets.create_asset.fail.to_url' | 'assets.create_asset.fail.uuid' | 'assets.import_asset.meta_exists' | 'assets.open_asset.preference_program_warning' | 'assets.open_asset.fail.no_asset' | 'assets.copy_asset.fail.unknown' | 'assets.copy_asset.fail.url' | 'assets.restore_asset_d_b_from_cache_in_valid.upgrade' | 'assets.restore_asset_d_b_from_cache_in_valid.no_library_path' | 'assets.preferences.log_level' | 'assets.preferences.log_level_debug' | 'assets.preferences.log_level_log' | 'assets.preferences.log_level_warn' | 'assets.preferences.log_level_error' | 'assets.preferences.ignore_glob' | 'assets.preferences.ignore_changed' | 'builder.title' | 'builder.description' | 'builder.create_user_template' | 'builder.build_config' | 'builder.build' | 'builder.compile' | 'builder.open_log_file' | 'builder.generate_engine' | 'builder.require' | 'builder.new_build_task' | 'builder.empty_task_holder' | 'builder.empty_scene' | 'builder.empty_platforms' | 'builder.reveal_in_explorer' | 'builder.view_build_config' | 'builder.recompile' | 'builder.confirm' | 'builder.use_splash_screen' | 'builder.bundle_common_chunk' | 'builder.bundle_common_chunk_tips' | 'builder.bundleCommonChunk' | 'builder.bundleCommonChunkTips' | 'builder.off' | 'builder.options.platform' | 'builder.options.name' | 'builder.options.polyfills' | 'builder.options.polyfills_tips' | 'builder.options.async_functions' | 'builder.options.async_functions_tips' | 'builder.options.core_js' | 'builder.options.core_js_tips' | 'builder.options.buildScriptTargets' | 'builder.options.buildScriptTargetsTips' | 'builder.options.remote_server_address' | 'builder.options.remote_server_address_tips' | 'builder.options.sourceMap' | 'builder.options.sourceMapTips' | 'builder.options.sourceMapsInline' | 'builder.options.standaloneSourceMaps' | 'builder.options.experimental_erase_modules' | 'builder.options.experimental_erase_modules_tips' | 'builder.options.includeBundles' | 'builder.options.build_path' | 'builder.options.debug' | 'builder.options.debugTips' | 'builder.options.mangleProperties' | 'builder.options.manglePropertiesTip' | 'builder.options.inlineEnum' | 'builder.options.inlineEnumTip' | 'builder.options.md5_cache' | 'builder.options.md5CacheTips' | 'builder.options.main_bundle_is_remote' | 'builder.options.main_bundle_compression_type' | 'builder.options.pack_autoAtlas' | 'builder.options.start_scene' | 'builder.options.startSceneTips' | 'builder.options.start_scene_asset_bundle' | 'builder.options.start_scene_asset_bundle_tips' | 'builder.options.scenes' | 'builder.options.skip_compress_texture' | 'builder.options.bin_group_config' | 'builder.options.enable_cconb_group' | 'builder.options.enable_cconb_group_tips' | 'builder.tips.enter_name' | 'builder.tips.task_name' | 'builder.tips.build_path' | 'builder.tips.build_scenes' | 'builder.tips.set_start_scene' | 'builder.tips.atlas_in_resources' | 'builder.tips.use_texture_in_atlas' | 'builder.tips.use_image_in_atlas' | 'builder.tips.task_exist' | 'builder.tips.task_busy' | 'builder.tips.platform_missing' | 'builder.tips.conflict_platform' | 'builder.tips.waiting_for_remove_task' | 'builder.tips.waiting_for_db_ready' | 'builder.tips.waiting_for_plugin_ready' | 'builder.tips.waiting_for_worker_ready' | 'builder.tips.waiting_for_data_ready' | 'builder.tips.scene_in_bundle' | 'builder.tips.create_application_template_success' | 'builder.tips.create_application_template_overwrite' | 'builder.tips.application_ejs_version' | 'builder.tips.set_splash_setting' | 'builder.tips.build_task_canceled' | 'builder.tips.pause_asset_import' | 'builder.tips.disable_platform' | 'builder.tips.disable_platform_for_build_command' | 'builder.tips.disable_register_platform_info' | 'builder.tips.platform_information_invalid' | 'builder.tips.create_template_success' | 'builder.tips.template_version_warning' | 'builder.tips.build_package_missing' | 'builder.error.build_error' | 'builder.error.build_dir_not_exists' | 'builder.error.build_path_contains_space' | 'builder.error.build_path_contains_chinese_and_symbol' | 'builder.error.can_not_empty' | 'builder.error.project_name_not_legal' | 'builder.error.package_name_not_legal' | 'builder.error.package_name_start_with_number' | 'builder.error.select_scenes_to_build' | 'builder.error.path_too_long_title' | 'builder.error.path_too_long_desc' | 'builder.error.keep_raw_texture_of_atlas' | 'builder.error.run_hooks_failed' | 'builder.error.cache_compress_texture_missing' | 'builder.error.deserialize_failed' | 'builder.error.missing_import_files' | 'builder.error.required_asset_missing' | 'builder.error.missing_asset' | 'builder.error.check_options_failed' | 'builder.error.unknown_platform' | 'builder.error.asset_import_failed' | 'builder.error.get_asset_json_failed' | 'builder.error.builder_crash' | 'builder.error.texture_compress_failed' | 'builder.error.missing_splash_tips' | 'builder.error.invalid_start_scene' | 'builder.error.missing_scenes' | 'builder.error.bundle_configs' | 'builder.error.platform_register_error' | 'builder.error.check_failed' | 'builder.error.engine_modules_config_key_missing' | 'builder.warn.no_defined_in_i18n' | 'builder.warn.no_serialized_json' | 'builder.warn.same_load_url' | 'builder.warn.atlas_in_resources' | 'builder.warn.path_not_exist' | 'builder.warn.http' | 'builder.warn.required' | 'builder.warn.no_chinese' | 'builder.warn.check_failed_with_new_value' | 'builder.warn.compress_rgb_a' | 'builder.warn.asset_bundle_is_remote_invalid' | 'builder.warn.require_mipmaps' | 'builder.warn.invalid_custom_splash' | 'builder.warn.invalid_remove_splash' | 'builder.warn.exception_remove_splash' | 'builder.warn.deprecated_tip' | 'builder.warn.resources_remote_lock_waring' | 'builder.warn.repeat_atlas_in_bundle' | 'builder.warn.engine_modules_fall_back_tip' | 'builder.warn.invalid_option_in_separate_engine' | 'builder.warn.separate_engine_with_custom_engine' | 'builder.warn.invalid_version_in_separate_engine' | 'builder.tasks.build_asset' | 'builder.tasks.build_engine' | 'builder.tasks.build_img' | 'builder.tasks.build_json' | 'builder.tasks.build_atlas' | 'builder.tasks.build_script' | 'builder.tasks.build_project_script' | 'builder.tasks.build_suffix' | 'builder.tasks.build_template' | 'builder.tasks.build_zip_bundle' | 'builder.tasks.load_script' | 'builder.tasks.sort_asset' | 'builder.tasks.build_import_map' | 'builder.tasks.sort_import_map' | 'builder.tasks.sort_asset_bundle' | 'builder.tasks.sort_image' | 'builder.tasks.sort_script' | 'builder.tasks.sort_sprite_frame' | 'builder.tasks.sort_texture' | 'builder.tasks.sort_json' | 'builder.tasks.settings.cache' | 'builder.tasks.settings.options' | 'builder.tasks.settings.design_resolution' | 'builder.tasks.settings.group' | 'builder.tasks.settings.md5' | 'builder.tasks.settings.scene' | 'builder.tasks.settings.script' | 'builder.tasks.settings.init' | 'builder.tasks.settings.macro' | 'builder.tasks.postprocess.compress' | 'builder.tasks.postprocess.save_config' | 'builder.tasks.postprocess.save_settings' | 'builder.asset_bundle.is_bundle' | 'builder.asset_bundle.bundle_name' | 'builder.asset_bundle.priority' | 'builder.asset_bundle.priority_tooltip' | 'builder.asset_bundle.compression_type' | 'builder.asset_bundle.compression_type_tooltip' | 'builder.asset_bundle.target_platform' | 'builder.asset_bundle.target_platform_tooltip' | 'builder.asset_bundle.is_remote_bundle' | 'builder.asset_bundle.remote_bundle_invalid_tooltip' | 'builder.asset_bundle.none' | 'builder.asset_bundle.none_tooltip' | 'builder.asset_bundle.subpackage' | 'builder.asset_bundle.subpackage_tooltip' | 'builder.asset_bundle.merge_dep' | 'builder.asset_bundle.merge_dep_tooltip' | 'builder.asset_bundle.merge_all_json' | 'builder.asset_bundle.merge_all_json_tooltip' | 'builder.asset_bundle.zip' | 'builder.asset_bundle.zip_tooltip' | 'builder.asset_bundle.duplicate_name_message' | 'builder.asset_bundle.duplicate_name_messaged_auto_rename' | 'builder.asset_bundle.duplicate_reserved_keyword_message' | 'builder.asset_bundle.nest_bundle' | 'builder.asset_bundle.filter_config.title' | 'builder.asset_bundle.filter_config.add' | 'builder.asset_bundle.filter_config.preview' | 'builder.asset_bundle.filter_config.add_asset' | 'builder.asset_bundle.filter_config.include' | 'builder.asset_bundle.filter_config.exclude' | 'builder.asset_bundle.filter_config.asset' | 'builder.asset_bundle.filter_config.url' | 'builder.asset_bundle.filter_config.glob' | 'builder.asset_bundle.filter_config.glob_tips' | 'builder.asset_bundle.filter_config.begin_with' | 'builder.asset_bundle.filter_config.end_with' | 'builder.asset_bundle.filter_config.contain' | 'builder.asset_bundle.filter_config.empty_config' | 'builder.asset_bundle.filter_config.preview_list' | 'builder.asset_bundle.filter_config.preview_tips' | 'builder.asset_bundle.filter_config.empty_preview_list' | 'builder.asset_bundle.empty_bundle' | 'builder.asset_bundle.bundle_build_tips' | 'builder.asset_bundle.bundle_build_platform_tips' | 'builder.asset_bundle.build_bundle' | 'builder.asset_bundle.publish_config' | 'builder.asset_bundle.build_bundle_i_n_process' | 'builder.asset_bundle.bundle_build_close_tip' | 'builder.asset_bundle.build_bundle_busy' | 'builder.asset_bundle.build_bundle_params' | 'builder.asset_bundle.bundle_config' | 'builder.asset_bundle.export_bundle_build_config' | 'builder.asset_bundle.preferred_options' | 'builder.asset_bundle.preferred_options_tips' | 'builder.asset_bundle.fallback_options' | 'builder.asset_bundle.fallback_options_tips' | 'builder.asset_bundle.platform_override' | 'builder.asset_bundle.platform_override_empty_tip' | 'builder.asset_bundle.default_config' | 'builder.asset_bundle.native' | 'builder.asset_bundle.web' | 'builder.asset_bundle.minigame' | 'builder.asset_bundle.import_config' | 'builder.asset_bundle.export_config' | 'builder.asset_bundle.preview_setting' | 'builder.asset_bundle.platform' | 'builder.asset_bundle.platform_config' | 'builder.asset_bundle.edit_config' | 'builder.asset_bundle.add_config' | 'builder.asset_bundle.delete_config' | 'builder.asset_bundle.is_remote_fallback_tips' | 'builder.asset_bundle.reset' | 'builder.asset_bundle.reset_uni' | 'builder.asset_bundle.separate_config' | 'builder.asset_bundle.all_mini_games' | 'builder.asset_bundle.uni_config' | 'builder.asset_bundle.true' | 'builder.asset_bundle.false' | 'builder.asset_bundle.overwrite' | 'builder.asset_bundle.merge' | 'builder.project.texture_compress.title' | 'builder.project.texture_compress.compress_preset' | 'builder.project.texture_compress.custom_format' | 'builder.project.texture_compress.same_config_name' | 'builder.project.texture_compress.add_config' | 'builder.project.texture_compress.edit_config_name' | 'builder.project.texture_compress.export_config' | 'builder.project.texture_compress.import_config' | 'builder.project.texture_compress.import_config_options' | 'builder.project.texture_compress.merge' | 'builder.project.texture_compress.preset_name' | 'builder.project.texture_compress.add_format' | 'builder.project.texture_compress.compress_format' | 'builder.project.texture_compress.mipmap.no_power_of_two' | 'builder.project.texture_compress.tips.require_object' | 'builder.project.texture_compress.tips.require_name' | 'builder.project.texture_compress.tips.xx_require_object' | 'builder.project.texture_compress.tips.platform_err' | 'builder.project.texture_compress.tips.texture_type_err' | 'builder.project.texture_compress.tips.options_quality_type_err' | 'builder.project.texture_compress.tips.number_quality_type_err' | 'builder.project.texture_compress.tips.import_failed' | 'builder.project.texture_compress.tips.user_preset_err' | 'builder.project.texture_compress.tips.enter_config_name_to_add' | 'builder.project.texture_compress.tips.input_config_name_to_search' | 'builder.project.splash_setting.title' | 'builder.project.splash_setting.confirm' | 'builder.project.splash_setting.settings.total_time' | 'builder.project.splash_setting.settings.display_ratio' | 'builder.project.splash_setting.settings.auto_fit' | 'builder.project.splash_setting.settings.watermark_location' | 'builder.project.splash_setting.settings.logo.title' | 'builder.project.splash_setting.settings.logo.default' | 'builder.project.splash_setting.settings.logo.none' | 'builder.project.splash_setting.settings.logo.custom' | 'builder.project.splash_setting.settings.background.title' | 'builder.project.splash_setting.settings.background.default' | 'builder.project.splash_setting.settings.background.color' | 'builder.project.splash_setting.settings.background.custom' | 'builder.project.splash_setting.settings.background.custom_tips' | 'builder.project.splash_setting.custom' | 'builder.project.splash_setting.default' | 'builder.project.splash_setting.disabled' | 'builder.project.splash_setting.watermark_location_config.top' | 'builder.project.splash_setting.watermark_location_config.bottom' | 'builder.project.splash_setting.watermark_location_config.left' | 'builder.project.splash_setting.watermark_location_config.right' | 'builder.project.splash_setting.watermark_location_config.center' | 'builder.project.splash_setting.preview' | 'builder.project.splash_setting.total_time_tips' | 'builder.project.splash_setting.display_ratio_tips' | 'builder.project.splash_setting.tips' | 'builder.project.splash_setting.select_image' | 'builder.project.splash_setting.use_default_tip' | 'builder.project.splash_setting.enable_custom_splash' | 'builder.project.splash_setting.reset' | 'builder.project.splash_setting.preview_in_browser' | 'builder.project.splash_setting.information_dialog_unusual' | 'builder.example' | 'builder.platforms.native.title' | 'builder.platforms.native.options.make' | 'builder.platforms.native.options.run' | 'builder.platforms.native.options.encrypted' | 'builder.platforms.native.options.xxtea_key' | 'builder.platforms.native.options.compress_zip' | 'builder.platforms.native.encrypt.disable_tips' | 'builder.platforms.mac.title' | 'builder.platforms.mac.error.m1_with_physic_x' | 'common.loading' | 'common.success' | 'common.error' | 'common.warning' | 'common.info' | 'common.confirm' | 'common.cancel' | 'common.ok' | 'common.yes' | 'common.no' | 'common.save' | 'common.delete' | 'common.edit' | 'common.create' | 'common.update' | 'common.refresh' | 'common.close' | 'common.open' | 'common.back' | 'common.next' | 'common.previous' | 'common.finish' | 'common.start' | 'common.stop' | 'common.pause' | 'common.resume' | 'common.deprecated_tip' | 'common.preview.device.design_resolution' | 'common.preview.device.full_screen' | 'common.preview.device.webpage_full_screen' | 'configuration.builder.common.title' | 'configuration.builder.useCache.title' | 'configuration.builder.useCache.serializeData.title' | 'configuration.builder.useCache.engine.title' | 'configuration.builder.useCache.textureCompress.title' | 'configuration.builder.useCache.autoAtlas.title' | 'configuration.builder.textureCompressConfig.title' | 'configuration.builder.textureCompressConfig.description' | 'configuration.builder.bundleConfig.title' | 'configuration.builder.bundleConfig.description' | 'configuration.builder.platform.configSuffix' | 'configuration.builder.platform.outputName.title' | 'configuration.builder.platform.outputName.description' | 'configuration.builder.platform.packageOptions.title' | 'configuration.import.title' | 'configuration.import.globList.title' | 'configuration.import.globList.description' | 'configuration.import.globList.itemTitle' | 'configuration.import.restoreAssetDBFromCache.title' | 'configuration.import.createTemplateRoot.title' | 'configuration.import.userDataTemplate.title' | 'configuration.import.userDataTemplate.description' | 'configuration.import.fbx.title' | 'configuration.import.fbx.legacyFbxImporter.title' | 'configuration.import.fbx.legacyFbxImporter.visible.title' | 'configuration.import.fbx.material.title' | 'configuration.import.fbx.material.smart.title' | 'configuration.scene.tick.title' | 'configuration.scene.tick.description' | 'configuration.script.title' | 'configuration.script.useDefineForClassFields.title' | 'configuration.script.allowDeclareFields.title' | 'configuration.script.loose.title' | 'configuration.script.guessCommonJsExports.title' | 'configuration.script.guessCommonJsExports.description' | 'configuration.script.exportsConditions.title' | 'configuration.script.sortingPlugin.title' | 'configuration.script.sortingPlugin.description' | 'configuration.script.sortingPlugin.itemTitle' | 'configuration.script.preserveSymlinks.title' | 'configuration.script.importMap.title' | 'configuration.script.previewBrowserslistConfigFile.title' | 'configuration.script.updateAutoUpdateImportConfig.title' | 'configuration.engine.dynamic.includeModules.title' | 'configuration.engine.dynamic.includeModules.description' | 'configuration.engine.dynamic.includeModules.itemTitle' | 'configuration.engine.dynamic.flags.title' | 'configuration.engine.dynamic.flags.description' | 'configuration.engine.physicsConfig.title' | 'configuration.engine.physicsConfig.gravity.title' | 'configuration.engine.physicsConfig.gravity.description' | 'configuration.engine.physicsConfig.allowSleep.title' | 'configuration.engine.physicsConfig.allowSleep.description' | 'configuration.engine.physicsConfig.sleepThreshold.title' | 'configuration.engine.physicsConfig.sleepThreshold.description' | 'configuration.engine.physicsConfig.autoSimulation.title' | 'configuration.engine.physicsConfig.autoSimulation.description' | 'configuration.engine.physicsConfig.fixedTimeStep.title' | 'configuration.engine.physicsConfig.fixedTimeStep.description' | 'configuration.engine.physicsConfig.maxSubSteps.title' | 'configuration.engine.physicsConfig.maxSubSteps.description' | 'configuration.engine.physicsConfig.useNodeChains.title' | 'configuration.engine.physicsConfig.physicsEngine.title' | 'configuration.engine.physicsConfig.physicsEngine.description' | 'configuration.engine.physicsConfig.collisionMatrix.title' | 'configuration.engine.physicsConfig.collisionMatrix.description' | 'configuration.engine.physicsConfig.defaultMaterial.title' | 'configuration.engine.physicsConfig.defaultMaterial.description' | 'configuration.engine.physicsConfig.physX.title' | 'configuration.engine.physicsConfig.physX.description' | 'configuration.engine.designResolution.title' | 'configuration.engine.designResolution.width.title' | 'configuration.engine.designResolution.height.title' | 'configuration.engine.designResolution.fitWidth.title' | 'configuration.engine.designResolution.fitHeight.title' | 'configuration.engine.splashScreen.title' | 'configuration.engine.splashScreen.displayRatio.title' | 'configuration.engine.splashScreen.totalTime.title' | 'configuration.engine.splashScreen.watermarkLocation.title' | 'configuration.engine.splashScreen.watermarkLocation.options.default' | 'configuration.engine.splashScreen.watermarkLocation.options.topLeft' | 'configuration.engine.splashScreen.watermarkLocation.options.topRight' | 'configuration.engine.splashScreen.watermarkLocation.options.topCenter' | 'configuration.engine.splashScreen.watermarkLocation.options.bottomLeft' | 'configuration.engine.splashScreen.watermarkLocation.options.bottomCenter' | 'configuration.engine.splashScreen.watermarkLocation.options.bottomRight' | 'configuration.engine.splashScreen.autoFit.title' | 'configuration.engine.splashScreen.logo.title' | 'configuration.engine.splashScreen.background.title' | 'configuration.engine.moduleConfig.title' | 'configuration.engine.moduleConfig.noDeprecatedFeatures.title' | 'configuration.engine.moduleConfig.noDeprecatedFeatures.description' | 'configuration.engine.graphics.title' | 'configuration.engine.graphics.pipeline.title' | 'configuration.engine.graphics.pipeline.options.custom' | 'configuration.engine.graphics.pipeline.options.legacy' | 'configuration.engine.graphics.pipelineName.title' | 'configuration.engine.graphics.pipelineName.description' | 'configuration.engine.graphics.customPipelinePostProcess.title' | 'configuration.engine.graphics.customPipelinePostProcess.description' | 'configuration.engine.rendering.title' | 'configuration.engine.rendering.renderPipeline.title' | 'configuration.engine.rendering.renderPipeline.description' | 'configuration.engine.rendering.customPipeline.title' | 'configuration.engine.rendering.customPipeline.description' | 'configuration.engine.rendering.highQuality.title' | 'configuration.engine.rendering.downloadMaxConcurrency.title' | 'configuration.engine.rendering.customJointTextureLayouts.title' | 'configuration.engine.rendering.customJointTextureLayouts.description' | 'configuration.engine.jointTextureLayout.title' | 'configuration.engine.jointTextureLayout.customJointTextureLayouts.title' | 'configuration.engine.jointTextureLayout.customJointTextureLayouts.description' | 'configuration.engine.jointTextureLayout.customJointTextureLayouts.itemTitle' | 'configuration.engine.jointTextureLayout.customJointTextureLayouts.textureLength.title' | 'configuration.engine.jointTextureLayout.customJointTextureLayouts.textureLength.description' | 'configuration.engine.jointTextureLayout.customJointTextureLayouts.contents.title' | 'configuration.engine.jointTextureLayout.customJointTextureLayouts.contents.description' | 'configuration.engine.jointTextureLayout.customJointTextureLayouts.contents.itemTitle' | 'configuration.engine.jointTextureLayout.customJointTextureLayouts.contents.skeleton.title' | 'configuration.engine.jointTextureLayout.customJointTextureLayouts.contents.skeleton.description' | 'configuration.engine.jointTextureLayout.customJointTextureLayouts.contents.clips.title' | 'configuration.engine.jointTextureLayout.customJointTextureLayouts.contents.clips.description' | 'configuration.engine.jointTextureLayout.customJointTextureLayouts.contents.clips.itemTitle' | 'configuration.engine.macroConfig.title' | 'configuration.engine.macroConfig.macroCustom.title' | 'configuration.engine.macroConfig.macroCustom.description' | 'configuration.engine.macroConfig.macroCustom.itemTitle' | 'configuration.engine.macroConfig.macroCustom.key.title' | 'configuration.engine.macroConfig.macroCustom.value.title' | 'configuration.engine.layers.title' | 'configuration.engine.layers.customLayers.title' | 'configuration.engine.layers.customLayers.description' | 'configuration.engine.layers.sortingLayers.title' | 'configuration.engine.layers.sortingLayers.description' | 'configuration.engine.projectConfig.title' | 'configuration.engine.projectConfig.globalConfigKey.title' | 'configuration.engine.projectConfig.configs.title' | 'configuration.engine.projectConfig.configItem.title' | 'configuration.engine.projectConfig.noDeprecatedFeatureConfig.title' | 'configuration.engine.projectConfig.noDeprecatedFeatureConfig.value.title' | 'configuration.engine.projectConfig.noDeprecatedFeatureConfig.version.title' | 'importer.invalid_node_data' | 'importer.node' | 'importer.component' | 'importer.sharp_error' | 'importer.gltf.gltf_asset_group_mesh' | 'importer.gltf.gltf_asset_group_animation' | 'importer.gltf.gltf_asset_group_node' | 'importer.gltf.gltf_asset_group_skin' | 'importer.gltf.gltf_asset_group_sampler' | 'importer.gltf.gltf_asset' | 'importer.gltf.gltf_asset_no_name' | 'importer.gltf.unsupported_alpha_mode' | 'importer.gltf.unsupported_texture_parameter' | 'importer.gltf.texture_parameter_min_filter' | 'importer.gltf.texture_parameter_mag_filter' | 'importer.gltf.unsupported_channel_path' | 'importer.gltf.reference_skin_in_different_scene' | 'importer.gltf.disallow_cubic_spline_channel_split' | 'importer.gltf.failed_to_calculate_tangents_due_to_lack_of_normals' | 'importer.gltf.failed_to_calculate_tangents_due_to_lack_of_uvs' | 'importer.gltf.empty_morph' | 'importer.gltf.unsupported_extension' | 'importer.gltf.failed_to_load_image' | 'importer.gltf.image_uri_should_be_file_url' | 'importer.gltf.failed_to_convert_tga' | 'importer.fbx.failed_to_convert_fbx_file' | 'importer.fbx.no_available_fbx_temp_dir' | 'importer.fbx.fbx2gltf_exists_with_non_zero_code' | 'importer.fbx.fbx_gltf_conv.bad_cpu' | 'importer.fbx.fbx_gltf_conv.missing_dll' | 'importer.fbx.fbx_gltf_conv.unsupported_inherit_type' | 'importer.fbx.fbx_gltf_conv.multi_material_layers' | 'importer.fbx.fbx_gltf_conv.skin_merge_error' | 'importer.dragonbones_atlas.texture_not_imported' | 'importer.dragonbones_atlas.texture_not_found' | 'importer.script.invalid_class_name' | 'importer.script.find_class_name_from_file_name_failed' | 'importer.script.transform_failure' | 'importer.property_schema.auto_atlas.max_width' | 'importer.property_schema.auto_atlas.max_width_description' | 'importer.property_schema.auto_atlas.max_height' | 'importer.property_schema.auto_atlas.max_height_description' | 'importer.property_schema.auto_atlas.padding' | 'importer.property_schema.auto_atlas.padding_description' | 'importer.property_schema.auto_atlas.allow_rotation' | 'importer.property_schema.auto_atlas.allow_rotation_description' | 'importer.property_schema.auto_atlas.force_squared' | 'importer.property_schema.auto_atlas.force_squared_description' | 'importer.property_schema.auto_atlas.power_of_two' | 'importer.property_schema.auto_atlas.power_of_two_description' | 'importer.property_schema.auto_atlas.algorithm' | 'importer.property_schema.auto_atlas.algorithm_description' | 'importer.property_schema.auto_atlas.max_rects' | 'importer.property_schema.auto_atlas.format' | 'importer.property_schema.auto_atlas.format_description' | 'importer.property_schema.auto_atlas.png' | 'importer.property_schema.auto_atlas.jpg' | 'importer.property_schema.auto_atlas.quality' | 'importer.property_schema.auto_atlas.quality_description' | 'importer.property_schema.auto_atlas.contour_bleed' | 'importer.property_schema.auto_atlas.contour_bleed_description' | 'importer.property_schema.auto_atlas.padding_bleed' | 'importer.property_schema.auto_atlas.padding_bleed_description' | 'importer.property_schema.auto_atlas.filter_unused' | 'importer.property_schema.auto_atlas.filter_unused_description' | 'importer.property_schema.auto_atlas.remove_texture_in_bundle' | 'importer.property_schema.auto_atlas.remove_texture_in_bundle_description' | 'importer.property_schema.auto_atlas.remove_image_in_bundle' | 'importer.property_schema.auto_atlas.remove_image_in_bundle_description' | 'importer.property_schema.auto_atlas.remove_sprite_atlas_in_bundle' | 'importer.property_schema.auto_atlas.remove_sprite_atlas_in_bundle_description' | 'importer.property_schema.auto_atlas.texture_setting' | 'importer.property_schema.auto_atlas.texture_setting_description' | 'importer.property_schema.texture.use_uuid' | 'importer.property_schema.texture.use_uuid_description' | 'importer.property_schema.texture.image_uuid_or_database_uri_description' | 'importer.property_schema.texture.wrap_repeat' | 'importer.property_schema.texture.wrap_clamp_to_edge' | 'importer.property_schema.texture.wrap_mirrored_repeat' | 'importer.property_schema.texture.filter_none' | 'importer.property_schema.texture.filter_nearest' | 'importer.property_schema.texture.filter_linear' | 'importer.property_schema.image.type_raw' | 'importer.property_schema.image.type_texture' | 'importer.property_schema.image.type_normal_map' | 'importer.property_schema.image.type_sprite_frame' | 'importer.property_schema.image.type_texture_cube' | 'importer.property_schema.sprite_frame.trim_type_auto' | 'importer.property_schema.sprite_frame.trim_type_custom' | 'importer.property_schema.sprite_frame.trim_type_none' | 'importer.property_schema.sprite_frame.mesh_type_rect' | 'importer.property_schema.sprite_frame.mesh_type_polygon' | 'importer.property_schema.gltf.mesh_optimizer' | 'importer.property_schema.gltf.mesh_optimizer_description' | 'importer.property_schema.gltf.mesh_optimizer_enable' | 'importer.property_schema.gltf.mesh_optimizer_enable_description' | 'importer.property_schema.gltf.mesh_optimizer_algorithm' | 'importer.property_schema.gltf.mesh_optimizer_algorithm_description' | 'importer.property_schema.gltf.mesh_optimizer_simplify' | 'importer.property_schema.gltf.mesh_optimizer_gltfpack' | 'importer.property_schema.gltf.simplify_options' | 'importer.property_schema.gltf.simplify_options_description' | 'importer.property_schema.gltf.enable_smart_link' | 'importer.property_schema.gltf.enable_smart_link_description' | 'importer.property_schema.gltf.agressiveness' | 'importer.property_schema.gltf.agressiveness_description' | 'importer.property_schema.gltf.max_iteration_count' | 'importer.property_schema.gltf.max_iteration_count_description' | 'importer.property_schema.gltf.mount_all_animations_on_prefab_description' | 'importer.property_schema.gltf.target_ratio_description' | 'importer.property_schema.fbx.unit_conversion' | 'importer.property_schema.fbx.unit_conversion_description' | 'importer.property_schema.fbx.unit_conversion_geometry_level' | 'importer.property_schema.fbx.unit_conversion_hierarchy_level' | 'importer.property_schema.fbx.unit_conversion_disabled' | 'importer.property_schema.fbx.match_mesh_names' | 'importer.property_schema.fbx.match_mesh_names_description' | 'importer.property_schema.fbx.fbx_description' | 'importer.texture.anisotropy' | 'importer.texture.anisotropy_tip' | 'importer.texture.filter_mode' | 'importer.texture.filter_mode_tip' | 'importer.texture.minfilter' | 'importer.texture.minfilter_tip' | 'importer.texture.magfilter' | 'importer.texture.magfilter_tip' | 'importer.texture.generate_mipmaps' | 'importer.texture.generate_mipmaps_tip' | 'importer.texture.mipfilter' | 'importer.texture.mipfilter_tip' | 'importer.texture.wrap_mode' | 'importer.texture.wrap_mode_tip' | 'importer.texture.wrap_mode_s' | 'importer.texture.wrap_mode_s_tip' | 'importer.texture.wrap_mode_t' | 'importer.texture.wrap_mode_t_tip' | 'importer.texture.mode_warn' | 'importer.texture.filter_diffenent';

// 为 i18next 提供的类型扩展
declare module 'i18next' {
  interface TFunction {
    (key: I18nKeys, options?: any): string;
  }
}

// 为 i18n 实例提供的类型扩展
declare module 'i18next' {
  interface i18n {
    t: TFunction;
  }
}

// 导出 i18n 实例类型
export interface I18nInstance {
  t: (key: I18nKeys, options?: any) => string;
}

// 工具类型：提取插值参数
export type ExtractParams<T extends string> = T extends `${string}{${infer P}}${string}`
  ? P | ExtractParams<T extends `${string}{${P}}${infer Rest}` ? Rest : never>
  : never;

// 工具类型：获取键对应的参数类型
export type GetKeyParams<K extends I18nKeys> = K extends keyof I18nResources
  ? ExtractParams<I18nResources[K]>
  : never;
