// Import from "wanaka-studio-engine/world-environment".

export type WorldSeason = 'spring' | 'summer' | 'autumn' | 'winter';

export type WorldTime = 'morning' | 'day' | 'evening' | 'night';

/** Classified label on `current.weather`. Input writes the same names as `preset`. */
export type WorldWeather = 'clear' | 'overcast' | 'fog' | 'rain' | 'storm' | 'snow' | 'dust';

/** Continuous weather channels. `haze` is the weather scalar; atmosphere fog is `atmosphere.fog`. */
export interface WorldWeatherScalars {
    readonly cloudCoverage: number;
    readonly haze: number;
    readonly rain: number;
    readonly snow: number;
    readonly dust: number;
    readonly wind: number;
}

/**
 * Three-colour height fog. `horizon` is the near band, `zenith` paints the
 * sky, `distance` tints far surfaces. Near / visibility are metres.
 */
export interface WorldFog {
    readonly enabled: boolean;
    readonly horizon: number;
    readonly zenith: number;
    readonly distance: number;
    readonly near: number;
    readonly visibility: number;
    /** World Y below which ground haze is added. Negative lifts haze above. */
    readonly hazeHeight: number;
    readonly hazeIntensity: number;
}

/** Fog overrides; omitted fields follow the environment. */
export type WorldFogInput = Partial<WorldFog> & {
    /** Single color for both surfaces and the fog sky gradient. */
    readonly color?: number;
    /** Alias for visibility: the view depth where range fog is complete. */
    readonly far?: number;
};

/** Two-shelf clouds. `mode` selects the blend; 4 and above draw nothing. */
export interface WorldCloudLook {
    readonly visible: boolean;
    readonly highlight: number;
    readonly lowlight: number;
    readonly shelfHeight0: number;
    readonly shelfHeight1: number;
    readonly skyScale0: number;
    readonly skyScale1: number;
    readonly mode: number;
}

/**
 * Layer overlay. Write scalars on `weatherScalars`. `fog` is the atmosphere
 * fog object. Weather haze is `weatherScalars.haze`.
 */
export type WorldEnvironmentLayerPatch = {
    readonly weatherScalars?: Partial<WorldWeatherScalars>;
    readonly sun?: {
        readonly color?: number;
        readonly intensity?: number;
        readonly azimuth?: number;
        readonly elevation?: number;
    };
    readonly ambient?: {
        readonly color?: number;
        readonly intensity?: number;
    };
    readonly fog?: Partial<WorldFog> & Pick<WorldFogInput, 'color' | 'far'>;
    readonly clouds?: Partial<WorldCloudLook>;
    readonly radiance?: number;
};

/**
 * Sun, fill, fog, clouds, and leaf radiance for one moment. The sky is the
 * fog zenith. Hemisphere fill is derived: sky colour is the sun, ground is
 * black, intensity matches the ambient light.
 */
export interface WorldAtmosphere {
    readonly fog: WorldFog;
    readonly sun: {
        readonly color: number;
        readonly intensity: number;
        /** Degrees, 0 at midnight, 90 at morning, 180 at noon, 270 at evening. */
        readonly azimuth: number;
        /** Degrees above the horizon. Negative at night. */
        readonly elevation: number;
    };
    readonly ambient: {
        readonly color: number;
        readonly intensity: number;
    };
    readonly clouds: WorldCloudLook;
    readonly radiance: number;
}

/** Overlay on the default atmosphere formula. Missing leaves keep the default. */
export type WorldAtmosphereResolver = (state: WorldEnvironmentState) => Partial<WorldAtmosphere>;

/**
 * Patch for `set` and the initial state. `preset` sets the weather scalars.
 * `time` sets `timeOfDay`. Read results from `current.weather` and
 * `current.time`. Write channels on `weatherScalars` and `timeOfDay`.
 */
