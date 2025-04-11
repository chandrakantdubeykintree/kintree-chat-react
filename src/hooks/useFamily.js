import {
  api_family_tree,
  api_family_tree_members,
} from "@/constants/apiEndpoints";
import { kintreeApi } from "@/services/kintreeApi";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

export const QUERY_KEYS = {
  FAMILY: "family",
  MEMBER: "member",
  FAMILY_MEMBERS: "familyMembers",
};

const handleApiError = (error) => {
  // const message = error.response?.data?.message || "Something went wrong";
  // toast.error(message);
  return Promise.reject(error);
};

export const fetchFamily = async (updated_family_tree = 1) => {
  const response = await kintreeApi.get(api_family_tree, {
    params: { updated_family_tree },
  });

  if (!response.data.success) {
    return handleApiError(response);
  }
  return response.data.data;
};

export const fetchFamilyMembers = async () => {
  const response = await kintreeApi.get(api_family_tree_members);
  if (!response.data.success) {
    return handleApiError(response);
  }

  return response.data.data;
};

export const fetchMemberById = async (userId) => {
  const response = await kintreeApi.get(`/members-profile/${userId}`);
  if (!response.data.success) {
    return handleApiError(response);
  }
  return response.data.data;
};

export const deleteMember = async (memberId) => {
  const response = await kintreeApi.delete(
    `${api_family_tree_members}/${memberId}`
  );
  if (!response.data.success) {
    return handleApiError(response);
  }
  return response.data.data;
};

export const addFamilyMember = async (memberData) => {
  const formData = new FormData();

  // Handle profile image if provided and valid
  if (memberData.profile_image && memberData.profile_image instanceof File) {
    formData.append("profile_image", memberData.profile_image);
  }

  // Append other member data, excluding null/undefined values
  Object.entries(memberData).forEach(([key, value]) => {
    if (
      key !== "profile_image" &&
      value !== null &&
      value !== undefined &&
      value !== ""
    ) {
      formData.append(key, value);
    }
  });

  const response = await kintreeApi.post(
    `${api_family_tree_members}`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  if (!response.data.success) {
    return handleApiError(response);
  }
  return response.data.data;
};

export const updateFamilyMember = async (memberData) => {
  const formData = new FormData();

  // Handle profile image if provided and valid
  if (memberData.profile_image && memberData.profile_image instanceof File) {
    formData.append("profile_image", memberData.profile_image);
  }

  // Append other member data, excluding null/undefined values
  Object.entries(memberData).forEach(([key, value]) => {
    if (
      key !== "profile_image" &&
      value !== null &&
      value !== undefined &&
      value !== ""
    ) {
      formData.append(key, value);
    }
  });

  formData.append("_method", "PUT");

  const response = await kintreeApi.post(
    `${api_family_tree_members}/${memberData.id}`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  if (!response.data.success) {
    return handleApiError(response);
  }
  return response.data.data;
};

export const useFamily = () => {
  const { t } = useTranslation();

  return useQuery({
    queryKey: [QUERY_KEYS.FAMILY],
    queryFn: () => fetchFamily(1),
    refetchFn: () => fetchFamily(0),
    refetchOnWindowFocus: false,
    retry: 2,
    onError: (error) => {
      toast.error(t("failed_fetch_family"));
    },
  });
};

export const useFamilyMembers = () => {
  const { t } = useTranslation();

  return useQuery({
    queryKey: [QUERY_KEYS.FAMILY_MEMBERS],
    queryFn: () => fetchFamilyMembers(),
    refetchOnWindowFocus: false,
    retry: 2,
    staleTime: 0, // Data is considered stale immediately
    cacheTime: 0, // Don't cache the data
    refetchInterval: false, // Don't automatically refetch
    enabled: true,
    onError: (error) => {
      toast.error(t("failed_fetch_family_members"));
    },
  });
};

export const useMember = (memberId) => {
  const { t } = useTranslation();

  return useQuery({
    queryKey: [QUERY_KEYS.MEMBER, memberId],
    queryFn: () => fetchMemberById(memberId),
    enabled: Boolean(memberId),
    refetchOnWindowFocus: false,
    retry: 2,
    onError: (error) => {
      toast.error(t("failed_fetch_member"));
    },
  });
};

export const useAddFamilyMember = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: addFamilyMember,
    onSuccess: async () => {
      toast.success(t("member_added_success"));
      await queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.FAMILY],
        refetchType: "all",
        refetchFn: () => fetchFamily(1),
      });
      await queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.FAMILY_MEMBERS],
      });
    },
    onError: (error) => {
      Object.entries(error.data.errors)?.map((error) =>
        toast.error(error[1][0])
      );
    },
  });
};

