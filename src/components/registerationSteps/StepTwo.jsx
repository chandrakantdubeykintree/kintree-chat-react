import { useTranslation } from "react-i18next";
import CustomDateMonthYearPicker from "../custom-ui/custom-dateMonthYearPicker";

export function StepTwo({ register, errors, watch, setValue }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-4">
      <CustomDateMonthYearPicker
        placeholder={t("date_of_birth")}
        initialFocus
        maxDate={new Date()}
        value={watch("date_of_birth")}
        className="rounded-full h-10 md:h-12 bg-background"
        onChange={(newDate) => setValue("date_of_birth", newDate)}
      />
      {errors.date_of_birth && (
        <span className="text-sm text-red-500 mt-1 ml-4">
          {errors.date_of_birth.message}
        </span>
      )}
    </div>
  );
}
