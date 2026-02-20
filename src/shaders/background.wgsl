// background.wgsl — Dark gradient background for fire

@group(0) @binding(0) var<uniform> bg_params : vec4<f32>; // width, height, time, pad

struct VertexOut {
    @builtin(position) pos : vec4<f32>,
    @location(0) uv : vec2<f32>,
};

@vertex
fn vs_main(@builtin(vertex_index) vid : u32) -> VertexOut {
    let x = f32(i32(vid & 1u)) * 4.0 - 1.0;
    let y = f32(i32(vid >> 1u)) * 4.0 - 1.0;

    var out : VertexOut;
    out.pos = vec4(x, y, 0.0, 1.0);
    out.uv = vec2((x + 1.0) * 0.5, (1.0 - y) * 0.5);
    return out;
}

@fragment
fn fs_main(in : VertexOut) -> @location(0) vec4<f32> {
    // Vertical gradient: darker at top, slightly warm at bottom
    let t = in.uv.y;
    let top = vec3(0.01, 0.005, 0.002);
    let bottom = vec3(0.04, 0.018, 0.008);
    let color = mix(top, bottom, t * t);

    return vec4(color, 1.0);
}
