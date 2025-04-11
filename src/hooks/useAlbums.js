import { kintreeApi } from "../services/kintreeApi";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

export const QUERY_KEYS = {
  ALBUMS: "albums",
  ALBUM: "album",
};

export const fetchAlbums = async () => {
  try {
    const response = await kintreeApi.get("/albums");
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

export const fetchAlbum = async (albumId) => {
  try {
    const response = await kintreeApi.get(`/albums/${albumId}`);
    return response.data.data;
  } catch (error) {
    return handleApiError(error);
  }
};

export const createAlbum = async (newAlbum) => {
  try {
    const response = await kintreeApi.post("/albums", newAlbum);
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

export const editAlbum = async (albumId, updatedAlbum) => {
  try {
    const response = await kintreeApi.put(`/albums/${albumId}`, updatedAlbum);
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

export const deleteAlbum = async (albumId) => {
  try {
    const response = await kintreeApi.delete(`/albums/${albumId}`);
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

export const useAlbums = () => {
  return useQuery({
    queryKey: [QUERY_KEYS.ALBUMS],
    queryFn: fetchAlbums,
    refetchOnWindowFocus: false,
    retry: 2,
    onError: (error) => {
      toast.error("Failed to fetch albums. Please try again later.");
    },
  });
};

export const useAlbum = (albumId) => {
  return useQuery({
    queryKey: [QUERY_KEYS.ALBUM, albumId],
    queryFn: () => fetchAlbum(albumId),
    enabled: Boolean(albumId),
    refetchOnWindowFocus: false,
    retry: 2,
    onError: (error) => {
      toast.error("Failed to fetch album details.");
    },
  });
};

export const useCreateAlbum = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createAlbum,
    onError: (error) => {
      toast.error(
        error.response?.data?.message ||
          "Failed to create album. Please try again."
      );
    },
    onSuccess: (data) => {
      toast.success("Album created successfully!");
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ALBUMS] });
    },
  });
};

export const useEditAlbum = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ albumId, updatedAlbum }) => editAlbum(albumId, updatedAlbum),
    onSuccess: (data) => {
      toast.success("Album updated successfully!");
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ALBUMS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ALBUM, data.id] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to update album");
    },
  });
};

export const useDeleteAlbum = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ albumId }) => deleteAlbum(albumId),
    onSuccess: (_, { albumId }) => {
      toast.success("Album deleted successfully!");
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ALBUMS] });
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.message ||
          "Failed to delete album. Please try again."
      );
    },
  });
};

const handleApiError = (error) => {
  const message = error.response?.data?.message || "Something went wrong";
  toast.error(message);
  return Promise.reject(error);
};
