import { useEffect, useRef } from "react";
import { useKincoinsTransactions } from "@/hooks/useKincoins";
import { useTranslation } from "react-i18next";
import { format, parse } from "date-fns";
import { useInView } from "react-intersection-observer";
import ComponentLoading from "@/components/component-loading";

export default function KincoinsTransactions() {
  const { t } = useTranslation();
  const { data, fetchNextPage, hasNextPage, isLoading, isFetchingNextPage } =
    useKincoinsTransactions();

  // Setup intersection observer for infinite scroll
  const { ref, inView } = useInView();

  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage();
    }
  }, [inView, fetchNextPage, hasNextPage]);

  const transactions =
    data?.pages.flatMap((page) => page.data.transactions) ?? [];
  const totalRecords = data?.pages[0]?.data.total_record ?? 0;

  if (isLoading) {
    return <ComponentLoading />;
  }

  if (!transactions.length) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6 p-4">
        <div className="text-2xl md:text-[32px] font-bold text-primary text-center">
          {t("start_transactions")}
        </div>
        <div className="max-w-[300px] md:max-w-[400px] px-4">
          <img
            src="/kincoinsImg/empty-transactions.svg"
            className="w-full h-auto"
            alt={t("empty_transactions_image")}
          />
        </div>
        <div className="space-y-2 text-center">
          <p className="text-lg md:text-[20px] font-medium text-foreground">
            {t("ready_to_transaction")}
          </p>
          <p className="text-lg md:text-[20px] font-medium text-foreground">
            {t("redeem_kincoins_now")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:p-4 w-full">
      {/* <div className="text-sm text-muted-foreground flex items-center justify-between">
        <h1 className="text-lg md:text-xl font-semibold text-foreground">
          {t("transaction_history")}
        </h1>
        <span>{t("total_transactions", { count: totalRecords })}</span>
      </div> */}

      <div className="space-y-2 md:space-y-3">
        {transactions.map((transaction) => (
          <div
            key={transaction.id}
            className="bg-background rounded-lg border shadow-sm hover:shadow-md transition-shadow p-3 md:p-4 flex items-center justify-between gap-4"
          >
            <div className="flex gap-3 md:gap-4 items-center min-w-0">
              <div className="w-8 h-8 md:w-10 md:h-10 flex-shrink-0">
                <img
                  src="/kincoinsImg/kintree_coin.svg"
                  alt="Kincoin"
                  className="w-full h-full"
                />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-medium text-foreground truncate md:text-lg">
                  {transaction.description}
                </span>
                <span className="text-xs md:text-sm text-muted-foreground">
                  {format(
                    parse(
                      transaction.created_at,
                      "dd-MM-yyyy HH:mm:ss",
                      new Date()
                    ),
                    "dd MMM yyyy HH:mm"
                  )}
                </span>
              </div>
            </div>
            <span
              className={`flex-shrink-0 font-bold text-sm md:text-lg ${
                transaction.coins.startsWith("+")
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              {parseInt(transaction?.coins)?.toLocaleString("en-IN", {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              })}
            </span>
          </div>
        ))}
      </div>

      {hasNextPage && (
        <div ref={ref} className="py-4 flex justify-center">
          {isFetchingNextPage ? (
            <ComponentLoading />
          ) : (
            <span className="text-sm text-muted-foreground animate-pulse">
              {t("scroll_to_load_more")}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
