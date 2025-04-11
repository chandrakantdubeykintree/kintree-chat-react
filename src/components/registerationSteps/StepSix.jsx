import { useTranslation } from "react-i18next";
import { CustomInput } from "../custom-ui/custom_input";

export function StepSix({ register, errors }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-4">
      <div>
        <CustomInput
          {...register("mother_first_name")}
          placeholder={t("enter_mother_first_name")}
          className="md:h-[56px] rounded-full"
          error={errors.mother_first_name}
        />
      </div>

      <div>
        <CustomInput
          {...register("mother_last_name")}
          placeholder={t("enter_mother_last_name")}
          className="md:h-[56px] rounded-full"
          error={errors.mother_last_name}
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
