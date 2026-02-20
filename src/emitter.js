// emitter.js — CPU-side emitter logic: tracks how many particles to emit per frame

export class Emitter {
  #fractional = 0;

  /**
   * Returns how many particles to emit this frame.
   * Handles fractional accumulation for smooth low rates.
   */
  count(emissionRate, dt) {
    const exact = emissionRate * dt + this.#fractional;
    const whole = Math.floor(exact);
    this.#fractional = exact - whole;
    return whole;
  }

  reset() {
    this.#fractional = 0;
  }
}
