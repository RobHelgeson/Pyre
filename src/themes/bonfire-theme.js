// bonfire-theme.js — Circle emitter, wide chaotic multi-tongue flames

export const bonfireTheme = {
  name: 'bonfire',
  emitterShape: 'circle',
  defaults: {
    emissionWidth: 0.3,
    buoyancy: 1.2,
    turbulence: 2.0,
    turbulenceScale: 1.5,
    coolingRate: 0.5,
    particleScale: 3.0,
    glowIntensity: 1.3,
    smokeOpacity: 0.5,
  },
  background: {
    clearColor: [0.005, 0.002, 0.0, 1.0],
    topColor: [0.005, 0.002, 0.001],
    bottomColor: [0.035, 0.012, 0.005],
  },
};
