import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.oldtimerdocs.app",
  appName: "Oldtimer Docs",
  webDir: "out",
  server: {
    // In production: load the live Vercel URL
    url: "https://my-first-app-blambernd.vercel.app",
    cleartext: false,
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 2000,
      backgroundColor: "#1a2744", // hsl(220, 60%, 22%) approx
      showSpinner: false,
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#1a2744",
    },
  },
  ios: {
    contentInset: "always",
    allowsLinkPreview: false,
    scheme: "oldtimerdocs",
  },
  android: {
    allowMixedContent: false,
    backgroundColor: "#1a2744",
  },
};

export default config;
