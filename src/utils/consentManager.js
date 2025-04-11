import { setAnalyticsConsent } from "../services/firebase";

export const initializeConsent = () => {
  // Check for existing consent
  const storedConsent = localStorage.getItem("analytics-consent");
  if (storedConsent) {
    setAnalyticsConsent(storedConsent === "true");
  }
};

export const updateConsent = (consent) => {
  localStorage.setItem("analytics-consent", consent);
  setAnalyticsConsent(consent);
};
