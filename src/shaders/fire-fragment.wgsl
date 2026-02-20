// fire-fragment.wgsl — Temperature-to-color mapping + gaussian falloff

struct VertexOut {
    @builtin(position) pos : vec4<f32>,
    @location(0) uv : vec2<f32>,
    @location(1) temperature : f32,
    @location(2) alpha : f32,
    @location(3) age_ratio : f32,
};

// Vivid blackbody-inspired fire color ramp
fn fireColor(temp: f32) -> vec3<f32> {
    let white_hot = vec3(1.0, 0.9, 0.55);
    let yellow    = vec3(1.0, 0.65, 0.0);
    let orange    = vec3(1.0, 0.3, 0.0);
    let red       = vec3(0.8, 0.05, 0.0);
    let ember     = vec3(0.35, 0.02, 0.0);
    let smoke     = vec3(0.06, 0.03, 0.015);

    var color: vec3<f32>;
    if (temp > 0.85) {
        color = mix(yellow, white_hot, (temp - 0.85) / 0.15);
    } else if (temp > 0.6) {
        color = mix(orange, yellow, (temp - 0.6) / 0.25);
    } else if (temp > 0.35) {
        color = mix(red, orange, (temp - 0.35) / 0.25);
    } else if (temp > 0.15) {
        color = mix(ember, red, (temp - 0.15) / 0.2);
    } else if (temp > 0.05) {
        color = mix(smoke, ember, (temp - 0.05) / 0.1);
    } else {
        color = smoke * (temp / 0.05);
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

    // Very tight gaussian — most energy concentrated at center
    let falloff_strength = mix(3.0, 8.0, clamp(in.temperature, 0.0, 1.0));
    let intensity = exp(-dist2 * falloff_strength);

    let color = fireColor(in.temperature);

    // LOW per-particle contribution to prevent additive blowout
    // Hot particles: small but colorful. Cool: dim wisps.
    let t = clamp(in.temperature, 0.0, 1.0);
    let hdr_mult = mix(0.02, 0.35, t * t) * in.alpha;

    let final_color = color * intensity * hdr_mult;

    return vec4(final_color, intensity * in.alpha * 0.5);
}
