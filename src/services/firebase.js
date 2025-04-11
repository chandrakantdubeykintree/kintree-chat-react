import { initializeApp } from "firebase/app";
import { getAnalytics, logEvent } from "firebase/analytics";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

let analytics = null;
let isInitialized = false;
let hasAnalyticsConsent = false;

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const initializeAnalytics = () => {
  if (isInitialized) return;

  try {
    if (typeof window !== "undefined" && import.meta.env.PROD) {
      analytics = getAnalytics(app);
      isInitialized = true;
    }
  } catch (error) {
    console.error("Failed to initialize analytics:", error);
  }
};

export const setAnalyticsConsent = (consent) => {
  hasAnalyticsConsent = consent;
};

// Helper function to safely log events
const logAnalyticsEvent = (eventName, eventParams = {}) => {
  if (!hasAnalyticsConsent || !analytics) {
    if (import.meta.env.DEV) {
      console.log("Analytics Event (Debug):", {
        name: eventName,
        params: eventParams,
      });
    }
    return;
  }

  try {
    logEvent(analytics, eventName, eventParams);
  } catch (error) {
    console.error("Analytics Error:", error);
  }
};

// Initialize on import
initializeAnalytics();

export { app, analytics, logAnalyticsEvent };
