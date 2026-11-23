import './styles.css';
import { icon } from './ui/icons.js';
import { CameraManager } from './camera/CameraManager.js';
import { FaceTracker } from './tracking/FaceTracker.js';
import { HeadPose } from './tracking/HeadPose.js';
import { ExpressionAdapter } from './expressions/ExpressionAdapter.js';
import { AvatarLoader } from './avatar/AvatarLoader.js';
import { AvatarRenderer } from './renderer/AvatarRenderer.js';

const app = document.querySelector('#app');
app.innerHTML = `
  <main class="app-shell">
    <header class="topbar">
      <div class="brand"><div class="brand-mark">${icon('cube', 22)}</div><div><div class="brand-name">ICT FACE LIVE</div><div class="brand-sub">REAL-TIME AVATAR</div></div></div>
      <div class="top-actions">
        <button id="switchCamera" class="icon-button" title="Switch camera">${icon('switch')}<span class="switch-label">Switch</span></button>
        <button id="toggleDebug" class="icon-button" title="Toggle diagnostics">${icon('debug')}</button>
      </div>
    </header>
    <nav class="mobile-tabs" aria-label="View mode">
      <button class="mobile-tab" data-view="camera">${icon('camera', 16)} Camera</button>
      <button class="mobile-tab active" data-view="split">${icon('cube', 16)} Split</button>
      <button class="mobile-tab" data-view="avatar">${icon('cube', 16)} 3D</button>
    </nav>
    <section class="workspace" data-view="split">
      <article class="panel camera-panel">
        <div class="panel-header"><div class="panel-title">${icon('camera', 18)} LIVE CAMERA</div><div id="cameraStatus" class="status-pill"><i class="status-dot"></i><span>Off</span></div></div>
        <div class="camera-stage">
          <video id="cameraVideo" class="camera-video" muted playsinline></video>
          <canvas id="landmarkCanvas" class="landmark-canvas"></canvas>
          <div id="cameraEmpty" class="camera-empty">
            <div class="empty-icon">${icon('camera', 34)}</div><h2>Camera is not active</h2>
            <p>Start your camera to track your face locally in real time.</p>
            <button id="startCamera" class="start-button">Start camera</button>
          </div>
          <div id="cameraError" class="error-banner" hidden></div>
        </div>
      </article>
      <article class="panel avatar-panel">
        <div class="panel-header"><div class="panel-title">${icon('cube', 18)} 3D AVATAR</div><button id="resetAvatar" class="icon-button" title="Reset avatar pose">${icon('reset', 18)}</button></div>
        <div id="avatarStage" class="avatar-stage"></div>
        <div class="placeholder-caption">Technical placeholder - real ICT asset can be loaded via GLB</div>
      </article>
    </section>
    <aside id="debugPanel" class="debug-panel">
      <div class="debug-head"><span>Diagnostics</span><span id="debugClose" style="cursor:pointer">×</span></div>
      <div class="debug-body">
        <div class="metric"><span>FPS</span><strong id="fps">0</strong></div>
        <div class="metric"><span>Faces</span><strong id="faceCount">0</strong></div>
        <div class="metric"><span>Frame time</span><strong id="frameTime">0 ms</strong></div>
        <div class="metric"><span>Tracking</span><strong id="trackingStatus">Idle</strong></div>
        <div class="metric"><span>WebGL</span><strong id="webglStatus">Checking</strong></div>
        <div class="metric"><span>Yaw / Pitch / Roll</span><strong id="headValues">0 / 0 / 0</strong></div>
        <div class="settings">
          <div class="setting"><label><span>Sensitivity</span><span id="sensitivityValue">1.0</span></label><input id="sensitivity" type="range" min="0.2" max="2" step="0.1" value="1"></div>
          <div class="setting"><label><span>Smoothing</span><span id="smoothingValue">65%</span></label><input id="smoothing" type="range" min="0" max="0.95" step="0.05" value="0.65"></div>
          <div class="setting"><label><span>Amplitude</span><span id="amplitudeValue">1.0</span></label><input id="amplitude" type="range" min="0.2" max="2" step="0.1" value="1"></div>
        </div>
        <div class="blend-list" id="blendList"></div>
      </div>
    </aside>
  </main>
`;

const video = document.querySelector('#cameraVideo');
const canvas = document.querySelector('#landmarkCanvas');
const cameraStatus = document.querySelector('#cameraStatus');
const cameraEmpty = document.querySelector('#cameraEmpty');
const cameraError = document.querySelector('#cameraError');
const startButton = document.querySelector('#startCamera');
const workspace = document.querySelector('.workspace');
const avatarStage = document.querySelector('#avatarStage');
const camera = new CameraManager(video);
const headPose = new HeadPose();
const expressions = new ExpressionAdapter();
const avatarRenderer = new AvatarRenderer(avatarStage);
const avatarLoader = new AvatarLoader(avatarRenderer.scene);
avatarLoader.createPlaceholder();

let trackingEnabled = false;
let faceTracker = null;
let faceCount = 0;
let frameCount = 0;
let fpsTime = performance.now();
let trackingAnimation = 0;

function setStatus(active, text) {
  cameraStatus.classList.toggle('online', active);
  cameraStatus.querySelector('span').textContent = text;
}

function showError(error) {
  let message = error.message || 'Could not start the camera.';
  if (error.name === 'NotAllowedError') message = 'Camera permission was denied. Allow camera access in browser settings and try again.';
  if (error.name === 'NotFoundError') message = 'No camera was found on this device.';
  if (error.name === 'NotReadableError') message = 'The camera is busy or unavailable. Close other apps using it and try again.';
  cameraError.textContent = message;
  cameraError.hidden = false;
  setStatus(false, 'Error');
}

