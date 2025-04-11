import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useWill } from "@/hooks/useWill";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { toast } from "react-hot-toast";
import { AlertCircle, CheckCircle2, User } from "lucide-react";
import ComponentLoading from "../component-loading";
import { Checkbox } from "../ui/checkbox";
import { useTranslation } from "react-i18next";
import AsyncComponent from "../async-component";
import KintreeTermsDialog from "../kintree-term-dialog";

export default function Allocation({ setStep, willId }) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [isConsentChecked, setIsConsentChecked] = useState(false);
  const [isPrivacyTermsChecked, setIsPrivacyTermsChecked] = useState(false);
  const [termsPrivacyModalOpen, setTermsPrivacyModalOpen] = useState(false);

  const {
    getBeneficiariesQuery,
    saveBeneficiaryAllocations,
    isSavingAllocations,
  } = useWill();
  const { data: beneficiariesData, isLoading } = getBeneficiariesQuery(willId);

  const [allocations, setAllocations] = useState({});
  const [totalPercentage, setTotalPercentage] = useState(0);

  useEffect(() => {
    if (beneficiariesData?.data) {
      const initialAllocations = {};
      let total = 0;
      beneficiariesData.data.forEach((beneficiary) => {
        initialAllocations[beneficiary.id] =
          Number(beneficiary.percentage) || 0;
        total += Number(beneficiary.percentage || 0);
      });
      setAllocations(initialAllocations);
      setTotalPercentage(total);
    }
  }, [beneficiariesData]);

  const handleAllocationChange = (beneficiaryId, value) => {
    const newValue = Math.min(Math.max(0, Number(value) || 0), 100);
    const newAllocations = { ...allocations, [beneficiaryId]: newValue };

    const newTotal = Object.values(newAllocations).reduce(
      (sum, val) => sum + Number(val),
      0
    );
    setTotalPercentage(newTotal);
    setAllocations(newAllocations);
  };

  const handleSubmit = async () => {
    if (totalPercentage !== 100) {
      toast.error(t("totat_allocation_must_be_100"));
      return;
    }

    try {
      await saveBeneficiaryAllocations({
        willId,
        beneficiaries: Object.entries(allocations).map(([id, percentage]) => ({
          id,
          percentage,
        })),
      });
      // toast.success(t("allocations_saved_successfully"));
      setStep("executor");
    } catch (error) {
      toast.error(t("error_saving_allocations"));
    }
  };

  if (isLoading) {
    return <ComponentLoading />;
  }

  const beneficiaries = beneficiariesData?.data || [];

  if (beneficiaries.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">{t("no_beneficiaries_added_yet")}</p>
        <Button
          className="rounded-full mt-4"
          onClick={() => navigate(`/will/create/${willId}/beneficiaries`)}
        >
          {t("add_beneficiaries")}
        </Button>
      </div>
    );
  }

  return (
    <AsyncComponent>
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-2">
            {t("asset_allocation")}
          </h2>
          <p className="text-gray-600 mb-6">
            {t("asset_allocation_description")}
          </p>

          <div className="space-y-4">
            {beneficiaries.map((beneficiary) => (
              <Card key={beneficiary.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium">{beneficiary.name}</h3>
                      <p className="text-sm text-gray-500">
                        {beneficiary.relation || "NA"}
                      </p>
                    </div>
                  </div>

                  <div className="w-32 flex items-center gap-2">
                    <Input
                      type="number"
                      value={allocations[beneficiary.id] || 0}
                      onChange={(e) =>
                        handleAllocationChange(beneficiary.id, e.target.value)
                      }
                      min="0"
                      step="1"
                      max="100"
                      className="text-right text-md text-primary bg-background"
                      suffix="%"
                    />
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-md font-medium">
                {t("total_allocation")}
              </span>
              <span
                className={`font-medium ${
                  totalPercentage.toFixed(2).toString() === "100.00"
                    ? "text-green-600"
                    : "text-yellow-600"
                }`}
              >
                {totalPercentage?.toFixed(2)}%
              </span>
            </div>
            <Progress value={totalPercentage} className="h-3 rounded-full" />
            {totalPercentage.toFixed(2).toString() !== "100.00" && (
              <p className="text-yellow-600 text-sm mt-2 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {t("total_allocation_must_be_100")}
              </p>
            )}
            {totalPercentage.toFixed(2).toString() === "100.00" && (
              <p className="text-green-600 text-md mt-2 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                {t("allocation_complete")}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Checkbox
            id="will_consent"
            checked={isConsentChecked}
            onCheckedChange={() => setIsConsentChecked(!isConsentChecked)}
          />
          <label
            htmlFor="will_consent"
            className="text-sm text-gray-600 cursor-pointer select-none"
          >
            {t("will_consent")}
          </label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id="will_terms_conditions"
            checked={isPrivacyTermsChecked}
            onCheckedChange={() =>
              setIsPrivacyTermsChecked(!isPrivacyTermsChecked)
            }
          />
          <label
            htmlFor="will_terms_conditions"
            className="text-sm text-gray-600 cursor-pointer underline"
            onClick={() => setTermsPrivacyModalOpen(true)}
          >
            {t("will_terms_conditions")}
          </label>
        </div>

        <div className="flex justify-end gap-4">
          <Button
            className="rounded-full h-10 lg:h-12 px-4 lg:px-6"
            variant="outline"
            onClick={() => setStep("beneficiaries")}
          >
            {t("back")}
          </Button>
          <Button
            className="rounded-full h-10 lg:h-12 px-4 lg:px-6"
            onClick={handleSubmit}
            disabled={
              totalPercentage.toFixed(2).toString() !== "100.00" ||
              isSavingAllocations ||
              !isConsentChecked ||
              !isPrivacyTermsChecked
            }
          >
            {isSavingAllocations ? t("saving") : t("next")}
          </Button>
        </div>
      </div>
      {termsPrivacyModalOpen && (
        <KintreeTermsDialog
          isOpen={termsPrivacyModalOpen}
          onClose={() => setTermsPrivacyModalOpen(false)}
          type="terms"
          url="https://kintree.com/terms-and-condition-webview/"
        />
      )}
    </AsyncComponent>
  );
}
