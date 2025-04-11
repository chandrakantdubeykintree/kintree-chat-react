import { useGoogleMaps } from "@/context/GoogleMapsContext";
import { GoogleMap, Marker } from "@react-google-maps/api"; // Import Marker
import { useEffect, useState, useCallback } from "react";

const mapContainerStyle = {
  width: "100%",
  height: "400px",
  borderRadius: "0.5rem",
};

export function Map({ place, className }) {
  const [coordinates, setCoordinates] = useState(null);
  const { isLoaded } = useGoogleMaps();

  useEffect(() => {
    if (!isLoaded || !place) return;

    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ address: place }, (results, status) => {
      if (status === "OK") {
        const { lat, lng } = results[0].geometry.location;
        setCoordinates({ lat: lat(), lng: lng() });
      } else {
        console.error("Geocoding failed:", status);
      }
    });
  }, [place, isLoaded]);

  if (!isLoaded) {
    return (
      <div
        className={`${className} flex items-center justify-center bg-gray-100`}
        style={mapContainerStyle}
      >
        Loading Google Maps...
      </div>
    );
  }

  if (!coordinates) {
    return (
      <div
        className={`${className} flex items-center justify-center bg-gray-100`}
        style={mapContainerStyle}
      >
        Loading location...
      </div>
    );
  }

  return (
    <div className={className}>
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={coordinates}
        zoom={15}
        options={{
          zoomControl: true,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: true,
        }}
      >
        <Marker position={coordinates} title={place} />
      </GoogleMap>
    </div>
  );
}
