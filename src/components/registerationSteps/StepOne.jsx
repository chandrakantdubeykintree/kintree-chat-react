import { useTranslation } from "react-i18next";
import { CustomInput } from "../custom-ui/custom_input";

export function StepOne({ register, errors }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-4">
      <div>
        <CustomInput
          {...register("first_name")}
          className="md:h-[56px] rounded-full"
          placeholder={t("enter_first_name")}
          error={errors.first_name}
        />
      </div>

      <div>
        <CustomInput
          {...register("middle_name")}
          placeholder={t("enter_middle_name")}
          className="md:h-[56px] rounded-full"
          error={errors.middle_name}
        />
      </div>

      <div>
        <CustomInput
          {...register("last_name")}
          placeholder={t("enter_last_name")}
          className="md:h-[56px] rounded-full"
          error={errors.last_name}
        />
      </div>
    </div>
  );
}
