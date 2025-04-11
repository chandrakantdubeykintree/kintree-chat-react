import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "./ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/accordion";
import { ICON_EDIT2 } from "@/constants/iconUrls";
import { useProfile } from "@/hooks/useProfile";
import { useWindowSize } from "@/hooks/useWindowSize";
import {
  useBloodGroups,
  useLanguages,
  useOccupations,
  useRelationshipTypes,
} from "@/hooks/useMasters";
import ComponentLoading from "./component-loading";
import toast from "react-hot-toast";
import { LocationSearchInput } from "./location-search-input";
import CustomMultiSelect from "./custom-ui/custom-multi-select";
import SearchableDropdown from "./custom-ui/searchable-dropdown";
import CustomDateMonthYearPicker from "./custom-ui/custom-dateMonthYearPicker";
import { Form, FormControl, FormField, FormItem, FormMessage } from "./ui/form";
import { Pen } from "lucide-react";
import { useTranslation } from "react-i18next";
import { CustomCircularProgress } from "./custom-ui/custom_circular_progress";
import { encryptId } from "@/utils/encryption";
import { useNavigate } from "react-router";
import { capitalizeName } from "@/utils/stringFormat";

export default function EditAdditionalInfoForm() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const { profile, updateProfile, isLoading } = useProfile(
    "/user/additional-info"
  );
  const { width } = useWindowSize();

  const additionalInfoSchema = z.object({
    birth_place: z.string().min(1, t("birth_place_required")),
    blood_group: z.string().min(1, t("blood_group_required")),
    current_city: z.string().min(1, t("current_city_required")),
    date_of_anniversary: z.string().optional(),
    known_language_ids: z
      .array(z.string())
      .min(1, t("known_languages_required")),
    // mother_tongue: z.string().min(1, t("mother_tongue_required")),
    mother_tongue: z
      .union([z.string(), z.number()]) // Accept both string and number
      .transform((value) => value.toString()),
    native_place: z.string().min(1, t("native_place_required")),
    occupation: z.string().min(1, t("occupation_required")),
    relationship_status: z.string().min(1, t("relationship_status_required")),
  });

  const { data: languagesList } = useLanguages();
  const { data: bloodGroupsList } = useBloodGroups();
  const { data: occupationList } = useOccupations();
  const { data: relationshipStatusList } = useRelationshipTypes();

  const form = useForm({
    resolver: zodResolver(additionalInfoSchema),
    defaultValues: {
      birth_place: "",
      blood_group: "",
      current_city: "",
      date_of_anniversary: "",
      known_language_ids: [],
      mother_tongue: "",
      native_place: "",
      occupation: "",
      relationship_status: "",
    },
  });

  const calculateProfileCompletion = (profile) => {
    if (!profile) return 0;

    // Fields specific to additional information
    const fields = [
      "birth_place",
      "blood_group",
      "current_city",
      "known_languages",
      "mother_tongue",
      "native_place",
      "occupation",
      "date_of_anniversary",
      "relationship_status",
      "godfather",
    ];

    const totalFields = fields.length;
    let completedFields = 0;

    fields.forEach((field) => {
      if (field === "known_languages") {
        if (profile[field] && profile[field].length > 0) {
          completedFields += 1;
        }
      } else if (field === "godfather") {
        if (profile[field] && profile[field].profile) {
          completedFields += 1;
        }
      } else if (profile[field] && profile[field].trim() !== "") {
        completedFields += 1;
      }
    });

    return Math.round((completedFields / totalFields) * 100);
  };
  const profileCompletion = calculateProfileCompletion(profile);

  useEffect(() => {
    if (profile) {
      form.reset({
        birth_place: profile.birth_place || "",
        blood_group: profile.blood_group || "",
        current_city: profile.current_city || "",
        date_of_anniversary: profile.date_of_anniversary || "",
        known_language_ids: Array.isArray(profile.known_languages)
          ? profile.known_languages.map(
              (lang) => lang.id?.toString() || lang.toString()
            )
          : [],
        mother_tongue:
          languagesList?.find((lang) => lang.name === profile.mother_tongue)
            ?.id || "",
        native_place: profile.native_place || "",
        occupation: profile.occupation || "",
        relationship_status: profile.relationship_status || "",
      });
    }
  }, [profile, form]);

  const relationshipStatus = form.watch("relationship_status");

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    form.reset();
  };

  const onSubmit = async (values) => {
    values = {
      ...values,
      known_language_ids: values.known_language_ids.map((id) => id.toString()),
      date_of_anniversary:
        values.relationship_status === "married"
          ? values.date_of_anniversary
          : null,
    };
    try {
      await updateProfile({
        url: "/user/additional-info",
        data: values,
      });
      setIsEditing(false);
    } catch (error) {
      toast.error(t("error_failed_to_update_additional_info"));
    }
  };

  const content = isEditing ? (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="birth_place"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <LocationSearchInput
                    {...field}
                    placeholder={t("birth_place")}
                    className="rounded-full h-10 md:h-12 bg-background"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="blood_group"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <SearchableDropdown
                    options={
                      bloodGroupsList?.map((bg) => ({
                        id: bg.id?.toString() || bg,
                        name: bg.name || bg,
                      })) || []
                    }
                    {...field}
                    placeholder={t("blood_group")}
                    className="h-10 md:h-12 bg-background rounded-full"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="current_city"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <LocationSearchInput
                    {...field}
                    placeholder={t("current_city")}
                    className="rounded-full h-10 md:h-12 bg-background"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="relationship_status"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <SearchableDropdown
                    options={
                      relationshipStatusList?.map((rs) => ({
                        id: rs.id?.toString() || rs,
                        name: rs.name || rs,
                      })) || []
                    }
                    {...field}
                    placeholder={t("relationship_status")}
                    className="h-10 md:h-12 bg-background rounded-full"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {relationshipStatus?.toLowerCase() === "married" && (
            <FormField
              control={form.control}
              name="date_of_anniversary"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <CustomDateMonthYearPicker
                      value={field.value}
                      onChange={field.onChange}
                      placeholder={t("date_of_anniversary")}
                      className="rounded-full h-10 md:h-12 bg-background"
                      initialFocus
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="known_language_ids"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <CustomMultiSelect
                    options={
                      languagesList?.map((lang) => ({
                        value: lang.id.toString(),
                        label: lang.name,
                      })) || []
                    }
                    value={field.value}
                    onChange={field.onChange}
                    placeholder={t("known_languages")}
                    item_name="language"
                    className="h-10 md:h-12 bg-background rounded-full"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="mother_tongue"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <SearchableDropdown
                    options={
                      languagesList?.map((lang) => ({
                        id: lang.id?.toString() || lang,
                        name: lang.name || lang,
                      })) || []
                    }
                    {...field}
                    placeholder={t("mother_tongue")}
                    className="h-10 md:h-12 bg-background rounded-full"
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
                    {...field}
                    placeholder={t("native_place")}
                    className="rounded-full h-10 md:h-12 bg-background"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="occupation"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <SearchableDropdown
                    options={
                      occupationList?.map((occ) => ({
                        id: occ.id?.toString() || occ,
                        name: occ.name || occ,
                      })) || []
                    }
                    {...field}
                    placeholder={t("occupation")}
                    className="h-10 md:h-12 bg-background rounded-full"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

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
            {t("save_changes")}
          </Button>
        </div>
      </form>
    </Form>
  ) : (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      {Object.entries({
        "Birth Place": profile?.birth_place,
        "Blood Group": profile?.blood_group,
        "Current City": profile?.current_city,
        "Date of Anniversary": profile?.date_of_anniversary,
        "Known Languages": profile?.known_languages
          ?.map((lang) => lang.name)
          ?.join(", "),
        "Mother Tongue": profile?.mother_tongue,
        "Native Place": profile?.native_place,
        Occupation: profile?.occupation,
        "Relationship Status": profile?.relationship_status,
      }).map(([label, value]) => (
        <div key={label}>
          <p className="text-sm">{label}</p>
          <h3 className="text-md font-semibold">
            {capitalizeName(value) || "--"}
          </h3>
        </div>
      ))}
      <div>
        <p className="text-sm">{t("godfather")}</p>
        <h3
          className="text-md font-semibold"
          // className={`text-md font-semibold ${
          //   profile?.godfather ? "text-primary underline cursor-pointer" : ""
          // }`}
          // onClick={() => {
          //   const encryptedId = encryptId(profile?.godfather?.id);
          //   if (!encryptedId) {
          //     console.error("Encryption failed");
          //     return;
          //   }
          //   navigate(`/family-member/${encryptedId}`);
          // }}
        >
          {profile?.godfather
            ? profile?.godfather?.profile?.first_name +
              " " +
              profile?.godfather?.profile?.last_name
            : "--"}
        </h3>
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
            <h2 className="text-lg font-medium">
              {t("additional_information")}
            </h2>
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
          {!isEditing && (
            <button
              className="flex items-center gap-2 border border-brandPrimary border-dark-border dark:border-dark-card text-light-text rounded-l-full rounded-r-full px-4 py-2 cursor-pointer hover:bg-brandPrimary hover:text-white"
              onClick={handleEditClick}
            >
              <span>Edit</span>
              <img src={ICON_EDIT2} className="" />
            </button>
          )}
        </div>
      </div>
      <div className="p-4">{content}</div>
    </>
  ) : (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="item-1" className="border-none">
        <AccordionTrigger className="bg-[#F3EAF3] px-4 rounded-[6px] text-brandPrimary text-[16px] h-[48px]">
          <div className="flex justify-between gap-4 items-center">
            {t("additional_information")}
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
        <AccordionContent className="border-none p-4 relative">
          <div className="flex absolute top-1 right-0 rounded-full w-10 h-10 cursor-pointer items-center justify-center">
            {!isEditing && (
              <Pen
                className="w-5 stroke-brandPrimary"
                onClick={handleEditClick}
              />
            )}
          </div>
          {content}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
