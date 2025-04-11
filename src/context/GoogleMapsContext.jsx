import { createContext, useContext, useState } from "react";
import { LoadScript } from "@react-google-maps/api";

const GOOGLE_MAPS_LIBRARIES = ["places", "marker"];
const GoogleMapsContext = createContext(null);

export function GoogleMapsProvider({ children }) {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <LoadScript
      googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
      libraries={GOOGLE_MAPS_LIBRARIES}
      onLoad={() => setIsLoaded(true)}
    >
      <GoogleMapsContext.Provider value={{ isLoaded }}>
        {children}
      </GoogleMapsContext.Provider>
    </LoadScript>
  );
}

export const useGoogleMaps = () => {
  const context = useContext(GoogleMapsContext);
  if (!context) {
    throw new Error("useGoogleMaps must be used within a GoogleMapsProvider");
  }
  return context;
};
