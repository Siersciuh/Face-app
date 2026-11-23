# ICT Face Live

Browser-based real-time face tracking and 3D avatar application built with Vite, Three.js and MediaPipe Tasks Vision.

## Start locally

1. Open a terminal in this repository.
2. Run `npm install`.
3. Run `npm run dev`.
4. Open the local address printed by Vite.
5. Click **Start camera** and allow browser camera access.

Camera access requires HTTPS or `localhost`.

## Build

```bash
npm install
npm run build
```

The deployable files are created in `dist/`.

## Deploy to GitHub Pages

1. Create or open the repository on GitHub.
2. Open **Settings** → **Pages**.
3. Under **Build and deployment**, select **GitHub Actions**.
4. Push this repository to the `main` branch.
5. Open **Actions** and wait for the `Deploy to GitHub Pages` workflow to finish.
6. The app is published at `https://USERNAME.github.io/Face-app/`.

The included workflow builds the app and publishes `dist/`. Vite uses relative asset paths so the app can work under a repository subpath.

## Connecting an ICT 3D model

Place a GLB or glTF model in `assets/`, then load it through `AvatarLoader.load(url)`. The current app intentionally shows a clearly labeled technical placeholder until a real ICT rigged asset is supplied.

The placeholder does not claim to contain a real ICT rig or morph targets. The expression and head-pose adapters are prepared for later real blendshape and mesh-rig integration.

## Privacy

The camera image and face tracking data are processed entirely in the browser. The app has no backend and does not upload camera frames, images, landmarks or recordings.
