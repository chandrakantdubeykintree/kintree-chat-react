import { useWill } from "@/hooks/useWill";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle2, AlertCircle } from "lucide-react";
import ComponentLoading from "../component-loading";
import { useTranslation } from "react-i18next";

export default function Review({ setStep, willId }) {
  const { t } = useTranslation();
  const { willData, isWillLoading, getBeneficiariesQuery } = useWill();
  const { data: beneficiariesData } = getBeneficiariesQuery(willId);

  if (isWillLoading) {
    return <ComponentLoading />;
  }

  const totalPercentage = beneficiariesData?.data?.reduce(
    (sum, b) => sum + Number(b.percentage || 0),
    0
  );

  const isAllocationComplete = totalPercentage === 100;

  return (
    <div className="space-y-6 h-full">
      <h2 className="text-xl font-semibold">{t("review_your_will")}</h2>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">
          {t("personal_information")}
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-500">{t("full_name")}</label>
            <p className="text-sm break-all">
              {willData?.data?.["personal-info"]?.name}
            </p>
          </div>
          <div>
            <label className="text-sm text-gray-500">
              {t("date_of_birth")}
            </label>
            <p className="text-sm break-all">
              {willData?.data?.["personal-info"]?.date_of_birth}
            </p>
          </div>
          <div>
            <label className="text-sm text-gray-500">{t("address")}</label>
            <p className="text-sm break-all">
              {willData?.data?.["personal-info"]?.address}
            </p>
          </div>
          <div>
            <label className="text-sm text-gray-500">{t("pincode")}</label>
            <p className="text-sm break-all">
              {willData?.data?.["personal-info"]?.pincode}
            </p>
          </div>
          <div>
            <label className="text-sm text-gray-500">{t("phone_number")}</label>
            <p className="text-sm break-all">
              {willData?.data?.["personal-info"]?.phone_country_code}-{" "}
              {willData?.data?.["personal-info"]?.phone_no}
            </p>
          </div>
          <div>
            <label className="text-sm text-gray-500">{t("email")}</label>
            <p className="text-sm break-all">
              {willData?.data?.["personal-info"]?.email}
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">{t("executor")}</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-500">{t("name")}</label>
            <p className="text-sm break-all">
              {willData?.data?.["executor-info"]?.name}
            </p>
          </div>
          <div>
            <label className="text-sm text-gray-500">
              {t("date_of_birth")}
            </label>
            <p className="text-sm break-all">
              {willData?.data?.["executor-info"]?.date_of_birth}
            </p>
          </div>
          <div>
            <label className="text-sm text-gray-500">
              {t("date_of_birth")}
            </label>
            <p className="text-sm break-all">
              {willData?.data?.["executor-info"]?.email}
            </p>
          </div>
          <div>
            <label className="text-sm text-gray-500">{t("phone_number")}</label>
            <p className="text-sm break-all">
              {willData?.data?.["executor-info"]?.phone_country_code}-{" "}
              {willData?.data?.["executor-info"]?.phone_no}
            </p>
          </div>
          <div>
            <label className="text-sm text-gray-500">{t("gender")}</label>
            <p className="text-sm break-all">
              {willData?.data?.["executor-info"]?.gender === "m"
                ? t("male")
                : t("female")}
            </p>
          </div>
          <div>
            <label className="text-sm text-gray-500">{t("city")}</label>
            <p className="text-sm break-all">
              {willData?.data?.["executor-info"]?.city}
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">{t("beneficiaries")}</h3>
        <div className="space-y-4">
          {beneficiariesData?.data?.map((beneficiary) => (
            <div
              key={beneficiary.id}
              className="flex justify-between border-b pb-2"
            >
              <div>
                <p className="font-medium">{beneficiary.name}</p>
                <p className="text-sm text-gray-500">
                  {beneficiary.relation || "NA"}
                </p>
              </div>
              <p className="font-medium">{beneficiary.percentage}%</p>
            </div>
          ))}

          <div className="flex items-center gap-2 mt-4">
            {isAllocationComplete ? (
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            ) : (
              <AlertCircle className="w-5 h-5 text-yellow-500" />
            )}
            <span className="text-sm">
              {t("total_allocation")}: {totalPercentage}%
              {!isAllocationComplete && " (Must equal 100%)"}
            </span>
          </div>
        </div>
      </Card>

      <div className="flex justify-end gap-4">
        <Button
          variant="outline"
          onClick={() => setStep("executor")}
          className="rounded-full h-10 md:h-12 px-4 md:px-6"
        >
          {t("back")}
        </Button>
        <Button
          disabled={!isAllocationComplete}
          onClick={() => setStep("selfie")}
          className="rounded-full h-10 md:h-12 px-4 md:px-6"
        >
          {t("submit")}
        </Button>
      </div>
    </div>
  );
}
