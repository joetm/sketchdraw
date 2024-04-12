## SketchDraw

![sketchdraw](https://github.com/joetm/sketchdraw/blob/master/screenshots/screenshot-sideby-side-tn.jpg?raw=true)

A simple hybrid (android/web) app that converts rough sketches into artworks

Built with React, bootstrap-react, and Replicate.com, AWS API Gateway, AWS Lambda Functions, vite, and Capacitor.

### Installing

```bash
sudo apt update && sudo apt install android-sdk
npm install
npm i @capacitor/android
npx cap add android
```

### Running web app

```bash
npm run start
```

### Building web app

```bash
npm run build
```

### Updating the mobile app

```bash
npx cap sync
```

### Previewing the mobile app (on device or emulator)

```bash
npx cap run android
```

or

```bash
npx cap run android -- --verbose --sdk-info
```

