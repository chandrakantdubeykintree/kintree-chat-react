import AsyncComponent from "@/components/async-component";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Loader2, Upload, X } from "lucide-react";
import { useCreateEvent } from "@/hooks/useEvents";
import {
  useDeleteAttachment,
  useUploadAttachment,
} from "@/hooks/useAttachments";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { useFamilyMembers } from "@/hooks/useFamily";
import { useEventCategories, useKincoinRewardEvents } from "@/hooks/useMasters";
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
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { capitalizeName } from "@/utils/stringFormat";
import { addHours, format } from "date-fns";
import { NavLink, useNavigate } from "react-router";
import { Map } from "@/components/map";
import { LocationSearchInput } from "@/components/location-search-input";
import CustomMultiSelect from "@/components/custom-ui/custom-multi-select";
import { Card } from "@/components/ui/card";
import CustomDateTimePicker from "@/components/custom-ui/custom-date-time-picker";
import { useTranslation } from "react-i18next";
import { useConfettiStore } from "@/services/confettiStore";

export default function CreateEvent() {
  const { t } = useTranslation();
  const { data: rewardEvents } = useKincoinRewardEvents();
  const coinEarnable = parseInt(
    rewardEvents?.find((event) => event.name === "add_post")?.coins
  );
  const openConfetti = useConfettiStore((state) => state.openConfetti);

  const [attachments, setAttachments] = useState([]);
  const navigate = useNavigate();
  const { mutateAsync: createEvent, isLoading } = useCreateEvent();
  const { data: members = [] } = useFamilyMembers();
  const { data: eventCategories = [] } = useEventCategories();
  const { mutateAsync: uploadAttachment, isLoading: isUploading } =
    useUploadAttachment();
  const { mutate: deleteAttachment, isLoading: isDeleting } =
    useDeleteAttachment();

  const createEventSchema = z.object({
    event_category_id: z.string().min(1, t("event_category_required")),
    name: z.string().min(1, t("name_required")).max(50, t("name_max_length")),
    venue: z.string().min(1, t("venue_required")),
    start_at: z
      .string()
      .min(1, t("start_date_required"))
      .refine((date) => new Date(date) > new Date(), t("start_date_future")),
    end_at: z
      .string()
      .optional()
      .refine(
        (date) => !date || new Date(date) > new Date(),
        t("end_date_future")
      ),
    details: z.string().max(200, t("details_max_length")).optional(),
    attachment_ids: z.array(z.number()).optional(),
    attendee_ids: z.array(z.number()).min(1, t("attendees_required")),
  });

  const form = useForm({
    resolver: zodResolver(createEventSchema),
    defaultValues: {
      event_category_id: "",
      name: "",
      venue: "",
      start_at: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      end_at: format(addHours(new Date(), 1), "yyyy-MM-dd'T'HH:mm"), // Default end time 1 hour after start
      details: "",
      attachment_ids: [],
      attendee_ids: [],
    },
  });

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);

    if (attachments.length + files.length > 3) {
      toast.error(t("max_attachments_error"));
      return;
    }

    const formData = new FormData();
    files.forEach((file) => {
      formData.append("files[]", file);
    });

    try {
      const response = await uploadAttachment(formData);
      const newAttachments = response.data.map((file) => ({
        id: file.id,
        name: file.name,
        url: file.url,
      }));

      setAttachments((prev) => [...prev, ...newAttachments]);
      form.setValue("attachment_ids", [
        ...form.getValues("attachment_ids"),
        ...newAttachments.map((att) => att.id),
      ]);
    } catch (error) {
      toast.error(t("file_upload_error"));
    }
  };

  const removeAttachment = (attachmentId) => {
    if (!attachmentId) return;

    deleteAttachment(attachmentId, {
      onSuccess: () => {
        setAttachments((prev) => prev.filter((att) => att.id !== attachmentId));
        form.setValue(
          "attachment_ids",
          form.getValues("attachment_ids").filter((id) => id !== attachmentId)
        );
      },
      onError: () => {
        toast.error("Failed to delete file");
      },
    });
  };

  const onSubmit = async (data) => {
    try {
      await createEvent({
        ...data,
        event_category_id: parseInt(data.event_category_id),
        start_at: format(new Date(data.start_at), "yyyy-MM-dd HH:mm:ss"),
        end_at: data.end_at
          ? format(new Date(data.end_at), "yyyy-MM-dd HH:mm:ss")
          : undefined,
      });
      openConfetti(100);
      navigate("/events");
    } catch (error) {
      toast.error("Failed to create event");
    }
  };

  return (
    <AsyncComponent>
      <Card className="bg-background rounded-2xl h-full overflow-y-scroll no_scrollbar">
        <div className="w-full h-[131px] md:h-[160px] lg:h-[235px] mb-5 relative">
          <img
            src="/illustrations/illustration_12.png"
            className="object-cover w-full h-full rounded-lg"
            alt={t("events_banner_image")}
          />
        </div>
        <div className="flex items-center gap-4 mb-6 px-4">
          <NavLink
            to="/events"
            className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
          >
            <span className="h-8 w-8 rounded-full hover:bg-sky-100 flex items-center justify-center">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
            </span>
            {t("back_to_events")}
          </NavLink>
        </div>
        <div className="rounded-lg bg-brandSecondary m-4 p-4">
          <div className="overflow-y-scroll no_scrollbar">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <div>
                  <div className="text-2xl font-medium">
                    {t("create_new_event")}
                  </div>
                  <div className="flex items-center py-2 text-primary max-w-56 rounded-lg text-sm font-semibold mb-4">
                    {t("you_will_earn")} {coinEarnable} {t("kincoins")}&nbsp;
                    <img
                      src="/kincoinsImg/kintree_coin.svg"
                      className="w-[18px] h-[18px]"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="event_category_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <SelectTrigger className="w-full h-10 md:h-12 rounded-full bg-background">
                                <SelectValue
                                  placeholder={t("select_event_category")}
                                />
                              </SelectTrigger>
                              <SelectContent className="max-h-[150px] overflow-y-auto no_scrollbar rounded-2xl">
                                <SelectGroup>
                                  <SelectLabel>
                                    {t("event_category")}
                                  </SelectLabel>
                                  {eventCategories?.map((category) => (
                                    <SelectItem
                                      key={category.id}
                                      value={category.id.toString()}
                                    >
                                      {capitalizeName(category.name)}
                                    </SelectItem>
                                  ))}
                                </SelectGroup>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder={t("event_name")}
                              className="h-10 md:h-12 rounded-full bg-background"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="venue"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <LocationSearchInput
                              {...field}
                              placeholder={t("search_venue")}
                              className="h-10 md:h-12 rounded-full bg-background"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="attendee_ids"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <CustomMultiSelect
                              options={members
                                ?.filter((member) => member.is_active)
                                ?.map((member) => ({
                                  value: member.id,
                                  label: member.first_name,
                                  icon: () => (
                                    <img
                                      src={member.profile_pic_url}
                                      alt={member.first_name}
                                      className="w-4 h-4 rounded-full"
                                    />
                                  ),
                                }))}
                              value={field.value}
                              onChange={field.onChange}
                              placeholder={t("select_attendees")}
                              item_name="attendees"
                              className="h-10 md:h-12 bg-background rounded-full"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="start_at"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <CustomDateTimePicker
                              {...field}
                              value={
                                field.value ? new Date(field.value) : new Date()
                              }
                              onChange={(date) => {
                                field.onChange(
                                  format(date, "yyyy-MM-dd'T'HH:mm")
                                );
                              }}
                              minDate={new Date()}
                              className="h-10 md:h-12 rounded-full"
                              placeholder={t("select_start_date")}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="end_at"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <CustomDateTimePicker
                              {...field}
                              value={
                                field.value ? new Date(field.value) : undefined
                              }
                              onChange={(date) => {
                                const startDate = new Date(
                                  form.getValues("start_at")
                                );
                                if (date && date <= startDate) {
                                  form.setError("end_at", {
                                    type: "manual",
                                    message:
                                      "End date & time must be after start date & time",
                                  });
                                } else {
                                  form.clearErrors("end_at");
                                  field.onChange(
                                    date
                                      ? format(date, "yyyy-MM-dd'T'HH:mm")
                                      : ""
                                  );
                                }
                              }}
                              minDate={
                                form.watch("start_at")
                                  ? new Date(form.watch("start_at"))
                                  : new Date()
                              }
                              className="h-10 md:h-12 rounded-full"
                              placeholder={t("select_end_date")}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="details"
                    render={({ field }) => (
                      <FormItem className="mt-4">
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder={t("event_details")}
                            className="rounded-2xl bg-background"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="mt-4">
                    <div className="flex items-center gap-2">
                      <Input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleFileUpload}
                        disabled={attachments.length >= 3 || isUploading}
                        className="hidden"
                        id="file-upload"
                      />
                      <label
                        htmlFor="file-upload"
                        className="cursor-pointer flex items-center gap-2 p-2 border rounded-full bg-background"
                      >
                        <Upload className="w-4 h-4" />
                        {isUploading ? t("uploading") : t("upload_attachments")}
                      </label>
                      <span className="text-sm text-gray-500">
                        ({attachments.length}/3)
                      </span>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-2">
                      {attachments.map((att) => (
                        <div
                          key={att.id}
                          className="flex items-center gap-2 bg-gray-100 p-2 rounded-full"
                        >
                          <span className="text-sm">{att.name}</span>
                          <button
                            type="button"
                            onClick={() => removeAttachment(att.id)}
                            className="text-red-500"
                            disabled={isDeleting}
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {form.watch("venue") && (
                  <div className="mt-4">
                    <Map
                      place={form.watch("venue")}
                      className="w-full rounded-lg shadow-md"
                    />
                  </div>
                )}

                <div className="flex justify-end items-center gap-4">
                  <Button
                    type="button"
                    onClick={() => {
                      form.reset();
                      setAttachments([]);
                      navigate("/events");
                    }}
                    className="rounded-full h-10 md:h-12 px-4 md:px-6"
                    variant="outline"
                  >
                    {t("cancel")}
                  </Button>
                  <Button
                    type="submit"
                    disabled={isLoading || isUploading}
                    className="text-white rounded-full h-10 md:h-12 px-4 md:px-6"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t("creating")}
                      </>
                    ) : (
                      t("create_event")
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </div>
      </Card>
    </AsyncComponent>
  );
}
