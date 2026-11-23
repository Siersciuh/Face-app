export class HeadPose {
  constructor() {
    this.rotation = { x: 0, y: 0, z: 0 };
    this.translation = { x: 0, y: 0, z: 0 };
  }

  update(matrix) {
    if (!matrix?.data) return;
    const m = matrix.data;
    this.rotation.x = Math.atan2(m[9], m[10]);
    this.rotation.y = Math.atan2(-m[8], Math.sqrt(m[9] * m[9] + m[10] * m[10]));
    this.rotation.z = Math.atan2(m[4], m[0]);
    this.translation.x = m[12] || 0;
    this.translation.y = m[13] || 0;
    this.translation.z = m[14] || 0;
  }

  reset() {
    this.rotation = { x: 0, y: 0, z: 0 };
    this.translation = { x: 0, y: 0, z: 0 };
  }
}
