# Pyre

Procedural fire simulation using WebGPU compute shaders. Runs at 60+ fps with up to 200k particles.

## Controls

| Key | Action |
|-----|--------|
| **Space** | Pause / Resume |
| **H** | Toggle UI panel |
| **F** | Fullscreen |
| **R** | Reset emitter |
| **Escape** | Show cursor |
| **Mouse** | Wind push (blow on flame) |

## Themes

- **Campfire** — Line emitter, warm classic flame
- **Candle** — Point emitter, tight tall flame
- **Bonfire** — Circle emitter, wide chaotic flames

## Requirements

WebGPU-capable browser:
- Chrome 113+
- Edge 113+
- Safari 18+ (macOS Sequoia)

## Tech

- WebGPU compute shaders (WGSL)
- HDR rendering with ACES tonemapping
- Simplex noise turbulence
- No build step — vanilla ES6 modules
- lil-gui for parameter UI
