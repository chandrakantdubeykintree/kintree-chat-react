import { useState } from "react";
import { useNavigate } from "react-router";
import { useWill } from "@/hooks/useWill";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";

export default function WillAcknowledgement({ setStep }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { createWill, isCreatingWill } = useWill();
  const [accepted, setAccepted] = useState({
    terms: false,
    sound: false,
    truthful: false,
    agree: false,
  });

  const allTermsAccepted = Object.values(accepted).every(Boolean);

  const handleCreateWill = async () => {
    if (!allTermsAccepted) {
      toast.error("error_accept_all_terms");
      return;
    }

    try {
      const result = await createWill();
      if (result?.success && result?.data?.id) {
        setStep("personal-info");
      } else {
        toast.error(t("error_failed_to_create_will"));
      }
    } catch (error) {
      toast.error(t("error_failed_to_create_will"));
    }
  };

  return (
    <div className="mx-auto lg:p-6 flex flex-col gap-12">
      <h2 className="text-2xl font-bold text-center">
        {t("before_will_creation")}
      </h2>

      <ul className="list-decimal max-w-2xl mx-auto pl-5">
        <li className="text-gray-[#656565]">{t("will_acko_1")}</li>
        <li className="text-gray-[#656565]">{t("will_acko_2")}</li>
        <li className="text-gray-[#656565]">{t("will_acko_3")}</li>
        <li className="text-gray-[#656565]">{t("will_acko_4")}</li>
        <li className="text-gray-[#656565]">{t("will_acko_5")}</li>
      </ul>

      <div className="space-y-6 max-w-2xl mx-auto">
        <div className="flex items-start space-x-3">
          <Checkbox
            id="terms"
            checked={accepted.terms}
            onCheckedChange={(checked) =>
              setAccepted((prev) => ({ ...prev, terms: checked }))
            }
            className="mt-1 md:mt-0"
          />
          <label htmlFor="terms" className="text-sm leading-normal">
            {t("will_terms_checkbox")}
          </label>
        </div>

        <div className="flex items-start space-x-3">
          <Checkbox
            id="sound"
            checked={accepted.sound}
            onCheckedChange={(checked) =>
              setAccepted((prev) => ({ ...prev, sound: checked }))
            }
            className="mt-1 md:mt-0"
          />
          <label htmlFor="sound" className="text-sm leading-normal">
            {t("will_sound_checkbox")}
          </label>
        </div>

        <div className="flex items-start space-x-3">
          <Checkbox
            id="truthful"
            checked={accepted.truthful}
            onCheckedChange={(checked) =>
              setAccepted((prev) => ({ ...prev, truthful: checked }))
            }
            className="mt-1 md:mt-0"
          />
          <label htmlFor="truthful" className="text-sm leading-normal">
            {t("will_truthful_checkbox")}
          </label>
        </div>

        <div className="flex items-start space-x-3">
          <Checkbox
            id="agree"
            checked={accepted.agree}
            onCheckedChange={(checked) =>
              setAccepted((prev) => ({ ...prev, agree: checked }))
            }
            className="mt-1 md:mt-0"
          />
          <label htmlFor="agree" className="text-sm leading-normal">
            {t("will_agree_checkbox")}
          </label>
        </div>

        <div className="flex justify-end gap-4 mt-8">
          <Button
            variant="outline"
            onClick={() => navigate("/will")}
            className="rounded-full h-10 lg:h-12 px-4 lg:px-6"
          >
            {t("cancel")}
          </Button>
          <Button
            onClick={handleCreateWill}
            disabled={!allTermsAccepted || isCreatingWill}
            className="rounded-full h-10 lg:h-12 px-4 lg:px-6"
          >
            {isCreatingWill ? t("creating") : t("continue")}
          </Button>
        </div>
      </div>
    </div>
  );
}
