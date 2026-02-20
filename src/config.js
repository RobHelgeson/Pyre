// config.js — Reactive configuration with defaults, ranges, and onChange listeners

const PARAM_DEFS = {
  // Emission
  particleCount:    { value: 50000,     min: 5000,  max: 200000, step: 1000,  category: 'emission', label: 'Max Particles' },
  emissionRate:     { value: 2000,      min: 100,   max: 10000,  step: 100,   category: 'emission', label: 'Emission Rate' },
  emissionWidth:    { value: 0.15,      min: 0.01,  max: 1.0,    step: 0.01,  category: 'emission', label: 'Emission Width' },
  emitterShape:     { value: 'line',                                           category: 'emission', label: 'Emitter Shape' },
  initialTemp:      { value: 1.0,       min: 0.5,   max: 2.0,    step: 0.05,  category: 'emission', label: 'Initial Temp' },

  // Physics
  buoyancy:         { value: 1.5,       min: 0.1,   max: 5.0,    step: 0.1,   category: 'physics', label: 'Buoyancy' },
  turbulence:       { value: 1.0,       min: 0.0,   max: 3.0,    step: 0.1,   category: 'physics', label: 'Turbulence' },
  turbulenceScale:  { value: 2.0,       min: 0.5,   max: 5.0,    step: 0.1,   category: 'physics', label: 'Turb. Scale' },
  windX:            { value: 0.0,       min: -2.0,  max: 2.0,    step: 0.1,   category: 'physics', label: 'Wind X' },
  windY:            { value: 0.0,       min: -1.0,  max: 1.0,    step: 0.1,   category: 'physics', label: 'Wind Y' },
  coolingRate:      { value: 0.8,       min: 0.1,   max: 3.0,    step: 0.1,   category: 'physics', label: 'Cooling Rate' },
  drag:             { value: 0.98,      min: 0.9,   max: 1.0,    step: 0.005, category: 'physics', label: 'Drag' },

  // Visual
  particleScale:    { value: 2.0,       min: 0.5,   max: 5.0,    step: 0.1,   category: 'visual', label: 'Particle Size' },
  glowIntensity:    { value: 1.5,       min: 0.5,   max: 3.0,    step: 0.1,   category: 'visual', label: 'Glow Intensity' },
  smokeOpacity:     { value: 0.3,       min: 0.0,   max: 1.0,    step: 0.05,  category: 'visual', label: 'Smoke Opacity' },
  theme:            { value: 'campfire',                                        category: 'visual', label: 'Theme' },

  // Interaction
  cursorForce:      { value: 1.0,       min: 0.0,   max: 3.0,    step: 0.1,   category: 'interaction', label: 'Cursor Force' },

  // Performance
  adaptiveParticles:{ value: true,                                              category: 'performance', label: 'Adaptive' },
};

export class Config {
  #values = {};
  #listeners = [];

  constructor() {
    for (const [key, def] of Object.entries(PARAM_DEFS)) {
      this.#values[key] = def.value;
    }
  }

  get(key) {
    return this.#values[key];
  }

  set(key, value) {
    if (!(key in PARAM_DEFS)) return;
    const def = PARAM_DEFS[key];
    if (def.min !== undefined) {
      value = Math.max(def.min, Math.min(def.max, value));
    }
    if (this.#values[key] === value) return;
    const old = this.#values[key];
    this.#values[key] = value;
    for (const fn of this.#listeners) {
      fn(key, value, old);
    }
  }

  onChange(fn) {
    this.#listeners.push(fn);
    return () => {
      const i = this.#listeners.indexOf(fn);
      if (i >= 0) this.#listeners.splice(i, 1);
    };
  }

  snapshot() {
    return { ...this.#values };
  }

  /** Pack parameters into a GPU-aligned ArrayBuffer matching FireParams struct */
  toSimParams(canvasWidth, canvasHeight, mouseX, mouseY, frameNumber, activeCount = null) {
    const v = this.#values;
    // FireParams: 20 f32/u32 = 80 bytes, round up to 96 for alignment
    const buf = new ArrayBuffer(96);
    const f32 = new Float32Array(buf);
    const u32 = new Uint32Array(buf);

    f32[0]  = 1 / 60;                          // dt
    u32[1]  = activeCount || v.particleCount;   // particle_count
    f32[2]  = canvasWidth;                      // canvas_width
    f32[3]  = canvasHeight;                     // canvas_height
    f32[4]  = v.buoyancy;                       // buoyancy
    f32[5]  = v.turbulence;                     // turbulence
    f32[6]  = v.turbulenceScale;                // turbulence_scale
    f32[7]  = v.windX;                          // wind_x
    f32[8]  = v.windY;                          // wind_y
    f32[9]  = v.coolingRate;                    // cooling_rate
    f32[10] = v.drag;                           // drag
    f32[11] = v.particleScale;                  // particle_scale
    f32[12] = v.glowIntensity;                  // glow_intensity
    f32[13] = v.smokeOpacity;                   // smoke_opacity
    f32[14] = mouseX;                           // mouse_x
    f32[15] = mouseY;                           // mouse_y
    f32[16] = v.cursorForce;                    // cursor_force
    u32[17] = frameNumber;                      // frame_number
    f32[18] = v.emissionWidth;                  // emission_width
    f32[19] = v.initialTemp;                    // initial_temp
    u32[20] = v.emissionRate;                   // emission_rate
    // emitter_shape: 0=line, 1=point, 2=circle
    u32[21] = v.emitterShape === 'point' ? 1 : v.emitterShape === 'circle' ? 2 : 0;
    // pad to 96 bytes
    f32[22] = 0;
    f32[23] = 0;

    return buf;
  }

  static get PARAMS() {
    return PARAM_DEFS;
  }
}