export interface WorldEnvironmentInput {
    readonly season?: WorldSeason;
    readonly time?: WorldTime;
    readonly preset?: WorldWeather;
    readonly weatherScalars?: Partial<WorldWeatherScalars>;
    readonly timeOfDay?: number;
    /** Seconds per full day; 0 pauses the built-in clock. Configure this for
     * time that advances alongside weather transitions, rather than issuing
     * per-frame `timeOfDay` patches through `set()`. */
    readonly dayLengthSeconds?: number;
    readonly latitude?: number;
    readonly viewDistance?: number;
    /** Overrides weather-derived fog. Pass null to restore automatic fog. */
    readonly fog?: WorldFogInput | null;
}

/**
 * Base clock and weather scalars, before layer overlays. Classified `weather`
 * lives on `current`.
 */
export interface WorldEnvironmentBase {
    readonly season: WorldSeason;
    readonly time: WorldTime;
    readonly timeOfDay: number;
    readonly dayLengthSeconds: number;
    readonly latitude: number;
    readonly viewDistance: number;
    readonly seasonIndex: number;
    readonly weatherScalars: WorldWeatherScalars;
    readonly atmosphere: WorldAtmosphere;
}

/**
 * Published facts. `weather` is classified from `weatherScalars` after layers.
 * `set` does not accept this object — write `WorldEnvironmentInput`.
 */
export interface WorldEnvironmentState extends WorldEnvironmentBase {
    readonly weather: WorldWeather;
    readonly indoors: boolean;
}

export type WorldEnvironmentVolume = {
    readonly kind: 'box';
    readonly min: {
        readonly x: number;
        readonly y: number;
        readonly z: number;
    };
    readonly max: {
        readonly x: number;
        readonly y: number;
        readonly z: number;
    };
} | {
    readonly kind: 'sphere';
    readonly center: {
        readonly x: number;
        readonly y: number;
        readonly z: number;
    };
    readonly radius: number;
};

/** Handle for a pushed overlay. `release` removes it; a positive duration blends it out first. */
export interface WorldEnvironmentLayer {
    readonly id: number;
    readonly priority: number;
    release(blendSeconds?: number): void;
}

/**
 * Season, time, and weather for one game. `defineGame({ worldEnvironment })`
 * creates it; every scene reads `context.worldEnvironment`. Write `preset` or
 * `weatherScalars`; read `current.weatherScalars` and the classified
 * `current.weather`. This is not `scene.environment` or
 * `visualProfile.environment`, which are the image-based lighting map.
 */
export class WorldEnvironmentStateMachine {
    get current(): Readonly<WorldEnvironmentState>;
    /**
     * Applies a patch. Omitted fields keep their current values. `preset` sets
     * the weather scalars; `time` sets `timeOfDay`. `durationSeconds` 0 applies
     * immediately; a positive duration blends with a smoothstep.
     * Each call replaces the running base-environment transition, starting from
     * its current values rather than preserving its previous destination.
     * This includes time-only patches: a per-frame `set({ timeOfDay }, 0)`
     * cancels a weather blend. Use `dayLengthSeconds` for a running day clock
     * alongside weather transitions.
     */
    set(next: WorldEnvironmentInput, durationSeconds?: number): void;
    /**
     * Pushes an atmosphere and weather-scalar overlay. A higher `priority`
     * overrides a lower one. `blendSeconds` 0 applies at full weight immediately.
     */
    push(layer: WorldEnvironmentLayerPatch, options?: {
        readonly priority?: number;
        readonly blendSeconds?: number;
        /** Marks the active layer as an indoor camera environment. */
        readonly indoors?: boolean;
    }): WorldEnvironmentLayer;
    /**
     * Pushes a volume-gated overlay. Weight rises when the named Player (else the
     * camera) is inside the volume and falls when it leaves.
     */
    pushZone(volume: WorldEnvironmentVolume, layer: WorldEnvironmentLayerPatch, options?: {
        readonly priority?: number;
        readonly blendSeconds?: number;
        readonly indoors?: boolean;
    }): WorldEnvironmentLayer;
    /**
     * Fires when published `current` changes. A running day clock fires this
     * every host update.
     */
    onChange(listener: (current: WorldEnvironmentState, previous: WorldEnvironmentState) => void): () => void;
}
