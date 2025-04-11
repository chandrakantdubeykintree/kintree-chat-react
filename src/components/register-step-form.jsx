import { Button } from "./ui/button";
import { Card, CardContent, CardHeader } from "./ui/card";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { StepOne } from "./registerationSteps/StepOne";
import { StepTwo } from "./registerationSteps/StepTwo";
import { StepThree } from "./registerationSteps/StepThree";
import { StepFour } from "./registerationSteps/StepFour";
import { StepFive } from "./registerationSteps/StepFive";
import { StepSix } from "./registerationSteps/StepSix";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod";

export default function RegisterStepForm({
  currentStep,
  onStepSubmit,
  gender,
}) {
  const { t } = useTranslation();
  const registrationStepSchemas = {
    1: z.object({
      first_name: z.string().min(1, t("first_name_required")),
      middle_name: z.string().optional(),
      last_name: z.string().min(1, t("last_name_required")),
    }),

    2: z.object({
      date_of_birth: z.string().min(1, t("date_of_birth_required")),
    }),

    3: z.object({
      gender: z.enum(["m", "f"], {
        required_error: t("gender_required"),
      }),
    }),

    4: z
      .object({
        profile_image: z
          .any()
          .optional()
          .refine((val) => {
            if (!val) return true;
            return val instanceof File;
          }, t("error_invalid_file_type")),
        preseted_profile_image_id: z.number().nullable().optional(),
        skipped: z.number().optional(),
      })
      .refine((data) => {
        if (data.skipped === 1) return true;
        return (
          Boolean(data.profile_image) || Boolean(data.preseted_profile_image_id)
        );
      }, t("select_profile_picture_or_skip")),

    5: z.object({
      father_first_name: z.string().min(1, t("father_first_name_required")),
      father_last_name: z.string().min(1, t("father_last_name_required")),
      grand_father_name: z.string().optional(), // Remove min() validation
    }),

    6: z.object({
      mother_first_name: z.string().min(1, t("mother_first_name_required")),
      mother_last_name: z.string().min(1, t("mother_last_name_required")),
      grand_father_name: z.string().optional(), // Remove min() validation
    }),
  };

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
    reset,
  } = useForm({
    resolver: zodResolver(registrationStepSchemas[currentStep]),
    mode: "onChange",
  });

  useEffect(() => {
    reset();
  }, [currentStep, reset]);

  const handleFormSubmit = async (data) => {
    if (isSubmitting) return;
    await onStepSubmit(data);
  };

  const renderStepContent = () => {
    const props = {
      register,
      errors,
      watch,
      setValue,
      gender,
      handleSubmit: () => handleSubmit(handleFormSubmit)(),
    };
    switch (currentStep) {
      case 1:
        return <StepOne {...props} />;
      case 2:
        return <StepTwo {...props} />;
      case 3:
        return <StepThree {...props} />;
      case 4:
        return <StepFour {...props} />;
      case 5:
        return <StepFive {...props} />;
      case 6:
        return <StepSix {...props} />;
      default:
        return null;
    }
  };

  function renderSignUpStepTitleDesc(step) {
    switch (step) {
      case 1:
        return (
          <>
            <h1 className="font-semibold text-2xl">
              {t("register_step_1_heading")}
            </h1>
            <p>({t("register_step_1_desc")})</p>
          </>
        );
      case 2:
        return (
          <>
            <h1 className="font-semibold text-2xl">
              {t("register_step_2_heading")}
            </h1>
            <p>({t("register_step_2_desc")})</p>
          </>
        );
      case 3:
        return (
          <>
            <h1 className="font-semibold text-2xl">
              {t("register_step_3_heading")}
            </h1>
            <p>({t("register_step_3_desc")})</p>
          </>
        );
      case 4:
        return (
          <>
            <h1 className="font-semibold text-2xl">
              {t("register_step_4_heading")}
            </h1>
            <p>({t("register_step_4_desc")})</p>
          </>
        );
      case 5:
        return (
          <>
            <h1 className="font-semibold text-2xl">
              {t("register_step_5_heading")}
            </h1>
            <p>({t("register_step_5_desc")})</p>
          </>
        );
      case 6:
        return (
          <>
            <h1 className="font-semibold text-2xl">
              {t("register_step_6_heading")}
            </h1>
            <p>({t("register_step_6_desc")})</p>
          </>
        );
      default:
        return null;
    }
  }

  return (
    <Card className="flex flex-col lg:gap-2 p-0 rounded-3xl">
      <CardHeader className="text-center">
        {renderSignUpStepTitleDesc(currentStep)}
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {renderStepContent()}
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full md:h-[48px] rounded-full mt-6"
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <span className="loading loading-spinner loading-sm"></span>
                {t("processing")}...
              </div>
            ) : currentStep === 6 ? (
              t("complete_registration")
            ) : (
              t("continue")
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
