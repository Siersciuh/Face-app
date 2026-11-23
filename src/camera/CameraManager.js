export class CameraManager {
  constructor(video) {
    this.video = video;
    this.stream = null;
  }

  async start(facingMode = 'user') {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error('This browser does not support camera access.');
    }
    if (this.stream) this.stop();
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        facingMode,
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
    });
    this.video.srcObject = this.stream;
    await this.video.play();
  }

  stop() {
    this.stream?.getTracks().forEach((track) => track.stop());
    this.stream = null;
    this.video.srcObject = null;
  }

  async switchCamera() {
    const next = this.getCurrentFacingMode() === 'environment' ? 'user' : 'environment';
    await this.start(next);
  }

  getCurrentFacingMode() {
    const track = this.stream?.getVideoTracks()[0];
    return track?.getSettings().facingMode || 'user';
  }
}
