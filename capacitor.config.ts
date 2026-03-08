import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.ghostjobdetector.app",
  appName: "Ghost Job Detector",
  webDir: "dist/public",
  server: {
    url: "https://workspace-jacobspindle1.replit.app",
    cleartext: false,
  },
  ios: {
    contentInset: "automatic",
    preferredContentMode: "mobile",
    scheme: "Ghost Job Detector",
  },
  android: {
    allowMixedContent: false,
    backgroundColor: "#111418",
    buildOptions: {
      keystorePath: undefined,
      keystoreAlias: undefined,
    },
  },
  plugins: {
    StatusBar: {
      style: "dark",
      backgroundColor: "#111418",
    },
    Keyboard: {
      resize: "body",
      resizeOnFullScreen: true,
    },
    SplashScreen: {
      launchAutoHide: true,
      backgroundColor: "#111418",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
  },
};

export default config;
