import { useUpdateFamilyMember } from "@/hooks/useFamily";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import "react-phone-number-input/style.css";
import toast from "react-hot-toast";
import { useAgeRanges } from "@/hooks/useMasters";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import AsyncComponent from "./async-component";
import { Link } from "react-router";
import { ArrowLeft } from "lucide-react";
import ProfileImageUpload from "./profileImageUpload";
import { LocationSearchInput } from "./location-search-input";
import { CustomPhoneInput } from "./custom-ui/custom_phone_input";
import { countriesList } from "@/constants/countriesList";
import { Map } from "./map";

export default function EditRelativeForm({
  id,
  first_name,
  middle_name,
  last_name,
  email,
  phone_no,
  is_alive,
  age_range_id,
  native_place,
  profile_pic_url,
  onCancel,
  onSuccess,
}) {
  const { mutateAsync: updateMember, isLoading: isSubmitting } =
    useUpdateFamilyMember();
  const { t } = useTranslation();
  const { data: ageRanges } = useAgeRanges();
  const [countryCode, setCountryCode] = useState("");

  const editRelativeSchema = z
    .object({
      first_name: z
        .string({
          required_error: t("first_name_required"),
        })
        .max(20, t("first_name_max")),
      middle_name: z.string().max(20, t("middle_name_max")).optional(),
      last_name: z
        .string({
          required_error: t("last_name_required"),
        })
        .max(20, t("last_name_max")),
      email: z
        .string()
        .refine(
          (val) => !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
          t("invalid_email"),
        )
        .optional()
        .nullable(),
      phone_no: z
        .string()
        .refine(
          (val) => !val || /^\+?[1-9]\d{0,14}$/.test(val),
          t("invalid_phone"),
        )
        .optional()
        .nullable(),
      age_range: z.number().optional().nullable(),
      native_place: z.string().optional(),
      profile_image: z
        .any()
        .refine(
          (file) => {
            if (!file || file === "") return true;
            if (!(file instanceof File)) return true;

            const validTypes = [
              "image/jpeg",
              "image/png",
              "image/jpg",
              "image/gif",
            ];
            return validTypes.includes(file.type);
          },
          {
            message: t("invalid_image_type"),
          },
        )
        .refine(
          (file) => {
            if (!file || file === "") return true;
            if (!(file instanceof File)) return true;
            return file.size <= 5 * 1024 * 1024; // 5MB
          },
          {
            message: t("image_too_large"),
          },
        )
        .optional(),
      is_alive: z.number().min(0).max(1),
    })
    .superRefine((data, ctx) => {
      if (data.is_alive === 1) {
        if (!data.age_range) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: t("age_range_required"),
            path: ["age_range"],
          });
        }

        // Only require contact info for ages 20-60
        if (data.age_range >= 4 && data.age_range <= 6) {
          if (!data.phone_no) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: t("phone_required"),
              path: ["phone_no"],
            });
          }
          if (!data.email) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: t("email_required"),
              path: ["email"],
            });
          }
        }
      } else {
        if (data.age_range) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: t("age_not_allowed_for_deceased"),
            path: ["age_range"],
          });
        }
        if (data.phone_no) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: t("phone_not_allowed_for_deceased"),
            path: ["phone_no"],
          });
        }
        if (data.email) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: t("email_not_allowed_for_deceased"),
            path: ["email"],
          });
        }
      }
    });

  const form = useForm({
    resolver: zodResolver(editRelativeSchema),
    defaultValues: {
      first_name: first_name || "",
      middle_name: middle_name || "",
      last_name: last_name || "",
      email: email || "",
      phone_no: phone_no || "",
      is_alive: is_alive ? 1 : 0,
      age_range: age_range_id || 1,
      native_place: native_place || "",
      profile_image: null,
    },
  });

  const onSubmit = async (values) => {
    try {
      const memberData = {
        ...values,
        id: id,
        is_alive: values.is_alive ? 1 : 0,
        // Only include these fields if member is alive
        phone_no:
          values.is_alive && values.phone_no
            ? `${countryCode}${values.phone_no}`
            : null,
        email: values.is_alive ? values.email : null,
        age_range: values.is_alive ? values.age_range : null,
      };

      if (values.profile_image instanceof File) {
        memberData.profile_image = values.profile_image;
      }

      await updateMember(memberData);
      toast.success(t("member_updated_successfully"));
      onSuccess?.();
    } catch (error) {
      console.log(t("failed_to_update_member"));
    }
  };
  const isAlive = useWatch({
    control: form.control,
    name: "is_alive",
  });

  // Extract the numeric values from the age range name
  const getAgeRangeNumbers = (ageRangeName) => {
    if (!ageRangeName) return null;
    const numbers = ageRangeName.match(/\d+/g);
    if (!numbers) return null;
    return numbers.map(Number);
  };

  const ageRangeId = useWatch({
    control: form.control,
    name: "age_range",
  });

  // Find the selected age range object
  const selectedAgeRange = ageRanges?.find((range) => range.id === ageRangeId);

  // Get the minimum age from the range
  const minAge = selectedAgeRange
    ? getAgeRangeNumbers(selectedAgeRange.name)?.[0]
    : null;

  // Should show contact fields if alive and age is between 20-60
  const shouldShowContactFields =
    isAlive === 1 && minAge !== null && minAge >= 20 && minAge < 60;

  useEffect(() => {
    if (isAlive === 1) {
      // When switching to alive, clear any deceased-related errors
      form.clearErrors("age_range");
      form.clearErrors("phone_no");
      form.clearErrors("email");
    } else {
      // When switching to deceased, clear the age range value
      form.setValue("age_range", null);
      form.setValue("phone_no", "");
      form.setValue("email", "");
      form.clearErrors("age_range");
    }
  }, [isAlive, form]);
  return (
    <AsyncComponent>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div
            className="relative w-full h-[150px] md:h-[200px] bg-cover bg-center"
            style={{
              backgroundImage: `url(${"/illustrations/illustration_bg.png"})`,
            }}
          >
            <div className="absolute top-4 left-4 h-4 w-4 flex items-center justify-center cursor-pointer rounded-full p-3 bg-primary border border-primary-foreground">
              <Link onClick={onCancel}>
                <ArrowLeft className="w-5 h-5 text-primary-foreground" />
              </Link>
            </div>
            <FormField
              control={form.control}
              name="profile_image"
              render={({ field }) => (
                <FormItem className="absolute md:top-36 top-24 left-1/2 transform -translate-x-1/2 flex m-auto">
                  <FormControl>
                    <ProfileImageUpload
                      value={field.value}
                      onChange={field.onChange}
                      firstName={form.watch("first_name")}
                      lastName={form.watch("last_name")}
                      imgSrc={profile_pic_url}
                      className="w-24 h-24 md:w-32 md:h-32"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="text-center pt-12">
            <h2 className="text-xl font-semibold">
              {t("edit_member_details")}
            </h2>{" "}
          </div>

          <div className="space-y-6 p-2 md:p-4 lg:p-6">
            {/* Name Fields */}
            <div className="grid md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="first_name"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={t("first_name")}
                        className="h-10 rounded-full focus:outline-none focus:ring-1 focus:ring-primary focus:ring-offset-0 focus:border-primary border border-primary"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="middle_name"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={t("middle_name")}
                        className="h-10 rounded-full focus:outline-none focus:ring-1 focus:ring-primary focus:ring-offset-0 focus:border-primary border border-primary"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="last_name"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={t("last_name")}
                        className="h-10 rounded-full focus:outline-none focus:ring-1 focus:ring-primary focus:ring-offset-0 focus:border-primary border border-primary"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="native_place"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <LocationSearchInput
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        name={field.name}
                        placeholder={t("native_place_placeholder")}
                        error={form.formState.errors.native_place?.message}
                        className="h-10 rounded-full focus:outline-none focus:ring-1 focus:ring-primary focus:ring-offset-0 focus:border-primary border border-primary"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {shouldShowContactFields && (
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          {...field}
                          type="email"
                          className="rounded-full h-10 focus:outline-none focus:ring-1 focus:ring-primary focus:ring-offset-0 focus:border-primary border border-primary"
                          placeholder={t("email")}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              {shouldShowContactFields && (
                <FormField
                  control={form.control}
                  name="phone_no"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <CustomPhoneInput
                          {...field}
                          countries={countriesList}
                          error={form.formState.errors.phone_no?.message}
                          placeholder={t("enter_phone")}
                          className="h-10 rounded-full focus:outline-none focus:ring-1 focus:ring-primary focus:ring-offset-0 focus:border-primary border border-primary"
                          setCountryCode={setCountryCode}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              {isAlive === 1 && (
                <FormField
                  control={form.control}
                  name="age_range"
                  render={({ field }) => {
                    // Clear age range when switching to deceased
                    if (isAlive === 0 && field.value) {
                      field.onChange(null);
                    }
                    return (
                      <FormItem>
                        <Select
                          onValueChange={(value) =>
                            field.onChange(Number(value))
                          }
                          value={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger className="h-10 rounded-full focus:outline-none focus:ring-1 focus:ring-primary focus:ring-offset-0 focus:border-primary border border-primary">
                              <SelectValue
                                placeholder={t("select_age_range")}
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="max-h-[150px] overflow-y-auto no_scrollbar rounded-2xl">
                            {ageRanges?.map((ageRange) => (
                              <SelectItem
                                key={ageRange.id}
                                value={ageRange.id.toString()}
                              >
                                {ageRange.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
              )}

              <FormField
                control={form.control}
                name="is_alive"
                render={({ field }) => (
                  <FormItem className="flex items-end gap-4">
                    <FormLabel>{t("living_status")}</FormLabel>
                    <FormControl>
                      <Switch
                        checked={field.value === 1}
                        onCheckedChange={(checked) =>
                          field.onChange(checked ? 1 : 0)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Contact Fields */}

            <div className="flex justify-end gap-4 mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                className="rounded-full"
              >
                {t("cancel")}
              </Button>
              <Button
                type="submit"
                className="rounded-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? t("saving") : t("save_changes")}
              </Button>
            </div>
          </div>
        </form>
        {form.watch("native_place") && (
          <div className="my-4 px-2 md:px-4 lg:px-6">
            <Map
              place={form.getValues("native_place")}
              className="w-full rounded-lg shadow-md"
            />
          </div>
        )}
      </Form>
    </AsyncComponent>
  );
}
