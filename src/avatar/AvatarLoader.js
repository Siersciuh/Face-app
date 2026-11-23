import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class AvatarLoader {
  constructor(scene) {
    this.scene = scene;
    this.root = null;
  }

  async load(url) {
    if (!url) return this.createPlaceholder();
    const gltf = await new GLTFLoader().loadAsync(url);
    this.setRoot(gltf.scene);
  }

  createPlaceholder() {
    const group = new THREE.Group();
    const skin = new THREE.MeshStandardMaterial({
      color: 0xd6c8b8,
      roughness: 0.72,
      metalness: 0.02,
    });
    const head = new THREE.Mesh(new THREE.SphereGeometry(1.15, 48, 32), skin);
    head.scale.set(0.82, 1.08, 0.78);
    head.position.y = 0.25;
    group.add(head);

    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.32, 20), skin);
    nose.rotation.x = Math.PI / 2;
    nose.position.set(0, 0.12, 0.98);
    group.add(nose);

    const eyeGeometry = new THREE.SphereGeometry(0.09, 20, 12);
    const eyeMaterial = new THREE.MeshStandardMaterial({ color: 0x1d232b });
    for (const x of [-0.38, 0.38]) {
      const eye = new THREE.Mesh(eyeGeometry, eyeMaterial);
      eye.position.set(x, 0.5, 0.86);
      eye.scale.z = 0.4;
      eye.name = x < 0 ? 'placeholderEyeLeft' : 'placeholderEyeRight';
      group.add(eye);
    }

    const mouth = new THREE.Mesh(
      new THREE.TorusGeometry(0.22, 0.025, 10, 32, Math.PI),
      new THREE.MeshStandardMaterial({ color: 0x7a4b50 }),
    );
    mouth.rotation.z = Math.PI;
    mouth.position.set(0, -0.38, 0.92);
    mouth.name = 'placeholderMouth';
    group.add(mouth);

    const label = this.makeLabel();
    label.position.set(0, -1.48, 0);
    group.add(label);
    group.userData.placeholder = true;
    this.setRoot(group);
  }

  makeLabel() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 128;
    const context = canvas.getContext('2d');
    context.fillStyle = 'rgba(8,13,24,0.9)';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = '#7dd3fc';
    context.font = '48px sans-serif';
    context.textAlign = 'center';
    context.fillText('ICT FACE MODEL - PLACEHOLDER', 512, 78);
    const texture = new THREE.CanvasTexture(canvas);
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(2.8, 0.35),
      new THREE.MeshBasicMaterial({ map: texture, transparent: true }),
    );
    return mesh;
  }

  setRoot(root) {
    if (this.root) this.scene.remove(this.root);
    this.root = root;
    this.root.scale.setScalar(1);
    this.scene.add(this.root);
  }

  applyExpressions(values) {
    if (!this.root) return;
    const jaw = values.jawOpen ?? 0;
    const smile = ((values.mouthSmileLeft ?? 0) + (values.mouthSmileRight ?? 0)) * 0.5;
    const blink = ((values.eyeBlinkLeft ?? 0) + (values.eyeBlinkRight ?? 0)) * 0.5;

    const mouth = this.root.getObjectByName('placeholderMouth');
    if (mouth) {
      mouth.scale.y = 1 + jaw * 1.3;
      mouth.position.y = -0.38 - jaw * 0.08;
      mouth.material.color.setRGB(0.48 - smile * 0.12, 0.29 - smile * 0.12, 0.31);
    }
    for (const name of ['placeholderEyeLeft', 'placeholderEyeRight']) {
      const eye = this.root.getObjectByName(name);
      if (eye) eye.scale.y = Math.max(0.08, 1 - blink * 0.95);
    }
  }

  applyHeadPose(pose, sensitivity = 1) {
    if (!this.root) return;
    this.root.rotation.x = -pose.rotation.x * 0.55 * sensitivity;
    this.root.rotation.y = pose.rotation.y * 0.75 * sensitivity;
    this.root.rotation.z = pose.rotation.z * 0.5 * sensitivity;
  }

  reset() {
    if (!this.root) return;
    this.root.rotation.set(0, 0, 0);
  }
}
