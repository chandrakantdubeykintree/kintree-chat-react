import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import AsyncComponent from "@/components/async-component";
// import { AddRelativeDialog } from "@/components/add-relative-dialog";
import { useState } from "react";
import toast from "react-hot-toast";
import { Copy } from "lucide-react";
import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { useUpdateFamilyMember } from "@/hooks/useFamily";
import { useTranslation } from "react-i18next";

export function FamilyMemberDialog({
  isOpen,
  onClose,
  selectedMember,
  selectedMemberInfo,
  nodes,
}) {
  const { t } = useTranslation();

  const editRelativeSchema = z.object({
    first_name: z
      .string()
      .min(1, t("first_name_required"))
      .max(20, t("first_name_max_length")),
    middle_name: z.string().max(20, t("middle_name_max_length")).optional(),
    last_name: z
      .string()
      .min(1, t("last_name_required"))
      .max(20, t("last_name_max_length")),
    email: z.string().email(t("invalid_email_address")).or(z.literal("")),
    phone_no: z
      .string()
      .regex(/^\+?[1-9]\d{1,14}$/, t("invalid_phone_number"))
      .or(z.literal("")),
    is_alive: z.number().min(0).max(1),
    age_range: z
      .number()
      .min(1, t("age_range_required"))
      .max(5, t("invalid_age_range")),
  });
  const father =
    nodes.find((node) => node.id === selectedMember?.fid)?.name || "--";
  const mother =
    nodes.find((node) => node.id === selectedMember?.mid)?.name || "--";
  const spouse =
    nodes.find((node) => selectedMember?.pids?.includes(node.id))?.name || "--";
  const coverPicUrl =
    selectedMemberInfo?.profile_cover_pic_url ||
    "/illustrations/illustration_bg.png";
  const profilePicUrl =
    selectedMember?.photo || "/illustrations/illustration_bg.png";
  const selectedMemberName = selectedMember?.name || "--";
  const relation = selectedMember?.relation || "--";
  const livingStatus = selectedMember?.status ? "Alive" : "Deceased" || "--";
  const gender = selectedMember?.gender === "m" ? "Male" : "Female" || "--";
  const username = selectedMemberInfo?.username || "--";
  const password = selectedMemberInfo?.password || "--";

  const [addRelative, setAddRelative] = useState({
    open: false,
    selectedMember: selectedMember,
    selectedMemberInfo: selectedMemberInfo,
  });

  const [isEditing, setIsEditing] = useState(false);
  const { mutateAsync: updateMember, isLoading: isSubmitting } =
    useUpdateFamilyMember();

  const form = useForm({
    resolver: zodResolver(editRelativeSchema),
    defaultValues: {
      first_name: selectedMember?.name?.split(" ")[0] || "",
      middle_name: selectedMember?.name?.split(" ")[1] || "",
      last_name: selectedMember?.name?.split(" ")[2] || "",
      email: selectedMemberInfo?.email || "",
      phone_no: selectedMemberInfo?.phone_no || "",
      is_alive: selectedMember?.status ? 1 : 0,
      age_range: selectedMember?.age_range || 1,
    },
  });

  const onSubmit = async (values) => {
    try {
      //  family-tree/members/:memberId
      await updateMember({
        id: selectedMember?.id,
        ...values,
        is_alive: values.is_alive ? 1 : 0,
      });
      setIsEditing(false);
      toast.success(t("relative_updated_successfully"));
    } catch (error) {
      toast.error(t("failed_to_update_relative"));
    }
  };

  const handleCopy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(t("username_and_password_copied_to_clipboard"));
    } catch (err) {
      toast.error(t("failed_to_copy_to_clipboard"));
    }
  };

  return (
    <AsyncComponent>
      <Dialog open={isOpen} onOpenChange={onClose} modal={true}>
        {isEditing ? (
          <DialogContent className="sm:max-w-lg">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <DialogHeader>
                  <DialogTitle>{t("edit_relative")}</DialogTitle>
                  <DialogDescription>
                    {t("make_changes_to_relative_information_here")}
                  </DialogDescription>
                </DialogHeader>

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
                            className={`border bg-background border-gray-300 rounded-r-full rounded-l-full h-10 px-4`}
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
                            className={`border bg-background border-gray-300 rounded-r-full rounded-l-full h-10 px-4`}
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
                            className={`border bg-background border-gray-300 rounded-r-full rounded-l-full h-10 px-4`}
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
                            type="email"
                            {...field}
                            placeholder={t("email_address")}
                            className={`border bg-background border-gray-300 rounded-r-full rounded-l-full h-10 px-4`}
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
                        <FormControl>
                          <PhoneInput
                            international
                            countryCallingCodeEditable={false}
                            defaultCountry="IN"
                            value={field.value}
                            onChange={field.onChange}
                            maxLength={15}
                            limitMaxLength
                            placeholder={t("phone_number")}
                            className={`border bg-background border-gray-300 rounded-r-full rounded-l-full h-10 px-4`}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="age_range"
                    render={({ field }) => (
                      <FormItem>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="h-10 rounded-full text-foreground bg-background">
                              <SelectValue
                                placeholder={t("select_age_range")}
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="max-h-[150px] overflow-y-auto no_scrollbar rounded-2xl">
                            <SelectItem value={1}>0-18</SelectItem>
                            <SelectItem value={2}>19-35</SelectItem>
                            <SelectItem value={3}>36-50</SelectItem>
                            <SelectItem value={4}>51-70</SelectItem>
                            <SelectItem value={5}>70+</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Contact Fields */}
                <div className="grid md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="is_alive"
                    render={({ field }) => (
                      <FormItem className="flex items-center gap-2">
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

                {/* Status Fields */}
                <div className="grid grid-cols-2 gap-4"></div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditing(false)}
                    className="rounded-full"
                  >
                    {t("cancel")}
                  </Button>
                  <Button type="submit" className="rounded-full bg-primary">
                    {t("save_changes")}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        ) : (
          <DialogContent className="sm:max-w-lg">
            {/* Images Section */}
            <div className="relative h-[200px] w-full">
              {/* Cover Picture */}
              <div className="h-full w-full overflow-hidden rounded-t-lg">
                <img
                  src={coverPicUrl}
                  alt="Cover"
                  className="h-full w-full object-cover"
                />
              </div>

              {/* Profile Picture */}
              <div className="absolute left-1/2 -bottom-1/4 -translate-x-1/2 transform">
                <div className="h-[100px] w-[100px] overflow-hidden rounded-full border-4 border-primary">
                  <img
                    src={profilePicUrl}
                    alt="Profile"
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>
            </div>

            <DialogHeader className="mt-12">
              <DialogTitle className="text-center my-2">
                {selectedMemberName}
              </DialogTitle>
              <div className="grid grid-cols-2 gap-1 pt-4">
                <div className="flex items-center gap-2">
                  {t("relationship")}:{" "}
                  <span
                    className="font-semibold line-clamp-1 text-wrap"
                    title={relation}
                  >
                    {relation}
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {t("living_status")}:{" "}
                  <span className="font-semibold">{livingStatus}</span>
                </div>
              </div>
            </DialogHeader>

            <hr />

            <div className="grid grid-cols-2 gap-2">
              {/* Personal Info */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold">{t("gender")}:</span>
                  <span>{gender}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{t("spouse")}:</span>
                  <span className="line-clamp-1 text-wrap" title={spouse}>
                    {spouse}
                  </span>
                </div>
              </div>

              {/* Family Info */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{t("father")}:</span>
                  <span className="line-clamp-1 text-wrap" title={father}>
                    {father}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-semibold">{t("mother")}:</span>
                  <span className="line-clamp-1 text-wrap" title={mother}>
                    {mother}
                  </span>
                </div>
              </div>
            </div>
            {/* login details */}
            {selectedMember?.is_user_added_by_me &&
            selectedMemberInfo?.is_active !== 1 ? (
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{t("username")}:</span>
                  <span
                    className="line-clamp-1 text-wrap text-ellipsis"
                    title={username}
                  >
                    {username}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{t("password")}:</span>
                  <span className="line-clamp-1 text-wrap" title={password}>
                    {password}
                  </span>
                </div>
              </div>
            ) : null}

            {selectedMember?.is_user_added_by_me &&
            selectedMemberInfo?.is_active !== 1 ? (
              <Button
                className="mt-2 py-2 px-4 max-w-min rounded-full bg-primary"
                onClick={() =>
                  handleCopy(
                    `Username: ${username}\nPassword: ${password}`,
                    "both"
                  )
                }
              >
                {t("share_login_details")} <Copy />
              </Button>
            ) : null}

            <DialogFooter className="flex gap-4 mt-4">
              <Button
                onClick={() => {
                  setAddRelative((prev) => ({ ...prev, open: !prev.open }));
                }}
                className="rounded-full"
                variant="outline"
              >
                {t("add_relative")}
              </Button>
              {selectedMember?.is_user_added_by_me &&
              selectedMemberInfo?.is_active !== 1 ? (
                <Button
                  onClick={() => setIsEditing(true)}
                  className="rounded-full"
                >
                  {t("edit_profile")}
                </Button>
              ) : null}
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
      {addRelative.open &&
        // <AddRelativeDialog
        //   selectedMember={selectedMember}
        //   selectedMemberInfo={selectedMemberInfo}
        //   nodes={nodes}
        //   isOpen={addRelative?.open}
        //   onClose={() =>
        //     setAddRelative({
        //       modalOpen: false,
        //       selectedMember: null,
        //       selectedMemberInfo: null,
        //     })
        //   }
        // />
        null}
    </AsyncComponent>
  );
}
