import { createContext, useContext, useState, useEffect } from "react";
import { kintreeApi } from "../services/kintreeApi";

import { tokenService } from "../services/tokenService";
import { api_user_profile } from "../constants/apiEndpoints";
import { useLocation, useNavigate } from "react-router";
import { logAnalyticsEvent } from "@/services/firebase";
import { ANALYTICS_EVENTS } from "@/constants/analyticsEvents";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        setLoading(true);
        const token = tokenService.getLoginToken();
        const registrationToken = tokenService.getRegistrationToken();
        const publicRoutes = [
          "/login",
          "/register",
          "/forgot-password",
          "/forgot-username",
          "/test",
        ];

        if (publicRoutes.includes(location.pathname)) {
          setLoading(false);
          return;
        }

        if (registrationToken) {
          setLoading(false);
          return;
        }

        if (token && tokenService.isLoginTokenValid()) {
          const success = await fetchUserProfile();
          if (success) {
            if (location.pathname === "/login" || location.pathname === "/") {
              navigate("/foreroom");
            }
          } else {
            handleLogout();
            if (!location.pathname.startsWith("/login")) {
              navigate("/login");
            }
          }
        } else {
          handleLogout();
          if (!location.pathname.startsWith("/login")) {
            navigate("/login");
          }
        }
      } catch (error) {
        handleLogout();
        if (!location.pathname.startsWith("/login")) {
          navigate("/login");
        }
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [navigate, location.pathname]);

  const fetchUserProfile = async (url = "/user/profile") => {
    try {
      const token =
        url === api_user_profile
          ? tokenService.getLoginToken()
          : tokenService.getRegistrationToken();
      if (token && tokenService.isLoginTokenValid()) {
        kintreeApi.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        const response = await kintreeApi.get(url);

        if (response.data.success) {
          setUser(response.data.data);
          setIsAuthenticated(true);

          logAnalyticsEvent("user_login", {
            method: "token",
          });
          return true;
        }
      }
      return false;
    } catch (error) {
      handleLogout();
      return false;
    }
  };

  const handleLogout = () => {
    setUser(null);
    setIsAuthenticated(false);
    clearRegistrationState();
    tokenService.removeAllTokens();

    logAnalyticsEvent(ANALYTICS_EVENTS.AUTH.LOGOUT);
  };

  const clearRegistrationState = () => {
    tokenService.removeRegistrationToken();
  };
  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated,
        handleLogout,
        clearRegistrationState,
        fetchUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
