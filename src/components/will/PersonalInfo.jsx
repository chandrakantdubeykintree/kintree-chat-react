import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router";
import { useWill } from "@/hooks/useWill";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import PhoneInput, { parsePhoneNumber } from "react-phone-number-input";
import "react-phone-number-input/style.css";
import toast from "react-hot-toast";
import CustomDateMonthYearPicker from "../custom-ui/custom-dateMonthYearPicker";
import { useTranslation } from "react-i18next";
import { useOccupations, useRelationshipTypes } from "@/hooks/useMasters";

export default function PersonalInfo({ setStep, willId }) {
  const { t } = useTranslation();
  const { data: occupations } = useOccupations();
  const { data: relationshipTypes } = useRelationshipTypes();

  const personalInfoSchema = z.object({
    name: z.string().min(1, t("name_required")),
    father_name: z.string().min(1, t("father_name_required")),
    date_of_birth: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, t("invalid_date"))
      .refine((date) => {
        const dob = new Date(date);
        const today = new Date();
        const age = today.getFullYear() - dob.getFullYear();
        const monthDiff = today.getMonth() - dob.getMonth();
        if (
          monthDiff < 0 ||
          (monthDiff === 0 && today.getDate() < dob.getDate())
        ) {
          return age - 1 >= 18;
        }
        return age >= 18;
      }, t("age_must_be_18")),
    email: z.string().email(t("invalid_email")),
    phone_no: z.string().refine((value) => {
      try {
        if (!value) return false;
        const phoneNumber = parsePhoneNumber(value);
        if (!phoneNumber) return false;

        const nationalNumber = phoneNumber.nationalNumber;

        return phoneNumber.isValid() && nationalNumber.length <= 10;
      } catch (error) {
        return false;
      }
    }, t("invalid_phone_number")),
    phone_country_code: z.string().min(1, t("country_code_required")),
    marital_status: z.enum([
      "single",
      "married",
      "engaged",
      "divorcee",
      "widowed",
    ]),
    occupation: z.enum([
      "business owner",
      "housewife",
      "salaried",
      "self employed",
      "social worker",
      "student",
      "unemployed",
      "other",
    ]),

    designation: z.string().min(1, t("designation_required")),
    address: z.string().min(1, t("address_required")),
    city: z.string().min(1, t("city_required")),
    pincode: z.string().regex(/^\d{6}$/, t("invalid_pincode")),
  });
  const navigate = useNavigate();
  const { addPersonalInfo, isAddingPersonalInfo, willData } = useWill();

  const form = useForm({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: {
      marital_status: "single",
      occupation: "salaried",
      phone_country_code: "+91",
      ...willData?.data?.["personal-info"],
      pincode: willData?.data?.["personal-info"]?.pincode?.toString() || "",
      phone_no:
        willData?.data?.["personal-info"]?.phone_country_code +
          willData?.data?.["personal-info"]?.phone_no || "",
    },
  });

  const onSubmit = async (data) => {
    try {
      const phoneNumber = parsePhoneNumber(data.phone_no);
      if (phoneNumber) {
        const countryCode = phoneNumber.countryCallingCode;
        const localPhoneNumber = phoneNumber.nationalNumber;

        const response = await addPersonalInfo(
          {
            ...data,
            phone_country_code: `+${countryCode}`,
            phone_no: localPhoneNumber,
          },
          willId
        );
        if (response.success) {
          toast.success(t("personal_info_saved_successfully"));
          setStep("beneficiaries");
        } else {
          toast.error(t("error_saving_personal_info"));
        }
      } else {
        toast.error(t("invalid_phone_number"));
      }
    } catch (error) {
      toast.error(t("error_saving_personal_info"));
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    className="h-10 lg:h-12 rounded-l-full rounded-r-full bg-background text-foreground"
                    {...field}
                    placeholder={t("enter_name")}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="father_name"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    className="h-10 lg:h-12 rounded-l-full rounded-r-full bg-background text-foreground"
                    {...field}
                    placeholder={t("enter_father_name")}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="date_of_birth"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <CustomDateMonthYearPicker
                    value={field.value}
                    onChange={field.onChange}
                    placeholder={t("date_of_birth")}
                    className="h-10 lg:h-12 rounded-l-full rounded-r-full bg-background text-foreground"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    className="h-10 lg:h-12 rounded-l-full rounded-r-full bg-background text-foreground"
                    type="email"
                    {...field}
                    placeholder={t("enter_email")}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone_no"
            render={({ field }) => (
              <FormItem>
                <FormControl className="border rounded-md pl-1">
                  <PhoneInput
                    className="h-10 lg:h-12 rounded-l-full rounded-r-full bg-background text-foreground pl-2"
                    international
                    countryCallingCodeEditable={false}
                    defaultCountry="IN"
                    maxLength={15}
                    limitMaxLength
                    value={field.value}
                    onChange={(value) => {
                      try {
                        if (!value) {
                          field.onChange(value);
                          return;
                        }

                        const phoneNumber = parsePhoneNumber(value);
                        if (phoneNumber) {
                          const nationalNumber = phoneNumber.nationalNumber;

                          if (
                            phoneNumber.isValid() &&
                            nationalNumber.length <= 10
                          ) {
                            field.onChange(value);
                            const countryCode = `+${phoneNumber.countryCallingCode}`;
                            form.setValue("phone_country_code", countryCode);
                          }
                        }
                      } catch (error) {
                        console.error("Phone number parsing error:", error);
                      }
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="marital_status"
            render={({ field }) => (
              <FormItem>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <SelectTrigger className="h-10 lg:h-12 rounded-l-full rounded-r-full bg-background text-foreground">
                    <SelectValue placeholder={t("martial_status")} />
                  </SelectTrigger>
                  <SelectContent className="max-h-[150px] overflow-y-auto no_scrollbar rounded-2xl">
                    <SelectGroup>
                      <SelectLabel>{t("select_martial_status")}</SelectLabel>
                      <SelectItem value="single">{"Single"}</SelectItem>
                      <SelectItem value="married">{"Married"}</SelectItem>
                      <SelectItem value="engaged">{"Engaged"}</SelectItem>
                      <SelectItem value="divorcee">{"Divorced"}</SelectItem>
                      <SelectItem value="widowed">{"Widowed"}</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="occupation"
            render={({ field }) => (
              <FormItem>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <SelectTrigger className="h-10 lg:h-12 rounded-l-full rounded-r-full bg-background text-foreground">
                    <SelectValue placeholder={t("occupation")} />
                  </SelectTrigger>
                  <SelectContent className="max-h-[150px] overflow-y-auto no_scrollbar rounded-2xl">
                    <SelectGroup>
                      <SelectLabel>{t("select_occupation")}</SelectLabel>
                      {occupations?.map((occupation) => (
                        <SelectItem key={occupation.id} value={occupation.id}>
                          {occupation.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="designation"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    className="h-10 lg:h-12 rounded-l-full rounded-r-full bg-background text-foreground"
                    {...field}
                    placeholder={t("designation")}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input
                  className="h-10 lg:h-12 rounded-l-full rounded-r-full bg-background text-foreground"
                  {...field}
                  placeholder={t("address")}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    className="h-10 lg:h-12 rounded-l-full rounded-r-full bg-background text-foreground"
                    {...field}
                    placeholder={t("city")}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="pincode"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    className="h-10 lg:h-12 rounded-l-full rounded-r-full bg-background text-foreground"
                    {...field}
                    placeholder={t("pincode")}
                    maxLength={6}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              form.reset();
              navigate("/will");
            }}
            className="rounded-full h-10 lg:h-12 px-4 lg:px-6"
          >
            {t("cancel")}
          </Button>
          <Button
            type="submit"
            disabled={isAddingPersonalInfo}
            className="rounded-full h-10 lg:h-12 px-4 lg:px-6"
          >
            {isAddingPersonalInfo ? t("saving") : t("next")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
