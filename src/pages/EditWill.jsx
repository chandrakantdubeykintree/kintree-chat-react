import { Card } from "@/components/ui/card";
import Allocation from "@/components/will/Allocation";
import Beneficiaries from "@/components/will/Beneficiaries";
import Executor from "@/components/will/Executor";
import Notarize from "@/components/will/Notarize";
import PersonalInfo from "@/components/will/PersonalInfo";
import Review from "@/components/will/Review";
import Selfie from "@/components/will/Selfie";
import { Steps } from "@/components/will/Steps";
import UnsavedChangesDialog from "@/components/will/UnsavedChangesDialog";
import { useWill } from "@/hooks/useWill";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

export default function EditWill() {
  const { t } = useTranslation();
  const [step, setStep] = useState("personal-info");
  const { willData } = useWill();
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const steps = [
    { id: "personal-info", title: t("personal_details") },
    { id: "beneficiaries", title: t("beneficiaries") },
    { id: "allocation", title: t("allocation") },
    { id: "executor", title: t("executor") },
    { id: "review", title: t("review") },
    { id: "selfie", title: t("self_authentication") },
    { id: "notarize", title: t("notarization") },
  ];
  function willCreationStep() {
    switch (step) {
      case "personal-info":
        return <PersonalInfo setStep={setStep} willId={willData?.data?.id} />;
      case "beneficiaries":
        return <Beneficiaries setStep={setStep} willId={willData?.data?.id} />;
      case "allocation":
        return <Allocation setStep={setStep} willId={willData?.data?.id} />;
      case "executor":
        return <Executor setStep={setStep} willId={willData?.data?.id} />;
      case "review":
        return <Review setStep={setStep} willId={willData?.data?.id} />;
      case "selfie":
        return <Selfie setStep={setStep} willId={willData?.data?.id} />;
      case "notarize":
        return <Notarize setStep={setStep} willId={willData?.data?.id} />;
    }
  }
  useEffect(() => {
    const scrollContainer = document.querySelector(".scroll-top");
    if (scrollContainer) {
      scrollContainer.scrollTop = 0;
    }
  }, [step]);
  return (
    <Card className="mx-auto p-0 py-4 bg-background rounded-2xl overflow-y-scroll no_scrollbar h-full scroll-top">
      <Card className="mx-auto p-2 py-4 md:p-4 lg:p-6 bg-background rounded-2xl border-0 shadow-none">
        {step !== "acknowledge" && (
          <div className="mb-8 flex justify-between items-center overflow-x-scroll no_scrollbar w-full">
            <Steps
              steps={steps}
              currentStep={step}
              willId={willData?.data?.id}
              completedSteps={[]}
              onStepClick={() => {}}
            />
          </div>
        )}
        <div className="bg-brandSecondary p-2 md:p-4 lg:p-6 rounded-lg h-full overflow-y-scroll no_scrollbar">
          {willCreationStep()}
        </div>

        <UnsavedChangesDialog
          isOpen={showUnsavedDialog}
          onClose={() => setShowUnsavedDialog(false)}
          onConfirm={() => {}}
        />
      </Card>
    </Card>
  );
}
