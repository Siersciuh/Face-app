export class ExpressionAdapter {
  constructor() {
    this.enabled = new Map();
    this.previous = new Map();
  }

  process(blendshapes, settings = {}) {
    const smoothing = settings.smoothing ?? 0.65;
    const deadZone = settings.deadZone ?? 0.018;
    const amplitude = settings.amplitude ?? 1;
    const output = {};

    for (const item of blendshapes || []) {
      let value = Math.max(0, Math.min(1, item.score));
      if (value < deadZone) value = 0;
      value = Math.min(1, value * amplitude);
      const previous = this.previous.get(item.categoryName) ?? value;
      value = previous * smoothing + value * (1 - smoothing);
      this.previous.set(item.categoryName, value);
      output[item.categoryName] = value;
    }

    return output;
  }

  setChannelEnabled(channel, enabled) {
    this.enabled.set(channel, enabled);
  }
}
