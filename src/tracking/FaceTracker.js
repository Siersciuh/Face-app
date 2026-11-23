import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

export class FaceTracker {
  constructor(onResult) {
    this.onResult = onResult;
    this.landmarker = null;
    this.lastVideoTime = -1;
  }

  async initialize() {
    const vision = await FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.32/wasm',
    );
    this.landmarker = await FaceLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
        delegate: 'GPU',
      },
      runningMode: 'VIDEO',
      numFaces: 1,
      outputFaceBlendshapes: true,
      outputFacialTransformationMatrixes: true,
    });
  }

  detect(video, timestamp) {
    if (!this.landmarker || video.readyState < 2) return;
    if (timestamp <= this.lastVideoTime) return;
    this.lastVideoTime = timestamp;
    const result = this.landmarker.detectForVideo(video, timestamp);
    this.onResult(result);
  }

  close() {
    this.landmarker?.close();
  }
}
