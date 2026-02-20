// fire-fragment.wgsl — Temperature-to-color mapping + gaussian falloff

struct VertexOut {
    @builtin(position) pos : vec4<f32>,
    @location(0) uv : vec2<f32>,
    @location(1) temperature : f32,
    @location(2) alpha : f32,
    @location(3) age_ratio : f32,
};

// Blackbody-inspired fire color ramp
// white-hot -> yellow -> orange -> red -> dark red/smoke
fn fireColor(temp: f32) -> vec3<f32> {
    // Core: bright white-yellow (temp > 0.8)
    let white = vec3(1.0, 0.95, 0.8);
    // Mid: orange-yellow (temp ~0.5-0.8)
    let orange = vec3(1.0, 0.45, 0.05);
    // Cool: deep red (temp ~0.2-0.5)
    let red = vec3(0.6, 0.1, 0.0);
    // Dying: dark smoke (temp < 0.2)
    let smoke = vec3(0.15, 0.08, 0.04);

    var color: vec3<f32>;
    if (temp > 0.75) {
        color = mix(orange, white, (temp - 0.75) / 0.25);
    } else if (temp > 0.4) {
        color = mix(red, orange, (temp - 0.4) / 0.35);
    } else if (temp > 0.15) {
        color = mix(smoke, red, (temp - 0.15) / 0.25);
    } else {
        color = smoke * (temp / 0.15);
    }
    return color;
}

@fragment
fn fs_main(in : VertexOut) -> @location(0) vec4<f32> {
    let centered = in.uv * 2.0 - 1.0;
    let dist2 = dot(centered, centered);

    if (dist2 > 1.0) {
        discard;
    }

    // Gaussian falloff
    let falloff_strength = mix(2.0, 4.0, in.temperature * 0.5);
    let intensity = exp(-dist2 * falloff_strength);

    let color = fireColor(in.temperature);

    // HDR: hot particles are brighter
    let hdr_mult = mix(0.3, 2.5, in.temperature * 0.7);

    let final_color = color * intensity * in.alpha * hdr_mult;

    return vec4(final_color, intensity * in.alpha * 0.8);
}
