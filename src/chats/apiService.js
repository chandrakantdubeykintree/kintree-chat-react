// components/chats/apiService.js
import axios from "axios";
import { kintreeApi } from "@/services/kintreeApi";

// Get the base URL from environment variables or PHP config endpoint if available
// For now, assume PHP backend URL might be needed if different from Node server
// const PHP_BACKEND_URL = import.meta.env.VITE_PHP_BACKEND_URL || 'http://your-php-app.test/api';

// However, since Node is proxying, maybe all API calls go through Node first?
// Let's assume we have a specific endpoint on the PHP backend for uploads.
// We need the *actual* PHP backend URL here, not the Node proxy URL,
// unless Node also proxies file uploads (less common).

// Get PHP URL from Node server's env (this is awkward)
// Better: Define VITE_PHP_BACKEND_URL in .env
// .env
// VITE_PHP_BACKEND_URL=http://your-php-app.test/api

const PHP_BACKEND_URL = import.meta.env.VITE_PHP_BACKEND_URL;

if (!PHP_BACKEND_URL) {
  console.error(
    "Error: VITE_PHP_BACKEND_URL is not defined in the frontend .env file!"
  );
}

const apiClient = axios.create({
  baseURL: PHP_BACKEND_URL, // Use the direct PHP backend URL
  headers: {
    Accept: "application/json",
  },
});

export const fetchCurrentUser = async () => {
  try {
    // Assume your PHP backend has a '/user' or '/me' endpoint
    // that returns user data based on the Authorization header
    const response = await kintreeApi.get("/user"); // Or '/auth/me', etc.

    if (response.data && response.data.success && response.data.data) {
      return response.data.data; // Return the user object
    } else {
      throw new Error(
        response.data?.message || "Failed to fetch user data from server"
      );
    }
  } catch (error) {
    console.error(
      "API Fetch User Error:",
      error.response?.data || error.message
    );
    // Rethrow or handle specific errors (e.g., 401 Unauthorized)
    if (error.response?.status === 401) {
      throw new Error("Unauthorized"); // Specific error for auth failure
    }
    throw new Error(
      error.response?.data?.message ||
        error.message ||
        "Network error fetching user data"
    );
  }
};

// Function to upload a file and get attachment ID
export const uploadAttachment = async (token, file) => {
  if (!PHP_BACKEND_URL) {
    throw new Error("PHP Backend URL not configured.");
  }
  if (!token) {
    throw new Error("Authentication token is required for upload.");
  }
  if (!file) {
    throw new Error("File is required for upload.");
  }

  const formData = new FormData();

  formData.append("files[]", file);

  try {
    // Assuming your PHP upload endpoint is /attachments (POST)
    const response = await kintreeApi.post("/attachments", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    // Check the structure of your PHP response
    // Assuming it looks like: { success: true, data: { id: 123, url: '...', ... }, message: '...' }

    console.log("response from the api of attachment", response);

    if (response.data && response.data.success) {
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } else {
      throw new Error(
        response.data?.message || "Failed to process upload on server."
      );
    }
  } catch (error) {
    console.error("API Upload Error:", error.response?.data || error.message);
    throw new Error(
      error.response?.data?.message ||
        error.message ||
        "Network error during upload"
    );
  }
};

// You could add other direct PHP API calls here if needed, bypassing Node
export const fetchFamilyMembers = async (token) => {
  if (!token) {
    throw new Error("Authentication token is required.");
  }

  const url = "/family-tree/members"; // The specific endpoint

  try {
    const response = await kintreeApi.get(url);

    if (response.data && response.data.success) {
      // Filter only active members here or let the component do it
      const activeMembers = response.data.data.filter(
        (member) => member.is_active === 1
      );
      return activeMembers; // Return only active members
    } else {
      throw new Error(
        response.data?.message || "Failed to fetch family members"
      );
    }
  } catch (error) {
    console.error(
      "API Fetch Family Members Error:",
      error.response?.data || error.message
    );
    throw new Error(
      error.response?.data?.message ||
        error.message ||
        "Network error fetching members"
    );
  }
};
