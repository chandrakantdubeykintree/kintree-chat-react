import toast from "react-hot-toast";

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

export const handleApiError = (error, customMessage) => {
  const message =
    error.response?.data?.message || customMessage || "Something went wrong";
  const status = error.response?.status;
  const data = error.response?.data;

  toast.error(message);

  return new ApiError(message, status, data);
};

// Authentication error types
export const AUTH_ERROR_TYPES = {
  NETWORK_ERROR: "NETWORK_ERROR",
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  SERVER_ERROR: "SERVER_ERROR",
  SESSION_EXPIRED: "SESSION_EXPIRED",
  UNKNOWN_ERROR: "UNKNOWN_ERROR",
};

// User-friendly error messages
export const getErrorMessage = (errorType) => {
  switch (errorType) {
    case AUTH_ERROR_TYPES.NETWORK_ERROR:
      return "Unable to connect to the server. Please check your internet connection.";
    case AUTH_ERROR_TYPES.INVALID_CREDENTIALS:
      return "Invalid email or password. Please try again.";
    case AUTH_ERROR_TYPES.SERVER_ERROR:
      return "Server error occurred. Please try again later.";
    case AUTH_ERROR_TYPES.SESSION_EXPIRED:
      return "Your session has expired. Please log in again.";
    default:
      return "An unexpected error occurred. Please try again.";
  }
};

// Helper to determine error type from API response
export const determineErrorType = (error) => {
  if (!error) return AUTH_ERROR_TYPES.UNKNOWN_ERROR;

  if (!navigator.onLine || error.message === "Network Error") {
    return AUTH_ERROR_TYPES.NETWORK_ERROR;
  }

  if (error.response) {
    switch (error.response.status) {
      case 401:
        return AUTH_ERROR_TYPES.INVALID_CREDENTIALS;
      case 403:
        return AUTH_ERROR_TYPES.SESSION_EXPIRED;
      case 500:
        return AUTH_ERROR_TYPES.SERVER_ERROR;
      default:
        return AUTH_ERROR_TYPES.UNKNOWN_ERROR;
    }
  }

  return AUTH_ERROR_TYPES.UNKNOWN_ERROR;
};
