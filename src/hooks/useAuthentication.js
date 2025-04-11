import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { kintreeApi } from "../services/kintreeApi";
import { tokenService } from "../services/tokenService";
import { ApiError, handleApiError } from "../services/errorHandling";
import toast from "react-hot-toast";
import {
  api_auth_login_password,
  api_auth_logout,
  api_auth_reset_password,
  api_auth_send_otp_forgot_password,
  api_auth_send_otp_forgot_username,
  api_auth_send_otp_login_register,
  api_auth_verify_otp_forgot_password,
  api_auth_verify_otp_forgot_username,
  api_auth_verify_otp_login_register,
  api_user_profile,
} from "../constants/apiEndpoints";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import axios from "axios";
import { logAnalyticsEvent } from "@/services/firebase";
import { ANALYTICS_EVENTS } from "@/constants/analyticsEvents";

// Query keys
export const AUTH_QUERY_KEYS = {
  user: ["user"],
  profile: ["user", "profile"],
  registrationState: ["registration", "state"],
};

const fetchUserProfile = async () => {
  const token = tokenService.getLoginToken();

  if (!token || !tokenService.isLoginTokenValid()) {
    throw new Error("No valid token found");
  }

  kintreeApi.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  const response = await kintreeApi.get(api_user_profile);

  if (!response.data.success) {
    throw new ApiError(
      response.data.message,
      response.data.status,
      response.data.data,
    );
  }

  return response.data.data;
};

