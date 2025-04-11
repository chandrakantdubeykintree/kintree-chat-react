import { useAddFamilyMember } from "@/hooks/useFamily";
import { useAgeRanges } from "@/hooks/useMasters";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormDescription,
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
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { relationshipTypes } from "@/constants/dropDownConstants";
import { SelectLabel } from "@/components/ui/select";
import { LocationSearchInput } from "./location-search-input";
import AsyncComponent from "./async-component";
import { Map } from "./map";
import ProfileImageUpload from "./profileImageUpload";
import { Link } from "react-router";
import { ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { CustomPhoneInput } from "@/components/custom-ui/custom_phone_input";
import { countriesList } from "@/constants/countriesList";

export default function AddRelativeForm({
  id,
  fid,
  mid,
  pid,
  onCancel,
  onSuccess,
  gender,
}) {
  const { mutateAsync: addMember, isLoading: isSubmitting } =
    useAddFamilyMember();
  const { data: ageRanges } = useAgeRanges();
  const { t } = useTranslation();
  const [countryCode, setCountryCode] = useState("");

  const addRelativeSchema = z
    .object({
      relation: z.string({
        required_error: t("relation_required"),
      }),
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
          t("invalid_email")
        )
        .optional()
        .nullable(),
      phone_no: z
        .string()
        .refine(
          (val) => !val || /^\+?[1-9]\d{0,14}$/.test(val),
          t("invalid_phone")
        )
        .optional()
        .nullable(),
      age_range: z.number().optional().nullable(),
      native_place: z.string().optional(),
      profile_image: z.any().optional(),
      is_alive: z.number().min(0).max(1).default(1),
    })
    .superRefine((data, ctx) => {
      if (data.is_alive === 1) {
        // For living people
        if (!data.age_range) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: t("age_range_required"),
            path: ["age_range"],
          });
        }

        // Only require contact info for ages 20-60
        if (data.age_range >= 4 && data.age_range <= 6) {
          // IDs 4-6 correspond to 21-30, 31-40, 41-50
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
        // For deceased people
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
    resolver: zodResolver(addRelativeSchema),
    defaultValues: {
      relation: "",
      first_name: "",
      middle_name: "",
      last_name: "",
      email: "",
      phone_no: "",
      age_range: "",
      is_alive: 1,
      gender: "",
      native_place: "",
    },
  });

  const calculateRelationData = (relation) => {
    const data = {
      father_id: null,
      mother_id: null,
      partner_id: null,
      children_id: null,
      gender: null,
    };

    switch (relation) {
      case "father":
        data.children_id = id;
        data.gender = "m";
        break;
      case "mother":
        data.children_id = id;
        data.gender = "f";
        break;
      case "son":
        if (gender === "m") {
          data.father_id = id;
          data.mother_id = pid;
        } else {
          data.father_id = pid;
          data.mother_id = id;
        }
        data.gender = "m";
        break;
      case "daughter":
        if (gender === "m") {
          data.father_id = id;
          data.mother_id = pid;
        } else {
          data.father_id = pid;
          data.mother_id = id;
        }
        data.gender = "f";
        break;
      case "spouse":
        data.partner_id = id;
        data.gender = gender === "m" ? "f" : "m";
        break;
      case "brother":
        data.father_id = fid;
        data.mother_id = mid;
        data.gender = "m";
        break;
      case "sister":
        data.father_id = fid;
        data.mother_id = mid;
        data.gender = "f";
        break;
    }

    return data;
  };

  const selectedRelation = useWatch({
    control: form.control,
    name: "relation",
  });

  // Determine gender based on relation
  const getGenderForRelation = (relation) => {
    switch (relation) {
      case "father":
      case "son":
      case "brother":
        return "m";
      case "mother":
      case "daughter":
      case "sister":
        return "f";
      case "spouse":
        return gender === "m" ? "f" : "m";
      default:
        return null;
    }
  };

  const relationGender = getGenderForRelation(selectedRelation);

  const filteredRelativesDropDown = relationshipTypes?.filter((relation) => {
    switch (relation.value) {
      case "father":
        return !fid;
      case "mother":
        return !mid;
      case "spouse":
        return !pid;
      default:
        return true;
    }
  });

  const onSubmit = async (values) => {
    try {
      const relationData = calculateRelationData(values.relation);
      if (!relationData) return;

      const memberData = {
        ...values,
        ...relationData,
        // Clear email and phone for deceased
        email: values.is_alive ? values.email : null,
        phone_no: values.is_alive
          ? values.phone_no
            ? `${countryCode}${values.phone_no}`
            : null
          : null,
        // Clear age range for deceased
        age_range: values.is_alive ? values.age_range : null,
        is_alive: values.is_alive ? 1 : 0,
      };

      await addMember(memberData);
      onSuccess?.();
    } catch (error) {
      console.log("Error adding member", error);
    }
  };

  const ageRangeId = useWatch({
    control: form.control,
    name: "age_range",
  });

  // Find the selected age range object
  const selectedAgeRange = ageRanges?.find((range) => range.id === ageRangeId);

  // Extract the numeric values from the age range name
  const getAgeRangeNumbers = (ageRangeName) => {
    if (!ageRangeName) return null;
    const numbers = ageRangeName.match(/\d+/g);
    if (!numbers) return null;
    return numbers.map(Number);
  };

  const isAlive = useWatch({
    control: form.control,
    name: "is_alive",
  });

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
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="absolute top-4 left-4 h-4 w-4 flex items-center justify-center cursor-pointer rounded-full p-3 bg-primary border border-primary-foreground">
              <Link onClick={onCancel}>
                <ArrowLeft className="w-5 h-5 text-primary-foreground" />
              </Link>
            </div>
          </div>

          <div className="text-center pt-12">
            <h2 className="text-xl font-semibold">{t("add_new_relative")}</h2>
          </div>

          <div className="space-y-6 p-2 md:p-4 lg:p-6">
            <div className="grid md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="relation"
                render={({ field }) => (
                  <FormItem>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="h-10 rounded-full focus:outline-none focus:ring-1 focus:ring-primary focus:ring-offset-0 focus:border-primary border border-primary">
                          <SelectValue placeholder={t("select_relation")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="rounded-2xl max-h-[150px]">
                        <SelectGroup>
                          <SelectLabel>{t("relation")}</SelectLabel>
                          {filteredRelativesDropDown?.map((relation) => (
                            <SelectItem
                              key={relation.id}
                              value={relation.value}
                            >
                              {relation.label}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormItem>
                <FormControl>
                  <Input
                    value={relationGender === "m" ? t("male") : t("female")}
                    disabled
                    className="h-10 rounded-full focus:outline-none focus:ring-1 focus:ring-primary focus:ring-offset-0 focus:border-primary border border-primary"
                    placeholder={t("gender")}
                  />
                </FormControl>
              </FormItem>

              <FormField
                control={form.control}
                name="first_name"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        {...field}
                        className="rounded-full h-10 focus:outline-none focus:ring-1 focus:ring-primary focus:ring-offset-0 focus:border-primary border border-primary"
                        placeholder={t("first_name")}
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
                        className="rounded-full h-10 focus:outline-none focus:ring-1 focus:ring-primary focus:ring-offset-0 focus:border-primary border border-primary"
                        placeholder={t("middle_name")}
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
                        className="rounded-full h-10 focus:outline-none focus:ring-1 focus:ring-primary focus:ring-offset-0 focus:border-primary border border-primary"
                        placeholder={t("last_name")}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                          className="rounded-full"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

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
                        className="rounded-full h-10 focus:outline-none focus:ring-1 focus:ring-primary focus:ring-offset-0 focus:border-primary border border-primary"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex items-end">
                <FormField
                  control={form.control}
                  name="is_alive"
                  render={({ field }) => (
                    <FormItem className="flex items-end gap-2">
                      <FormLabel>{t("living_status")}</FormLabel>
                      <FormControl>
                        <Switch
                          checked={field.value === 1}
                          onCheckedChange={(checked) => {
                            field.onChange(checked ? 1 : 0);
                            // Trigger validation after change
                            form.trigger(["age_range", "phone_no", "email"]);
                          }}
                          className="data-[state=checked]:bg-brandPrimary data-[state=checked]:border-brandPrimary data-[state=checked]:hover:bg-brandPrimary data-[state=checked]:hover:border-brandPrimary"
                        />
                      </FormControl>
                      <FormDescription>
                        {field.value === 1 ? t("alive") : t("deceased")}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

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
                className="rounded-full bg-brandPrimary text-white"
                disabled={isSubmitting}
              >
                {isSubmitting ? t("adding_member") : t("add_member")}
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
