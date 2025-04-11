import { useState } from "react";
import { useNavigate } from "react-router";
import { useWill } from "@/hooks/useWill";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FileText, Download, CheckCircle2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";

export default function Notarize({ setStep, willId }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const {
    generateWill,
    isGeneratingWill,
    notarizeWill,
    isNotarizingWill,
    willData,
  } = useWill();

  const [currentStep, setCurrentStep] = useState(0);
  const [willUrl, setWillUrl] = useState(willData?.data?.will_url || null);

  const NOTARIZATION_STEPS = [
    {
      title: t("generate_will_document"),
      description: t("generate_will_document_description"),
      icon: FileText,
    },
    {
      title: t("download_and_review"),
      description: t("download_and_review_description"),
      icon: Download,
    },
    {
      title: t("notarize_will"),
      description: t("notarize_will_description"),
      icon: CheckCircle2,
    },
  ];

  const handleGenerateWill = async () => {
    try {
      const result = await generateWill(willId);
      if (result?.data?.will_url) {
        setWillUrl(result.data.will_url);
        setCurrentStep(1);
        toast.success(t("will_generated_successfully"));
      }
    } catch (error) {
      toast.error(t("error_generating_will"));
    }
  };

  const handleNotarize = async () => {
    try {
      await notarizeWill(willId);
      toast.success(t("will_notarized_successfully"));
      navigate("/will");
    } catch (error) {
      toast.error(t("error_notarizing_will"));
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-background rounded-lg p-6 shadow-md">
        <h2 className="text-xl font-semibold mb-2">
          {t("notarize_your_will")}
        </h2>
        <p className="text-gray-600 mb-6">
          {t("complete_the_following_steps_to_notarize_your_will")}
        </p>

        <div className="space-y-4">
          {NOTARIZATION_STEPS.map((step, index) => {
            const StepIcon = step.icon;
            const isCompleted = index < currentStep;
            const isCurrent = index === currentStep;

            return (
              <Card
                key={step.title}
                className={`p-4 ${
                  isCurrent ? "border-primary" : "border-gray-200"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`p-2 rounded-full ${
                      isCompleted
                        ? "bg-green-500 text-white"
                        : isCurrent
                        ? "bg-primary/10 text-primary"
                        : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    <StepIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{step.title}</h3>
                    <p className="text-sm text-gray-500">{step.description}</p>
                  </div>
                  {isCurrent && (
                    <div className="ml-auto">
                      {index === 0 && (
                        <Button
                          onClick={handleGenerateWill}
                          disabled={isGeneratingWill}
                          className="rounded-full h-10 md:h-12 px-4 md:px-6"
                        >
                          {isGeneratingWill ? t("generating") : t("generate")}
                        </Button>
                      )}
                      {index === 1 && willUrl && (
                        <Button
                          onClick={() => {
                            window.open(willUrl, "_blank");
                            setCurrentStep(2);
                          }}
                          className="rounded-full h-10 md:h-12 px-4 md:px-6"
                        >
                          {t("download")}
                        </Button>
                      )}
                      {index === 2 && (
                        <Button
                          onClick={handleNotarize}
                          disabled={isNotarizingWill}
                          className="rounded-full h-10 md:h-12 px-4 md:px-6"
                        >
                          {isNotarizingWill ? t("processing") : t("notarize")}
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      <div className="flex justify-end gap-4">
        <Button
          variant="outline"
          className="rounded-full h-10 md:h-12 px-4 md:px-6"
          onClick={() => navigate(`/will`)}
        >
          {t("go_to_will")}
        </Button>
      </div>
    </div>
  );
}
