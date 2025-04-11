import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router";
import { useWill } from "@/hooks/useWill";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "react-hot-toast";
import PhoneInput, { parsePhoneNumber } from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { format } from "date-fns";
import CustomDateMonthYearPicker from "../custom-ui/custom-dateMonthYearPicker";
import { useTranslation } from "react-i18next";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

export default function Executor({ setStep, willId }) {
  const { t } = useTranslation();
  const { addExecutorInfo, isAddingExecutorInfo, willData } = useWill();
  const executorSchema = z.object({
    name: z.string().min(1, t("executor_name_required")),
    date_of_birth: z
      .string()
      .min(1, "Date of birth is required")
      .regex(/^\d{4}-\d{2}-\d{2}$/, t("invalid_date"))
      .refine((dateStr) => {
        const dob = new Date(dateStr);
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
    phone_no: z.string().min(10, t("invalid_phone")),
    phone_country_code: z.string().min(1, t("phone_country_code_required")),
    relation: z.string().optional(),
    city: z.string().min(1, t("city_required")),
    gender: z.enum(["m", "f"], { required_error: t("select_gender") }),
  });

  const form = useForm({
    resolver: zodResolver(executorSchema),
    defaultValues: {
      phone_country_code: "+91",
      ...(willData?.data?.["executor-info"] || {}),
      phone_no:
        willData?.data?.["executor-info"]?.phone_country_code +
          willData?.data?.["executor-info"]?.phone_no || "",
      date_of_birth: willData?.data?.["executor-info"]?.date_of_birth
        ? format(
            new Date(willData?.data?.["executor-info"]?.date_of_birth),
            "yyyy-MM-dd"
          )
        : null,
      gender: willData?.data?.["executor-info"]?.gender || "m",
    },
  });

  const onSubmit = async (data) => {
    const phoneNumber = parsePhoneNumber(data.phone_no);

    const countryCode = phoneNumber.countryCallingCode; // Get the country code
    const localPhoneNumber = phoneNumber.nationalNumber; // Get the national number

    try {
      await addExecutorInfo({
        willId,
        executorData: {
          ...data,
          phone_country_code: `+${countryCode}`,
          phone_no: localPhoneNumber,
          date_of_birth: format(data.date_of_birth, "yyyy-MM-dd"),
        },
      });
      // toast.success(t("executor_info_saved_successfully"));
      setStep("review");
    } catch (error) {
      toast.error(t("error_saving_executor_info"));
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="">
          <h2 className="text-xl font-semibold mb-6">
            {t("executor_information")}
          </h2>
          <p className="text-gray-600 mb-6">{t("executor_info_description")}</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      className="h-10 md:h-12 rounded-l-full rounded-r-full bg-background text-foreground"
                      {...field}
                      placeholder={t("full_name")}
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
                      {...field}
                      maxDate={new Date()}
                      className="rounded-full h-10 md:h-12"
                      placeholder={t("date_of_birth")}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="relation"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      className="h-10 md:h-12 rounded-l-full rounded-r-full bg-background text-foreground"
                      {...field}
                      placeholder={t("relation")}
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
                      className="h-10 md:h-12 rounded-l-full rounded-r-full bg-background text-foreground"
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
                      international
                      className="h-10 md:h-12 rounded-l-full rounded-r-full bg-background text-foreground pl-2"
                      countryCallingCodeEditable={false}
                      defaultCountry="IN"
                      maxLength={15}
                      value={field.value}
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

            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      className="h-10 md:h-12 rounded-l-full rounded-r-full bg-background text-foreground"
                      {...field}
                      placeholder={t("city")}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <FormField
              control={form.control}
              name="gender"
              render={({ field }) => (
                <FormItem>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <SelectTrigger className="h-10 md:h-12 rounded-l-full rounded-r-full bg-background text-foreground">
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
        </div>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => setStep("allocation")}
            className="rounded-full h-10 lg:h-12 px-4 lg:px-6"
          >
            {t("back")}
          </Button>
          <Button
            type="submit"
            disabled={isAddingExecutorInfo}
            className="rounded-full h-10 lg:h-12 px-4 lg:px-6"
          >
            {isAddingExecutorInfo ? t("saving") : t("next")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
