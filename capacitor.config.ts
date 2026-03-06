import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.ghostjobdetector.app",
  appName: "Ghost Job Detector",
  webDir: "dist/public",
  server: {
    url: "https://ghostjobdetector.org",
    cleartext: false,
  },
  ios: {
    contentInset: "automatic",
    preferredContentMode: "mobile",
    scheme: "Ghost Job Detector",
  },
  plugins: {
    StatusBar: {
      style: "dark",
    },
    Keyboard: {
      resize: "body",
      resizeOnFullScreen: true,
    },
  },
};

export default config;
