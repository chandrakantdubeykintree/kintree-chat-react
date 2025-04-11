import { kintreeApi } from "@/services/kintreeApi";
import { useQuery } from "@tanstack/react-query";

export function useDailyHoroscope(sunSignName, zodiacSignId) {
  const {
    data: dailyHoroscope,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: [sunSignName + zodiacSignId],
    queryFn: async () => {
      const response = await kintreeApi.get(`/zodiac-signs/${zodiacSignId}`);
      return response.data.data;
    },
    enabled: !!zodiacSignId,
  });

  return {
    dailyHoroscope,
    isLoading,
    isError,
    error,
    refetch,
  };
}
