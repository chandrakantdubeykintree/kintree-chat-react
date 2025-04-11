import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { kintreeApi } from "../services/kintreeApi";
import toast from "react-hot-toast";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";

export function useWill() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Fetch existing will
  const { data: willData, isLoading: isWillLoading } = useQuery({
    queryKey: ["will"],
    queryFn: async () => {
      try {
        const response = await kintreeApi.get("/will");
        return response.data;
      } catch (error) {
        toast.error(t("failed_fetch_will"));
        throw error;
      }
    },
  });

  // Create new will
  const createWillMutation = useMutation({
    mutationFn: async () => {
      const response = await kintreeApi.post("/will");
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(t("will_created"));
      queryClient.invalidateQueries(["will"]);
      return data;
    },
  });

  // Add personal info
  const addPersonalInfoMutation = useMutation({
    mutationFn: async ({ data, willId }) => {
      const response = await kintreeApi.post(
        `/will/${willId}/personal-info`,
        data
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["will"]);
    },
  });

  // Get beneficiaries - Fixed to return the query object directly
  const getBeneficiariesQuery = (willId) =>
    useQuery({
      queryKey: ["beneficiaries", willId],
      queryFn: async () => {
        try {
          const response = await kintreeApi.get(
            `/will/${willId}/beneficiaries`
          );
          return response.data;
        } catch (error) {
          toast.error(t("failed_fetch_beneficiaries"));
          throw error;
        }
      },
      enabled: !!willId, // Only run query if willId exists
    });

  // Add non-member beneficiary
  const addBeneficiaryMutation = useMutation({
    mutationFn: async ({ willId, beneficiaryData }) => {
      const response = await kintreeApi.post(
        `/will/${willId}/add-beneficiary`,
        beneficiaryData
      );
      return response.data;
    },
    onSuccess: (_, { willId }) => {
      queryClient.invalidateQueries(["beneficiaries", willId]);
      toast.success(t("beneficiary_added"));
    },
    onError: () => {
      toast.error(t("failed_add_beneficiary"));
    },
  });

  // Add member beneficiaries
  const addMemberBeneficiariesMutation = useMutation({
    mutationFn: async ({ willId, memberIds }) => {
      const response = await kintreeApi.post(
        `/will/${willId}/add-member-beneficiary`,
        { member_ids: memberIds }
      );
      return response.data;
    },
    onSuccess: (_, { willId }) => {
      queryClient.invalidateQueries(["beneficiaries", willId]);
      toast.success(t("member_beneficiaries_added"));
    },
    onError: () => {
      toast.error(t("failed_add_member_beneficiaries"));
    },
  });

  // Save beneficiary allocations
  const saveBeneficiaryAllocationsMutation = useMutation({
    mutationFn: async ({ willId, beneficiaries }) => {
      const response = await kintreeApi.post(
        `/will/${willId}/save-beneficiary`,
        { beneficiaries }
      );
      return response.data;
    },
    onSuccess: (_, { willId }) => {
      queryClient.invalidateQueries(["beneficiaries", willId]);
      toast.success(t("allocations_saved"));
    },
    onError: () => {
      toast.error(t("failed_save_allocations"));
    },
  });

  const uploadSelfieMutation = useMutation({
    mutationFn: async ({ willId, selfieFile }) => {
      const formData = new FormData();
      formData.append("selfie", selfieFile);
      const response = await kintreeApi.post(
        `/will/${willId}/upload-selfie`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["will"]);
      toast.success(t("selfie_uploaded"));
    },
    onError: () => {
      toast.error(t("failed_upload_selfie"));
    },
  });

  // Generate will document
  const generateWillMutation = useMutation({
    mutationFn: async (willId) => {
      const response = await kintreeApi.get(`/will/${willId}/generate`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["will"]);
      toast.success(t("will_generated"));
    },
    onError: () => {
      toast.error(t("failed_generate_will"));
    },
  });

  // Notarize will
  const notarizeWillMutation = useMutation({
    mutationFn: async (willId) => {
      const response = await kintreeApi.post(`/will/${willId}/notarize`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["will"]);
      toast.success(t("will_notarized"));
    },
    onError: () => {
      toast.error(t("failed_notarize_will"));
    },
  });

  const addExecutorInfoMutation = useMutation({
    mutationFn: async ({ willId, executorData }) => {
      const response = await kintreeApi.post(
        `/will/${willId}/executor-info`,
        executorData
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["will"]);
      toast.success(t("executor_added"));
    },
    onError: () => {
      toast.error(t("failed_add_executor"));
    },
  });

  const deleteWillMutation = useMutation({
    mutationFn: async (willId) => {
      const response = await kintreeApi.delete(`/will/${willId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["will"]);
      navigate("/will/create-will");
      toast.success(t("will_deleted"));
    },
    onError: () => {
      toast.error(t("failed_delete_will"));
    },
  });

  return {
    willData,
    isWillLoading,
    createWill: () => createWillMutation.mutateAsync(),
    isCreatingWill: createWillMutation.isPending,
    deleteWill: (willId) => deleteWillMutation.mutateAsync(willId),
    isDeletingWill: deleteWillMutation.isPending,
    addPersonalInfo: (data, willId) =>
      addPersonalInfoMutation.mutateAsync({ data, willId }),
    isAddingPersonalInfo: addPersonalInfoMutation.isPending,
    getBeneficiariesQuery,
    addBeneficiary: (data) => addBeneficiaryMutation.mutateAsync(data),
    isAddingBeneficiary: addBeneficiaryMutation.isPending,
    addMemberBeneficiaries: (data) =>
      addMemberBeneficiariesMutation.mutateAsync(data),
    isAddingMemberBeneficiaries: addMemberBeneficiariesMutation.isPending,
    saveBeneficiaryAllocations: (data) =>
      saveBeneficiaryAllocationsMutation.mutateAsync(data),
    isSavingAllocations: saveBeneficiaryAllocationsMutation.isPending,
    uploadSelfie: (data) => uploadSelfieMutation.mutateAsync(data),
    isUploadingSelfie: uploadSelfieMutation.isPending,
    generateWill: (willId) => generateWillMutation.mutateAsync(willId),
    isGeneratingWill: generateWillMutation.isPending,
    notarizeWill: (willId) => notarizeWillMutation.mutateAsync(willId),
    isNotarizingWill: notarizeWillMutation.isPending,
    addExecutorInfo: (data) => addExecutorInfoMutation.mutateAsync(data),
    isAddingExecutorInfo: addExecutorInfoMutation.isPending,
  };
}
