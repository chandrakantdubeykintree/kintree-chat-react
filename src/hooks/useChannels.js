import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { kintreeApi } from "../services/kintreeApi";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

export const QUERY_KEYS = {
  CHANNELS: "channels",
  CHANNEL: "channel",
};

const handleApiError = (error) => {
  const message = error.response?.data?.message || "Something went wrong";
  toast.error(message);
  return Promise.reject(error);
};

// fetch unread messages
const fetchUnreadMessages = async () => {
  try {
    const response = await kintreeApi.get("/user/unreaded-message-count");
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

// Fetch all channels
const fetchChannels = async () => {
  try {
    const response = await kintreeApi.get("/user/channels");
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

// Fetch single channel
const fetchChannel = async (channelId) => {
  try {
    const response = await kintreeApi.get(`/user/channels/${channelId}`);
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

// Create channel
const createChannel = async (channelData) => {
  try {
    const response = await kintreeApi.post("/user/channels", channelData);
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

// Update channel
const updateChannel = async ({ channelId, data }) => {
  try {
    const response = await kintreeApi.put(`/user/channels/${channelId}`, data);
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

// Delete channel
const deleteChannel = async (channelId) => {
  try {
    const response = await kintreeApi.delete(`/user/channels/${channelId}`);
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

// Hooks
export const useUnreadMessages = () => {
  return useQuery({
    queryKey: [QUERY_KEYS.UNREAD_MESSAGES],
    queryFn: fetchUnreadMessages,
    refetchOnWindowFocus: true,
    staleTime: 1000 * 60,
  });
};

export const useChannels = () => {
  return useQuery({
    queryKey: [QUERY_KEYS.CHANNELS],
    queryFn: fetchChannels,
    refetchOnWindowFocus: true,
    staleTime: 1000 * 60, // 1 minute
  });
};

export const useChannel = (channelId) => {
  return useQuery({
    queryKey: [QUERY_KEYS.CHANNEL, channelId],
    queryFn: () => fetchChannel(channelId),
    enabled: Boolean(channelId),
    refetchOnWindowFocus: true,
  });
};

export const useCreateChannel = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: createChannel,
    onSuccess: (data) => {
      toast.success("Chat channel created successfully!");
      // Invalidate and refetch channels
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.CHANNELS],
        refetchType: "all",
      });
      // Also invalidate the specific channel if it exists
      if (data?.id) {
        queryClient.invalidateQueries({
          queryKey: [QUERY_KEYS.CHANNEL, data.id],
          refetchType: "all",
        });
      }
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || t("failed_create_channel"));
    },
    onSettled: () => {
      // Always refetch channels list after mutation settles
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.CHANNELS],
        refetchType: "all",
      });
    },
  });
};

export const useUpdateChannel = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: updateChannel,
    onSuccess: (data) => {
      toast.success("Channel updated successfully!");
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.CHANNELS],
        refetchType: "all",
      });
      if (data?.id) {
        queryClient.invalidateQueries({
          queryKey: [QUERY_KEYS.CHANNEL, data.id],
          refetchType: "all",
        });
      }
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || t("failed_update_channel"));
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.CHANNELS],
        refetchType: "all",
      });
    },
  });
};

export const useDeleteChannel = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: deleteChannel,
    onSuccess: () => {
      toast.success("Channel deleted successfully!");
      // Invalidate and refetch channels list
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.CHANNELS],
        refetchType: "all",
      });
      // Also invalidate the specific channel
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.CHANNEL],
        refetchType: "all",
      });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || t("failed_delete_channel"));
    },
  });
};
