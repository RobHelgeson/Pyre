// emit.wgsl — Particle emission compute shader
// Finds dead particles and respawns them at the emitter

@group(0) @binding(0) var<storage, read_write> particles : array<Particle>;
@group(0) @binding(1) var<uniform> params : FireParams;
@group(0) @binding(2) var<storage, read_write> emit_counter : array<atomic<u32>>;

// PCG hash for pseudo-random numbers
fn pcg(input: u32) -> u32 {
    var state = input * 747796405u + 2891336453u;
    var word = ((state >> ((state >> 28u) + 4u)) ^ state) * 277803737u;
    return (word >> 22u) ^ word;
}

fn rand(seed: u32) -> f32 {
    return f32(pcg(seed)) / 4294967295.0;
}

@compute @workgroup_size(64)
fn cs_main(@builtin(global_invocation_id) gid : vec3<u32>) {
    let idx = gid.x;
    if (idx >= params.particle_count) { return; }

    let p = particles[idx];

    // Only respawn dead particles
    if ((p.flags & 1u) != 0u) { return; }

    // Atomically claim an emission slot
    let emit_idx = atomicAdd(&emit_counter[0], 1u);
    if (emit_idx >= params.emission_rate) { return; }

    // Random seeds based on particle index + frame
    let s0 = pcg(idx * 17u + params.frame_number * 31u);
    let s1 = pcg(s0);
    let s2 = pcg(s1);
    let s3 = pcg(s2);
    let s4 = pcg(s3);

    let r0 = rand(s0);  // position along emitter
    let r1 = rand(s1);  // vertical jitter
    let r2 = rand(s2);  // horizontal velocity jitter
    let r3 = rand(s3);  // vertical velocity
    let r4 = rand(s4);  // lifetime variation

    // Emitter position: bottom center of screen
    let cx = params.canvas_width * 0.5;
    let cy = params.canvas_height * 0.85;  // near bottom
    let half_w = params.emission_width * params.canvas_width * 0.5;

    var px: f32;
    var py: f32;

    // Shape: 0=line, 1=point, 2=circle
    if (params.emitter_shape == 1u) {
        // Point emitter
        px = cx + (r0 - 0.5) * 4.0;  // tiny jitter
        py = cy + (r1 - 0.5) * 4.0;
    } else if (params.emitter_shape == 2u) {
        // Circle emitter
        let angle = r0 * 6.283185;
        let radius = sqrt(r1) * half_w;
        px = cx + cos(angle) * radius;
        py = cy + sin(angle) * radius * 0.3;  // flatten vertically
    } else {
        // Line emitter (default)
        px = cx + (r0 - 0.5) * 2.0 * half_w;
        py = cy + (r1 - 0.5) * 6.0;  // small vertical jitter
    }

    // Initial velocity: mostly upward with jitter
    let vx = (r2 - 0.5) * 30.0;
    let vy = -(20.0 + r3 * 40.0);  // negative = upward in screen coords

    // Lifetime between 1.5 and 3.5 seconds
    let life = 1.5 + r4 * 2.0;

    var np: Particle;
    np.pos = vec2(px, py);
    np.vel = vec2(vx, vy);
    np.temperature = params.initial_temp;
    np.age = 0.0;
    np.life = life;
    np.flags = 1u;  // alive

    particles[idx] = np;
}
