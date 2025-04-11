import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "./ui/button";
import { Form } from "./ui/form";
import { kintreeApi } from "@/services/kintreeApi";
import toast from "react-hot-toast";
import { Mail, Phone } from "lucide-react";
import { useTranslation } from "react-i18next";
import { CustomInput } from "./custom-ui/custom_input";
import { CustomPhoneInput } from "./custom-ui/custom_phone_input";
import { CustomOTPInput } from "./custom-ui/custom_otp_input";
import { countriesList } from "@/constants/countriesList";

export default function VerifyUserForm({ setIsVerified }) {
  const [verifyType, setVerifyType] = useState("email");
  const [countryCode, setCountryCode] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [resendOtp, setResendOtp] = useState(false);
  const [resendOTPIn, setResendOTPIn] = useState(30);
  const [otpLength, setOtpLength] = useState(6);
  const { t } = useTranslation();

  const verifyUserSchemas = {
    email: z.object({
      email: z.string().nonempty(t("email_required")).email(t("invalid_email")),
    }),

    phone_no: z.object({
      phone_no: z.string().refine((val) => val.length >= 9, t("invalid_phone")),
    }),

    otp: z.object({
      otp: z
        .string()
        .nonempty(t("otp_required"))
        .regex(/^\d+$/, t("invalid_otp"))
        .refine(
          (val) => val.length === 4 || val.length === 6,
          (val) => ({
            message: t("invalid_otp"),
          })
        ),
    }),
  };

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    reset,
  } = useForm({
    resolver: zodResolver(verifyUserSchemas[verifyType]),
    mode: "onChange",
  });

  const watchedValues = watch();
  const hasErrors = Object.keys(errors).length > 0;

  const isValidOtp = (otp) => {
    return /^\d+$/.test(otp) && otp.length === otpLength;
  };

  const onSubmit = async (data) => {
    try {
      if (verifyType === "phone_no" || verifyType === "email") {
        const response = await kintreeApi.post("/send-otp/verify-user", {
          [verifyType]:
            verifyType === "phone_no"
              ? countryCode + data[verifyType]
              : data[verifyType],
        });

        if (response.data.status) {
          setIsOtpSent(true);
          setResendOtp(false);
          setResendOTPIn(30);
          setVerifyType("otp");
          if (verifyType === "phone_no") {
            setOtpLength(countryCode === "+91" ? 4 : 6);
          } else {
            setOtpLength(6);
          }
        }
      } else if (verifyType === "otp") {
        const response = await kintreeApi.post("/verify-otp/verify-user", {
          otp: data.otp,
          [watchedValues.phone_no ? "phone_no" : "email"]:
            watchedValues.phone_no
              ? `${countryCode}${watchedValues.phone_no}`
              : watchedValues.email,
        });

        if (response.data.success) {
          setIsVerified(true);
          toast.success(response.data.message);
        }
      }
    } catch (error) {
      toast.error(t("an_error_occurred_please_try_again"));
    }
  };

  function renderForm() {
    switch (verifyType) {
      case "email":
      case "phone_no":
        return (
          <div className="flex flex-col gap-2 mb-4">
            {verifyType === "phone_no" ? (
              <CustomPhoneInput
                placeholder={t("enter_phone")}
                error={errors.phone_no}
                {...register("phone_no")}
                countries={countriesList}
                setCountryCode={setCountryCode}
                className="h-10 md:h-12"
              />
            ) : (
              <CustomInput
                icon={Mail}
                {...register("email")}
                placeholder={t("enter_email")}
                type="email"
                error={errors.email}
                className="h-10 md:h-12"
              />
            )}
          </div>
        );
      case "otp":
        return (
          isOtpSent && (
            <div className="flex flex-col gap-2 mb-4">
              <CustomOTPInput
                onlyNumbers={true}
                length={otpLength}
                {...register("otp")}
                error={errors.otp}
              />
            </div>
          )
        );
      default:
        return null;
    }
  }

  const handleVerifyTypeChange = (type) => {
    setVerifyType(type);
    reset();
    setIsOtpSent(false);
    setResendOtp(false);
    setResendOTPIn(30);
  };

  const handleResendOTP = async () => {
    if (resendOTPIn > 0) return;

    try {
      if (watchedValues.email) {
        await kintreeApi.post("/send-otp/verify-user", {
          email: watchedValues.email,
        });
      } else if (watchedValues.phone_no) {
        await kintreeApi.post("/send-otp/verify-user", {
          phone_no: countryCode + watchedValues.phone_no,
        });
      }
      setResendOtp(false);
      setResendOTPIn(30);
      toast.success(t("otp_sent_successfully"));
    } catch (error) {
      toast.error(t("failed_to_resend_otp_please_try_again"));
    }
  };

  useEffect(() => {
    let timer;
    if (isOtpSent && resendOTPIn > 0) {
      timer = setInterval(() => {
        setResendOTPIn((prev) => prev - 1);
      }, 1000);
    } else if (resendOTPIn <= 0) {
      setResendOtp(true);
    }
    return () => clearInterval(timer);
  }, [isOtpSent, resendOTPIn]);

  return (
    <div className="w-full">
      <div className="flex flex-col items-center justify-center gap-4 mb-6">
        <h2 className="text-2xl font-semibold text-center">
          {isOtpSent ? t("otp_incoming!") : t("verify_user")}
        </h2>
        <p className="text-center text-gray-500">
          {isOtpSent
            ? t("enter_the_otp_sent_to", { otpLength })
            : t("verify_email_phone_number")}
        </p>
      </div>

      <Form>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {renderForm()}

          <Button
            type="submit"
            disabled={
              isSubmitting ||
              hasErrors ||
              (verifyType === "otp" && !isValidOtp(watchedValues.otp))
            }
            className="w-full rounded-full h-10 md:h-12"
          >
            {verifyType === "otp" ? t("verify_otp") : t("send_otp")}
          </Button>

          {isOtpSent && (
            <div className="flex flex-col items-center gap-2 mt-4">
              <p className="text-gray-500">{t("didnt_receive_otp")}</p>
              <Button
                variant="ghost"
                onClick={handleResendOTP}
                disabled={!resendOtp}
                className="text-brandPrimary hover:text-brandPrimary"
              >
                {resendOtp
                  ? t("resend_code")
                  : t("resend_code_in", { resendOTPIn })}
              </Button>
            </div>
          )}

          {!isOtpSent && (
            <div className="flex flex-col gap-4 mt-4">
              {verifyType === "email" ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleVerifyTypeChange("phone_no")}
                  className="w-full rounded-full h-10 md:h-12"
                >
                  <Phone className="mr-2 h-4 w-4" />
                  {t("verify_with_phone")}
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleVerifyTypeChange("email")}
                  className="w-full rounded-full h-10 md:h-12"
                >
                  <Mail className="mr-2 h-4 w-4" />
                  {t("verify_with_email")}
                </Button>
              )}
            </div>
          )}
        </form>
      </Form>
    </div>
  );
}
