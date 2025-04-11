import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 2,
      refetchOnReconnect: true,
      onError: (error) => {
        console.error("Query failed: ", error);
      },
    },
    mutations: {
      onError: (error) => {
        console.error("Mutation failed: ", error);
      },
      onSuccess: (data) => {
        console.log("Mutation succeeded: ", data);
      },
    },
  },
});
