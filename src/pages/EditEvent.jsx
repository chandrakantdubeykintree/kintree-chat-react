import AsyncComponent from "@/components/async-component";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { Loader2, Upload, X } from "lucide-react";
import { useEvent, useEditEvent } from "@/hooks/useEvents";
import {
  useDeleteAttachment,
  useUploadAttachment,
} from "@/hooks/useAttachments";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useFamilyMembers } from "@/hooks/useFamily";
import { useEventCategories } from "@/hooks/useMasters";
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
import { format, addHours } from "date-fns";
import { useNavigate, useParams } from "react-router";
import { Map } from "@/components/map";
import { LocationSearchInput } from "@/components/location-search-input";
import CustomMultiSelect from "@/components/custom-ui/custom-multi-select";
import { Card } from "@/components/ui/card";
import CustomDateTimePicker from "@/components/custom-ui/custom-date-time-picker";
import ComponentLoading from "@/components/component-loading";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { decryptId } from "@/utils/encryption";

export default function EditEvent() {
  const { t } = useTranslation();
  const { eventId: encryptedId } = useParams();
  const eventId = decryptId(encryptedId);
  const navigate = useNavigate();
  const { data: event, isLoading: isLoadingEvent } = useEvent(eventId);
  const { mutateAsync: editEvent, isLoading } = useEditEvent();
  const { data: members = [] } = useFamilyMembers();
  const { data: eventCategories = [] } = useEventCategories();
  const { mutateAsync: uploadAttachment, isLoading: isUploading } =
    useUploadAttachment();
  const { mutate: deleteAttachment, isLoading: isDeleting } =
    useDeleteAttachment();
  const [attachments, setAttachments] = useState([]);
  const editEventSchema = z.object({
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
    resolver: zodResolver(editEventSchema),
    defaultValues: {
      event_category_id: "",
      name: "",
      venue: "",
      start_at: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      end_at: format(addHours(new Date(), 1), "yyyy-MM-dd'T'HH:mm"),
      details: "",
      attachment_ids: [],
      attendee_ids: [],
    },
  });

  useEffect(() => {
    if (event) {
      form.reset({
        event_category_id: event.category?.id?.toString() || "",
        name: event.name || "",
        venue: event.venue || "",
        start_at: format(new Date(event.start_at), "yyyy-MM-dd'T'HH:mm"),
        end_at: event.end_at
          ? format(new Date(event.end_at), "yyyy-MM-dd'T'HH:mm")
          : "",
        details: event.details || "",
        attachment_ids: event.attachments?.map((att) => att.id) || [],
        attendee_ids: event.attendees?.map((att) => att.id) || [],
      });
      setAttachments(event.attachments || []);
    }
  }, [event, form]);

  const onSubmit = async (data) => {
    try {
      const formattedData = {
        ...data,
        event_category_id: parseInt(data.event_category_id),
        start_at: format(new Date(data.start_at), "yyyy-MM-dd HH:mm:ss"),
        end_at: data.end_at
          ? format(new Date(data.end_at), "yyyy-MM-dd HH:mm:ss")
          : undefined,
      };

      await editEvent({ eventId, updatedEvent: formattedData });
      toast.success(t("event_update_success"));
      navigate(`/view-event/${eventId}`);
    } catch (error) {
      toast.error(t("event_update_failed"));
    }
  };

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
      const currentIds = form.getValues("attachment_ids") || [];
      form.setValue("attachment_ids", [
        ...currentIds,
        ...newAttachments.map((att) => att.id),
      ]);
    } catch (error) {
      toast.error(t("attachment_upload_failed"));
    }
  };

  const removeAttachment = (attachmentId) => {
    if (!attachmentId) return;

    deleteAttachment(attachmentId, {
      onSuccess: () => {
        setAttachments((prev) => prev.filter((att) => att.id !== attachmentId));
        const currentIds = form.getValues("attachment_ids") || [];
        form.setValue(
          "attachment_ids",
          currentIds.filter((id) => id !== attachmentId)
        );
      },
      onError: () => {
        toast.error(t("failed_to_delete_attachment"));
      },
    });
  };

  if (isLoadingEvent) return <ComponentLoading />;

  return (
    <AsyncComponent>
      <Card className="bg-background rounded-2xl h-full overflow-y-scroll no_scrollbar p-4">
        <div className="text-2xl font-medium mb-4">{t("edit_event")}</div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="event_category_id"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger className="h-12 rounded-full">
                          <SelectValue
                            placeholder={t("select_event_category")}
                          />
                        </SelectTrigger>
                        <SelectContent className="max-h-[150px] overflow-y-auto no_scrollbar rounded-2xl">
                          <SelectGroup>
                            <SelectLabel>{t("event_category")}</SelectLabel>
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
                        className="h-12 rounded-full"
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
                        className="h-12 rounded-full"
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
                        className="h-12 rounded-full"
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
                        value={field.value ? new Date(field.value) : undefined}
                        onChange={(date) => {
                          field.onChange(
                            date ? format(date, "yyyy-MM-dd'T'HH:mm") : ""
                          );
                        }}
                        minDate={new Date()}
                        className="h-12 rounded-full"
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
                        value={field.value ? new Date(field.value) : undefined}
                        onChange={(date) => {
                          field.onChange(
                            date ? format(date, "yyyy-MM-dd'T'HH:mm") : ""
                          );
                        }}
                        minDate={
                          form.watch("start_at")
                            ? new Date(form.watch("start_at"))
                            : new Date()
                        }
                        className="h-12 rounded-full"
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
                <FormItem>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder={t("event_details")}
                      className="rounded-2xl"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
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
                  className="cursor-pointer flex items-center gap-2 p-2 border rounded-full"
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

            {form.watch("venue") && (
              <div className="mt-4 mb-4">
                <Map
                  place={form.watch("venue")}
                  className="w-full h-[300px] rounded-lg shadow-md"
                />
              </div>
            )}

            <div className="flex justify-center max-w-[751px] w-[90%] mx-auto">
              {form.watch("venue") && (
                <div className="mt-4">
                  <Map
                    place={form.watch("venue")}
                    className="w-full rounded-lg shadow-2xl h-[100px]"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                onClick={() => navigate(`/view-event/${eventId}`)}
                className="rounded-full h-10 md:h-12"
                variant="outline"
              >
                {t("cancel")}
              </Button>
              <Button
                type="submit"
                disabled={isLoading || isUploading}
                className="rounded-full h-10 md:h-12"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("updating")}
                  </>
                ) : (
                  t("update_event")
                )}
              </Button>
            </div>
          </form>
        </Form>
      </Card>
    </AsyncComponent>
  );
}
