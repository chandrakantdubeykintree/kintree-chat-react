import { useEffect, useCallback } from "react";
import { logAnalyticsEvent } from "../services/firebase";
import { useLocation } from "react-router";
import { ANALYTICS_EVENTS } from "../constants/analyticsEvents";

export const useAnalytics = () => {
  const location = useLocation();

  useEffect(() => {
    logAnalyticsEvent(ANALYTICS_EVENTS.NAVIGATION.PAGE_VIEW, {
      page_path: location.pathname,
      page_title: document.title,
    });
  }, [location]);

  const logUserAction = useCallback((action, params = {}) => {
    logAnalyticsEvent(action, params);
  }, []);

  const logError = useCallback((error, context) => {
    logAnalyticsEvent(ANALYTICS_EVENTS.ERROR.APP_ERROR, {
      error_message: error?.message || "Unknown error",
      error_code: error?.code || "UNKNOWN",
      context,
    });
  }, []);

  return { logUserAction, logError };
};
