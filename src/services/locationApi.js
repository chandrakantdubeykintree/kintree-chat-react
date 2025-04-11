import axios from "axios";
import { handleApiError } from "../services/errorHandling";

export const locationApi = axios.create({
  baseURL: import.meta.env.VITE_GOOGLE_LOCATION_COMPLETE_API,
  headers: {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "*",
    "Access-Control-Allow-Methods": "*",
    "Access-Control-Allow-Credentials": "true",
    "Content-Type": "application/json",
  },
});

export const searchLocation = async (location) => {
  if (!location?.trim()) return [];

  try {
    const response = await locationApi.get("", {
      params: {
        key: import.meta.env.VITE_GOOGLE_LOCATION_KEY,
        input: location,
        language: "en",
      },
    });

    return await response.data;
  } catch (error) {
    handleApiError(error, "Failed to fetch location");
  }
};