function drawLandmarks(landmarks) {
  const context = canvas.getContext('2d');
  const rect = canvas.getBoundingClientRect();
  if (canvas.width !== rect.width || canvas.height !== rect.height) {
    canvas.width = rect.width;
    canvas.height = rect.height;
  }
  context.clearRect(0, 0, canvas.width, canvas.height);
  if (!landmarks) return;
  context.fillStyle = '#38bdf8';
  for (const point of landmarks) {
    context.beginPath();
    context.arc(point.x * canvas.width, point.y * canvas.height, 1.1, 0, Math.PI * 2);
    context.fill();
  }
}

function handleResult(result) {
  const start = performance.now();
  faceCount = result.faceLandmarks?.length || 0;
  document.querySelector('#faceCount').textContent = faceCount;
  document.querySelector('#trackingStatus').textContent = faceCount ? 'Tracking' : 'Searching';
  if (!faceCount) {
    drawLandmarks(null);
    return;
  }
  const blendshapes = result.faceBlendshapes?.[0]?.categories || [];
  const currentExpressions = expressions.process(blendshapes, {
    smoothing: Number(document.querySelector('#smoothing').value),
    amplitude: Number(document.querySelector('#amplitude').value),
  });
  avatarLoader.applyExpressions(currentExpressions);
  if (result.facialTransformationMatrixes?.[0]) headPose.update(result.facialTransformationMatrixes[0]);
  avatarLoader.applyHeadPose(headPose, Number(document.querySelector('#sensitivity').value));
  drawLandmarks(result.faceLandmarks[0]);
  document.querySelector('#frameTime').textContent = `${Math.round(performance.now() - start)} ms`;
  document.querySelector('#headValues').textContent =
    `${headPose.rotation.y.toFixed(2)} / ${headPose.rotation.x.toFixed(2)} / ${headPose.rotation.z.toFixed(2)}`;
  updateBlendList(blendshapes);
}

function updateBlendList(blendshapes) {
  const list = document.querySelector('#blendList');
  list.innerHTML = blendshapes.slice(0, 18).map((item) => {
    const score = item.score || 0;
    return `<div class="blend-row"><span>${item.categoryName}</span><div class="blend-bar"><i style="width:${score * 100}%"></i></div><strong>${score.toFixed(2)}</strong></div>`;
  }).join('');
}

async function initializeTracker() {
  if (faceTracker) return;
  faceTracker = new FaceTracker(handleResult);
  document.querySelector('#trackingStatus').textContent = 'Loading';
  await faceTracker.initialize();
  document.querySelector('#trackingStatus').textContent = 'Ready';
}

async function startCamera() {
  cameraError.hidden = true;
  startButton.disabled = true;
  startButton.textContent = 'Starting...';
  try {
    await camera.start();
    video.classList.add('live');
    cameraEmpty.hidden = true;
    setStatus(true, 'Live');
    await initializeTracker();
    trackingEnabled = true;
    trackingLoop();
  } catch (error) {
    showError(error);
  } finally {
    startButton.disabled = false;
    startButton.textContent = 'Start camera';
  }
}

function trackingLoop(timestamp = performance.now()) {
  if (!trackingEnabled) return;
  frameCount++;
  if (timestamp - fpsTime >= 500) {
    document.querySelector('#fps').textContent = Math.round(frameCount * 1000 / (timestamp - fpsTime));
    frameCount = 0;
    fpsTime = timestamp;
  }
  faceTracker.detect(video, timestamp);
  avatarRenderer.render();
  trackingAnimation = requestAnimationFrame(trackingLoop);
}

startButton.addEventListener('click', startCamera);
document.querySelector('#switchCamera').addEventListener('click', async () => {
  try { await camera.switchCamera(); } catch (error) { showError(error); }
});
document.querySelector('#toggleDebug').addEventListener('click', () => {
  document.querySelector('#debugPanel').classList.add('open');
  document.querySelector('#toggleDebug').classList.add('active');
});
document.querySelector('#debugClose').addEventListener('click', () => {
  document.querySelector('#debugPanel').classList.remove('open');
  document.querySelector('#toggleDebug').classList.remove('active');
});
document.querySelector('#resetAvatar').addEventListener('click', () => {
  avatarLoader.reset();
  avatarRenderer.resetView();
  headPose.reset();
});
document.querySelectorAll('.mobile-tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.mobile-tab').forEach((item) => item.classList.remove('active'));
    tab.classList.add('active');
    workspace.dataset.view = tab.dataset.view;
  });
});
for (const id of ['sensitivity', 'smoothing', 'amplitude']) {
  document.querySelector(`#${id}`).addEventListener('input', (event) => {
    const value = Number(event.target.value);
    if (id === 'sensitivity') document.querySelector('#sensitivityValue').textContent = value.toFixed(1);
    if (id === 'smoothing') document.querySelector('#smoothingValue').textContent = `${Math.round(value * 100)}%`;
    if (id === 'amplitude') document.querySelector('#amplitudeValue').textContent = value.toFixed(1);
  });
}
document.querySelector('#webglStatus').textContent =
  !!window.WebGLRenderingContext && !!document.createElement('canvas').getContext('webgl') ? 'Available' : 'Unavailable';
video.addEventListener('ended', () => {
  trackingEnabled = false;
  cancelAnimationFrame(trackingAnimation);
  setStatus(false, 'Lost');
  video.classList.remove('live');
  cameraEmpty.hidden = false;
});
