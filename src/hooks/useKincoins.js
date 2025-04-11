import { kintreeApi } from "../services/kintreeApi";
import {
  useInfiniteQuery,
  useIsMutating,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

export const QUERY_KEYS = {
  KINCOINS_TRANSACTIONS: "kincoins-transactions",
  KINCOIN_TRANSACTION: "kincoin-transaction",
};

export const fetchTransactions = async ({ pageParam = 1, limit = 12 }) => {
  try {
    const response = await kintreeApi.get(`/kin-coins/transactions`, {
      params: {
        limit,
        page: pageParam,
      },
    });

    return {
      data: {
        transactions: response.data.data.transactions,
        current_page: response.data.data.current_page,
        last_page: response.data.data.last_page,
        total_record: response.data.data.total_record,
        filtered_record: response.data.data.filtered_record,
      },
      success: response.data.success,
      message: response.data.message,
      status_code: response.data.status_code,
      pageParam,
    };
  } catch (error) {
    return handleApiError(error);
  }
};

export const fetchTransaction = async (transactionId) => {
  try {
    const response = await kintreeApi.get(
      `/kin-coins/transactions/${transactionId}`
    );
    return response.data.data;
  } catch (error) {
    return handleApiError(error);
  }
};

export const fetchCoinsBalance = async (transactionId) => {
  try {
    const response = await kintreeApi.get(`/user/kincoins-balance`);
    return response.data.data;
  } catch (error) {
    return handleApiError(error);
  }
};

export const redeemKincoins = async ({ coins, amount }) => {
  try {
    const response = await kintreeApi.post("/kin-coins/redeem", {
      coins,
      amount,
    });
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

export const useKincoinsTransactions = (limit = 12) => {
  const { t } = useTranslation();

  return useInfiniteQuery({
    queryKey: [QUERY_KEYS.KINCOINS_TRANSACTIONS, limit],
    queryFn: ({ pageParam = 1 }) => fetchTransactions({ pageParam, limit }),
    getNextPageParam: (lastPage) => {
      if (!lastPage.data.transactions || !lastPage.success) {
        return undefined;
      }
      return lastPage.data.current_page < lastPage.data.last_page
        ? lastPage.data.current_page + 1
        : undefined;
    },
    refetchOnWindowFocus: false,
    refetchInterval: 60000, // Refresh every minute
    retry: 2,
    onError: (error) => {
      toast.error(t("failed_fetch_transactions"));
    },
  });
};

export const useKincoinTransaction = (transactionId) => {
  const { t } = useTranslation();

  return useQuery({
    queryKey: [QUERY_KEYS.KINCOIN_TRANSACTION, transactionId],
    queryFn: () => fetchTransaction(transactionId),
    enabled: Boolean(transactionId),
    refetchOnWindowFocus: false,
    retry: 2,
    onError: (error) => {
      toast.error(t("failed_fetch_transaction_details"));
    },
  });
};

export const useRedeemKincoins = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationKey: ["redeem-kincoins"],
    mutationFn: redeemKincoins,
    onSuccess: (data) => {
      toast.success(t("kincoins_redeemed_success"));
      queryClient.invalidateQueries({
        queryKey: ["kincoins-balance"],
      });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || t("failed_redeem_kincoins"));
    },
  });
};

export const useIsRedeeming = () => {
  return useIsMutating(["redeem-kincoins"]) > 0;
};

export const useKincoinsBalance = () => {
  const { t } = useTranslation();

  return useQuery({
    queryKey: ["kincoins-balance"],
    queryFn: fetchCoinsBalance,
    refetchInterval: 0, // Disable auto refetch interval
    refetchOnWindowFocus: true,
    refetchOnMount: true, // Add this to refetch when component mounts
    staleTime: 0, // Add this to consider data always stale
    cacheTime: 0, // Add this to disable caching
    onError: (error) => {
      toast.error(t("failed_fetch_balance"));
    },
  });
};

const handleApiError = (error) => {
  const message = error.response?.data?.message || "Something went wrong";
  toast.error(message);
  return Promise.reject(error);
};
