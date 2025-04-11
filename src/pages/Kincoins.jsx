import { Card } from "@/components/ui/card";
import { useState, useEffect } from "react";
import KincoinsEntryBanner from "@/components/kincoins-entry-banner";
import ReactConfetti from "react-confetti";
import RedeemKincoins from "./RedeemKincoins";
import EarnKincoins from "./EarnKincoins";
import KincoinsTransactions from "./KincoinsTransactions";
import { useTranslation } from "react-i18next";
import { useKincoinsBalance } from "@/hooks/useKincoins";
import { CustomTabs, CustomTabPanel } from "@/components/ui/custom-tabs";
import { useSearchParams } from "react-router";

export default function Kincoins() {
  const { t } = useTranslation();
  const [showBanner, setShowBanner] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "redeem";

  const handleTabChange = (newTab) => {
    setSearchParams({ tab: newTab });
  };
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== "undefined" ? window.innerWidth : 0,
    height: typeof window !== "undefined" ? window.innerHeight : 0,
  });
  const [showConfetti, setShowConfetti] = useState(false);
  const { data: balanceData } = useKincoinsBalance();
  const kincoinsBalnce = parseInt(balanceData?.coin_balance) || 0;

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener("resize", handleResize);

    const bannerTimer = setTimeout(() => {
      setShowBanner(false);
      setShowConfetti(true);
    }, 2500);

    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(bannerTimer);
    };
  }, []);

  useEffect(() => {
    if (showConfetti) {
      const confettiTimer = setTimeout(() => {
        setShowConfetti(false);
      }, 3000);

      return () => clearTimeout(confettiTimer);
    }
  }, [showConfetti]);

  const tabs = [
    { value: "redeem", label: t("redeem") },
    { value: "earn", label: t("earn") },
    { value: "transactions", label: t("transactions") },
  ];

  return (
    <>
      {showBanner && (
        <div className="fixed inset-0 bg-black z-40 flex items-center justify-center animate-[fadeIn_0.3s_ease-in]">
          <div className="container max-w-4xl mx-auto px-4">
            <KincoinsEntryBanner />
            <ReactConfetti
              width={windowSize.width}
              height={windowSize.height}
              numberOfPieces={100}
              recycle={true}
              gravity={0.5}
            />
          </div>
        </div>
      )}
      <Card className="bg-background rounded-2xl h-full overflow-y-scroll no_scrollbar">
        <div className="w-full flex items-center justify-between relative h-[227px] bg-[url('/kincoinsImg/kincoins_banner.png')] bg-no-repeat bg-cover rounded-t-2xl">
          <div className="flex-1 flex gap-1 flex-col items-center justify-center">
            <div className="flex items-center justify-center">
              <img
                src="/kincoinsImg/kintree_coin.svg"
                className="h-full object-cover max-w-[125px] w-[75px]"
                style={{ zIndex: 1 }}
              />
            </div>
            <div className="text-black font-bold text-[20px]">
              {t("your_kincoins_balance")}
            </div>
            <div className="text-black font-bold text-[36px]">
              {kincoinsBalnce?.toLocaleString("en-IN", {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              }) || 0}
            </div>
          </div>
          {showConfetti && (
            <ReactConfetti
              height={227}
              numberOfPieces={300}
              recycle={true}
              gravity={0.2}
              style={{ position: "absolute", top: 0, left: 0, zIndex: 0 }}
            />
          )}
        </div>

        <div className="sticky top-0 bg-background z-20 px-4 pt-4">
          <CustomTabs
            tabs={tabs}
            activeTab={activeTab}
            onChange={handleTabChange}
            variant="underline"
          />
        </div>

        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          <CustomTabPanel value="redeem" activeTab={activeTab}>
            <RedeemKincoins kincoinsBalnce={kincoinsBalnce} />
          </CustomTabPanel>
          <CustomTabPanel value="earn" activeTab={activeTab}>
            <EarnKincoins />
          </CustomTabPanel>
          <CustomTabPanel value="transactions" activeTab={activeTab}>
            <KincoinsTransactions />
          </CustomTabPanel>
        </div>
      </Card>
    </>
  );
}
