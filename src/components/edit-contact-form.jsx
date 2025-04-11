import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";
import { useProfile } from "@/hooks/useProfile";
import { useWindowSize } from "@/hooks/useWindowSize";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/accordion";
import { kintreeApi } from "@/services/kintreeApi";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "./ui/input-otp";
import toast from "react-hot-toast";
import ComponentLoading from "./component-loading";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { CustomCircularProgress } from "./custom-ui/custom_circular_progress";

export default function EditContactForm() {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [editField, setEditField] = useState(null);
  const [canResend, setCanResend] = useState(true);
  const [countdown, setCountdown] = useState(30);
  const queryClient = useQueryClient();
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otpLength, setOtpLength] = useState(6);
  const { profile, updateProfile, isLoading } = useProfile("/user/profile");
  const { width } = useWindowSize();

  const emailSchema = z.object({
    email: z.string().email(t("invalid_email")),
    otp: z.string().optional(),
  });

  const phoneSchema = z.object({
    phone_no: z.string().min(10, t("invalid_phone")),
    otp: z.string().optional(),
  });

  const otpSchema = z.object({
    email: z.string().email().optional(),
    phone_no: z.string().optional(),
    otp: z.string().min(otpLength, t("invalid_otp")),
  });

  const calculateProfileCompletion = (profile) => {
    if (!profile) return 0;

    // Fields specific to contact information
    const fields = ["email", "phone_no"];

    const totalFields = fields.length;
    let completedFields = 0;

    fields.forEach((field) => {
      if (profile[field] && profile[field].trim() !== "") {
        completedFields += 1;
      }
    });

    return Math.round((completedFields / totalFields) * 100);
  };
  const profileCompletion = calculateProfileCompletion(profile);

  const form = useForm({
    resolver: zodResolver(
      showOtpInput
        ? otpSchema
        : editField === "email"
        ? emailSchema
        : phoneSchema
    ),
    defaultValues: {
      email: profile?.email || "",
      phone_no: profile?.phone_no || "",
      otp: "",
    },
  });

  useEffect(() => {
    form.clearErrors();
    if (editField === "email") {
      form.setValue("phone_no", "");
    } else if (editField === "phone_no") {
      form.setValue("email", "");
    }
  }, [editField, form]);

  const handleEditClick = (field) => {
    setEditField(field);
    setIsEditing(true);
    setShowOtpInput(false);
    form.setValue("otp", "");
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditField(null);
    setShowOtpInput(false);
    form.reset({
      email: profile?.email || "",
      phone_no: profile?.phone_no || "",
      otp: "",
    });
  };

  useEffect(() => {
    let timer;
    if (!canResend && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (countdown === 0) {
      setCanResend(true);
      setCountdown(30);
    }
    return () => clearInterval(timer);
  }, [canResend, countdown]);

  const handleResendOTP = async () => {
    try {
      const res = await kintreeApi.post("/user/send-otp-to-change-contact", {
        [editField]: form.getValues(editField),
      });
      if (res.data.success) {
        toast.success(res.data.message);
        setCanResend(false);
        setCountdown(30);
      } else {
        toast.error(res.data.message);
      }
    } catch (error) {
      toast.error(t("error_sending_otp"));
    }
  };

  const onSubmit = async (values) => {
    try {
      if (!showOtpInput) {
        // First submission - Send OTP
        const res = await kintreeApi.post("/user/send-otp-to-change-contact", {
          [editField]: values[editField],
        });
        if (res.data.success) {
          toast.success(t("otp_sent_successfully"));
          if (editField === "phone_no") {
            const currentPhoneNo = values.phone_no || "";
            setOtpLength(currentPhoneNo.startsWith("+91") ? 4 : 6);
          }
          setShowOtpInput(true);
          setCanResend(false);
        } else {
          toast.error(t("error_sending_otp"));
        }
      } else {
        // Second submission - Verify OTP
        const res = await kintreeApi.post(
          "/user/verify-otp-and-change-contact",
          {
            [editField]: values[editField],
            otp: values.otp,
          }
        );

        if (res.data.success) {
          toast.success(res.data.message);
          // queryClient.invalidateQueries({ queryKey: ["profile"] });
          updateProfile({ ...profile, [editField]: values[editField] });
          handleCancelEdit();
        } else {
          toast.error(t("error_invalid_otp"));
        }
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error(t("error_some_error_occurred"));
    }
  };

  const renderEditButton = (field) => (
    <button
      className="text-sm text-brandPrimary hover:text-blue-800"
      onClick={() => handleEditClick(field)}
    >
      {profile?.[field] ? t("update") : t("add")}
    </button>
  );

  const renderEditForm = () => (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name={editField}
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {editField === "email" ? t("email") : t("phone_number")}
              </FormLabel>
              <FormControl>
                {editField === "phone_no" ? (
                  <PhoneInput
                    international
                    countryCallingCodeEditable={false}
                    defaultCountry="IN"
                    value={field.value}
                    onChange={(value) => {
                      field.onChange(value);
                      setOtpLength(value?.startsWith("+91") ? 4 : 6);
                    }}
                    maxLength={15}
                    limitMaxLength
                    disabled={showOtpInput}
                    className={cn(
                      "border bg-background border-gray-300 rounded-r-full rounded-l-full h-12 px-4",
                      showOtpInput && "opacity-50 cursor-not-allowed"
                    )}
                  />
                ) : (
                  <Input
                    {...field}
                    type="email"
                    placeholder={t("enter_email")}
                    disabled={showOtpInput}
                    className="h-12 rounded-r-full rounded-l-full px-5 bg-background"
                  />
                )}
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {showOtpInput && (
          <FormField
            control={form.control}
            name="otp"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("enter_otp")}</FormLabel>
                <FormControl>
                  <div className="mb-4 flex flex-col gap-4 items-center justify-center">
                    <InputOTP
                      maxLength={otpLength}
                      value={field.value}
                      onChange={field.onChange}
                      className="rounded-full"
                    >
                      <InputOTPGroup className="gap-2 rounded-full w-full">
                        {[...Array(otpLength)].map((_, index) => (
                          <InputOTPSlot
                            key={index}
                            index={index}
                            className="border rounded-full h-10 w-10 lg:h-12 lg:w-12 bg-background border-brandPrimary"
                          />
                        ))}
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                </FormControl>
                <FormMessage />
                <div className="flex items-center justify-between text-sm">
                  <button
                    type="button"
                    onClick={handleResendOTP}
                    disabled={!canResend}
                    className={cn(
                      "text-brandPrimary hover:text-blue-800",
                      !canResend && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    {canResend
                      ? t("resend_otp")
                      : `${t("resend_otp")} ${countdown} ${t("seconds")}`}
                  </button>
                </div>
              </FormItem>
            )}
          />
        )}

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancelEdit}
            className="rounded-full"
          >
            {t("cancel")}
          </Button>
          <Button type="submit" className="rounded-full">
            {showOtpInput ? t("verify_otp") : t("send_otp")}
          </Button>
        </div>
      </form>
    </Form>
  );

  const renderContent = () => (
    <div className="grid grid-cols-1 gap-5">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm">{t("email")}</p>
          <h3 className="text-md font-semibold">{profile?.email || "--"}</h3>
        </div>
        {!isEditing && renderEditButton("email")}
      </div>
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm">{t("phone_number")}</p>
          <h3 className="text-md font-semibold">{profile?.phone_no || "--"}</h3>
        </div>
        {!isEditing && renderEditButton("phone_no")}
      </div>
    </div>
  );

  if (isLoading) {
    return <ComponentLoading />;
  }

  return width > 640 ? (
    <>
      <div className="px-3">
        <div className="h-[60px] flex items-center justify-between border-b">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-medium">{t("contact_information")}</h2>
            <div className="flex items-center gap-1">
              <CustomCircularProgress
                value={profileCompletion}
                size={65}
                strokeWidth={3}
                showLabel
                labelClassName="text-[10px] font-bold"
                renderLabel={(progress) => `${progress}%`}
                className="stroke-white"
                progressClassName="stroke-primary"
              />
            </div>
          </div>
        </div>
      </div>
      <div className="p-4 min-h-[280px] max-h-[280px]">
        {isEditing ? renderEditForm() : renderContent()}
      </div>
    </>
  ) : (
    <Accordion type="single" collapsible className="w-full border-none">
      <AccordionItem value="item-1" className="border-none">
        <AccordionTrigger className="bg-[#F3EAF3] px-4 rounded-[6px] text-brandPrimary text-[16px] h-[48px]">
          <div className="flex justify-between gap-4 items-center">
            {t("contact_information")}
          </div>
          <div className="flex items-center gap-1">
            <CustomCircularProgress
              value={profileCompletion}
              size={60}
              strokeWidth={3}
              showLabel
              labelClassName="text-[10px] font-bold"
              renderLabel={(progress) => `${progress}%`}
              className="stroke-white"
              progressClassName="stroke-primary"
            />
          </div>
        </AccordionTrigger>
        <AccordionContent className="p-4">
          {isEditing ? renderEditForm() : renderContent()}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
