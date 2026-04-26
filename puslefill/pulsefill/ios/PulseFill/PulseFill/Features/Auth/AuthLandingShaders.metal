#include <metal_stdlib>
using namespace metal;

struct VertexOut {
    float4 position [[position]];
    float2 uv;
};

struct AuthLandingUniforms {
    float time;
    float width;
    float height;
};

vertex VertexOut authLandingVertex(uint vertexID [[vertex_id]]) {
    float2 positions[3] = {
        float2(-1.0, -1.0),
        float2(3.0, -1.0),
        float2(-1.0, 3.0)
    };

    VertexOut out;
    out.position = float4(positions[vertexID], 0.0, 1.0);
    out.uv = positions[vertexID] * 0.5 + 0.5;
    return out;
}

float hash21(float2 p) {
    p = fract(p * float2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
}

float noise(float2 p) {
    float2 i = floor(p);
    float2 f = fract(p);

    float a = hash21(i);
    float b = hash21(i + float2(1.0, 0.0));
    float c = hash21(i + float2(0.0, 1.0));
    float d = hash21(i + float2(1.0, 1.0));

    float2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x)
        + (c - a) * u.y * (1.0 - u.x)
        + (d - b) * u.x * u.y;
}

fragment float4 authLandingFragment(
    VertexOut in [[stage_in]],
    constant AuthLandingUniforms &uniforms [[buffer(0)]]
) {
    float2 uv = in.uv;
    float aspect = uniforms.width / max(uniforms.height, 1.0);
    float2 p = float2((uv.x - 0.5) * aspect, uv.y - 0.5);

    float t = uniforms.time * 0.06;

    float baseNoise = noise(p * 4.0 + t);
    float fineNoise = noise(p * 18.0 - t * 2.0);

    float emberTop = smoothstep(1.05, 0.12, length(p - float2(0.24, -0.34)));
    float emberBottom = smoothstep(0.85, 0.1, length(p - float2(-0.35, 0.5)));
    float pulse = 0.76 + 0.24 * sin(uniforms.time * 0.45);

    // ~18% calmer ember vs prior — background supports UI, not competing with it.
    float ember = (emberTop * 0.39 + emberBottom * 0.18) * pulse;
    ember += baseNoise * 0.028;
    ember += fineNoise * 0.009;

    float diagonal = smoothstep(-0.32, 0.4, p.x + p.y * 0.24);
    float vignette = smoothstep(1.08, 0.2, length(p));

    // Warm near-black base — Metal stays atmospheric, not loud orange.
    float3 base = float3(0.09, 0.055, 0.045);
    float3 emberColor = float3(0.88, 0.30, 0.10);
    float3 wine = float3(0.14, 0.06, 0.04);

    float3 color = base;
    color = mix(color, wine, diagonal * 0.06);
    color += emberColor * ember * 0.095;
    color *= vignette * 0.88;

    return float4(color, 1.0);
}
