import { kintreeApi } from "@/services/kintreeApi";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

const apiRequest = async (method, url, data = null) => {
  const response = await kintreeApi({
    method,
    url,
    data,
  });
  return response.data.data;
};

const fetchData = async ({ infoType }) => apiRequest("GET", `${infoType}`);

export const useProfile = (infoType) => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["profile", infoType],
    queryFn: () => fetchData({ infoType }),
    enabled: !!infoType,
  });

  const updateProfileMutation = useMutation({
    mutationFn: async ({ url, data, method = "PUT" }) => {
      const response = await kintreeApi({
        method,
        url,
        data,
      });
      return response;
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries(["profile", infoType]);
      if (response?.data?.success) {
        toast.success(t("profile_updated"));
      } else {
        toast.error(Object.values(response.data.errors).toString());
      }
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || t("failed_update_profile"));
    },
  });

  const deleteEducationMutation = useMutation({
    mutationFn: async (userEducationId) => {
      const response = await kintreeApi({
        method: "DELETE",
        url: `/user/educations/${userEducationId}`,
      });
      return response;
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries(["profile", infoType]);
      toast.success(t("education_deleted"));
    },
    onError: (error) => {
      toast.error(
        error?.response?.data?.message || t("failed_delete_education")
      );
    },
  });

  const updateImageMutation = useMutation({
    mutationFn: async ({ url, data }) => {
      const response = await kintreeApi({
        method: "POST",
        url,
        data,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["user"] });

      const messageKey = variables.url.includes("cover")
        ? "cover_image_updated"
        : "profile_image_updated";
      toast.success(t(messageKey));
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || t("failed_update_image"));
    },
  });

  const updateInterestsMutation = useMutation({
    mutationFn: async (data) => {
      const response = await kintreeApi({
        method: "POST",
        url: "/user/store-custom-interests",
        data,
      });
      return response;
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries(["interests"]);
      queryClient.invalidateQueries(["profile", "/user/interests"]);
      toast.success(t("interests_updated"));
    },
    onError: (error) => {
      toast.error(
        error?.response?.data?.message || t("failed_update_interests")
      );
    },
  });

  return {
    profile: data,
    isProfileLoading: isLoading,
    isProfileError: isError,
    profileError: error,
    updateProfile: updateProfileMutation.mutate,
    deleteEducation: deleteEducationMutation.mutate,
    updateImage: updateImageMutation.mutate,
    isUpdating: updateImageMutation.isPending,
    updateError: updateImageMutation.error,
    updateInterests: updateInterestsMutation.mutate,
  };
};

export const useInterestsMutation = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const { mutate: createInterest, isPending } = useMutation({
    mutationFn: async (data) => {
      const response = await kintreeApi({
        method: "POST",
        url: "/user/store-custom-interests",
        data,
      });
      return response;
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries(["interests"]);
      queryClient.invalidateQueries(["profile", "/user/interests"]);
      toast.success(t("interest_created"));
    },
    onError: (error) => {
      toast.error(
        error?.response?.data?.message || t("failed_create_interest")
      );
    },
  });

  return {
    createInterest,
    isPending,
  };
};
