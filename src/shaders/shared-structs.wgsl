// shared-structs.wgsl — Prepended to shaders that need Particle / FireParams

struct Particle {
    pos:         vec2<f32>,  // xy position (pixel coords)
    vel:         vec2<f32>,  // xy velocity
    temperature: f32,        // 0 = dead/cold, 1 = max heat
    age:         f32,        // seconds alive
    life:        f32,        // max lifetime (seconds)
    flags:       u32,        // bit 0: alive
};

struct FireParams {
    dt:               f32,   // 0
    particle_count:   u32,   // 1
    canvas_width:     f32,   // 2
    canvas_height:    f32,   // 3
    buoyancy:         f32,   // 4
    turbulence:       f32,   // 5
    turbulence_scale: f32,   // 6
    wind_x:           f32,   // 7
    wind_y:           f32,   // 8
    cooling_rate:     f32,   // 9
    drag:             f32,   // 10
    particle_scale:   f32,   // 11
    glow_intensity:   f32,   // 12
    smoke_opacity:    f32,   // 13
    mouse_x:          f32,   // 14
    mouse_y:          f32,   // 15
    cursor_force:     f32,   // 16
    frame_number:     u32,   // 17
    emission_width:   f32,   // 18
    initial_temp:     f32,   // 19
    emission_rate:    u32,   // 20
    emitter_shape:    u32,   // 21  (0=line, 1=point, 2=circle)
    _pad0:            f32,   // 22
    _pad1:            f32,   // 23
};
