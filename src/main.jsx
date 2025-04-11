import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import "./services/firebase";
import { initializeConsent } from "./utils/consentManager";
import { enableMapSet } from "immer"; // Import the plugin enabler

enableMapSet(); // Call this *before* rendering your app!
initializeConsent();

createRoot(document.getElementById("root")).render(<App />);
