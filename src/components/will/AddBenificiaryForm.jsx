import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useWill } from "@/hooks/useWill";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQueryClient } from "@tanstack/react-query";
import PhoneInput, { parsePhoneNumber } from "react-phone-number-input";
import CustomDateMonthYearPicker from "../custom-ui/custom-dateMonthYearPicker";
import { useTranslation } from "react-i18next";

export default function AddBeneficiaryForm({ willId, onSuccess }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { addBeneficiary, isAddingBeneficiary } = useWill();

  const beneficiarySchema = z.object({
    name: z.string().min(1, t("name_required")),
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
          return age - 1 >= 1;
        }
        return age >= 1;
      }, t("age_must_be_at_least_one_year")),
    email: z.string().email(t("invalid_email")).optional(),
    phone_no: z.string().min(10, t("invalid_phone_number")),
    phone_country_code: z.string().min(1, t("phone_country_code_required")),
    gender: z.enum(["m", "f", "o"]),
  });

  const form = useForm({
    resolver: zodResolver(beneficiarySchema),
    defaultValues: {
      gender: "m",
      phone_country_code: "+91",
    },
  });

  const onSubmit = async (data) => {
    try {
      const phoneNumber = parsePhoneNumber(data.phone_no);

      const countryCode = phoneNumber.countryCallingCode; // Get the country code
      const localPhoneNumber = phoneNumber.nationalNumber; // Get the national number

      await addBeneficiary({
        willId,
        beneficiaryData: {
          ...data,
          phone_country_code: `+${countryCode}`,
          phone_no: localPhoneNumber,
        },
      });
      queryClient.invalidateQueries(["beneficiaries", willId]);
      onSuccess?.();
      form.reset();
    } catch (error) {
      console.error(t("error_adding_beneficiary"));
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input
                  {...field}
                  placeholder={t("enter_name")}
                  className="rounded-full h-10 md:h-12"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="date_of_birth"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <CustomDateMonthYearPicker
                    {...field}
                    placeholder={t("date_of_birth")}
                    maxDate={new Date()}
                    className="rounded-full h-10 md:h-12"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="gender"
            render={({ field }) => (
              <FormItem>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="rounded-full h-10 md:h-12"
                >
                  <SelectTrigger className="rounded-full h-10 md:h-12">
                    <SelectValue placeholder={t("gender")} />
                  </SelectTrigger>
                  <SelectContent className="max-h-[150px] overflow-y-auto no_scrollbar rounded-2xl">
                    <SelectItem value="m">{t("male")}</SelectItem>
                    <SelectItem value="f">{t("female")}</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input
                  type="email"
                  {...field}
                  placeholder={t("enter_email")}
                  className="rounded-full h-10 md:h-12"
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
              <FormControl className="border rounded-full pl-2">
                <PhoneInput
                  international
                  countryCallingCodeEditable={false}
                  defaultCountry="IN"
                  value={field.value}
                  maxLength={15}
                  limitMaxLength
                  className="rounded-full h-10 md:h-12"
                  onChange={(value) => {
                    field.onChange(value);
                    form.setValue(
                      "phone_country_code",
                      value?.split(" ")[0] || "+91"
                    );
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-4 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onSuccess?.()}
            className="rounded-full h-10 lg:h-12 px-4 lg:px-6"
          >
            {t("cancel")}
          </Button>
          <Button
            type="submit"
            disabled={isAddingBeneficiary}
            className="rounded-full h-10 lg:h-12 px-4 lg:px-6"
          >
            {isAddingBeneficiary ? t("adding") : t("add_beneficiary")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
