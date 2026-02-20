// fire-vertex.wgsl — Instanced quad vertex shader for fire particles
// Expects shared-structs.wgsl prepended

@group(0) @binding(0) var<storage, read> particles : array<Particle>;
@group(0) @binding(1) var<uniform> params : FireParams;

struct VertexOut {
    @builtin(position) pos : vec4<f32>,
    @location(0) uv : vec2<f32>,
    @location(1) temperature : f32,
    @location(2) alpha : f32,
    @location(3) age_ratio : f32,
};

const QUAD_POS = array<vec2<f32>, 6>(
    vec2(-1.0, -1.0),
    vec2( 1.0, -1.0),
    vec2(-1.0,  1.0),
    vec2(-1.0,  1.0),
    vec2( 1.0, -1.0),
    vec2( 1.0,  1.0),
);

@vertex
fn vs_main(
    @builtin(vertex_index) vid : u32,
    @builtin(instance_index) iid : u32,
) -> VertexOut {
    let p = particles[iid];
    let alive = (p.flags & 1u) != 0u;

    var out : VertexOut;
    if (!alive) {
        // Off-screen for dead particles
        out.pos = vec4(0.0, 0.0, -2.0, 1.0);
        out.uv = vec2(0.0);
        out.temperature = 0.0;
        out.alpha = 0.0;
        out.age_ratio = 1.0;
        return out;
    }

    let temp = clamp(p.temperature, 0.0, 2.0);
    let age_ratio = clamp(p.age / p.life, 0.0, 1.0);

    // Size: hotter = smaller bright core, cooler = larger smoke
    // Base size grows as particle cools
    let base_size = mix(3.0, 12.0, 1.0 - temp * 0.5) * params.particle_scale;

    let corner = QUAD_POS[vid];
    let world_pos = p.pos + corner * base_size;

    let clip_x = (world_pos.x / params.canvas_width) * 2.0 - 1.0;
    let clip_y = 1.0 - (world_pos.y / params.canvas_height) * 2.0;

    // Alpha fades with temperature
    let alpha = smoothstep(0.0, 0.15, temp);

    out.pos = vec4(clip_x, clip_y, 0.0, 1.0);
    out.uv = corner * 0.5 + 0.5;
    out.temperature = temp;
    out.alpha = alpha;
    out.age_ratio = age_ratio;
    return out;
}
