import { useQuery, useQueryClient } from "@tanstack/react-query";
import { searchLocation } from "@/services/locationApi";
import { useDebounce } from "./useDebounce";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

export const useLocation = (searchTerm, delay = 500) => {
  const queryClient = useQueryClient();
  const debouncedSearchTerm = useDebounce(searchTerm, delay);
  const { t } = useTranslation();

  const {
    data: suggestions = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["locations", debouncedSearchTerm],
    queryFn: async () => {
      if (!debouncedSearchTerm || debouncedSearchTerm.length < 3) {
        return [];
      }
      const data = await searchLocation(debouncedSearchTerm);
      return data?.predictions || [];
    },
    enabled: debouncedSearchTerm?.length >= 3,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    cacheTime: 1000 * 60 * 10, // Keep in cache for 10 minutes
    retry: 2,
  });

  // Prefetch previous results when component mounts
  useEffect(() => {
    if (debouncedSearchTerm?.length >= 3) {
      queryClient.prefetchQuery({
        queryKey: ["locations", debouncedSearchTerm],
        queryFn: () => searchLocation(debouncedSearchTerm),
      });
    }
  }, [queryClient, debouncedSearchTerm]);

  const clearSuggestions = () => {
    queryClient.setQueryData(["locations", debouncedSearchTerm], []);
  };

  return {
    suggestions,
    isLoading,
    error,
    clearSuggestions,
  };
};
