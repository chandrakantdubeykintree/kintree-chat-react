import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router";
import toast from "react-hot-toast";
import { Mail, Phone } from "lucide-react";
import { useAuthentication } from "@/hooks/useAuthentication";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useThemeLanguage } from "@/context/ThemeLanguageProvider";
import { Copy, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { CustomPhoneInput } from "./custom-ui/custom_phone_input";
import { countriesList } from "@/constants/countriesList";
import { CustomInput } from "./custom-ui/custom_input";
import { CustomOTPInput } from "./custom-ui/custom_otp_input";

export function ForgotUsernameForm({ setOpenTerms }) {
  const { t } = useTranslation();
  const [loginType, setLoginType] = useState("email");
  const [countryCode, setCountryCode] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);
  const [resendOtp, setResendOtp] = useState(false);
  const [resendOTPIn, setResendOTPIn] = useState(30);
  const [otpLength, setOtpLength] = useState(6);
  const [showUsernameDialog, setShowUsernameDialog] = useState(false);
  const [username, setUsername] = useState("");
  const { theme } = useThemeLanguage();
  const navigate = useNavigate();
  const { sendOTPForgotUsername, verifyOTPForgotUsername } =
    useAuthentication();

  const forgotUsernameSchemas = {
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

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(username);
      setHasCopied(true);
      toast.success(t("copied_to_clipboard"));
      setTimeout(() => setHasCopied(false), 2000);
    } catch (err) {
      toast.error(t("error_failed_to_copy"));
    }
  };

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    reset,
  } = useForm({
    resolver: zodResolver(forgotUsernameSchemas[loginType]),
    mode: "onChange",
  });

  const isValidOtp = (otp) => {
    return /^\d+$/.test(otp) && otp.length === otpLength;
  };

  const watchedValues = watch();
  const hasErrors = Object.keys(errors).length > 0;

  const onSubmit = async (data) => {
    if (loginType === "phone_no" || loginType === "email") {
      try {
        const response = await sendOTPForgotUsername({
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
          setOtpLength(
            loginType === "phone_no" && countryCode === "+91" ? 4 : 6
          );
        }
      } catch (error) {
        console.log(error);
      }
    } else if (loginType === "otp") {
      try {
        const response = await verifyOTPForgotUsername({
          otp: data.otp,
          [watchedValues.phone_no ? "phone_no" : "email"]:
            watchedValues.phone_no
              ? `${countryCode}${watchedValues.phone_no}`
              : watchedValues.email,
        });
        if (response.success) {
          setUsername(response.data.username);
          setShowUsernameDialog(true);
        }
      } catch (error) {
        console.log(error);
      }
    }
  };

  function renderForm() {
    switch (loginType) {
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
      sendOTPForgotUsername({
        email: watchedValues.email,
      });
    } else if (watchedValues.phone_no) {
      sendOTPForgotUsername({
        phone_no: countryCode + watchedValues.phone_no,
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
    <>
      <Card className="max-w-sm mx-8 sm:mx-0 rounded-2xl">
        <CardHeader className="flex items-center justify-center">
          <img
            src={
              theme === "light" ? "/kintreeLogo.svg" : "/kintreeLogoLight.svg"
            }
            alt="Kintree logo"
            width={80}
            height={60}
          />
          <CardTitle className="text-[24px] font-semibold text-center">
            {isOtpSent ? t("otp_incoming") : t("forgot_username")}
          </CardTitle>
          <CardDescription className="space-y-4">
            {isOtpSent && (
              <div className="text-[16px] text-gray-400 text-center mb-2">
                {otpLength === 4 ? t("enter_otp_4") : t("enter_otp_6")}
              </div>
            )}
            {(watchedValues.email || watchedValues.phone_no) && isOtpSent && (
              <div className="text-center text-[16px] mb-4 font-normal flex items-center gap-2 justify-center text-black">
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
              {isOtpSent ? t("verify_otp") : t("continue")}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col items-center justify-center gap-8">
          {!isOtpSent && (
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
          {!isOtpSent && (
            <div className="flex flex-col gap-6 w-full">
              {loginType !== "email" && (
                <Button
                  className="w-full md:h-10 rounded-l-full rounded-r-full flex items-center justify-center gap-2 hover:bg-brandPrimary hover:text-blue-50"
                  variant="outline"
                  onClick={() => handleLoginTypeChange("email")}
                >
                  <Mail className="h-5 w-5" />
                  <span className="text-[16px]">
                    {t("continue_with_email")}
                  </span>
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
                    {t("continue_with_phone")}
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

      <Dialog
        open={showUsernameDialog}
        onOpenChange={(open) => {
          setShowUsernameDialog(open);
          if (!open) navigate("/login");
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-2xl text-center">
              {t("username")}
            </DialogTitle>
            <DialogDescription className="text-center"></DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-6 py-6">
            <div className="flex items-center gap-2 bg-muted p-4 rounded-lg w-fit border-dashed border-[3px] border-brandPrimary">
              <span className="text-md font-semibold select-all line-clamp-1 text-ellipsis max-w-[200px] break-all">
                {username}
              </span>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 "
                onClick={copyToClipboard}
              >
                {hasCopied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <Button
              type="button"
              variant="default"
              className="w-full rounded-full h-10 md:h-12"
              onClick={() => {
                setShowUsernameDialog(false);
                navigate("/login");
              }}
            >
              {t("login")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
