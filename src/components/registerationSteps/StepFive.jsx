import { useTranslation } from "react-i18next";
import { CustomInput } from "../custom-ui/custom_input";

export function StepFive({ register, errors }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-4">
      <div>
        <CustomInput
          {...register("father_first_name")}
          placeholder={t("enter_father_first_name")}
          className="md:h-[56px] rounded-full"
          error={errors.father_first_name}
        />
      </div>

      <div>
        <CustomInput
          {...register("father_last_name")}
          placeholder={t("enter_father_last_name")}
          className="md:h-[56px] rounded-full"
          error={errors.father_last_name}
        />
      </div>

      <div>
        <CustomInput
          {...register("grand_father_name")}
          placeholder={t("enter_grandfather_name")}
          className="md:h-[56px] rounded-full"
          error={errors.grand_father_name}
        />
      </div>
    </div>
  );
}
