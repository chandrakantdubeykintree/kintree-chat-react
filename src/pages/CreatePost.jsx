import AsyncComponent from "@/components/async-component";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { route_foreroom } from "@/constants/routeEnpoints";
import { NavLink, useNavigate } from "react-router";
import { useRef, useState } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ImagePlus, Loader2, X } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import {
  useDeleteAttachment,
  useUploadAttachment,
} from "@/hooks/useAttachments";
import toast from "react-hot-toast";
import { useCreatePost } from "@/hooks/usePosts";
import FeelingsDropDown from "@/components/feelings-dropdown";
import PrivacyDropdown from "@/components/privacy-dropdown";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { useTranslation } from "react-i18next";

import { useKincoinRewardEvents } from "@/hooks/useMasters";
import { useConfettiStore } from "@/services/confettiStore";

const SUPPORTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];
const SUPPORTED_VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/webm"];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

const defaultPrivacy = {
  id: 1,
  title: "global",
  desc: "global_desc",
  icon: "/privacy/web.svg",
};

export default function CreatePost() {
  const [mediaFiles, setMediaFiles] = useState([]);
  const { t } = useTranslation();
  const { data: rewardEvents } = useKincoinRewardEvents();
  const coinEarnable = parseInt(
    rewardEvents?.find((event) => event.name === "add_post")?.coins
  );
  const openConfetti = useConfettiStore((state) => state.openConfetti);

  const [uploadedAttachments, setUploadedAttachments] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const postSchema = z.object({
    body: z
      .string()
      .min(5, "Caption must be at least 5 characters")
      .max(1000, "Caption cannot exceed 1000 characters")
      .optional(),
    feeling_id: z.number().nullable(),
    album_id: z.number().nullable(),
    privacy: z.object({
      id: z.number(),
      title: z.string(),
      desc: z.string(),
      icon: z.string(),
    }),
    attachment_ids: z.array(z.number()).optional(),
  });
  const form = useForm({
    resolver: zodResolver(postSchema),
    defaultValues: {
      body: "",
      feeling_id: null,
      album_id: null,
      privacy: defaultPrivacy,
      attachment_ids: [],
    },
  });

  const { mutate: createPost, isLoading: isCreatingPost } = useCreatePost();
  const { mutateAsync: uploadAttachment } = useUploadAttachment();
  const { mutate: deleteAttachment, isLoading: isDeleting } =
    useDeleteAttachment();

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    const validFiles = [];

    for (const file of files) {
      if (
        !SUPPORTED_IMAGE_TYPES.includes(file.type) &&
        !SUPPORTED_VIDEO_TYPES.includes(file.type)
      ) {
        toast.error(
          t("file_format_error", {
            fileName: file.name,
            formats: ".jpg, .png, .gif, .webp, .mp4, .mov, .webm",
          })
        );
        continue;
      }

      if (file.size > MAX_FILE_SIZE) {
        toast.error(t("file_size_error", { fileName: file.name }));
        continue;
      }

      if (mediaFiles.length + validFiles.length >= 10) {
        toast.error(t("max_files_error"));
        break;
      }

      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    setMediaFiles((prev) => [...prev, ...validFiles]);
    setIsUploading(true);

    try {
      const formData = new FormData();
      validFiles.forEach((file) => {
        formData.append("files[]", file);
      });

      const result = await uploadAttachment(formData);
      const newAttachments = result?.data || [];
      setUploadedAttachments((prev) => [...prev, ...newAttachments]);
      form.setValue(
        "attachment_ids",
        [...uploadedAttachments, ...newAttachments].map((att) => att.id)
      );
    } catch (error) {
      toast.error(t("upload_failed"));
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const removeFile = async (index) => {
    const attachmentToDelete = uploadedAttachments[index];

    if (!attachmentToDelete) return;

    deleteAttachment(attachmentToDelete.id, {
      onSuccess: () => {
        setMediaFiles((prev) => prev.filter((_, i) => i !== index));
        setUploadedAttachments((prev) => prev.filter((_, i) => i !== index));
        form.setValue(
          "attachment_ids",
          uploadedAttachments.filter((_, i) => i !== index).map((att) => att.id)
        );
      },
      onError: (error) => {
        toast.error(t("delete_failed"));
      },
    });
  };

  const onSubmit = (values) => {
    if (!values.body?.trim() && !uploadedAttachments.length) {
      toast.error(t("empty_post_error"));
      return;
    }

    if (uploadedAttachments.length > 10) {
      toast.error(t("max_files_error"));
      return;
    }

    values.privacy = values.privacy.id;

    createPost(values, {
      onSuccess: (data) => {
        openConfetti(100);
        navigate("/", {
          state: { newPost: true },
        });
      },
      onError: (error) => {
        toast.error(t("post_creation_failed"));
      },
    });
  };

  return (
    <AsyncComponent>
      <div className="w-full mx-auto lg:px-0 pb-6 rounded-2xl">
        <div className="flex items-center gap-4 mb-6">
          <NavLink
            to={route_foreroom}
            className="flex items-center gap-2 text-blue-500 hover:text-blue-600 transition-colors"
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
            {t("back_to_foreroom")}
          </NavLink>
        </div>
        <Card className="w-full">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardHeader className="flex flex-row flex-wrap justify-between items-center">
                <div className="text-xl font-bold">
                  {t("create_post")}
                  <div className="flex items-center py-2 text-primary max-w-56 rounded-lg text-sm font-semibold">
                    {t("you_will_earn")} {coinEarnable} {t("kincoins")}&nbsp;
                    <img
                      src="/kincoinsImg/kintree_coin.svg"
                      className="w-[18px] h-[18px]"
                    />
                  </div>
                </div>
                <FormField
                  control={form.control}
                  name="privacy"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <PrivacyDropdown
                          selectedPrivacy={field.value}
                          setSelectedPrivacy={(value) => field.onChange(value)}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="body"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex justify-between">
                        <Label>{t("caption")}</Label>
                        <span
                          className={`text-sm ${
                            field.value.length > 1000
                              ? "text-red-500"
                              : "text-gray-500"
                          }`}
                        >
                          {field.value.length}/1000 {t("characters")}
                        </span>
                      </div>
                      <FormControl>
                        <Textarea
                          placeholder={t("whats_on_your_mind")}
                          rows="6"
                          className="lg:text-[16px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-4">
                    {mediaFiles.map((file, index) => (
                      <div key={index} className="relative">
                        {file.type.startsWith("image/") ? (
                          <img
                            src={URL.createObjectURL(file)}
                            alt={`Preview ${index}`}
                            className="w-full h-32 object-cover rounded-lg"
                          />
                        ) : (
                          <video
                            src={URL.createObjectURL(file)}
                            className="w-full h-32 object-contain rounded-lg"
                            controls
                          />
                        )}
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-1 right-1 rounded-full"
                          onClick={() => removeFile(index)}
                          disabled={isDeleting || isUploading}
                        >
                          {isDeleting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <X className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    ))}

                    {mediaFiles.length < 10 && (
                      <Button
                        type="button"
                        variant="outline"
                        className="h-32 w-full"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                      >
                        {isUploading ? (
                          <Loader2 className="h-6 w-6 animate-spin" />
                        ) : (
                          <ImagePlus className="h-6 w-6" />
                        )}
                      </Button>
                    )}
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*,video/*"
                    multiple
                    className="hidden"
                    disabled={isUploading}
                  />
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-2">
                <div className="flex justify-between items-center w-full">
                  <FormField
                    control={form.control}
                    name="feeling_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <FeelingsDropDown
                            selectedFeeling={field.value}
                            setSelectedFeeling={(value) =>
                              field.onChange(value?.id || null)
                            }
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    className="rounded-full"
                    disabled={
                      isUploading ||
                      isCreatingPost ||
                      (!form.watch("body")?.trim() &&
                        !uploadedAttachments.length)
                    }
                  >
                    {isCreatingPost ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Creating Post...
                      </>
                    ) : (
                      t("create_post")
                    )}
                  </Button>
                </div>
              </CardFooter>
            </form>
          </Form>
        </Card>
      </div>
    </AsyncComponent>
  );
}
