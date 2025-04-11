import { useEffect } from "react";
import { useNavigate } from "react-router";
import AsyncComponent from "@/components/async-component";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import VerifyUserForm from "@/components/verify-user-form";
import PDFViewer from "@/components/will/PDFVIewer";
import { useWill } from "@/hooks/useWill";
import { useVerificationStore } from "@/services/verificationStore";
import { useTranslation } from "react-i18next";

const VERIFICATION_TIMEOUT = 10 * 60 * 1000; // 4 minutes in milliseconds

export default function ViewWill() {
  const { willUrl } = "https://kintree.com/will/1234567890";
  const { isVerified, verificationTimestamp, setVerified } =
    useVerificationStore();
  const { generateWill, isGeneratingWill, willData } = useWill();
  const { t } = useTranslation();
  const navigate = useNavigate();

  useEffect(() => {
    if (verificationTimestamp) {
      const timeElapsed = Date.now() - verificationTimestamp;

      if (timeElapsed >= VERIFICATION_TIMEOUT) {
        setVerified(false);
        navigate("/will");
        return;
      }

      const timeout = setTimeout(() => {
        setVerified(false);
        navigate("/will");
      }, VERIFICATION_TIMEOUT - timeElapsed);

      return () => clearTimeout(timeout);
    }
  }, [verificationTimestamp, navigate, setVerified]);

  const showVerificationDialog = !isVerified || !verificationTimestamp;

  return (
    <AsyncComponent>
      <Card className="w-full shadow-sm border-0 rounded-2xl h-full overflow-y-scroll no_scrollbar flex items-center flex-col justify-center">
        <Dialog
          open={showVerificationDialog}
          onOpenChange={() => navigate("/will")}
        >
          <DialogContent className="max-w-[90%] w-[350px] sm:rounded-2xl rounded-2xl">
            <DialogTitle></DialogTitle>
            <VerifyUserForm
              setIsVerified={setVerified}
              isVerified={isVerified}
            />
          </DialogContent>
        </Dialog>

        {isVerified && <PDFViewer url={willData?.data?.will_url || willUrl} />}
      </Card>
    </AsyncComponent>
  );
}
