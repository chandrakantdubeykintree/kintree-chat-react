import { useState, useEffect } from "react";
import { IndianRupee, Copy, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import {
  useIsRedeeming,
  useKincoinsBalance,
  useRedeemKincoins,
} from "@/hooks/useKincoins";
import { toast } from "react-hot-toast";
import { DialogDescription } from "@radix-ui/react-dialog";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

export default function RedeemCard({ data }) {
  const [showDialog, setShowDialog] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300);
  const [couponCode, setCouponCode] = useState("");
  const [copied, setCopied] = useState(false);
  const { mutate: redeemKincoins } = useRedeemKincoins();
  const isRedeemingCoupon = useIsRedeeming();
  const [isRedeeming, setIsRedeeming] = useState(false);
  const { data: balanceData } = useKincoinsBalance();
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const handleRedeem = () => {
    const balance = parseInt(balanceData?.coin_balance) || 0;
    if (balance < 1000) {
      return toast.error(t("minimum_balance_required"));
    }

    const coinsToUse = Math.floor(Math.min(balance, 100000) / 100) * 100;
    const rupeesWorth = coinsToUse / 100;

    if (balance > 100000) {
      toast.success(t("only_kincoins_will_be_used"));
    }

    setIsRedeeming(true);
    redeemKincoins(
      {
        coins: coinsToUse,
        amount: rupeesWorth,
      },
      {
        onSuccess: (response) => {
          setCouponCode(response.data.code);
          setShowDialog(true);
          startTimer();
          queryClient.invalidateQueries({
            queryKey: ["kincoins-balance"],
          });
          setIsRedeeming(false);
        },
      }
    );
  };
  const startTimer = () => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setShowDialog(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(couponCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error(t("failed_to_copy_code"));
    }
  };

  const handleRedeemNow = () => {
    handleCopy();
    window.open(
      // `https://web.kintree.info/cart/?add-to-cart=${data.productId}&coupon=${couponCode}`,
      `${import.meta.env.VITE_KINCOINS_CART}/?add-to-cart=${
        data.productId
      }&coupon=${couponCode}`,
      "_blank"
    );
  };

  // Format time left
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    if (!showDialog) {
      setTimeLeft(300);
    }
  }, [showDialog]);

  return (
    <>
      <Card className="bg-[#F8FAFC] dark:bg-[#1F2937] w-full rounded-2xl h-full hover:shadow-lg shadow-md border transition-shadow">
        <CardContent className="p-4 rounded-2xl flex flex-col h-full">
          <div className="w-full pb-[90%] relative">
            <img
              src={data.url}
              className="absolute inset-0 w-full h-full object-cover rounded-lg"
              alt={data.name}
            />
          </div>
          <div className="flex flex-col h-[120px] mt-4">
            <div className="text-[#5E5F60] dark:text-[#9CA3AF] text-xs font-bold uppercase tracking-wide mb-2">
              {data.tag}
            </div>
            <div className="text-lg font-semibold line-clamp-2 mb-auto text-foreground">
              {data.name}
            </div>
            <div className="flex justify-between items-center pt-2">
              <div className="text-primary font-medium text-[20px] flex items-center gap-0.5">
                <IndianRupee className="text-primary h-[20px] p-0" />
                {data.price?.toLocaleString()}
              </div>
              <Button
                className="rounded-full"
                onClick={handleRedeem}
                disabled={isRedeeming || isRedeemingCoupon}
              >
                {isRedeeming ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("redeeming")}
                  </>
                ) : (
                  t("redeem")
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog} modal={true}>
        <DialogContent className="w-[300px] text-center max-w-[95%] sm:rounded-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-primary text-center">
              {t("congratulations")}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground text-center">
              {t("you_can_redeem_coupon")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="mx-auto relative w-[200px] overflow-hidden">
              <div className="border-primary border text-white p-6 bg-[#FAF2F8]">
                <div className="flex items-center justify-center space-x-2">
                  <code className="text-xl font-mono font-semibold text-primary line-clamp-1 max-w-52 overflow-ellipsis">
                    {couponCode}
                  </code>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="p-0 bg-transparent active:bg-transparent focus:bg-transparent"
                    onClick={handleCopy}
                  >
                    {copied ? (
                      <CheckCircle className="text-primary" />
                    ) : (
                      <Copy size={32} className="text-primary" />
                    )}
                  </Button>
                </div>
                <div className="w-6 h-6 bg-white z-1 rounded-full absolute transform -top-3 left-0 -ml-2 border border-primary"></div>
                <div className="w-6 h-6 bg-white z-1 rounded-full absolute transform -top-3 right-0 -mr-2 border border-primary"></div>

                <div className="w-6 h-6 bg-white z-1 rounded-full absolute transform -bottom-3 right-0 -mr-2 border border-primary"></div>
                <div className="w-6 h-6 bg-white z-1 rounded-full absolute transform -bottom-3 left-0 -ml-2 border border-primary"></div>

                <div className="w-6 h-6 bg-white z-1 rounded-full absolute transform -top-4 right-20 -ml-2 border border-primary"></div>
                <div className="w-6 h-6 bg-white z-1 rounded-full absolute transform -bottom-4 right-[85px] -mr-2 border border-primary"></div>
              </div>
            </div>

            <Button
              className="w-full rounded-full max-w-[250px] h-[48px] text-md gap-2"
              onClick={handleRedeemNow}
            >
              <img src="/kincoinsImg/redeem.svg" className="h-6 w-6 mr-2" />
              <span>{t("redeem_now")}</span>
            </Button>
            {/* <p className="text-sm text-muted-foreground">
              {formatTime(timeLeft)}
            </p> */}
            <span className="text-xs text-muted-foreground text-center">
              {t("coupon_code_valid_for")}
            </span>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