export const useAuthentication = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { data: user, isLoading } = useQuery({
    queryKey: AUTH_QUERY_KEYS.profile,
    queryFn: fetchUserProfile,
    retry: false,
    onSuccess: (data) => {
      navigate("/foreroom");
    },
    onError: (error) => {
      handleApiError(error, "error_fetching_user_profile");
      tokenService.removeAllTokens();
      kintreeApi.defaults.headers.common["Authorization"] = null;
      navigate("/login");
    },
  });

  // Login mutation
  const loginPasswordMutation = useMutation({
    mutationFn: async (credentials) => {
      const response = await kintreeApi.post(
        api_auth_login_password,
        credentials,
      );
      if (!response.data.success) {
        throw new ApiError(
          response.data.message,
          response.data.status,
          response.data.data,
        );
      }
      return response.data;
    },
    onSuccess: (data) => {
      const { login_token, ...userData } = data.data;
      kintreeApi.defaults.headers.common["Authorization"] =
        `Bearer ${login_token}`;
      tokenService.setLoginToken(login_token, data.remember);
      queryClient.setQueryData(AUTH_QUERY_KEYS.profile, userData);
      logAnalyticsEvent(ANALYTICS_EVENTS.AUTH.LOGIN_SUCCESS, {
        method: "password",
      });
      toast.success(t("logged_in_successfully"));
    },
    onError: (error) => {
      logAnalyticsEvent(ANALYTICS_EVENTS.AUTH.LOGIN_ERROR, {
        error_type: error.message,
      });
      handleApiError(error, t("error_invalid_credentials"));
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await kintreeApi.post(api_auth_logout);
      if (!response.data.success) {
        throw new ApiError(
          response.data.message,
          response.data.status,
          response.data.data,
        );
      }

      return response.data;
    },
    onSuccess: () => {
      queryClient.clear();
      localStorage.removeItem("i18nextLng");
      localStorage.removeItem("kintree-language");
      toast.success(t("logged_out_successfully"));
      window.location.reload();
    },
    onError: (error) => {
      handleApiError(error, t("error_logging_out"));
    },
  });

  const { data: registrationState } = useQuery({
    queryKey: AUTH_QUERY_KEYS.registrationState,
    queryFn: () => {
      const token = tokenService.getRegistrationToken();
      if (!token) {
        return {
          isRegistrationComplete: false,
          nextStep: 1,
          completedStep: null,
          verifiedContact: null,
        };
      }
      return (
        queryClient.getQueryData(AUTH_QUERY_KEYS.registrationState) || {
          isRegistrationComplete: false,
          nextStep: 1,
          completedStep: null,
          verifiedContact: null,
          gender: null,
        }
      );
    },
    initialData: {
      isRegistrationComplete: false,
      nextStep: 1,
      completedStep: null,
      verifiedContact: null,
    },
  });

  const sendOTPLoginRegisterMutation = useMutation({
    mutationFn: async (credentials) => {
      const response = await kintreeApi.post(
        api_auth_send_otp_login_register,
        credentials,
      );
      if (!response.data.status) {
        throw new ApiError(
          response.data.message,
          response.data.status,
          response.data.data,
        );
      }

      return response.data;
    },
    onSuccess: (data) => {
      toast.success(t("otp_sent_successfully"));
    },
    onError: (error) => {
      handleApiError(error, t("error_sending_otp"));
    },
  });

  const verifyOTPLoginRegisterMutation = useMutation({
    mutationFn: async (credentials) => {
      const response = await kintreeApi.post(
        api_auth_verify_otp_login_register,
        credentials,
      );
      if (!response.data.success) {
        throw new ApiError(
          response.data.message,
          response.data.status,
          response.data.data,
        );
      }
      return response.data;
    },
    onSuccess: (data) => {
      if (data.data.is_registration_complete === 1) {
        const { login_token, ...userData } = data.data;
        kintreeApi.defaults.headers.common["Authorization"] =
          `Bearer ${login_token}`;
        tokenService.setLoginToken(login_token);
        queryClient.setQueryData(AUTH_QUERY_KEYS.profile, userData);
        toast.success(t("logged_in_successfully"));
        navigate("/foreroom");
      } else {
        const { complete_registration_token, next_step, completed_step } =
          data.data;
        tokenService.setRegistrationToken(complete_registration_token);

        queryClient.setQueryData(AUTH_QUERY_KEYS.registrationState, {
          isRegistrationComplete: 0,
          nextStep: next_step,
          completedStep: completed_step || 0,
        });
        toast.success(t("otp_verified_successfully"));
        navigate(`/register/step/${next_step}`, { replace: true });
      }
    },
    onError: (error) => {
      handleApiError(error, t("invalid_otp"));
    },
  });

  // Register mutation
  const registerStepMutation = useMutation({
    mutationFn: async (formData) => {
      const token = tokenService.getRegistrationToken();
      if (!token) throw new Error(t("error_registration_timed_out"));

      const currentStep = registrationState.nextStep;

      let response;
      if (currentStep === 4 && formData.profile_image) {
        const formDataToSend = new FormData();
        if (formData.profile_image instanceof File) {
          formDataToSend.append("profile_image", formData.profile_image);
        } else {
          formDataToSend.append(
            "preseted_profile_image_id",
            formData.preseted_profile_image_id || 1,
          );
        }

        response = await kintreeApi.post(
          `/registration/step/${currentStep}`,
          formDataToSend,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data",
            },
          },
        );
      } else {
        response = await kintreeApi.post(
          `/registration/step/${currentStep}`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          },
        );
      }

      if (!response.data.success) {
        throw new ApiError(
          response.data.message,
          response.data.status,
          response.data.data,
        );
      }

      return response.data;
    },
    onSuccess: async (data) => {
      if (data.data.is_registration_complete === 1) {
        const { login_token, ...userData } = data.data;
        tokenService.setLoginToken(login_token);
        kintreeApi.defaults.headers.common["Authorization"] =
          `Bearer ${login_token}`;

        // Update user data in cache
        queryClient.setQueryData(AUTH_QUERY_KEYS.profile, userData);

        // Only remove registration token after everything else is set
        tokenService.removeRegistrationToken();

        // Clear registration state
        queryClient.removeQueries(AUTH_QUERY_KEYS.registrationState);

        logAnalyticsEvent(ANALYTICS_EVENTS.AUTH.REGISTRATION_COMPLETE, {
          method: "standard",
        });
        // Navigate to foreroom
        return navigate("/foreroom", { replace: true });
      } else {
        const { next_step, completed_step, gender } = data.data;

        queryClient.setQueryData(AUTH_QUERY_KEYS.registrationState, (prev) => ({
          ...prev,
          nextStep: next_step,
          completedStep: completed_step,
          gender: gender,
        }));
      }
      return data;
    },
    onError: (error) => {
      logAnalyticsEvent(ANALYTICS_EVENTS.AUTH.REGISTRATION_ERROR, {
        step: registrationState.nextStep,
        error_type: error.message,
      });
      navigate("/register", { replace: true });
      handleApiError(error, t("error_saving_registration_data"));
    },
  });

  // Forgot password mutation
  const sendOTPForgotPasswordMutation = useMutation({
    mutationFn: async (credentials) => {
      const response = await kintreeApi.post(
        api_auth_send_otp_forgot_password,
        credentials,
      );
      if (!response.data.status) {
        throw new ApiError(
          response.data.message,
          response.data.status,
          response.data.data,
        );
      }
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(t("otp_sent_successfully"));
    },
    onError: (error) => {
      handleApiError(error, t("user_not_registered"));
    },
  });

  const verifyOTPForgotPasswordMutation = useMutation({
    mutationFn: async (credentials) => {
      const response = await kintreeApi.post(
        api_auth_verify_otp_forgot_password,
        credentials,
      );
      if (!response.data.success) {
        throw new ApiError(
          response.data.message,
          response.data.status,
          response.data.data,
        );
      }
      const { token } = response.data.data;
      kintreeApi.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      tokenService.setResetPasswordToken(token);
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(t("otp_verified_successfully"));
    },
    onError: (error) => {
      handleApiError(error, t("invalid_otp"));
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (credentials) => {
      const resetToken = tokenService.getResetPasswordToken();

      // Set the reset password token in the headers
      const response = await axios.put(
        `${import.meta.env.VITE_KINTREE_BASE_URL}${api_auth_reset_password}`,
        credentials,
        {
          headers: {
            Authorization: `Bearer ${resetToken}`,
            "x-api-key": "kintreerestapi",
          },
        },
      );

      if (!response.data.success) {
        throw new ApiError(
          response.data.message,
          response.data.status,
          response.data.data,
        );
      }
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(t("password_reset_successfully"));
      tokenService.removeResetPasswordToken();
    },
    onError: (error) => {
      handleApiError(error, t("error_resetting_password"));
    },
  });

  // Forgot username mutation
  const sendOTPForgotUsernameMutation = useMutation({
    mutationFn: async (credentials) => {
      const response = await kintreeApi.post(
        api_auth_send_otp_forgot_username,
        credentials,
      );
      if (!response.data.status) {
        throw new ApiError(
          response.data.message,
          response.data.status,
          response.data.data,
        );
      }
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(t("otp_sent_successfully"));
    },
    onError: (error) => {
      handleApiError(error, t("user_not_registered"));
    },
  });

  const verifyOTPForgotUsernameMutation = useMutation({
    mutationFn: async (credentials) => {
      const response = await kintreeApi.post(
        api_auth_verify_otp_forgot_username,
        credentials,
      );
      if (!response.data.success) {
        throw new ApiError(
          response.data.message,
          response.data.status,
          response.data.data,
        );
      }
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(t("otp_verified_successfully"));
    },
    onError: (error) => {
      handleApiError(error, t("otp_verification_failed"));
    },
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    registrationState,
    loginPassword: loginPasswordMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    registerStep: registerStepMutation.mutateAsync,
    sendOTPLoginRegister: sendOTPLoginRegisterMutation.mutateAsync,
    verifyOTPLoginRegister: verifyOTPLoginRegisterMutation.mutateAsync,
    sendOTPForgotPassword: sendOTPForgotPasswordMutation.mutateAsync,
    verifyOTPForgotPassword: verifyOTPForgotPasswordMutation.mutateAsync,
    resetPassword: resetPasswordMutation.mutateAsync,
    sendOTPForgotUsername: sendOTPForgotUsernameMutation.mutateAsync,
    verifyOTPForgotUsername: verifyOTPForgotUsernameMutation.mutateAsync,
  };
};
