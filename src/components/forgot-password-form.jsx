import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import "react-phone-number-input/style.css";
import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router";
import toast from "react-hot-toast";
import { Lock, Mail, Phone } from "lucide-react";
import { useAuthentication } from "@/hooks/useAuthentication";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useThemeLanguage } from "@/context/ThemeLanguageProvider";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { CustomPasswordInput } from "./custom-ui/custom_pasword_input";
import { CustomPhoneInput } from "./custom-ui/custom_phone_input";
import { countriesList } from "@/constants/countriesList";
import { CustomInput } from "./custom-ui/custom_input";
import { CustomOTPInput } from "./custom-ui/custom_otp_input";

export function ForgotPasswordForm({ setOpenTerms }) {
  const { t } = useTranslation();
  const [loginType, setLoginType] = useState("email");
  const [countryCode, setCountryCode] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [resendOtp, setResendOtp] = useState(false);
  const [resendOTPIn, setResendOTPIn] = useState(30);
  const [otpLength, setOtpLength] = useState(6);
  const { theme } = useThemeLanguage();
  const navigate = useNavigate();
  const { resetPassword, sendOTPForgotPassword, verifyOTPForgotPassword } =
    useAuthentication();

  const resetPasswordSchemas = {
    reset_password: z
      .object({
        new_password: z
          .string()
          .nonempty(t("password_required"))
          .min(6, t("error_min_password")),
        confirm_password: z
          .string()
          .nonempty(t("password_required"))
          .min(6, t("error_min_password")),
      })
      .refine((data) => data.new_password === data.confirm_password, {
        message: t("error_password_mismatch"),
        path: ["confirm_password"],
      }),

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
            message:
              val.length < 4
                ? t("invalid_otp")
                : val.length > 6
                ? t("invalid_otp")
                : t("invalid_otp"),
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
    resolver: zodResolver(resetPasswordSchemas[loginType]),
    mode: "onChange",
  });

  const watchedValues = watch();

  const isValidOtp = (otp) => {
    return /^\d+$/.test(otp) && otp.length === otpLength;
  };

  const hasErrors = Object.keys(errors).length > 0;

  const onSubmit = async (data) => {
    if (loginType === "reset_password") {
      const response = await resetPassword({
        password: data.new_password,
        password_confirmation: data.confirm_password,
      });
      if (response.success) {
        toast.success(t("password_reset_successfully"));
        navigate("/login");
      }
    } else if (loginType === "phone_no" || loginType === "email") {
      const response = await sendOTPForgotPassword({
        [loginType]:
          loginType === "phone_no"
            ? countryCode + data[loginType]
            : data[loginType],
      });
      if (response.status) {
        setIsOtpSent(true);
        setResendOtp(false);
        setResendOTPIn(30);
        setLoginType("otp");
        if (loginType === "phone_no") {
          setOtpLength(countryCode === "+91" ? 4 : 6);
        } else {
          setOtpLength(6);
        }
      }
    } else if (loginType === "otp") {
      try {
        const response = await verifyOTPForgotPassword({
          otp: data.otp,
          [watchedValues.phone_no ? "phone_no" : "email"]:
            watchedValues.phone_no
              ? `${countryCode}${watchedValues.phone_no}`
              : watchedValues.email,
        });
        if (response.success) {
          setLoginType("reset_password");
        }
      } catch (error) {
        toast.error(t("invalid_otp"));
      }
    }
  };

  function renderForm() {
    switch (loginType) {
      case "reset_password":
        return (
          <div className="flex flex-col gap-4 mb-4">
            <CustomPasswordInput
              icon={Lock}
              placeholder={t("new_password")}
              error={errors.new_password}
              {...register("new_password")}
            />
            <CustomPasswordInput
              icon={Lock}
              placeholder={t("confirm_password")}
              error={errors.confirm_password}
              {...register("confirm_password")}
            />
          </div>
        );
      case "email":
      case "phone_no":
        return (
          <div className="flex flex-col gap-2 mb-4">
            {loginType === "phone_no" ? (
              <>
                <CustomPhoneInput
                  placeholder={t("enter_phone")}
                  error={errors.phone_no}
                  {...register("phone_no")}
                  countries={countriesList}
                  setCountryCode={setCountryCode}
                />
              </>
            ) : (
              <CustomInput
                icon={Mail}
                {...register("email")}
                placeholder={t("enter_email")}
                type="email"
                className="md:h-10 rounded-r-full rounded-l-full pl-10"
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

  const handleLoginTypeChange = (type) => {
    setLoginType(type);
    reset();
    setIsOtpSent(false);
    setResendOtp(false);
    setResendOTPIn(30);
  };

  const getButtonText = () => {
    if (loginType === "reset_password") {
      return t("reset_password");
    }
    if (loginType === "otp") {
      return t("verify_otp");
    }
    return t("continue");
  };

  const editPhoneEmail = (type) => {
    setLoginType(type);
    setIsOtpSent(false);
    setResendOtp(false);
    setResendOTPIn(30);
  };

  function handleResendOtp() {
    if (resendOTPIn > 0) {
      return;
    }
    if (watchedValues.email) {
      sendOTPForgotPassword({
        email: watchedValues.email,
      });
    } else if (watchedValues.phone_no) {
      sendOTPForgotPassword({
        phone_no: watchedValues.phone_no,
      });
    }
    setResendOtp(false);
    setResendOTPIn(30);
  }
  useEffect(() => {
    let timer;

    if (isOtpSent && resendOTPIn > 0) {
      timer = setInterval(() => {
        setResendOTPIn((prev) => prev - 1);
      }, 1000);
    } else if (resendOTPIn <= 0) {
      setResendOtp(true);
    }

    return () => {
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [isOtpSent, resendOTPIn]);

  return (
    <Card className="max-w-sm mx-8 sm:mx-0 rounded-2xl">
      <CardHeader className="flex items-center justify-center">
        <img
          src={theme === "light" ? "/kintreeLogo.svg" : "/kintreeLogoLight.svg"}
          alt="Kintree logo"
          width={80}
          height={60}
        />
        <CardTitle className="text-[24px] font-semibold text-center">
          {loginType === "reset_password"
            ? t("reset_password")
            : loginType === "otp"
            ? t("enter_otp")
            : t("forgot_password")}
        </CardTitle>
        <CardDescription className="space-y-4">
          {isOtpSent && loginType === "otp" && (
            <div className="text-[16px] text-gray-400 text-center mb-2">
              {otpLength === 4 ? t("enter_otp_4") : t("enter_otp_6")}
            </div>
          )}
          {(watchedValues.email || watchedValues.phone_no) &&
            isOtpSent &&
            loginType !== "reset_password" && (
              <div className="text-center text-[16px] mb-8 font-normal flex items-center gap-4 justify-center">
                <span>
                  {watchedValues.email ||
                    countryCode + "-" + watchedValues.phone_no}
                </span>

                <span
                  className="h-4 w-4 cursor-pointer"
                  onClick={() => {
                    editPhoneEmail(
                      watchedValues.phone_no ? "phone_no" : "email"
                    );
                  }}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <g clipPath="url(#clip0_653_12821)">
                      <path
                        d="M8.57171 20.9826L0.857422 23.1426L3.01742 15.4284L17.1431 1.37125C17.3027 1.20798 17.4935 1.07824 17.7039 0.989668C17.9144 0.901094 18.1405 0.855469 18.3689 0.855469C18.5972 0.855469 18.8233 0.901094 19.0338 0.989668C19.2442 1.07824 19.435 1.20798 19.5946 1.37125L22.6289 4.42268C22.7895 4.58204 22.917 4.77166 23.0041 4.98054C23.0912 5.18945 23.1359 5.41352 23.1359 5.63982C23.1359 5.86613 23.0912 6.0902 23.0041 6.2991C22.917 6.50801 22.7895 6.69761 22.6289 6.85697L8.57171 20.9826Z"
                        stroke="#943f7f"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </g>
                    <defs>
                      <clipPath id="clip0_653_12821">
                        <rect width="24" height="24" fill="white" />
                      </clipPath>
                    </defs>
                  </svg>
                </span>
              </div>
            )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {renderForm()}
          <Button
            type="submit"
            disabled={
              isSubmitting ||
              hasErrors ||
              (loginType === "otp" && !isValidOtp(watchedValues.otp))
            }
            className="w-full md:h-10 rounded-l-full rounded-r-full mt-2 text-[16px] bg-brandPrimary text-white hover:bg-brandPrimary hover:text-blue-50"
            variant="outline"
          >
            {getButtonText()}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="flex flex-col items-center justify-center gap-8">
        {!isOtpSent && loginType !== "reset_password" && (
          <div className="flex items-center justify-center gap-4 w-full">
            <div className="h-[1px] bg-border grow" />
            <div className="min-w-fit text-center whitespace-nowrap text-gray-600">
              {t("try_another_way")}
            </div>
            <div className="h-[1px] bg-border grow" />
          </div>
        )}
        {isOtpSent && loginType === "otp" && (
          <div className="flex flex-col justify-center items-center">
            <div className="flex flex-col justify-center items-center gap-2 text-gray-500">
              <p>{t("did_not_receive_otp")}</p>
              <Button
                variant="ghost"
                onClick={handleResendOtp}
                disabled={!resendOtp}
                className="font-semibold text-[16px] cursor-pointer hover:underline text-brandPrimary hover:text-brandPrimary bg-none hover:bg-n"
              >
                {resendOtp
                  ? t("resend_otp")
                  : `${t("resend_otp")} - ${resendOTPIn} ${t(
                      "seconds"
                    ).toLocaleLowerCase()}`}
              </Button>
            </div>
          </div>
        )}
        {loginType !== "reset_password" && !isOtpSent && (
          <div className="flex flex-col gap-6 w-full">
            {loginType !== "email" && (
              <Button
                className="w-full md:h-10 rounded-l-full rounded-r-full flex items-center justify-center gap-2 hover:bg-brandPrimary hover:text-blue-50"
                variant="outline"
                onClick={() => handleLoginTypeChange("email")}
              >
                <Mail className="h-5 w-5" />

                <span className="text-[16px]">{t("continue_with_email")}</span>
              </Button>
            )}

            {loginType !== "phone_no" && (
              <Button
                className="w-full md:h-10 rounded-l-full rounded-r-full flex items-center justify-center gap-2 hover:bg-brandPrimary hover:text-blue-50"
                variant="outline"
                onClick={() => handleLoginTypeChange("phone_no")}
              >
                <Phone className="h-5 w-5" />
                <span className="text-[16px]">
                  <span className="text-[16px]">
                    {t("continue_with_phone")}
                  </span>
                </span>
              </Button>
            )}
          </div>
        )}

        <div className="text-balance text-center text-sm text-muted-foreground  hover:[&_a]:text-primary  ">
          {t("already_have_account")}&nbsp;
          <NavLink
            className="text-brandPrimary cursor-pointer hover:underline"
            to="/login"
          >
            {t("login")}
          </NavLink>
        </div>

        <div className="text-balance text-center text-sm text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 hover:[&_a]:text-primary  ">
          {t("agree_to_terms")}{" "}
          <span
            className="text-brandPrimary cursor-pointer hover:underline"
            onClick={() =>
              setOpenTerms({
                isOpen: true,
                type: "terms",
                url: "https://kintree.com/terms-and-condition-webview/",
              })
            }
          >
            {t("terms")}
          </span>{" "}
          {t("and")?.toLocaleLowerCase()}{" "}
          <span
            className="text-brandPrimary cursor-pointer hover:underline"
            onClick={() =>
              setOpenTerms({
                isOpen: true,
                type: "privacy",
                url: "https://kintree.com/privacy-policy/",
              })
            }
          >
            {t("privacy")}&nbsp;{t("policy")}
          </span>
        </div>
      </CardFooter>
    </Card>
  );
}