export const useUpdateFamilyMember = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: updateFamilyMember,
    onSuccess: async (data, variables) => {
      toast.success(t("member_updated_success"));

      // Invalidate family tree data
      try {
        // First invalidate family tree
        await queryClient.invalidateQueries({
          queryKey: [QUERY_KEYS.FAMILY],
          refetchType: "all",
          refetchFn: () => fetchFamily(1),
        });

        // Then invalidate individual member data
        await queryClient.invalidateQueries({
          queryKey: [QUERY_KEYS.MEMBER, variables.id],
        });

        // Finally invalidate family members list
        await queryClient.invalidateQueries({
          queryKey: [QUERY_KEYS.FAMILY_MEMBERS],
        });
      } catch (error) {
        console.error("Error during query invalidation:", error);
      }
    },
    onError: (error) => {
      Object.entries(error.data.errors)?.map((error) =>
        toast.error(error[1][0])
      );
    },
  });
};

export const useDeleteMember = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: deleteMember,
    onSuccess: () => {
      toast.success(t("member_deleted_success"));
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.FAMILY],
        refetchType: "all",
        refetchFn: () => fetchFamily(1),
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.FAMILY_MEMBERS],
        refetchType: "all",
        refetchFn: () => fetchFamilyMembers(),
      });
      navigate("/familytree");
    },
    onError: (error) => {
      toast.error(error?.data?.message || t("failed_delete_member"));
    },
  });
};

export const assignFamilyGodfather = async ({ user_ids, godfatherId }) => {
  const response = await kintreeApi.post(`/godfather/${godfatherId}/assign`, {
    user_ids: user_ids,
  });

  if (!response.data.success) {
    return handleApiError(response);
  }
  return response.data;
};

export const createNewGodfather = async ({ userId, data }) => {
  const response = await kintreeApi.post(`/godfather`, data, {
    headers: {
      "Content-Type":
        data instanceof FormData ? "multipart/form-data" : "application/json",
    },
  });

  if (!response.data.success) {
    return handleApiError(response);
  }
  return response.data;
};

export const useCreateGodfather = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const assignMutation = useMutation({
    mutationFn: assignFamilyGodfather,
    onSuccess: () => {
      toast.success(t("godfather_added_success"));
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.FAMILY] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.FAMILY_MEMBERS] });
    },
    onError: (error) => {
      toast.error(error?.data?.message || t("failed_add_godfather"));
    },
  });

  const createMutation = useMutation({
    mutationFn: createNewGodfather,
    onSuccess: () => {
      toast.success(t("godfather_added_success"));
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.FAMILY] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.FAMILY_MEMBERS] });
    },
    onError: (error) => {
      if (error.data?.errors) {
        Object.entries(error.data.errors)?.map((error) =>
          toast.error(error[1][0])
        );
      } else {
        toast.error(error?.data?.message || t("failed_add_godfather"));
      }
    },
  });

  return {
    assignFamilyGodfather: assignMutation.mutateAsync,
    createNewGodfather: createMutation.mutateAsync,
    isLoading: assignMutation.isLoading || createMutation.isLoading,
  };
};
