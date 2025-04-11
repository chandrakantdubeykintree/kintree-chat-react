import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormMessage } from "./ui/form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { capitalizeName } from "@/utils/stringFormat";
import { useProfile } from "@/hooks/useProfile";
import { useWindowSize } from "@/hooks/useWindowSize";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ICON_EDIT } from "@/constants/iconUrls";
import { Textarea } from "@/components/ui/textarea";
import ComponentLoading from "@/components/component-loading";
import { Pen } from "lucide-react";
import CustomDateMonthYearPicker from "./custom-ui/custom-dateMonthYearPicker";
import { useTranslation } from "react-i18next";
import { CustomCircularProgress } from "./custom-ui/custom_circular_progress";

export default function EditBasicInfoForm() {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const { profile, updateProfile, isLoading } = useProfile("/user/basic-info");
  const { width } = useWindowSize();

  const calculateProfileCompletion = (profile) => {
    if (!profile) return 0;
    const fields = [
      "first_name",
      "middle_name",
      "last_name",
      "date_of_birth",
      "gender",
      "bio",
      "nickname",
    ];
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

  const basicInfoSchema = z.object({
    first_name: z.string().min(1, t("first_name_required")),
    middle_name: z.string().optional(),
    last_name: z.string().min(1, t("last_name_required")),
    date_of_birth: z.string().min(1, t("date_of_birth_required")),
    gender: z.string().optional(),
    bio: z.string().max(500, t("bio_max")).optional(),
    nickname: z.string().max(50, t("nickname_max")).optional(),
  });

  const form = useForm({
    resolver: zodResolver(basicInfoSchema),
    defaultValues: {
      first_name: profile?.first_name || "",
      middle_name: profile?.middle_name || "",
      last_name: profile?.last_name || "",
      date_of_birth: profile?.date_of_birth || "",
      gender: profile?.gender || "",
      bio: profile?.bio || "",
      nickname: profile?.nickname || "",
    },
  });

  useEffect(() => {
    if (profile) {
      form.reset({
        first_name: profile.first_name || "",
        middle_name: profile.middle_name || "",
        last_name: profile.last_name || "",
        date_of_birth: profile.date_of_birth || "",
        gender: profile.gender || "",
        bio: profile.bio || "",
        nickname: profile.nickname || "",
      });
    }
  }, [profile, form]);

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const onSubmit = async (values) => {
    await updateProfile({
      url: "/user/basic-info",
      data: values,
    });
    setIsEditing(false);
  };

  const content = isEditing ? (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="first_name"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    {...field}
                    placeholder={t("first_name")}
                    className="rounded-full bg-background text-foreground my-2 shadow-sm px-4 h-10"
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
                    className="rounded-full bg-background text-foreground my-2 shadow-sm px-4 h-10"
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
                    className="rounded-full bg-background text-foreground my-2 shadow-sm px-4 h-10"
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
            name="nickname"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    {...field}
                    placeholder={t("nickname")}
                    className="rounded-full bg-background text-foreground my-2 shadow-sm px-4 h-10"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="bio"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder={t("bio")}
                    className="w-full p-2 border rounded-xl bg-background text-foreground my-2 shadow-sm px-4 h-10"
                    rows="5"
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
      <div>
        <p className="text-sm">{t("first_name")}</p>
        <h3 className="text-md font-semibold">
          {capitalizeName(profile?.first_name) || "--"}
        </h3>
      </div>
      <div>
        <p className="text-sm">{t("middle_name")}</p>
        <h3 className="text-md font-semibold">
          {profile?.middle_name || "--"}
        </h3>
      </div>
      <div>
        <p className="text-sm">{t("last_name")}</p>
        <h3 className="text-md font-semibold">
          {capitalizeName(profile?.last_name) || "--"}
        </h3>
      </div>
      <div>
        <p className="text-sm">{t("gender")}</p>
        <h3 className="text-md font-semibold">
          {capitalizeName(profile?.gender === "m" ? "Male" : "Female") || "--"}
        </h3>
      </div>
      <div>
        <p className="text-sm">{t("nickname")}</p>
        <h3 className="text-md font-semibold">
          {capitalizeName(profile?.nickname || "--") || "--"}
        </h3>
      </div>
      <div>
        <p className="text-sm">{t("date_of_birth")}</p>
        <h3 className="text-md font-semibold">
          {profile?.date_of_birth || "--"}
        </h3>
      </div>
      <div>
        <p className="text-sm">{t("bio")}</p>
        <h3 className="text-md font-semibold">{profile?.bio || "--"}</h3>
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
            <h2 className="text-lg font-medium">{t("basic_information")}</h2>
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
              <span className="text-sm">{t("edit")}</span>
              <img src={ICON_EDIT} className="w-3" />
            </button>
          )}
        </div>
      </div>
      <div className="p-4">{content}</div>
    </>
  ) : (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="item-1" className="border-none">
        <AccordionTrigger className="bg-[#F3EAF3] px-4 rounded-[6px] text-brandPrimary text-[16px] h-[48px] border-0">
          <div className="flex justify-between gap-4 items-center">
            {t("basic_information")}
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
        <AccordionContent className="p-4 relative border-none">
          <div className="flex absolute top-1 right-0 rounded-full w-10 h-10 cursor-pointer items-center justify-center">
            {!isEditing && (
              <Pen className="w-5 stroke-primary" onClick={handleEditClick} />
            )}
          </div>
          {content}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
