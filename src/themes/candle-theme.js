// candle-theme.js — Point emitter, soft yellows, tight tall flame

export const candleTheme = {
  name: 'candle',
  emitterShape: 'point',
  defaults: {
    emissionWidth: 0.02,
    buoyancy: 2.0,
    turbulence: 0.6,
    turbulenceScale: 3.0,
    coolingRate: 1.2,
    particleScale: 1.5,
    glowIntensity: 1.8,
    smokeOpacity: 0.15,
  },
  background: {
    clearColor: [0.005, 0.003, 0.0, 1.0],
    topColor: [0.01, 0.005, 0.002],
    bottomColor: [0.03, 0.015, 0.005],
  },
};
