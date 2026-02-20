// simulate.wgsl — Fire physics: buoyancy, turbulence, wind, cursor, cooling, drag
// Expects shared-structs.wgsl + noise.wgsl prepended

@group(0) @binding(0) var<storage, read_write> particles : array<Particle>;
@group(0) @binding(1) var<uniform> params : FireParams;

@compute @workgroup_size(64)
fn cs_main(@builtin(global_invocation_id) gid : vec3<u32>) {
    let idx = gid.x;
    if (idx >= params.particle_count) { return; }

    var p = particles[idx];
    if ((p.flags & 1u) == 0u) { return; }  // skip dead

    let dt = params.dt;
    let temp = p.temperature;

    // --- Buoyancy (upward force proportional to temperature) ---
    // Negative Y = up in screen coordinates
    let buoyancy_force = -params.buoyancy * temp * 200.0;
    p.vel.y += buoyancy_force * dt;

    // --- Turbulence (3D simplex noise displacement) ---
    let noise_pos = vec3(
        p.pos.x * params.turbulence_scale * 0.003,
        p.pos.y * params.turbulence_scale * 0.003,
        f32(params.frame_number) * 0.02
    );
    let noise_x = snoise3(noise_pos);
    let noise_y = snoise3(noise_pos + vec3(100.0, 200.0, 300.0));
    p.vel.x += noise_x * params.turbulence * 80.0 * dt;
    p.vel.y += noise_y * params.turbulence * 40.0 * dt;

    // --- Wind ---
    p.vel.x += params.wind_x * 100.0 * dt;
    p.vel.y += params.wind_y * 100.0 * dt;

    // --- Cursor wind (radial push) ---
    if (params.cursor_force > 0.0) {
        let to_cursor = vec2(params.mouse_x - p.pos.x, params.mouse_y - p.pos.y);
        let dist2 = dot(to_cursor, to_cursor) + 1.0;
        let push_radius = 150.0;
        if (dist2 < push_radius * push_radius) {
            let strength = params.cursor_force * 5000.0 / dist2;
            let dir = normalize(to_cursor);
            p.vel -= dir * strength * dt;
        }
    }

    // --- Drag ---
    p.vel *= params.drag;

    // --- Integrate position ---
    p.pos += p.vel * dt;

    // --- Cooling ---
    p.temperature -= params.cooling_rate * dt * 0.5;
    p.age += dt;

    // --- Kill if too cold or too old ---
    if (p.temperature <= 0.0 || p.age >= p.life) {
        p.temperature = 0.0;
        p.flags = 0u;  // dead
    }

    particles[idx] = p;
}
