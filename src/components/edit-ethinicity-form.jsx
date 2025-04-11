import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "./ui/button";
import { Form, FormControl, FormField, FormItem, FormMessage } from "./ui/form";
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
  useCastes,
  useGotras,
  useReligions,
  useSects,
  useSubCastes,
} from "@/hooks/useMasters";
import ComponentLoading from "./component-loading";
import SearchableDropdown from "./custom-ui/searchable-dropdown";
import { Pen } from "lucide-react";
import { useTranslation } from "react-i18next";
import { CustomCircularProgress } from "./custom-ui/custom_circular_progress";

export default function EditEthnicityForm() {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const { profile, updateProfile, isLoading } = useProfile(
    "/user/regional-info"
  );
  const { width } = useWindowSize();
  const ethnicitySchema = z.object({
    religion_id: z.string().min(1, t("religion_required")),
    caste_id: z.string().optional(),
    sub_caste_id: z.string().optional(),
    gotra_id: z.string().optional(),
    sect_id: z.string().optional(),
  });

  const form = useForm({
    resolver: zodResolver(ethnicitySchema),
    defaultValues: {
      religion_id: "",
      caste_id: "",
      sub_caste_id: "",
      gotra_id: "",
      sect_id: "",
    },
  });

  const { data: religions, isLoading: religionsLoading } = useReligions();

  const {
    data: castes,
    isLoading: castesLoading,
    refetch: refetchCastes,
  } = useCastes(form.watch("religion_id") || profile?.religion?.id?.toString());

  const calculateProfileCompletion = (profile) => {
    if (!profile) return 0;

    const fields = ["religion", "caste", "sub_caste", "gotra", "sect"];

    const totalFields = fields.length;
    let completedFields = 0;

    fields.forEach((field) => {
      if (
        profile[field] &&
        profile[field].name &&
        profile[field].name.trim() !== ""
      ) {
        completedFields += 1;
      }
    });

    return Math.round((completedFields / totalFields) * 100);
  };
  const profileCompletion = calculateProfileCompletion(profile);

  const {
    data: subCastes,
    isLoading: subCastesLoading,
    refetch: refetchSubCastes,
  } = useSubCastes(
    form.watch("religion_id") || profile?.religion?.id?.toString(),
    form.watch("caste_id") || profile?.caste?.id?.toString()
  );

  const {
    data: gotras,
    isLoading: gotrasLoading,
    refetch: refetchGotras,
  } = useGotras(form.watch("religion_id") || profile?.religion?.id?.toString());

  const {
    data: sects,
    isLoading: sectsLoading,
    refetch: refetchSects,
  } = useSects(form.watch("religion_id") || profile?.religion?.id?.toString());

  useEffect(() => {
    if (profile) {
      form.reset({
        religion_id: profile?.religion?.id?.toString() || "",
        caste_id: profile?.caste?.id?.toString() || "",
        sub_caste_id: profile?.sub_caste?.id?.toString() || "",
        gotra_id: profile?.gotra?.id?.toString() || "",
        sect_id: profile?.sect?.id?.toString() || "",
      });
    }
  }, [profile, form]);

  // Watch for religion changes
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "religion_id") {
        refetchCastes();
        refetchGotras();
        refetchSects();
        form.setValue("caste_id", "");
        form.setValue("sub_caste_id", "");
        form.setValue("gotra_id", "");
        form.setValue("sect_id", "");
      }
      if (name === "caste_id") {
        refetchSubCastes();
        form.setValue("sub_caste_id", "");
      }
    });
    return () => subscription.unsubscribe();
  }, [form.watch]);

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    form.reset();
  };

  const onSubmit = async (values) => {
    try {
      await updateProfile({
        url: "/user/regional-info",
        data: values,
      });
      setIsEditing(false);
    } catch (error) {
      console.error(t("error_updating_ethinicity"));
    }
  };

  const selectedReligion = religions?.find(
    (r) => r.id === Number(form.watch("religion_id"))
  );
  const selectedCaste = castes?.find(
    (c) => c.id === Number(form.watch("caste_id"))
  );

  const content = isEditing ? (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="religion_id"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <SearchableDropdown
                    options={
                      religions?.map((r) => ({
                        id: r.id.toString(),
                        name: r.name,
                      })) || []
                    }
                    {...field}
                    placeholder={t("religion")}
                    searchPlaceholder={t("search_religion")}
                    isLoading={religionsLoading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {(selectedReligion?.has_caste === 1 || form.watch("caste_id")) && (
            <FormField
              control={form.control}
              name="caste_id"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <SearchableDropdown
                      options={
                        castes?.map((c) => ({
                          id: c.id.toString(),
                          name: c.name,
                        })) || []
                      }
                      {...field}
                      placeholder={t("caste")}
                      searchPlaceholder={t("search_caste")}
                      isLoading={castesLoading}
                      disabled={!form.watch("religion_id") || religionsLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {(selectedCaste?.has_sub_castes === 1 ||
            form.watch("sub_caste_id")) && (
            <FormField
              control={form.control}
              name="sub_caste_id"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <SearchableDropdown
                      options={
                        subCastes?.map((sc) => ({
                          id: sc.id.toString(),
                          name: sc.name,
                        })) || []
                      }
                      {...field}
                      placeholder={t("sub_caste")}
                      searchPlaceholder={t("search_sub_caste")}
                      isLoading={subCastesLoading}
                      disabled={!form.watch("caste_id") || castesLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {(selectedReligion?.has_gotra === 1 || form.watch("gotra_id")) && (
            <FormField
              control={form.control}
              name="gotra_id"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <SearchableDropdown
                      options={
                        gotras?.map((g) => ({
                          id: g.id.toString(),
                          name: g.name,
                        })) || []
                      }
                      {...field}
                      placeholder={t("gotra")}
                      searchPlaceholder={t("search_gotra")}
                      isLoading={gotrasLoading}
                      disabled={!form.watch("religion_id") || religionsLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {(selectedReligion?.has_sect === 1 || form.watch("sect_id")) && (
            <FormField
              control={form.control}
              name="sect_id"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <SearchableDropdown
                      options={
                        sects?.map((s) => ({
                          id: s.id.toString(),
                          name: s.name,
                        })) || []
                      }
                      {...field}
                      placeholder={t("sect")}
                      searchPlaceholder={t("search_sect")}
                      isLoading={sectsLoading}
                      disabled={!form.watch("religion_id") || religionsLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
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
  ) : profile?.religion ? (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      {profile?.religion?.name ? (
        <div>
          <p className="text-sm">{t("religion")}</p>
          <h3 className="text-md font-semibold">
            {profile?.religion?.name || "--"}
          </h3>
        </div>
      ) : null}
      {profile?.caste?.name ? (
        <div>
          <p className="text-sm">{t("caste")}</p>
          <h3 className="text-md font-semibold">
            {profile?.caste?.name || "--"}
          </h3>
        </div>
      ) : null}
      {profile?.sub_caste?.name ? (
        <div>
          <p className="text-sm">{t("sub_caste")}</p>
          <h3 className="text-md font-semibold">
            {profile?.sub_caste?.name || "--"}
          </h3>
        </div>
      ) : null}
      {profile?.gotra?.name ? (
        <div>
          <p className="text-sm">{t("gotra")}</p>
          <h3 className="text-md font-semibold">
            {profile?.gotra?.name || "--"}
          </h3>
        </div>
      ) : null}
      {profile?.sect?.name ? (
        <div>
          <p className="text-sm">{t("sect")}</p>
          <h3 className="text-md font-semibold">
            {profile?.sect?.name || "--"}
          </h3>
        </div>
      ) : null}
    </div>
  ) : (
    <div>{t("no_ethinicity_added")}</div>
  );

  if (isLoading) {
    return <ComponentLoading />;
  }

  return width > 640 ? (
    <>
      <div className="px-3">
        <div className="h-[60px] flex items-center justify-between border-b">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-medium">{t("ethinicity")}</h2>
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
              className="flex items-center gap-2 border border-brandPrimary dark:border-dark-card text-light-text rounded-l-full rounded-r-full px-4 py-2 cursor-pointer hover:bg-brandPrimary hover:text-white"
              onClick={handleEditClick}
            >
              <span>{t("edit")}</span>
              <img src={ICON_EDIT2} className="" />
            </button>
          )}
        </div>
      </div>
      <div className="p-4">{content}</div>
    </>
  ) : (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="item-1 border-none" className="border-none">
        <AccordionTrigger className="bg-[#F3EAF3] px-4 rounded-[6px] text-brandPrimary text-[16px] h-[48px] border-none">
          <div className="flex justify-between gap-4 items-center">
            {t("ethinicity")}
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
